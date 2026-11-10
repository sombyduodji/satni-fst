"""Suomenkielisten käännösten taivutusmuodot GiellaLT:n lang-fin-FST:llä: taulu fin_forms tietokantaan satni.db.

LÄHDE (ks. CREDITS.md): GiellaLT lang-fin -analysaattori ja -generaattori (UiT, Giellatekno), lisenssi GPL-3.0.
Valmiiksi käännetyt mallit haetaan GiellaLT:n nightly-paketista giella-fin (./hae_sanakirjat.sh -> giella-fin/).

Taivutetaan saamen substantiivien, verbien, adjektiivien ja numeraalien yksisanaiset suomenkieliset käännökset
(finnish_translation ja suomenkieliset merkitykset). Käännös analysoidaan ensin, jotta saadaan oikea
sanaluokka ja yhdyssanan rajat (maan#käyttö#raja), ja muodot generoidaan analyysin perusteella.

Taulu: fin_forms(word, pos, forms), pos = saamen sanaluokka N/V/A/Num ja forms esim.
"Sg+Nom=talo;Sg+Gen=talon;...;Pl+Ine=taloissa". Vaihtoehtoiset muodot erotetaan /-merkillä, tavallisempi
ensin; vanhahtavat rinnakkaismuodot pudotetaan (ks. clean_variants).

Aja yksinään olemassa olevaan tietokantaan: python3 fin_forms.py (import_full_dict.py ajaa tämän myös).
"""
import collections
import json
import os
import re
import sqlite3
import subprocess

from nob_forms import translation_words

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FST_DIR = os.path.join(SCRIPT_DIR, "giella-fin")
# desc-analysaattori säilyttää piilotagit (maa+N+CmpNP/None), joita generaattori tarvitsee
ANALYSER = os.path.join(FST_DIR, "analyser-gt-desc.hfstol")
GENERATOR = os.path.join(FST_DIR, "generator-gt-norm.hfstol")
DB_FILE = os.path.join(SCRIPT_DIR, "satni.db")

PERSONS = ["Sg1", "Sg2", "Sg3", "Pl1", "Pl2", "Pl3"]
# Sovelluksessa käytetyt sijat. Adessiivi, ablatiivi ja translatiivi vain hakua varten (talolla -> viesus, taloksi -> viessun);
# ne otetaan mukaan, vain jos analysaattori tunnistaa muodon yleiskieliseksi samaksi sijaksi (add_fin_forms).
CASES = ["Nom", "Gen", "Par", "Ine", "Ela", "Ill", "All", "Ess", "Ade", "Abl", "Tra"]
SEARCH_ONLY_CASES = ("Ade", "Abl", "Tra")
NOMINAL_CELLS = {f"{n}+{c}": f"{n}+{c}" for n in ("Sg", "Pl") for c in CASES}
# Solu -> generaattorin tagit perusmuodon ja sanaluokan jälkeen
CELLS = {
    "N": NOMINAL_CELLS,
    "Num": NOMINAL_CELLS,
    "A": {**NOMINAL_CELLS, "Comp": "Comp+Sg+Nom", "Superl": "Superl+Sg+Nom"},
    "V": {
        "Inf": "Act+InfA+Sg+Lat",
        **{f"Prs+{p}": f"Act+Ind+Prs+{p}" for p in PERSONS},
        **{f"Prt+{p}": f"Act+Ind+Prt+{p}" for p in PERSONS},
        **{f"Cond+{p}": f"Act+Cond+{p}" for p in PERSONS},
        **{f"Pot+{p}": f"Act+Pot+{p}" for p in PERSONS},
        **{f"Imprt+{p}": f"Act+Imprt+{p}" for p in PERSONS if p != "Sg1"},
        "PrfPrc": "Act+PrfPrc+Sg+Nom",
        "Prs+ConNeg": "Act+Ind+Prs+ConNeg",
        "Cond+ConNeg": "Act+Cond+ConNeg",
        "Pot+ConNeg": "Act+Pot+ConNeg",
    },
}
# Likimääräisiä ilmauksia, joiden taivutusmuodot eivät ole luotettavia (ei taivuteta, taulukkoon ei tule käännöstä)
APPROXIMATE_NUMERALS = {"parisen", "parikymmentä", "parisataa", "parituhatta", "kolmisenkymmentä", "toistakymmentä", "neljäkolmatta"}
# Muut yleiset pronominit (persoonapronominit ovat web/app.js:ssä): sana, sen yksikön ja monikon analyysin perusmuoto.
# Mukana kaikki sijat, myös adessiivi ja ablatiivi (kenellä, keneltä). pos on "Pron".
PRONOUNS = {"kuka": ("kuka", "kuka"), "mikä": ("mikä", "mikä"), "tämä": ("tämä", "nämä"), "tuo": ("tuo", "nuo"), "se": ("se", "ne"),
            "jokin": ("jokin", "jokin"), "joku": ("joku", "joku"), "joka": ("joka", "joka"), "kumpi": ("kumpi", "kumpi")}
PRONOUN_CASES = ["Nom", "Acc", "Gen", "Par", "Ine", "Ela", "Ill", "Ade", "Abl", "All", "Ess", "Tra"]
# Puhekieliset ja vanhat muodot, joita ei tarjota, sekä essiivit minä ja sinä (mikä, se), jotka sekoittuvat persoonapronomineihin
PRONOUN_DROP = {"sissä", "sistä", "kutka", "keitten", "kenä", "tää", "tän", "tään", "näitten", "noitten", "niitten", "jotai", "jostai", "jollai",
                "joltai", "joissai", "joistai", "joillai", "joiltai", "joitai", "johonka", "joittenka", "joidenka", "joitten", "joittenkin",
                "joittenkuitten", "kumpahan", "kumpain", "kumpihin", "minä", "sinä"}
FIN_POS = {"N": "N", "V": "V", "A": "A", "Num": "Num"}


def lookup(fst, queries, generate=False):
    """hfst-optimized-lookup: {kysely: [tulos, ...]}; tuntemattomat (+?) jätetään pois."""
    proc = subprocess.run(["hfst-optimized-lookup", "-q", fst], input="\n".join(queries) + "\n",
                          capture_output=True, text=True, encoding="utf-8")
    results = collections.defaultdict(list)
    for line in proc.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) < 2 or "+?" in parts or (generate and "+" in parts[1]):
            continue
        if parts[1] not in results[parts[0]]:
            results[parts[0]].append(parts[1])
    return results


# Perusmuodon analyysin loppu sanaluokittain: sitä edeltävä osa (talo+N, maa+N+CmpNP/None, tehdä+V) on generoinnin alku
CITATION_TAGS = {"N": "+Sg+Nom", "A": "+Sg+Nom", "Num": "+Sg+Nom", "V": "+Act+InfA+Sg+Lat"}


def stems(word, pos, analyses):
    """Käännöksen perusmuotoanalyyseista generoinnin alut, joiden (viimeisen osan) sanaluokka on oikea:
    talo+N, maa+N+CmpNP/None, laki+Hom1+N, kirkko+N+Cmp/SgNom+Cmp#laki+Hom1+N. Kokonaisena sanana tunnettu
    analyysi ensin, yhdyssana-analyyseista vain osiltaan vähiten jaettu. Väärät alut karsii add_fin_forms
    (generoitu perusmuoto ei ole sama kuin käännös)."""
    found = []
    for a in analyses:
        last = a.split("#")[-1]
        m = re.match(r"[^+]+(\+Hom\d+)?\+(Num|N|V|A)\+", last)
        if m and m.group(2) == FIN_POS[pos] and a.endswith(CITATION_TAGS[pos]) and a[:-len(CITATION_TAGS[pos])] not in found:
            found.append(a[:-len(CITATION_TAGS[pos])])
    simple = [s for s in found if "#" not in s]
    return simple or sorted(found, key=lambda s: s.count("#"))[:1]


# Puhekieliset lyhyet muodot (oon, meen, tuut, paa) ja vanha ompi; analysaattori ei merkitse kaikkia
COLLOQUIAL = {"olla": ("oo", "ompi"), "mennä": ("mee",), "tulla": ("tuu",), "panna": ("paa",)}


def drop_contracted(forms):
    """Puhekielinen supistuma pois, kun yleiskielinen muoto on (haluun / haluan, oikeen / oikean): muodot eroavat
    yhdellä kirjaimella, joka supistumassa on edeltävän vokaalin kahdennus. uo ~ uu on yleiskieltä kumpikin
    (ruoan / ruuan), joten se säilyy, mutta ruoan ensin."""
    vowels = "aeiouyäö"
    drop, later = set(), set()
    for a in forms:
        for b in forms:
            if a == b or len(a) != len(b):
                continue
            diff = [i for i in range(len(a)) if a[i] != b[i]]
            if len(diff) == 1 and diff[0] > 0 and a[diff[0]] == a[diff[0] - 1] in vowels and b[diff[0]] in vowels:
                (later if b[diff[0] - 1:diff[0] + 1] == "uo" else drop).add(a)
    return sorted((f for f in forms if f not in drop), key=lambda f: f in later) or forms


VOIKKO_IMAGE = "satni-voikko"  # docker build -t satni-voikko packaging/voikko
VOIKKO_CHECK = "import sys, libvoikko\nv = libvoikko.Voikko('fi')\nfor w in sys.stdin.read().split('\\n'):\n    if w and not v.spell(w): print(w)\n"


def spell_rejected(words, quiet=False):
    """Sanat, joita Voikko (suomen yleiskielen oikoluin, voikko-fi) ei hyväksy. Voikko ajetaan paikallisesti
    (python3-libvoikko) tai Docker-kontissa satni-voikko; jos kumpaakaan ei ole, tarkistus ohitetaan varoittaen.
    Voikkoa käytetään vain rinnakkaismuotojen valintaan; sen sanastoa ei tallenneta tietokantaan."""
    out = run_voikko(VOIKKO_CHECK, "\n".join(sorted(words)) + "\n")
    if out is None:
        print("  VAROITUS: Voikkoa ei voitu ajaa (python3-libvoikko tai docker build -t satni-voikko packaging/voikko),"
              " joten murre- ja puhekieliset rinnakkaismuodot voivat jäädä taulukoihin")
        return set()
    rejected = set(out.split("\n")) - {""}
    if not quiet:
        print(f"  Voikko: {len(rejected)}/{len(words)} rinnakkaismuotoa ei ole yleiskieltä")
    return rejected


VOIKKO_SUGGEST = ("import sys, json, libvoikko\nv = libvoikko.Voikko('fi')\nfor w in sys.stdin.read().split('\\n'):\n"
                  "    if w: print(json.dumps([w, [[x, [dict(a) for a in v.analyze(x)]] for x in v.suggest(w)[:6]]], ensure_ascii=False))\n")
VOIKKO_ANALYSE = ("import sys, json, libvoikko\nv = libvoikko.Voikko('fi')\nfor w in sys.stdin.read().split('\\n'):\n"
                  "    if w: print(json.dumps([w, v.spell(w), [dict(a) for a in v.analyze(w)]], ensure_ascii=False))\n")
# Solun tagit -> Voikon analyysin kentät (sijat, luku, persoona, tapaluokka, aikamuoto, vertailuaste)
VOIKKO_CASES = {"Nom": "nimento", "Gen": "omanto", "Par": "osanto", "Ine": "sisaolento", "Ela": "sisaeronto", "Ill": "sisatulento",
                "Ade": "ulkoolento", "Abl": "ulkoeronto", "All": "ulkotulento", "Ess": "olento", "Tra": "tulento"}
VOIKKO_MOODS = {"Prs": ("indicative", "present_simple"), "Prt": ("indicative", "past_imperfective"),
                "Cond": ("conditional", "present_simple"), "Pot": ("potential", "present_simple"), "Imprt": ("imperative", "present_simple")}


def voikko_expected(cell):
    """Solu (Pl+Ine, Prs+Sg1, Comp) -> Voikon analyysin kentät, joiden täytyy täsmätä; None, jos solua ei verrata."""
    parts = cell.split("+")
    if parts[0] in ("Sg", "Pl") and parts[1] in VOIKKO_CASES:
        return {"NUMBER": "singular" if parts[0] == "Sg" else "plural", "SIJAMUOTO": VOIKKO_CASES[parts[1]]}
    if cell in ("Comp", "Superl"):
        return {"COMPARISON": "comparative" if cell == "Comp" else "superlative", "NUMBER": "singular", "SIJAMUOTO": "nimento"}
    if parts[0] in VOIKKO_MOODS and len(parts) == 2 and parts[1][:2] in ("Sg", "Pl"):
        mood, tense = VOIKKO_MOODS[parts[0]]
        return {"MOOD": mood, "TENSE": tense, "PERSON": parts[1][2], "NUMBER": "singular" if parts[1][:2] == "Sg" else "plural"}
    return None


def run_voikko(script, text):
    """Voikko-skripti paikallisesti (python3-libvoikko) tai Docker-kontissa satni-voikko; None, jos ei onnistu."""
    try:
        import libvoikko  # noqa: F401
        cmd = ["python3", "-c", script]
    except ImportError:
        cmd = ["docker", "run", "--rm", "-i", VOIKKO_IMAGE, "python3", "-c", script]
    try:
        proc = subprocess.run(cmd, input=text, capture_output=True, text=True, encoding="utf-8", timeout=1800)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return proc.stdout if proc.returncode == 0 else None


def voikko_check(found):
    """Tarkistaa Voikon kieliopillisella analyysilla, että taulukon muoto on oikea sija ja luku tai persoona,
    tapaluokka ja aikamuoto (voikko_expected), kun Voikko tuntee sanan:
      - oikeaksi analysoitu rinnakkaismuoto ensin (kauniista ennen kaunista, säärtä ennen sääriä) ja saman sanan
        toiseksi muodoksi analysoitu pois (elatiivista partitiivi kaunista)
      - jos mikään muoto ei ole oikea, Voikon korjausehdotus, jonka Voikko analysoi oikeaksi: väärä vokaalisointu
        (pelastusliiveilta), -ton-sanan kahdennus (onnetomampi), väärä vartalo (selainella, vanhempia -> vanhempaa)
      - jos ehdotusta ei ole ja Voikko analysoi muodon saman sanan toiseksi muodoksi (siviilin illatiivina),
        solu jätetään tyhjäksi; Voikon tuntemattomat muodot säilyvät, koska Voikko ei tunne kaikkia oikeitakaan
        (paukkuisit, kuohuat). Yksikön 2. persoonan imperatiivia (poraa) ja numeraaleja ei verrata.
      - taivutettu sana käännöksenä (perässä, verta) ei saa taulukkoa, eikä vertailuaste (suurempi) vertailuastetta
    Palauttaa {"järjestetty": n, "korjattu": n, "tyhjennetty": n}."""
    words = {w for w, _, _ in found} | {f for _, _, cells in found for v in cells.values() for f in v}
    out = run_voikko(VOIKKO_ANALYSE, "\n".join(sorted(words)) + "\n")
    if out is None:
        print("  VAROITUS: Voikkoa ei voitu ajaa, joten muotojen tarkistus ohitetaan")
        return {}
    info = {w: (ok, an) for w, ok, an in map(json.loads, out.splitlines())}

    def base_ok(a, word):
        # -minen-tekijännimissä Voikon perusmuoto on verbi (vihkimisestä -> vihkiä)
        return a.get("BASEFORM") == word or (word.endswith("minen") and a.get("CLASS") == "teonsana")

    def matches(f, word, want, table=None):
        return any(base_ok(a, word) and all(a.get(k) == v for k, v in want.items()) for a in (table or info).get(f, (0, []))[1])

    def same_word(f, word):
        return any(a.get("BASEFORM") == word for a in info.get(f, (0, []))[1])

    stats = collections.Counter()
    broken = []
    for word, pos, cells in found:
        if pos == "Num" or not info.get(word, (False,))[0]:
            continue
        analyses = info[word][1]
        if pos in ("N", "A") and not any(a.get("BASEFORM") == word for a in analyses):
            # Taivutettu sana käännöksenä (perässä = perä-sanan inessiivi, verta = veri-sanan partitiivi): ei taulukkoa
            if analyses and all(a.get("SIJAMUOTO") in ("sisaolento", "osanto") for a in analyses):
                cells.clear()
                stats["ei taivuteta"] += 1
                continue
            # Jo vertailuaste (suurempi, eteläisin): ei komparatiivia eikä superlatiivia (eteläisimpin)
            if any(a.get("COMPARISON") in ("comparative", "superlative") and a.get("SIJAMUOTO") == "nimento" for a in analyses):
                cells.pop("Comp", None)
                cells.pop("Superl", None)
        for c, v in cells.items():
            want = voikko_expected(c)
            if not v or want is None or c == "Imprt+Sg2":
                continue
            good = [f for f in v if matches(f, word, want)]
            if good:
                rest = [f for f in v if f not in good and not same_word(f, word)]
                if good + rest != v:
                    v[:] = good + rest
                    stats["järjestetty"] += 1
            elif not info.get(v[0], (True,))[0] or same_word(v[0], word):
                broken.append((word, pos, c, v))
    if broken:
        out = run_voikko(VOIKKO_SUGGEST, "\n".join(sorted({v[0] for _, _, _, v in broken})) + "\n") or ""
        suggestions = dict(json.loads(line) for line in out.splitlines() if line.startswith("["))
        # Omat ehdokkaat: vokaalisointu päätteessä (vihkimisesta -> vihkimisestä) ja monikon illatiivi -oihin/-öihin
        # (vesihaniin -> vesihanoihin), jota Voikon ehdotuksissa ei aina ole
        own = {}
        for word, pos, c, v in broken:
            k = len(os.path.commonprefix([v[0], word]))
            cands = [v[0][:k] + v[0][k:].translate(str.maketrans("aouäöy", "äöyaou"))]
            if c == "Pl+Ill" and v[0].endswith("iin") and word[-1] in "aä":
                cands += [v[0][:-3] + ("oihin" if word[-1] == "a" else "öihin")]
            own[v[0]] = [x for x in cands if x != v[0]]
        out = run_voikko(VOIKKO_ANALYSE, "\n".join(sorted({x for v in own.values() for x in v})) + "\n") or ""
        own_info = {w: (ok, an) for w, ok, an in map(json.loads, out.splitlines())}
        for word, pos, c, v in broken:
            want = voikko_expected(c)
            fix = [x for x in own.get(v[0], []) if own_info.get(x, (False,))[0] and matches(x, word, want, own_info)]
            fix += [x for x, analyses in suggestions.get(v[0], []) if " " not in x and "-" not in x
                    and any(base_ok(a, word) and all(a.get(k) == val for k, val in want.items()) for a in analyses)]
            if fix:
                v[:] = [fix[0]]
                stats["korjattu"] += 1
            elif same_word(v[0], word):
                v[:] = []
                stats["tyhjennetty"] += 1
    print(f"  Voikko: {stats['järjestetty']} solussa oikea muoto ensin, {stats['korjattu']} muotoa korjattu, "
          f"{stats['tyhjennetty']} väärää muotoa poistettu, {stats['ei taivuteta']} taivutettua sanaa ilman taulukkoa")
    return dict(stats)


def voikko_filter(forms, cell, word, rejected):
    """Voikon hylkäämät muodot pois, paitsi kun jäljelle jäisi vain huonompi vaihtoehto, jonka muut säännöt
    karsisivat: pelkkä vanha monikon genetiivi -in (hyväksyntäin) tai yhdyssana, jonka alkuosakin taipuu
    (isoiksiveljiksi, kun lang-fin ei anna muotoa isoveljiksi). Voikko ei tunne kaikkia väliviivallisia
    yhdyssanoja, joten sanan oma väliviiva säilyy (genetiivi-akkusatiivilla)."""
    ok = [f for f in forms if f not in rejected or ("-" in word and "-" in f)]
    if not ok or len(ok) == len(forms):
        return forms
    if cell == "Pl+Gen" and all(f.endswith("in") for f in ok) and not all(f.endswith("in") for f in forms):
        return forms
    prefix = lambda f: len(os.path.commonprefix([f, word]))
    if max(map(prefix, ok)) <= max(map(prefix, forms)) - 3:
        return forms
    return ok


def clean_variants(forms, cell, pos, word, rejected=frozenset()):
    """Generaattori (norm) antaa myös vanhahtavia ja murteellisia rinnakkaismuotoja. Ne pudotetaan, kun
    yleiskielinen vaihtoehto on olemassa, ja tavallisin muoto laitetaan ensin:
      - heittomerkilliset (kivijal’oilla, sii’asta) ja väliviivalliset yhdyssanat (kirkko-laissa)
      - h:lliset vanhat muodot (vaattehissa -> vaatteissa, asiakkahilta -> asiakkailta, -hisin)
      - monikon genetiivin -in ja -tten (taloin, kirjain, omenoitten), kun -en/-den on
      - essiivin lyhyt muoto (suurna, taloudellisna), kun -ena on
      - muoto, jossa on enemmän h-kirjaimia kuin vaihtoehdossa (vaattehien -> vaatteiden)
      - yhdyssana, jonka alkuosakin taipuu (hienoissasokereissa), kun alkuosan säilyttävä on (hienosokereissa)
      - puhekieliset lyhyet muodot (oon, meen, tuu, paa; COLLOQUIAL); murteelliseksi tai virheelliseksi
        merkityt (Dial, Err/, Use/) pudotetaan jo add_fin_forms-funktiossa
      - Voikon hylkäämät murre- ja puhekieliset muodot (kauns, kaunin, sellanen; spell_rejected)
      - kolme samaa vokaalia (raaan -> raa’an) ja puhekieliset supistumat (haluun -> haluan; drop_contracted)
      - verbin vanhahtava -oitse-/-oitsi- (imuroitsee -> imuroi, imuroitsi -> imuroi) ja -ele- (määräelee -> määräilee)
    Verbeissä muuten generaattorin järjestys (on/ompi, palaa/palaja)."""
    # Kolme samaa kirjainta peräkkäin ei ole suomea (raaan, miniiin, haluuu): vaihtoehto raa’an, miniöihin, haluaa.
    # Jos lang-fin antaa vain tällaisen (simppelllä, siviillle), solu jätetään tyhjäksi; samoin, jos jäljelle jäisi
    # vain yhdyssana, jonka alkuosakin taipuu (isokoskellle -> isollekoskelolle, oikea olisi isokoskelolle).
    triple = [f for f in forms if re.search(r"(\w)\1\1", f)]
    if triple:
        forms = [f for f in forms if f not in triple]
        prefix = lambda f: len(os.path.commonprefix([f, word]))
        if not forms or max(map(prefix, forms)) <= max(map(prefix, triple)) - 3:
            return []
    if pos == "Num":
        # Generaattori antaa myös katkenneita muotoja (puolitoista -> itoista); monikon genetiivi -ien ensin (kuusien, tuhansien)
        forms = [f for f in forms if f[0] == word[0]] or forms
        return sorted(forms, key=lambda f: not f.endswith("ien")) if cell == "Pl+Gen" else forms
    if len(forms) < 2:
        return forms
    # Yhdyssanan osana annettu muoto (-sälpä) pois; Voikon hylkäämät (kauns, kaunin, sellanen) pois, kun
    # yleiskielinen vaihtoehto on (voikko_filter); perusmuoto itse ensin
    forms = [f for f in forms if not f.startswith("-") or word.startswith("-")] or forms
    forms = voikko_filter(forms, cell, word, rejected)
    if cell in ("Sg+Nom", "Inf") and word in forms:
        forms = [word] + [f for f in forms if f != word]
    forms = drop_contracted(forms)
    keep = [f for f in forms if "’" not in f and "'" not in f and ("-" not in f or "-" in word)] or forms
    if pos == "V":
        short = COLLOQUIAL.get(word, ())
        keep = [f for f in keep if not f.startswith(short)] or keep if short else keep
        keep = [f for f in keep if not (re.search("[oö]its[ei]", f) and any(not re.search("[oö]its[ei]", g) for g in keep))] or keep
        keep = [f for f in keep if not any(f[:i] + "i" + f[i + 1:] in keep for i in range(len(f)) if f[i] == "e"
                                           and i > 0 and f[i - 1] in "aä" and f[i + 1:i + 2] == "l")] or keep

    def archaic(f, others):
        return (any(f[:i] + f[i + 1:] in others for i, ch in enumerate(f) if ch == "h")
                or f.endswith("hisin") or f.endswith("hisiin")
                or (cell == "Pl+Gen" and f.endswith("in") and any(g.endswith("en") for g in others))
                or ("tten" in f and f.replace("tten", "den") in others)
                or (cell == "Sg+Ess" and not f.endswith(("ena", "enä")) and any(g.endswith(("ena", "enä")) for g in others)))
    keep = [f for f in keep if not archaic(f, [g for g in keep if g != f])] or keep
    fewest_h = min(f.count("h") for f in keep)
    keep = [f for f in keep if f.count("h") == fewest_h]
    # Alkuosaltaan taipunut yhdyssana on pidempi ja eroaa perusmuodosta aiemmin kuin vaihtoehtonsa
    # (hienoissasokereissa / hienosokereissa); lasten / lapsien säilyy, koska lasten on lyhyempi.
    prefix = {f: len(os.path.commonprefix([f, word])) for f in keep}
    best = max(keep, key=lambda f: prefix[f])
    keep = [f for f in keep if not (prefix[f] <= prefix[best] - 3 and len(f) > len(best))]
    vowels = "aeiouyäö"
    if cell == "Comp" and word[-1] in "aä":
        keep = sorted(keep, key=lambda f: not f.endswith(word[-1] + "mpi"))  # ankarampi, väkevämpi
    elif cell == "Sg+Par" and word[-1] in vowels:
        # kampelaa (ei kampelata), mutta variaatiota (ei variaatioa)
        two_vowels = len(word) > 1 and word[-2] in vowels
        keep = sorted(keep, key=lambda f: f.endswith(("ta", "tä")) != two_vowels)
    return keep


def pronoun_rows():
    """Muiden pronominien rivit fin_forms-tauluun: ("kuka", "Pron", "Sg+Nom=kuka;Sg+Gen=kenen;...")."""
    queries = {(word, f"{number}+{case}"): f"{stem}+Pron+{number}+{case}" for word, stems_ in PRONOUNS.items()
               for number, stem in zip(("Sg", "Pl"), stems_) for case in PRONOUN_CASES}
    generated = lookup(GENERATOR, sorted(queries.values()), generate=True)
    cells = {}
    for (word, cell), query in queries.items():
        # Yleisempi muoto ensin: mihin, johon, johonkin (ei minne, jonne, jonnekin)
        forms = sorted((f for f in generated.get(query, []) if f not in PRONOUN_DROP),
                       key=lambda f: f.startswith(("minne", "jonne")))
        if forms:
            cells.setdefault(word, []).append(f"{cell}={'/'.join(forms)}")
    return [(word, "Pron", ";".join(c)) for word, c in cells.items()]


PROPER_RE = re.compile(r"[A-ZÄÖÅ][a-zäöå]+(-[A-ZÄÖÅa-zäöå][a-zäöå]+)?")


def proper_names(cursor):
    """Erisnimisanojen (subtype Prop) suomennokset, jotka ovat nimiä itsessään: {(nimi, "N")}. Selitykset
    (miehen nimi, naisen nimi) eivät ole nimiä, joten ne jäävät pois."""
    names = set()
    for (text,) in cursor.execute("SELECT finnish_translation FROM dictionary WHERE subtype = 'Prop' AND pos = 'N'"):
        for w in re.split(r"[,;]", re.sub(r"\(.*?\)", "", text or "")):
            w = w.strip()
            if PROPER_RE.fullmatch(w):
                names.add((w, "N"))
    return names


def add_fin_forms(cursor):
    print("Taivutetaan suomenkieliset käännökset (GiellaLT lang-fin)...")
    cursor.execute("DROP TABLE IF EXISTS fin_forms")
    cursor.execute("CREATE TABLE fin_forms (word TEXT, pos TEXT, forms TEXT)")
    if not (os.path.exists(ANALYSER) and os.path.exists(GENERATOR)):
        print(f"  lang-fin-malleja ei löydy kansiosta {FST_DIR} (aja ./hae_sanakirjat.sh): fin_forms jää tyhjäksi")
        return
    words = sorted(w for w in translation_words(cursor, "fin", "finnish_translation", ("N", "V", "A", "Num"))
                   if not (w[1] == "Num" and w[0] in APPROXIMATE_NUMERALS))
    # Erisnimet (Anár = Inari, Roavvenjárga = Rovaniemi): isolla alkavat yksisanaiset suomennokset, jotta taivutettu
    # nimi tunnistetaan (Inariin -> Anárii); translation_words ottaa vain pienellä alkavat
    words = sorted(set(words) | proper_names(cursor))
    analyses = lookup(ANALYSER, sorted({w for w, _ in words}))
    requests = {}
    for word, pos in words:
        for stem in stems(word, pos, analyses.get(word, [])):
            for cell, tags in CELLS[pos].items():
                requests.setdefault((word, pos), []).append((cell, f"{stem}+{tags}"))
            # Perusmuodon generointi tarkistusta varten (alku kelpaa vain, jos se tuottaa käännöksen itsensä)
            requests[(word, pos)].append(("citation", stem + CITATION_TAGS[pos]))
    generated = lookup(GENERATOR, sorted({q for reqs in requests.values() for _, q in reqs}), generate=True)

    # Rinnakkaismuodot, jotka analysaattori merkitsee murteellisiksi tai virheellisiksi juuri tässä muodossa
    # (meen: mennä+Err/Orth+V+Act+Ind+Prs+Sg1; menen-muodon Err-analyysit ovat muita muotoja, joten se kelpaa)
    multi = {f for forms in generated.values() if len(forms) > 1 for f in forms}
    form_analyses = lookup(ANALYSER, sorted(multi))
    nonstandard = frozenset((re.sub(r"\+(Dial|Err/\w+|Use/\w+)", "", a), f) for f, analyses in form_analyses.items()
                            for a in analyses if re.search(r"\+(Dial|Err/|Use/)", a))
    # Hakua varten lisätyt sijat: muodon pitää analysoitua samaksi luvuksi ja sijaksi ilman virhe- tai murremerkintää
    search_only = {q: q.rsplit("+", 2)[-2] + "+" + q.rsplit("+", 1)[-1] for q in generated if q.endswith(SEARCH_ONLY_CASES)}
    search_forms = lookup(ANALYSER, sorted({f for q in search_only for f in generated[q]}))

    def confirmed(query, form):
        return query not in search_only or any(a.endswith("+" + search_only[query]) and not re.search(r"\+(Dial|Err/|Use/)", a)
                                               for a in search_forms.get(form, []))

    rows, found = [], []
    for (word, pos), reqs in requests.items():
        cells = {}
        valid_stems = {q[:-len(CITATION_TAGS[pos])] for c, q in reqs if c == "citation" and word in generated.get(q, [])}
        for cell, query in reqs:
            if cell == "citation" or not any(query.startswith(st + "+") for st in valid_stems):
                continue
            for form in generated.get(query, []):
                if ((query, form) in nonstandard and len(generated[query]) > 1) or not confirmed(query, form):
                    continue
                cells.setdefault(cell, [])
                if form not in cells[cell]:
                    cells[cell].append(form)
        if cells:
            found.append((word, pos, cells))
    # Generaattori antaa myös murre- ja puhekielisiä muotoja merkitsemättä niitä (kauns, kaunin, sellanen, oikee):
    # rinnakkaismuodoista tarkistetaan Voikolla, mitkä ovat yleiskieltä
    rejected = spell_rejected({f for _, _, cells in found for v in cells.values() if len(v) > 1 for f in v})
    for word, pos, cells in found:
        cells.update({c: clean_variants(cells[c], c, pos, word, rejected) for c in CELLS[pos] if c in cells})
    voikko_check(found)
    for word, pos, cells in found:
        forms = ";".join(f"{c}={'/'.join(cells[c])}" for c in CELLS[pos] if cells.get(c))
        if forms:
            rows.append((word, pos, forms))
    rows += pronoun_rows()
    cursor.executemany("INSERT INTO fin_forms VALUES (?, ?, ?)", rows)
    cursor.execute("CREATE INDEX idx_fin_forms_word ON fin_forms(word)")
    print(f"  {len(rows)}/{len(words)} suomenkieliselle sanalle löytyi taivutus")


if __name__ == "__main__":
    conn = sqlite3.connect(DB_FILE)
    add_fin_forms(conn.cursor())
    conn.commit()
    conn.execute("VACUUM")
    conn.close()
