"""Yhdyssanat ja käännökset GiellaLT:n vapaan korpuksen rinnakkaisteksteistä (käyttäjän päätös 2026-11-28).

Lähde: rinnakkais_sanat.tsv (rinnakkais/certain.py, reitti A: ihmisen kääntämien lauseparien sanalinjauksen
tavallisin käännös on täsmälleen osien sanakirjakäännösten yhdistelmä). Pistokoe 13/13 oikein lähdesivuilta.
- uusi: uusi hakusana (334 riviä, 327 sanaa) suomen- tai norjankielisellä käännöksellä; tarkistetaan saamen
  analysaattorilla kuten muutkin uudet sanat (filter_new_words), taivutus generaattorilla.
- täydennys: norjannos sanakirjan sanalle, jolta se puuttuu (39).
Ajetaan import_full_dict.py:ssä vastakkaisten sanakirjojen jälkeen, joten sanakirjan omat käännökset menevät edelle.
"""
import csv
import os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rinnakkais_sanat.tsv")


def add(entries, by_lemma, new_meaning):
    if not os.path.exists(FILE):
        return
    added = filled = 0
    with open(FILE, encoding="utf-8") as f:
        rows = list(csv.DictReader((line for line in f if not line.startswith("#")), delimiter="\t"))
    for r in rows:
        lemma, pos, lang, trans = r["sme"], r["pos"], r["kieli"], r["kaannos"]
        key = next((k for k in by_lemma.get(lemma, []) if k[1] == pos), None)
        if key is None:
            if r["laji"] != "uusi":
                continue
            key = (lemma, pos, "")
            entries[key] = {"sem_type": "", "translations": {}, "meanings": [], "freq": None, "notes": [],
                            "new_from": "rinnakkais"}
            by_lemma.setdefault(lemma, []).append(key)
            added += 1
        data = entries[key]
        if data["translations"].get(lang):
            continue  # sanakirjassa on jo tämän kielen käännös
        data["translations"][lang] = [trans]
        data["meanings"].append(new_meaning(lang, [trans]))
        filled += r["laji"] == "täydennys"
    print(f"  rinnakkaistekstit: {added} uutta yhdyssanaa, {filled} norjannosta olemassa oleville sanoille")
