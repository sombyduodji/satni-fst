"""Tekstissä tavallinen lukutapa sanoille, joiden hakusana on eri sanaluokkaa kuin sanan yleisin käyttö korpuksessa:
taulu sme_dominant(surface, lemma, pos, share) tietokantaan satni.db.

garra: hakusana garra (N, "kuori"), mutta korpuksessa 95 % garas (A, "kova"); buorit: buoridit (V) vs buorre (A);
orru: orru (N) vs orrut (V); gielat: gielat (A) vs giella (N, monikko). Kuvahaku ja lausekääntäjä valitsevat korpuksen
lukutavan, kun sillä on käännös (web/app.js: ocrGloss). Sanakirjahaku ei muutu.

LÄHDE (ks. CREDITS.md): SIKOR North Saami free corpus 2015-10-10 (UiT Giellatekno ja Divvun, Sámediggi, CC BY 3.0),
korpuksen omat sanaluokka- ja perusmuotomerkinnät (GiellaLT:n jäsennin). Vain sanamuodot ja niiden lukumäärät.

Säännöt (vain varmat): vähintään 50 esiintymää ja 90 % samaa lukutapaa; korpuksen perusmuoto ja sanaluokka ovat
sanakirjassa; hakusanan sanaluokka ei ole sama. Pois jätetään postpositiot ja prepositiot (áigge, dásis: lausekääntäjän
säännöt), sidesanat, partikkelit ja monisanaiset sekä adverbit, joiden korpuslukutapa on substantiivin sijamuoto
(báikkis = kotona, lassin = lisäksi) tai verbin muoto (jáhkkimis = todennäköisesti): sanakirjan oma käännös
on idiomaattinen.
Aja yksinään olemassa olevaan tietokantaan: python3 sme_dominant.py
"""
import collections
import os
import re
import sqlite3
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
SIKOR = os.environ.get("SIKOR_ZIP", os.path.expanduser("~/Git/sami-data-candidates/sikor/SIKOR_sme_20151010.zip"))
SIKOR_XML = "SIKOR_sme_20151010/SIKOR_free_sme_20151010.xml"
MIN_COUNT, MIN_SHARE = 50, 0.9
SKIP_HEAD = {"Po", "Pr", "CC", "CS", "Pcle", "MWE", "Interj"}
SKIP_DOM = {"Po", "Pr", "CC", "CS", "Pcle", "MWE", "Interj", "PUNCT", "CLB"}


def corpus_readings():
    """{sanamuoto: Counter((perusmuoto, sanaluokka))} korpuksen merkinnöistä."""
    by = collections.defaultdict(collections.Counter)
    rx = re.compile(r'\s(word|lemma|msd)="([^"]*)"')
    cur = {}
    with zipfile.ZipFile(SIKOR) as z, z.open(SIKOR_XML) as f:
        for raw in f:
            m = rx.search(" " + raw.decode("utf-8", "replace"))
            if not m:
                continue
            cur[m.group(1)] = m.group(2)
            if m.group(1) == "msd":
                w, msd = cur.get("word", "").lower(), m.group(2)
                if w and msd != "__UNDEF__" and ".Prop" not in msd and re.match(r"^[a-záčđŋšŧž]+$", w):
                    by[w][(cur.get("lemma", ""), msd.split(".")[0])] += 1
    return by


def apply(cursor):
    print("Haetaan sanojen tavallinen lukutapa korpuksesta (SIKOR)...")
    cursor.execute("DROP TABLE IF EXISTS sme_dominant")
    cursor.execute("CREATE TABLE sme_dominant (surface TEXT PRIMARY KEY, lemma TEXT, pos TEXT, share REAL)")
    if not os.path.exists(SIKOR):
        print(f"  SIKOR-korpusta ei löydy ({SIKOR}): sme_dominant jää tyhjäksi")
        return
    heads = collections.defaultdict(set)
    has_trans = set()
    for lemma, pos, fin, nob in cursor.execute("SELECT sme_lemma, pos, finnish_translation, nob_translation FROM dictionary"):
        heads[lemma].add(pos)
        if (fin or "").strip() or (nob or "").strip():
            has_trans.add((lemma, pos))
    translated = lambda w, pos: (w, pos) in has_trans
    heads_pos = {(l, p) for l, ps in heads.items() for p in ps}
    # Myös taivutusmuodot, jotka kuuluvat usealle sanakirjan sanalle (buorit: buorre A monikko / buoridit V)
    forms = collections.defaultdict(set)
    for surface, lemma, pos in cursor.execute("SELECT p.surface, d.sme_lemma, d.pos FROM paradigms p JOIN dictionary d ON d.id = p.word_id"):
        forms[surface.lower()].add((lemma, pos))
    rows = []
    for w, c in corpus_readings().items():
        tot = sum(c.values())
        (lemma, pos), n = c.most_common(1)[0]
        # Korpuksen perusmuoto voi poiketa sanakirjasta (mis: korpuksessa mun Pl1, sanakirjassa mii): jos sanakirjassa on
        # tasan yksi saman sanaluokan sana, jonka muoto tämä on, käytetään sitä
        same = [x for x in forms[w] if x[1] == pos]
        if (lemma, pos) not in forms[w] and len(same) == 1 and (w not in heads or pos not in heads[w] or not translated(w, pos)):
            lemma = same[0][0]
        if tot < MIN_COUNT or pos not in heads.get(lemma, ()) or len(same) > 1:
            continue  # saman sanaluokan kilpailijat (lea: leat / leahkit) jäävät ennalleen
        if w in heads and pos in heads[w] and translated(w, pos):
            continue
        if w in heads and not (w, pos) in heads_pos:
            if n / tot < MIN_SHARE:
                continue
        elif (lemma, pos) not in forms[w] or len({p for _, p in forms[w]} | heads.get(w, set())) < 2 or n / tot < 0.8:
            continue  # taivutusmuoto: eri sanaluokkien välinen monitulkintaisuus, korpuksessa vähintään 80 % yhtä
        # Adverbin korpuslukutapa substantiivina tai verbinä (báikkis = kotona, jáhkkimis = todennäköisesti,
        # eahpitkeahttá = epäilemättä): sanakirjan adverbi on idiomaattisempi, pidetään
        others = heads[w] if w in heads else {p for _, p in forms[w]} - {pos}
        # Lukusana vs pronomini (máŋga = monta / usea): pronominin taivutus lauseessa toimii paremmin (testi 2026-11-26)
        if pos in SKIP_DOM or others & SKIP_HEAD or ("Adv" in others and pos in ("N", "V")) or (pos == "Num" and "Pron" in others):
            continue
        rows.append((w, lemma, pos, round(n / tot, 3)))
    cursor.executemany("INSERT INTO sme_dominant VALUES (?, ?, ?, ?)", sorted(rows))
    print(f"  {len(rows)} sanaa")


if __name__ == "__main__":
    conn = sqlite3.connect(DB_FILE)
    apply(conn.cursor())
    conn.commit()
    conn.close()
