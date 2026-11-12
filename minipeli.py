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


# --- Inarinsaame ---
# Sana hyväksytään vain, kun kaksi lähdettä täsmää: pohjoissaamen sanan inarinsaamen käännös (dict-sme-smn, satni.db)
# ja suora sanakirja (dict-smn-fin inari -> suomi, dict-fin-smn suomi -> inari, CC BY 4.0) antaa sille saman suomennoksen.
# Jos suora sanakirja antaa saman sanan uudemmalla kirjoitusasulla (poolitlâš -> pooliitlâš), käytetään sitä.
# Ilman pivotia kelpaa sana, jonka suora sanakirja antaa yksiselitteisesti molempiin suuntiin (keskipäivä -> koskâpeivi).
# Muut menevät tarkistuslistaan minipeli_smn_tarkistus.tsv; sen viimeiseen sarakkeeseen kirjoitettu inarinsaamen sana
# otetaan peliin (tyhjä = ei peliin). Järjestysluvut puuttuvat (inarinsaamen analysaattoria ei ole käännetty).
SMN_REVIEW = os.path.join(SCRIPT_DIR, "minipeli_smn_tarkistus.tsv")
SMN_MIN_CAT = 6  # aiheesta tehdään peli vain, jos sanoja on vähintään näin monta


def _terms(text):
    return [x.strip().lower() for x in re.split(r"[,;]\s*", re.sub(r"\([^)]*\)", "", text or "")) if x.strip()]


def _smn_direct():
    """({inarin sana: {suomennokset}}, {suomen sana: {inarin sanat}}) sanakirjoista dict-smn-fin ja dict-fin-smn"""
    import glob
    import xml.etree.ElementTree as ET
    smn_fin, fin_smn = {}, {}
    for repo, forward in (("dict-smn-fin", True), ("dict-fin-smn", False)):
        for path in glob.glob(os.path.join(SCRIPT_DIR, repo, "src", "*.xml")):
            try:
                root = ET.parse(path).getroot()
            except ET.ParseError:
                continue
            for e in root.iter("e"):
                l = e.find("lg/l")
                if l is None or not (l.text or "").strip():
                    continue
                head = l.text.strip()
                for t in e.iter("t"):
                    for x in _terms(t.text):
                        if forward:
                            smn_fin.setdefault(head, set()).add(x)
                            fin_smn.setdefault(x, set()).add(head)
                        else:
                            fin_smn.setdefault(head.lower(), set()).add((t.text or "").strip())
                            smn_fin.setdefault((t.text or "").strip(), set()).add(head.lower())
    return smn_fin, fin_smn


def inari(db, data):
    smn_fin, fin_smn = _smn_direct()
    if not smn_fin:
        print("Inarinsaame: dict-smn-fin puuttuu (hae_sanakirjat.sh), ohitetaan")
        return None
    reviewed = {}
    if os.path.exists(SMN_REVIEW):
        for line in open(SMN_REVIEW, encoding="utf-8"):
            c = line.rstrip("\n").split("\t")
            if line.startswith("#") or len(c) < 6 or c[0] == "pohjoissaame":
                continue
            reviewed[c[0]] = c[5].strip()
    review, stats = [], {"kahdesta lähteestä": 0, "uudempi asu": 0, "suora molempiin suuntiin": 0, "tarkistettu": 0, "tarkistettavana": 0}

    def pick(sme, fi):
        """(inarin sana tai None, syy, pivot, suoran sanakirjan ehdokkaat)"""
        r = db.execute("SELECT smn_translation FROM dictionary WHERE sme_lemma = ? ORDER BY freq DESC LIMIT 1", (sme,)).fetchone()
        piv = (_terms(r[0]) or [""])[0] if r and r[0] else ""
        concept = set(_terms(fi))
        direct = sorted(set().union(*[fin_smn.get(t, set()) for t in concept])) if concept else []
        if sme in reviewed:
            return (reviewed[sme] or None), "tarkistettu", piv, direct
        if piv and (smn_fin.get(piv, set()) & concept or piv in direct):
            return piv, "kahdesta lähteestä", piv, direct
        if piv:
            near = [d for d in direct if _lev(d.lower(), piv.lower()) <= 2]
            if len(near) == 1:
                return near[0], "uudempi asu", piv, direct
        # Ei pivotia, mutta suora sanakirja yksiselitteinen molempiin suuntiin (suomi -> inari ja inari -> suomi)
        if len(concept) == 1 and len(direct) == 1 and smn_fin.get(direct[0], set()) & concept:
            return direct[0], "suora molempiin suuntiin", piv, direct
        return None, "tarkistettavana", piv, direct

    def conv(items, fi_i=1):
        out = []
        for it in items:
            smn, why, piv, direct = pick(it[0], it[fi_i])
            stats[why if smn or why == "tarkistettavana" else "tarkistettavana"] += 1
            if smn:
                out.append([smn] + list(it[1:]))
            elif why == "tarkistettavana":
                review.append([it[0], it[1], it[2], piv, ", ".join(direct[:6])])
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
    with open(SMN_REVIEW, "w", encoding="utf-8") as f:
        f.write("# Inarinsaamen minipelisanat, joita kaksi lähdettä ei vahvistanut (minipeli.py kirjoittaa tämän uudelleen).\n"
                "# Kirjoita oikea inarinsaamen sana viimeiseen sarakkeeseen, niin se otetaan peliin; tyhjä = ei peliin.\n"
                "# pivot = dict-sme-smn:n käännös pohjoissaamen sanalle; suora = dict-fin-smn/dict-smn-fin suomennoksen perusteella.\n")
        f.write("pohjoissaame\tsuomi\tnorja\tpivot\tsuora sanakirja\tinarinsaame (tarkistettu)\n")
        for sme, ok in sorted(reviewed.items()):
            if ok:
                f.write(f"{sme}\t\t\t\t\t{ok}\n")
        for r in review:
            f.write("\t".join(r) + "\t\n")
    lv = [w[4] for w in words]
    print(f"Inarinsaame: {len(words)} sanaa ({lv.count(1)} aloittelija), aiheet {', '.join(f'{k} {len(v)}' for k, v in cats.items())}; "
          + ", ".join(f"{k} {v}" for k, v in stats.items()) + f" -> {os.path.basename(SMN_REVIEW)}")
    return {"words": words, "cats": cats}


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
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    lv = [w[4] for w in words]
    print(f"{OUT}: {len(words)} sanaa ({lv.count(1)} aloittelija), järjestysluvut {len(data['cats']['ordinals'])}, "
          f"aika {len(time)}, värit {len(colours)}, kysymyssanat {len(questions)}, eläimet {len(ANIMALS)}, {os.path.getsize(OUT)} tavua")
    if missing:
        print("HUOM: ei sanakirjassa:", missing)


if __name__ == "__main__":
    main()
