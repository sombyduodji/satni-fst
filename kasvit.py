"""Puut ja kasvit (käyttäjä 2026-11-26): Luonto-ryhmän sanasto, rakenne kuten arki.py.

Jokainen saamen sana on sanakirjassa (satni.db) tällä merkityksellä, sillä on norjannos, ja Divvunin oikoluku hyväksyy
sen. Harvinaiset (ei korpuksessa) tarkistettu muista lähteistä 2026-11-26: käänteissanakirjat (fin->sme, nob->sme)
antavat saman sanan; skierri Álgussa (smj skierre, sma skierrie, smn skierri) ja englannin Wikisanakirjassa (Betula nana);
biellorássi (kello+kukka, inari čuovjiskiällurääsi), gollerássi (kulta+kukka, inari kollerääsi), báhpačehporas
(papin kaulus = norjan prestekrage), bihcebáhce (männyn käpy; inari paaccâh, etelä baahtsege).
Pois: voikukka ja kanerva (ei norjaa), rássi (ruoho/heinä/kukka, kaksi oikeaa vastausta), horsma, kurjenpolvi, leinikki (ei löydy).
"""

LISTS = [
 ("kasvit", "tree", ("Puut ja kasvit", "Trær og planter", "Trees and plants"), [
   ("Puut", "Trær", "Trees", [
     ("muorra", "N", "puu", "tre", "tree"), ("beahci", "N", "mänty", "furu", "pine"), ("guossa", "N", "kuusi", "gran", "spruce"),
     ("soahki", "N", "koivu", "bjørk", "birch"), ("lageš", "N", "tunturikoivu", "fjellbjørk", "mountain birch"),
     ("skierri", "N", "vaivaiskoivu", "dvergbjørk", "dwarf birch"), ("leaibi", "N", "leppä", "older", "alder"),
     ("sieđga", "N", "paju", "vidje", "willow"), ("suhpi", "N", "haapa", "osp", "aspen"), ("skáhpi", "N", "pihlaja", "rogn", "rowan"),
     ("gaskkas", "N", "kataja", "einer", "juniper")]),
   ("Kukat", "Blomster", "Flowers", [
     ("lieđđi", "N", "kukka", "blomst", "flower"), ("ruvsu", "N", "ruusu", "rose", "rose"), ("biellorássi", "N", "kissankello", "blåklokke", "harebell"),
     ("gollerássi", "N", "rentukka", "bekkeblom", "marsh marigold"), ("báhpačehporas", "N", "päivänkakkara", "prestekrage", "oxeye daisy")]),
   ("Muut kasvit", "Andre planter", "Other plants", [
     ("šaddu", "N", "kasvi", "plante", "plant"), ("suoidni", "N", "heinä", "gress", "grass, hay"), ("sámil", "N", "sammal", "mose", "moss"),
     ("jeagil", "N", "jäkälä", "reinlav", "lichen"), ("guoppar", "N", "sieni", "sopp", "mushroom"), ("lasta", "N", "lehti", "løv", "leaf"),
     ("oaksi", "N", "oksa", "grein", "branch"), ("máddu", "N", "juuri", "rot", "root"), ("bárku", "N", "kaarna", "bark", "bark"),
     ("beassi", "N", "tuohi", "never", "birch bark"), ("bihcebáhce", "N", "käpy", "kongle", "pine cone")]),
 ]),
]


def words(lst):
    return [w for sec in lst[3] for w in sec[3]]


if __name__ == "__main__":
    import sqlite3, libvoikko, os, re
    c = sqlite3.connect("file:" + os.path.join(os.path.dirname(os.path.abspath(__file__)), "satni.db") + "?mode=ro", uri=True)
    v = libvoikko.Voikko("se")
    bad = 0
    for lst in LISTS:
        for sme, pos, fi, nb, en in words(lst):
            rs = c.execute("SELECT finnish_translation, nob_translation FROM dictionary WHERE sme_lemma = ? AND pos = ?", (sme, pos)).fetchall()
            r = next((x for x in rs if fi.lower() in [y.strip().lower() for y in re.split(r"[,;]", x[0] or "")]), rs[0] if rs else None)
            fis = [x.strip().lower() for x in re.split(r"[,;]", (r or ("", ""))[0] or "")]
            nbt = ((r or ("", ""))[1] or "").lower()
            if not (r and fi.lower() in fis and nb.lower() in nbt and v.spell(sme)):
                bad += 1; print("TARKISTA", sme, fi, nb, r)
    print("sanoja", sum(len(words(l)) for l in LISTS), "tarkistettavia", bad)
