"""Lisäsuomennokset Merkitykset-välilehdelle käänteisestä suomi–saame-sanakirjasta (GiellaLT dict-fin-sme).
Esimerkki: dict-sme-fin antaa sanalle gieddi vain "kenttä", mutta dict-fin-sme:n hakusanat aho, keto ja vainio
antavat saamennokseksi gieddi. Nämä ovat jo haussa (reverse_index -> trans_search, fin_items); tämä moduuli valitsee
niistä sanakortille näytettävät (taulu fin_also, sanakortissa rivi "Myös:").

Suodatus (tarkistus 2026-11-17):
  - Sanaluokan on oltava sama kuin dict-fin-sme:ssä, sekä saamennoksen että suomen hakusanan (hanakka A -> geargat ei verbille geargat, muu Pron -> eambbo ei
    adjektiiville). import_full_dict.py liittää käänteisen parin tarvittaessa saman sanan toiseen sanaluokkaan, mikä
    sopii hakuun, mutta ei merkitykseksi.
  - Jo näkyvä käännös jätetään pois (myös sulkeissa olevat tarkenteet huomioiden ja koko käännöstekstin osana).
  - Voikon hylkäämä lisäsana jätetään pois (121 kpl 2026-11-17: lyhenteet "jtak", "jhkin" ja kirjoitusvirheet
    "palaa nopesti", "sytytellää"; mukana myös joitakin oikeita harvinaisia sanoja, mutta lisärivi on vain lisä).
    Ilman Voikkoa (python3-libvoikko) suodatus ohitetaan ja siitä tulostetaan varoitus.
  - Hakusana, jonka saamennoslistassa sana on myöhemmin kuin MAX_ORDER:s, jätetään pois: pitkien listojen loppupää
    on usein löyhä (muu -> 7. saamennos eambbo).
"""
import glob
import os
import re
import xml.etree.ElementTree as ET

import import_full_dict as ifd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAX_ORDER = 3       # käänteisen hakusanan saamennoksista enintään neljäs (0 = ensimmäinen)
MAX_ITEMS = 8       # sanakortille enintään näin monta lisäsanaa
BRACKETED = re.compile(r"\([^()]*\)")


def norm(text):
    """Vertailumuoto: pienet kirjaimet, sulkeissa olevat tarkenteet ja ylimääräiset välit pois. Sulkematon sulku
    katkaistaan (suvja: "siiman vyyhteämiseen käytetty haaru (siimoineen")."""
    text = BRACKETED.sub(" ", text.lower()).split("(")[0].replace(")", " ")
    return " ".join(text.split()).strip(" .")


def reverse_pairs(src_dir=SCRIPT_DIR):
    """dict-fin-sme: {(suomen hakusana, saamen sana, sanaluokka): pienin järjestysnumero}. Samat säännöt kuin
    import_full_dict.parse_reverse_dictionaries (hakusanan korjaukset, työmerkinnät ja selitykset pois)."""
    pairs = {}
    for path in sorted(glob.glob(os.path.join(src_dir, "dict-fin-sme", "src", "*.xml"))):
        filename = os.path.basename(path)
        if filename == "meta.xml":
            continue
        try:
            root = ET.parse(path).getroot()
        except ET.ParseError:
            continue
        for entry in root.iter("e"):
            head_elem = entry.find("lg/l")
            headword = ifd.fix_text("fin", ifd._clean(head_elem.text)) if head_elem is not None else ""
            if not headword:
                continue
            order = 0
            for tg in entry.iter("tg"):
                if tg.get(ifd.XML_LANG) not in (None, "sme"):
                    continue
                for t_elem in tg.findall("t"):
                    lemma = ifd._clean(t_elem.text)
                    if (not lemma or ifd._placeholder(lemma) or t_elem.get("t_type") in ifd.GRAMMAR_POINTERS
                            or t_elem.get("t_type") == "expl"):
                        continue
                    pos = ifd.detect_pos(t_elem.get("pos") or head_elem.get("pos"), filename)
                    pos = ifd.REVERSE_POS_FIXES.get(("fin", headword, lemma), pos)
                    if pos == "Prop":
                        pos = "N"
                    # Suomen hakusanan oma sanaluokka samaksi (tuhertaa V -> roancut Adv: ei merkitykseksi)
                    head_pos = ifd.detect_pos(head_elem.get("pos"), filename) if head_elem.get("pos") else pos
                    if head_pos == "Prop":
                        head_pos = "N"
                    if head_pos != pos:
                        order += 1
                        continue
                    key = (headword, lemma, pos)
                    pairs[key] = min(pairs.get(key, order), order)
                    order += 1
    return pairs


def _speller():
    try:
        import libvoikko
        v = libvoikko.Voikko("fi")
    except Exception:
        print("fin_also: Voikko puuttuu, lisäsuomennoksia ei tarkisteta (apt install voikko-fi python3-libvoikko)")
        return None
    return lambda text: all(v.spell(w) for w in re.findall(r"[^\W\d_]+(?:-[^\W\d_]+)*", text))


def rows(src, src_dir=SCRIPT_DIR):
    """[(word_id, "aho, keto, vainio")] sanoille, joilla on näytettävää. src = satni.db:n yhteys."""
    pairs = reverse_pairs(src_dir)
    if not pairs:
        return []
    shown = {}
    for wid, text in src.execute("SELECT id, finnish_translation FROM dictionary"):
        shown[wid] = [text or ""]
    for wid, tr, expl in src.execute("SELECT word_id, translations, explanations FROM meanings WHERE lang = 'fin'"):
        shown.setdefault(wid, []).extend([tr or "", expl or ""])
    words = {wid: (lemma, pos) for wid, lemma, pos in src.execute("SELECT id, sme_lemma, pos FROM dictionary")}
    found = {}
    for wid, head, nr in src.execute("SELECT word_id, headword, MIN(nr) FROM reverse_index WHERE lang = 'fin' "
                                     "GROUP BY word_id, headword ORDER BY word_id, MIN(nr), rowid"):
        lemma, pos = words.get(wid, (None, None))
        order = pairs.get((head, lemma, pos))
        if order is None or order > MAX_ORDER:
            continue
        found.setdefault(wid, []).append(head)
    spell = _speller()
    out = []
    for wid, heads in found.items():
        texts = shown.get(wid, [])
        have = {norm(i) for t in texts for i in ifd_split(t)}
        full = " | ".join(norm(t) for t in texts)
        extra = []
        for head in heads:
            n = norm(head)
            if not n or n in have or n in {norm(e) for e in extra}:
                continue
            # Koko sana jo näkyvän käännöksen sisällä ("tulla valmiiksi" -> "valmiiksi"): ei lisätä
            if re.search(r"(?<!\w)" + re.escape(n) + r"(?!\w)", full):
                continue
            if spell and not spell(head):
                continue
            extra.append(head)
        if extra and have:
            out.append((wid, ", ".join(extra[:MAX_ITEMS])))
    return sorted(out)


def ifd_split(text):
    """Käännöslista osiin sulkeiden ulkopuolisista pilkuista ja puolipisteistä."""
    items, depth, cur = [], 0, ""
    for ch in text:
        depth += (ch == "(") - (ch == ")")
        if ch in ",;" and depth <= 0:
            items.append(cur)
            cur = ""
        else:
            cur += ch
    items.append(cur)
    return [i.strip() for i in items if i.strip()]


if __name__ == "__main__":
    import sqlite3
    import sys
    con = sqlite3.connect(os.path.join(SCRIPT_DIR, "satni.db"))
    result = rows(con)
    print(f"{len(result)} sanaa, {sum(len(ifd_split(r[1])) for r in result)} lisäsanaa", file=sys.stderr)
    for wid, text in result:
        print(wid, con.execute("SELECT sme_lemma, pos, finnish_translation FROM dictionary WHERE id = ?", (wid,)).fetchone(), text, sep="\t")
