"""Pohjoissaamen yhdyssanan alkumuodot kuvan tunnistukseen (web/app.js: splitCompound).

Saamen yhdyssanan alkuosa on usein oma yhdysmuotonsa (geaidnu -> geaidno-oktavuohta, joavku -> joavko-várren,
girji -> girje-), jota ei ole sanakirjan taivutusmuodoissa. Jokaisesta substantiivin ja adjektiivin perusmuodosta
tehdään ehdokkaat (perusmuoto sekä viimeinen vokaali vaihdettuna: o, e, á, a, i, u), ja GiellaLT:n pohjoissaamen
oikoluku (Divvun, giella-sme-speller Voikon kautta) hyväksyy ehdokkaan vain, jos ehdokas + báiki ja ehdokas + girji
ovat oikein kirjoitettuja yhdyssanoja. Oikolukua käytetään vain tässä, ei sovelluksessa; ilman sitä taulu jää tyhjäksi.
Yötesti/Yle-koe 2026-11-18: geaidnooktavuođaid, joavkovárremat ja geaidnoovttastusa jäivät ennen jakamatta.
"""
import collections
import os
import re
import subprocess

HEADS = ("báiki", "girji")
VOWELS = "aáeiou"
# Analysaattorilla tarkistetut alkumuodot (2026-11-26, käyttäjän kuvat ja iso testi): myös vokaalinvaihto viimeisessä
# tavussa (doavttir -> doavtter, náittus -> náittos, bábir -> báber), vahva aste (genetiivistä) ja lyhyet lainasanojen
# muodot (bensiidna -> bensin, telefovdna -> telefon, persovdna -> person). Ehdokas hyväksytään vain, jos GiellaLT:n
# normatiivinen analysaattori jäsentää ehdokas + báiki juuri tämän sanan yhdysmuodoksi (lemma+N/A+...Cmp...#báiki).
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ANALYSERS = [os.path.expanduser("~/.cache/satni-fst-build/fst/lang-sme/src/fst/analyser-gt-norm.hfstol"),
             os.path.join(SCRIPT_DIR, "src", "fst", "analyser-gt-norm.hfst")]


def _candidates(lemma):
    out = {lemma}
    if lemma[-1] in VOWELS:
        out.update(lemma[:-1] + v for v in "oeáaiu")
    return {c for c in out if len(c) >= 3}


def _wide(b):
    out = _candidates(b)
    m = re.match(r"^(.*[^aáeiou])([iu])([^aáeiou]+)$", b)
    if m:
        out.update(m.group(1) + v + m.group(3) for v in "eoa")
    if b.endswith("vdna"):
        out.add(b[:-4] + "n")
    m = re.match(r"^(.*?)([aáeiou])\2?dna$", b)
    if m:
        out.add(m.group(1) + m.group(2) + "n")
    return {c for c in out if len(c) >= 3}


def analysed_rows(src):
    """Alkumuodot analysaattorin hyväksyminä (ks. yllä); tyhjä, jos hfst-lookup tai analysaattori puuttuu."""
    ana_path = next((a for a in ANALYSERS if os.path.exists(a)), None)
    if not ana_path:
        return {}
    gen = collections.defaultdict(set)
    words = src.execute("SELECT id, lower(sme_lemma), pos, COALESCE(freq, 0) FROM dictionary WHERE pos IN ('N', 'A')").fetchall()
    for wid, lemma, pos, freq in words:
        if not lemma or not lemma.isalpha():
            continue
        bases = {lemma}
        for (surf,) in src.execute("SELECT p.surface FROM paradigms p JOIN tags t ON t.id = p.tag_id WHERE p.word_id = ? "
                                   "AND t.tag IN ('Sg+Gen', 'Sg+Nom', 'Attr')", (wid,)):
            if surf and surf.isalpha():
                bases.add(surf.lower())
        for b in bases:
            for c in _wide(b):
                gen[c].add((lemma, pos, freq))
    try:
        out = subprocess.run(["hfst-lookup", "-q", ana_path], input="\n".join(c + "báiki" for c in gen) + "\n",
                             capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return {}
    ana = collections.defaultdict(list)
    for line in out.split("\n"):
        parts = line.split("\t")
        if len(parts) >= 2:
            ana[parts[0]].append(parts[1])
    best = {}
    # Alkumuoto, joka on itse substantiivin tai adjektiivin perusmuoto (sreaŋga = rautalanka), haetaan sanakirjasta
    # sellaisenaan: ei toisen sanan alkumuodoksi (sreaŋga ei adjektiivin muoto)
    # Saman kirjoitusasun sana (loahppa = loppu, mearra = meri) pidetään: analysaattori valitsee yhdysmuodon merkityksen
    lemmas = {w[1] for w in words}
    for c, cands in gen.items():
        analyses = ana.get(c + "báiki", [])
        for lemma, pos, freq in sorted(cands, key=lambda x: -x[2]):
            if any(a.startswith(f"{lemma}+{pos}+") and "+Cmp" in a and "#báiki" in a for a in analyses):
                if c in lemmas and lemma != c:
                    break
                best[c] = (freq, lemma)
                break
    return best


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
    # Analysaattorin hyväksymät lisäksi; sama alkumuoto kahdesta sanasta -> yleisempi
    for c, (freq, lemma) in analysed_rows(src).items():
        if c not in best or freq > best[c][0]:
            best[c] = (freq, lemma)
    return sorted((c, lemma) for c, (_, lemma) in best.items())
