"""Sukulaissanat muissa saamen kielissä: Álgu, saamelaiskielten etymologinen tietokanta (Kotimaisten kielten keskus,
https://kaino.kotus.fi/algu, XML-versio 16.3.2023, CC BY 4.0).

Käytetään VAIN sanojen yhteyksiä (sanue -> sanue_suhde tyyppi 1 = vastine). Álgun suomen- ja saksankielisiä merkityksiä
ei käytetä: ne perustuvat Sammallahden sanakirjoihin (lueminut.txt), joiden oikeudet eivät ole selvät.

Álgu antaa muiden kielten sanat usein vanhoista lähteistä foneettisella merkinnällä (čeˈrgijdiđ, tšiḙłłi̬ᵓḱ͕), joten sana
näytetään vain, jos se on nykyisessä sanakirjassa: inari ja koltta sovelluksen omista sanastoista (smn_words, sms_words),
luulaja ja eteläsaame GiellaLT:n sanakirjoista (dict-smj-sme, dict-sma-sme). Tulos tauluun
related_sami(word_id, lang, word): enintään 3 sanaa kieltä kohden. Sukulaissana ei ole käännös: sama alkuperä, merkitys
voi poiketa.

Aja yksin olemassa olevaan tietokantaan: python3 import_full_dict.py --vain-algu
"""
import collections
import difflib
import glob
import io
import os
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ZIP = os.path.join(SCRIPT_DIR, "lahteet", "algu-16.3.2023.zip")
LANGS = {"46": "smn", "47": "sms", "44": "smj", "41": "sma"}  # Álgun kieli-id -> kielikoodi
SME = "45"
COGNATE = "1"  # sanue_suhde.suhdetyyppi: vastine
PER_LANG = 2
TABLES = {"lekseemi", "ilmentyma", "sanueliitos", "sanue", "sanue_suhde"}


class _Clean(io.RawIOBase):
    """mysqldump-XML:ssä on ohjausmerkkejä (bibliografia), joita XML ei salli: poistetaan lukiessa"""
    def __init__(self, f):
        self.f = f

    def readable(self):
        return True

    def readinto(self, b):
        d = re.sub(rb"[\x00-\x08\x0b\x0c\x0e-\x1f]", b"", self.f.read(len(b)))
        b[:len(d)] = d
        return len(d)


def read_algu():
    lex, forms, members, of_lex, sanue, links = {}, collections.defaultdict(set), collections.defaultdict(set), \
        collections.defaultdict(set), {}, collections.defaultdict(set)
    with zipfile.ZipFile(ZIP) as z:
        name = next(n for n in z.namelist() if n.endswith(".xml"))
        cur = None
        for ev, el in ET.iterparse(io.BufferedReader(_Clean(z.open(name))), events=("start", "end")):
            if ev == "start":
                if el.tag == "table_data":
                    cur = el.get("name")
                continue
            if el.tag != "row":
                continue
            if cur in TABLES:
                r = {f.get("name"): (f.text or "") for f in el}
                if cur == "lekseemi":
                    lex[r["id"]] = r["kieli_id"]
                elif cur == "ilmentyma" and r["ilmentyma"].strip():
                    forms[r["lekseemi_id"]].add(r["ilmentyma"].strip())
                elif cur == "sanueliitos":
                    members[r["sanue_id"]].add(r["lekseemi_id"])
                    of_lex[r["lekseemi_id"]].add(r["sanue_id"])
                elif cur == "sanue":
                    sanue[r["id"]] = (r["kieli_id"], r["eduslekseemi"])
                elif cur == "sanue_suhde" and r["suhdetyyppi"] == COGNATE:
                    links[r["sanue1_id"]].add(r["sanue2_id"])
                    links[r["sanue2_id"]].add(r["sanue1_id"])
            el.clear()
    return lex, forms, members, of_lex, sanue, links


def _norm(word, lang=""):
    """Vertailuun: pienet kirjaimet, NFC, painomerkki pois; koltan heittomerkit (´ ' ’) ʹ:ksi"""
    w = unicodedata.normalize("NFC", word.strip().lower()).replace("ˈ", "")
    if lang == "sms":
        w = re.sub(r"[´'’ʼ]", "ʹ", w)
    return w


def _lexicon(cursor):
    """Nykyiset sanastot: {kieli: {normalisoitu: kirjoitusasu}}"""
    out = {"smn": {}, "sms": {}, "smj": {}, "sma": {}}
    for lang, table in (("smn", "smn_words"), ("sms", "sms_words")):
        try:
            for (lemma,) in cursor.execute(f"SELECT lemma FROM {table}"):
                out[lang].setdefault(_norm(lemma, lang), lemma)
        except Exception:
            pass
    for lang in ("smj", "sma"):
        for path in glob.glob(os.path.join(SCRIPT_DIR, f"dict-{lang}-sme", "src", "*.xml")):
            for l in ET.parse(path).getroot().iter("l"):
                if l.text and l.text.strip():
                    out[lang].setdefault(_norm(l.text, lang), l.text.strip())
    return out


def apply(cursor):
    if not os.path.exists(ZIP):
        print("  Álgu: lahteet/ puuttuu (aja hae_lahteet.sh), ohitetaan")
        return
    lex, forms, members, of_lex, sanue, links = read_algu()
    lexicon = _lexicon(cursor)
    app = collections.defaultdict(list)
    for wid, lemma in cursor.execute("SELECT id, sme_lemma FROM dictionary"):
        app[_norm(lemma)].append(wid)
    rows, words = [], collections.Counter()
    for lid, lang in lex.items():
        if lang != SME:
            continue
        wids = {w for f in forms[lid] for w in app.get(_norm(f), [])}
        if not wids:
            continue
        # Ehdokkaat: sanueen pääsana (eduslekseemi) ensin, sitten muodoltaan lähimmät (guolli: kyeli ennen kálládâh)
        cands = collections.defaultdict(dict)
        sme_forms = [_norm(f) for f in forms[lid]]
        for s in of_lex[lid]:
            for t in links.get(s, ()):
                tl = LANGS.get(sanue.get(t, (None,))[0])
                if not tl:
                    continue
                for other in members[t]:
                    for f in forms[other]:
                        hit = lexicon[tl].get(_norm(f, tl))
                        if not hit:
                            continue
                        sim = max(difflib.SequenceMatcher(None, _norm(hit, tl), x).ratio() for x in sme_forms)
                        key = (0 if other == sanue[t][1] else 1, -sim)
                        if hit not in cands[tl] or key < cands[tl][hit]:
                            cands[tl][hit] = key
        found = {tl: [w for w, _ in sorted(c.items(), key=lambda kv: kv[1])] for tl, c in cands.items()}
        for tl, ws in found.items():
            for wid in wids:
                for w in ws[:PER_LANG]:
                    rows.append((wid, tl, w))
                words[tl] += 1
    cursor.execute("DROP TABLE IF EXISTS related_sami")
    cursor.execute("CREATE TABLE related_sami (word_id INTEGER, lang TEXT, word TEXT)")
    cursor.executemany("INSERT INTO related_sami VALUES (?, ?, ?)", sorted(set(rows)))
    print(f"  Álgu: sukulaissanoja {len(set(rows))} riviä; sanoja kielittäin {dict(words)}")
