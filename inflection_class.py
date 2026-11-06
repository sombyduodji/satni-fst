"""Substantiivien ja verbien taivutusluokka: I parillistavuinen, II paritontavuinen, III supistuma.

Luokka tallennetaan vain, kun kaksi toisistaan riippumatonta tietoa on samaa mieltä. Muuten sarake jää
tyhjäksi, eikä luokkaa arvata:
  - GiellaLT lang-sme: sanan taivutuskaava on kaavatiedoston luokkaotsikon alla
    (LÄHDE: src/fst/morphology/affixes/ ja stems/, nouns.lexc ja verbs.lexc, ks. CREDITS.md)
  - muodot, substantiiveilla yksikön nominatiivin ja genetiivin asteet ja tavumäärät, verbeillä infinitiivin
    pääte ja tavumäärä

Substantiivilla yksikään muoto ei saa poiketa astesäännöstä: yksikön illatiivi on aina vahva, essiivi on samassa
asteessa kuin yksikön nominatiivi, muut muodot vastakkaisessa asteessa. Verbeille tätä sääntöä ei ole.
Mukana eivät ole adjektiivit, erisnimet eivätkä astetta vaihtamattomat substantiivit.
"""
import os
import re

LANG_SME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lang-sme", "src", "fst", "morphology")
NOUN_SECTIONS = {"bisyllabic": "I", "trisyllabic": "II", "contracted": "III"}
_NOUN_HEADING = re.compile(r"^!!\s*(Bisyllabic|Trisyllabic|Contracted) nouns", re.I)
# Finite declension päättää luokkaotsikoiden alueen: sen jälkeen tulee taivutuspäätteitä
_VERB_HEADING = re.compile(r"^!! ## (Basic lexica for bisyllabic|Intermediate lexica for even|"
                           r"Basic lexica for contracted|Basic lexica for trisyllabic|Finite declension)")
_LEXICON = re.compile(r"^LEXICON\s+(\S+)")
# lemma+N+...:vartalo TAIVUTUSKAAVA "selite" ;
_NOUN_STEM = re.compile(r'^\s*([^+:\s!]+)\+N[^:]*:\S+\s+(\S+)\s*(?:"[^"]*")?\s*;')
_VERB_STEM = re.compile(r'^\s*([^+:\s!]+)(?:\+[^:]*)?:\S+\s+(\S+)\s*(?:"[^"]*")?\s*;')
VOWELS = re.compile("[aáeiouyäöâ]+")
CASES = ["Nom", "Gen", "Acc", "Ill", "Loc", "Com"]
TAGS = [f"{number}+{case}" for number in ("Sg", "Pl") for case in CASES] + ["Ess"]
# Sanat, joiden luokasta lähteet ovat eri mieltä: luokka näytetään vain, kun se on varma (käyttäjän päätös
# 2026-11-06). Wiktionaryn pohjoissaamen sanat (kaikki.org) olivat samaa mieltä 2 439 sanasta 2 441:stä;
# nämä kaksi GiellaLT taivuttaa eri tavalla:
#   soađis: GiellaLT gen. soađđása (II), Wiktionary soađđá (III)
#   njivlla: GiellaLT gen. njivlaga (II), Wiktionary parillinen, sanan njivli muunnos (I)
DISPUTED = {("soađis", "N"), ("njivlla", "N")}


def _noun_section(line):
    heading = _NOUN_HEADING.match(line)
    return NOUN_SECTIONS[heading.group(1).lower()] if heading else False


def _verb_section(line):
    heading = _VERB_HEADING.match(line)
    if not heading:
        return False
    name = heading.group(1).lower()
    if "finite" in name:
        return None
    return "III" if "contracted" in name else "II" if "trisyllabic" in name else "I"


def _source_classes(root, filename, section_of, stem_pattern):
    lexicons, section = {}, None
    with open(os.path.join(root, "affixes", filename), encoding="utf8") as f:
        for line in f:
            new_section = section_of(line)
            if new_section is not False:
                section = new_section
            lexicon = _LEXICON.match(line)
            if lexicon and section:
                lexicons[lexicon.group(1)] = section
    found = {}
    with open(os.path.join(root, "stems", filename), encoding="utf8") as f:
        for line in f:
            if line.lstrip().startswith("!") or "Err/" in line or "Use/NG" in line:
                continue
            stem = stem_pattern.match(line)
            if stem and stem.group(2) in lexicons:
                found.setdefault(stem.group(1), set()).add(lexicons[stem.group(2)])
    # Sana, jolla on kaavoja useasta luokasta, jää pois
    return {lemma: next(iter(classes)) for lemma, classes in found.items() if len(classes) == 1}


def noun_sources(root=LANG_SME):
    return _source_classes(root, "nouns.lexc", _noun_section, _NOUN_STEM)


def verb_sources(root=LANG_SME):
    return _source_classes(root, "verbs.lexc", _verb_section, _VERB_STEM)


def syllables(word):
    return len(VOWELS.findall(word.lower()))


def expected_grade(cls, tag):
    if tag == "Sg+Ill":
        return "GD"
    base = "GD" if cls == "I" else "HD"
    if tag in ("Sg+Nom", "Ess"):
        return base
    return "HD" if cls == "I" else "GD"


def noun_form_class(nom, gen):
    """Luokka yksikön nominatiivista ja genetiivistä, jotka ovat pareja (muoto, aste)."""
    diff = syllables(gen[0]) - syllables(nom[0])
    if (nom[1], gen[1]) == ("GD", "HD") and diff == 0:
        return "I"
    if (nom[1], gen[1]) == ("HD", "GD"):
        return {1: "II", 0: "III"}.get(diff)
    return None


def classify_noun(source, forms):
    """Luokka tai None. forms: {tagi: [(muoto, aste), ...]}"""
    if not source or not forms.get("Sg+Nom") or not forms.get("Sg+Gen"):
        return None
    if noun_form_class(forms["Sg+Nom"][0], forms["Sg+Gen"][0]) != source:
        return None
    for tag in TAGS:
        if any(grade != expected_grade(source, tag) for _, grade in forms.get(tag, [])):
            return None
    return source


def verb_form_class(infinitive):
    if infinitive.endswith(("át", "et", "ot")):
        return "III"
    return "II" if syllables(infinitive) % 2 else "I"


def classify_verb(source, infinitive):
    return source if source and verb_form_class(infinitive) == source else None


def apply(cursor):
    """Täyttää dictionary.inflection_class. Ilman lang-sme:n lähteitä sarake jää tyhjäksi."""
    print("Päätellään taivutusluokat...")
    cols = [r[1] for r in cursor.execute("PRAGMA table_info(dictionary)")]
    if "inflection_class" not in cols:
        cursor.execute("ALTER TABLE dictionary ADD COLUMN inflection_class TEXT")
    cursor.execute("UPDATE dictionary SET inflection_class = NULL")
    try:
        nouns, verbs = noun_sources(), verb_sources()
    except FileNotFoundError:
        print(f"  lang-sme:n lähteitä ei löydy ({LANG_SME}), taivutusluokkia ei merkitä")
        return

    placeholders = ", ".join("?" * len(TAGS))
    words = {}
    for word_id, lemma, tag, surface, grade in cursor.execute(
        "SELECT d.id, d.sme_lemma, p.tag, p.surface, p.grade FROM paradigms p JOIN dictionary d ON d.id = p.word_id "
        f"WHERE d.pos = 'N' AND p.tag IN ({placeholders})", TAGS
    ):
        words.setdefault((word_id, lemma), {}).setdefault(tag, []).append((surface, grade))
    updates = [(cls, word_id) for (word_id, lemma), forms in words.items()
               if (lemma, "N") not in DISPUTED and (cls := classify_noun(nouns.get(lemma), forms))]
    noun_count = len(updates)

    # Yhdistetyillä kirjoitusasuilla (dialects.py) on kaksi lemmaa, joilla voi olla eri luokka
    merged = "AND dial_same IS NULL" if "dial_same" in cols else ""
    for word_id, lemma in cursor.execute(f"SELECT id, sme_lemma FROM dictionary WHERE pos = 'V' {merged}").fetchall():
        cls = None if (lemma, "V") in DISPUTED else classify_verb(verbs.get(lemma), lemma)
        if cls:
            updates.append((cls, word_id))
    cursor.executemany("UPDATE dictionary SET inflection_class = ? WHERE id = ?", updates)
    print(f"  taivutusluokka merkittiin {noun_count} substantiiville ja {len(updates) - noun_count} verbille")
