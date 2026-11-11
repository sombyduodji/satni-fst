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
        sme, lvl = line.rstrip("\n").split("\t")
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
        if fi and nb:
            words.append([sme, fi, nb, pos, int(lvl)])
    time = []
    for lid, sub in (("viikonpaivat", "day"), ("vuodenajat", "season"), ("kuukaudet", "month")):
        for r in lists[lid]["rows"]:
            time.append([r["sme"][0]["w"][0], first(r["fi"][0], 1), first(r["nb"][0], 1), sub])
    colours = [[r["sme"][0]["w"][0], r["fi"][0], r["nb"][0]] for r in lists["varit"]["rows"]]
    # Tarkenne jää (galles = "når (klokka)", goas = "når"), muuten norjassa kaksi samaa vastausta
    questions = [[r["sme"][0]["w"][0], r["fi"][0], r["nb"][0]] for r in lists["kysymykset"]["rows"]]
    data = {"words": words, "cats": {"ordinals": ordinals(), "time": time, "colours": colours, "questions": questions,
                                     "animals": [list(a) for a in ANIMALS]}}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    lv = [w[4] for w in words]
    print(f"{OUT}: {len(words)} sanaa ({lv.count(1)} aloittelija), järjestysluvut {len(data['cats']['ordinals'])}, "
          f"aika {len(time)}, värit {len(colours)}, kysymyssanat {len(questions)}, eläimet {len(ANIMALS)}, {os.path.getsize(OUT)} tavua")
    if missing:
        print("HUOM: ei sanakirjassa:", missing)


if __name__ == "__main__":
    main()
