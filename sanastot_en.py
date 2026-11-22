"""Sanastojen englanti (2026-11-21): otsikot, ohjeet, osiot ja rivien englanninkieliset vastineet.

Avaimena listan tunniste ja rivin ensimmäinen saamen sana (kuten SECTIONS sanastot.py:ssä). sanastot.py lisää
jokaiselle riville kentän "en" (ja otsikoille, ohjeille, huomautuksille ja esimerkeille). Puuttuva sana näkyy ajon
lopussa ongelmana. Käännökset on kirjoitettu käsin sanakirjan suomen- ja norjankielisten vastineiden mukaan.
"""

TITLES = {"luvut": "Numbers and ordinals", "viikonpaivat": "Days of the week", "kuukaudet": "Months",
          "vuodenajat": "Seasons (8)", "aika": "Times of day", "suunnat": "Points of the compass", "suku": "Family and relatives",
          "varit": "Colours", "porot": "Reindeer", "saa": "Weather and snow", "pronominit": "Pronouns",
          "kysymykset": "Question words", "tervehdykset": "Greetings"}

HINTS = {"viikonpaivat": "vuossárga = Monday · vuossárgga = on Monday",
         "kuukaudet": "ođđajagemánnu = January · ođđajagemánu = January's · ođđajagemánus = in January",
         "suunnat": "davvi = north · davvin = in the north · davás = northwards",
         "suku": "Sámi has different words for the father's and the mother's siblings",
         "pronominit": "Sámi has its own form for two · moai = we two · mii = we (three or more)"}

SECTIONS = {
    "vuodenajat": ["Spring", "Summer", "Autumn", "Winter"],
    "aika": ["Times of the day", "Days", "Clock and time"],
    "suku": ["Close family", "Relatives"],
    "porot": ["Reindeer and herd", "Bulls, does and calves"],
    "saa": ["Weather", "Snow and ice"],
    "pronominit": ["Singular", "Dual", "Plural"],
    "kysymykset": ["Who, what, what kind", "Where, where to, when", "Why, how, how many"],
    "tervehdykset": ["Greeting", "How are you, thanks", "Goodbyes", "Celebration"],
}

# Rivi: saamen ensimmäinen sana -> [englanti, muoto, ...] (sama järjestys kuin suomen ja norjan muodoilla)
ROWS = {
    "viikonpaivat": {"vuossárga": ["Monday", "on Monday"], "mánnodat": ["Monday", "on Monday"],
                     "maŋŋebárga": ["Tuesday", "on Tuesday"], "disdat": ["Tuesday", "on Tuesday"],
                     "gaskavahkku": ["Wednesday", "on Wednesday"], "duorastat": ["Thursday", "on Thursday"],
                     "bearjadat": ["Friday", "on Friday"], "lávvordat": ["Saturday", "on Saturday"],
                     "sotnabeaivi": ["Sunday", "on Sunday"]},
    "kuukaudet": {"ođđajagemánnu": ["January", "in January"], "guovvamánnu": ["February", "in February"],
                  "njukčamánnu": ["March", "in March"], "cuoŋománnu": ["April", "in April"], "miessemánnu": ["May", "in May"],
                  "geassemánnu": ["June", "in June"], "suoidnemánnu": ["July", "in July"], "borgemánnu": ["August", "in August"],
                  "čakčamánnu": ["September", "in September"], "golggotmánnu": ["October", "in October"],
                  "skábmamánnu": ["November", "in November"], "juovlamánnu": ["December", "in December"]},
    "vuodenajat": {"giđđadálvi": ["late winter", "in late winter"], "giđđa": ["spring", "in spring"],
                   "giđđageassi": ["early summer", "in early summer"], "geassi": ["summer", "in summer"],
                   "čakčageassi": ["late summer", "in late summer"], "čakča": ["autumn", "in autumn"],
                   "čakčadálvi": ["early winter", "in early winter"], "dálvi": ["winter", "in winter"]},
    "aika": {"iđit": ["morning", "in the morning"], "beaivi": ["day", "during the day"], "gaskabeaivi": ["noon, midday"],
             "maŋŋelgaskabeaivi": ["afternoon", "in the afternoon"], "eahket": ["evening", "in the evening"],
             "idja": ["night", "at night"], "gaskaidja": ["midnight"], "odne": ["today"], "ihttin": ["tomorrow"],
             "ikte": ["yesterday"], "dál": ["now"], "vahkku": ["week"], "diibmu": ["clock, hour"], "minuhtta": ["minute"],
             "galles": ["at what time?"]},
    "suunnat": {"davvi": ["north", "in the north", "northwards"], "lulli": ["south", "in the south", "southwards"],
                "nuorta": ["east", "in the east", "eastwards"], "oarji": ["west", "in the west", "westwards"]},
    "suku": {"eadni": ["mother"], "áhčči": ["father"], "áhkku": ["grandmother"], "áddjá": ["grandfather"], "mánná": ["child"],
             "nieida": ["daughter, girl"], "bárdni": ["son, boy"], "oabbá": ["sister"], "oappáš": ["little sister"],
             "viellja": ["brother"], "vieljaš": ["little brother"], "siessá": ["aunt"], "goaski": ["aunt"], "muoŧŧá": ["aunt"],
             "eahki": ["uncle"], "čeahci": ["uncle"], "eanu": ["uncle"], "mánáidmánná": ["grandchild"]},
    "varit": {"vielgat": ["white"], "čáhppat": ["black"], "ruoksat": ["red"], "alit": ["blue"], "ruoná": ["green"],
              "fiskat": ["yellow"], "ruškat": ["brown"], "ránis": ["grey"], "oránša": ["orange"]},
    "porot": {"boazu": ["reindeer"], "eallu": ["herd of reindeer"], "áldu": ["female reindeer, doe"],
              "sarvvis": ["bull, uncastrated male reindeer"], "heargi": ["draught reindeer, castrated male"],
              "miessi": ["reindeer calf"], "čearpmat": ["calf in its first winter"],
              "vuonjal": ["female reindeer in its second year"], "varit": ["male reindeer in its second year"],
              "rotnu": ["barren doe"], "gárdi": ["corral, fence for separating reindeer"]},
    "saa": {"dálki": ["weather"], "muohta": ["snow"], "vahca": ["fresh snow"], "cuoŋu": ["snow crust"],
            "oppas": ["deep untrodden snow"], "seaŋáš": ["granular snow at the bottom of the snow cover"],
            "njáhcu": ["thaw"], "arvi": ["rain"], "biegga": ["wind"], "buolaš": ["frost, freezing cold"], "liekkas": ["warm"],
            "galmmas": ["cold"], "beaivváš": ["sun"], "balva": ["cloud"], "mierká": ["fog"], "jiekŋa": ["ice"],
            "stoarbma": ["storm"], "baján": ["thunder"]},
    "pronominit": {"mun": ["I · my · to me · with me"], "don": ["you · your · to you · with you"],
                   "son": ["he/she · his/her · to him/her · with him/her"],
                   "moai": ["we two · our (two) · to us two · with us two"],
                   "doai": ["you two · your (two) · to you two · with you two"],
                   "soai": ["they two · their (two) · to them two · with them two"],
                   "mii": ["we · our · to us · with us"], "dii": ["you (all) · your · to you · with you"],
                   "sii": ["they · their · to them · with them"]},
    "kysymykset": {"gii": ["who"], "mii": ["what"], "gos": ["where, from where"], "gosa": ["where to"], "goas": ["when"],
                   "manne": ["why"], "mo": ["how"], "galle": ["how many"], "galles": ["at what time"],
                   "goabbá": ["which (of two)"], "makkár": ["what kind of"]},
    "tervehdykset": {"Bures!": ["hi, hello"], "Buorre iđit": ["good morning"], "Buorre beaivi": ["good day"],
                     "Buorre eahket": ["good evening"], "Mo manná?": ["how are you?"], "Bures manná": ["I'm fine"],
                     "Giitu": ["thanks"], "Ollu giitu": ["thank you very much"], "Bures boahtin": ["welcome"],
                     "Báze dearvan": ["goodbye (to the one staying)"], "Mana dearvan": ["goodbye (to the one leaving)"],
                     "Oaidnaleapmái": ["see you"], "Dearvvuođat": ["greetings"],
                     "Lihkku beivviin!": ["happy birthday, congratulations on your day"]},
}

# Rivin huomautus (suomeksi ja norjaksi jo listassa): sama avain
NOTES = {"vuodenajat": {"giđđadálvi": "March–April", "giđđageassi": "June", "čakčageassi": "August–September",
                        "čakčadálvi": "October–November"},
         "suku": {"siessá": "father's sister", "goaski": "mother's older sister", "muoŧŧá": "mother's younger sister",
                  "eahki": "father's older brother", "čeahci": "father's younger brother", "eanu": "mother's brother"}}

# Esimerkit (värit ja kysymykset): saamen esimerkki -> englanti
EXAMPLES = {"vilges muohta": "white snow", "čáhppes beana": "black dog", "rukses dállu": "red house", "alit albmi": "blue sky",
            "ruoná rássi": "green grass", "fiskes lieđđi": "yellow flower", "ruškes boazu": "brown reindeer",
            "ránes gáhttu": "grey cat", "oránša biila": "orange car",
            "Gii don leat?": "Who are you?", "Mii dát lea?": "What is this?", "Goabbá lea du?": "Which one is yours?",
            "Makkár dálki lea?": "What is the weather like?", "Gos don orut?": "Where do you live?",
            "Gosa don manat?": "Where are you going?", "Goas don boađát?": "When are you coming?",
            "Galles don boađát?": "At what time are you coming?", "Manne don leat dáppe?": "Why are you here?",
            "Mo manná?": "How are you?", "Galle jagi don leat?": "How old are you?"}

EN_ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh",
          "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth"]
EN_TENS = {2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety"}


def en_ord(n):
    if n < 20:
        return EN_ORD[n]
    if n < 100:
        return EN_TENS[n // 10][:-1] + "ieth" if n % 10 == 0 else EN_TENS[n // 10] + "-" + EN_ORD[n % 10]
    if n == 100:
        return "hundredth"
    if n < 200:
        return "hundred and " + en_ord(n - 100)
    return "thousandth"


def apply(L, problems):
    """Lisää englannin kentät sanastot.py:n listoihin (L muuttuu paikallaan)."""
    for lst in L:
        lid = lst["id"]
        lst["title"]["en"] = TITLES[lid]
        if lst.get("hint"):
            if lid in HINTS:
                lst["hint"]["en"] = HINTS[lid]
            else:
                problems.append(f"en: ohje puuttuu listalta {lid}")
        if lst.get("kind") == "numbers":
            for r in lst["rows"]:
                r["en_ord"] = en_ord(r["n"])
            continue
        for k, sec in enumerate(lst.get("sections", [])):
            sec["en"] = SECTIONS[lid][k]
        for r in lst["rows"]:
            key = r["sme"][0]["w"][0]
            en = ROWS.get(lid, {}).get(key)
            if not en:
                problems.append(f"en: puuttuu {lid}: {key}")
                en = [""]
            r["en"] = en
            for s in r["sme"]:
                s["en"] = en[0]
            if r.get("note"):
                note = NOTES.get(lid, {}).get(key)
                if note:
                    r["note"]["en"] = note
                else:
                    problems.append(f"en: huomautus puuttuu {lid}: {key}")
            if r.get("ex"):
                ex = EXAMPLES.get(r["ex"]["sme"])
                if ex:
                    r["ex"]["en"] = ex
                else:
                    problems.append(f"en: esimerkki puuttuu {r['ex']['sme']}")
