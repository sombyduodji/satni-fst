"""Englanninkieliset käännökset Wikisanakirjasta (Wiktionary) sanoille, joilla englantia ei muuten ole.

LÄHDE: englanninkielinen Wiktionary, lisenssi CC BY-SA 4.0 (myös GFDL), koneluettavana kaikki.org:sta
(wiktextract, Tatu Ylönen). Ks. CREDITS.md. Lähteet eivät kuulu tähän repoon: `python3 wiktionary_eng.py --hae`
lataa kaikki.org:n tiedostot (noin 8 Gt) välimuistiin ja poimii niistä tarvittavan hakemistoon wiktionary/.

Käytetään vain luotettavat reitit (tarkistukset 2026-11-06):
  1. Wiktionaryn pohjoissaamen sanat englanninkielisine selityksineen (suora, ihmisen kirjoittama).
  2. Englannin sanat, joiden käännöstaulukossa on pohjoissaamen sana (suora, ihmisen kirjoittama).
  -> import_full_dict.py lisää nämä tavallisiksi englannin käännöksiksi (fill_english).
  5. Sanan ensimmäisen suomennoksen ja ensimmäisen norjannoksen Wiktionary-selitykset ovat samat (agree_rows).
  -> export_web_data.py: taulu wikt_eng, sanakortissa tarkistamattomana; ei vaikuta hakuun.
Pelkkä suomen tai norjan kautta tuleva selitys jätetään pois: monimerkityksiset verbit menevät usein väärin
(galgat -> pitää -> "to hold"). Selitykset kuten "synonym of henkilö" ja taivutusmuotojen selitykset ohitetaan.
"""
import collections
import gzip
import json
import os
import re
import sys
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "wiktionary")
CACHE = os.path.join(os.environ.get("XDG_CACHE_HOME", os.path.expanduser("~/.cache")), "satni-fst-build", "kaikki")
SOURCES = {
    "se": "https://kaikki.org/dictionary/Northern%20Sami/kaikki.org-dictionary-NorthernSami.jsonl",
    "en": "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl",
    "fi": "https://kaikki.org/dictionary/Finnish/kaikki.org-dictionary-Finnish.jsonl",
    "nb": "https://kaikki.org/dictionary/Norwegian%20Bokm%C3%A5l/kaikki.org-dictionary-NorwegianBokm%C3%A5l.jsonl",
}
POS = {"noun": "N", "verb": "V", "adj": "A", "adv": "Adv", "name": "N", "pron": "Pron", "num": "Num",
       "postp": "Po", "prep": "Pr", "conj": "CC", "intj": "Interj"}
NOT_TRANSLATION = re.compile(r"^(synonym|alternative|obsolete|archaic|dated|nonstandard|misspelling|abbreviation|"
                             r"initialism|form|plural|inflection) (of|form|spelling)\b|\bof\b.*\bform\b", re.I)
MAX_SENSES = 3
# Wiktionaryn tyylitunnisteet: loukkaava, halventava ja alatyylinen sana (vahvin ensin)
REGISTER_TAGS = {"offensive": "offensive", "slur": "offensive", "derogatory": "derogatory", "pejorative": "derogatory",
                 "vulgar": "vulgar"}
REGISTER_ORDER = ["offensive", "derogatory", "vulgar"]


def _register(tags):
    """Merkityksen tunnisteista vahvin tyylimerkintä (offensive, derogatory, vulgar) tai ""."""
    found = {REGISTER_TAGS[t] for t in tags or () if t in REGISTER_TAGS}
    return next((r for r in REGISTER_ORDER if r in found), "")


def _senses(j):
    return [s for s in j.get("senses", []) if not (s.get("form_of") or s.get("alt_of") or "form-of" in s.get("tags", []))]


def _entry_register(j):
    """Hakusanan tyylimerkintä, jos sen jokainen merkitys on loukkaava, halventava tai alatyylinen; muuten ""."""
    regs = [_register(s.get("tags")) for s in _senses(j)]
    return next((r for r in REGISTER_ORDER if r in regs), "") if regs and all(regs) else ""
MAX_LENGTH = 40


def clean_gloss(gloss):
    """Selitys käännökseksi: sulkeissa oleva tarkenne pois; liian pitkä tai muodon selitys hylätään (None)."""
    g = re.sub(r"\s*\([^)]*\)", "", gloss).strip(" .;:")
    return g if g and len(g) <= MAX_LENGTH and not NOT_TRANSLATION.search(g) else None


def _entries(path, code):
    for line in open(path, encoding="utf-8"):
        if f'"lang_code": "{code}"' not in line:
            continue
        j = json.loads(line)
        if j.get("lang_code") == code and POS.get(j.get("pos")):
            yield j


def _glosses(path, code):
    """{"sana|POS": [selitykset]} Wiktionaryn sanoista kielellä code, kolme ensimmäistä merkitystä."""
    out = collections.defaultdict(list)
    for j in _entries(path, code):
        for s in _senses(j)[:MAX_SENSES]:
            for g in s.get("glosses", [])[:1]:
                g = clean_gloss(g)
                key = f"{j['word']}|{POS[j['pos']]}"
                # Loukkaavaksi tai alatyyliseksi merkitty merkitys näytetään merkinnän kanssa: "jerk (offensive)"
                if g and _register(s.get("tags")):
                    g = f"{g} ({_register(s.get('tags'))})"
                if g and g not in out[key]:
                    out[key].append(g)
    return dict(out)


def _english_to_sami(path):
    """[[englannin sana, POS, pohjoissaamen sana, tyylimerkintä]] englannin sanojen käännöstaulukoista. Merkintä
    (offensive, derogatory, vulgar) tulee taulukon merkityksestä, tai hakusanasta, jonka kaikki merkitykset ovat
    sellaisia (fag: "A homosexual man", offensive, vulgar); muuten ""."""
    out = []
    for line in open(path, encoding="utf-8"):
        if '"code": "se"' not in line:
            continue
        j = json.loads(line)
        if j.get("lang_code") != "en" or not POS.get(j.get("pos")):
            continue
        tables = [(t, _entry_register(j)) for t in j.get("translations", [])]
        tables += [(t, _register(s.get("tags")) or _entry_register(j)) for s in j.get("senses", []) for t in s.get("translations", [])]
        for tr, reg in tables:
            if tr.get("code") == "se" and tr.get("word"):
                for sme in re.split(r",\s*", tr["word"]):
                    if sme.strip():
                        out.append([j["word"], POS[j["pos"]], sme.strip(), reg])
    return sorted({tuple(x) for x in out})


def _registers(path, code):
    """{sana: tyylimerkintä} kielen code sanoille, joiden kaikki merkitykset kaikissa sanaluokissa ovat loukkaavia,
    halventavia tai alatyylisiä (vittu: vulgar); sanakortti näyttää merkinnän käännöksen vieressä."""
    seen = {}
    for j in _entries(path, code):
        reg = _entry_register(j)
        w = j["word"]
        if w in seen and not seen[w]:
            continue
        seen[w] = (next((r for r in REGISTER_ORDER if r in (reg, seen.get(w))), "") if reg else "")
    return {w: r for w, r in seen.items() if r}


def fetch_and_extract():
    """Lataa kaikki.org:n tiedostot välimuistiin (jos puuttuvat) ja poimii tarvittavan hakemistoon wiktionary/."""
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    paths = {}
    for code, url in SOURCES.items():
        paths[code] = os.path.join(CACHE, f"kaikki-{code}.jsonl")
        if not os.path.exists(paths[code]):
            print(f"Ladataan {url} ...")
            urllib.request.urlretrieve(url, paths[code] + ".osa")
            os.replace(paths[code] + ".osa", paths[code])
    extracted = {"se": _glosses(paths["se"], "se"), "fi": _glosses(paths["fi"], "fi"), "nb": _glosses(paths["nb"], "nb"),
                 "en_se": _english_to_sami(paths["en"]),
                 "register": {"sme": _registers(paths["se"], "se"), "fin": _registers(paths["fi"], "fi"),
                              "nob": _registers(paths["nb"], "nb"), "eng": _registers(paths["en"], "en")}}
    for name, data in extracted.items():
        with gzip.open(os.path.join(OUT_DIR, f"{name}.json.gz"), "wt", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"  wiktionary/{name}.json.gz: {len(data)} riviä")


def _load(name):
    path = os.path.join(OUT_DIR, f"{name}.json.gz")
    if not os.path.exists(path):
        return None
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return json.load(f)


# Lähdesanakirjojen merkinnät, joiden mukaan saamen sana on halventava tai alatyylinen
SAMI_REGISTER_MARK = re.compile(r"\b(vulg\.?|vulgaari\w*|alat\.|alatyyl\w*|halv\.|halventava\w*|pejor\w*|gudnenjeaidin|"
                                r"skjellsord|nedsettende|vulgær\w*|offensive|derogatory|insult)", re.I)


def sami_marked(data):
    """Onko saamen sanan jossakin merkityksessä merkintä halventavasta tai alatyylisestä käytöstä."""
    return any(SAMI_REGISTER_MARK.search(" ".join(m.get(k) and " ".join(m[k]) or "" for k in ("translations", "explanations",
               "restrictions", "labels"))) for m in data.get("meanings", []))


def fill_english(entries, by_lemma, find_entry):
    """Reitit 1 ja 2 sanoille, joilla ei ole englannin käännöstä: sanan oma Wiktionary-selitys ensin, sitten
    englannin sanat, joiden käännöksenä sana on. Uusia sanoja ei lisätä. Merkitykseen tunniste "Wiktionary"."""
    se, en_se = _load("se"), _load("en_se")
    if se is None or en_se is None:
        print("Wiktionaryn tiedostoja ei löydy (wiktionary/), ohitetaan (hae: python3 wiktionary_eng.py --hae).")
        return
    found = collections.defaultdict(list)
    for key, glosses in se.items():
        lemma, pos = key.rsplit("|", 1)
        found[(lemma, pos)] += glosses
    offensive = {}
    for row in en_se:
        eng, pos, sme = row[:3]
        reg = row[3] if len(row) > 3 else ""
        if reg:
            # Loukkaava englannin sana vain, jos saamen sanakin on merkitty halventavaksi tai alatyyliseksi, ja silloin
            # merkinnän kanssa; muuten neutraali saamen sana saisi herjasanan (homsa -> fag)
            offensive.setdefault((sme, pos), []).append(f"{eng} ({reg})")
        elif eng not in found[(sme, pos)]:
            found[(sme, pos)].append(eng)
    filled = 0
    for (lemma, pos), words in found.items():
        keys = by_lemma.get(lemma, [])
        key = find_entry(entries, by_lemma, lemma, pos, "") or (keys[0] if len(keys) == 1 else None)
        if key is None or entries[key]["translations"].get("eng"):
            continue
        data = entries[key]
        if sami_marked(data):
            words = words + [w for w in offensive.get((lemma, pos), []) if w not in words]
        # Selitys voi itse olla lista ("he, she, it"), joten kaksoiskappaleet poistetaan osista (son: he, she, it, they)
        words = list(dict.fromkeys(part.strip() for w in words for part in w.split(",") if part.strip()))
        data["translations"]["eng"] = words
        data["meanings"].append({"lang": "eng", "translations": words, "explanations": [],
                                 "restrictions": [], "labels": ["Wiktionary"], "geo": [], "examples": []})
        filled += 1
    print(f"  Wiktionary: englanti {filled} sanalle, jolta se puuttui")


def _first(value):
    items = [re.sub(r"\s*\([^)]*\)", "", x).strip() for x in re.split(r",\s*", value or "") if x.strip()]
    return items[0] if items else None


def _norm(text):
    return re.sub(r"^(to|a|an|the)\s+", "", text.strip().lower())


def agree_rows(src):
    """Reitti 5 export_web_data.py:n tauluun wikt_eng: [(word_id, englanti)] sanoille, joilla ei ole englantia ja
    joiden ensimmäisen suomennoksen ja ensimmäisen norjannoksen Wiktionary-selityksissä on sama englannin sana."""
    fi, nb = _load("fi"), _load("nb")
    if fi is None or nb is None:
        return []
    rows = []
    for wid, pos, fin, nob in src.execute(
            "SELECT id, pos, finnish_translation, nob_translation FROM dictionary "
            "WHERE coalesce(eng_translation, '') = '' AND finnish_translation <> '' AND nob_translation <> ''"):
        a = fi.get(f"{_first(fin)}|{pos}") or []
        b = nb.get(f"{_first(nob)}|{pos}") or []
        common = {_norm(x) for x in b}
        both = [x for x in a if _norm(x) in common]
        if both:
            rows.append((wid, ", ".join(dict.fromkeys(both))))
    return rows


# Tyylimerkinnät käyty käsin läpi 2026-11-06: pois sanat, jotka ovat neutraaleja tai joita sanakirjassa käytetään
# neutraalissa merkityksessä (sirká = sintti kalana, cokkadit = paneskella "panna toistuvasti"), ja osalle osuvampi merkintä
REGISTER_EXCLUDE = {("fin", "offensiivinen"), ("fin", "käskyläinen"), ("fin", "pikkumainen"), ("fin", "ryysy"),
                    ("fin", "sintti"), ("fin", "viihdekirjallisuus"), ("fin", "paneskella"), ("nob", "narkoman")}
REGISTER_OVERRIDE = {("eng", "arse"): "vulgar", ("eng", "tit"): "vulgar", ("eng", "fuck"): "vulgar",
                     ("fin", "hihhuli"): "derogatory", ("fin", "venakko"): "offensive"}


def register_rows(src):
    """Taulu register (lang, term, tag): sovelluksen käännössanat, jotka Wiktionary merkitsee kaikissa merkityksissään
    loukkaaviksi (offensive), halventaviksi (derogatory) tai alatyylisiksi (vulgar). Sanakortti näyttää merkinnän."""
    reg = _load("register")
    if reg is None:
        return []
    cols = {"fin": "finnish_translation", "nob": "nob_translation", "eng": "eng_translation"}
    split = lambda v: [re.sub(r"\s*\([^)]*\)", "", x).strip() for x in re.split(r",\s*(?![^()]*\))", v or "") if x.strip()]
    rows = {}
    for lang, col in cols.items():
        texts = [v for (v,) in src.execute(f"SELECT {col} FROM dictionary WHERE coalesce({col}, '') <> ''")]
        texts += [v for (v,) in src.execute("SELECT translations FROM meanings WHERE lang = ? AND coalesce(translations, '') <> ''", (lang,))]
        for v in texts:
            for term in split(v):
                if term in reg.get(lang, {}) and (lang, term) not in REGISTER_EXCLUDE:
                    rows[(lang, term)] = REGISTER_OVERRIDE.get((lang, term), reg[lang][term])
    return sorted((lang, term, tag) for (lang, term), tag in rows.items())


if __name__ == "__main__":
    if "--hae" in sys.argv:
        fetch_and_extract()
    else:
        print(__doc__)
