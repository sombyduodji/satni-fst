"""Ihmistä tarkoittavat substantiivit (dictionary.human = 1) GiellaLT:n lang-sme-lähteen merkitysluokista.

Käyttö: suomen -lle-, -lla- ja -lta-muodolle näytetään saamen muoto vain, kun sana tarkoittaa ihmistä
(isoäidille = áhkkui, isoäidillä = áhkus, isoäidiltä = áhkus), kuten persoonapronomineilla (web/app.js:
uncertainFinCell). Muilla sanoilla muoto riippuu lauseesta (pöydälle = beavddi ala, autolla = biillain).

Ihminen = lemman jollakin rivillä tiedostossa nouns.lexc on Sem/Hum, Sem/Hum_Pos tai muu Hum-osa (Ani_Hum,
Group_Hum ...), eikä millään rivillä ole pinnan, paikan tai ruumiinosan luokkaa: oaivi (pää) on luokassa Ani_Hum
mutta myös Body, ja oaivvi ala = päähän, ei *oivii. Tarkistettu 2026-11-09 esimerkkilauseista (suomen -lle =
saamen illatiivi 18/19 ihmisillä, -lla = lokatiivi noin 25/29) ja Kielipankin WANCA 2016 -korpuksesta: ihmissanat
eivät juuri esiinny genetiivin ja postposition ala/alde kanssa, toisin kuin paikat ja pinnat (beavddi ala).
"""
import os
import re

LANG_SME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lang-sme", "src", "fst", "morphology")
# Luokat, joissa suomen -lle/-lla on usein saamessa genetiivi + postpositio (beavddi ala, jieŋa alde) tai
# komitatiivi (biillain): näiden kanssa Hum-merkintää ei uskota
NOT_PEOPLE = ("Body", "Plc", "Route", "Furn", "Buildpart", "Build", "Substnc", "Wthr", "Obj", "Veh", "Ctain",
              "Mat", "Plantpart", "Tool", "Food")


def people_lemmas():
    """Lemmat, jotka tarkoittavat ihmistä (ks. moduulin kuvaus)."""
    sems = {}
    with open(os.path.join(LANG_SME, "stems", "nouns.lexc"), encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^([^+:!\s%]+)\+N\b([^:]*)", line)
            # Kirjoitusvirherivit eivät kerro sanasta (mánná+Err/Orth = raamatun manna, Sem/Food)
            if not m or "+Err/" in m.group(2):
                continue
            for tag in re.findall(r"\+Sem/([A-Za-z_-]+)", m.group(2)):
                sems.setdefault(m.group(1), set()).update(part.split("-")[0] for part in tag.split("_"))
    return {lemma for lemma, parts in sems.items()
            if "Hum" in parts and not any(p.startswith(NOT_PEOPLE) for p in parts)}


# Lausekääntäjän sijasäännöt (web/lauseet.js: lauseSamiTag) muille kuin ihmissanoille, dictionary.sem:
#   surf  = huonekalu tai taso: pöydälle = beavddi ala, pöydällä/pöydältä = beavddi alde (genetiivi + postpositio)
#   com   = kulkuneuvo tai väline: autolla = biillain, vasaralla = veahčiriin (komitatiivi)
#   place = paikka, organisaatio tai rakennus: lentokentälle = girdišilljui, lentokentällä = girdišilljus
# Tarkistettu 2026-11-10 sanakirjan esimerkkilauseista: paikat ja organisaatiot -lle = illatiivi 15/17, -lla = lokatiivi 16/23
SEM_CLASSES = (("surf", ("Furn",)), ("com", ("Veh", "Tool")), ("place", ("Plc", "Org", "Build")))


def sem_classes():
    """{lemma: surf/com/place}; ensimmäinen osuva luokka järjestyksessä surf, com, place. Rakennuksen osa
    (Buildpart: uksa, glássa) ei ole paikka."""
    sems = {}
    with open(os.path.join(LANG_SME, "stems", "nouns.lexc"), encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^([^+:!\s%]+)\+N\b([^:]*)", line)
            if not m or "+Err/" in m.group(2):
                continue
            sems.setdefault(m.group(1), set()).update(re.findall(r"\+Sem/([A-Za-z_-]+)", m.group(2)))
    out = {}
    for lemma, tags in sems.items():
        # Sem/Ctain-clth_Veh (busse = tasku, bussi) -> Ctain, Veh; Sem/Edu_Org -> Edu, Org
        bases = {part.split("-")[0] for t in tags for part in t.split("_")}
        if "Body" in bases:  # oaivi (pää; myös paikka): oaivvi ala = päähän, ei *oivii
            continue
        for name, wanted in SEM_CLASSES:
            if bases & set(wanted):
                out[lemma] = name
                break
    return out


def apply(cursor):
    """Täyttää dictionary.human. Ilman lang-sme:n lähteitä sarake jää tyhjäksi."""
    print("Merkitään ihmistä tarkoittavat substantiivit...")
    cols = [r[1] for r in cursor.execute("PRAGMA table_info(dictionary)")]
    if "human" not in cols:
        cursor.execute("ALTER TABLE dictionary ADD COLUMN human INTEGER")
    cursor.execute("UPDATE dictionary SET human = NULL")
    try:
        people = people_lemmas()
    except FileNotFoundError:
        print(f"  lang-sme:n lähteitä ei löydy ({LANG_SME}), ihmissanoja ei merkitä")
        return
    rows = [(lemma,) for lemma in people]
    cursor.executemany("UPDATE dictionary SET human = 1 WHERE sme_lemma = ? AND pos = 'N' AND COALESCE(subtype, '') <> 'Prop'", rows)
    count = cursor.execute("SELECT count(*) FROM dictionary WHERE human = 1").fetchone()[0]
    print(f"  {count} ihmistä tarkoittavaa substantiivia ({len(people)} lemmaa lähteessä)")
    if "sem" not in cols:
        cursor.execute("ALTER TABLE dictionary ADD COLUMN sem TEXT")
    cursor.execute("UPDATE dictionary SET sem = NULL")
    classes = sem_classes()
    cursor.executemany("UPDATE dictionary SET sem = ? WHERE sme_lemma = ? AND pos = 'N' AND COALESCE(subtype, '') <> 'Prop' "
                       "AND COALESCE(human, 0) = 0", [(c, l) for l, c in classes.items()])
    for name, n in cursor.execute("SELECT sem, count(*) FROM dictionary WHERE sem IS NOT NULL GROUP BY sem"):
        print(f"  {name}: {n} substantiivia")
