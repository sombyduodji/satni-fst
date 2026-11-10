"""Saamen passiivimuodot (-juvvo-) lausekääntäjää varten: taulu sme_passive(word_id, tag, surface) tietokantaan satni.db.

LÄHDE (ks. CREDITS.md): GiellaLT lang-sme -generaattori (src/fst/generator-gt-norm.hfst), Der/PassL-johdin.
Vain transitiiviverbeillä on passiivi (gohčodit -> gohčoduvvo, máksit -> máksojuvvo); generaattori ei anna muotoa
intransitiiviverbille (mannat), jolloin lausekääntäjä käyttää monikon 3. persoonaa. Tarkistettu 2026-11-10: 300
yleisimmästä verbistä 218 sai muodon ja Divvunin oikoluku hyväksyi ne kaikki; oikoluvun hylkäämät jätetään silti pois.

Suomen passiivi = saamen passiivi sanakirjan esimerkkilauseissa 11/20 kertaa (määrättiin = mearriduvvui), muuten
monikon 3. persoona (käsitellään = gieđahallet).

Aja yksinään olemassa olevaan tietokantaan: python3 sme_passive.py
"""
import collections
import os
import sqlite3
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GENERATOR = os.path.join(SCRIPT_DIR, "src", "fst", "generator-gt-norm.hfst")
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
TAGS = ["Ind+Prs+Sg3", "Ind+Prt+Sg3", "Ind+Prs+Pl3", "Ind+Prt+Pl3", "Ind+Prs+ConNeg", "PrfPrc"]


def generate(queries):
    proc = subprocess.run(["hfst-lookup", "-q", GENERATOR], input="\n".join(queries) + "\n",
                          capture_output=True, text=True, encoding="utf-8")
    out = collections.defaultdict(list)
    for line in proc.stdout.splitlines():
        p = line.split("\t")
        if len(p) >= 2 and "+?" not in p[1] and p[1] not in out[p[0]]:
            out[p[0]].append(p[1])
    return out


def speller():
    try:
        import libvoikko
        return libvoikko.Voikko("se").spell
    except Exception:
        print("  VAROITUS: Divvunin oikolukua ei voitu ladata, muotoja ei tarkisteta")
        return lambda w: True


def apply(cursor):
    print("Luodaan saamen passiivimuodot (GiellaLT lang-sme)...")
    cursor.execute("DROP TABLE IF EXISTS sme_passive")
    cursor.execute("CREATE TABLE sme_passive (word_id INTEGER, tag TEXT, surface TEXT)")
    verbs = cursor.execute("SELECT id, sme_lemma FROM dictionary WHERE pos = 'V' AND sme_lemma NOT LIKE '% %'").fetchall()
    query = {(i, t): f"{lemma}+V+TV+Der/PassL+V+IV+{t}" for i, lemma in verbs for t in TAGS}
    forms = generate(sorted(set(query.values())))
    spell = speller()
    rows = []
    for (word_id, tag), q in query.items():
        good = [f for f in forms.get(q, []) if spell(f)]
        if good:
            rows.append((word_id, tag, good[0]))
    cursor.executemany("INSERT INTO sme_passive VALUES (?, ?, ?)", rows)
    cursor.execute("CREATE INDEX idx_sme_passive ON sme_passive(word_id)")
    print(f"  {len({r[0] for r in rows})}/{len(verbs)} verbille passiivi, {len(rows)} muotoa")


if __name__ == "__main__":
    conn = sqlite3.connect(DB_FILE)
    apply(conn.cursor())
    conn.commit()
