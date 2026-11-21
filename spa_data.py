"""Espanjankieliset käännökset GiellaLT:n espanjan sanakirjoista (Ángel, CC BY 4.0; ks. CREDITS.md).

Lähteet (eivät kuulu tähän repoon, ./hae_sanakirjat.sh) ovat Excel-tiedostoja, ei GiellaLT:n XML:ää:
  - dict-sme-spa/inc/A_V_Saami_Spanish.xlsx: pohjoissaame -> espanja, rivi = yksi merkitys (käännös, synonyymit,
    käyttörajoitus, selitys ja enintään neljä esimerkkilausetta). Sarakkeet luetaan kuten GiellaLT:n oma
    dict-sme-spa/scripts/xlsx2xml.py ne lukee.
  - dict-spa-sme/inc/newest_orig/A_Z_Spanish_Saami.xlsx: espanja -> pohjoissaame. Hakusana tulee käännökseksi
    vain sanalle, jolla ei ole espanjaa edellisestä sanakirjasta (kuten dict-fin-sme suomelle).
Tiedostot luetaan ilman lisäkirjastoja (xlsx on zip-paketti, jossa on XML:ää).
"""
import os
import re
import zipfile
import xml.etree.ElementTree as ET

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SME_SPA = os.path.join(SCRIPT_DIR, "dict-sme-spa", "inc", "A_V_Saami_Spanish.xlsx")
SPA_SME = os.path.join(SCRIPT_DIR, "dict-spa-sme", "inc", "newest_orig", "A_Z_Spanish_Saami.xlsx")
_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
_CROSS_REF = re.compile(r"Geahča|\bVer:")
# Saamenkielinen käyttöohje käännössolussa (bás: "Geavaha: Diminutiiva hámiid", esimerkkeinä báslábbáš = corderito):
# merkityksen selitys, ei käännös, jotta esimerkit säilyvät (offline-tarkistus 2026-11-10)
_USAGE_NOTE = re.compile(r"^Geavaha:")
# Käännössolussa saamea, ei espanjaa (areála: "100 kvadrat mehtera"; offline-tarkistus 2026-11-10)
NOT_SPANISH = {"100 kvadrat mehtera"}
# Pidempi käännössolu on selitys, ei käännös
MAX_TRANSLATION_WORDS = 6


# Lähteen kirjoitusvirheet, jotka Hunspell-oikolukimen (es_ES) tarkistus löysi 2026-11-06 ja jotka on tarkistettu käsin
TYPOS = {"reluctacia": "reluctancia", "constrasta": "contrasta", "latimarse": "lastimarse",
         "antropólogico": "antropológico", "interdependecia": "interdependencia",
         # offline-tarkistus 2026-11-10 (Hunspell es_ES, luettu käsin)
         "instruccíón": "instrucción", "compañia": "compañía", "aislamento": "aislamiento", "aburrise": "aburrirse",
         "ovido": "olvido"}
_TYPO_RE = re.compile(r"\b(" + "|".join(TYPOS) + r")\b")


def _clean(text):
    return _TYPO_RE.sub(lambda m: TYPOS[m.group(1)], " ".join(str(text or "").split()))


def read_xlsx(path):
    """Ensimmäisen taulukon rivit sanakirjoina {sarakkeen otsikko: arvo}. Otsikot kuten xlsx2xml.py:ssä
    (välilyönnit alaviivoiksi), toistuva otsikko saa perään _1, _2."""
    with zipfile.ZipFile(path) as z:
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(_NS + "si"):
                strings.append("".join(t.text or "" for t in si.iter(_NS + "t")))
        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.iter(_NS + "row"):
        cells = {}
        for c in row.findall(_NS + "c"):
            col = 0
            for ch in re.match(r"[A-Z]+", c.get("r")).group():
                col = col * 26 + ord(ch) - 64
            v, inline = c.find(_NS + "v"), c.find(_NS + "is")
            if c.get("t") == "s" and v is not None:
                value = strings[int(v.text)]
            elif inline is not None:
                value = "".join(t.text or "" for t in inline.iter(_NS + "t"))
            else:
                value = v.text if v is not None else ""
            cells[col - 1] = _clean(value)
        rows.append(cells)
    if not rows:
        return []
    header, counts, names = rows[0], {}, {}
    for i in sorted(header):
        name = header[i].upper().replace(" ", "_").replace("/", "_") or "EMPTY"
        n = counts.get(name, 0)
        counts[name] = n + 1
        names[i] = f"{name}_{n}" if n else name
    return [{names[i]: v for i, v in r.items() if i in names and v} for r in rows[1:]]


def sme_spa_meanings():
    """[(saamen sana, sanaluokka, alaluokka, merkitys)] dict-sme-spa:sta; merkitys on {"translations", "restrictions",
    "explanations", "labels", "examples": [(saame, espanja)]}. Tyhjä, jos tiedostoa ei ole."""
    if not os.path.exists(SME_SPA):
        return []
    out = []
    for r in read_xlsx(SME_SPA):
        word = r.get("WORD")
        if not word:
            continue
        translations, explanations, labels = [], [], []
        for t in [r.get("TRANSLATION")] + [r.get(f"TRANSLATION_SYNONYM{n}") for n in range(1, 7)]:
            if not t:
                continue
            if _CROSS_REF.search(t):
                labels.append(t)  # Geahča / Ver: dat (katso) ei ole käännös
            elif _USAGE_NOTE.match(t) or any(len(part.split()) > MAX_TRANSLATION_WORDS for part in t.split(",")):
                explanations.append(t)  # No se traduce como sujeto gramatical en oración impersonal
            else:
                translations += [_clean(part) for part in t.split(",") if _clean(part) and _clean(part) not in NOT_SPANISH]
        # Tässä tiedostossa EXPLANATION-sarakkeessa on kielioppitietoa (IV, AuxV, Dem, Nom, Sg), ei selityksiä
        if r.get("EXPLANATION"):
            labels.append(r["EXPLANATION"])
        if not translations and not explanations:
            continue
        examples = [(r[f"SAAMI_EX_{n}"], r.get(f"SPANISH_EX_{n}", "")) for n in range(1, 5) if r.get(f"SAAMI_EX_{n}")]
        out.append((word, r.get("WORD_CLASS_SAAMI", ""), r.get("G3_NOMAG", ""), {
            "translations": translations, "restrictions": [r["RESTRICTION"]] if r.get("RESTRICTION") else [],
            "explanations": explanations, "labels": labels, "examples": examples}))
    return out


def spa_sme_pairs():
    """[(espanjan hakusana, saamen sana, saamen sanaluokka)] dict-spa-sme:stä. Tyhjä, jos tiedostoa ei ole."""
    if not os.path.exists(SPA_SME):
        return []
    out = []
    for r in read_xlsx(SPA_SME):
        head, sami = r.get("WORD"), r.get("SAAMI")
        if not head or not sami:
            continue
        for part in re.split(r"[,;]", sami):
            part = _clean(part)
            if part:
                out.append((head, part, r.get("WORD_CLASS_SAAMI", "")))
    return out
