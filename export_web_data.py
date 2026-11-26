"""Tekee satni.db:stä kevennetyn ja pakatun tietokannan web-versiota (PWA) varten: web/data/satni-web.db.gz

Tietokannan sisältö on GiellaLT:n sanakirjoista (CC BY 4.0) ja lang-sme-FST:llä (GPL-3.0) tehty
muokattu aineisto, ks. CREDITS.md. Sama tiedosto on työpöytä- ja Android-sovelluksessa.

Selaimessa tietokanta luetaan sql.js:llä (SQLite WebAssemblynä). Perusmuodoille ja käännöksille
(trans_search: yksi rivi sanaa ja kieltä kohden sekä käänteisten sanakirjojen hakusanat) lasketaan valmiiksi pienaakkosiin muutetut sarakkeet (Pythonin lower(), joka toimii myös Á, Č, Š
-kirjaimille), koska selaimen SQLite ei osaa muuttaa niitä. Taivutusmuodot haetaan sellaisenaan
(muodot ovat pienaakkosia, erisnimet isolla alkukirjaimella).
"""
import collections
import gzip
import os
import re
import shutil
import sqlite3
import subprocess
import unicodedata

import apertium_data
import pivot_fin
import sanaperhe
import der_fin
import cmp_fin
import wiktionary_eng
import fin_also
import fin_compound
import sme_compound
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



def eng_mt_table(src, lang="eng"):
    """eng_mt.tsv (eng_mt.py) tai fin_mt.tsv (fin_mt.py) -> [(word_id, käännös, taso)] sanoille, joilla ei ole
    sanakirjan käännöstä kyseisellä kielellä."""
    path = os.path.join(SCRIPT_DIR, f"{lang}_mt.tsv")
    if not os.path.exists(path):
        return []
    ids = collections.defaultdict(list)
    for i, lemma, pos in src.execute(
            "SELECT id, sme_lemma, pos FROM dictionary d WHERE NOT EXISTS "
            "(SELECT 1 FROM meanings m WHERE m.word_id = d.id AND m.lang = ?)", (lang,)):
        ids[(lemma, pos)].append(i)
    out = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("#"):
                continue
            lemma, pos, eng, level, _ = line.rstrip("\n").split("\t")
            for i in ids.get((lemma, pos), []):
                out.setdefault(i, (i, eng, int(level)))  # sama sana kahdesti (eri merkitys): ensimmäinen
    return list(out.values())

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
# Haun vertailumuoto (selain: app.js fold + cleanQuery): norjan æ/ø suomen ä/ö:ksi, kaarevat heittomerkit ':ksi
SAMI_PLAIN = str.maketrans({"á": "a", "č": "c", "đ": "d", "ŋ": "n", "š": "s", "ŧ": "t", "ž": "z"})
SEARCH_FOLD = str.maketrans({"æ": "ä", "ø": "ö", "\u2019": "'", "\u2018": "'", "\u02bc": "'"})


# Käännöskielet ja niiden sarakkeet satni.db:ssä (ks. import_full_dict.py)
TRANSLATION_COLUMNS = {"fin": "finnish_translation", "nob": "nob_translation", "eng": "eng_translation",
                       "smn": "smn_translation", "smj": "smj_translation", "sma": "sma_translation",
                       "spa": "spa_translation"}


def lemma_without_brackets(lemma):
    """Fraasin keskellä sulkeissa oleva osa (bidjat (bargi) bággolupmui): haku löytää fraasin myös ilman sitä."""
    if "(" not in lemma:
        return None
    bare = " ".join(re.sub(r"\([^()]*\)", " ", lemma).split())
    return fold(bare) if bare and bare != lemma else None


def smn_fold(text):
    """Inarin sana ilman tarkkeita (sama kuin web/app.js: smnFold): â á ä -> a, č -> c, đ -> d, ŋ -> n, š -> s, ž -> z"""
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return text.replace("đ", "d").replace("ŋ", "n").replace("ŧ", "t")


def minority_fold(lang, text):
    """Inarin/koltan sana tarkkeettomana (sama kuin web/app.js: minorFold). Koltasta myös ʹ ja ' pois, ǥ -> g, ʒ -> z."""
    text = smn_fold(text)
    if lang == "sms":
        text = re.sub(r"[ʹ'’ʼ]", "", text).replace("ǥ", "g").replace("ʒ", "z")
    return text


NGRAM_MIN = 3  # sanapari mukaan, jos se esiintyy vähintään näin monesti (koe 2026-11-18: 3 = 5,6 Mt, 5 = 3,2 Mt)


def export_fin_ngram(src, lang="fin"):
    """Suomen sanaparit (fin_ngrams.py, Leipzig Corpora Collection, CC BY) omaan tiedostoonsa
    web/data/satni-fin-ngram.db.gz: kuvan lausenäkymä lataa sen vain, kun valokuvahaku on käytössä."""
    out = os.path.join(OUT_DIR, f"satni-{lang}-ngram.db")
    if os.path.exists(out):
        os.remove(out)
    if not src.execute(f"SELECT 1 FROM sqlite_master WHERE name = '{lang}_bigram'").fetchone():
        print(f"{lang}_bigram puuttuu satni.db:stä (python3 fin_ngrams.py ...)")
        return
    m = sqlite3.connect(out)
    m.executescript("""
        CREATE TABLE fin_vocab (id INTEGER PRIMARY KEY, w TEXT UNIQUE);
        CREATE TABLE fin_bigram (a INTEGER, b INTEGER, n INTEGER, PRIMARY KEY (a, b)) WITHOUT ROWID;
    """)
    # Sovellus lukee aina taulut fin_vocab, fin_bigram, fin_unigram (tiedosto on kielikohtainen)
    pairs = src.execute(f"SELECT a, b, n FROM {lang}_bigram WHERE n >= ?", (NGRAM_MIN,)).fetchall()
    m.executemany("INSERT INTO fin_bigram VALUES (?,?,?)", pairs)
    m.execute("CREATE TABLE fin_unigram (id INTEGER PRIMARY KEY, n INTEGER)")
    unis = src.execute(f"SELECT id, n FROM {lang}_unigram WHERE n >= ?", (NGRAM_MIN,)).fetchall() if src.execute(
        f"SELECT 1 FROM sqlite_master WHERE name = '{lang}_unigram'").fetchone() else []
    # Suomen sanojen yleisyys vain Voikon hyväksymille sanoille (2026-11-19): yhdyssanan suomennos näytetään
    # kokonaisena vain, jos yhdistelmä on tässä taulussa, joten sukunimet (uusitalo), kirjoitusvirheet ja tuntemattomat
    # sanat eivät voi vahvistaa sitä. Ilman Voikkoa taulu jää ennalleen.
    if lang == "fin" and unis:
        try:
            import libvoikko
            voikko = libvoikko.Voikko("fi")
            words = dict(src.execute(f"SELECT id, w FROM {lang}_vocab"))
            before = len(unis)
            unis = [(i, n) for i, n in unis if voikko.spell(words.get(i, ""))]
            print(f"fin_unigram: {len(unis)} / {before} sanaa Voikon hyväksymiä")
        except Exception as e:  # noqa: BLE001
            print(f"fin_unigram: Voikko puuttuu ({e}), kaikki sanat mukaan")
    m.executemany("INSERT INTO fin_unigram VALUES (?,?)", unis)
    used = {x for a, b, _ in pairs for x in (a, b)} | {i for i, _ in unis}
    m.executemany("INSERT INTO fin_vocab VALUES (?,?)", ((i, w) for i, w in src.execute(f"SELECT id, w FROM {lang}_vocab") if i in used))
    m.commit()
    m.execute("VACUUM")
    m.close()
    with open(out, "rb") as f_in, gzip.open(out + ".gz", "wb", compresslevel=9) as f_out:
        shutil.copyfileobj(f_in, f_out)
    packed = os.path.getsize(out + ".gz")
    os.remove(out)
    print(f"web/data/satni-{lang}-ngram.db.gz: {packed / 1e6:.1f} Mt ({len(pairs)} sanaparia)")


def export_minor(src, lang, cols):
    """Inarin/koltan kuvatunnistuksen taulut omaan tiedostoonsa web/data/satni-{lang}.db.gz: sovellus lataa sen vain,
    kun kieli on valittu kuvan kieleksi asetuksista (muisti: noin 25-35 Mt kieltä kohden)."""
    out = os.path.join(OUT_DIR, f"satni-{lang}.db")
    if os.path.exists(out):
        os.remove(out)
    if not src.execute(f"SELECT 1 FROM sqlite_master WHERE name = '{lang}_forms'").fetchone():
        print(f"{lang}: {lang}_forms puuttuu satni.db:stä (python3 {lang}_data.py)")
        return
    m = sqlite3.connect(out)
    m.execute("PRAGMA page_size = 4096")
    ncols = len(cols.split(","))
    extra = ", nob TEXT" if "nob" in cols else ""
    m.executescript(f"""
        CREATE TABLE tags (id INTEGER PRIMARY KEY, tag TEXT);
        CREATE TABLE {lang}_words (id INTEGER PRIMARY KEY, lemma TEXT, pos TEXT, fin TEXT{extra}, sme TEXT);
        CREATE TABLE {lang}_forms (fold TEXT, surface TEXT, word_id INTEGER, tag_id INTEGER,
                                   PRIMARY KEY (fold, surface, word_id, tag_id)) WITHOUT ROWID;
        CREATE TABLE {lang}_cmp (stem TEXT PRIMARY KEY, word_id INTEGER) WITHOUT ROWID;
    """)
    m.executemany(f"INSERT INTO {lang}_words ({cols}) VALUES ({','.join('?' * ncols)})", src.execute(f"SELECT {cols} FROM {lang}_words ORDER BY id"))
    tag_ids, n, rows = {}, 0, []
    for surface, wid, tag in src.execute(f"SELECT surface, word_id, tag FROM {lang}_forms"):
        if tag not in tag_ids:
            tag_ids[tag] = len(tag_ids) + 1
            m.execute("INSERT INTO tags VALUES (?,?)", (tag_ids[tag], tag))
        rows.append((minority_fold(lang, surface), surface, wid, tag_ids[tag]))
        if len(rows) >= 50000:
            m.executemany(f"INSERT OR IGNORE INTO {lang}_forms VALUES (?,?,?,?)", rows)
            n += len(rows)
            rows = []
    m.executemany(f"INSERT OR IGNORE INTO {lang}_forms VALUES (?,?,?,?)", rows)
    n += len(rows)
    m.executemany(f"INSERT INTO {lang}_cmp VALUES (?,?)", src.execute(f"SELECT stem, word_id FROM {lang}_cmp"))
    m.commit()
    m.execute("VACUUM")
    m.close()
    with open(out, "rb") as f_in, gzip.open(out + ".gz", "wb", compresslevel=9) as f_out:
        shutil.copyfileobj(f_in, f_out)
    raw, packed = os.path.getsize(out), os.path.getsize(out + ".gz")
    os.remove(out)
    print(f"{lang}: {n} muotoa -> web/data/satni-{lang}.db.gz {packed / 1e6:.1f} Mt (purettuna {raw / 1e6:.1f} Mt)")



def sms_plain(word):
    """Koltan sana ilman erikoismerkkejä (sama kuin app.js smsPlain): pehmennysmerkki ja heittomerkit pois, õ ǩ ǥ ʒ ǯ â đ š č ž -> perusmerkit."""
    w = re.sub(r"[ʹ'’ʼ]", "", word.lower())
    return w.translate(str.maketrans("õǩǥʒǯâđščžŋ", "okgzzadsczn"))

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
            human INTEGER,
            -- sem: lausekääntäjän sijasäännöt muille substantiiveille (semantics.py): surf, com tai place
            sem TEXT
        );
        -- nr: käänteisen sanakirjan (dict-fin-sme, dict-nob-sme) järjestys, 0 = ensisijainen saamennos;
        -- NULL = sanan oma käännös (dict-sme-*)
        CREATE TABLE trans_search (word_id INTEGER, lang TEXT, fold TEXT, nr INTEGER);
        -- Muiden kielten hakusanat ilman erikoiskirjaimia (arbol -> árbol, cahci -> čáhci): "Tarkoititko"-ehdotukset
        CREATE TABLE trans_bare (lang TEXT, bare TEXT, term TEXT);
        -- Taivutustagit (Ind+Prs+Sg1 ...) numeroina: sama merkkijono toistuisi muuten lähes miljoona kertaa
        CREATE TABLE tags (id INTEGER PRIMARY KEY, tag TEXT);
        -- WITHOUT ROWID ja avain (word_id, ord): sanan muodot ovat peräkkäin, eikä word_id-indeksiä tarvita
        -- (17 Mt pienempi, pakattuna noin 4,5 Mt); ord = muotojen järjestys taulukossa (ennen rowid)
        CREATE TABLE paradigms (word_id INTEGER, ord INTEGER, tag_id INTEGER, surface TEXT, grade TEXT,
                                PRIMARY KEY (word_id, ord)) WITHOUT ROWID;
        CREATE TABLE meanings (word_id INTEGER, lang TEXT, nr INTEGER, translations TEXT, explanations TEXT,
                               restrictions TEXT, labels TEXT, geo TEXT);
        CREATE TABLE examples (word_id INTEGER, lang TEXT, meaning_nr INTEGER, sme TEXT, translation TEXT,
                               source TEXT);
        -- Pohjoissaamenkieliset määritelmät (sme_definitions.py, GiellaLT dict-sme): synonyms pilkuin, examples rivinvaihdoin
        CREATE TABLE sme_definitions (word_id INTEGER, nr INTEGER, definition TEXT, synonyms TEXT, examples TEXT);
        -- test-lahteet: sukulaissanat muissa saamen kielissä (algu_related.py, Álgu / Kotus, CC BY 4.0)
        CREATE TABLE related_sami (word_id INTEGER, lang TEXT, word TEXT);
        -- test-lahteet: Norjan saamenkieliset paikannimet (kartverket_names.py, Kartverket, CC BY 4.0)
        CREATE TABLE placenames (sme TEXT, nob TEXT, smj TEXT, sma TEXT, type TEXT, municipality TEXT);
        -- Käännösten taivutus: norja (Norsk ordbank, nob_forms.py) ja suomi (GiellaLT lang-fin, fin_forms.py).
        -- WITHOUT ROWID: avain toimii hakemistona, eikä erillistä indeksiä (sanojen kopiota) tarvita
        CREATE TABLE nob_forms (word TEXT, pos TEXT, forms TEXT, PRIMARY KEY (word, pos)) WITHOUT ROWID;
        -- back: vokaalisointu liitepartikkelia varten (1 = tuletko, talossako; 0 = menetkö, postimerkillekö), ks. fin_harmony
        CREATE TABLE fin_forms (word TEXT, pos TEXT, forms TEXT, back INTEGER, PRIMARY KEY (word, pos)) WITHOUT ROWID;
        -- Suomen yhdyssanan alkuosat (viranomais -> viranomainen, kansan -> kansa), Voikolla tarkistetut (fin_compound.py):
        -- kuvan tunnistuksessa sanakirjasta puuttuva yhdyssana jaetaan osiin (web/app.js: splitFinCompound)
        CREATE TABLE fin_cmp (stem TEXT, word TEXT, PRIMARY KEY (stem, word)) WITHOUT ROWID;
        -- Pohjoissaamen yhdyssanan alkumuodot (geaidno -> geaidnu, joavko -> joavku), oikoluvulla tarkistetut
        -- (sme_compound.py): kuvan tuntemattoman sanan jako osiin (web/app.js: splitCompound)
        CREATE TABLE sme_cmp (stem TEXT PRIMARY KEY, lemma TEXT) WITHOUT ROWID;
        -- Saamen passiivi (sme_passive.py, GiellaLT lang-sme): lausekääntäjän suomen passiiville (maksetaan = máksojuvvo)
        CREATE TABLE sme_passive (word_id INTEGER, tag TEXT, surface TEXT, PRIMARY KEY (word_id, tag)) WITHOUT ROWID;
        -- Omistusliitteelliset muodot ja vertailumuotojen essiivit (sme_extra.py: SIKOR CC BY 3.0 + GiellaLT lang-sme)
        CREATE TABLE sme_extra (word_id INTEGER, tag TEXT, surface TEXT, PRIMARY KEY (word_id, tag, surface)) WITHOUT ROWID;
        -- SIKOR-korpusfrekvenssi sanoille, joilta GiellaLT:n frekvenssi puuttuu (sikor_freq.py; buorre 58 815):
        -- vain homografien vertailuun lauseessa, ei hakujärjestykseen
        CREATE TABLE sikor_freq (word_id INTEGER PRIMARY KEY, n INTEGER) WITHOUT ROWID;
        -- Sanamuodon tavallinen lukutapa korpuksessa (sme_dominant.py, SIKOR): garra = garas (A), orru = orrut (V)
        CREATE TABLE sme_dominant (surface TEXT PRIMARY KEY, lemma TEXT, pos TEXT, share REAL) WITHOUT ROWID;
        -- Saamen sanamuotojen esiintymät sanakirjan esimerkkilauseissa: lausekääntäjä valitsee rinnakkaismuodoista
        -- yleisimmän (lei eikä leai: 465 / 1)
        CREATE TABLE sme_seen (form TEXT PRIMARY KEY, n INTEGER) WITHOUT ROWID;
        -- Suomen käännöslistan sanat yksitellen (trans_search.fold pilkuista jaettuna): lausekääntäjän haku indeksillä
        -- LIKE '%, sana'-haun sijaan (17 ms -> 0,01 ms hakua kohden); first = 0, kun sana on listan ensimmäinen
        CREATE TABLE fin_items (item TEXT, word_id INTEGER, first INTEGER, nr INTEGER, PRIMARY KEY (item, word_id)) WITHOUT ROWID;
        -- Sama norjalle: haku rajaa trans_search-rivit näiden avulla eikä käy kaikkia läpi (13 ms -> 0,1 ms)
        CREATE TABLE nob_items (item TEXT, word_id INTEGER, first INTEGER, nr INTEGER, PRIMARY KEY (item, word_id)) WITHOUT ROWID;
        -- Käännöksen taivutusmuodot, joiden kaksi ensimmäistä kirjainta eroavat perusmuodosta (aika -> ajan, bok -> bøker):
        -- muuten muoto haetaan perusmuodon alkukirjainten avainvälistä (translationFormsOf)
        CREATE TABLE fin_form_alt (form TEXT, word TEXT, pos TEXT, PRIMARY KEY (form, word, pos)) WITHOUT ROWID;
        CREATE TABLE nob_form_alt (form TEXT, word TEXT, pos TEXT, PRIMARY KEY (form, word, pos)) WITHOUT ROWID;
        -- Koltansaame (kokeellinen, skolt_data.py): suomen/norjan sanan vahvimmat koltan vastineet ("a, b, c")
        CREATE TABLE sms (lang TEXT, fold TEXT, pos TEXT, words TEXT, PRIMARY KEY (lang, fold, pos)) WITHOUT ROWID;
        -- Apertium (kokeellinen, apertium_data.py): norjan käännös sanoille, joilla sitä ei muuten ole
        CREATE TABLE apertium (word_id INTEGER PRIMARY KEY, nob TEXT) WITHOUT ROWID;
        -- Suomennosehdotukset (kokeellinen, pivot_fin.py): via = smn (inarinsaamen kautta) tai nob (norjan kautta)
        CREATE TABLE pivot_fin (word_id INTEGER PRIMARY KEY, fin TEXT, via TEXT) WITHOUT ROWID;
        -- Johdokset (der_fin.py): pohjasanat yhdyssanojen käännökseen ja johdetut -vuohta-suomennokset (-uus/-yys)
        CREATE TABLE der_base (word_id INTEGER PRIMARY KEY, bases TEXT) WITHOUT ROWID;
        CREATE TABLE der_fin (word_id INTEGER PRIMARY KEY, fin TEXT, base TEXT, suffix TEXT) WITHOUT ROWID;
        -- Johdos sanasta X (der_fin.der_of_rows, 2026-11-24): sanakortti näyttää pohjasanan, kun käännös puuttuu
        CREATE TABLE der_of (word_id INTEGER PRIMARY KEY, base TEXT, base_id INTEGER) WITHOUT ROWID;
        -- Sanaperhe (sanaperhe.py, 2026-11-24): johdos -> pohjasana (kind der, tag = johdin) ja yhdyssana -> osa (kind cmp,
        -- nr = osan järjestys); vain analysaattorin varmat linkit hakusanojen välillä. Sanakortin Sanaperhe-välilehti.
        CREATE TABLE family (child_id INTEGER, kind TEXT, parent_id INTEGER, nr INTEGER, tag TEXT,
                             PRIMARY KEY (child_id, kind, parent_id, nr)) WITHOUT ROWID;
        -- Yhdyssanojen tarkistetut suomennokset sanoille ilman suomennosta (cmp_fin.py, cmp_fin_hyvaksytyt.tsv)
        CREATE TABLE cmp_fin (word_id INTEGER PRIMARY KEY, fin TEXT, parts TEXT) WITHOUT ROWID;
        -- Englanti Wiktionarysta suomen ja norjan kautta, kun molemmat antavat saman (wiktionary_eng.py, tarkistamaton)
        CREATE TABLE wikt_eng (word_id INTEGER PRIMARY KEY, eng TEXT) WITHOUT ROWID;
        -- Konekäännetty englanti (kokeellinen, eng_mt.py / eng_mt.tsv): sanoille ilman englantia, kun vähintään kaksi
        -- reittiä (saame, suomi, norja -> englanti) antaa saman sanan; level 3 = kaikki kolme, 2 = kaksi
        CREATE TABLE eng_mt (word_id INTEGER PRIMARY KEY, eng TEXT, level INTEGER) WITHOUT ROWID;
        -- Konekäännetyt suomennosehdotukset (kokeellinen, fin_mt.py / fin_mt.tsv), samat säännöt riippumattomin reitein
        CREATE TABLE fin_mt (word_id INTEGER PRIMARY KEY, fin TEXT, level INTEGER) WITHOUT ROWID;
        -- Konekäännetty espanja (kokeellinen, spa_mt.py / spa_mt.tsv): vähintään kolme lähdettä samaa mieltä
        CREATE TABLE spa_mt (word_id INTEGER PRIMARY KEY, spa TEXT, level INTEGER) WITHOUT ROWID;
        -- Konekäännetty saksa (kokeellinen BETA-kieli, deu_mt.py / deu_mt.tsv): ei sanakirjaa, vähintään 3/5 lähdettä
        CREATE TABLE deu_mt (word_id INTEGER PRIMARY KEY, deu TEXT, level INTEGER) WITHOUT ROWID;
        -- Lisäsuomennokset käänteisestä dict-fin-sme:stä sanakortin Merkitykset-välilehdelle (fin_also.py)
        CREATE TABLE fin_also (word_id INTEGER PRIMARY KEY, items TEXT) WITHOUT ROWID;
        -- Loukkaavat, halventavat ja alatyyliset käännössanat (Wiktionaryn merkinnät, käyty käsin läpi; wiktionary_eng.py)
        CREATE TABLE register (lang TEXT, term TEXT, tag TEXT, PRIMARY KEY (lang, term)) WITHOUT ROWID;
    """)

    trans_cols = ", ".join(TRANSLATION_COLUMNS.values())
    src_cols = [r[1] for r in src.execute("PRAGMA table_info(dictionary)")]
    rows = src.execute(
        f"SELECT id, sme_lemma, pos, subtype, {trans_cols}, notes, gradation, gd_cluster, hd_cluster, "
        "gradation_group, gradation_row, inflection_class, freq, dialect, dial_same, dial_other, "
        f"{'human' if 'human' in src_cols else 'NULL'}, {'sem' if 'sem' in src_cols else 'NULL'} FROM dictionary"
    ).fetchall()
    # human ja sem viimeisinä (lemma_fold ja variant_fold ennen niitä, kuten taulussa); r[-4] = dial_same
    dst.executemany(f"INSERT INTO dictionary VALUES ({', '.join('?' * (len(rows[0]) + 2))})",
                    [r[:-2] + (fold(r[1]), fold(r[-4]) if r[-4] else lemma_without_brackets(r[1])) + r[-2:] for r in rows])
    # Hakuun käännös sellaisenaan ja toisena rivinä ilman sulkeissa olevia tarkenteita, jotta naida löytää sanan,
    # jonka käännös on "naida (kerran)" (koko haun tarkistus 2026-11-06: noin 3 400 sanaa ei muuten löytynyt)
    search_rows = []
    for r in rows:
        for i, lang in enumerate(TRANSLATION_COLUMNS):
            if r[4 + i]:
                # Puolipiste erottaa käännöksiä kuten pilkku ("leader; person who leads"): hakuun pilkuksi, näkyvä teksti ennallaan
                text = DIALECT_MARK.sub("", r[4 + i]).replace(";", ",")
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
    # Johdetut suomennokset (der_fin.py) hakuun: vaarallisuus -> váralašvuohta. nr = -1: app.js järjestää ne sanakirjan
    # omien käännösten jälkeen (ei käänteisen sanakirjan hakusanojen tavoin kärkeen)
    der_base_rows, der_fin_rows = der_fin.rows(src)
    search_rows += [(w, "fin", fold(f), -1) for w, f, _, _ in der_fin_rows]
    cmp_fin_rows = cmp_fin.rows(src)
    search_rows += [(w, "fin", fold(f), -1) for w, f, _ in cmp_fin_rows]
    # Konekäännetty englanti (eng_mt.tsv) hakuun omalla kielikoodillaan engmt: app.js käyttää sitä vain
    # Kokeelliset-asetuksella ja sanakirjan englannin jälkeen
    eng_mt_rows = eng_mt_table(src)
    for w, eng, _ in eng_mt_rows:
        search_rows.append((w, "engmt", fold(eng), None))
        plain = without_articles(eng)
        if plain and fold(plain) != fold(eng):
            search_rows.append((w, "engmt", fold(plain), None))
    fin_mt_rows = eng_mt_table(src, "fin")
    search_rows += [(w, "finmt", fold(fin), None) for w, fin, _ in fin_mt_rows]
    spa_mt_rows = eng_mt_table(src, "spa")
    search_rows += [(w, "spamt", fold(spa), None) for w, spa, _ in spa_mt_rows]
    deu_mt_rows = eng_mt_table(src, "deu")
    search_rows += [(w, "deumt", fold(x.strip()), None) for w, deu, _ in deu_mt_rows for x in deu.split(",") if x.strip()]
    dst.executemany("INSERT INTO trans_search VALUES (?, ?, ?, ?)", search_rows)
    # Hakusanat ilman saamen erikoiskirjaimia (čáhci -> cahci): hakukentän ehdotukset kirjoitettaessa tavallisilla
    # kirjaimilla (cah -> čáhci). Vain sanat, joissa erikoiskirjaimia on (app.js: suggestWords).
    dst.execute("CREATE TABLE lemma_plain (plain TEXT, word_id INTEGER, PRIMARY KEY (plain, word_id)) WITHOUT ROWID")
    plain_rows = {(fold(r[1]).translate(SAMI_PLAIN), r[0]) for r in rows if fold(r[1]) != fold(r[1]).translate(SAMI_PLAIN)}
    dst.executemany("INSERT INTO lemma_plain VALUES (?, ?)", sorted(plain_rows))
    print(f"lemma_plain: {len(plain_rows)} hakusanaa")
    # Pilkulla jaettuna ja välit pois (myös "ominainen,," -> ominainen), jotta jokainen trans_search-osuma löytyy
    for items_lang in ("fin", "nob"):
        items = {}
        for r in search_rows:
            if r[1] != items_lang:
                continue
            for k, item in enumerate(x.strip() for x in r[2].split(",")):
                if not item:
                    continue
                first, nr = items.get((item, r[0]), (1, None))
                items[(item, r[0])] = (min(first, 0 if k == 0 else 1), r[3] if nr is None else nr if r[3] is None else min(nr, r[3]))
        dst.executemany(f"INSERT INTO {items_lang}_items VALUES (?, ?, ?, ?)", ((i, w, f, n) for (i, w), (f, n) in items.items()))
    bare_rows = {(lang, without_letters(term), term) for _, lang, text, _ in search_rows if lang not in ("fin", "nob")
                 for term in text.split(", ") if term and without_letters(term) != term}
    dst.executemany("INSERT INTO trans_bare VALUES (?, ?, ?)", sorted(bare_rows))
    print(f"Tarkoititko-hakusanat muilla kielillä: {len(bare_rows)}")

    tag_ids = {}
    for (tag,) in src.execute("SELECT DISTINCT tag FROM paradigms ORDER BY tag"):
        tag_ids[tag] = len(tag_ids) + 1
    dst.executemany("INSERT INTO tags VALUES (?, ?)", [(i, t) for t, i in tag_ids.items()])
    dst.executemany(
        "INSERT INTO paradigms VALUES (?,?,?,?,?)",
        ((w, ord_, tag_ids[t], s, g) for ord_, (w, t, s, g) in
         enumerate(src.execute("SELECT word_id, tag, surface, grade FROM paradigms ORDER BY word_id, rowid")))
    )
    dst.executemany("INSERT INTO meanings VALUES (?,?,?,?,?,?,?,?)", src.execute(
        "SELECT word_id, lang, nr, translations, explanations, restrictions, labels, geo FROM meanings "
        "ORDER BY word_id, rowid"))
    dst.executemany("INSERT INTO examples VALUES (?,?,?,?,?,?)", src.execute(
        "SELECT word_id, lang, meaning_nr, sme, translation, source FROM examples ORDER BY word_id, rowid"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'sme_definitions'").fetchone():
        dst.executemany("INSERT INTO sme_definitions VALUES (?,?,?,?,?)", src.execute(
            "SELECT word_id, nr, definition, synonyms, examples FROM sme_definitions ORDER BY word_id, nr"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'related_sami'").fetchone():
        dst.executemany("INSERT INTO related_sami VALUES (?,?,?)", src.execute(
            "SELECT word_id, lang, word FROM related_sami ORDER BY word_id, lang, rowid"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'placenames'").fetchone():
        dst.executemany("INSERT INTO placenames VALUES (?,?,?,?,?,?)", src.execute(
            "SELECT sme, nob, smj, sma, type, municipality FROM placenames ORDER BY sme"))

    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'nob_forms'").fetchone():
        dst.executemany("INSERT INTO nob_forms VALUES (?,?,?)",
                        src.execute("SELECT word, pos, forms FROM nob_forms ORDER BY word, pos"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'fin_forms'").fetchone():
        rows = src.execute("SELECT word, pos, forms FROM fin_forms ORDER BY word, pos").fetchall()
        back = fin_harmony({r[0] for r in rows})
        dst.executemany("INSERT INTO fin_forms VALUES (?,?,?,?)", ((w, p, f, back.get(w)) for w, p, f in rows))
        cmp_rows = fin_compound.rows(dst)
        dst.executemany("INSERT INTO fin_cmp VALUES (?,?)", cmp_rows)
        print(f"Suomen yhdyssanojen alkuosat: {len(cmp_rows)}" if cmp_rows else "Suomen yhdyssanojen alkuosat: libvoikko puuttuu, taulu tyhjä")
    seen = collections.Counter(w.lower() for (sme,) in src.execute("SELECT sme FROM examples WHERE sme IS NOT NULL")
                               for w in re.findall(r"[\wáčđŋšŧžÁČĐŊŠŦŽ]+", sme) if not w.isdigit())
    dst.executemany("INSERT INTO sme_seen VALUES (?,?)", sorted(seen.items()))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'sme_passive'").fetchone():
        dst.executemany("INSERT OR IGNORE INTO sme_passive VALUES (?,?,?)",
                        src.execute("SELECT word_id, tag, surface FROM sme_passive ORDER BY word_id, tag"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'sme_dominant'").fetchone():
        dst.executemany("INSERT INTO sme_dominant VALUES (?,?,?,?)", src.execute("SELECT * FROM sme_dominant ORDER BY surface"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'freq_sources'").fetchone():
        dst.executemany("INSERT OR IGNORE INTO sikor_freq VALUES (?,?)",
                        src.execute("SELECT word_id, MAX(n) FROM freq_sources WHERE source LIKE 'SIKOR%' GROUP BY word_id ORDER BY word_id"))
    if src.execute("SELECT 1 FROM sqlite_master WHERE name = 'sme_extra'").fetchone():
        dst.executemany("INSERT OR IGNORE INTO sme_extra VALUES (?,?,?)",
                        src.execute("SELECT word_id, tag, surface FROM sme_extra ORDER BY word_id, tag, surface"))

    cmp_rows = sme_compound.rows(dst)
    dst.executemany("INSERT INTO sme_cmp VALUES (?,?)", cmp_rows)
    print(f"Saamen yhdyssanojen alkumuodot: {len(cmp_rows)}" if cmp_rows else "Saamen yhdyssanojen alkumuodot: oikoluku puuttuu, taulu tyhjä")

    for lang, cols in (("smn", "id, lemma, pos, fin, sme"), ("sms", "id, lemma, pos, fin, nob, sme")):
        export_minor(src, lang, cols)
    export_fin_ngram(src)
    export_fin_ngram(src, "nob")

    sms_rows = {(lang, fold(word), pos): words for lang, word, pos, words in skolt_data.rows(SCRIPT_DIR)}
    dst.executemany("INSERT INTO sms VALUES (?,?,?,?)", ((*k, v) for k, v in sms_rows.items()))
    print(f"Koltansaame: {len(sms_rows)} riviä" if sms_rows else "Koltansaame: sanakirjoja ei löytynyt (hae_sanakirjat.sh)")
    # Haku koltansaameksi (BETA, 2026-11-22): koltan sana -> sen suomen/norjan sana (GiellaLT dict-fin-sms, dict-nob-sms)
    # -> pohjoissaamen sanat, joiden ensimmäisen merkityksen kaksi ensimmäistä käännöstä on se sana (sama sanaluokka).
    # Likimääräinen kuten koltta pohjoissaamen sanakorteilla; app.js hakee näitä vain koltansaame päällä.
    first_items = collections.defaultdict(set)
    for wid, lang, tr, pos in src.execute(
            "SELECT m.word_id, m.lang, m.translations, d.pos FROM meanings m JOIN dictionary d ON d.id = m.word_id "
            "WHERE m.lang IN ('fin', 'nob') AND m.nr = (SELECT MIN(nr) FROM meanings x WHERE x.word_id = m.word_id AND x.lang = m.lang)"):
        for item in [x.strip() for x in re.split(r"[,;]", re.sub(r"\([^)]*\)", "", tr or "")) if x.strip()][:2]:
            first_items[(lang, fold(item), pos)].add(wid)
    sms_search = set()
    for (lang, key, pos), words in sms_rows.items():
        for wid in first_items.get((lang, key, pos), ()):
            for sw in (x.strip() for x in words.split(",")):
                if sw:
                    sms_search.add((wid, "smsvia", fold(sw), None))
                    # Kirjoitusasu ilman koltan erikoismerkkejä (kueʹll -> kuell, piânnai -> piannai): app.js smsPlain
                    plain = sms_plain(sw)
                    if plain != fold(sw):
                        sms_search.add((wid, "smsplain", plain, None))
    dst.executemany("INSERT INTO trans_search VALUES (?, ?, ?, ?)", sorted(sms_search))
    print(f"Haku koltansaameksi (BETA): {len(sms_search)} riviä")

    apertium_rows = apertium_data.rows(src)
    dst.executemany("INSERT INTO apertium VALUES (?,?)", apertium_rows)
    print(f"Apertium: {len(apertium_rows)} riviä" if apertium_rows else "Apertium: apertium-sme-nob-lähdettä ei löytynyt")

    also_rows = fin_also.rows(src)
    dst.executemany("INSERT INTO fin_also VALUES (?,?)", also_rows)
    print(f"Lisäsuomennokset dict-fin-sme:stä: {len(also_rows)} sanaa")

    wikt_rows = wiktionary_eng.agree_rows(src)
    dst.executemany("INSERT INTO wikt_eng VALUES (?,?)", wikt_rows)
    print(f"Wiktionaryn englanti suomen ja norjan kautta: {len(wikt_rows)} riviä" if wikt_rows else "Wiktionary: wiktionary/ puuttuu (python3 wiktionary_eng.py --hae)")

    dst.executemany("INSERT INTO eng_mt VALUES (?,?,?)", eng_mt_rows)
    dst.executemany("INSERT INTO fin_mt VALUES (?,?,?)", fin_mt_rows)
    dst.executemany("INSERT INTO spa_mt VALUES (?,?,?)", spa_mt_rows)
    dst.executemany("INSERT INTO deu_mt VALUES (?,?,?)", deu_mt_rows)
    print(f"Konekäännetty saksa (kokeellinen): {len(deu_mt_rows)} sanaa" if deu_mt_rows else "deu_mt.tsv puuttuu")
    print(f"Konekäännetty espanja (kokeellinen): {len(spa_mt_rows)} sanaa" if spa_mt_rows else "spa_mt.tsv puuttuu")
    print(f"Konekäännetyt suomennosehdotukset (kokeellinen): {len(fin_mt_rows)} sanaa" if fin_mt_rows else "fin_mt.tsv puuttuu")
    print(f"Konekäännetty englanti (kokeellinen): {len(eng_mt_rows)} sanaa" if eng_mt_rows else "eng_mt.tsv puuttuu")

    register_rows = wiktionary_eng.register_rows(src)
    dst.executemany("INSERT INTO register VALUES (?,?,?)", register_rows)
    print(f"Tyylimerkinnät (loukkaava, halventava, alatyylinen): {len(register_rows)} käännössanaa")

    pivot_rows = pivot_fin.rows(src)
    dst.executemany("INSERT INTO pivot_fin VALUES (?,?,?)", pivot_rows)
    print(f"Suomennosehdotukset: {len(pivot_rows)} riviä" if pivot_rows else "Suomennosehdotukset: dict-smn-fin puuttuu (hae_sanakirjat.sh)")
    dst.executemany("INSERT INTO der_base VALUES (?,?)", der_base_rows)
    dst.executemany("INSERT INTO der_fin VALUES (?,?,?,?)", der_fin_rows)
    der_of_rows = der_fin.der_of_rows(src)
    dst.executemany("INSERT INTO der_of VALUES (?,?,?)", der_of_rows)
    print(f"Johdos sanasta X: {len(der_of_rows)} sanaa ilman suomennosta tai norjannosta")
    family_rows = sanaperhe.rows(src)
    dst.executemany("INSERT INTO family VALUES (?,?,?,?,?)", family_rows)
    print(f"Sanaperhe: {sum(1 for r in family_rows if r[1] == 'der')} johdosta, "
          f"{len({r[0] for r in family_rows if r[1] == 'cmp'})} yhdyssanaa")
    dst.executemany("INSERT INTO cmp_fin VALUES (?,?,?)", cmp_fin_rows)
    print(f"Yhdyssanojen tarkistetut suomennokset: {len(cmp_fin_rows)}")
    print(f"Johdokset: {len(der_base_rows)} pohjasanaa, {len(der_fin_rows)} johdettua suomennosta"
          if der_base_rows else "Johdokset: analysaattori puuttuu (rakenna_fst.sh)")

    # Taivutusmuodot, jotka eivät ala perusmuodon kahdella ensimmäisellä kirjaimella (pienillä tai isolla alkukirjaimella)
    for forms_lang in ("fin", "nob"):
        alt = set()
        for word, pos, forms in dst.execute(f"SELECT word, pos, forms FROM {forms_lang}_forms").fetchall():
            for cell in forms.split(";"):
                for form in cell.split("=", 1)[1].split("/") if "=" in cell else []:
                    pre = form[:2].lower()
                    if form and word[:2] not in (pre, pre[:1].upper() + pre[1:]):
                        alt.add((form.lower(), word, pos))
        dst.executemany(f"INSERT INTO {forms_lang}_form_alt VALUES (?, ?, ?)", alt)
        print(f"{forms_lang}_form_alt: {len(alt)} muotoa")

    dst.executescript("""
        CREATE INDEX idx_lemma_fold ON dictionary(lemma_fold);
        CREATE INDEX idx_sme_lemma ON dictionary(sme_lemma);
        CREATE INDEX idx_family_parent ON family(parent_id);
        CREATE INDEX idx_trans_search_word ON trans_search(word_id);
        -- Yötesti 23.11.: saksan ja koltan haku (app.js queryDatabase: t.lang = 'deumt'/'smsvia'/'smsplain' AND
        -- t.fold = ?) luki koko taulun joka haulla: OnePlus Nord N10 ~700 ms jokaiseen hakuun, indeksien kanssa ~16 ms.
        -- Osittaiset indeksit vain näille kielille: tietokanta +1,6 Mt, pakattu +0,6 Mt.
        CREATE INDEX idx_ts_deumt ON trans_search(fold) WHERE lang = 'deumt';
        CREATE INDEX idx_ts_smsvia ON trans_search(fold) WHERE lang = 'smsvia';
        CREATE INDEX idx_ts_smsplain ON trans_search(fold) WHERE lang = 'smsplain';
        CREATE INDEX idx_variant_fold ON dictionary(variant_fold);
        CREATE INDEX idx_paradigms_surface ON paradigms(surface);
        CREATE INDEX idx_meanings_word ON meanings(word_id);
        CREATE INDEX idx_trans_bare ON trans_bare(bare);
        CREATE INDEX idx_sme_passive_surface ON sme_passive(surface);
        CREATE INDEX idx_sme_extra_surface ON sme_extra(surface);
        CREATE INDEX idx_examples_word ON examples(word_id);
        CREATE INDEX idx_sme_definitions_word ON sme_definitions(word_id);
        CREATE INDEX idx_related_sami_word ON related_sami(word_id);
        CREATE INDEX idx_placenames_sme ON placenames(sme COLLATE NOCASE);
        CREATE INDEX idx_placenames_nob ON placenames(nob COLLATE NOCASE);
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
    # Sanastot (aihekohtaiset sanalistat) samasta tietokannasta: web/data/sanastot.json (gitignore, kuten tietokanta)
    subprocess.run(["python3", os.path.join(SCRIPT_DIR, "sanastot.py")], check=False)
    # Kellonajat (kello.py, tallennettu kello.json): kellopeli ja kuunteluharjoitus
    shutil.copyfile(os.path.join(SCRIPT_DIR, "kello.json"), os.path.join(SCRIPT_DIR, "web", "data", "kello.json"))
    # Minipelin sanat ja kategoriat sanastoista ja sanakirjasta: web/data/minipeli.json
    subprocess.run(["python3", os.path.join(SCRIPT_DIR, "minipeli.py")], check=False)


if __name__ == "__main__":
    main()
