"""Konekäännetyt espanjan käännökset (kokeellinen): sanoille, joilla ei ole espanjaa Ángel Díaz de Radan ja Kjell Kemin
sanakirjassa (dict-sme-spa). Sanakirjaan ei kosketa; tulos on oma taulunsa spa_mt.

Kuusi lähderyhmää (käyttäjä 2026-11-21: vähintään kolme samaa mieltä):
  mtfi  sanan suomennos -> espanja: Helsinki-NLP opus-mt-fi-es (Apache-2.0)
  mtno  sanan norjannos -> espanja: Helsinki-NLP opus-mt-no-es (Apache-2.0)
  mten  sanan englanti -> espanja: Helsinki-NLP opus-mt-en-es (Apache-2.0)
  sme   saamen sana -> espanja: smi-mt (TartuNLP Smugri NLLB 1.3B, CC BY 4.0; pohjamalli NLLB-200 CC BY-NC 4.0)
  wikt  Wiktionary ja siitä tehty WikDict yhtenä lähteenä (CC BY-SA 4.0 / 3.0; eivät ole toisistaan riippumattomia)
  wn    espanjan wordnet MCR 3.0 (CC BY 3.0) FinnWordNetin (CC BY 3.0) ja Princeton WordNetin kautta
Espanjan sanaksi kelpaa vain MCR:n tai yleisten espanjan sanojen listan sana.
Kalibrointi 2026-11-21 (docs/englanti-testi-2026-11-21.md, kohta 6) sanakirjan 7 698 sanaa vasten: kolme lähdettä 74 %,
neljä 85 %, viisi tai kuusi 90–97 % sama tai synonyymi; käsin otoksessa uusista kolmen lähteen sanoista 15/15 oikein.

EI KONEKÄÄNNÖSTEN KETJUJA: syötteinä vain meanings-taulu (ihmisen tekemät sanakirjat) ja avoimet sanakirjat.
Välimuistit: ~/.cache/satni-fst-build/espanja/mt/all_results.json (mtfi, mtno, Wiktionary/WikDict, 2026-11-09),
~/.cache/satni-fst-build/escal/mt_sme_es.json ja mt_en_es.json. Aja: python3 spa_mt.py -> spa_mt.tsv
"""

import collections
import json
import random
import re
import sqlite3

import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB = sqlite3.connect(os.path.join(SCRIPT_DIR, "satni.db"))
OLD = json.load(open("/home/user/.cache/satni-fst-build/espanja/mt/all_results.json"))
C = "/home/user/.cache/satni-fst-build/escal/"
SME = json.load(open(C + "mt_sme_es.json"))
MTEN = json.load(open(C + "mt_en_es.json"))
E = "/home/user/Git/sami-data-candidates/"
ART = re.compile(r"^(el|la|los|las|un|una|lo|a)\s+")


def norm(s):
    s = re.sub(r"\([^)]*\)|\[[^\]]*\]", "", s or "").strip(" .!¡¿?:;\"'").lower()
    return re.sub(r"\s+", " ", ART.sub("", s)).strip()


def items(s):
    return [x for x in (norm(p) for p in re.split(r"[,;]", re.sub(r"\([^)]*\)", "", s or ""))) if x]


# Espanjan wordnet (MCR, CC BY 3.0) PWN 3.0 -tunnisteilla; FinnWordNet liittää suomen ja englannin samoihin
MCR, SYN = collections.defaultdict(set), collections.defaultdict(set)
for line in open(E + "spanish/mcr/wn-data-spa.tab", encoding="utf-8"):
    if line.startswith("#"):
        continue
    off, kind, lemma = line.rstrip("\n").split("\t")[:3]
    lemma = lemma.replace("_", " ").lower()
    MCR[off].add(lemma)
    SYN[lemma].add(off)
FI_WN, EN_WN = collections.defaultdict(set), collections.defaultdict(set)
for line in open(E + "english/fiwn/FinnWordNet-2.0/rels/fiwn-transls.tsv", encoding="utf-8"):
    p = line.rstrip("\n").split("\t")
    m = re.match(r"en-3\.0:([nvar])(\d{8})", p[2]) if len(p) >= 4 else None
    if not m:
        continue
    for pos in ([m.group(1)] + (["s"] if m.group(1) == "a" else [])):
        off = f"{m.group(2)}-{pos}"
        if off in MCR:
            FI_WN[p[1].lower()] |= MCR[off]
            EN_WN[p[3].lower()] |= MCR[off]
VOCAB = set(SYN) | {l.split()[0].lower() for l in open(E + "spanish/es_50k.txt", encoding="utf-8") if l.strip()}

words = {}
for i, lem, pos, lang, tr in DB.execute(
        "SELECT d.id, d.sme_lemma, d.pos, m.lang, m.translations FROM dictionary d JOIN meanings m ON m.word_id = d.id "
        "WHERE m.lang IN ('fin', 'nob', 'eng', 'spa')"):
    w = words.setdefault(i, {"lemma": lem, "pos": pos, "fin": [], "nob": [], "eng": [], "spa": []})
    w[lang] += items(tr)
old = {(r["l"], r["pos"] or ""): r for r in OLD.values()}


def known(c):
    return c and len(c.split()) <= 3 and (c in VOCAB or all(x in VOCAB for x in c.split()))


def sources(w):
    r = old.get((w["lemma"], w["pos"] or ""), {})
    src = {
        "mtfi": set(r.get("mtfi", [])[:2]),
        "mtno": set(r.get("mtno", [])[:2]),
        "mten": {norm(MTEN.get(x, "")) for x in w["eng"]},
        "sme": {norm(x) for x in re.split(r"[,;]", SME.get(w["lemma"], ""))},
        # Wiktionary ja siitä tehty WikDict yhtenä lähteenä (eivät ole toisistaan riippumattomia)
        "wikt": set(r.get("dfi", [])[:3]) | set(r.get("dno", [])[:3]) | set(r.get("wikt", [])[:3]),
        "wn": {x for f in w["fin"] for x in FI_WN.get(f, ())} | {x for e in w["eng"] for x in EN_WN.get(e, ())},
    }
    return {k: {c for c in v if known(c)} for k, v in src.items()}


def best(w):
    support = collections.defaultdict(set)
    for s, cs in sources(w).items():
        for c in cs:
            support[c].add(s)
    good = [c for c in support if len(support[c]) >= 2]
    if not good:
        return None, set()
    top = max(len(support[c]) for c in good)
    cs = sorted((c for c in good if len(support[c]) == top), key=len)
    return cs[:3], support[cs[0]]


def judge(c, gold):
    if c in gold:
        return "exact"
    if any(SYN.get(c, set()) & SYN.get(g, set()) for g in gold):
        return "syn"
    if any(re.search(r"\b" + re.escape(c) + r"\b", g) for g in gold):
        return "part"
    return "wrong"


rows, levels = [], collections.Counter()
for w in words.values():
    if w["spa"] or w["lemma"][:1].isupper():
        continue
    cands, rs = best(w)
    if not cands or len(rs) < 3:
        continue
    levels[min(len(rs), 4)] += 1
    rows.append((w["lemma"], w["pos"], ", ".join(cands[:2]), min(len(rs), 4), "+".join(sorted(rs))))
rows = sorted(set(rows))
with open(os.path.join(SCRIPT_DIR, "spa_mt.tsv"), "w", encoding="utf-8") as f:
    f.write("# Konekäännetyt espanjan käännökset (kokeellinen), tehty spa_mt.py:llä. Sarakkeet: saame, sanaluokka, espanja, "
            "taso (3 = kolme lähdettä samaa mieltä, 4 = neljä tai useampi), lähteet\n")
    for r in rows:
        f.write("\t".join(map(str, r)) + "\n")
print(f"spa_mt.tsv: {len(rows)} sanaa (3 lähdettä {levels[3]}, 4+ {levels[4]})")
