"""Sanastot: aihekohtaiset sanalistat (luvut, viikonpäivät, kuukaudet, vuodenajat ...) tiedostoon web/data/sanastot.json.

Lista määritellään tässä tiedostossa saamen perusmuotoina; sanakirjasta (satni.db) haetaan sanan tunniste (sanakortin
avaamiseen), suomen- ja norjankielinen käännös sekä taivutusmuodot (paradigms: vuossárga -> vuossárgga "maanantaina").
Luvut ja järjestysluvut tehdään GiellaLT lang-sme -generaattorilla ja tarkistetaan analysaattorilla (src/fst).
Jokainen saamen sana tarkistetaan Divvunin oikoluvulla (libvoikko "se"); hylätyt näkyvät ajon lopussa.

Murremerkinnät (it = itäinen, lä = läntinen) ovat käyttäjän ja sanakirjan tiedoista (dictionary.dialect).

Aja: python3 sanastot.py   (tarvitsee satni.db:n ja src/fst/-mallit)
"""
import collections
import json
import os
import re
import sqlite3
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
OUT = os.path.join(SCRIPT_DIR, "web", "data", "sanastot.json")
GEN = os.path.join(SCRIPT_DIR, "src", "fst", "generator-gt-norm.hfst")
ANA = os.path.join(SCRIPT_DIR, "src", "fst", "analyser-gt-norm.hfst")

db = sqlite3.connect(DB_FILE)
problems = []

# Esimerkkilauseiden sanojen yleisyys: rinnakkaismuodoista yleisin (gaskavahku eikä gaskavahkko)
SEEN = collections.Counter(w.lower() for (s,) in db.execute("SELECT sme FROM examples WHERE sme IS NOT NULL")
                           for w in re.findall(r"[\wáčđŋšŧžÁČĐŊŠŦŽ]+", s))


def entry(lemma, pos=None):
    q = "SELECT id, sme_lemma, pos, finnish_translation, nob_translation FROM dictionary WHERE sme_lemma = ?"
    rows = db.execute(q + (" AND pos = ?" if pos else "") + " ORDER BY COALESCE(freq, 0) DESC", (lemma, pos) if pos else (lemma,)).fetchall()
    if not rows:
        problems.append(f"ei sanakirjassa: {lemma} {pos or ''}")
        return None
    return rows[0]


def form(word_id, tag):
    forms = [r[0] for r in db.execute("SELECT surface FROM paradigms WHERE word_id = ? AND tag = ?", (word_id, tag))]
    if not forms:
        return None
    # Perusmuodon näköinen rinnakkaismuoto viimeiseksi (gaskavahku eikä gaskavahkku), sitten esimerkeissä yleisin
    lemma = db.execute("SELECT sme_lemma FROM dictionary WHERE id = ?", (word_id,)).fetchone()[0]
    return sorted(forms, key=lambda f: (f == lemma and len(forms) > 1, -SEEN[f.lower()]))[0]


def fin_form(word, cell):
    row = db.execute("SELECT forms FROM fin_forms WHERE word = ?", (word,)).fetchone()
    if not row:
        return None
    for c in row[0].split(";"):
        k, _, v = c.partition("=")
        if k == cell:
            return v.split("/")[0]
    return None


def first(trans):
    return (trans or "").split(",")[0].strip()


def sme(lemma, pos=None, tags=(), dial=None, fi=None, nb=None):
    """Saamen sana muotoineen: {"w": [perusmuoto, muoto, ...], "id": .., "dial": .., "fi": .., "nb": ..}"""
    e = entry(lemma, pos)
    words = [lemma]
    for tag in tags:
        if tag.startswith("="):           # valmis muoto (adverbi tms.)
            words.append(tag[1:])
            continue
        f = form(e[0], tag) if e else None
        if f:
            words.append(f)
        else:
            problems.append(f"ei muotoa {tag}: {lemma}")
    out = {"w": words, "id": e[0] if e else None}
    if dial:
        out["dial"] = dial
    out["fi"] = fi if fi is not None else (first(e[3]) if e else "")
    out["nb"] = nb if nb is not None else (first(e[4]) if e else "")
    return out


def row(fi, nb, smes, note=None):
    r = {"fi": fi, "nb": nb, "sme": smes}
    if note:
        r["note"] = note
    return r


# --- Luvut ja järjestysluvut (GiellaLT) ---

def look(fst, queries):
    out = subprocess.run(["hfst-lookup", "-q", fst], input="\n".join(queries) + "\n", capture_output=True, text=True).stdout
    d = collections.defaultdict(list)
    for line in out.splitlines():
        p = line.split("\t")
        if len(p) >= 2 and "+?" not in p[1] and p[1] not in d[p[0]]:
            d[p[0]].append(p[1])
    return d


UNITS = ["", "okta", "guokte", "golbma", "njeallje", "vihtta", "guhtta", "čieža", "gávcci", "ovcci"]
TENS = {1: "logi", 2: "guoktelogi", 3: "golbmalogi", 4: "njealljelogi", 5: "vihttalogi", 6: "guhttalogi", 7: "čiežalogi",
        8: "gávccilogi", 9: "ovccilogi"}
ORD_UNITS = ["", "vuosttaš", "nubbi", "goalmmát", "njealját", "viđát", "guđát", "čihččet", "gávccát", "ovccát"]
ORD_TENS = {1: "logát", 2: "guoktelogát", 3: "golbmalogát", 4: "njealljelogát", 5: "vihttalogát", 6: "guhttalogát",
            7: "čiežalogát", 8: "gávccilogát", 9: "ovccilogát"}
FI_UNITS = ["", "ensimmäinen", "toinen", "kolmas", "neljäs", "viides", "kuudes", "seitsemäs", "kahdeksas", "yhdeksäs"]
FI_UNITS_C = ["", "yhdes", "kahdes", "kolmas", "neljäs", "viides", "kuudes", "seitsemäs", "kahdeksas", "yhdeksäs"]
NB_ORD = ["", "første", "andre", "tredje", "fjerde", "femte", "sjette", "sjuende", "åttende", "niende", "tiende", "ellevte",
          "tolvte", "trettende", "fjortende", "femtende", "sekstende", "syttende", "attende", "nittende", "tjuende"]


def card(n):
    if n < 10:
        return UNITS[n]
    if n == 10:
        return "logi"
    if n < 20:
        return UNITS[n - 10] + "nuppelohkái"
    if n < 100:
        return TENS[n // 10] + UNITS[n % 10]
    if n == 100:
        return "čuođi"
    if n < 200:
        return "čuođi" + card(n - 100)
    return "duhát"


def ord_candidates(n):
    if n < 10:
        return [ORD_UNITS[n]]
    if n == 10:
        return ["logát"]
    if n < 20:
        return [UNITS[n - 10] + "nuppelogát"]
    if n < 100:
        return [ORD_TENS[n // 10]] if n % 10 == 0 else [TENS[n // 10] + ORD_UNITS[n % 10]]
    if n == 100:
        return ["čuođát"]
    if n < 200:
        return ["čuođi" + x for x in ord_candidates(n - 100)]
    return ["duháhat"]


def fi_ord(n):
    if n < 10:
        return FI_UNITS[n]
    if n == 10:
        return "kymmenes"
    if n < 20:
        return FI_UNITS_C[n - 10] + "toista"
    if n < 100:
        t = FI_UNITS_C[n // 10] + "kymmenes"
        return t if n % 10 == 0 else t + FI_UNITS[n % 10]
    if n == 100:
        return "sadas"
    if n < 200:
        return "sadas" + fi_ord(n - 100)
    return "tuhannes"


def numbers():
    nums = list(range(1, 30)) + [30, 40, 50, 60, 70, 80, 90, 100] + list(range(101, 131)) + [1000]
    gen = look(GEN, [card(n) + "+Num+Sg+Nom" for n in nums])
    cands = {n: ord_candidates(n) for n in nums}
    ana = look(ANA, sorted({c for v in cands.values() for c in v}))
    rows = []
    for n in nums:
        c = card(n)
        if c not in gen.get(c + "+Num+Sg+Nom", []):
            problems.append(f"luku {n}: generaattori ei anna muotoa {c} ({gen.get(c + '+Num+Sg+Nom')})")
        o = next((x for x in cands[n] if any("+Ord" in a for a in ana.get(x, []))), None)
        if not o:
            problems.append(f"järjestysluku {n}: {cands[n]} ei vahvistunut")
        e, oe = entry(c, "Num"), entry(o, "A") if o else None
        rows.append({"n": n, "card": c, "card_id": e[0] if e else None, "ord": o, "ord_id": oe[0] if oe else None,
                     "fi_ord": fi_ord(n), "nb_ord": NB_ORD[n] if n < len(NB_ORD) else ""})
    return rows


# --- Listat ---

def lists():
    L = []
    L.append({"id": "luvut", "icon": "numbers", "title": {"fi": "Luvut ja järjestysluvut", "nb": "Tall og ordenstall"},
              "kind": "numbers", "rows": numbers()})

    days = [("maanantai", "mandag", [("vuossárga", "it"), ("mánnodat", "lä")]),
            ("tiistai", "tirsdag", [("maŋŋebárga", "it"), ("disdat", "lä")]),
            ("keskiviikko", "onsdag", [("gaskavahkku", None)]),
            ("torstai", "torsdag", [("duorastat", None)]),
            ("perjantai", "fredag", [("bearjadat", None)]),
            ("lauantai", "lørdag", [("lávvordat", None)]),
            ("sunnuntai", "søndag", [("sotnabeaivi", None)])]
    L.append({"id": "viikonpaivat", "icon": "week", "title": {"fi": "Viikonpäivät", "nb": "Ukedager"},
              "hint": {"fi": "vuossárga = maanantai · vuossárgga = maanantaina", "nb": "vuossárga = mandag · vuossárgga = på mandag"},
              "rows": [row([fi, fin_form(fi, "Sg+Ess")], [nb, "på " + nb], [sme(s, "N", ["Sg+Gen"], d) for s, d in sm])
                       for fi, nb, sm in days]})

    months = [("tammikuu", "januar", "ođđajagemánnu"), ("helmikuu", "februar", "guovvamánnu"), ("maaliskuu", "mars", "njukčamánnu"),
              ("huhtikuu", "april", "cuoŋománnu"), ("toukokuu", "mai", "miessemánnu"), ("kesäkuu", "juni", "geassemánnu"),
              ("heinäkuu", "juli", "suoidnemánnu"), ("elokuu", "august", "borgemánnu"), ("syyskuu", "september", "čakčamánnu"),
              ("lokakuu", "oktober", "golggotmánnu"), ("marraskuu", "november", "skábmamánnu"), ("joulukuu", "desember", "juovlamánnu")]
    L.append({"id": "kuukaudet", "icon": "month", "title": {"fi": "Kuukaudet", "nb": "Måneder"},
              "hint": {"fi": "ođđajagemánnu = tammikuu · ođđajagemánu = tammikuun · ođđajagemánus = tammikuussa",
                       "nb": "ođđajagemánnu = januar · ođđajagemánu = januars · ođđajagemánus = i januar"},
              "rows": [row([fi, fin_form(fi, "Sg+Gen"), fin_form(fi, "Sg+Ine")], [nb, "i " + nb], [sme(s, "N", ["Sg+Gen", "Sg+Loc"])])
                       for fi, nb, s in months]})

    # Norjaksi "milloin?"-muoto ja kuukausihuomautus (suomeksi ne tulevat taivuttimesta ja listasta)
    NB_WHEN = {"vårvinter": "på vårvinteren", "vår": "om våren", "forsommer": "på forsommeren", "sommer": "om sommeren",
               "ettersommer": "på ettersommeren", "høst": "om høsten", "høstvinter": "på høstvinteren", "vinter": "om vinteren",
               "morgen": "om morgenen", "dag": "om dagen", "ettermiddag": "om ettermiddagen", "kveld": "om kvelden", "natt": "om natten"}
    NB_MONTHS = {"maalis–huhtikuu": "mars–april", "kesäkuu": "juni", "elo–syyskuu": "august–september", "loka–marraskuu": "oktober–november"}
    seasons = [("kevättalvi", "vårvinter", "giđđadálvi", ["Sg+Loc"], "maalis–huhtikuu"),
               ("kevät", "vår", "giđđa", ["=giđđat"], None),
               ("alkukesä", "forsommer", "giđđageassi", ["Sg+Loc"], "kesäkuu"),
               ("kesä", "sommer", "geassi", ["=geassit"], None),
               ("syyskesä", "ettersommer", "čakčageassi", ["Sg+Loc"], "elo–syyskuu"),
               ("syksy", "høst", "čakča", ["=čakčat"], None),
               ("syystalvi", "høstvinter", "čakčadálvi", ["Sg+Loc"], "loka–marraskuu"),
               ("talvi", "vinter", "dálvi", ["=dálvet"], None)]
    L.append({"id": "vuodenajat", "icon": "season", "title": {"fi": "Vuodenajat (8)", "nb": "Årstider (8)"},
              "rows": [row([fi, fin_form(fi, "Sg+Ade")], [nb, NB_WHEN[nb]], [sme(s, "N", tags, fi=fi, nb=nb)],
                           {"fi": note, "nb": NB_MONTHS[note]} if note else None)
                       for fi, nb, s, tags, note in seasons]})

    time = [("aamu", "morgen", "iđit", ["=iđđes"]), ("päivä", "dag", "beaivi", ["=beaivet"]),
            ("keskipäivä", "middag", "gaskabeaivi", ["Sg+Loc"]), ("iltapäivä", "ettermiddag", "maŋŋelgaskabeaivi", ["Sg+Loc"]),
            ("ilta", "kveld", "eahket", ["=eahkes"]), ("yö", "natt", "idja", ["=ihkku"]),
            ("keskiyö", "midnatt", "gaskaidja", ["Sg+Loc"]), ("tänään", "i dag", "odne", []), ("huomenna", "i morgen", "ihttin", []),
            ("eilen", "i går", "ikte", []), ("nyt", "nå", "dál", []), ("viikko", "uke", "vahkku", []),
            ("kello, tunti", "klokke, time", "diibmu", []), ("minuutti", "minutt", "minuhtta", []),
            ("monelta?", "hva tid?", "galles", []),
            # Lisäsanat 2026-11-22 (käyttäjä): kaikki sanakirjassa, SIKOR-yleisyys suluissa
            ("vuorokausi", "døgn", "jándor", []), ("sekunti", "sekund", "sekunda", []),  # 1072, 397
            ("puoli tuntia", "halvtime", "diibmobealli", []), ("vartti", "kvarter", "kvárta", []),  # 223, 109
            ("aikaisin", "tidlig", "árrat", []), ("myöhään", "sent", "maŋŋit", []),  # 1334, 384
            ("kohta, pian", "snart", "fargga", []), ("äsken, vasta", "nettopp", "easkka", [])]  # 2471, 931
    L.append({"id": "aika", "icon": "clock", "title": {"fi": "Vuorokausi", "nb": "Døgnet"},
              "rows": [row([fi] + ([fin_form(fi, "Sg+Ade")] if tags and fin_form(fi, "Sg+Ade") and fi not in ("keskipäivä", "keskiyö") else []),
                           [nb] + ([NB_WHEN[nb]] if nb in NB_WHEN else []), [sme(s, None, tags, fi=fi, nb=nb)]) for fi, nb, s, tags in time]})

    dirs = [("pohjoinen", "nord", "davvi", ["=davvin", "=davás"]), ("etelä", "sør", "lulli", ["=lulde", "=lulás"]),
            ("itä", "øst", "nuorta", ["=nuortan", "=nuorttas"]), ("länsi", "vest", "oarji", ["=oarjin", "=oarjjás"])]
    L.append({"id": "suunnat", "icon": "compass", "title": {"fi": "Ilmansuunnat", "nb": "Himmelretninger"},
              "hint": {"fi": "davvi = pohjoinen · davvin = pohjoisessa · davás = pohjoiseen", "nb": "davvi = nord · davvin = i nord · davás = nordover"},
              "rows": [row([fi, fin_form(fi, "Sg+Ine"), fin_form(fi, "Sg+Ill")], [nb], [sme(s, "N", tags, fi=fi, nb=nb)])
                       for fi, nb, s, tags in dirs]})

    KIN_NB = {"siessá": "fars søster", "goaski": "mors eldre søster", "muoŧŧá": "mors yngre søster",
              "eahki": "fars eldre bror", "čeahci": "fars yngre bror", "eanu": "mors bror"}
    kin = ["eadni", "áhčči", "áhkku", "áddjá", "mánná", "nieida", "bárdni", "oabbá", "oappáš", "viellja", "vieljaš",
           "siessá", "goaski", "muoŧŧá", "eahki", "čeahci", "eanu", "mánáidmánná"]
    kin_rows = []
    for s in kin:
        e = entry(s, "N")
        # Selitys vain sisarussanoille (eahki = isän vanhempi veli); muiden selitykset ovat toisista merkityksistä
        expl = db.execute("SELECT explanations FROM meanings WHERE word_id = ? AND lang = 'fin' AND COALESCE(explanations, '') <> ''",
                          (e[0],)).fetchone() if e and s in ("goaski", "muoŧŧá", "eahki", "čeahci") else None
        fi = first(e[3]) if e else ""
        if s == "siessá":
            fi, expl = "täti", ("isän sisar",)
        if s == "nieida":
            fi = "tytär, tyttö"
        nb = first(e[4]) if e else ""
        if s == "nieida":
            nb = "datter, jente"
        if s == "eanu" and not expl:
            expl = ("äidin veli",)
        note = {"fi": expl[0]} if expl else {}
        if s in KIN_NB:  # norjaksi muuten vain "tante" / "onkel" ilman eroa
            note["nb"] = KIN_NB[s]
        kin_rows.append(row([fi], [nb], [sme(s, "N", [])], note or None))
    L.append({"id": "suku", "icon": "family", "title": {"fi": "Perhe ja suku", "nb": "Familie og slekt"},
              "hint": {"fi": "saamessa eri sana isän ja äidin sisaruksille", "nb": "på samisk egne ord for fars og mors søsken"},
              "rows": kin_rows})

    # Esimerkki attribuuttimuodosta (sanat oikoluettu Divvunilla, substantiivien merkitys tarkistettu sanakirjasta)
    COLOUR_EX = {
        "vielgat": ("vilges muohta", "valkoinen lumi", "kvit snø"), "čáhppat": ("čáhppes beana", "musta koira", "svart hund"),
        "ruoksat": ("rukses dállu", "punainen talo", "rødt hus"), "alit": ("alit albmi", "sininen taivas", "blå himmel"),
        "ruoná": ("ruoná rássi", "vihreä ruoho", "grønt gress"), "fiskat": ("fiskes lieđđi", "keltainen kukka", "gul blomst"),
        "ruškat": ("ruškes boazu", "ruskea poro", "brun rein"), "ránis": ("ránes gáhttu", "harmaa kissa", "grå katt"),
        "oránša": ("oránša biila", "oranssi auto", "oransje bil")}
    COLOUR_EX = {k: {"sme": a, "fi": b, "nb": c} for k, (a, b, c) in COLOUR_EX.items()}
    colours = ["vielgat", "čáhppat", "ruoksat", "alit", "ruoná", "fiskat", "ruškat", "ránis", "oránša"]
    L.append({"id": "varit", "icon": "palette", "title": {"fi": "Värit", "nb": "Farger"},
              "rows": [dict(row([first(entry(s, "A")[3])], [first(entry(s, "A")[4])], [sme(s, "A", ["Attr"])]), ex=COLOUR_EX[s]) for s in colours]})

    deer = [("boazu", None), ("eallu", "tokka, porokarja"), ("áldu", None), ("sarvvis", "hirvas, kuohitsematon urosporo"),
            ("heargi", "ajoporo, kuohittu urosporo"), ("miessi", "vasa"), ("čearpmat", "vasa ensimmäisenä talvenaan"),
            ("vuonjal", "vuonelo, naarasporo toisella ikävuodella"), ("varit", "urakka, urosporo toisella ikävuodella"), ("rotnu", "maho vaadin"),
            ("gárdi", "aitaus, poroerotusaita")]
    L.append({"id": "porot", "icon": "deer", "title": {"fi": "Porot", "nb": "Rein"},
              "rows": [row([fi or first(entry(s, "N")[3])], [first(entry(s, "N")[4])], [sme(s, "N", [])]) for s, fi in deer]})

    weather = [("dálki", "sää"), ("muohta", "lumi"), ("vahca", "vitilumi, uusi lumi"), ("cuoŋu", "hanki"), ("oppas", "umpilumi"),
               ("seaŋáš", "rakeinen pohjalumi"), ("njáhcu", "suojasää"), ("arvi", "sade"), ("biegga", "tuuli"), ("buolaš", "pakkanen"),
               ("liekkas", "lämmin"), ("galmmas", "kylmä"), ("beaivváš", "aurinko"), ("balva", "pilvi"), ("mierká", "sumu"),
               ("jiekŋa", "jää"), ("stoarbma", "myrsky"), ("baján", "ukkonen")]
    WEATHER_NB = {"seaŋáš": "sukkersnø"}  # sanakirjassa ei norjaa
    L.append({"id": "saa", "icon": "snow", "title": {"fi": "Sää ja lumi", "nb": "Vær og snø"},
              "rows": [row([fi], [WEATHER_NB.get(s) or (first(entry(s)[4]) if entry(s) else "")], [sme(s, None, [], fi=fi)]) for s, fi in weather]})

    # Komitatiivi (käyttäjä 2026-11-23: muinna, minguin …; sama kuin lang-sme-generaattori mun+Pron+Pers+Sg1+Com)
    prons = [("minä · minun · minulle · minulla · minun kanssani", "jeg · min · til meg · hos meg · med meg", "mun"),
             ("sinä · sinun · sinulle · sinulla · sinun kanssasi", "du · din · til deg · hos deg · med deg", "don"),
             ("hän · hänen · hänelle · hänellä · hänen kanssaan", "han/hun · hans/hennes · til ham/henne · hos ham/henne · med ham/henne", "son"),
             ("me kaksi · meidän kahden · meille kahdelle · meillä kahdella · meidän kahden kanssa", "vi to · vår (to) · til oss to · hos oss to · med oss to", "moai"),
             ("te kaksi · teidän kahden · teille kahdelle · teillä kahdella · teidän kahden kanssa", "dere to · deres (to) · til dere to · hos dere to · med dere to", "doai"),
             ("he kaksi · heidän kahden · heille kahdelle · heillä kahdella · heidän kahden kanssa", "de to · deres (to) · til dem to · hos dem to · med dem to", "soai"),
             ("me · meidän · meille · meillä · meidän kanssamme", "vi · vår · til oss · hos oss · med oss", "mii"),
             ("te · teidän · teille · teillä · teidän kanssanne", "dere · deres · til dere · hos dere · med dere", "dii"),
             ("he · heidän · heille · heillä · heidän kanssaan", "de · deres · til dem · hos dem · med dem", "sii")]
    prow = []
    for fi, nb, s in prons:
        e = db.execute("SELECT id FROM dictionary WHERE sme_lemma = ? AND subtype = 'Pers'", (s,)).fetchone()
        words = [s] + [form(e[0], t) for t in ("Gen", "Ill", "Loc", "Com")] if e else [s]
        prow.append(row([fi], [nb], [{"w": [w for w in words if w], "id": e[0] if e else None, "fi": "", "nb": ""}]))
    L.append({"id": "pronominit", "icon": "person", "title": {"fi": "Pronominit", "nb": "Pronomen"},
              "hint": {"fi": "saamessa oma muoto kahdelle · moai = me kaksi · mii = me (kolme tai useampi)",
                       "nb": "samisk har egen form for to · moai = vi to · mii = vi (tre eller flere)"},
              "rows": prow})

    questions = [("gii", "kuka"), ("mii", "mikä", "Rel"), ("gos", "missä, mistä"), ("gosa", "mihin"), ("goas", "milloin"),
                 ("manne", "miksi"), ("mo", "miten, kuinka"), ("galle", "montako"), ("galles", "monelta"), ("goabbá", "kumpi"),
                 ("makkár", "millainen")]
    qrows = []
    for q in questions:
        s, fi = q[0], q[1]
        if len(q) > 2:
            e = db.execute("SELECT id, nob_translation FROM dictionary WHERE sme_lemma = ? AND subtype = ?", (s, q[2])).fetchone()
            qrows.append(row([fi], [first(e[1])], [{"w": [s], "id": e[0], "fi": fi, "nb": first(e[1])}]))
        else:
            qrows.append(row([fi], [first(entry(s)[4]) if entry(s) else ""], [sme(s, None, [], fi=fi)]))
    # Esimerkkikysymys jokaiselle (verbimuodot GiellaLT-generaattorilla, sanat Divvunin oikoluvulla tarkistettu)
    QEX = {"gii": ("Gii don leat?", "Kuka sinä olet?", "Hvem er du?"), "mii": ("Mii dát lea?", "Mikä tämä on?", "Hva er dette?"),
           "goabbá": ("Goabbá lea du?", "Kumpi on sinun?", "Hvilken er din?"),
           "makkár": ("Makkár dálki lea?", "Millainen sää on?", "Hva slags vær er det?"),
           "gos": ("Gos don orut?", "Missä sinä asut?", "Hvor bor du?"), "gosa": ("Gosa don manat?", "Mihin sinä menet?", "Hvor skal du?"),
           "goas": ("Goas don boađát?", "Milloin sinä tulet?", "Når kommer du?"),
           "galles": ("Galles don boađát?", "Monelta sinä tulet?", "Hva tid kommer du?"),
           "manne": ("Manne don leat dáppe?", "Miksi sinä olet täällä?", "Hvorfor er du her?"),
           "mo": ("Mo manná?", "Miten menee?", "Hvordan går det?"), "galle": ("Galle jagi don leat?", "Kuinka vanha sinä olet?", "Hvor gammel er du?")}
    for r in qrows:
        e = QEX.get(r["sme"][0]["w"][0])
        if e:
            r["ex"] = {"sme": e[0], "fi": e[1], "nb": e[2]}
        if r["sme"][0]["w"][0] == "galles" and not r["nb"][0]:
            r["nb"] = ["hva tid"]
    # Taivutusmuodot kuten Pronominit-listassa (käyttäjä 2026-11-22; GiellaLT lang-sme: gii Gen/Ill/Loc, mii Acc/Ill/Loc)
    # Komitatiivi (2026-11-24): gii+Pron+Interr+Sg+Com = geainna, mii = mainna (lang-sme-generaattori ja paradigms)
    QFORMS = {"gii": (["gii", "gean", "geasa", "geas", "geainna"], "kuka · kenen · kenelle · keneltä, kenellä · kenen kanssa",
                      "hvem · hvem sin · til hvem · hos hvem, fra hvem · med hvem"),
              "mii": (["mii", "maid", "masa", "mas", "mainna"], "mikä · mitä · mihin · mistä, missä · minkä kanssa, millä",
                      "hva · hva (objekt) · til hva · i hva, fra hva · med hva")}
    for r in qrows:
        f = QFORMS.get(r["sme"][0]["w"][0])
        if f:
            r["sme"][0]["w"], r["fi"], r["nb"] = f[0], [f[1]], [f[2]]
    L.append({"id": "kysymykset", "icon": "question", "title": {"fi": "Kysymyssanat", "nb": "Spørreord"}, "rows": qrows})

    greet = [("Bures!", "hei, terve", "hei"), ("Buorre iđit", "hyvää huomenta", "god morgen"), ("Buorre beaivi", "hyvää päivää", "god dag"),
             ("Buorre eahket", "hyvää iltaa", "god kveld"), ("Mo manná?", "mitä kuuluu?", "hvordan går det?"),
             ("Bures manná", "hyvin menee", "det går bra"), ("Giitu", "kiitos", "takk"), ("Ollu giitu", "paljon kiitoksia", "tusen takk"),
             ("Bures boahtin", "tervetuloa", "velkommen"), ("Báze dearvan", "näkemiin (jäävälle)", "ha det (til den som blir)"),
             ("Mana dearvan", "näkemiin (lähtevälle)", "ha det (til den som går)"), ("Oaidnaleapmái", "näkemiin, nähdään", "på gjensyn"),
             ("Dearvvuođat", "terveisiä", "hilsener"),
             # Syntymäpäivä ja muut juhlapäivät (Omniglot: Lihkku beivviin! = gratulerer med dagen)
             ("Lihkku beivviin!", "hyvää syntymäpäivää, onnea päivän johdosta", "gratulerer med dagen")]
    grows = []
    for s, fi, nb in greet:
        lemma = s.rstrip("!?").lower()
        e = db.execute("SELECT id FROM dictionary WHERE lower(sme_lemma) = ?", (lemma,)).fetchone()
        grows.append(row([fi], [nb], [{"w": [s], "id": e[0] if e else None, "fi": fi, "nb": nb}]))
    L.append({"id": "tervehdykset", "icon": "greet", "title": {"fi": "Tervehdykset", "nb": "Hilsener"}, "rows": grows})
    # Eläimet (elaimet.py, käyttäjä 2026-11-23): samat sanat kuin minipelissä, nyt myös sanastona
    import elaimet
    # layout "alpha" (käyttäjä 2026-11-24): yksi taulukko saame | suomi aakkosjärjestyksessä ilman osioita (vähemmän
    # tilaa); rivien järjestys datassa ennallaan (harjoituksen äänitiedostot ovat rivinumeron mukaan)
    L.append({"id": "elaimet", "icon": "paw", "layout": "alpha", "title": {"fi": "Eläimet", "nb": "Dyr"},
              "rows": [row([fi], [nb], [sme(s_, "N", [], fi=fi, nb=nb)]) for s_, fi, nb in elaimet.ANIMALS]})
    # Marjat, hedelmät ja kasvikset (marjat.py, käyttäjä 2026-11-23): sanakirjan sanat, Sápmin omat osion alussa
    import marjat
    L.append({"id": "marjat", "icon": "berry", "title": {"fi": "Marjat, hedelmät ja kasvikset", "nb": "Bær, frukt og grønnsaker"},
              "rows": [row([fi], [nb], [sme(s_, "N", [], fi=fi, nb=nb)]) for s_, fi, nb in marjat.WORDS]})
    # Arki (arki.py, käyttäjä 2026-11-26): kauppa, pankki, liikkuminen, syöminen; aluksi vain sanoja
    import arki
    for lst in arki.LISTS:
        L.append({"id": lst[0], "icon": lst[1], "title": {"fi": lst[2][0], "nb": lst[2][1]},
                  "rows": [row([fi], [nb], [sme(s_, pos, [], fi=fi, nb=nb)]) for s_, pos, fi, nb, _en in arki.words(lst)]})
    # Kellonajat (kello.py ja kello.json, käyttäjä 2026-11-23): kello, saame ja suomi; norjaksi ja englanniksi
    # digitaalinen aika. Napautus soittaa Biretin lauseen (audio/w/kello-<i>-sme.ogg)
    clock = json.load(open(os.path.join(SCRIPT_DIR, "kello.json"), encoding="utf-8"))["rows"]
    L.append({"id": "kellonajat", "icon": "alarm", "kind": "clock", "title": {"fi": "Kellonajat", "nb": "Klokkeslett"},
              "hint": {"fi": "beal njeallje = puoli neljä · minuutit 20–40 lasketaan puolesta tunnista: logi váile beal njeallje = kymmentä vaille puoli neljä (3.20)",
                       "nb": "beal njeallje = halv fire · fra 20 til 40 over teller man fra halv: logi váile beal njeallje = 3.20"},
              "rows": [dict(row([c["fiShort"]], [f'{c["h"]}.{c["m"]:02d}'], [{"w": [c["sme"]], "id": None, "fi": c["fiShort"], "nb": ""}]),
                            clock=[c["h"], c["m"]], ci=i, sec=c["level"], d=c.get("d", [0, 0])[1]) for i, c in enumerate(clock)],
              "sections": [{"fi": "Tasan", "nb": "Hel time"}, {"fi": "Puoli", "nb": "Halv"}, {"fi": "Vartit", "nb": "Kvarter"},
                           {"fi": "Viiden minuutin välein", "nb": "Hvert femte minutt"}]})
    # Apusanat (apusanat.py, käyttäjä 2026-11-22): neljä listaa, esimerkit sanakirjoista
    import apusanat
    for spec in apusanat.LISTS:
        rows = []
        for _sec, words in spec["sections"]:
            for lemma, pos, forms, fi, nb, _en, ex in words:
                base = lemma.split(" (")[0]  # "dát (pl.)" = dát monikossa (oma rivi, avain r["key"])
                e = entry(base, pos)
                r = row([fi], [nb], [{"w": forms or [lemma], "id": e[0] if e else None, "fi": fi, "nb": nb}])
                if base != lemma:
                    r["key"] = lemma
                if ex:
                    r["ex"] = {"sme": ex[0], "fi": ex[1], "nb": ex[2]}
                rows.append(r)
        lst = {"id": spec["id"], "icon": spec["icon"], "title": {"fi": spec["title"][0], "nb": spec["title"][1]}, "rows": rows}
        # Taulukkolista (Lähellä ja kaukana): sarakeotsikot kolmella kielellä; rivin sarake = sanan paikka osiossa
        if spec.get("layout"):
            lst["layout"] = spec["layout"]
            lst["cols"] = {"fi": spec["cols"][0], "nb": spec["cols"][1], "en": spec["cols"][2]}
            col = {w[0]: k for _t, ws in spec["sections"] for k, w in enumerate(ws)}
            for r in rows:
                r["col"] = col[r.get("key") or r["sme"][0]["w"][0]]
        if spec.get("hint"):
            lst["hint"] = {"fi": spec["hint"][0], "nb": spec["hint"][1]}
        L.append(lst)
    return L


# Listan sisäiset osiot (sanastot.js näyttää ne omina korttinaan otsikkoineen). Avain on rivin ensimmäinen saamen sana;
# rivit järjestetään osioiden järjestykseen, ja osiota vailla jäävä rivi menee viimeiseen osioon.
SECTIONS = {
    "vuodenajat": [("Kevät", "Vår", ["giđđadálvi", "giđđa"]), ("Kesä", "Sommer", ["giđđageassi", "geassi"]),
                   ("Syksy", "Høst", ["čakčageassi", "čakča"]), ("Talvi", "Vinter", ["čakčadálvi", "dálvi"])],
    "aika": [("Vuorokauden ajat", "Tider på døgnet", ["iđit", "beaivi", "gaskabeaivi", "maŋŋelgaskabeaivi", "eahket", "idja", "gaskaidja"]),
             ("Päivät", "Dager", ["odne", "ihttin", "ikte", "dál", "fargga", "easkka"]),
             ("Aikaisin ja myöhään", "Tidlig og sent", ["árrat", "maŋŋit"]),
             ("Kello ja aika", "Klokke og tid", ["jándor", "vahkku", "diibmu", "diibmobealli", "kvárta", "minuhtta", "sekunda", "galles"])],
    # Lähiperhe pareittain rinnakkain: äiti | isä, sisar | veli, pikkusisko | pikkuveli, tytär | poika, lapsi
    "suku": [("Lähiperhe", "Nærmeste familie", ["eadni", "áhčči", "oabbá", "viellja", "oappáš", "vieljaš", "nieida", "bárdni", "mánná"]),
             # Suku pareittain: isoäiti | isoisä, äidin sisaret (vanhempi | nuorempi), isän sisar | äidin veli,
             # isän veljet (vanhempi | nuorempi), lapsenlapsi
             ("Suku", "Slekt", ["áhkku", "áddjá", "goaski", "muoŧŧá", "siessá", "eanu", "eahki", "čeahci", "mánáidmánná"])],
    "porot": [("Porot ja tokka", "Rein og flokk", ["boazu", "eallu", "gárdi"]),
              ("Urokset, naaraat ja vasat", "Bukker, simler og kalver",
               ["áldu", "rotnu", "sarvvis", "heargi", "miessi", "čearpmat", "vuonjal", "varit"])],
    "saa": [("Sää", "Vær", ["dálki", "beaivváš", "balva", "arvi", "biegga", "stoarbma", "baján", "mierká", "njáhcu",
                            "buolaš", "liekkas", "galmmas"]),
            ("Lumi ja jää", "Snø og is", ["muohta", "vahca", "cuoŋu", "oppas", "seaŋáš", "jiekŋa"])],
    "pronominit": [("Yksikkö", "Entall", ["mun", "don", "son"]), ("Kaksikko", "Totall", ["moai", "doai", "soai"]),
                   ("Monikko", "Flertall", ["mii", "dii", "sii"])],
    "kysymykset": [("Kuka, mikä, millainen", "Hvem, hva, hvordan", ["gii", "mii", "goabbá", "makkár"]),
                   ("Missä, mihin, milloin", "Hvor, hvorhen, når", ["gos", "gosa", "goas", "galles"]),
                   ("Miksi, miten, montako", "Hvorfor, hvordan, hvor mange", ["manne", "mo", "galle"])],
    "tervehdykset": [("Tervehdys", "Hilsen", ["Bures!", "Buorre iđit", "Buorre beaivi", "Buorre eahket"]),
                     ("Kuulumiset ja kiitos", "Hvordan går det, takk", ["Mo manná?", "Bures manná", "Giitu", "Ollu giitu", "Bures boahtin"]),
                     ("Hyvästit", "Avskjed", ["Báze dearvan", "Mana dearvan", "Oaidnaleapmái", "Dearvvuođat"]),
                     ("Juhlapäivä", "Merkedag", ["Lihkku beivviin!"])],
}

# Eläinten osiot (elaimet.py)
import elaimet as _ela
SECTIONS["elaimet"] = [(t[0], t[1], t[3]) for t in _ela.SECTIONS]
# Marjojen, hedelmien ja kasvisten osiot (marjat.py)
import marjat as _mar
SECTIONS["marjat"] = [(t[0], t[1], t[3]) for t in _mar.SECTIONS]
# Arjen sanastojen osiot (arki.py)
import arki as _arki
for _l in _arki.LISTS:
    SECTIONS[_l[0]] = [(sec[0], sec[1], [w[0] for w in sec[3]]) for sec in _l[3]]
# Apusanojen osiot samasta tiedostosta (apusanat.py)
import apusanat as _apu
for _spec in _apu.LISTS:
    SECTIONS[_spec["id"]] = [(t[0], t[1], [w[0] for w in ws]) for t, ws in _spec["sections"]]


def add_sections(L):
    for lst in L:
        secs = SECTIONS.get(lst["id"])
        if not secs:
            continue
        where = {w: i for i, (_, _, ws) in enumerate(secs) for w in ws}
        for r in lst["rows"]:
            key = r.get("key") or r["sme"][0]["w"][0]
            if key not in where:
                problems.append(f"{lst['id']}: ei osiota sanalle {key}")
            r["sec"] = where.get(key, len(secs) - 1)
        order = {w: k for _, _, ws in secs for k, w in enumerate(ws)}
        lst["rows"].sort(key=lambda r: (r["sec"], order.get(r.get("key") or r["sme"][0]["w"][0], 99)))
        lst["sections"] = [{"fi": fi, "nb": nb} for fi, nb, _ in secs]
        for k, (_, _, ws) in enumerate(secs):
            missing = set(ws) - {r.get("key") or r["sme"][0]["w"][0] for r in lst["rows"]}
            if missing:
                problems.append(f"{lst['id']}: osion sanoja puuttuu listasta: {', '.join(sorted(missing))}")


def check_spelling(L):
    try:
        import libvoikko
        spell = libvoikko.Voikko("se").spell
    except Exception:
        problems.append("Divvunin oikolukua ei voitu ladata")
        return
    words = set()
    for lst in L:
        for r in lst["rows"]:
            if lst.get("kind") == "numbers":
                words |= {r["card"], r["ord"] or ""}
            else:
                for s in r["sme"]:
                    for w in s["w"]:
                        words |= set(re.findall(r"[\wáčđŋšŧžÁČĐŊŠŦŽ]+", w))
                if r.get("ex"):
                    words |= set(re.findall(r"[\wáčđŋšŧžÁČĐŊŠŦŽ]+", r["ex"]["sme"]))
    for w in sorted(w for w in words if w):
        if not spell(w):
            problems.append(f"oikoluku hylkää: {w}")


def ogg_seconds(path):
    """Ogg Opus -tiedoston kesto: viimeisen sivun granule-sijainti miinus OpusHeadin pre-skip, 48 kHz."""
    with open(path, "rb") as f:
        data = f.read()
    head = data.find(b"OpusHead")
    pre_skip = int.from_bytes(data[head + 10:head + 12], "little") if head >= 0 else 0
    last = data.rfind(b"OggS")
    granule = int.from_bytes(data[last + 6:last + 14], "little")
    return round((granule - pre_skip) / 48000, 2)


def add_inari(L):
    """Inarinsaame (kokeellinen, asetuksista): listan jokaiselle sanalle smn = inarinsaamen perusmuoto, kun kaksi lähdettä
    vahvistaa sen (smn_words.py, sama sääntö kuin minipelissä). Vain perusmuoto: inarinsaamen generaattoria ei ole, joten
    taivutusmuodot, esimerkkilauseet ja murremuodot jäävät pois. Lukulistaa ei käännetä (yhdysluvut). Jos sama inarin sana
    tulisi listassa kahdelle sanalle (täti: goaski ja siessá), se jää vain sille, jonka oma inarin käännös se on."""
    import smn_words
    picker = smn_words.InariPicker(db, os.path.join(SCRIPT_DIR, "sanastot_smn_tarkistus.tsv"), "sanastojen sanat")
    if not picker.available:
        print("Inarinsaame: dict-smn-fin puuttuu, sanastot vain pohjoissaameksi")
        return
    total = 0
    for lst in L:
        if lst.get("kind") in ("numbers", "clock"):
            continue
        got = {}
        for r in lst["rows"]:
            x = r["sme"][0]
            fi = ((r.get("fi") or [""])[0] or "").split(" · ")[0]
            nb = ((r.get("nb") or [""])[0] or "").split(" · ")[0]
            pos = None
            if x.get("id"):
                p = db.execute("SELECT pos FROM dictionary WHERE id = ?", (x["id"],)).fetchone()
                pos = p[0] if p else None
            word, why, piv = picker.pick(x["w"][0], fi, pos, nb)
            if word:
                got.setdefault(word, []).append((x, fi, nb, piv))
        for word, hits in got.items():
            own = [h for h in hits if h[3] == word]
            keep = own[:1] if len(hits) > 1 and own else hits[:1]
            for h in hits:
                if h in keep:
                    h[0]["smn"] = word
                    total += 1
                else:
                    picker.unpick(h[0]["w"][0], h[1], h[2], h[3], f"sama inarin sana {word} kuin sanalla {keep[0][0]['w'][0]}")
    picker.save()
    print(f"Sanastot inarinsaameksi: {total} sanaa; " + picker.summary())


if __name__ == "__main__":
    L = lists()
    add_sections(L)
    import sanastot_en  # englanti (2026-11-21)
    sanastot_en.apply(L, problems)
    # Valmiit äänilistat (suomi + saame, Ogg Opus, web/audio/, ks. ~/Git/fi-tts): listan yläreunan kaiutin soittaa
    # <id>.ogg:n; lukutaulukon osioilla omat painikkeet perus- ja järjestysluvuille (luvut-N.ogg, jarjestysluvut-N.ogg)
    audio = lambda name: f"audio/{name}.ogg" if os.path.exists(os.path.join(os.path.dirname(OUT), "..", "audio", name + ".ogg")) else None
    # 2026-11-19: koko listan äänitteet poistettu (kuunteluharjoitus ja sanojen omat äänet korvaavat ne); jäljellä vain
    # tervehdysten keskustelu saameksi (Máhtte ja Biret), sama kummassakin käyttöliittymässä. Sanojen napautus soittaa
    # paketoidun äänen (web/audio/s/, kolme ääntä).
    for lst in L:
        if lst["id"] == "tervehdykset" and audio("tervehdykset-sme"):
            lst["audio"] = audio("tervehdykset-sme")
        if lst["id"] == "luvut":
            lst["numSections"] = [{"label": lab, "playLabel": pl, "from": start, "card": None, "ord": None}
                                  for lab, pl, start in [("1–29", "1–29", 1), ("30–100", "30–100", 30), ("101–1000", "100–120", 101)]]
    check_spelling(L)
    add_inari(L)
    # Äänilistojen kestot (s): Android WebView ilmoittaa sovelluksen omien Ogg-tiedostojen keston äärettömäksi, joten
    # soittimen edistymiskehä käyttää näitä
    adir = os.path.join(os.path.dirname(OUT), "..", "audio")
    dur = {f"audio/{n}": ogg_seconds(os.path.join(adir, n)) for n in sorted(os.listdir(adir)) if n.endswith(".ogg")} if os.path.isdir(adir) else {}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"lists": L, "audioDur": dur}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{OUT}: {len(L)} listaa, {sum(len(x['rows']) for x in L)} riviä, {os.path.getsize(OUT)} tavua")
    for p in problems:
        print("  HUOM:", p)
