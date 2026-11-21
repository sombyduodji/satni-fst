"""Inarinsaame kuvan tekstintunnistukseen: sanat, käännökset, taivutusmuodot ja yhdyssanojen alkumuodot satni.db:hen.

LÄHTEET (ks. CREDITS.md):
- dict-smn-fin ja dict-fin-smn (Marja-Liisa Olthuis, Taarna Valtonen, Giellatekno; CC BY): inarinsaame -> suomi
- dict-smn-sme (Giellatekno, CC BY 4.0) ja dict-sme-smn (satni.db, dictionary.smn_translation): inarinsaame ->
  pohjoissaame. Norja haetaan sovelluksessa pohjoissaamen sanan kautta (likimääräinen).
- GiellaLT lang-smn (giella-smn-paketti, GPL-3.0): analysaattori ja generaattori taivutusmuotoihin; inarinsaamen
  oikoluku (giella-smn-speller, Voikon kautta) tarkistaa yhdyssanojen alkumuodot.
FST-mallit ja oikolukua käytetään vain tässä, ei sovelluksessa.

Taulut:
- smn_words(id, lemma, pos, fin, sme): fin ja sme pilkuin eroteltuina, tärkein ensin
- smn_forms(surface, word_id, tag): kaikki generoidut muodot (myös perusmuoto), pienillä kirjaimilla
- smn_cmp(stem, word_id): yhdyssanan alkumuoto (sämi-kielâ, tiervâsvuotâ-palvâlus), oikoluvulla tarkistettu

Aja: python3 smn_data.py (kesto noin 5–10 min; SATNI_WORKERS rajoittaa rinnakkaisia hfst-lookup-prosesseja).
Kokeilu 2026-11-18: Anarâš aavis -kuvakaappauksista 81 % sanoista löytyi perusmuotona dict-smn-fin:stä.
"""
import collections
import glob
import os
import re
import sqlite3
import xml.etree.ElementTree as ET

import import_full_dict as ifd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FST_DIR = "/usr/share/giella/smn"
ANALYSER = os.path.join(FST_DIR, "analyser-gt-desc.hfstol")
GENERATOR = os.path.join(FST_DIR, "generator-gt-norm.hfstol")
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")

# Inarinsaamessa on lisäksi abessiivi ja (yksikön) partitiivi
SMN_CASES = ["Nom", "Gen", "Acc", "Ill", "Loc", "Com", "Abe"]
# Partitiivi ilman lukua (olmooš+N+Par = olmožid); "Sg+Par" ei tuottanut mitään (uutiskoe 2026-11-18)
NOMINAL = [(f"{n}+{c}", f"+{n}+{c}") for n in ("Sg", "Pl") for c in SMN_CASES] + [("Ess", "+Ess"), ("Par", "+Par")]
# Transitiiviverbin passiivi (uárnejuvvoo, uárnejuvvojeh, uárnejui): uutisissa yleinen
PASSIVE = [(f"Pass+{t}", f"+Der/Pass+V+IV+{t}") for t in
           ["Ind+Prs+Sg3", "Ind+Prs+Pl3", "Ind+Prt+Sg3", "Ind+Prt+Pl3", "PrfPrc", "Inf", "Ind+Prs+ConNeg", "Cond+Prs+Sg3"]] + [("Pass+Actio+Nom", "+Der/Pass+V+Actio+Nom")]
# Vertailu- ja yliaste (puárásub, muččâdumos) sekä verbin teonnimi (tábáhtume) ja passiivin teonnimi (jurdâččum):
# uutisteksteissä yleisiä (Anarâš aavis -koe 2026-11-18)
DEGREE = [(f"{d}+{c}", f"+Der/{d}+A+{c}") for d in ("Comp", "Superl") for c in ("Attr", "Sg+Nom", "Sg+Gen", "Sg+Acc", "Pl+Nom", "Sg+Loc")]
NOMACT = [(f"NomAct+{c}", f"+Der/NomAct+N+{c}") for c in ("Sg+Nom", "Sg+Acc", "Sg+Loc", "Sg+Ill", "Sg+Com", "Pl+Nom", "Ess")]
ADJECTIVE = [("Attr", "+Attr")] + NOMINAL + DEGREE
PRONOUN_PERS = [(c, f"+{c}") for c in SMN_CASES + ["Ess"]]
CMP_HEADS = ("peivi", "kirje")  # päivä, kirja: yleisiä jälkiosia alkumuodon tarkistukseen
VOWELS = "aáâeiouyäö"


def text_of(el):
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip()


def read_dict(pattern, lang):
    """{(lemma, pos): [käännökset järjestyksessä]} GiellaLT-XML-sanakirjoista"""
    out = collections.OrderedDict()
    for f in sorted(glob.glob(pattern)):
        for e in ET.parse(f).getroot().iter("e"):
            l = e.find("lg/l")
            if l is None or not (l.text or "").strip():
                continue
            lemma = l.text.strip()
            pos = ifd.POS_MAP.get((l.get("pos") or "").upper(), l.get("pos") or "")
            ts = out.setdefault((lemma, pos), [])
            for tg in e.iter("tg"):
                if tg.get("{http://www.w3.org/XML/1998/namespace}lang") != lang:
                    continue
                for t in tg.iter("t"):
                    s = text_of(t)
                    if s and s not in ts:
                        ts.append(s)
    return out


def forms_for(pos, prefix):
    if pos == "V":
        return ifd.VERB_FORMS + NOMACT + (PASSIVE if "+TV" in prefix else [])
    if pos == "A":
        return ADJECTIVE
    if pos == "Pron" and any(p in prefix.split("+") for p in ifd.PERSONS):
        return PRONOUN_PERS
    if pos in ("N", "Num", "Pron"):
        return NOMINAL
    return []


def compound_stems(words, speller):
    """Yhdyssanan alkumuodot: perusmuoto, yksikön genetiivi ja viimeinen vokaali vaihdettuna; oikoluku hyväksyy
    ehdokas + molemmat jälkiosat. Sama muoto kahdelle sanalle -> se, jolla on enemmän käännöksiä."""
    best = {}
    for wid, lemma, pos, gens, ntrans in words:
        if pos not in ("N", "A") or not lemma.isalpha():
            continue
        low = lemma.lower()
        cands = {low} | {g.lower() for g in gens}
        if low[-1] in VOWELS:
            cands.update(low[:-1] + v for v in "aáâeiou")
        for c in sorted(cands):
            if len(c) >= 3 and (c not in best or ntrans > best[c][0]) and all(speller.spell(c + h) for h in CMP_HEADS):
                best[c] = (ntrans, wid)
    return sorted((c, wid) for c, (_, wid) in best.items())


def main():
    fin = read_dict(os.path.join(SCRIPT_DIR, "dict-smn-fin", "src", "*.xml"), "fin")
    sme = read_dict(os.path.join(SCRIPT_DIR, "dict-smn-sme", "src", "*.xml"), "sme")
    con = sqlite3.connect(DB_FILE)
    # dict-sme-smn: pohjoissaamen sanan inarinkieliset vastineet -> käänteisesti inarin sanalle pohjoissaame
    sme_rev = collections.defaultdict(list)
    for lemma, smn in con.execute("SELECT sme_lemma, smn_translation FROM dictionary WHERE smn_translation != ''"):
        for s in re.split(r",\s*", smn):
            s = s.strip()
            if s and lemma not in sme_rev[s]:
                sme_rev[s].append(lemma)
    # dict-fin-smn: suomen sana -> inarin sanat; täydentää suomennoksen inarin sanalle, jolla sitä ei ole
    fin_rev = collections.defaultdict(list)
    for (fword, _), smns in read_dict(os.path.join(SCRIPT_DIR, "dict-fin-smn", "src", "*.xml"), "smn").items():
        for s in smns:
            if fword not in fin_rev[s]:
                fin_rev[s].append(fword)

    entries = collections.OrderedDict()
    for (lemma, pos), ts in list(fin.items()) + [((l, p), []) for (l, p) in sme if (l, p) not in fin]:
        if " " in lemma or pos in ("MWE", "Abbr", ""):
            continue
        e = entries.setdefault((lemma, pos), {"fin": [], "sme": []})
        e["fin"] += [t for t in ts + fin_rev.get(lemma, []) if t not in e["fin"]]
        e["sme"] += [t for t in sme.get((lemma, pos), []) + sme_rev.get(lemma, []) if t not in e["sme"]]
    entries = {k: v for k, v in entries.items() if v["fin"] or v["sme"]}
    print(f"Inarin sanoja: {len(entries)} (suomennos {sum(1 for v in entries.values() if v['fin'])}, "
          f"pohjoissaame {sum(1 for v in entries.values() if v['sme'])})")

    # Sanan FST-etuliite analysaattorilla (kuten import_full_dict.py), sitten muodot generaattorilla
    ifd.ANALYSER, ifd.GENERATOR = ANALYSER, GENERATOR
    lemmas = list({l for l, _ in entries})
    analyses = ifd.run_hfst_lookup(ANALYSER, lemmas)
    words = [(l, p, "", "", None) for l, p in entries]
    prefixes = ifd.find_fst_prefixes(words, analyses)
    queries, owner = [], {}
    for (lemma, pos), _ in entries.items():
        for prefix in prefixes.get((lemma, pos, ""), []):
            for tag, suffix in forms_for(pos, prefix):
                q = prefix + suffix
                queries.append(q)
                owner.setdefault(q, []).append((lemma, pos, tag))
    print(f"Generaattorikyselyjä: {len(queries)}")
    generated = ifd.run_hfst_lookup(GENERATOR, queries)

    con.executescript("""
        DROP TABLE IF EXISTS smn_words; DROP TABLE IF EXISTS smn_forms; DROP TABLE IF EXISTS smn_cmp;
        CREATE TABLE smn_words (id INTEGER PRIMARY KEY, lemma TEXT, pos TEXT, fin TEXT, sme TEXT);
        CREATE TABLE smn_forms (surface TEXT, word_id INTEGER, tag TEXT, PRIMARY KEY (surface, word_id, tag)) WITHOUT ROWID;
        CREATE TABLE smn_cmp (stem TEXT PRIMARY KEY, word_id INTEGER) WITHOUT ROWID;
    """)
    ids = {}
    for i, ((lemma, pos), v) in enumerate(entries.items(), 1):
        ids[(lemma, pos)] = i
        con.execute("INSERT INTO smn_words VALUES (?,?,?,?,?)", (i, lemma, pos, ", ".join(v["fin"]), ", ".join(v["sme"])))
    rows = set()
    for (lemma, pos), i in ids.items():
        rows.add((lemma.lower(), i, "Lemma"))
    for q, surfs in generated.items():
        for lemma, pos, tag in owner.get(q, []):
            for s in surfs:
                if "+?" not in s:
                    rows.add((s.lower(), ids[(lemma, pos)], tag))
    con.executemany("INSERT OR IGNORE INTO smn_forms VALUES (?,?,?)", rows)
    print(f"Taivutusmuotoja: {len(rows)}")

    try:
        import libvoikko
        speller = libvoikko.Voikko("smn")
    except Exception:
        speller = None
    if speller:
        # Kaikki yksikön genetiivit (osalla sanoista kaksi, esim. astevaihtelun takia): ennen joukosta poimittiin
        # satunnainen yksi, jolloin ~145 smn_cmp-riviä vaihteli ajosta toiseen (2026-11-21). Oikoluku tarkistaa
        # jokaisen ehdokkaan, joten molemmat kelpaavat.
        gen = collections.defaultdict(set)
        for s, i, tag in rows:
            if tag == "Sg+Gen":
                gen[i].add(s)
        cw = [(i, l, p, sorted(gen.get(i, ())), len(entries[(l, p)]["fin"]) + len(entries[(l, p)]["sme"])) for (l, p), i in ids.items()]
        cmp_rows = compound_stems(cw, speller)
        speller.terminate()
        con.executemany("INSERT INTO smn_cmp VALUES (?,?)", cmp_rows)
        print(f"Yhdyssanojen alkumuotoja: {len(cmp_rows)}")
    else:
        print("Inarin oikoluku puuttuu: smn_cmp jää tyhjäksi")
    con.commit()
    con.close()


if __name__ == "__main__":
    main()
