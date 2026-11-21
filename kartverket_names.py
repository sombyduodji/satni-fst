"""Norjan saamenkieliset paikannimet: Stedsnavn (Kartverket, Geonorge, "Åpne data", CC BY 4.0;
https://kartkatalog.geonorge.no/metadata/30caed2f-454e-44be-b5cc-26bb5c0110ca). © Kartverket.

Paikka, jolla on pohjoissaamenkielinen ja norjankielinen nimi (päänimi tai sivunimi, ei historiallinen), tauluun
placenames(sme, nob, smj, sma, type, municipality). Sovellus näyttää osuman haussa omana rivinään (Kautokeino =
Guovdageaidnu). Sovelluksen sanoille, joilla ei ole norjannosta ja joiden nimi vastaa yhtä paikkaa, norjankielinen nimi
nob_translation-sarakkeeseen (merkitään tauluun nob_sources).

Aja yksin olemassa olevaan tietokantaan: python3 import_full_dict.py --vain-paikannimet
"""
import collections
import os
import xml.etree.ElementTree as ET
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ZIP = os.path.join(SCRIPT_DIR, "lahteet", "kartverket_stedsnavn_4258.zip")
STATUS_OK = {"hovednavn", "sidenavn"}
LANG = {"nordsamisk": "sme", "norsk": "nob", "lulesamisk": "smj", "sørsamisk": "sma"}
SOURCE = "Kartverket Stedsnavn (CC BY 4.0)"


def _local(tag):
    return tag.rsplit("}", 1)[-1]


def read_places():
    out = []
    with zipfile.ZipFile(ZIP) as z:
        f = z.open(next(n for n in z.namelist() if n.endswith(".gml")))
        for _, el in ET.iterparse(f, events=("end",)):
            if _local(el.tag) != "Sted":
                continue
            names = collections.defaultdict(list)
            typ = kom = None
            for x in el.iter():
                t = _local(x.tag)
                if t == "navneobjekttype" and typ is None:
                    typ = x.text
                elif t == "kommunenavn" and kom is None:
                    kom = x.text
                elif t == "Stedsnavn":
                    lang = status = name = None
                    for y in x.iter():
                        u = _local(y.tag)
                        if u == "språk":
                            lang = y.text
                        elif u == "navnestatus":
                            status = y.text
                        elif u == "komplettskrivemåte" and name is None:
                            name = (y.text or "").strip()
                    if lang in LANG and status in STATUS_OK and name and name not in names[LANG[lang]]:
                        names[LANG[lang]].append(name)
            if names.get("sme") and names.get("nob"):
                out.append((names, typ or "", kom or ""))
            el.clear()
    return out


def apply(cursor):
    if not os.path.exists(ZIP):
        print("  Kartverket: lahteet/ puuttuu (aja hae_lahteet.sh), ohitetaan")
        return
    places = read_places()
    rows = sorted({(n["sme"][0], n["nob"][0], ", ".join(n.get("smj", [])), ", ".join(n.get("sma", [])), typ, kom)
                   for n, typ, kom in places})
    cursor.execute("DROP TABLE IF EXISTS placenames")
    cursor.execute("CREATE TABLE placenames (sme TEXT, nob TEXT, smj TEXT, sma TEXT, type TEXT, municipality TEXT)")
    cursor.executemany("INSERT INTO placenames VALUES (?,?,?,?,?,?)", rows)
    # Sovelluksen nimille ilman norjannosta: norjankielinen nimi, jos saamenkielinen nimi vastaa yksiselitteisesti
    by_sme = collections.defaultdict(set)
    for sme, nob, *_ in rows:
        by_sme[sme].add(nob)
    cursor.execute("CREATE TABLE IF NOT EXISTS nob_sources (word_id INTEGER, source TEXT)")
    cursor.execute("DELETE FROM nob_sources WHERE source = ?", (SOURCE,))
    filled = [(next(iter(by_sme[l])), wid) for wid, l in cursor.execute(
        "SELECT id, sme_lemma FROM dictionary WHERE COALESCE(nob_translation, '') = ''").fetchall() if len(by_sme.get(l, ())) == 1]
    cursor.executemany("UPDATE dictionary SET nob_translation = ? WHERE id = ?", filled)
    cursor.executemany("INSERT INTO nob_sources VALUES (?, ?)", [(wid, SOURCE) for _, wid in filled])
    print(f"  Kartverket: {len(rows)} paikannimeä (pohjoissaame + norja), norjannos {len(filled)} sovelluksen sanalle")
