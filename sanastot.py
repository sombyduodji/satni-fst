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
    nums = list(range(1, 22)) + [30, 40, 50, 60, 70, 80, 90, 100] + list(range(101, 111)) + [120, 130, 1000]
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
              "hint": {"fi": "perusmuoto · milloin? (maanantaina)", "nb": "grunnform · når? (på mandag)"},
              "rows": [row([fi, fin_form(fi, "Sg+Ess")], [nb, "på " + nb], [sme(s, "N", ["Sg+Gen"], d) for s, d in sm])
                       for fi, nb, sm in days]})

    months = [("tammikuu", "januar", "ođđajagemánnu"), ("helmikuu", "februar", "guovvamánnu"), ("maaliskuu", "mars", "njukčamánnu"),
              ("huhtikuu", "april", "cuoŋománnu"), ("toukokuu", "mai", "miessemánnu"), ("kesäkuu", "juni", "geassemánnu"),
              ("heinäkuu", "juli", "suoidnemánnu"), ("elokuu", "august", "borgemánnu"), ("syyskuu", "september", "čakčamánnu"),
              ("lokakuu", "oktober", "golggotmánnu"), ("marraskuu", "november", "skábmamánnu"), ("joulukuu", "desember", "juovlamánnu")]
    L.append({"id": "kuukaudet", "icon": "month", "title": {"fi": "Kuukaudet", "nb": "Måneder"},
              "hint": {"fi": "perusmuoto · genetiivi · missä? (tammikuussa)", "nb": "grunnform · genitiv · når? (i januar)"},
              "rows": [row([fi, fin_form(fi, "Sg+Gen"), fin_form(fi, "Sg+Ine")], [nb, "i " + nb], [sme(s, "N", ["Sg+Gen", "Sg+Loc"])])
                       for fi, nb, s in months]})

    seasons = [("kevättalvi", "vårvinter", "giđđadálvi", ["Sg+Loc"], "maalis–huhtikuu"),
               ("kevät", "vår", "giđđa", ["=giđđat"], None),
               ("alkukesä", "forsommer", "giđđageassi", ["Sg+Loc"], "kesäkuu"),
               ("kesä", "sommer", "geassi", ["=geassit"], None),
               ("syyskesä", "ettersommer", "čakčageassi", ["Sg+Loc"], "elo–syyskuu"),
               ("syksy", "høst", "čakča", ["=čakčat"], None),
               ("syystalvi", "høstvinter", "čakčadálvi", ["Sg+Loc"], "loka–marraskuu"),
               ("talvi", "vinter", "dálvi", ["=dálvet"], None)]
    L.append({"id": "vuodenajat", "icon": "season", "title": {"fi": "Vuodenajat (8)", "nb": "Årstider (8)"},
              "hint": {"fi": "saamelainen vuosi: 8 vuodenaikaa · milloin? (keväällä)", "nb": "det samiske året: 8 årstider · når? (om våren)"},
              "rows": [row([fi, fin_form(fi, "Sg+Ade")], [nb], [sme(s, "N", tags, fi=fi, nb=nb)], {"fi": note} if note else None)
                       for fi, nb, s, tags, note in seasons]})

    time = [("aamu", "morgen", "iđit", ["=iđđes"]), ("päivä", "dag", "beaivi", ["=beaivet"]),
            ("keskipäivä", "middag", "gaskabeaivi", ["Sg+Loc"]), ("iltapäivä", "ettermiddag", "maŋŋelgaskabeaivi", ["Sg+Loc"]),
            ("ilta", "kveld", "eahket", ["=eahkes"]), ("yö", "natt", "idja", ["=ihkku"]),
            ("keskiyö", "midnatt", "gaskaidja", ["Sg+Loc"]), ("tänään", "i dag", "odne", []), ("huomenna", "i morgen", "ihttin", []),
            ("eilen", "i går", "ikte", []), ("nyt", "nå", "dál", []), ("viikko", "uke", "vahkku", []),
            ("kello, tunti", "klokke, time", "diibmu", []), ("minuutti", "minutt", "minuhtta", []),
            ("monelta?", "når? (klokka)", "galles", [])]
    L.append({"id": "aika", "icon": "clock", "title": {"fi": "Vuorokausi ja kello", "nb": "Døgnet og klokka"},
              "hint": {"fi": "perusmuoto · milloin? (aamulla)", "nb": "grunnform · når? (om morgenen)"},
              "rows": [row([fi] + ([fin_form(fi, "Sg+Ade")] if tags and fin_form(fi, "Sg+Ade") and fi not in ("keskipäivä", "keskiyö") else []),
                           [nb], [sme(s, None, tags, fi=fi, nb=nb)]) for fi, nb, s, tags in time]})

    dirs = [("pohjoinen", "nord", "davvi", ["=davvin", "=davás"]), ("etelä", "sør", "lulli", ["=lulde", "=lulás"]),
            ("itä", "øst", "nuorta", ["=nuortan", "=nuorttas"]), ("länsi", "vest", "oarji", ["=oarjin", "=oarjjás"])]
    L.append({"id": "suunnat", "icon": "compass", "title": {"fi": "Ilmansuunnat", "nb": "Himmelretninger"},
              "hint": {"fi": "perusmuoto · missä? · mihin?", "nb": "grunnform · hvor? · hvorhen?"},
              "rows": [row([fi, fin_form(fi, "Sg+Ine"), fin_form(fi, "Sg+Ill")], [nb], [sme(s, "N", tags, fi=fi, nb=nb)])
                       for fi, nb, s, tags in dirs]})

    kin = ["eadni", "áhčči", "váhnen", "áhkku", "áddjá", "mánná", "nieida", "bárdni", "oabbá", "oappáš", "viellja", "vieljaš",
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
        if s == "váhnen":  # vanhempi · vanhemmat = váhnen · váhnemat (sanakirjan erillinen monikkohakusana váhnemat)
            kin_rows.append(row(["vanhempi", "vanhemmat"], ["forelder", "foreldre"], [sme("váhnen", "N", ["Pl+Nom"])]))
            continue
        kin_rows.append(row([fi], [first(e[4]) if e else ""], [sme(s, "N", [])], {"fi": expl[0]} if expl else None))
    L.append({"id": "suku", "icon": "family", "title": {"fi": "Perhe ja suku", "nb": "Familie og slekt"},
              "hint": {"fi": "saamessa eri sana isän ja äidin sisaruksille", "nb": "på samisk egne ord for fars og mors søsken"},
              "rows": kin_rows})

    colours = ["vielgat", "čáhppat", "ruoksat", "alit", "ruoná", "fiskat", "ruškat", "ránis", "oránša"]
    L.append({"id": "varit", "icon": "palette", "title": {"fi": "Värit", "nb": "Farger"},
              "hint": {"fi": "talo on punainen (ruoksat) · punainen talo (rukses)", "nb": "huset er rødt (ruoksat) · et rødt hus (rukses)"},
              "rows": [row([first(entry(s, "A")[3])], [first(entry(s, "A")[4])], [sme(s, "A", ["Attr"])]) for s in colours]})

    deer = [("boazu", None), ("eallu", "tokka, porokarja"), ("áldu", None), ("sarvvis", "hirvas, kuohitsematon urosporo"),
            ("heargi", "ajoporo, kuohittu urosporo"), ("miessi", "vasa"), ("čearpmat", "vuoden vanha urosporo"),
            ("vuonjal", "vuoden vanha naarasporo"), ("varit", "kahden vuoden vanha urosporo"), ("rotnu", "maho vaadin"),
            ("gárdi", "aitaus, poroerotusaita")]
    L.append({"id": "porot", "icon": "deer", "title": {"fi": "Porot", "nb": "Rein"},
              "rows": [row([fi or first(entry(s, "N")[3])], [first(entry(s, "N")[4])], [sme(s, "N", [])]) for s, fi in deer]})

    weather = [("dálki", "sää"), ("muohta", "lumi"), ("vahca", "vitilumi, uusi lumi"), ("cuoŋu", "hanki"), ("oppas", "umpilumi"),
               ("seaŋáš", "rakeinen pohjalumi"), ("njáhcu", "suojasää"), ("arvi", "sade"), ("biegga", "tuuli"), ("buolaš", "pakkanen"),
               ("liekkas", "lämmin"), ("galmmas", "kylmä"), ("beaivváš", "aurinko"), ("balva", "pilvi"), ("mierká", "sumu"),
               ("jiekŋa", "jää"), ("stoarbma", "myrsky"), ("baján", "ukkonen")]
    L.append({"id": "saa", "icon": "snow", "title": {"fi": "Sää ja lumi", "nb": "Vær og snø"},
              "rows": [row([fi], [first(entry(s)[4]) if entry(s) else ""], [sme(s, None, [], fi=fi)]) for s, fi in weather]})

    prons = [("minä · minun · minulle · minulla", "jeg · min · til meg · hos meg", "mun"), ("sinä · sinun · sinulle · sinulla", "du · din · til deg · hos deg", "don"),
             ("hän · hänen · hänelle · hänellä", "han/hun · hans/hennes · til ham/henne · hos ham/henne", "son"),
             ("me kaksi · meidän kahden · meille kahdelle · meillä kahdella", "vi to · vår (to) · til oss to · hos oss to", "moai"),
             ("te kaksi · teidän kahden · teille kahdelle · teillä kahdella", "dere to · deres (to) · til dere to · hos dere to", "doai"),
             ("he kaksi · heidän kahden · heille kahdelle · heillä kahdella", "de to · deres (to) · til dem to · hos dem to", "soai"),
             ("me · meidän · meille · meillä", "vi · vår · til oss · hos oss", "mii"), ("te · teidän · teille · teillä", "dere · deres · til dere · hos dere", "dii"),
             ("he · heidän · heille · heillä", "de · deres · til dem · hos dem", "sii")]
    prow = []
    for fi, nb, s in prons:
        e = db.execute("SELECT id FROM dictionary WHERE sme_lemma = ? AND subtype = 'Pers'", (s,)).fetchone()
        words = [s] + [form(e[0], t) for t in ("Gen", "Ill", "Loc")] if e else [s]
        prow.append(row([fi], [nb], [{"w": [w for w in words if w], "id": e[0] if e else None, "fi": "", "nb": ""}]))
    L.append({"id": "pronominit", "icon": "person", "title": {"fi": "Pronominit", "nb": "Pronomen"},
              "hint": {"fi": "perusmuoto · genetiivi · kenelle? · kenellä?; saamessa myös kaksikko (duaali)",
                       "nb": "grunnform · genitiv · til hvem? · hos hvem?; samisk har også totall (dual)"},
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
    L.append({"id": "kysymykset", "icon": "question", "title": {"fi": "Kysymyssanat", "nb": "Spørreord"}, "rows": qrows})

    greet = [("Bures!", "hei, terve", "hei"), ("Buorre iđit", "hyvää huomenta", "god morgen"), ("Buorre beaivi", "hyvää päivää", "god dag"),
             ("Buorre eahket", "hyvää iltaa", "god kveld"), ("Mo manná?", "mitä kuuluu?", "hvordan går det?"),
             ("Bures manná", "hyvin menee", "det går bra"), ("Giitu", "kiitos", "takk"), ("Ollu giitu", "paljon kiitoksia", "tusen takk"),
             ("Bures boahtin", "tervetuloa", "velkommen"), ("Báze dearvan", "näkemiin (jäävälle)", "ha det (til den som blir)"),
             ("Mana dearvan", "näkemiin (lähtevälle)", "ha det (til den som går)"), ("Oaidnaleapmái", "näkemiin, nähdään", "på gjensyn"),
             ("Dearvvuođat", "terveisiä", "hilsener")]
    grows = []
    for s, fi, nb in greet:
        lemma = s.rstrip("!?").lower()
        e = db.execute("SELECT id FROM dictionary WHERE lower(sme_lemma) = ?", (lemma,)).fetchone()
        grows.append(row([fi], [nb], [{"w": [s], "id": e[0] if e else None, "fi": fi, "nb": nb}]))
    L.append({"id": "tervehdykset", "icon": "greet", "title": {"fi": "Tervehdykset", "nb": "Hilsener"}, "rows": grows})
    return L


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
    for w in sorted(w for w in words if w):
        if not spell(w):
            problems.append(f"oikoluku hylkää: {w}")


if __name__ == "__main__":
    L = lists()
    check_spelling(L)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"lists": L}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{OUT}: {len(L)} listaa, {sum(len(x['rows']) for x in L)} riviä, {os.path.getsize(OUT)} tavua")
    for p in problems:
        print("  HUOM:", p)
