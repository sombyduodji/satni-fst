"""Tekee satni.db:stä kevennetyn ja pakatun tietokannan web-versiota (PWA) varten: web/data/satni-web.db.gz

Tietokannan sisältö on GiellaLT:n sanakirjoista (CC BY 4.0) ja lang-sme-FST:llä (GPL-3.0) tehty
muokattu aineisto, ks. CREDITS.md. Sama tiedosto on työpöytä- ja Android-sovelluksessa.

Selaimessa tietokanta luetaan sql.js:llä (SQLite WebAssemblynä). Perusmuodoille ja käännöksille
(trans_search: yksi rivi sanaa ja kieltä kohden sekä käänteisten sanakirjojen hakusanat) lasketaan valmiiksi pienaakkosiin muutetut sarakkeet (Pythonin lower(), joka toimii myös Á, Č, Š
-kirjaimille), koska selaimen SQLite ei osaa muuttaa niitä. Taivutusmuodot haetaan sellaisenaan
(muodot ovat pienaakkosia, erisnimet isolla alkukirjaimella).
"""
import gzip
import os
import re
import shutil
import sqlite3
import subprocess

import apertium_data
import pivot_fin
import wiktionary_eng
import skolt_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DB = os.path.join(SCRIPT_DIR, "satni.db")
OUT_DIR = os.path.join(SCRIPT_DIR, "web", "data")
OUT_DB = os.path.join(OUT_DIR, "satni-web.db")

# Käännöksen aluemerkintä (patja (it)) ei kuulu haettavaan sanaan
DIALECT_MARK = re.compile(r" \((?:it|lä|ø|v|torne)\)")
# Sulkeissa oleva tarkenne käännöksessä: naida (kerran), immoral (of women), (too) fond of giving away
BRACKETED = re.compile(r"\s*\([^()]*\)\s*")


# Erikoiskirjaimet, joita Unicode-hajotus ei pura (č, á, ñ, å purkautuvat itsestään)
EXTRA_LETTERS = str.maketrans({"đ": "d", "ŋ": "n", "ŧ": "t", "æ": "ae", "ø": "o", "ß": "ss", "ł": "l"})


def without_letters(text):
    """Hakusana ilman erikoiskirjaimia ja tarkkeita (árbol -> arbol, čáhci -> cahci, vyevdi -> vyevdi). Sama kuin
    app.js:n withoutLetters."""
    import unicodedata
    text = unicodedata.normalize("NFD", text.lower().translate(EXTRA_LETTERS))
    return "".join(ch for ch in text if not unicodedata.combining(ch))


ENGLISH_ARTICLE = re.compile(r"^(?:to|a|an|the)\s+", re.I)


def without_articles(text):
    """Englannin lista ilman alun to/a/an/the-sanoja samassa järjestyksessä, tai None, jos muutosta ei ole."""
    items = [ENGLISH_ARTICLE.sub("", i) for i in split_items(text)]
    joined = ", ".join(dict.fromkeys(i for i in items if i))
    return joined if joined and joined != text else None


def split_items(text):
    """Käännöslista osiin vain sulkeiden ulkopuolisista pilkuista: "seurata (tietä, jälkiä), ajaa" ->
    ["seurata (tietä, jälkiä)", "ajaa"]."""
    items, depth, cur = [], 0, ""
    for ch in text:
        depth += (ch == "(") - (ch == ")")
        if ch == "," and depth <= 0:
            items.append(cur.strip())
            cur = ""
        else:
            cur += ch
    items.append(cur.strip())
    return [i for i in items if i]


def without_brackets(text):
    """Hakuun sama lista ilman sulkeissa olevia tarkenteita (naida (kerran) -> naida), tai None, jos sulkeita ei ole.
    Järjestys säilyy, jotta haun järjestys (ainoa, ensimmäinen vai muu käännös) pysyy samana (ks. app.js: queryDatabase)."""
    if "(" not in text:
        return None
    # Sulkematon sulku (riibat: "holde seg (frisk") katkaistaan sulun kohdalta
    items = [" ".join(BRACKETED.sub(" ", i).split("(")[0].replace(")", " ").split()) for i in split_items(text)]
    items = [i for i in items if i]
    joined = ", ".join(dict.fromkeys(items))
    return joined if joined and joined != text else None

# Sama haun normalisointi kuin gui.py:ssä: ä = æ, ö = ø
SEARCH_FOLD = str.maketrans({"æ": "ä", "ø": "ö"})


# Käännöskielet ja niiden sarakkeet satni.db:ssä (ks. import_full_dict.py)
TRANSLATION_COLUMNS = {"fin": "finnish_translation", "nob": "nob_translation", "eng": "eng_translation",
                       "smn": "smn_translation", "smj": "smj_translation", "sma": "sma_translation",
                       "spa": "spa_translation"}


def fold(text):
    return text.lower().translate(SEARCH_FOLD) if isinstance(text, str) else text


def _last_vowel_back(word):
    m = re.search(r"[aouäöy](?=[^aouäöy]*$)", word.lower())
    return bool(m) and m.group(0) in "aou"


def fin_harmony(words):
    """Suomen sanan vokaalisointu liitepartikkelia varten (-ko/-kö, -kaan/-kään, -han/-hän): 1 = takavokaalinen.

    Yhdyssanassa sointu määräytyy jälkiosasta (posti+merkki -> postimerkkikö), jonka GiellaLT lang-fin -analysaattori
    erottaa (Cmp#). Jälkiosa, jossa on vain e/i, on etuvokaalinen. Ilman analysaattoria (giella-fin puuttuu) käytetään
    sanan viimeistä a/o/u- tai ä/ö/y-vokaalia (oikein ~98 %:ssa, väärin juuri näissä yhdyssanoissa).
    """
    words = sorted(words)
    out = {w: _last_vowel_back(w) for w in words}
    analyser = os.path.join(SCRIPT_DIR, "giella-fin", "analyser-gt-desc.hfstol")
    if not os.path.exists(analyser) or not shutil.which("hfst-lookup"):
        print("Suomen vokaalisointu: giella-fin tai hfst-lookup puuttuu, käytetään viimeistä vokaalia")
        return {w: int(b) for w, b in out.items()}
    res = subprocess.run(["hfst-lookup", "-q", analyser], input="\n".join(words) + "\n",
                         capture_output=True, text=True, check=True).stdout
    analyses = {}
    for line in res.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and not parts[1].endswith("+?") and "Cmp#" in parts[1]:
            # eniten osia sisältävä analyysi: lapin+kurjen+herne
            if parts[1].count("Cmp#") > analyses.get(parts[0], "").count("Cmp#"):
                analyses[parts[0]] = parts[1]
    for w, a in analyses.items():
        last = a.split("Cmp#")[-1].split("+")[0].lower()
        has_back, has_front = re.search(r"[aou]", last), re.search(r"[äöy]", last)
        if has_back and not has_front:
            out[w] = True
        elif has_front and not has_back or not has_back:
            out[w] = False
    print(f"Suomen vokaalisointu: {len(words)} sanaa, yhdyssanoja {len(analyses)}")
    return {w: int(b) for w, b in out.items()}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if os.path.exists(OUT_DB):
        os.remove(OUT_DB)

    src = sqlite3.connect(SOURCE_DB)
    dst = sqlite3.connect(OUT_DB)
    dst.execute("PRAGMA page_size = 4096")
    dst.executescript("""
        CREATE TABLE dictionary (
            id INTEGER PRIMARY KEY, sme_lemma TEXT, pos TEXT, subtype TEXT, finnish_translation TEXT,
            nob_translation TEXT, eng_translation TEXT, smn_translation TEXT, smj_translation TEXT,
            sma_translation TEXT, spa_translation TEXT, notes TEXT, gradation TEXT, gd_cluster TEXT, hd_cluster TEXT,
            -- freq: korpusfrekvenssi (GiellaLT), haun tasatilanteisiin (web/app.js: queryDatabase)
            gradation_group TEXT, gradation_row TEXT, inflection_class TEXT, freq INTEGER, dialect TEXT, dial_same TEXT, dial_other TEXT,
            -- dial_same: saman sanan toinen kirjoitusasu (dialects.py), jolla sanakin löytyy
            lemma_fold TEXT, variant_fold TEXT,
            -- human: ihmistä tarkoittava substantiivi (semantics.py): suomen -lle/-lla/-lta saa saamen muodon
            human INTEGER
        );
        -- nr: käänteisen sanakirjan (dict-fin-sme, dict-nob-sme) järjestys, 0 = ensisijainen saamennos;
        -- NULL = sanan oma käännös (dict-sme-*)
        CREATE TABLE trans_search (word_id INTEGER, lang TEXT, fold TEXT, nr INTEGER);
        -- Muiden kielten hakusanat ilman erikoiskirjaimia (arbol -> árbol, cahci -> čáhci): "Tarkoititko"-ehdotukset
        CREATE TABLE trans_bare (lang TEXT, bare TEXT, term TEXT);
        -- Taivutustagit (Ind+Prs+Sg1 ...) numeroina: sama merkkijono toistuisi muuten lähes miljoona kertaa
        CREATE TABLE tags (id INTEGER PRIMARY KEY, tag TEXT);
        CREATE TABLE paradigms (word_id INTEGER, tag_id INTEGER, surface TEXT, grade TEXT);
        CREATE TABLE meanings (word_id INTEGER, lang TEXT, nr INTEGER, translations TEXT, explanations TEXT,
                               restrictions TEXT, labels TEXT, geo TEXT);
        CREATE TABLE examples (word_id INTEGER, lang TEXT, meaning_nr INTEGER, sme TEXT, translation TEXT,
                               source TEXT);
        -- Käännösten taivutus: norja (Norsk ordbank, nob_forms.py) ja suomi (GiellaLT lang-fin, fin_forms.py).
        -- WITHOUT ROWID: avain toimii hakemistona, eikä erillistä indeksiä (sanojen kopiota) tarvita
        CREATE TABLE nob_forms (word TEXT, pos TEXT, forms TEXT, PRIMARY KEY (word, pos)) WITHOUT ROWID;
        -- back: vokaalisointu liitepartikkelia varten (1 = tuletko, talossako; 0 = menetkö, postimerkillekö), ks. fin_harmony
        CREATE TABLE fin_forms (word TEXT, pos TEXT, forms TEXT, back INTEGER, PRIMARY KEY (word, pos)) WITHOUT ROWID;
        -- Koltansaame (kokeellinen, skolt_data.py): suomen/norjan sanan vahvimmat koltan vastineet ("a, b, c")
        CREATE TABLE sms (lang TEXT, fold TEXT, pos TEXT, words TEXT, PRIMARY KEY (lang, fold, pos)) WITHOUT ROWID;
        -- Apertium (kokeellinen, apertium_data.py): norjan käännös sanoille, joilla sitä ei muuten ole
        CREATE TABLE apertium (word_id INTEGER PRIMARY KEY, nob TEXT) WITHOUT ROWID;
        -- Suomennosehdotukset (kokeellinen, pivot_fin.py): via = smn (inarinsaamen kautta) tai nob (norjan kautta)
        CREATE TABLE pivot_fin (word_id INTEGER PRIMARY KEY, fin TEXT, via TEXT) WITHOUT ROWID;
        -- Englanti Wiktionarysta suomen ja norjan kautta, kun molemmat antavat saman (wiktionary_eng.py, tarkistamaton)
        CREATE TABLE wikt_eng (word_id INTEGER PRIMARY KEY, eng TEXT) WITHOUT ROWID;
        -- Loukkaavat, halventavat ja alatyyliset käännössanat (Wiktionaryn merkinnät, käyty käsin läpi; wiktionary_eng.py)
        CREATE TABLE register (lang TEXT, term TEXT, tag TEXT, PRIMARY KEY (lang, term)) WITHOUT ROWID;
    """)

    trans_cols = ", ".join(TRANSLATION_COLUMNS.values())
    src_cols = [r[1] for r in src.execute("PRAGMA table_info(dictionary)")]
    rows = src.execute(
        f"SELECT id, sme_lemma, pos, subtype, {trans_cols}, notes, gradation, gd_cluster, hd_cluster, "
        "gradation_group, gradation_row, inflection_class, freq, dialect, dial_same, dial_other, "
        f"{'human' if 'human' in src_cols else 'NULL'} FROM dictionary"
    ).fetchall()
    # human viimeisenä (lemma_fold ja variant_fold ennen sitä, kuten taulussa)
    dst.executemany(f"INSERT INTO dictionary VALUES ({', '.join('?' * (len(rows[0]) + 2))})",
                    [r[:-1] + (fold(r[1]), fold(r[-3]) if r[-3] else None, r[-1]) for r in rows])
    # Hakuun käännös sellaisenaan ja toisena rivinä ilman sulkeissa olevia tarkenteita, jotta naida löytää sanan,
    # jonka käännös on "naida (kerran)" (koko haun tarkistus 2026-11-06: noin 3 400 sanaa ei muuten löytynyt)
    search_rows = []
    for r in rows:
        for i, lang in enumerate(TRANSLATION_COLUMNS):
            if r[4 + i]:
                text = DIALECT_MARK.sub("", r[4 + i])
                search_rows.append((r[0], lang, fold(text), None))
                bare = without_brackets(text)
                if bare:
                    search_rows.append((r[0], lang, fold(bare), None))
                # Englanti myös ilman alun to/a/an/the: read löytää "to read", spouse "a spouse"
                if lang == "eng":
                    plain = without_articles(bare or text)
                    if plain:
                        search_rows.append((r[0], lang, fold(plain), None))
    for w, lang, head, nr in src.execute("SELECT word_id, lang, headword, MIN(nr) FROM reverse_index GROUP BY word_id, lang, headword"):
        search_rows.append((w, lang, fold(head), nr))
        bare = without_brackets(head)
        if bare:
            search_rows.append((w, lang, fold(bare), nr))
    dst.executemany("INSERT INTO trans_search VALUES (?, ?, ?, ?)", search_rows)
    bare_rows = {(lang, without_letters(term), term) for _, lang, text, _ in search_rows if lang not in ("fin", "nob")
                 for term in text.split(", ") if term and without_letters(term) != term}
    dst.executemany("INSERT INTO trans_bare VALUES (?, ?, ?)", sorted(bare_rows))
    print(f"Tarkoititko-hakusanat muilla kielillä: {len(bare_rows)}")

    tag_ids = {}
    for (tag,) in src.execute("SELECT DISTINCT tag FROM paradigms ORDER BY tag"):
        tag_ids[tag] = len(tag_ids) + 1
    dst.executemany("INSERT INTO tags VALUES (?, ?)", [(i, t) for t, i in tag_ids.items()])
    dst.executemany(
        "INSERT INTO paradigms VALUES (?,?,?,?)",
        ((w, tag_ids[t], s, g) for w, t, s, g in
         src.execute("SELECT word_id, tag, surface, grade FROM paradigms ORDER BY word_id, rowid"))
    )
    dst.executemany("INSERT INTO meanings VALUES (?,?,?,?,?,?,?,?)", src.execute(
        "SELECT word_id, lang, nr, translations, explanations, restrictions, labels, geo FROM meanings "
        "ORDER BY word_id, rowid"))
    dst.executemany("INSERT INTO examples VALUES (?,?,?,?,?,?)", src.execute(
        "SELECT word_id, lang, meaning_nr, sme, translation, source FROM examples ORDER BY word_id, rowid"))

    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'nob_forms'").fetchone():
        dst.executemany("INSERT INTO nob_forms VALUES (?,?,?)",
                        src.execute("SELECT word, pos, forms FROM nob_forms ORDER BY word, pos"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'fin_forms'").fetchone():
        rows = src.execute("SELECT word, pos, forms FROM fin_forms ORDER BY word, pos").fetchall()
        back = fin_harmony({r[0] for r in rows})
        dst.executemany("INSERT INTO fin_forms VALUES (?,?,?,?)", ((w, p, f, back.get(w)) for w, p, f in rows))

    sms_rows = {(lang, fold(word), pos): words for lang, word, pos, words in skolt_data.rows(SCRIPT_DIR)}
    dst.executemany("INSERT INTO sms VALUES (?,?,?,?)", ((*k, v) for k, v in sms_rows.items()))
    print(f"Koltansaame: {len(sms_rows)} riviä" if sms_rows else "Koltansaame: sanakirjoja ei löytynyt (hae_sanakirjat.sh)")

    apertium_rows = apertium_data.rows(src)
    dst.executemany("INSERT INTO apertium VALUES (?,?)", apertium_rows)
    print(f"Apertium: {len(apertium_rows)} riviä" if apertium_rows else "Apertium: apertium-sme-nob-lähdettä ei löytynyt")

    wikt_rows = wiktionary_eng.agree_rows(src)
    dst.executemany("INSERT INTO wikt_eng VALUES (?,?)", wikt_rows)
    print(f"Wiktionaryn englanti suomen ja norjan kautta: {len(wikt_rows)} riviä" if wikt_rows else "Wiktionary: wiktionary/ puuttuu (python3 wiktionary_eng.py --hae)")

    register_rows = wiktionary_eng.register_rows(src)
    dst.executemany("INSERT INTO register VALUES (?,?,?)", register_rows)
    print(f"Tyylimerkinnät (loukkaava, halventava, alatyylinen): {len(register_rows)} käännössanaa")

    pivot_rows = pivot_fin.rows(src)
    dst.executemany("INSERT INTO pivot_fin VALUES (?,?,?)", pivot_rows)
    print(f"Suomennosehdotukset: {len(pivot_rows)} riviä" if pivot_rows else "Suomennosehdotukset: dict-smn-fin puuttuu (hae_sanakirjat.sh)")

    dst.executescript("""
        CREATE INDEX idx_lemma_fold ON dictionary(lemma_fold);
        CREATE INDEX idx_variant_fold ON dictionary(variant_fold);
        CREATE INDEX idx_paradigms_word ON paradigms(word_id);
        CREATE INDEX idx_paradigms_surface ON paradigms(surface);
        CREATE INDEX idx_meanings_word ON meanings(word_id);
        CREATE INDEX idx_trans_bare ON trans_bare(bare);
        CREATE INDEX idx_examples_word ON examples(word_id);
    """)
    dst.commit()
    dst.execute("VACUUM")
    dst.close()
    src.close()

    with open(OUT_DB, "rb") as f_in, gzip.open(OUT_DB + ".gz", "wb", compresslevel=9) as f_out:
        shutil.copyfileobj(f_in, f_out)
    raw, packed = os.path.getsize(OUT_DB), os.path.getsize(OUT_DB + ".gz")
    os.remove(OUT_DB)
    print(f"web/data/satni-web.db.gz: {packed / 1e6:.1f} Mt (purettuna {raw / 1e6:.1f} Mt)")


if __name__ == "__main__":
    main()
