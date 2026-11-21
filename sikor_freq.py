"""Korpusfrekvenssit sanoille, joilta se puuttuu: SIKOR North Saami lemma frequency list 2015-10-10
(UiT Giellatekno & Divvun, CLARINO hdl:11509/106, CC BY 3.0).

Sovelluksen nykyiset frekvenssit tulevat GiellaLT:n sanakirjasta, ja ne ovat samoja SIKOR-lukuja (mediaani 1,0;
leat 1 243 409 / 1 244 613), joten puuttuvat voi täyttää samalla asteikolla. Esim. buorre (58 815) oli ilman.

Sääntö: vain sanat, joiden perusmuodolla ei ole frekvenssiä missään sanassa (homografeista GiellaLT merkitsee vain
pääsanan); ensin sama perusmuoto ja sanaluokka; muuten pelkkä perusmuoto, jos sovelluksessa on sillä vain yksi sana,
se on vähintään 3 kirjainta eikä lyhenne, ja korpuksessa vähintään 10 kertaa. Luvut tauluun
freq_sources(word_id, source, n); dictionary.freq-sarakkeeseen vain SIKOR_FILL_FREQ=1:llä (koe 2026-11-20: ei hyötyä
haulle, kuvahaulle eikä Poimi lauseelle, lausekääntäjä huononi hieman).

Aja yksin olemassa olevaan tietokantaan: python3 import_full_dict.py --vain-sikor
"""
import collections
import io
import os
import re
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ZIP = os.path.join(SCRIPT_DIR, "lahteet", "SIKOR_sme_20151010_lemma_freq.txt.zip")
SOURCE = "SIKOR 2015 (CC BY 3.0)"
MIN_FALLBACK = 10


def read_counts():
    """{(perusmuoto, sanaluokka): n} ja {perusmuoto pienellä: n}"""
    by_pos, by_lemma = collections.Counter(), collections.Counter()
    with zipfile.ZipFile(ZIP) as z:
        for line in io.TextIOWrapper(z.open(z.namelist()[0]), encoding="utf-8"):
            p = line.split()
            if len(p) < 3 or not p[0].isdigit():
                continue
            n, lemma, pos = int(p[0]), p[1], p[2]
            if pos in ("CLB", "PUNCT", "LEFT", "RIGHT", "PAREN") or not re.search(r"[^\W\d_]", lemma):
                continue
            by_pos[(lemma, pos)] += n
            by_lemma[lemma.lower()] += n
    return by_pos, by_lemma


def _abbreviation(lemma, short_ok=False):
    """Kirjain tai lyhenne (b, nr, NSR, NRK, ON): korpuksen luku on lyhenteen, ei sanan. Kaksikirjaimiset sanat
    (de, go) kelpaavat täsmälleen samalla sanaluokalla (short_ok)."""
    letters = re.sub(r"[^\w]", "", lemma)
    return len(letters) < (2 if short_ok else 3) or (len(letters) > 1 and letters.isupper()) or not re.search(r"[aeiouáyæøåäöâ]", lemma.lower())


def apply(cursor):
    if not os.path.exists(ZIP):
        print("  SIKOR: lahteet/ puuttuu (aja hae_lahteet.sh), ohitetaan")
        return
    by_pos, by_lemma = read_counts()
    cursor.execute("CREATE TABLE IF NOT EXISTS freq_sources (word_id INTEGER, source TEXT, n INTEGER)")
    cursor.execute("DELETE FROM freq_sources WHERE source = ?", (SOURCE,))
    rows = cursor.execute("SELECT id, sme_lemma, pos, freq FROM dictionary").fetchall()
    per_lemma = collections.Counter(l.lower() for _, l, _, _ in rows)
    # Homografit: GiellaLT antaa frekvenssin vain pääsanalle (de, maid). Jos jollain saman perusmuodon sanalla on jo
    # frekvenssi, muita ei täytetä: lausekääntäjä valitsi muuten sivusanan (kyllä -> de, ei gal; esimerkkikoe 2026-11-20)
    has_freq = {l.lower() for _, l, _, f in rows if f}
    filled, exact, fallback = [], 0, 0
    for wid, lemma, pos, freq in rows:
        if freq or lemma.lower() in has_freq:
            continue
        n = None if _abbreviation(lemma, short_ok=True) else by_pos.get((lemma, pos)) or by_pos.get((lemma.lower(), pos))
        if n:
            exact += 1
        elif per_lemma[lemma.lower()] == 1 and not _abbreviation(lemma) and by_lemma.get(lemma.lower(), 0) >= MIN_FALLBACK:
            n = by_lemma[lemma.lower()]
            fallback += 1
        if n:
            filled.append((n, wid))
    # Ei kirjoiteta dictionary.freq-sarakkeeseen (2026-11-20): koe ei hyödyttänyt hakua, kuvahakua eikä Poimi lausetta, ja
    # lausekääntäjä huononi (chrF 51,27 -> 51,00; korpusluku sisältää sanan kaikki merkitykset, gal -> de). Luvut jäävät
    # tauluun freq_sources myöhempää käyttöä varten.
    if os.environ.get("SIKOR_FILL_FREQ") == "1":
        cursor.executemany("UPDATE dictionary SET freq = ? WHERE id = ?", filled)
    cursor.executemany("INSERT INTO freq_sources VALUES (?, ?, ?)", [(wid, SOURCE, n) for n, wid in filled])
    print(f"  SIKOR: frekvenssi {len(filled)} sanalle (sanaluokka täsmää {exact}, pelkkä perusmuoto {fallback})")
