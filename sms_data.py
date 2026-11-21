"""Koltansaame kuvan tekstintunnistukseen: sanat, käännökset, taivutusmuodot ja yhdyssanojen alkumuodot satni.db:hen.

LÄHTEET (ks. CREDITS.md):
- dict-sms-mul (koltansaame -> suomi, norja, pohjoissaame ym.; CC BY 4.0), dict-fin-sms (CC BY 3.0) ja dict-nob-sms
  (CC BY 4.0), GiellaLT
- GiellaLT lang-sms (giella-sms-paketti, GPL-3.0): analysaattori ja generaattori. Paketti puretaan ilman pääkäyttäjän
  oikeuksia: apt-get download giella-sms && dpkg -x giella-sms_*.deb ~/.cache/giella-sms-deb/root
  (tai asennetaan järjestelmään /usr/share/giella/sms). FST-malleja käytetään vain tässä, ei sovelluksessa.

Taulut: sms_words(id, lemma, pos, fin, nob, sme), sms_forms(surface, word_id, tag), sms_cmp(stem, word_id).
Pohjoissaame on suoraan vain noin 400 sanalle; sovellus hakee muut suomennoksen kautta (likimääräinen).
Kokeilu 2026-11-18: Yle Sápmin kolttaartikkeleista 95 % sanoista analysoitui, 90 %:n perusmuoto on dict-sms-mul:ssa.
"""
import collections
import os
import re
import sqlite3
import subprocess

import import_full_dict as ifd
from smn_data import read_dict, NOMINAL, ADJECTIVE, PRONOUN_PERS, NOMACT

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FST_DIR = next((d for d in ("/usr/share/giella/sms", os.path.expanduser("~/.cache/giella-sms-deb/root/usr/share/giella/sms"))
                if os.path.exists(os.path.join(d, "generator-gt-norm.hfstol"))), None)
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
CMP_HEAD = "ǩeʹrjj"  # kirja: alkumuodon tarkistus analysaattorilla (ehdokas + ǩeʹrjj = yhdyssana, alkuosa oikea sana)


def forms_for(pos, prefix):
    if pos == "V":
        return ifd.VERB_FORMS + NOMACT
    if pos == "A":
        return ADJECTIVE
    if pos == "Pron" and any(p in prefix.split("+") for p in ifd.PERSONS):
        return PRONOUN_PERS
    if pos in ("N", "Num", "Pron"):
        return NOMINAL
    return []


def compound_stems(cands, analyser):
    """[(ehdokas, word_id, perusmuoto)] -> hyväksytyt [(alkumuoto, word_id)]: analyysi ehdokas+ǩeʹrjj alkaa
    perusmuodolla ja sisältää yhdyssanarajan (Cmp#)."""
    queries = list({c + CMP_HEAD for c, _, _ in cands})
    res = ifd.run_hfst_lookup(analyser, queries)
    ok = {}
    for c, wid, lemma in cands:
        for a in res.get(c + CMP_HEAD, []):
            if "Cmp#" in a and a.split("+", 1)[0] == lemma and a.rsplit("#", 1)[-1].startswith(CMP_HEAD + "+"):
                ok.setdefault(c, wid)
                break
    return sorted(ok.items())


def main():
    if not FST_DIR:
        raise SystemExit("giella-sms puuttuu (ks. ohje tiedoston alussa)")
    analyser, generator = os.path.join(FST_DIR, "analyser-gt-desc.hfstol"), os.path.join(FST_DIR, "generator-gt-norm.hfstol")
    src = os.path.join(SCRIPT_DIR, "dict-sms-mul", "src", "*.xml")
    fin, nob, sme = read_dict(src, "fin"), read_dict(src, "nob"), read_dict(src, "sme")
    rev = {lang: collections.defaultdict(list) for lang in ("fin", "nob")}
    for lang in rev:
        for (word, _), smss in read_dict(os.path.join(SCRIPT_DIR, f"dict-{lang}-sms", "src", "*.xml"), "sms").items():
            for s in smss:
                if word not in rev[lang][s]:
                    rev[lang][s].append(word)
    entries = collections.OrderedDict()
    for (lemma, pos) in list(fin) + [k for k in nob if k not in fin]:
        if " " in lemma or pos in ("MWE", "Abbr", "") or lemma.isupper():
            continue
        e = entries.setdefault((lemma, pos), {"fin": [], "nob": [], "sme": []})
        for lang, d in (("fin", fin), ("nob", nob), ("sme", sme)):
            e[lang] += [t for t in d.get((lemma, pos), []) + (rev[lang].get(lemma, []) if lang in rev else []) if t not in e[lang]]
    entries = {k: v for k, v in entries.items() if v["fin"] or v["nob"] or v["sme"]}
    print(f"Koltan sanoja: {len(entries)} (suomi {sum(1 for v in entries.values() if v['fin'])}, "
          f"norja {sum(1 for v in entries.values() if v['nob'])}, pohjoissaame {sum(1 for v in entries.values() if v['sme'])})")

    analyses = ifd.run_hfst_lookup(analyser, list({l for l, _ in entries}))
    prefixes = ifd.find_fst_prefixes([(l, p, "", "", None) for l, p in entries], analyses)
    queries, owner = [], {}
    for (lemma, pos) in entries:
        for prefix in prefixes.get((lemma, pos, ""), []):
            for tag, suffix in forms_for(pos, prefix):
                q = prefix + suffix
                queries.append(q)
                owner.setdefault(q, []).append((lemma, pos, tag))
    print(f"Generaattorikyselyjä: {len(queries)}")
    generated = ifd.run_hfst_lookup(generator, queries)

    con = sqlite3.connect(DB_FILE)
    con.executescript("""
        DROP TABLE IF EXISTS sms_words; DROP TABLE IF EXISTS sms_forms; DROP TABLE IF EXISTS sms_cmp;
        CREATE TABLE sms_words (id INTEGER PRIMARY KEY, lemma TEXT, pos TEXT, fin TEXT, nob TEXT, sme TEXT);
        CREATE TABLE sms_forms (surface TEXT, word_id INTEGER, tag TEXT, PRIMARY KEY (surface, word_id, tag)) WITHOUT ROWID;
        CREATE TABLE sms_cmp (stem TEXT PRIMARY KEY, word_id INTEGER) WITHOUT ROWID;
    """)
    ids = {}
    for i, ((lemma, pos), v) in enumerate(entries.items(), 1):
        ids[(lemma, pos)] = i
        con.execute("INSERT INTO sms_words VALUES (?,?,?,?,?,?)", (i, lemma, pos, ", ".join(v["fin"]), ", ".join(v["nob"]), ", ".join(v["sme"])))
    rows = {(lemma.lower(), i, "Lemma") for (lemma, _), i in ids.items()}
    gen = {}
    for q, surfs in generated.items():
        for lemma, pos, tag in owner.get(q, []):
            for s in surfs:
                if "+?" not in s:
                    rows.add((s.lower(), ids[(lemma, pos)], tag))
                    if tag == "Sg+Gen":
                        gen.setdefault(ids[(lemma, pos)], s.lower())
    con.executemany("INSERT OR IGNORE INTO sms_forms VALUES (?,?,?)", rows)
    print(f"Taivutusmuotoja: {len(rows)}")
    cands = []
    for (lemma, pos), i in ids.items():
        if pos in ("N", "A") and re.fullmatch(r"[\wʹ]+", lemma):
            for c in {lemma.lower(), gen.get(i)} - {None}:
                if len(c) >= 3:
                    cands.append((c, i, lemma))
    cmp_rows = compound_stems(cands, analyser)
    con.executemany("INSERT INTO sms_cmp VALUES (?,?)", cmp_rows)
    print(f"Yhdyssanojen alkumuotoja: {len(cmp_rows)}")
    con.commit()
    con.close()


if __name__ == "__main__":
    main()
