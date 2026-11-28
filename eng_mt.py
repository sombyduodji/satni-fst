"""Konekäännetyt englannin käännökset (kokeellinen): sanoille, joilla sanakirjassa ei ole englantia.

Kolme reittiä englantiin, ja sana hyväksytään vain, jos vähintään kaksi reittiä antaa saman englannin sanan
(perusmuotoina; WordNetin synonyymit lasketaan samaksi):
  1. saame -> englanti: smi-mt (TartuNLP Smugri NLLB 1.3B, CC BY 4.0; pohjamalli NLLB-200 CC BY-NC 4.0)
  2. sanakirjan suomennos -> englanti: Helsinki-NLP opus-mt-fi-en (Apache-2.0), FinnWordNet 2.0 (CC BY 3.0,
     Princeton WordNet -lisenssi), Wiktionary (CC BY-SA 4.0, kaikki.org) ja Apertium apertium-fin-eng (GPL-3.0)
  3. sanakirjan norjannos -> englanti: Helsinki-NLP opus-mt-gmq-en (Apache-2.0) ja Wiktionary (CC BY-SA 4.0)
Kalibrointi 2026-11-21 (muistiinpanot/englanti-testi-2026-11-21.md): 4 595 sanaa, joilla englanti on, käsiteltiin kuin englanti
puuttuisi. Kolme reittiä samaa mieltä: noin 97 % oikein (otos), kaksi reittiä noin 85–90 %. Yksi reitti ei riitä.

EI KONEKÄÄNNÖSTEN KETJUJA (käyttäjä 2026-11-21): syötteinä vain ihmisen tekemät lähteet, eli satni.db:n meanings-taulu
(GiellaLT:n sanakirjat, Wiktionaryn suorat käännökset, käsin tehdyt korjaukset) ja sanakirjat (WordNet, Wiktionary,
Apertium). Konekäännösten tulokset (eng_mt, tuleva suomennosten vastine, Apertiumin norjannokset, pivot_fin, der_fin)
pysyvät omissa tauluissaan, eikä niitä koskaan kirjoiteta meanings-tauluun tai käytetä toisen konekäännöksen
syötteenä tai tarkistuksena. Kalibroinnin vertailukohta on aina sanakirjan oma käännös.

Tulos eng_mt.tsv (saame, sanaluokka, englanti, taso 3/2, reitit) on repossa; export_web_data.py vie sen tauluun eng_mt.
Sovellus näyttää ne vain Kokeelliset-asetuksella, merkittyinä konekäännöksiksi.

Käännösten välimuisti (~/.cache/satni-fst-build/engcal) tehdään kerran GPU:lla:
  python3 eng_mt.py --kaanna   (smi-mt ja Helsinki-mallit, ks. README:t; noin 30 min)
  python3 eng_mt.py            (pisteytys ja eng_mt.tsv, muutama minuutti)
Lähdetiedostot (Wiktionary, FinnWordNet, Apertium) ovat hakemistossa ~/Git/sami-data-candidates/english.
"""
import collections
import json
import os
import re
import sqlite3
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
OUT = os.path.join(SCRIPT_DIR, "eng_mt.tsv")
CACHE = os.path.expanduser("~/.cache/satni-fst-build/engcal")
SRC_DIR = os.path.expanduser("~/Git/sami-data-candidates/english")
OPUS_DIR = os.path.expanduser("~/.cache/opus-mt-en")
STOP = re.compile(r"^(to|a|an|the|be)\s+", re.I)


def items(lst):
    out = []
    for s in lst:
        s = re.sub(r"\([^)]*\)", "", s or "")
        for p in re.split(r"[,;]", s):
            p = p.strip(" .")
            if p and p not in out:
                out.append(p)
    return out


def words_without_english(db):
    words = {}
    for i, lem, pos, lang, tr in db.execute(
            "SELECT d.id, d.sme_lemma, d.pos, m.lang, m.translations FROM dictionary d JOIN meanings m ON m.word_id = d.id "
            "WHERE m.lang IN ('eng', 'fin', 'nob')"):
        w = words.setdefault(i, {"lemma": lem, "pos": pos, "eng": [], "fin": [], "nob": []})
        w[lang].append(tr or "")
    return [w for w in words.values() if not w["eng"]]


def translate_all(words):
    """Käännösvälimuisti: smi-mt (saame) GPU:lla, Helsinki-mallit (suomi, norja) suorittimella."""
    os.makedirs(CACHE, exist_ok=True)
    texts = {"sme": sorted({w["lemma"] for w in words}),
             "fin": sorted({x for w in words for x in items(w["fin"])}),
             "nob": sorted({x for w in words for x in items(w["nob"])})}
    with open(os.path.join(CACHE, "in_sme_all.txt"), "w") as f:
        f.write("\n".join(texts["sme"]) + "\n")
    subprocess.run(["smi-mt", "-s", "sme", "-t", "eng", "--json", "-f", os.path.join(CACHE, "in_sme_all.txt")],
                   stdout=open(os.path.join(CACHE, "smi_sme_all.json"), "w"), check=True)
    import torch  # noqa: E402  (smi-mt:n venv tai muu, jossa transformers)
    from transformers import MarianMTModel, MarianTokenizer
    out = {}
    for lang, model in (("fin", "opus-mt-fi-en"), ("nob", "opus-mt-gmq-en")):
        tok = MarianTokenizer.from_pretrained(os.path.join(OPUS_DIR, model))
        m = MarianMTModel.from_pretrained(os.path.join(OPUS_DIR, model)).eval()
        res = []
        for i in range(0, len(texts[lang]), 32):
            enc = tok(texts[lang][i:i + 32], return_tensors="pt", padding=True, truncation=True, max_length=64)
            with torch.no_grad():
                res += tok.batch_decode(m.generate(**enc, num_beams=4, max_new_tokens=32), skip_special_tokens=True)
        out[lang] = dict(zip(texts[lang], res))
    json.dump(out, open(os.path.join(CACHE, "opus_all.json"), "w"), ensure_ascii=False)


def load_mt():
    """Välimuistin käännökset: kalibroinnin ja koko ajon tiedostot yhdistettynä."""
    smi, opus = {}, {"fin": {}, "nob": {}}
    for name in ("mt_smi.json", "full_mt_smi.json"):
        p = os.path.join(CACHE, name)
        if os.path.exists(p):
            smi.update(json.load(open(p)).get("sme", {}))
    p = os.path.join(CACHE, "smi_sme_all.json")
    if os.path.exists(p):
        smi.update({r["src"]: r["out"] for r in json.load(open(p))} if p.endswith(".json") else {})
    for name in ("mt_opus.json", "full_mt_opus.json", "opus_all.json"):
        p = os.path.join(CACHE, name)
        if os.path.exists(p):
            for k, v in json.load(open(p)).items():
                opus.setdefault(k, {}).update(v)
    return smi, opus


def load_dicts():
    def heads(gloss):
        g = re.sub(r"\([^)]*\)", "", gloss)
        return [p.strip(" .:").lower() for p in re.split(r"[;,]", g) if p.strip(" .:") and len(p.split()) <= 3]

    def kaikki(fn):
        d = collections.defaultdict(set)
        for line in open(os.path.join(SRC_DIR, fn), encoding="utf-8"):
            e = json.loads(line)
            for s in e.get("senses", []) or []:
                if s.get("form_of") or "form-of" in (s.get("tags") or []):
                    continue
                for g in s.get("glosses", []) or []:
                    d[e.get("word", "").lower()].update(heads(g))
        return d

    def dix(fn):
        d = collections.defaultdict(set)
        cl = lambda x: re.sub(r"<[^>]+>", lambda m: " " if m.group(0).startswith("<b") else "", x).strip().lower()  # noqa: E731
        for l, r in re.findall(r"<l>(.*?)</l>\s*<r>(.*?)</r>", open(fn, encoding="utf-8").read()):
            if cl(l) and cl(r):
                d[cl(l)].add(cl(r))
        return d

    fiwn, syn, cased = collections.defaultdict(set), collections.defaultdict(set), {}
    for line in open(os.path.join(SRC_DIR, "fiwn/FinnWordNet-2.0/rels/fiwn-transls.tsv"), encoding="utf-8"):
        p = line.rstrip("\n").split("\t")
        if len(p) < 4:
            continue
        en = p[3]
        fiwn[p[1].lower()].add(en.lower())
        syn[en.lower()].add(p[2])
        # Iso alkukirjain, jos WordNetissä sana on vain isolla (Finnish, Lutheran, Christmas)
        if en[:1].isupper():
            cased.setdefault(en.lower(), en)
        else:
            cased[en.lower()] = None
    return {"fi_kaikki": kaikki("kaikki-Finnish.jsonl"), "nb_kaikki": kaikki("kaikki-NorwegianBokmal.jsonl"),
            "fi_wn": fiwn, "fi_apertium": dix(os.path.join(SRC_DIR, "apertium-fin-eng/apertium-fin-eng.fin-eng.dix")),
            "syn": syn, "cased": {k: v for k, v in cased.items() if v}}


def main():
    db = sqlite3.connect(DB_FILE)
    words = words_without_english(db)
    if "--kaanna" in sys.argv:
        translate_all(words)
    smi, opus = load_mt()
    D = load_dicts()
    SYN, CASED = D["syn"], D["cased"]

    def norm(s):
        s = re.sub(r"\([^)]*\)|\[[^\]]*\]", "", s).strip(" .!?:;\"'")
        return re.sub(r"\s+", " ", STOP.sub("", s)).strip()

    def variants(k):
        v = {k}
        if k not in SYN:
            for a, b in (("ies", "y"), ("es", ""), ("s", "")):
                if k.endswith(a) and k[:-len(a)] + b in SYN:
                    v.add(k[:-len(a)] + b)
                    break
        return v

    def cands(strings, model):
        """{avain (pienillä): kirjoitusasu}. Mallin tuottama asu säilyy (Utsjoki), sanakirjojen pienillä."""
        out = {}
        for s in strings:
            for p in re.split(r"[,;/]", s or ""):
                n = norm(p)
                if not n or len(n.split()) > 4:
                    continue
                for k in variants(n.lower()):
                    out.setdefault(k, n if model and k == n.lower() else k)
        return out

    def dlook(name, its):
        return cands([e for x in its for e in D[name].get(x.lower(), ())], False)

    routes = {
        "sme": lambda w: [cands([smi.get(w["lemma"], "")], True)],
        "fin": lambda w: [cands([opus["fin"].get(x, "") for x in items(w["fin"])], True),
                          dlook("fi_wn", items(w["fin"])), dlook("fi_kaikki", items(w["fin"])),
                          dlook("fi_apertium", items(w["fin"]))],
        "nob": lambda w: [cands([opus["nob"].get(x, "") for x in items(w["nob"])], True),
                          dlook("nb_kaikki", items(w["nob"]))],
    }
    rows, levels = [], collections.Counter()
    for w in words:
        support, nsrc, forms = collections.defaultdict(set), collections.Counter(), collections.defaultdict(list)
        for route, f in routes.items():
            for src in f(w):
                for k, form in src.items():
                    support[k].add(route)
                    nsrc[k] += 1
                    forms[k].append(form)
        good = [k for k in support if len(support[k]) >= 2]
        if not good:
            levels["ei"] += 1
            continue
        top = max(len(support[k]) for k in good)
        best = sorted((k for k in good if len(support[k]) == top), key=lambda k: (-nsrc[k], len(k)))[:3]
        name = w["lemma"][:1].isupper()

        def shown(k):
            if name:  # erisnimi: mallin isolla kirjoitettu asu tai iso alkukirjain
                big = [f for f in forms[k] if f[:1].isupper()]
                return big[0] if big else k[:1].upper() + k[1:]
            return CASED.get(k, k)
        level = 3 if top == 3 else 2
        levels[level] += 1
        rows.append((w["lemma"], w["pos"], ", ".join(shown(k) for k in best), level,
                     "+".join(sorted(support[best[0]]))))
    rows.sort()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("# Konekäännetyt englannin käännökset (kokeellinen), tehty eng_mt.py:llä. Sarakkeet: saame, sanaluokka, "
                "englanti, taso (3 = kolme reittiä samaa mieltä, 2 = kaksi), reitit\n")
        for r in rows:
            f.write("\t".join(map(str, r)) + "\n")
    print(f"eng_mt.tsv: {len(rows)} sanaa (taso 3: {levels[3]}, taso 2: {levels[2]}); ei hyväksytty {levels['ei']}")


if __name__ == "__main__":
    main()
