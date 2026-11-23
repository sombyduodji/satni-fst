"""Suomennosehdotukset (kokeellinen) sanoille, joilla ei ole suomennosta: inarinsaamen tai norjan kautta.

Lähteet (eivät kuulu tähän repoon, ./hae_sanakirjat.sh): GiellaLT dict-smn-sme, dict-smn-fin ja dict-fin-smn
(CC BY 4.0) sekä satni.db:n omat käännökset. Suomen sanat tarkistetaan GiellaLT lang-fin -analysaattorilla
(giella-fin/, GPL-3.0).

  - Inarinsaamen kautta: pohjoissaamen sanan inarinsaamen käännös (dict-sme-smn tai käänteinen dict-smn-sme)
    ja sen suomennos (dict-smn-fin tai käänteinen dict-fin-smn), sama sanaluokka. Enintään kaksi ehdotusta.
  - Norjan kautta, vain jos inarin kautta ei löydy: suomennos, joka toisilla saman sanaluokan sanoilla on
    samalle norjan sanalle. Vain yleisin ehdotus, ja sen on tultava vähintään kahdesta sanasta, ellei se ole
    ainoa vaihtoehto.
  - Yksittäisen suomen sanan on oltava analysaattorin mukaan perusmuoto ja oikeaa sanaluokkaa (verbille
    tutustuminen ei kelpaa). Monisanaisista tarkistetaan, että jokainen sana on suomea.

Tarkistukset 2026-11-06 (evaluate() ja pistokokeet):
  - Sanoilla, joilla suomennos jo on, ensimmäinen ehdotus on sama kuin sanakirjan suomennos 69 %:lla inarin kautta
    ja 83 %:lla norjan kautta. Synonyymi lasketaan tässä virheeksi. Inarin luku voi olla yläkanttiin, koska inarin
    sanakirjat on osin tehty pohjoissaamen ja suomen sanakirjasta.
  - Samoilla 1 832 sanalla inari 68 % ja norja 58 %; kun molemmat antavat saman, 92 %.
  - Käsin satunnaisotoksista (suomennosta vailla olevat sanat): inarin kautta noin 22/25, norjan kautta noin 20/25
    oikein tai lähes oikein. Virheet ovat esim. čuohcit dovdduide -> ottaa kiinni.
Siksi ehdotukset merkitään sovelluksessa tarkistamattomiksi, eivätkä ne vaikuta hakuun.
"""
import collections
import glob
import os
import re
import xml.etree.ElementTree as ET

import fin_forms

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"
POS = {"N": "N", "V": "V", "A": "A", "ADV": "Adv"}
# Analysaattorin perusmuoto sanaluokittain (jäätyä+V+Act+InfA+Sg+Lat, talo+N+Sg+Nom)
BASE_FORM = {"N": ("+N+Sg+Nom", "+N+Pl+Nom", "+N+Prop+Sg+Nom", "+N+Prop+Pl+Nom"), "V": ("+V+Act+InfA+Sg+Lat",),
             "A": ("+A+Sg+Nom", "+A+Pl+Nom"), "Adv": ("+Adv", "+Pcle")}
MAX_INARI = 2


def _clean(text):
    return " ".join((text or "").split())


def _split(value):
    return [_clean(x) for x in re.split(r"[,;]", value or "") if _clean(x)]


def _entries(name, lang):
    """(hakusana, sanaluokka, [käännökset kielellä lang]) GiellaLT:n XML-sanakirjasta."""
    for path in sorted(glob.glob(os.path.join(SCRIPT_DIR, name, "src", "*.xml"))):
        if path.endswith("meta.xml"):
            continue
        try:
            root = ET.parse(path).getroot()
        except ET.ParseError:
            continue
        for e in root.iter("e"):
            head = e.find("lg/l")
            if head is None or not _clean(head.text):
                continue
            pos = POS.get((head.get("pos") or "").upper(), head.get("pos") or "")
            trans = [_clean(t.text) for tg in e.iter("tg") if (tg.get(XML_LANG) or lang) == lang
                     for t in tg.findall("t") if _clean(t.text) and t.get("t_type") not in ("expl", "grammar", "grammarexpl")]
            yield _clean(head.text), pos, trans


def _load(src):
    words = [dict(zip(("id", "lemma", "pos", "fin", "nob", "smn"), r)) for r in src.execute(
        "SELECT id, sme_lemma, pos, finnish_translation, nob_translation, smn_translation FROM dictionary "
        "WHERE pos IN ('N', 'V', 'A', 'Adv')")]
    by_lemma = collections.defaultdict(list)
    for w in words:
        w["fin"], w["nob"], w["smn"] = _split(w["fin"]), _split(w["nob"]), _split(w["smn"])
        by_lemma[w["lemma"]].append(w)
    sme_smn = collections.defaultdict(set)
    for w in words:
        sme_smn[w["id"]].update(w["smn"])
    for smn, pos, trans in _entries("dict-smn-sme", "sme"):
        for sme in trans:
            cands = by_lemma.get(sme, [])
            for w in [c for c in cands if c["pos"] == pos] or (cands if len(cands) == 1 else []):
                sme_smn[w["id"]].add(smn)
    smn_fin = collections.defaultdict(lambda: collections.defaultdict(set))
    for smn, pos, trans in _entries("dict-smn-fin", "fin"):
        for fin in trans:
            smn_fin[smn][pos].add(fin)
    for fin, pos, trans in _entries("dict-fin-smn", "smn"):
        for smn in trans:
            smn_fin[smn][pos].add(fin)
    nob_words = collections.defaultdict(list)
    for w in words:
        for nob in w["nob"]:
            nob_words[(nob.lower(), w["pos"])].append(w)
    return words, sme_smn, smn_fin, nob_words


def _via_inari(w, sme_smn, smn_fin):
    found = collections.Counter()
    for smn in sme_smn.get(w["id"], ()):
        by_pos = smn_fin.get(smn)
        if not by_pos:
            continue
        for fin in by_pos.get(w["pos"]) or (next(iter(by_pos.values())) if len(by_pos) == 1 else ()):
            found[fin] += 1
    return found


def _via_norwegian(w, nob_words):
    found = collections.Counter()
    for nob in w["nob"]:
        for other in nob_words[(nob.lower(), w["pos"])]:
            if other["id"] != w["id"]:
                for fin in other["fin"]:
                    found[fin] += 1
    return found


def _checker(candidates):
    """Palauttaa funktion: kelpaako suomennos sanaluokalle (lang-fin-analysaattori). Ilman analysaattoria
    kaikki kelpaavat."""
    if not os.path.exists(fin_forms.ANALYSER):
        return lambda text, pos: True
    single = {c for c in candidates if " " not in c and "(" not in c}
    words = {part.strip("()").lower() for c in candidates - single for part in c.split()} - {""}
    analyses = fin_forms.lookup(fin_forms.ANALYSER, sorted(single | words | {c.lower() for c in single}))

    def ok(text, pos):
        if text in single:
            found = analyses.get(text, []) + analyses.get(text.lower(), [])
            return any(a.endswith(end) for a in found for end in BASE_FORM[pos])
        parts = [p.strip("()").lower() for p in text.split() if p.strip("()")]
        return bool(parts) and all(analyses.get(p) for p in parts if p not in ("jk", "jkn", "jtak", "jklle", "jstak"))
    return ok


def suggestions(src, have_finnish=False):
    """[(word_id, suomennos, via)], via = "smn" tai "nob". have_finnish=True: sanat, joilla suomennos jo on
    (arviointia varten)."""
    words, sme_smn, smn_fin, nob_words = _load(src)
    targets = [w for w in words if bool(w["fin"]) == have_finnish]
    raw = {}
    for w in targets:
        inari = _via_inari(w, sme_smn, smn_fin)
        nob = _via_norwegian(w, nob_words) if not inari else collections.Counter()
        if inari or nob:
            raw[w["id"]] = (w, inari, nob)
    ok = _checker({f for _, a, b in raw.values() for f in list(a) + list(b)})
    rows = []
    for w, inari, nob in raw.values():
        if inari:
            # Tasapelissä aakkosjärjestys: ennen joukkojen satunnainen järjestys valitsi eri ehdotukset eri ajoilla
            # (44 sanaa vaihteli, yötesti/vienti 2026-11-23)
            kept = [f for f, _ in sorted(inari.items(), key=lambda kv: (-kv[1], kv[0])) if ok(f, w["pos"])][:MAX_INARI]
            rows += [(w["id"], f, "smn") for f in kept]
        else:
            ranked = sorted(nob.items(), key=lambda kv: (-kv[1], kv[0]))
            fin, count = ranked[0]
            if (count >= 2 or len(ranked) == 1) and (len(ranked) == 1 or count > ranked[1][1]) and ok(fin, w["pos"]):
                rows.append((w["id"], fin, "nob"))
    return rows


def rows(src):
    """Rivit export_web_data.py:n tauluun pivot_fin. Tyhjä, jos inarinsaamen sanakirjoja ei ole."""
    if not glob.glob(os.path.join(SCRIPT_DIR, "dict-smn-fin", "src", "*.xml")):
        return []
    found = suggestions(src)
    joined = collections.OrderedDict()
    for word_id, fin, via in found:
        joined.setdefault((word_id, via), []).append(fin)
    return [(word_id, ", ".join(fins), via) for (word_id, via), fins in joined.items()]


def evaluate(src):
    """Osumatarkkuus sanoilla, joilla suomennos jo on: osuuko ensimmäinen ehdotus sanakirjan suomennokseen."""
    gold = {w["id"]: {f.lower() for f in w["fin"]} for w in _load(src)[0] if w["fin"]}
    first = {}
    for word_id, fin, via in suggestions(src, have_finnish=True):
        first.setdefault((word_id, via), fin)
    for via in ("smn", "nob"):
        hits = [fin.lower() in gold[word_id] for (word_id, v), fin in first.items() if v == via]
        if hits:
            print(f"  {via}: {len(hits)} sanaa, ensimmäinen ehdotus oikein {100 * sum(hits) / len(hits):.0f} %")


if __name__ == "__main__":
    import sqlite3
    db = sqlite3.connect(os.path.join(SCRIPT_DIR, "satni.db"))
    print("Arviointi sanoilla, joilla suomennos jo on:")
    evaluate(db)
    result = rows(db)
    print(f"Ehdotuksia {len(result)} sanalle: " + ", ".join(
        f"{via} {sum(r[2] == via for r in result)}" for via in ("smn", "nob")))
