"""Pohjoissaamen yhdyssanan alkumuodot kuvan tunnistukseen (web/app.js: splitCompound).

Saamen yhdyssanan alkuosa on usein oma yhdysmuotonsa (geaidnu -> geaidno-oktavuohta, joavku -> joavko-várren,
girji -> girje-), jota ei ole sanakirjan taivutusmuodoissa. Jokaisesta substantiivin ja adjektiivin perusmuodosta
tehdään ehdokkaat (perusmuoto sekä viimeinen vokaali vaihdettuna: o, e, á, a, i, u), ja GiellaLT:n pohjoissaamen
oikoluku (Divvun, giella-sme-speller Voikon kautta) hyväksyy ehdokkaan vain, jos ehdokas + báiki ja ehdokas + girji
ovat oikein kirjoitettuja yhdyssanoja. Oikolukua käytetään vain tässä, ei sovelluksessa; ilman sitä taulu jää tyhjäksi.
Yötesti/Yle-koe 2026-11-18: geaidnooktavuođaid, joavkovárremat ja geaidnoovttastusa jäivät ennen jakamatta.
"""
HEADS = ("báiki", "girji")
VOWELS = "aáeiou"


def _candidates(lemma):
    out = {lemma}
    if lemma[-1] in VOWELS:
        out.update(lemma[:-1] + v for v in "oeáaiu")
    return {c for c in out if len(c) >= 3}


def rows(src):
    try:
        import libvoikko
        speller = libvoikko.Voikko("se")
    except Exception:
        return []
    best = {}  # alkumuoto -> (korpusfrekvenssi, perusmuoto): sama muoto kahdesta sanasta (girje: girji, girju) -> yleisempi
    try:
        for lemma, freq in src.execute("SELECT lower(sme_lemma), MAX(COALESCE(freq, 0)) FROM dictionary "
                                       "WHERE pos IN ('N', 'A') GROUP BY lower(sme_lemma)"):
            if not lemma or not lemma.isalpha():
                continue
            for c in _candidates(lemma):
                if c != lemma and (c not in best or freq > best[c][0]) and all(speller.spell(c + h) for h in HEADS):
                    best[c] = (freq, lemma)
    finally:
        speller.terminate()
    return sorted((c, lemma) for c, (_, lemma) in best.items())
