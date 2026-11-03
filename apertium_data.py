"""Apertium (kokeellinen): norjan käännös sanoille, joilla sitä ei ole GiellaLT:n sanakirjoissa.

Lähde (ei kuulu tähän repoon): apertium-sme-nob, ~/Git/apertium/apertium-sme-nob (GPL-2.0-or-later),
tai polku ympäristömuuttujassa APERTIUM_SME_NOB. Tiedosto apertium-sme-nob.sme-nob.dix on konekääntimen
sanasto, ei ihmiselle tehty sanakirja, joten käännös on usein vain yksi sana ja merkitys voi olla karkea.

Mukaan otetaan vain substantiivit, verbit, adjektiivit ja adverbit, joiden perusmuoto ja sanaluokka ovat jo
satni.db:ssä ja joilla ei ole norjan käännöstä. Suljetut sanaluokat jätetään pois: niiden rivit on viritetty
konekääntimen sääntöjä varten (go = da, ala = på). apertium-sme-fin jätetään kokonaan pois: sen rivit ovat
liian karkeita sanakirjakäytössä (lossut = kävellä, vaikka sana tarkoittaa raskaammaksi tulemista).

Tarkistukset (2026-11-02, docs/apertium-2026-11-02.md): samoista sanoista 92 % samaa mieltä GiellaLT:n sanakirjan
kanssa, mutta suurin osa sanastosta on alun perin samasta lähteestä, joten luku ei ole riippumaton tarkistus.
"""
import collections
import os
import re
import xml.etree.ElementTree as ET

DIX = os.path.join(os.environ.get("APERTIUM_SME_NOB", os.path.expanduser("~/Git/apertium/apertium-sme-nob")),
                   "apertium-sme-nob.sme-nob.dix")
# Sanaluokat samoiksi kuin satni.db:n pos-sarakkeessa
POS = {"n": "N", "vblex": "V", "vbser": "V", "adj": "A", "adv": "Adv"}
MAX_WORDS = 4


def _side(element):
    """(teksti, ensimmäinen tagi) dix-tiedoston l- tai r-elementistä; <b/> on välilyönti, <g> kuuluu tekstiin."""
    text, tags = [], []

    def walk(e):
        text.append(e.text or "")
        for child in e:
            if child.tag == "b":
                text.append(" ")
            elif child.tag == "s":
                tags.append(child.get("n"))
            else:
                walk(child)
            text.append(child.tail or "")
    walk(element)
    return re.sub(r"\s+", " ", "".join(text)).strip(), (tags[0] if tags else None)


def translations():
    """{(saamen perusmuoto, sanaluokka): [norjan käännökset]}; tyhjä, jos lähdettä ei ole."""
    if not os.path.exists(DIX):
        return {}
    found = collections.defaultdict(list)
    for section in ET.parse(DIX).getroot().findall("section"):
        if section.get("id") != "main":
            continue
        for entry in section.findall("e"):
            pair = entry.find("p")
            if entry.get("r") == "RL" or pair is None:  # RL = vain norjasta saameen
                continue
            lemma, tag = _side(pair.find("l"))
            word = _side(pair.find("r"))[0]
            pos = POS.get(tag)
            if lemma and word and pos and word not in found[(lemma, pos)]:
                found[(lemma, pos)].append(word)
    return found


def rows(src):
    """(word_id, "käännös, käännös") sanoille, joilla ei ole norjan käännöstä satni.db:ssä (src = sqlite-yhteys)."""
    found = translations()
    if not found:
        return []
    with_meaning = {w for (w,) in src.execute("SELECT DISTINCT word_id FROM meanings WHERE lang = 'nob'")}
    return [
        (word_id, ", ".join(found[(lemma, pos)][:MAX_WORDS]))
        for word_id, lemma, pos, subtype, nob in
        src.execute("SELECT id, sme_lemma, pos, subtype, nob_translation FROM dictionary")
        if (lemma, pos) in found and subtype != "Prop" and not nob and word_id not in with_meaning
    ]
