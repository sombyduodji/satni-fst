"""Arki (käyttäjä 2026-11-26): arjen tilanteiden sanastot (kauppa, pankki, liikkuminen, syöminen) – aluksi vain
yksittäisiä sanoja; lauseet myöhemmin, kun ne on tarkistettu (ehdokkaat: docs/arki-ehdokkaat.md).

Jokainen saamen sana on sovelluksen sanakirjassa (satni.db: dict-sme-fin, dict-sme-nob) juuri tällä merkityksellä ja
Divvunin oikoluku hyväksyy sen. Suomi ja norja sanakirjan ensimmäisestä merkityksestä; englanti käsin kuten marjat.py:ssä.
Pois jätetyt: báŋkoautomáhtta (ei norjaa sanakirjassa). Kaksimerkityksiset näytetään tarkoitetulla merkityksellä:
busse (myös pussi) = bussi, lássa (myös lukko) = lasi, girdi (myös lentäjä) = lentokone.
"""

# Lista: (id, kuvake, otsikko fi/nb/en, osiot [(fi, nb, en, [(saame, sanaluokka, suomi, norja, englanti)])])
LISTS = [
 ("kaupassa", "bag", ("Kaupassa", "I butikken", "In the shop"), [
   ("Ostaminen", "Å handle", "Shopping", [
     ("gávpi", "N", "kauppa", "butikk", "shop"), ("haddi", "N", "hinta", "pris", "price"),
     ("oastit", "V", "ostaa", "kjøpe", "buy"), ("máksit", "V", "maksaa", "betale", "pay")]),
   ("Ruoka", "Mat", "Food", [
     ("mielki", "N", "maito", "melk", "milk"), ("láibi", "N", "leipä", "brød", "bread"), ("vuodja", "N", "voi", "smør", "butter"),
     ("vuostá", "N", "juusto", "ost", "cheese"), ("monni", "N", "muna", "egg", "egg"), ("biergu", "N", "liha", "kjøtt", "meat"),
     ("guolli", "N", "kala", "fisk", "fish"), ("gáffe", "N", "kahvi", "kaffe", "coffee"), ("deadja", "N", "tee", "te", "tea"),
     ("sohkar", "N", "sokeri", "sukker", "sugar")]),
 ]),
 ("pankissa", "card", ("Pankissa", "I banken", "At the bank"), [
   ("Pankki", "Banken", "The bank", [
     ("báŋku", "N", "pankki", "bank", "bank"), ("kontu", "N", "tili", "konto", "account"), ("goarta", "N", "kortti", "kort", "card"),
     ("rehket", "N", "lasku", "regning", "bill"), ("guite", "N", "kuitti", "kvittering", "receipt"), ("máksu", "N", "maksu", "betaling", "payment"),
     ("vuolláičálus", "N", "allekirjoitus", "underskrift", "signature"), ("vuolláičállit", "V", "allekirjoittaa", "underskrive", "sign")]),
   ("Raha", "Penger", "Money", [
     ("ruhta", "N", "raha", "penger", "money"), ("ruvdnu", "N", "kruunu", "krone", "crown (krone)"), ("euro", "N", "euro", "euro", "euro"),
     ("loatna", "N", "laina", "lån", "loan"), ("reantu", "N", "korko", "rente", "interest"), ("seastit", "V", "säästää", "spare", "save")]),
 ]),
 ("liikkeella", "car", ("Liikkeellä", "På vei", "Getting around"), [
   ("Kulkeminen", "Å ferdes", "Moving", [
     ("vázzit", "V", "kävellä", "gå", "walk"), ("vuodjit", "V", "ajaa", "kjøre", "drive"), ("geaidnu", "N", "tie", "vei", "road"),
     ("gáhtta", "N", "katu", "gate", "street"), ("šaldi", "N", "silta", "bru", "bridge")]),
   ("Kulkuneuvot", "Kjøretøy", "Vehicles", [
     ("biila", "N", "auto", "bil", "car"), ("busse", "N", "bussi", "buss", "bus"), ("toga", "N", "juna", "tog", "train"),
     ("girdi", "N", "lentokone", "fly", "airplane")]),
   ("Suunta", "Retning", "Direction", [
     ("gurut", "A", "vasen", "venstre", "left"), ("olgeš", "A", "oikea", "høyre", "right"), ("njuolgga", "Adv", "suoraan", "rett", "straight")]),
 ]),
 ("syominen", "cup", ("Syöminen ja juominen", "Mat og drikke", "Eating and drinking"), [
   ("Ateriat", "Måltider", "Meals", [
     ("biebmu", "N", "ruoka", "mat", "food"), ("iđitborramuš", "N", "aamiainen", "frokost", "breakfast"),
     ("lunša", "N", "lounas", "lunsj", "lunch"), ("mállásat", "N", "päivällinen", "middag", "dinner"), ("kafea", "N", "kahvila", "kafé", "café")]),
   ("Syödä ja juoda", "Spise og drikke", "Eat and drink", [
     ("borrat", "V", "syödä", "spise", "eat"), ("juhkat", "V", "juoda", "drikke", "drink"), ("čáhci", "N", "vesi", "vann", "water")]),
   ("Astiat", "Kjøkkenting", "Tableware", [
     ("niibi", "N", "veitsi", "kniv", "knife"), ("gáffal", "N", "haarukka", "gaffel", "fork"), ("baste", "N", "lusikka", "skei", "spoon"),
     ("gohppu", "N", "kuppi", "kopp", "cup"), ("lássa", "N", "lasi", "glass", "glass"), ("tallearka", "N", "lautanen", "tallerken", "plate")]),
 ]),
]


def words(lst):
    return [w for sec in lst[3] for w in sec[3]]


if __name__ == "__main__":
    # Tarkistus: sana sanakirjassa tällä sanaluokalla ja merkityksellä, oikoluku hyväksyy
    import sqlite3, libvoikko, os, re
    c = sqlite3.connect("file:" + os.path.join(os.path.dirname(os.path.abspath(__file__)), "satni.db") + "?mode=ro", uri=True)
    v = libvoikko.Voikko("se")
    bad = 0
    for lst in LISTS:
        for sme, pos, fi, nb, en in words(lst):
            r = c.execute("SELECT finnish_translation, nob_translation FROM dictionary WHERE sme_lemma = ? AND pos = ?", (sme, pos)).fetchone()
            fis = [x.strip().lower() for x in re.split(r"[,;]", (r or ("", ""))[0] or "")]
            nbs = [x.strip().lower() for x in re.split(r"[,;]", (r or ("", ""))[1] or "")]
            ok = r and fi.lower() in fis + ["bussi"] and nb.lower() in nbs and v.spell(sme)
            if not ok:
                bad += 1
                print("TARKISTA", lst[0], sme, pos, fi, nb, r)
    print("sanoja", sum(len(words(l)) for l in LISTS), "tarkistettavia", bad)
