"""Sanaperhe: johdokset ja yhdyssanat sanakortin Sanaperhe-välilehdelle (käyttäjä 2026-11-24).

Vain varmat linkit (käyttäjän sääntö: 100 % varmat, ei arvattuja): molemmat sanat ovat sanakirjan hakusanoja, ja
yhteyden antaa GiellaLT lang-sme -analysaattori sanan perusmuodon jäsennyksenä.

Johdos (kind "der"): hakusanan perusmuodon jäsennyksessä yksi Der-johdin, joka on alla olevassa luettelossa
    (läpinäkyvät johtimet; esim. Comp, AAdv, Superl ja verbijohtimet jätettiin pois, koska otoksessa oli vääriä
    pareja kuten boaššu -> boaššut). Pohjasanan ja johdoksen sanaluokat täsmäävät sanakirjan sanaluokkiin, ja johdoksen
    pääte on johtimen mukainen (dádjut -> dáddju ei kelpaa tekijännimeksi).
Yhdyssana (kind "cmp"): kaikki analysaattorin yhdyssanajäsennykset antavat samat osat, ja jokainen osa on hakusana.
Vuodenaikojen adverbit (kind "der", tag "Adv"): čakčat, dálvet, geassit, giđđat. Analysaattori pitää niitä omina
    adverbeinaan eikä yhdistä niitä substantiiviin, joten ne ovat käsin tarkistettu luettelo (Sammallahti: ajan adverbit).

Taulu family (child_id, kind, parent_id, nr, tag): child on johdos tai yhdyssana, parent pohjasana tai osa; nr on osan
järjestysnumero yhdyssanassa (johdoksella 0). Tyhjä, jos analysaattoria ei ole (sovellus toimii ilman).
"""
import os
import re
import shutil
import subprocess

ANALYSER_PATHS = [
    os.path.expanduser("~/.cache/satni-fst-build/fst/lang-sme/src/fst/analyser-gt-desc.hfstol"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "lang-sme", "src", "fst", "analyser-gt-desc.hfstol"),
]
# Johdin -> johdoksen päätteen tarkistus
DER_SUFFIX = {
    "vuota": r"vuohta$", "lasj": r"laš$", "Dimin": r"š$", "Car": r"(heapme|his)$", "geahtes": r"keahtes$",
    "meahttun": r"meahttun$", "NomAct": r"(mi|n)$", "NomAg": r"i$", "PassL": r"uvvot$",
    "Caus": r"(ahttit|ehtit|ihttit|uhttit)$", "InchL": r"goahtit$", "laakan": r"lág[aá]n$",
}
SEASON_ADV = {"čakčat": "čakča", "dálvet": "dálvi", "geassit": "geassi", "giđđat": "giđđa"}
BASEFORM = re.compile(r"\+(?:N|A)(?:\+\w+)*\+Sg\+Nom$|\+V(?:\+\w+)*\+Inf$|\+Adv$")
SKIP = ("Err/", "+?", "Allegro", "South", "Sem/")


def _items(text):
    return {x.strip().lower()[:3] for x in re.split(r"[,;()]", text or "") if len(x.strip()) >= 3}


def _ids(src):
    """lemma -> {pos: id}; samanlaisista homonyymeistä yleisin."""
    out = {}
    for wid, lemma, pos, freq in src.execute("SELECT id, sme_lemma, pos, COALESCE(freq, 0) FROM dictionary ORDER BY freq DESC, id"):
        out.setdefault(lemma, {}).setdefault(pos or "", wid)
    return out


def rows(src):
    ids = _ids(src)
    path = next((p for p in ANALYSER_PATHS if os.path.exists(p)), None)
    if not path or not shutil.which("hfst-lookup"):
        return []
    lemmas = [l for l in ids if l and "\n" not in l]
    out = subprocess.run(["hfst-lookup", "-q", path], input="\n".join(lemmas) + "\n", capture_output=True, text=True).stdout
    der, cmp, lex = {}, {}, {}
    for line in out.splitlines():
        p = line.split("\t")
        if len(p) < 2 or p[0] not in ids:
            continue
        w, a = p[0], p[1]
        if any(s in a for s in SKIP) or not BASEFORM.search(a):
            continue
        if "Der/" not in a and "Cmp" not in a and a.split("+")[0] == w:
            lex.setdefault(w, set()).add(a)
        if "Cmp#" in a:
            if "Der/" in a:
                continue
            segs = a.split("#")
            parts = tuple((s.split("+")[0], s.split("+")[1]) for s in segs)
            cmp.setdefault(w, set()).add(parts)
            continue
        d = re.findall(r"\+Der/(\w+)\+(\w+)", a)
        if len(d) != 1 or d[0][0] not in DER_SUFFIX:
            continue
        tag, child_pos = d[0]
        base, base_pos = a.split("+")[0], a.split("+")[1]
        if base == w or not re.search(DER_SUFFIX[tag], w):
            continue
        der.setdefault(w, set()).add((base, base_pos, tag, child_pos))
    trans = {wid: (f, n) for wid, f, n in src.execute("SELECT id, finnish_translation, nob_translation FROM dictionary")}

    def same_meaning(a, b):
        return any(_items(x) & _items(y) for x, y in zip(trans.get(a, ("", "")), trans.get(b, ("", ""))))
    result = set()
    for w, cands in der.items():
        ok = [(b, bp, tag, cp) for b, bp, tag, cp in cands if cp in ids[w] and bp in ids.get(b, {})]
        # Yksiselitteinen pohjasana: kaksi eri pohjaa (homonymia) -> ei linkkiä
        if len({b for b, *_ in ok}) != 1:
            continue
        b, bp, tag, cp = ok[0]
        if w[0].isupper() and not b[0].isupper():
            continue  # Addi (nimi) ei ole addit-verbin tekijä
        # Sanalla on oma sanastojäsennys ilman johdinta: oma sana, ellei analysaattori merkitse sitä johdokseksi
        # (bargi+N+NomAg) tai käännökset osoita yhteyttä (vaara -> vaarallinen). hurri (teeri) ei ole hurrat-verbin tekijä.
        own = [x for x in lex.get(w, ()) if "+" + cp + "+" in x + "+" and "+" + tag not in x]
        if tag == "NomAg" and own:
            continue
        if own and not same_meaning(ids[w][cp], ids[b][bp]):
            continue
        result.add((ids[w][cp], "der", ids[b][bp], 0, tag))
    for w, base in SEASON_ADV.items():
        if "Adv" in ids.get(w, {}) and "N" in ids.get(base, {}):
            result.add((ids[w]["Adv"], "der", ids[base]["N"], 0, "Adv"))
    for w, splits in cmp.items():
        if len(splits) != 1:
            continue
        parts = next(iter(splits))
        last_pos = parts[-1][1]
        if last_pos not in ids[w] or any(len(l) < 2 or l == w or ps not in ids.get(l, {}) for l, ps in parts):
            continue
        for nr, (l, ps) in enumerate(parts):
            result.add((ids[w][last_pos], "cmp", ids[l][ps], nr, ""))
    return sorted(result)


if __name__ == "__main__":
    import sqlite3
    import sys
    r = rows(sqlite3.connect(sys.argv[1] if len(sys.argv) > 1 else "satni.db"))
    print(len(r), sum(1 for x in r if x[1] == "der"), "der,", len({x[0] for x in r if x[1] == "cmp"}), "cmp")
