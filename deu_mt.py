"""Konekäännetty saksa (kokeellinen BETA-kieli, käyttäjä 2026-11-22). Saksalle ei ole pohjoissaamen sanakirjaa, joten
jokainen sana on konekäännös. Hyväksytään vain, kun vähintään kolme kuudesta riippumattomasta lähteestä antaa saman sanan:
  sme  saamen sana -> smi-mt (TartuNLP Smugri NLLB 1.3B, CC BY 4.0; pohjamalli NLLB-200 CC BY-NC 4.0)
  fin  sanan suomennos -> Helsinki-NLP opus-mt-fi-de (Apache-2.0) ja FinnWordNet (CC BY 3.0) -> OdeNet (CC BY-SA 4.0)
  nob  sanan norjannos -> Helsinki-NLP opus-mt-no-de (Apache-2.0)
  eng  sanakirjan oma englanti (ei konekäännöksiä) -> opus-mt-en-de (CC BY 4.0) ja WordNet -> OdeNet
  wikt Wiktionary kokonaisuutena yhtenä lähteenä (CC BY-SA 4.0, kaikki.org): suomen, norjan ja englannin
       käännöstaulukot sekä saamen omat merkinnät
  apt  Apertium apertium-sme-deu -kaksikielinen sanakirja (GPL-3.0, ihmisen tekemä, ~2 400 paria; lisätty 2026-11-25).
       Siinä on kirjoitusvirheitä ja vanhoja asuja (Protokol, Zuschuß), joten se on vain yksi lähde muiden joukossa
       ja sen sanakin kelpaa vain, jos se on OdeNetissä tai Wiktionaryssa.
Saksan sanaksi kelpaa vain OdeNetin tai Wiktionaryn sana; ei Wiktionaryn mallineita eikä numeroita; substantiivit isolla,
muut pienellä alkukirjaimella.
Kalibrointi 2026-11-22 (muistiinpanot/englanti-testi-2026-11-21.md, kohta 7): Wiktionaryn saame–saksa-parit (kalibrointisanoille
Wiktionary-lähde ilman niitä käännösryhmiä, joissa sana itse on): 3 lähdettä 82 %, 4 lähdettä 92 %, 5 lähdettä 93 % sama
tai synonyymi (448 / 292 / 83 sanaa). Álgun saksaa (Sammallahti & Nickel) käytettiin vain tarkistukseen, ei sovellukseen.

EI KONEKÄÄNNÖSTEN KETJUJA: syötteinä vain meanings-taulu ja avoimet sanakirjat. Välimuisti ~/.cache/satni-fst-build/decal
(maps.json, mt_sme_de.json, mt_opus_de.json, recs.json). Aja: python3 deu_mt.py -> deu_mt.tsv
"""

import collections
import json
import random
import re
import sys
import xml.etree.ElementTree as ET

import os
HOME = os.path.expanduser("~")
C = os.path.join(HOME, ".cache/satni-fst-build/decal/")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(C + "maps.json"))
R = json.load(open(C + "recs.json"))
SMI = json.load(open(C + "mt_sme_de.json"))
OP = json.load(open(C + "mt_opus_de.json"))
APT_DIX = os.path.join(HOME, "Git/sami-data-candidates/german/apertium-sme-deu/apertium-sme-deu.sme-deu.dix")
APT_POS = {"n": "N", "vblex": "V", "adj": "A", "adv": "Adv"}


def _apt_text(el):
    t = el.text or ""
    for c in el:
        t += (" " if c.tag == "b" else _apt_text(c) if c.tag == "g" else "") + (c.tail or "")
    return t.strip()


def load_apertium(path=APT_DIX):
    """(saame, sanaluokka) -> [saksa] Apertiumin sme-deu-sanakirjasta (tyhjä, jos tiedostoa ei ole)."""
    out = collections.defaultdict(list)
    if not os.path.exists(path):
        return out
    for sec in ET.parse(path).getroot().iter("section"):
        for e in sec.iter("e"):
            lr = e.find("p")
            if lr is None or e.get("r") == "RL":
                continue
            l, r, tag = lr.find("l"), lr.find("r"), lr.find("l/s")
            if l is None or r is None or tag is None or tag.get("n") not in APT_POS:
                continue
            if _apt_text(l) and _apt_text(r):
                out[(_apt_text(l), APT_POS[tag.get("n")])].append(_apt_text(r))
    return out


APT = load_apertium()
ALGU = json.load(open(os.path.join(HOME, ".cache/satni-fst-build/fincal/algu_sme_deu.json")))
root = ET.parse(os.path.join(HOME, "Git/sami-data-candidates/german/deWordNet.xml")).getroot()
SYN, CASE, DEPOS = collections.defaultdict(set), {}, collections.defaultdict(set)
for le in root.iter("LexicalEntry"):
    lem = le.find("Lemma")
    wf = lem.get("writtenForm")
    SYN[wf.lower()] |= {s.get("synset") for s in le.iter("Sense")}
    CASE.setdefault(wf.lower(), wf)
    DEPOS[wf.lower()].add(lem.get("partOfSpeech"))
for k in ("fi_de", "nb_de", "en_de", "se_de"):
    for v in M[k].values():
        for w in v:
            CASE.setdefault(w.lower(), w)
VOCAB = set(CASE)
STOP = re.compile(r"^(der|die|das|ein|eine|sich|zu)\s+", re.I)
JUNK = re.compile(r"[{}|=\[\]<>]|^\W+$")
POSMAP = {"N": "n", "V": "v", "A": "a", "Adv": "r"}


def items(lst):
    out = []
    for s in lst:
        s = re.sub(r"\([^)]*\)", "", s or "")
        out += [p.strip(" .") for p in re.split(r"[,;]", s) if p.strip(" .")]
    return out


def cset(strings):
    """{avain pienillä: kirjoitusasu}; vain tunnetut saksan sanat, ei Wiktionaryn mallineita."""
    out = {}
    for s in strings:
        for p in re.split(r"[,;/]", s or ""):
            if JUNK.search(p) or re.search(r"\d", p):  # ei Wiktionaryn mallineita eikä numeroita (golbmalogi -> 30)
                continue
            n = re.sub(r"\s+", " ", STOP.sub("", STOP.sub("", re.sub(r"\([^)]*\)", "", p).strip(" .!?:;\"'")))).strip()
            if n and len(n.split()) <= 3 and n.lower() in VOCAB:
                out.setdefault(n.lower(), n)
    return out


def look(m, keys):
    return [w for k in keys for w in M[m].get(k.lower(), [])]


def sources(r):
    fi, nb, en = items(r["fin"]), items(r["nob"]), items(r["eng"])
    gold = r["lemma"].lower() in M["se_de"]
    x = "_x" if gold else "_de"
    wikt = look("fi" + x, fi) + look("nb" + x, nb) + look("en" + x, en) + ([] if gold else look("se_de", [r["lemma"]]))
    return {
        "sme": cset([SMI.get(r["lemma"], "")]),
        "fin": cset([OP["fin"].get(w, "") for w in fi] + look("fiwn_de", fi)) if fi else {},
        "nob": cset([OP["nob"].get(w, "") for w in nb]) if nb else {},
        "eng": cset([OP["eng"].get(w, "") for w in en] + look("enwn_de", en)) if en else {},
        "wikt": cset(wikt),
        "apt": cset(APT.get((r["lemma"], r["pos"]), [])),
    }


def shown(key, form, pos):
    """Kirjoitusasu: OdeNet/Wiktionary, muuten substantiivi isolla alkukirjaimella, muut pienellä."""
    w = CASE.get(key, form)
    if pos == "N" and w[:1].islower() and " " not in w:
        w = w[:1].upper() + w[1:]
    # Saksassa vain substantiivit (ja erisnimet) isolla: verbit, adjektiivit, adverbit ym. pienellä (russisch, aus)
    if pos not in ("N",) and w[:1].isupper() and " " not in w:
        w = w[:1].lower() + w[1:]
    return w


def best(r):
    support, forms = collections.defaultdict(set), {}
    for src, c in sources(r).items():
        for k, f in c.items():
            support[k].add(src)
            forms.setdefault(k, f)
    good = [k for k in support if len(support[k]) >= 3]
    if not good:
        return None, set()
    top = max(len(support[k]) for k in good)
    ks = sorted((k for k in good if len(support[k]) == top), key=len)
    return [shown(k, forms[k], r["pos"]) for k in ks[:2]], support[ks[0]]


def norm(s):
    return re.sub(r"\s+", " ", STOP.sub("", re.sub(r"\([^)]*\)|\[[^\]]*\]", "", s or "").strip(" .!?:;\"'"))).lower()


def judge(c, gold):
    g = {norm(x) for x in gold}
    c = c.lower()
    if c in g:
        return "exact"
    if any(SYN.get(c, set()) & SYN.get(x, set()) for x in g):
        return "syn"
    if any(re.search(r"\b" + re.escape(c) + r"\b", x) for x in g):
        return "part"
    return "wrong"


rows, lv = [], collections.Counter()
for r in R:
    if r["lemma"][:1].isupper():
        continue
    cands, rs = best(r)
    if not cands:
        continue
    level = min(len(rs), 5)
    lv[level] += 1
    rows.append((r["lemma"], r["pos"], ", ".join(cands), level, "+".join(sorted(rs))))
rows = sorted(set(rows))
with open(os.path.join(SCRIPT_DIR, "deu_mt.tsv"), "w", encoding="utf-8") as f:
    f.write("# Konekäännetty saksa (kokeellinen), tehty deu_mt.py:llä. Sarakkeet: saame, sanaluokka, saksa, "
            "taso (lähteiden määrä 3–5), lähteet\n")
    for x in rows:
        f.write("\t".join(map(str, x)) + "\n")
print(f"deu_mt.tsv: {len(rows)} sanaa ({dict(sorted(lv.items()))})")
