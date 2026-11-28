"""Käyttäjän vahvistamat sanat (omat_sanat.tsv, 2026-11-28): käyttäjä on pohjoissaamen äidinkielinen puhuja.
Lisätään hakusanoina suomen-, norjan- ja englanninkielisellä käännöksellä ja esimerkillä. new_from = "fin": sana otetaan
mukaan, vaikka analysaattori ei tunne sitä (filter_new_words karsisi muuten). Taivutustaulukko tulee, jos GiellaLT:n
generaattori osaa sanan.
"""
import csv
import os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "omat_sanat.tsv")


def add(entries, by_lemma, new_meaning):
    if not os.path.exists(FILE):
        return
    n = 0
    with open(FILE, encoding="utf-8") as f:
        for r in csv.DictReader((line for line in f if not line.startswith("#")), delimiter="\t"):
            key = next((k for k in by_lemma.get(r["sme"], []) if k[1] == r["pos"]), None) or (r["sme"], r["pos"], "")
            if key not in entries:
                entries[key] = {"sem_type": "", "translations": {}, "meanings": [], "freq": None, "notes": [], "new_from": "fin"}
                by_lemma.setdefault(r["sme"], []).append(key)
                n += 1
            data = entries[key]
            for lang, col, ex in (("fin", "fi", "esimerkki_fi"), ("nob", "nb", "esimerkki_nb"), ("eng", "en", None)):
                if r.get(col) and not data["translations"].get(lang):
                    data["translations"][lang] = [r[col]]
                    m = new_meaning(lang, [r[col]])
                    if ex and r.get("esimerkki_sme") and r.get(ex):
                        m["examples"].append((r["esimerkki_sme"], r[ex], "omat"))
                    data["meanings"].append(m)
    print(f"  omat sanat: {n} uutta sanaa")


def add_paradigms(cursor):
    """Yhdyssanalle, jota generaattori ei taivuta, taivutustaulukko viimeisen osan (taipuu_kuin) muodoista: yhdyssana
    taipuu viimeisen osansa mukaan (guovtteolbmobeavdi: guovtteolbmo + beavdi, beavddi, beavddis ...). Aste kopioidaan."""
    if not os.path.exists(FILE):
        return
    n = 0
    with open(FILE, encoding="utf-8") as f:
        rows = list(csv.DictReader((line for line in f if not line.startswith("#")), delimiter="\t"))
    cols = {r[1] for r in cursor.execute("PRAGMA table_info(paradigms)")}
    for r in rows:
        base = r.get("taipuu_kuin") or ""
        if not base or not r["sme"].endswith(base):
            continue
        prefix = r["sme"][: -len(base)]
        w = cursor.execute("SELECT id FROM dictionary WHERE sme_lemma = ? AND pos = ?", (r["sme"], r["pos"])).fetchone()
        b = cursor.execute("SELECT id FROM dictionary WHERE sme_lemma = ? AND pos = ? ORDER BY id", (base, r["pos"])).fetchone()
        if not w or not b or cursor.execute("SELECT 1 FROM paradigms WHERE word_id = ? LIMIT 1", (w[0],)).fetchone():
            continue
        sel = "tag, surface, grade" if "grade" in cols else "tag, surface"
        forms = cursor.execute(f"SELECT {sel} FROM paradigms WHERE word_id = ?", (b[0],)).fetchall()
        if "grade" in cols:
            cursor.executemany("INSERT INTO paradigms (word_id, tag, surface, grade) VALUES (?, ?, ?, ?)",
                               [(w[0], t, prefix + s, g) for t, s, g in forms])
        else:
            cursor.executemany("INSERT INTO paradigms (word_id, tag, surface) VALUES (?, ?, ?)", [(w[0], t, prefix + s) for t, s in forms])
        n += 1
    print(f"  omat sanat: taivutustaulukko viimeisen osan mukaan {n} sanalle")


if __name__ == "__main__":
    # Valmiiseen satni.db:hen ilman koko tuontia: python3 omat_sanat.py
    import sqlite3
    c = sqlite3.connect(os.path.join(os.path.dirname(os.path.abspath(__file__)), "satni.db"))
    add_paradigms(c.cursor())
    c.commit()
