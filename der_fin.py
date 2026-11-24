"""Johdokset: pohjasanat ja johdetut suomennokset (2026-11-19).

Saamen -vuohta vastaa suomen -uus/-yys-johdinta (mánnávuohta = lapsuus, váralašvuohta = vaarallisuus) ja -laš
-llinen-johdinta (várra -> váralaš = vaara -> vaarallinen). Kahdessa taulussa:

der_base (word_id, bases): hakusanan pohjasanat analysaattorin johdosjäsennyksestä (lang-sme, Der/vuota, Der/lasj),
    lähin ensin: váralašvuohta -> "váralaš,várra". Yhdyssanan käännös kokeilee myös pohjasanojen suomennoksia ja valitsee
    sen, mikä on suomen korpuksessa (váralašvuođa + dieđáhus -> vaara + tiedote = vaaratiedote).
der_fin (word_id, fin, base, suffix): suomennos sanoille, joilla sitä ei ole, johdettuna lähimmän pohjasanan
    suomennoksesta (-inen -> -isuus, -ton -> -ttomuus, paha -> pahuus, vapaa -> vapaus; vaara -> vaarallinen). Mukaan vain
    sanat, jotka Voikko tuntee perusmuotoisena substantiivina tai adjektiivina. Sanakortissa merkitty johdetuksi;
    suomenkielinen haku löytää ne. Tarkistus jo käännetyillä -vuohta-sanoilla: 74 % sama kuin sanakirjassa.

Taulut jäävät tyhjiksi, jos analysaattoria tai Voikkoa ei ole (sovellus toimii ilman niitä).
"""
import os
import re
import shutil
import subprocess

ANALYSER_PATHS = [
    os.path.expanduser("~/.cache/satni-fst-build/fst/lang-sme/src/fst/analyser-gt-desc.hfstol"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "lang-sme", "src", "fst", "analyser-gt-desc.hfstol"),
]
SUFFIX = {"vuota": "vuohta", "lasj": "laš"}
READING = re.compile(r"^(.*)\+(?:N|A)(?:\+Attr)?\+Der/(vuota|lasj)\+(N|A)\+(?:Sg\+Nom|Attr)$")


def _analyse(lemmas):
    path = next((p for p in ANALYSER_PATHS if os.path.exists(p)), None)
    if not path or not shutil.which("hfst-lookup"):
        return {}
    out = subprocess.run(["hfst-lookup", "-q", path], input="\n".join(lemmas) + "\n", capture_output=True, text=True).stdout
    found = {}
    for line in out.splitlines():
        parts = line.split("\t")
        # Ei virheellisiä eikä yhdyssanajäsennyksiä (Cmp: allagelbbolašvuohta ei ole allat + -vuohta)
        if len(parts) < 2 or "Err/" in parts[1] or "+?" in parts[1] or "Cmp" in parts[1]:
            continue
        m = READING.match(parts[1])
        if not m:
            continue
        # Ketju: várra+N+Der/lasj+A+Der/vuota -> pohjat várra (ja välivaihe toisesta jäsennyksestä: váralaš+A+Der/vuota)
        chain = m.group(1)
        base = chain.split("+")[0]
        if base == parts[0]:
            continue
        found.setdefault(parts[0], []).append((chain.count("Der/"), base, m.group(2)))
    return {w: sorted(set(v)) for w, v in found.items()}


def _harmony(word):
    return "u" if re.search(r"[aou]", word.split("-")[-1]) else "y"


def _derive(fin, suffix):
    w = fin.strip()
    if not re.fullmatch(r"[a-zäöå-]+", w):
        return []
    h = _harmony(w)
    out = []
    if suffix == "vuota":
        if w.endswith("inen"):
            out.append(w[:-4] + ("isuus" if h == "u" else "isyys"))
        if w.endswith(("ton", "tön")):
            out.append(w[:-3] + ("ttomuus" if h == "u" else "ttömyys"))
        if re.search(r"(aa|ää|ea|eä|ia|iä)$", w):
            out.append(w[:-1] + ("us" if h == "u" else "ys"))
        elif re.search(r"[aä]$", w):
            out.append(w[:-1] + ("uus" if h == "u" else "yys"))
        if re.search(r"[uyoöi]$", w):
            out.append(w + ("us" if h == "u" else "ys"))
    elif suffix == "lasj" and re.search(r"[aeiouyäö]$", w):
        out.append(w + "llinen")
    return out


def rows(src):
    """(der_base-rivit, der_fin-rivit) export_web_data.py:lle."""
    words = src.execute("SELECT id, sme_lemma, pos, finnish_translation FROM dictionary").fetchall()
    fin = {}
    ids = {}
    for wid, lemma, pos, f in words:
        ids.setdefault(lemma, wid)
        if f and not fin.get(lemma):
            fin[lemma] = f
    targets = sorted({lemma for _, lemma, _, _ in words if lemma.endswith(("vuohta", "laš"))})
    analysed = _analyse(targets)
    if not analysed:
        return [], []
    try:
        import libvoikko
        voikko = libvoikko.Voikko("fi")
    except Exception:
        voikko = None
    base_rows, fin_rows = [], []
    for lemma, readings in analysed.items():
        bases = []
        for _, base, _ in readings:
            if base in ids and base not in bases:
                bases.append(base)
        if not bases:
            continue
        base_rows.append((ids[lemma], ",".join(bases)))
        # Johdettu suomennos vain -vuohta-sanoille: -laš -> -llinen olisi epäluotettava (Voikko hyväksyy lähes minkä
        # tahansa -llinen-sanan, kuten korkeallinen), joten -laš jää pelkäksi pohjasanaksi yhdyssanojen käännökseen
        if fin.get(lemma) or not voikko or not lemma.endswith("vuohta"):
            continue
        # Lähin pohjasana, jolla on suomennos; ensimmäiset neljä suomennosta
        for _, base, suffix in readings:
            if suffix != "vuota":
                continue
            cands = []
            for item in (fin.get(base) or "").split(",")[:4]:
                for cand in _derive(re.sub(r"\s*\(.*?\)", "", item), suffix):
                    cls = "nimisana" if suffix == "vuota" else "laatusana"
                    if cand not in cands and voikko.spell(cand) and any(
                            a.get("BASEFORM") == cand and a.get("CLASS") == cls for a in voikko.analyze(cand)):
                        cands.append(cand)
            if cands:
                fin_rows.append((ids[lemma], ", ".join(cands[:3]), base, SUFFIX[suffix]))
                break
    return base_rows, fin_rows


# Kaikki johdokset sanoille, joilta puuttuu suomennos tai norjannos (2026-11-24, käyttäjä: "johdos sanasta X"
# sanakorttiin, kun käännöstä ei ole). Vain varmat: analysaattorin perusmuotojäsennys (ei yhdyssanaa, ei virhettä),
# lähin pohjasana (vähiten Der-vaiheita) yksiselitteinen, pohjasana on sanakirjassa eikä ole sana itse.
LEMMA_TAIL = {"V": ("+Inf",), "N": ("+Sg+Nom",), "A": ("+Sg+Nom", "+Attr"), "Adv": ("+Adv",)}


def der_of_rows(src):
    """der_of-rivit (word_id, base, base_id) export_web_data.py:lle."""
    words = src.execute("SELECT id, sme_lemma, pos, finnish_translation, nob_translation FROM dictionary").fetchall()
    ids = {}
    for wid, lemma, *_ in words:
        ids.setdefault(lemma, wid)
    targets = {lemma: (wid, pos) for wid, lemma, pos, f, n in words
               if (not (f or "").strip() or not (n or "").strip()) and pos in LEMMA_TAIL and lemma not in ("",)}
    path = next((p for p in ANALYSER_PATHS if os.path.exists(p)), None)
    if not path or not shutil.which("hfst-lookup") or not targets:
        return []
    out = subprocess.run(["hfst-lookup", "-q", path], input="\n".join(targets) + "\n", capture_output=True, text=True).stdout
    readings = {}
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) < 2 or parts[0] not in targets:
            continue
        a = parts[1]
        if "Err/" in a or "+?" in a or "Cmp" in a or "Der/" not in a:
            continue
        pos = targets[parts[0]][1]
        tail = a[a.rindex("Der/"):]
        tail = tail[tail.index("+"):] if "+" in tail else ""
        if not tail.startswith("+" + pos + "+") and tail != "+" + pos or not tail.endswith(LEMMA_TAIL[pos]):
            continue
        # Lähin pohjasana: viimeistä Der-vaihetta edeltävä lemma (várra+N+Der/lasj+A+Der/vuota -> váralaš jos
        # toinen jäsennys antaa sen suoraan; ketjun alku vain, jos lyhyempää ei ole)
        readings.setdefault(parts[0], set()).add((a.count("Der/"), a.split("+")[0]))
    rows = []
    for lemma, rs in readings.items():
        least = min(n for n, _ in rs)
        bases = {b for n, b in rs if n == least}
        if len(bases) != 1:
            continue
        base = bases.pop()
        if base == lemma or base not in ids:
            continue
        rows.append((targets[lemma][0], base, ids[base]))
    return rows
