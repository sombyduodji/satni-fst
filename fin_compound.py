"""Suomen yhdyssanojen alkuosat kuvan tekstintunnistukseen (web/app.js: splitFinCompound).

Sanakirjasta puuttuva suomen yhdyssana (viranomaistiedote) jaetaan osiin: loppuosa on tunnettu sana tai muoto,
alkuosa tämän taulun muoto. Alkuosa on usein muu kuin perusmuoto (viranomainen -> viranomais-, kansa -> kansan-),
joten taulu tehdään tässä: jokaisesta käännösten substantiivista ja adjektiivista (fin_forms) ehdokkaat
perusmuoto, yksikön genetiivi ja -nen -> -s, ja Voikko (voikko-fi, Kotus-sanalista) hyväksyy ehdokkaan vain, jos se
jäsentää ehdokas + "talo" -yhdyssanan niin, että viimeinen raja on juuri ehdokkaan jälkeen (+viran(virka)+omais(omainen)
+talo(talo)). Voikkoa käytetään vain tässä, ei sovelluksessa. Ilman libvoikkoa taulu jää tyhjäksi.
"""
import re

HEAD = "talo"
PART = re.compile(r"\+([^+(]*)\(([^)]*)\)")


def _candidates(word, forms):
    out = {word.lower()}
    for cell in forms.split(";"):
        if cell.startswith("Sg+Gen="):
            out.update(f.lower() for f in cell.split("=", 1)[1].split("/") if f)
    if word.endswith("nen"):
        out.add(word[:-3].lower() + "s")
    return {c for c in out if len(c) >= 2 and c.isalpha()}  # myös yö (yötesti)


def _accepts(voikko, stem):
    for a in voikko.analyze(stem + HEAD):
        parts = PART.findall(a.get("WORDBASES", ""))
        if len(parts) >= 2 and parts[-1] == (HEAD, HEAD) and "".join(p for p, _ in parts[:-1]) == stem:
            return True
    return False


def rows(dst):
    try:
        import libvoikko
    except ImportError:
        return []
    voikko = libvoikko.Voikko("fi")
    seen, out = {}, set()
    try:
        for word, pos, forms in dst.execute("SELECT word, pos, forms FROM fin_forms WHERE pos IN ('N', 'A')"):
            if not word.isalpha() or word[:1].isupper():
                continue  # erisnimet ja monisanaiset pois
            for stem in _candidates(word, forms):
                if stem not in seen:
                    seen[stem] = _accepts(voikko, stem)
                if seen[stem]:
                    out.add((stem, word))
    finally:
        voikko.terminate()
    return sorted(out)
