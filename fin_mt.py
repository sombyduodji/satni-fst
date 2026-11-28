"""Konekäännetyt suomennosehdotukset (kokeellinen, Suomennosehdotukset-asetus): sanoille, joilla ei ole suomennosta.

Reitit suomeen (vain toisistaan riippumattomat, käyttäjä 2026-11-21):
  sme  saamen sana -> suomi: smi-mt (TartuNLP Smugri NLLB 1.3B, CC BY 4.0; pohjamalli NLLB-200 CC BY-NC 4.0)
  nob  sanakirjan norjannos -> suomi: Helsinki-NLP opus-mt-no-fi (Apache-2.0), Wiktionaryn norja–suomi-parit
       (CC BY-SA 4.0), GiellaLT dict-nob-fin ja dict-fin-nob (CC BY 4.0) sekä sanakirjan muiden sanojen suomennos
       samalle norjan sanalle (pivot_fin.py)
  smn  inarinsaamen kautta GiellaLT:n sanakirjoilla (pivot_fin.py)
  sma  sanakirjan eteläsaamen käännös -> suomi: GiellaLT dict-sma-fin (CC BY 4.0)
  eng  sanakirjan englanti -> suomi: Helsinki-NLP opus-mt-en-fi (Apache-2.0) ja FinnWordNet (CC BY 3.0)
smi-mt:n omaa norja -> suomi -käännöstä ei käytetä: sama malli molemmilla reiteillä ei ole riippumaton tarkistus.

Hyväksytään, kun vähintään kaksi reittiä antaa saman suomen sanan ja Voikko vahvistaa sen perusmuodoksi oikeassa
sanaluokassa. Kahden reitin parit, jotka kalibroinnissa olivat heikkoja (alle 60 % oikein: englanti + norja,
englanti + saame, eteläsaame + norja, eteläsaame + saame, englanti + eteläsaame), eivät yksin riitä. Erisnimet ohitetaan.
Kalibrointi 2026-11-21 (muistiinpanot/englanti-testi-2026-11-21.md, kohta 4): 5 000 sanaa, joilla suomennos on, käsiteltiin
kuin se puuttuisi. Kolme tai useampi reitti: 85–98 % oikein; saame + norja 74 % (synonyymit mukaan 80 %).

EI KONEKÄÄNNÖSTEN KETJUJA (käyttäjä 2026-11-21): syötteinä vain satni.db:n meanings-taulu (ihmisen tekemät sanakirjat)
ja avoimet sanakirjat. Tämän ja muiden konekäännösten tulokset (fin_mt, eng_mt, pivot_fin, apertium) eivät ole
koskaan toisen konekäännöksen syöte tai tarkistus. Vertailukohta on aina sanakirjan oma suomennos.

Käännösten välimuisti ~/.cache/satni-fst-build/fincal (mt_sme_fin.json, mt_opus_fi.json) tehdään GPU:lla kerran.
Aja: python3 fin_mt.py  -> fin_mt.tsv (repossa; export_web_data.py vie sen tauluun fin_mt)
"""
import collections
import glob
import json
import os
import re
import sqlite3
import xml.etree.ElementTree as ET

import pivot_fin

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SCRIPT_DIR, "fin_mt.tsv")
CACHE = os.path.expanduser("~/.cache/satni-fst-build/fincal")
SRC = os.path.expanduser("~/Git/sami-data-candidates")
WEAK_PAIRS = {frozenset(p) for p in (("eng", "nob"), ("eng", "sme"), ("nob", "sma"), ("sma", "sme"), ("eng", "sma"))}
VOIKKO_CLASS = {"N": {"nimisana", "nimisana_laatusana"}, "A": {"laatusana", "nimisana_laatusana"}, "V": {"teonsana"},
                "Adv": {"seikkasana"}}


def items(lst):
    out = []
    for s in lst:
        s = re.sub(r"\([^)]*\)", "", s or "")
        out += [p.strip(" .") for p in re.split(r"[,;]", s) if p.strip(" .")]
    return out


def dict_pairs(paths):
    """GiellaLT-sanakirjan XML: hakusana -> käännökset (pienillä)."""
    d = collections.defaultdict(set)
    for path in paths:
        for e in ET.parse(path).getroot().iter("e"):
            lemma = e.find("lg/l")
            if lemma is None or not (lemma.text or "").strip():
                continue
            for t in e.iter("t"):
                if (t.text or "").strip():
                    d[lemma.text.strip().lower()].add(t.text.strip().lower())
    return d


def main():
    import libvoikko
    voikko = libvoikko.Voikko("fi")
    db = sqlite3.connect(os.path.join(SCRIPT_DIR, "satni.db"))
    words, sme_smn, smn_fin, nob_words = pivot_fin._load(db)
    by_lang = collections.defaultdict(lambda: collections.defaultdict(list))
    for i, lang, tr in db.execute("SELECT word_id, lang, translations FROM meanings WHERE lang IN ('eng', 'sma')"):
        by_lang[lang][i].append(tr or "")
    smi = json.load(open(os.path.join(CACHE, "mt_sme_fin.json")))
    opus = json.load(open(os.path.join(CACHE, "mt_opus_fi.json")))
    nbfi = json.load(open(os.path.expanduser("~/.cache/satni-fst-build/verify/nbfi.json")))
    gl = os.path.join(SRC, "giellalt")
    nob_fin = dict_pairs(glob.glob(os.path.join(gl, "dict-nob-fin/src/*.xml")))
    for fin, nobs in dict_pairs(glob.glob(os.path.join(gl, "dict-fin-nob/src/*.xml"))).items():
        for n in nobs:
            nob_fin[n].add(fin)
    sma_fin = dict_pairs(glob.glob(os.path.join(gl, "dict-sma-fin/src/*.xml")))
    en_fi = collections.defaultdict(set)
    for line in open(os.path.join(SRC, "english/fiwn/FinnWordNet-2.0/rels/fiwn-transls.tsv"), encoding="utf-8"):
        p = line.rstrip("\n").split("\t")
        if len(p) >= 4:
            en_fi[p[3].lower()].add(p[1].lower())

    def norm(s):
        s = re.sub(r"\([^)]*\)|\[[^\]]*\]", "", s or "").strip(" .!?:;\"'").lower()
        return re.sub(r"\s+", " ", s)

    def cset(strings):
        return {n for s in strings for p in re.split(r"[,;/]", s or "") for n in [norm(p)] if n and len(n.split()) <= 3}

    ok_cache = {}

    def finnish(c, pos, one_word):
        """Hyväksytty kirjoitusasu tai None: Voikon perusmuoto oikeassa sanaluokassa; kahden sanan ehdokas yhdyssanaksi,
        jos saamen sana on yksi sana (alkuperäiskansa alue -> alkuperäiskansa-alue)."""
        key = (c, pos, one_word)
        if key not in ok_cache:
            cands = [c]
            parts = c.split()
            # Vain, jos alkuosa on perusmuodossa (alkuperäiskansa alue -> alkuperäiskansa-alue); genetiivi jää
            # erilleen (työmarkkinoiden kehitys, ei työmarkkinoidenkehitys)
            if one_word and len(parts) == 2 and any(a.get("SIJAMUOTO") == "nimento" and a.get("NUMBER") == "singular"
                                                    for a in voikko.analyze(parts[0])):
                cands = [parts[0] + parts[1], parts[0] + "-" + parts[1], c]
            res = None
            for x in cands:
                if " " in x:
                    if all(voikko.spell(p) for p in x.split()):
                        res = x
                    break
                an = voikko.analyze(x)
                if any(a.get("BASEFORM", "").lower() == x and (pos not in VOIKKO_CLASS or a.get("CLASS") in VOIKKO_CLASS[pos])
                       for a in an):
                    res = x
                    break
            ok_cache[key] = res
        return ok_cache[key]

    rows, stats = [], collections.Counter()
    for w in words:
        if w["fin"] or w["lemma"][:1].isupper():
            continue
        nob = items(w["nob"])
        routes = {
            "sme": cset([smi.get(w["lemma"], "")]),
            "nob": cset(pivot_fin._via_norwegian(w, nob_words)) | cset([opus["nob"].get(x, "") for x in nob])
                   | cset([f for x in nob for f in nbfi.get(x.lower(), [])]) | cset([f for x in nob for f in nob_fin.get(x.lower(), [])]),
            "smn": cset(pivot_fin._via_inari(w, sme_smn, smn_fin)),
            "sma": cset([f for x in items(by_lang["sma"].get(w["id"], [])) for f in sma_fin.get(x.lower(), [])]),
            "eng": cset([opus["eng"].get(x, "") for x in items(by_lang["eng"].get(w["id"], []))])
                   | cset([f for x in items(by_lang["eng"].get(w["id"], [])) for f in en_fi.get(x.lower(), [])]),
        }
        support = collections.defaultdict(set)
        for route, cands in routes.items():
            for c in cands:
                support[c].add(route)
        one_word = " " not in w["lemma"]
        good = {}
        for c, rs in support.items():
            if len(rs) < 2 or (len(rs) == 2 and frozenset(rs) in WEAK_PAIRS) or rs == {"eng", "nob", "sma"}:
                continue
            f = finnish(c, w["pos"], one_word)
            if f:
                good.setdefault(f, rs)
        if not good:
            continue
        top = max(len(rs) for rs in good.values())
        best = sorted((f for f, rs in good.items() if len(rs) == top), key=len)[:2]
        level = min(top, 3)
        stats[level] += 1
        rows.append((w["lemma"], w["pos"], ", ".join(best), level, "+".join(sorted(good[best[0]]))))
    rows.sort()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("# Konekäännetyt suomennosehdotukset (kokeellinen), tehty fin_mt.py:llä. Sarakkeet: saame, sanaluokka, "
                "suomi, taso (3 = kolme tai useampi reitti samaa mieltä, 2 = kaksi), reitit\n")
        for r in rows:
            f.write("\t".join(map(str, r)) + "\n")
    print(f"fin_mt.tsv: {len(rows)} sanaa (taso 3: {stats[3]}, taso 2: {stats[2]})")


if __name__ == "__main__":
    main()
