"""Marjat, hedelmät ja kasvikset (käyttäjä 2026-11-23): Sanastot-lista, kuunteluharjoitus ja minipelin aihe.

Jokainen saamen sana on sovelluksen sanakirjassa (satni.db: dict-sme-fin, dict-sme-nob) juuri tällä merkityksellä,
ja Divvunin oikoluku (libvoikko "se") hyväksyy sen; suomi tarkistettu Voikolla. Ei konekäännöstä. Englanti on käsin
kirjoitettu kuten elaimet.py:ssä. Kussakin osiossa Sápmissa kasvavat tai käytetyt ensin, sitten muut.

Pois jätetyt (epävarmat, jätetty käyttäjälle): beron (päärynä, sanakirjassa ei norjaa, harvinainen), gieddeluomi
(kaksi merkitystä: mesimarja ja lillukka), boska (väinönputki mutta myös skafthylster), gahpermuorji (vadelma, toinen
sana samalle; gáiccamuorji valittu), miehtamuorji (mesimarja; váđot on yleisempi ja sillä on norja).
"""

# (saame, suomi, norja)
BERRIES = [("luomi", "hilla, lakka", "molte"), ("sarrit", "mustikka", "blåbær"), ("jokŋa", "puolukka", "tyttebær"),
           ("čáhppesmuorji", "variksenmarja", "krekling"), ("jeaggemuorji", "karpalo", "tranebær"),
           ("váđot", "mesimarja", "åkerbær"), ("ehtemas", "juolukka", "blokkebær"),
           ("jieret", "punainen viinimarja", "villrips"), ("čáhppesjieret", "mustaherukka", "solbær"),
           ("gáiccamuorji", "vadelma", "bringebær"), ("eanamuorji", "mansikka", "jordbær"), ("muorji", "marja", "bær")]
FRUITS = [("eappel", "omena", "eple"), ("banána", "banaani", "banan"), ("appelsiidna", "appelsiini", "appelsin"),
          ("sitrovdna", "sitruuna", "sitron"), ("viidnemuorji", "viinirypäle", "drue"), ("čirsa", "kirsikka", "kirsebær"),
          ("lupmu", "luumu", "plomme"), ("persihkka", "persikka", "fersken")]
VEGETABLES = [("buđet", "peruna", "potet"), ("náppoš", "lanttu", "kålrot"), ("návrraš", "nauris", "nepe"),
              ("fádnu", "väinönputki", "kvann"), ("juopmu", "niittysuolaheinä", "syregress"), ("lávki", "sipuli", "løk"),
              ("rušpi", "porkkana", "gulrot"), ("kálla", "kaali", "kål"), ("ruksesruohtas", "punajuuri", "rødbete"),
              ("earta", "herne", "ert"), ("gurká", "kurkku", "agurk"), ("tomáhtta", "tomaatti", "tomat"),
              ("ruonas", "vihannes, kasvis", "grønnsak")]
WORDS = BERRIES + FRUITS + VEGETABLES

EN = {"luomi": "cloudberry", "sarrit": "bilberry, blueberry", "jokŋa": "lingonberry", "čáhppesmuorji": "crowberry",
      "jeaggemuorji": "cranberry", "váđot": "arctic bramble", "ehtemas": "bog bilberry", "jieret": "redcurrant",
      "čáhppesjieret": "blackcurrant", "gáiccamuorji": "raspberry", "eanamuorji": "strawberry", "muorji": "berry",
      "eappel": "apple", "banána": "banana", "appelsiidna": "orange", "sitrovdna": "lemon", "viidnemuorji": "grape",
      "čirsa": "cherry", "lupmu": "plum", "persihkka": "peach",
      "buđet": "potato", "náppoš": "swede, rutabaga", "návrraš": "turnip", "fádnu": "angelica", "juopmu": "sorrel",
      "lávki": "onion", "rušpi": "carrot", "kálla": "cabbage", "ruksesruohtas": "beetroot", "earta": "pea",
      "gurká": "cucumber", "tomáhtta": "tomato", "ruonas": "vegetable"}

SECTIONS = [("Marjat", "Bær", "Berries", [w[0] for w in BERRIES]),
            ("Hedelmät", "Frukt", "Fruit", [w[0] for w in FRUITS]),
            ("Kasvikset", "Grønnsaker", "Vegetables", [w[0] for w in VEGETABLES])]
