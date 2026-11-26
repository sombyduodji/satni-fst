"""Eläimet (sama sanasto minipelissä ja Sanastot-listassa Eläimet): saame, suomi, norja; englanti erikseen.
Sanat ovat samat kuin Máhtte-oppimispelissä."""

ANIMALS = [("boazu", "poro", "rein"), ("beana", "koira", "hund"), ("njoammil", "jänis", "hare"), ("guovža", "karhu", "bjørn"),
           ("gumpe", "susi", "ulv"), ("geatki", "ahma", "jerv"), ("albbas", "ilves", "gaupe"), ("rieban", "kettu", "rev"),
           ("oarri", "orava", "ekorn"), ("cuoppu", "sammakko", "frosk"), ("sáhpán", "hiiri", "mus"),
           ("beaiveloddi", "perhonen", "sommerfugl"), ("gáhttu", "kissa", "katt"), ("sávza", "lammas", "sau"),
           ("gussa", "lehmä", "ku"), ("spiidni", "sika", "gris"), ("rievssat", "riekko", "rype"), ("goahppil", "koppelo", "røy"),
           ("gáranas", "korppi", "ravn"), ("njukča", "joutsen", "svane"), ("goaskin", "kotka", "ørn"),
           ("jievjaskuolfi", "tunturipöllö", "snøugle"), ("beahceloddi", "metso", "storfugl")]

ANIMALS_EN = {"boazu": "reindeer", "beana": "dog", "njoammil": "hare", "guovža": "bear", "gumpe": "wolf", "geatki": "wolverine",
              "albbas": "lynx", "rieban": "fox", "oarri": "squirrel", "cuoppu": "frog", "sáhpán": "mouse",
              "beaiveloddi": "butterfly", "gáhttu": "cat", "sávza": "sheep", "gussa": "cow", "spiidni": "pig",
              "rievssat": "willow grouse", "goahppil": "capercaillie hen", "gáranas": "raven", "njukča": "swan",
              "goaskin": "eagle", "jievjaskuolfi": "snowy owl", "beahceloddi": "capercaillie"}

# Sanastot-listan osiot (käyttäjä 2026-11-23)
SECTIONS = [("Metsässä ja tunturissa", "I skogen og på fjellet", "In the forest and on the fells",
             ["guovža", "gumpe", "geatki", "albbas", "rieban", "njoammil", "oarri", "sáhpán", "cuoppu", "beaiveloddi"]),
            ("Kotona ja pihalla", "Hjemme og på gården", "At home and on the farm",
             ["boazu", "beana", "gáhttu", "sávza", "gussa", "spiidni"]),
            ("Linnut", "Fugler", "Birds", ["rievssat", "goahppil", "beahceloddi", "gáranas", "njukča", "goaskin", "jievjaskuolfi"])]
