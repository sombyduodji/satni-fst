"""Leat (olla) ja kieltoverbi (käyttäjä 2026-11-28): kaikki yhdeksän persoonaa pronominin kanssa, myönteinen ja kielteinen.

Verbimuodot GiellaLT lang-sme -generaattorilla (leat+V+IV+Ind+Prs+Sg1 = lean, ... Du2 = leahppi, Pl2 = lehpet;
ii+V+IV+Neg+Ind+Sg1 = in, ... Du2 = eahppi, Pl2 = ehpet, Pl3 = eai; leat+V+IV+Ind+Prs+ConNeg = leat). Pronominit kuten
Pronominit-sanastossa (mun, don, son, moai, doai, soai, mii, dii, sii). Rakenne kuten kasvit.py: rivi (saame, sanaluokka,
suomi, norja, englanti). Sanastossa, kuunteluharjoituksessa ja minipelissä.
"""

LISTS = [
 ("leat", "person", ("Olla: leat", "Å være: leat", "To be: leat"), [
   ("Olla", "Å være", "To be", [
     ("mun lean", "V", "minä olen", "jeg er", "I am"),
     ("don leat", "V", "sinä olet", "du er", "you are"),
     ("son lea", "V", "hän on", "han, hun er", "he, she is"),
     ("moai letne", "V", "me kaksi olemme", "vi to er", "we two are"),
     ("doai leahppi", "V", "te kaksi olette", "dere to er", "you two are"),
     ("soai leaba", "V", "he kaksi ovat", "de to er", "they two are"),
     ("mii leat", "V", "me olemme", "vi er", "we are"),
     ("dii lehpet", "V", "te olette", "dere er", "you are (plural)"),
     ("sii leat", "V", "he ovat", "de er", "they are")]),
   ("Ei olla", "Å ikke være", "Not to be", [
     ("mun in leat", "V", "minä en ole", "jeg er ikke", "I am not"),
     ("don it leat", "V", "sinä et ole", "du er ikke", "you are not"),
     ("son ii leat", "V", "hän ei ole", "han, hun er ikke", "he, she is not"),
     ("moai ean leat", "V", "me kaksi emme ole", "vi to er ikke", "we two are not"),
     ("doai eahppi leat", "V", "te kaksi ette ole", "dere to er ikke", "you two are not"),
     ("soai eaba leat", "V", "he kaksi eivät ole", "de to er ikke", "they two are not"),
     ("mii eat leat", "V", "me emme ole", "vi er ikke", "we are not"),
     ("dii ehpet leat", "V", "te ette ole", "dere er ikke", "you are not (plural)"),
     ("sii eai leat", "V", "he eivät ole", "de er ikke", "they are not")]),
 ]),
]

# Lyhyt vinkki listan yläpuolelle (fi, nb, en)
HINTS = {"leat": ("leat = olla · kielto: kieltoverbi taipuu, leat pysyy samana (mun in leat = minä en ole) · kaksikko: moai = me kaksi",
                  "leat = å være · nekting: nektingsverbet bøyes, leat står uendret (mun in leat = jeg er ikke) · totall: moai = vi to",
                  "leat = to be · negation: the negative verb inflects, leat stays the same (mun in leat = I am not) · dual: moai = we two")}

EX = {}


def words(lst):
    return [w for sec in lst[3] for w in sec[3]]


if __name__ == "__main__":
    # Tarkistus: verbimuodot generaattorilla, sanat Divvunin oikoluvulla
    import os, subprocess, libvoikko
    G = os.path.expanduser("~/.cache/satni-fst-build/fst/lang-sme/src/fst/generator-gt-norm.hfstol")
    P = ["Sg1", "Sg2", "Sg3", "Du1", "Du2", "Du3", "Pl1", "Pl2", "Pl3"]
    q = [f"leat+V+IV+Ind+Prs+{p}" for p in P] + [f"ii+V+IV+Neg+Ind+{p}" for p in P]
    out = subprocess.run(["hfst-optimized-lookup", "-q", G], input="\n".join(q) + "\n", capture_output=True, text=True).stdout
    gen = {l.split("\t")[0]: l.split("\t")[1] for l in out.splitlines() if "\t" in l}
    rows = words(LISTS[0])
    v = libvoikko.Voikko("se")
    bad = 0
    for i, (sme, *_rest) in enumerate(rows):
        parts = sme.split()
        want = gen[q[i]] if i < 9 else gen[q[i]]
        verb = parts[1]
        ok = verb == want and (i < 9 or parts[2] == "leat") and all(v.spell(x) for x in parts)
        bad += not ok
        print("OK " if ok else "VIRHE", sme, "| generaattori:", want)
    print("rivejä", len(rows), "virheitä", bad)
