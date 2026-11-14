"""Minipeli: monivalintapelin sanat tiedostoon web/data/minipeli.json (web/minipeli.js).

Sanat ja tasot ovat tiedostossa minipeli_sanat.tsv (koottu ja tarkistettu 2026-11-11), käännökset sanakirjasta
(satni.db) tai sanastoista (web/data/sanastot.json). Erikoiskategoriat:
- järjestysluvut 1–100: GiellaLT lang-sme -analysaattorilla vahvistetut (sanastot.py:n apufunktiot),
- viikonpäivät, vuodenajat ja kuukaudet, värit ja kysymyssanat sanastoista,
- eläimet: samat 23 kuin Máhtte-pelissä (~/Git/mahtte, data/starter-words.js).

Aja: python3 minipeli.py   (sanastot.py ja export_web_data.py ensin, koska käännökset tulevat niistä)
"""
import json
import os
import re
import sqlite3

import sanastot as S

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SCRIPT_DIR, "web", "data", "minipeli.json")

ANIMALS = [("boazu", "poro", "rein"), ("beana", "koira", "hund"), ("njoammil", "jänis", "hare"), ("guovža", "karhu", "bjørn"),
           ("gumpe", "susi", "ulv"), ("geatki", "ahma", "jerv"), ("albbas", "ilves", "gaupe"), ("rieban", "kettu", "rev"),
           ("oarri", "orava", "ekorn"), ("cuoppu", "sammakko", "frosk"), ("sáhpán", "hiiri", "mus"),
           ("beaiveloddi", "perhonen", "sommerfugl"), ("gáhttu", "kissa", "katt"), ("sávza", "lammas", "sau"),
           ("gussa", "lehmä", "ku"), ("spiidni", "sika", "gris"), ("rievssat", "riekko", "rype"), ("goahppil", "koppelo", "røy"),
           ("gáranas", "korppi", "ravn"), ("njukča", "joutsen", "svane"), ("goaskin", "kotka", "ørn"),
           ("jievjaskuolfi", "tunturipöllö", "snøugle"), ("beahceloddi", "metso", "storfugl")]

# Norjan järjestysluvut 1–100 (bokmål)
NB_UNITS = ["", "første", "andre", "tredje", "fjerde", "femte", "sjette", "sjuende", "åttende", "niende"]
NB_TEENS = ["tiende", "ellevte", "tolvte", "trettende", "fjortende", "femtende", "sekstende", "syttende", "attende", "nittende"]
NB_TENS = ["", "", "tjue", "tretti", "førti", "femti", "seksti", "sytti", "åtti", "nitti"]
NB_TENS_ORD = ["", "", "tjuende", "trettiende", "førtiende", "femtiende", "sekstiende", "syttiende", "åttiende", "nittiende"]


def nb_ord(n):
    if n < 10:
        return NB_UNITS[n]
    if n < 20:
        return NB_TEENS[n - 10]
    if n < 100:
        return NB_TENS_ORD[n // 10] if n % 10 == 0 else NB_TENS[n // 10] + NB_UNITS[n % 10]
    return "hundrede"


def first(text, k=2):
    """Pilkkulistan k ensimmäistä (sulkeiden sisäiset pilkut eivät erota), sulkeet pois"""
    # "minä · minun · minulle" (pronominien sijamuodot) -> vain perusmuoto
    items = [re.sub(r"\s*\([^)]*\)", "", x).split(" · ")[0].strip() for x in re.split(r",\s*(?![^()]*\))", text or "")]
    items = [x for x in items if x][:k]
    if len(items) > 1 and len(items[0]) > 30:  # ensimmäinen on selitys, toinen tavallinen sana: vain toinen
        items = items[1:]
    # Toinen merkitys vain lyhyenä: pitkä selitys ("tavallisesti naaraspuolinen talvikko") sotkisi vaihtoehdot
    if len(items) > 1 and len(items[1]) > 22:
        items = items[:1]
    return ", ".join(items)


def ordinals():
    cands = {n: S.ord_candidates(n) for n in range(1, 101)}
    ana = S.look(S.ANA, sorted({c for v in cands.values() for c in v}))
    out = []
    for n in range(1, 101):
        o = next((x for x in cands[n] if any("+Ord" in a for a in ana.get(x, []))), None)
        if not o:
            print(f"HUOM: järjestysluku {n} ei vahvistunut: {cands[n]}")
            continue
        out.append([o, S.fi_ord(n), nb_ord(n), n])
    return out


# Kirjoitusasut, jotka kirjoituspeli hyväksyy täysin oikeiksi (sihkkar = sihkar, ihttin = ihtin): sanakirjan muu sana,
# jolla on sama sanaluokka ja täsmälleen sama korpusfrekvenssi (korpuslaskenta on yhdistänyt ne yhdeksi sanaksi) ja
# enintään kaksi kirjainta eroa. Lisäksi käsin tarkistetut parit.
EXTRA_VARIANTS = {"veahá": ["vehá"]}


def _lev(a, b):
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i]
        for j, y in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y)))
        prev = cur
    return prev[-1]


def variants(db, sme):
    r = db.execute("SELECT pos, freq FROM dictionary WHERE sme_lemma = ? AND freq > 0 ORDER BY freq DESC LIMIT 1", (sme,)).fetchone()
    found = []
    if r:
        found = sorted(x[0] for x in db.execute("SELECT DISTINCT sme_lemma FROM dictionary WHERE pos = ? AND freq = ? AND sme_lemma != ?",
                                                 (r[0], r[1], sme)) if _lev(x[0], sme) <= 2)
    return found + [x for x in EXTRA_VARIANTS.get(sme, []) if x not in found]


# --- Inarinsaame (smn_words.py: kahden lähteen tarkistus, sama kuin sanastoissa) ---
# Tarkistamattomat sanat: minipeli_smn_tarkistus.tsv. Järjestysluvut puuttuvat (inarinsaamen generaattoria ei ole).
SMN_REVIEW = os.path.join(SCRIPT_DIR, "minipeli_smn_tarkistus.tsv")
SMN_MIN_CAT = 6  # aiheesta tehdään peli vain, jos sanoja on vähintään näin monta


def inari(db, data):
    import smn_words
    picker = smn_words.InariPicker(db, SMN_REVIEW, "minipelisanat")
    if not picker.available:
        print("Inarinsaame: dict-smn-fin puuttuu (hae_sanakirjat.sh), ohitetaan")
        return None

    def conv(items, fi_i=1):
        out = []
        for it in items:
            smn, why, piv = picker.pick(it[0], it[fi_i], it[3] if len(it) > 3 and isinstance(it[3], str) else None, it[2])
            if smn:
                out.append([smn] + list(it[1:]))
        return out
    # Sama inarinsaamen sana kahdelle pohjoissaamen sanalle (áddjá, áhčči -> äijih?): vain kerran, aloittelijataso ensin
    words, seen = [], set()
    for w in sorted((w[:5] for w in conv(data["words"])), key=lambda w: w[4]):
        if w[0] not in seen:
            seen.add(w[0])
            words.append(w)
    cats = {}
    for k in ("time", "colours", "questions", "animals"):
        lst = conv(data["cats"][k])
        if len(lst) >= SMN_MIN_CAT:
            cats[k] = lst
    picker.save()
    lv = [w[4] for w in words]
    print(f"Inarinsaame: {len(words)} sanaa ({lv.count(1)} aloittelija), aiheet {', '.join(f'{k} {len(v)}' for k, v in cats.items())}; "
          + picker.summary())
    return {"words": words, "cats": cats}


# Tavutus pitkille sanoille (yli 11 merkkiä), jotta kapealla näytöllä sana katkeaa oikeasta kohdasta tavuviivalla
# (kolmas|kymmenes|ensimmäinen) eikä mielivaltaisesta kirjaimesta (kolmaskymmenesen|simmäinen). Tavutettu muoto
# erillisenä karttana (data["hy"], sana -> sana pehmein tavuviivoin U+00AD): vastausten tarkistus käyttää yhä
# alkuperäisiä sanoja (minipeli.js: peliHy vain näyttöön).
#   suomi: Voikko (yhdyssanan rajat STRUCTURE-kentästä, pitkien osien sisällä myös tavurajat)
#   pohjoissaame: GiellaLT:n LibreOffice-tavutuskuviot (lang-sme/tools/hyphenators/hyph_se.dic, Liangin algoritmi)
#   norja ja inarinsaame: ei tavutusta (lyhyitä tai ei kuvioita)
HYPH_MIN_LEN = 12
SHY = "\u00ad"
SME_PATTERNS = os.path.join(SCRIPT_DIR, "lang-sme", "tools", "hyphenators", "hyph_se.dic")


def _load_liang(path):
    patterns = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line == "UTF-8" or line.split()[0].isupper():
                continue
            letters = re.sub(r"\d", "", line)
            points = [0] * (len(letters) + 1)
            i = 0
            for ch in line:
                if ch.isdigit():
                    points[i] = int(ch)
                else:
                    i += 1
            patterns[letters] = points
    return patterns


def _liang_points(word, patterns, left=2, right=2):
    w = "." + word.lower() + "."
    points = [0] * (len(w) + 1)
    for i in range(len(w)):
        for j in range(i + 1, len(w) + 1):
            pat = patterns.get(w[i:j])
            if pat:
                for k, v in enumerate(pat):
                    points[i + k] = max(points[i + k], v)
    # points[i + 1] = katkokohta ennen word[i]
    return [i for i in range(left, len(word) - right + 1) if points[i + 1] % 2 == 1]


def _insert(word, cuts):
    out, prev = [], 0
    for c in sorted(set(cuts)):
        out.append(word[prev:c]); prev = c
    out.append(word[prev:])
    return SHY.join(out)


def _fi_cuts(word, voikko):
    syl = []
    pos = 0
    for ch in voikko.hyphenate(word):
        if ch == "-":
            syl.append(pos)
        else:
            pos += 1
    analyses = voikko.analyze(word)
    structure = analyses[0].get("STRUCTURE", "") if analyses else ""
    parts, pos = [], 0
    for ch in structure:
        if ch == "=":
            if pos:
                parts.append(pos)
        else:
            pos += 1
    if not parts:
        return syl
    # Yhdyssanan rajat; pitkien osien (yli 12 merkkiä) sisällä myös tavurajat
    bounds = [0] + parts + [len(word)]
    cuts = list(parts)
    for a, b in zip(bounds, bounds[1:]):
        if b - a > 12:
            cuts += [c for c in syl if a + 2 <= c <= b - 2]
    return cuts


def hyphenation_map(data):
    import libvoikko
    voikko = libvoikko.Voikko("fi")
    sme = _load_liang(SME_PATTERNS) if os.path.exists(SME_PATTERNS) else None
    out = {}
    rows = list(data["words"]) + [r for lst in data["cats"].values() for r in lst]
    for r in rows:
        for idx, lang in ((0, "sme"), (1, "fin")):
            for tok in re.findall(r"[^\s,;/()]+", str(r[idx])):
                if len(tok) < HYPH_MIN_LEN or tok in out:
                    continue
                if lang == "fin":
                    cuts = _fi_cuts(tok, voikko)
                elif sme:
                    cuts = _liang_points(tok, sme)
                else:
                    cuts = []
                if cuts:
                    out[tok] = _insert(tok, cuts)
    return out


def main():
    lists = {l["id"]: l for l in json.load(open(os.path.join(SCRIPT_DIR, "web", "data", "sanastot.json"), encoding="utf-8"))["lists"]}
    sanasto = {}
    for l in lists.values():
        for r in l["rows"]:
            for x in r.get("sme", [])[:1]:
                sanasto.setdefault(x["w"][0], (first(", ".join(x for x in (r.get("fi") or []) if x), 1), first(", ".join(x for x in (r.get("nb") or []) if x), 1), l["id"]))
    db = sqlite3.connect(os.path.join(SCRIPT_DIR, "satni.db"))
    words, missing = [], []
    for line in open(os.path.join(SCRIPT_DIR, "minipeli_sanat.tsv"), encoding="utf-8"):
        if line.startswith("#") or not line.strip():
            continue
        cols = line.rstrip("\n").split("\t")
        sme, lvl = cols[0], cols[1]
        fi_own, nb_own = (cols + ["", ""])[2:4]  # pelin oma käännös, kun sanakirjan kaksi ensimmäistä johtavat harhaan
        if sme in sanasto:
            # Sanastojen sanoille väärät vaihtoehdot samasta listasta (kuukaudet keskenään): ryhmä "s:<lista>"
            fi, nb, lid = sanasto[sme]
            pos = "s:" + lid
        else:
            row = db.execute("""SELECT pos, finnish_translation, nob_translation FROM dictionary WHERE sme_lemma = ?
                               AND pos IN ('N','V','A','Adv') ORDER BY freq DESC LIMIT 1""", (sme,)).fetchone()
            if not row:
                missing.append(sme)
                continue
            pos, fi, nb = row[0], first(row[1]), first(row[2])
        fi, nb = fi_own or fi, nb_own or nb
        if fi and nb:
            w = [sme, fi, nb, pos, int(lvl)]
            v = variants(db, sme)
            if v:
                w.append(v)
            words.append(w)
    time = []
    for lid, sub in (("viikonpaivat", "day"), ("vuodenajat", "season"), ("kuukaudet", "month")):
        for r in lists[lid]["rows"]:
            time.append([r["sme"][0]["w"][0], first(r["fi"][0], 1), first(r["nb"][0], 1), sub])
    colours = [[r["sme"][0]["w"][0], r["fi"][0], r["nb"][0]] for r in lists["varit"]["rows"]]
    # galles = "hva tid", goas = "når": norjassa eri vastaukset (ei tarkennetta sulkeissa)
    questions = [[r["sme"][0]["w"][0], r["fi"][0], r["nb"][0]] for r in lists["kysymykset"]["rows"]]
    data = {"words": words, "cats": {"ordinals": ordinals(), "time": time, "colours": colours, "questions": questions,
                                     "animals": [list(a) for a in ANIMALS]}}
    # Inarinsaame (asetuksista valittava, kokeellinen): samat käsitteet, sana kahdesta lähteestä tarkistettuna
    data["smn"] = inari(db, data)
    data["hy"] = hyphenation_map(data)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    lv = [w[4] for w in words]
    print(f"{OUT}: {len(words)} sanaa ({lv.count(1)} aloittelija), järjestysluvut {len(data['cats']['ordinals'])}, "
          f"aika {len(time)}, värit {len(colours)}, kysymyssanat {len(questions)}, eläimet {len(ANIMALS)}, {os.path.getsize(OUT)} tavua")
    if missing:
        print("HUOM: ei sanakirjassa:", missing)


if __name__ == "__main__":
    main()
