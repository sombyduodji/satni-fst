"""Itä- ja länsisaamen merkinnät (dial="east"/"west" sanakirjoissa dict-sme-fin, dict-sme-nob ja dict-nob-sme).

SAME_WORD: saman sanan kaksi kirjoitusasua, jotka yhdistetään yhdeksi sanakortiksi. Kumpikin asu löytyy haulla.
OTHER_WORD: eri sanat samalle asialle. Kummallakin on oma korttinsa ja linkki toiseen.
Parit tarkisti käyttäjä, ja osa niistä sátni.orgista ja Neahttadigisánitista 2026-11-03.
"""

# (itäinen, läntinen, sanaluokka)
SAME_WORD = [
    ("dearvvas", "dearvvaš", "A"),
    ("kirku", "girku", "N"),
    ("lávvardat", "lávvordat", "N"),
    ("aktoealit", "oktoealit", "N"),
    ("keaktaráigi", "geaktaráigi", "N"),
    ("duohkin", "duohken", "Po"),
    ("ala", "nala", "Po"),
    ("oarpmealle", "oambealle", "N"),
]
# (itäiset, läntiset, sanaluokka)
OTHER_WORD = [
    (["gánda"], ["lunta"], "N"),
    (["vuorččis"], ["vuoražas"], "N"),
    (["skuffa"], ["lođá"], "N"),
    (["skibir"], ["olmmái"], "N"),
    (["uhcidit"], ["unnidit"], "V"),
    (["maŋŋebárga"], ["disdat", "disttat"], "N"),
    (["buoremus skibir"], ["buoremus olmmái"], "N"),
]
# Käännöksen merkintä käännöksen kielellä: it = itäinen, lä = läntinen, ø = østlig, v = vestlig
LABELS = {"fin": {"east": "it", "west": "lä"}, "nob": {"east": "ø", "west": "v"}}
COLUMNS = {"fin": "finnish_translation", "nob": "nob_translation"}
TRANSLATION_COLUMNS = ("finnish_translation", "nob_translation", "eng_translation", "smn_translation",
                       "smj_translation", "sma_translation")


def _word_id(cursor, lemma, pos):
    row = cursor.execute("SELECT id FROM dictionary WHERE sme_lemma = ? AND pos = ?", (lemma, pos)).fetchone()
    return row[0] if row else None


def _union(first, second):
    """Pilkuin erotellut käännökset yhteen, ensimmäisen järjestys ensin."""
    words = [w.strip() for w in f"{first or ''}, {second or ''}".split(",") if w.strip()]
    return ", ".join(dict.fromkeys(words))


def _merge(cursor, keep, other):
    """Siirtää sanan other tiedot sanalle keep ja poistaa sanan other."""
    columns = ", ".join(TRANSLATION_COLUMNS)
    a = cursor.execute(f"SELECT {columns}, freq FROM dictionary WHERE id = ?", (keep,)).fetchone()
    b = cursor.execute(f"SELECT {columns}, freq FROM dictionary WHERE id = ?", (other,)).fetchone()
    cursor.execute(f"UPDATE dictionary SET {', '.join(c + ' = ?' for c in TRANSLATION_COLUMNS)}, freq = ? WHERE id = ?",
                   [_union(x, y) for x, y in zip(a, b)][:-1] + [max(a[-1] or 0, b[-1] or 0) or None, keep])

    have = set(cursor.execute("SELECT tag, surface FROM paradigms WHERE word_id = ?", (keep,)))
    for rowid, tag, surface in cursor.execute(
            "SELECT rowid, tag, surface FROM paradigms WHERE word_id = ?", (other,)).fetchall():
        if (tag, surface) in have:
            cursor.execute("DELETE FROM paradigms WHERE rowid = ?", (rowid,))
        else:
            cursor.execute("UPDATE paradigms SET word_id = ? WHERE rowid = ?", (keep, rowid))

    # Sama käännös on sama merkitys: esimerkit sen alle. Muut merkitykset seuraavalla numerolla.
    for lang, nr, translations in cursor.execute(
            "SELECT lang, nr, translations FROM meanings WHERE word_id = ? ORDER BY rowid", (other,)).fetchall():
        same = cursor.execute("SELECT nr FROM meanings WHERE word_id = ? AND lang = ? AND translations = ?",
                              (keep, lang, translations)).fetchone()
        if same:
            target = same[0]
            cursor.execute("DELETE FROM meanings WHERE word_id = ? AND lang = ? AND nr = ?", (other, lang, nr))
        else:
            target = cursor.execute("SELECT COALESCE(MAX(nr), 0) + 1 FROM meanings WHERE word_id = ? AND lang = ?",
                                    (keep, lang)).fetchone()[0]
            cursor.execute("UPDATE meanings SET word_id = ?, nr = ? WHERE word_id = ? AND lang = ? AND nr = ?",
                           (keep, target, other, lang, nr))
        for rowid, sme in cursor.execute("SELECT rowid, sme FROM examples WHERE word_id = ? AND lang = ? AND meaning_nr = ?",
                                         (other, lang, nr)).fetchall():
            if cursor.execute("SELECT 1 FROM examples WHERE word_id = ? AND lang = ? AND sme = ?",
                              (keep, lang, sme)).fetchone():
                cursor.execute("DELETE FROM examples WHERE rowid = ?", (rowid,))
            else:
                cursor.execute("UPDATE examples SET word_id = ?, meaning_nr = ? WHERE rowid = ?", (keep, target, rowid))
    cursor.execute("DELETE FROM examples WHERE word_id = ?", (other,))
    cursor.execute("UPDATE reverse_index SET word_id = ? WHERE word_id = ?", (keep, other))
    cursor.execute("DELETE FROM dictionary WHERE id = ?", (other,))


def apply(cursor):
    """Ajetaan astevaihtelun jälkeen, koska yhdistetyillä sanoilla on kummankin kirjoitusasun omat asteet.
    Voi ajaa uudelleen samaan tietokantaan."""
    print("Lisätään itä- ja länsisaamen merkinnät...")
    columns = [r[1] for r in cursor.execute("PRAGMA table_info(dictionary)")]
    for column in ("dialect", "dial_same", "dial_other"):
        if column not in columns:
            cursor.execute(f"ALTER TABLE dictionary ADD COLUMN {column} TEXT")

    for lang, labels in LABELS.items():
        for dial, label in labels.items():
            cursor.execute(f"UPDATE dictionary SET {COLUMNS[lang]} = REPLACE({COLUMNS[lang]}, ?, ?)",
                           (f"({dial})", f"({label})"))
            cursor.execute("UPDATE meanings SET translations = REPLACE(translations, ?, ?) WHERE lang = ?",
                           (f"({dial})", f"({label})", lang))

    for east, west, pos in SAME_WORD:
        east_id, west_id = _word_id(cursor, east, pos), _word_id(cursor, west, pos)
        if east_id and west_id:
            freq = dict(cursor.execute("SELECT id, COALESCE(freq, 0) FROM dictionary WHERE id IN (?, ?)", (east_id, west_id)))
            east_first = freq[east_id] > freq[west_id]
            keep, other = (east_id, west_id) if east_first else (west_id, east_id)
            _merge(cursor, keep, other)
            cursor.execute("UPDATE dictionary SET dialect = ?, dial_same = ? WHERE id = ?",
                           ("east", west, keep) if east_first else ("west", east, keep))
        elif not cursor.execute("SELECT 1 FROM dictionary WHERE dial_same IN (?, ?)", (east, west)).fetchone():
            print(f"  ei löydy: {east} / {west}")

    for easts, wests, pos in OTHER_WORD:
        for words, dial, others in ((easts, "east", wests), (wests, "west", easts)):
            for word in words:
                cursor.execute("UPDATE dictionary SET dialect = ?, dial_other = ? WHERE sme_lemma = ? AND pos = ?",
                               (dial, ", ".join(others), word, pos))
    print(f"  {cursor.execute('SELECT COUNT(*) FROM dictionary WHERE dialect IS NOT NULL').fetchone()[0]} sanalla merkintä")
