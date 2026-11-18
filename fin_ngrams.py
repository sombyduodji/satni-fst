"""Suomen sanaparit (bigrammit) käännösvaihtoehtojen järjestykseen: kuvan lausenäkymä ja lausekääntäjä valitsevat
vaihtoehdoista luontevimman naapurisanojen kanssa (ennen joulua, ei ennen jouluja).

LÄHDE (ks. CREDITS.md): Leipzig Corpora Collection, suomi: fin_news_2020_1M, fin_news_2022_1M,
fin_wikipedia_2021_1M (Wortschatz Leipzig, https://wortschatz.uni-leipzig.de/en/download/fin). Ladattavat
tekstikorpukset ovat CC BY -lisenssillä (https://wortschatz.uni-leipzig.de/en/usage, tarkistettu 2026-11-18;
sivuston muut tiedot ja palvelut CC BY-NC). Sovellukseen tulevat vain sanaparien määrät, ei lauseita.
Goldhahn, D., Eckart, T. & Quasthoff, U. (2012): Building Large Monolingual Dictionaries at the Leipzig Corpora
Collection: From 100 to 200 Languages. LREC 2012.

Sanasto rajataan sanoihin, joita sovellus voi tuottaa: suomen käännökset (dictionary.finnish_translation) ja niiden
taivutusmuodot (fin_forms). Pari otetaan mukaan, jos se esiintyy vähintään MIN_COUNT kertaa.

Aja: python3 fin_ngrams.py ~/.cache/satni-fst-build/corpora/leipzig/fin_*/*-sentences.txt
Norja samalla tavalla (nob_vocab, nob_bigram, nob_unigram; käännökset nob_translation, muodot nob_forms):
     python3 fin_ngrams.py --lang nob ~/.cache/satni-fst-build/corpora/leipzig/{nob,nor}_*/*-sentences.txt
     (nob_newscrawl_2019_1M, nor_wikipedia_2021_1M; sama Leipzigin CC BY -lisenssi)
Taulut satni.db:hen: fin_vocab(id, w), fin_bigram(a, b, n), fin_unigram(id, n) (sanan yleisyys: harvinainen ensimmäinen
käännös, kuten "kans", väistyy yleiselle, kuten "myös").
"""
import collections
import os
import re
import sqlite3
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
MIN_COUNT = 2
WORD = re.compile(r"[\wåäöšžæø-]+")
COLS = {"fin": "finnish_translation", "nob": "nob_translation"}


def vocabulary(con, lang="fin"):
    vocab = set()
    for (t,) in con.execute(f"SELECT {COLS[lang]} FROM dictionary WHERE {COLS[lang]} != ''"):
        vocab.update(WORD.findall(t.lower()))
    for (forms,) in con.execute(f"SELECT forms FROM {lang}_forms"):
        for cell in forms.split(";"):
            if "=" in cell:
                for f in cell.split("=", 1)[1].split("/"):
                    vocab.update(WORD.findall(f.lower()))
    return vocab


def main(paths, lang="fin"):
    con = sqlite3.connect(DB_FILE)
    vocab = vocabulary(con, lang)
    print(f"Sanasto: {len(vocab)} sanaa")
    bi = collections.Counter()
    uni = collections.Counter()
    for path in paths:
        with open(path, encoding="utf-8", errors="ignore") as f:
            for line in f:
                ws = WORD.findall(line.split("\t", 1)[-1].lower())
                for a, b in zip(ws, ws[1:]):
                    if a in vocab and b in vocab:
                        bi[(a, b)] += 1
                for w in ws:
                    if w in vocab:
                        uni[w] += 1
        print(f"{os.path.basename(path)}: {len(bi)} paria")
    pairs = [(a, b, n) for (a, b), n in bi.items() if n >= MIN_COUNT]
    unis = {w: n for w, n in uni.items() if n >= MIN_COUNT}
    used = sorted({w for a, b, _ in pairs for w in (a, b)} | set(unis))
    ids = {w: i for i, w in enumerate(used, 1)}
    con.executescript("""
        DROP TABLE IF EXISTS {L}_vocab; DROP TABLE IF EXISTS {L}_bigram; DROP TABLE IF EXISTS {L}_unigram;
        CREATE TABLE {L}_unigram (id INTEGER PRIMARY KEY, n INTEGER);
        CREATE TABLE {L}_vocab (id INTEGER PRIMARY KEY, w TEXT UNIQUE);
        CREATE TABLE {L}_bigram (a INTEGER, b INTEGER, n INTEGER, PRIMARY KEY (a, b)) WITHOUT ROWID;
    """.replace("{L}", lang))
    con.executemany(f"INSERT INTO {lang}_vocab VALUES (?,?)", ((i, w) for w, i in ids.items()))
    con.executemany(f"INSERT INTO {lang}_bigram VALUES (?,?,?)", ((ids[a], ids[b], n) for a, b, n in pairs))
    con.executemany(f"INSERT INTO {lang}_unigram VALUES (?,?)", ((ids[w], n) for w, n in unis.items()))
    con.commit()
    con.close()
    print(f"Sanapareja: {len(pairs)} (vähintään {MIN_COUNT} kertaa), sanoja {len(ids)}")


if __name__ == "__main__":
    args = sys.argv[1:]
    lang = "fin"
    if args[:1] == ["--lang"]:
        lang, args = args[1], args[2:]
    main(args, lang)
