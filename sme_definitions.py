"""Pohjoissaamenkieliset määritelmät GiellaLT:n yksikielisestä sanakirjasta dict-sme (CC BY 4.0).

Jokainen <dg> on yksi merkitys: määritelmä <d>, synonyymit <syng><d_ref> ja esimerkit <xg><x>. Sana yhdistetään
sovelluksen sanaan perusmuodon ja sanaluokan perusteella (lg pos). Tulos tauluun sme_definitions:
(word_id, nr, definition, synonyms, examples): synonyms pilkuin, examples rivinvaihdoin.

Aja yksin olemassa olevaan tietokantaan: python3 import_full_dict.py --vain-maaritelmat
"""
import glob
import os
import re
import xml.etree.ElementTree as ET

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(SCRIPT_DIR, "dict-sme", "src")
MAX_EXAMPLES = 3


def _text(el):
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip()


def parse():
    """{(perusmuoto, sanaluokka): [(määritelmä, synonyymit, esimerkit), ...]}"""
    out = {}
    for path in sorted(glob.glob(os.path.join(SRC, "*.xml"))):
        for e in ET.parse(path).getroot().iter("e"):
            lg = e.find("lg")
            lemma = lg.find("l") if lg is not None else None
            if lemma is None or not (lemma.text or "").strip():
                continue
            senses = []
            for dg in e.findall("dg"):
                d = dg.find("d")
                definition = _text(d) if d is not None else ""
                if not definition:
                    continue
                syn = [_text(r) for r in dg.iter("d_ref") if _text(r)]
                ex = [_text(x) for x in dg.iter("x") if _text(x)][:MAX_EXAMPLES]
                senses.append((definition, ", ".join(dict.fromkeys(syn)), "\n".join(ex)))
            if senses:
                out.setdefault((lemma.text.strip(), lg.get("pos", "")), []).extend(senses)
    return out


def apply(cursor):
    cursor.execute("DROP TABLE IF EXISTS sme_definitions")
    cursor.execute("""CREATE TABLE sme_definitions (word_id INTEGER, nr INTEGER, definition TEXT, synonyms TEXT,
                      examples TEXT, FOREIGN KEY(word_id) REFERENCES dictionary(id))""")
    if not os.path.isdir(SRC):
        print("Saamenkieliset määritelmät: dict-sme puuttuu (hae_sanakirjat.sh)")
        return
    rows, words, missing = [], 0, 0
    for (lemma, pos), senses in parse().items():
        ids = [r[0] for r in cursor.execute("SELECT id FROM dictionary WHERE sme_lemma = ? AND pos = ?", (lemma, pos))]
        if not ids:
            missing += 1
            continue
        words += 1
        for wid in ids:
            rows += [(wid, nr, d, s, x) for nr, (d, s, x) in enumerate(senses, 1)]
    cursor.executemany("INSERT INTO sme_definitions VALUES (?,?,?,?,?)", rows)
    cursor.execute("CREATE INDEX idx_sme_definitions_word ON sme_definitions(word_id)")
    print(f"Saamenkieliset määritelmät (dict-sme): {words} sanaa, {len(rows)} merkitystä; {missing} sanaa ei sovelluksessa")
