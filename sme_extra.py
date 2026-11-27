"""Saamen omistusliitteelliset muodot ja vertailumuotojen essiivit, joita taivutustaulukoissa ei ole:
taulu sme_extra(word_id, tag, surface) tietokantaan satni.db.

barggustis = bargu Sg+Loc+PxSg3 (työssään), gielaset = giella Sg+Acc+PxPl3 (kielensä), áhččán = áhčči PxSg1 (isäni),
badjelasas = badjelii PxSg3 (ylleen), álkibun = álki Comp+Ess (helpommaksi).

LÄHTEET (ks. CREDITS.md):
- Sanamuotojen luettelo: tekstissä oikeasti esiintyvät muodot SIKOR-korpuksesta (UiT ja Norsk Sametinget,
  CLARINO 11509/100, CC BY 3.0) ja sanakirjan esimerkkilauseista. Korpuksesta otetaan vain sanamuodot, ei tekstiä.
- Analyysi: GiellaLT lang-sme -normianalysaattori (analyser-gt-norm, GPL-3.0); vain muodot, joiden analyysi on
  omistusliite tai vertailumuodon sija, joiden perusmuoto ja sanaluokka ovat sanakirjassa ja jotka Divvunin
  oikoluku hyväksyy. Yhdyssana-, virhe- ja murreanalyysit jätetään pois, joten vanhat kirjoitusasut eivät tule mukaan.

Taulukoiden muotojen kaikkia omistusliitteitä ei generoida (noin 600 000 muotoa), vaan vain tekstissä esiintyvät.
Aja yksinään olemassa olevaan tietokantaan: python3 sme_extra.py
"""
import collections
import os
import re
import sqlite3
import subprocess
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")
ANALYSERS = [os.path.expanduser("~/.cache/satni-fst-build/fst/lang-sme/src/fst/analyser-gt-norm.hfstol"),
             os.path.join(SCRIPT_DIR, "src", "fst", "analyser-gt-norm.hfstol")]
SIKOR = os.environ.get("SIKOR_ZIP", os.path.expanduser("~/Git/sami-data-candidates/sikor/SIKOR_sme_20151010.zip"))
SIKOR_XML = "SIKOR_sme_20151010/SIKOR_free_sme_20151010.xml"
WORD = re.compile(r"^[a-záčđŋšŧž]+$")
POS = {"N": "N", "V": "V", "A": "A", "Adv": "Adv", "Po": "Po", "Pr": "Pr", "Pron": "Pron"}
# Hyväksytyt analyysit: omistusliite (N/A/Adv/Po/Pron) tai vertailumuodon sija (álkibun)
PX = re.compile(r"^(?P<lemma>[^+#]+)\+(?P<pos>N|A|Adv|Po|Pr|Pron)(\+(Sem|Refl|Pers|Dem|Indef|Interr|Recipr|G3|NomAg|Actor|Prop)[^+]*)*"
                r"\+(?P<tag>((Sg|Pl)\+(Nom|Acc|Gen|Ill|Loc|Com|Ess)\+|Ess\+|)Px(Sg|Du|Pl)\d)$")
DEG = re.compile(r"^(?P<lemma>[^+#]+)\+(?P<pos>A)\+Der/(?P<deg>Comp|Superl)\+A\+(?P<tag>(Sg|Pl)\+(Nom|Acc|Gen|Ill|Loc|Com)|Ess)$")
# Verbien johdokset ja muodot, joita taulukoissa ei ole (verbi on sanakirjassa):
# - passiivi (daddjo = sanotaan, adno = pidetään; mearriduvvojedje = päätettiin, toinen asu): Pass+muoto
# - gerundi + omistusliite (meannudettiinis = käsitellessään): Ger+PxSg3
# - teonnimi -eapmi (vuođđudeapmi = perustaminen, beaivádeami = päivittämisen): NomAct+Sg+Gen
# - alkaa tehdä -goahtit (doaibmagoahtá = alkaa toimia): Inch+Ind+Prs+Sg3
# - -keahtes-adjektiivi (bisánkeahtes = pysähtymätön, prentekeahtes = painamaton): Geahtes (2026-11-27)
# Passiivi myös intransitiiviverbeistä, kun muoto on tekstissä (váikkuhuvvo = vaikutetaan; 2026-11-27): suomessa
# passiivi on persoonaton ja muodostuu myös intransitiiviverbeistä
VERB = re.compile(r"^(?P<lemma>[^+#]+)\+(?P<pos>V)\+(TV|IV)\+(?:"
                  r"Der/(?P<pass>PassS|PassL)\+V\+IV\+(?P<ptag>Inf|PrfPrc|Ind\+(Prs|Prt)\+(Sg3|Pl3|ConNeg)|Cond\+Prs\+(Sg3|Pl3))"
                  r"|(?P<ger>Ger\+Px(Sg|Du|Pl)\d)"
                  r"|Der/NomAct\+N\+(?P<act>(Sg|Pl)\+(Nom|Acc|Gen|Ill|Loc|Com)|Ess)"
                  r"|Der/InchL\+V\+(IV\+|TV\+)?(?P<inch>Inf|PrfPrc|Ind\+(Prs|Prt)\+(Sg|Pl)\d|Ind\+(Prs|Prt)\+ConNeg)"
                  r"|Der/(?P<geah>geahtes)\+A\+Attr)$")


def corpus_words(cursor):
    words = collections.Counter()
    if os.path.exists(SIKOR):
        rx = re.compile(r'\bword="([^"]*)"')
        with zipfile.ZipFile(SIKOR) as z, z.open(SIKOR_XML) as f:
            for raw in f:
                m = rx.search(raw.decode("utf-8", "replace"))
                if m:
                    words[m.group(1).lower()] += 1
    else:
        print(f"  VAROITUS: SIKOR-korpusta ei löydy ({SIKOR}); käytetään vain esimerkkilauseita")
    for (sme,) in cursor.execute("SELECT sme FROM examples WHERE sme IS NOT NULL"):
        for w in re.findall(r"[\wáčđŋšŧžÁČĐŊŠŦŽ]+", sme):
            words[w.lower()] += 1
    return {w: n for w, n in words.items() if WORD.match(w)}


def speller():
    try:
        import libvoikko
        return libvoikko.Voikko("se").spell
    except Exception:
        print("  VAROITUS: Divvunin oikolukua ei voitu ladata, muotoja ei tarkisteta")
        return lambda w: True


def apply(cursor):
    print("Haetaan saamen omistusliitteelliset muodot (SIKOR + GiellaLT lang-sme)...")
    cursor.execute("DROP TABLE IF EXISTS sme_extra")
    cursor.execute("CREATE TABLE sme_extra (word_id INTEGER, tag TEXT, surface TEXT)")
    analyser = next((a for a in ANALYSERS if os.path.exists(a)), None)
    if not analyser:
        print("  lang-sme-analysaattoria ei löydy: sme_extra jää tyhjäksi")
        return
    known = {s.lower() for (s,) in cursor.execute("SELECT surface FROM paradigms")}
    known |= {s.lower() for (s,) in cursor.execute("SELECT sme_lemma FROM dictionary")}
    # Vähintään kaksi esiintymää: kerran nähty voi olla kirjoitusvirhe (addát pro attát)
    words = sorted(w for w, n in corpus_words(cursor).items() if w not in known and n >= 2)
    proc = subprocess.run(["hfst-optimized-lookup", "-q", analyser], input="\n".join(words) + "\n",
                          capture_output=True, text=True, encoding="utf-8")
    ids = collections.defaultdict(list)
    for i, lemma, pos in cursor.execute("SELECT id, sme_lemma, pos FROM dictionary"):
        ids[(lemma, pos)].append(i)
    spell = speller()
    rows = set()
    # Sanan kaikkien normianalyysien pitää olla saman sanan samaa muototyyppiä (omistusliite, passiivi, teonnimi …);
    # jos jokin analyysi on toinen sana tai muu muoto (myös yhdyssana), sanaa ei oteta (vain varmat sanat)
    def family(a):
        lemma = a.split("+")[0]
        kind = ("Pass" if re.search(r"Der/Pass[SL]", a) else "NomAct" if "Der/NomAct" in a else "Inch" if "Der/InchL" in a
                else "Deg" if re.search(r"Der/(Comp|Superl)", a) else "Geahtes" if "Der/geahtes" in a
                else "Ger" if "+Ger" in a else "Px" if "+Px" in a else "other")
        return lemma, kind
    by_word = collections.defaultdict(list)
    for line in proc.stdout.splitlines():
        p = line.split("\t")
        if len(p) >= 2 and "+?" not in p[1] and not re.search(r"\+(Err|Use|Dial)", p[1]):
            by_word[p[0]].append(p[1])
    for w, analyses in by_word.items():
        if len({family(a) for a in analyses}) != 1 or any("#" in a for a in analyses):
            continue
        for a in analyses:
            p = (w, a)
            m = PX.match(p[1]) or DEG.match(p[1]) or VERB.match(p[1])
            if not m:
                continue
            d = m.groupdict()
            if d["pos"] == "V":
                tag = ("Pass+" + d["ptag"] if d["pass"] else d["ger"] if d["ger"] else "Geahtes" if d["geah"] else
                       "NomAct+" + d["act"] if d["act"] else "Inch+" + d["inch"])
            else:
                tag = f"{d['deg']}+{d['tag']}" if d.get("deg") else d["tag"]
            for i in ids.get((d["lemma"], POS[d["pos"]]), []):
                rows.add((i, tag, p[0]))
    rows = sorted(r for r in rows if spell(r[2]))
    cursor.executemany("INSERT INTO sme_extra VALUES (?, ?, ?)", rows)
    cursor.execute("CREATE INDEX idx_sme_extra_surface ON sme_extra(surface)")
    tags = collections.Counter(t.split("+")[0] if t.split("+")[0] in ("Pass", "Ger", "NomAct", "Inch", "Geahtes") else "Px" if "Px" in t
                               else "vertailumuoto" for _, t, _ in rows)
    print(f"  {len(rows)} muotoa ({', '.join(f'{k} {v}' for k, v in tags.items())}), {len({r[2] for r in rows})} sanaa")


if __name__ == "__main__":
    conn = sqlite3.connect(DB_FILE)
    apply(conn.cursor())
    conn.commit()
    conn.close()
