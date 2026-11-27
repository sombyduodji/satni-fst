"""Varmat ehdokkaat rinnakkaistekstien linjauksesta (2026-11-27). Ehdokas (saamen sana -> suomi/norja) hyväksytään vain,
jos ihmisen tekemä sanakirjadata vahvistaa sen:
  A) yhdyssana: saamen sanan osat (lang-sme-analyysi) vastaavat järjestyksessä sanakirjan suomennoksia/norjannoksia, ja
     ehdokas on täsmälleen osien käännösten yhdistelmä (čoakkán = kokous + mearrádus = päätös -> kokouspäätös);
  B) muu sana: suomen ja norjan ehdokkaat ovat toistensa käännökset GiellaLT:n dict-fin-nob / dict-nob-fin -sanakirjassa,
     ja sanaluokka täsmää (Voikko / ordbank).
Tarkkuus mitataan sanoilla, joilla sanakirjassa on jo käännös. Tulos: certain-{fin,nob}.tsv"""
import collections, glob, json, os, pickle, re, sqlite3, subprocess
import xml.etree.ElementTree as ET

H = os.path.expanduser("~")
DEV = H + "/.cache/satni-fst-night/dev"
db = sqlite3.connect(DEV + "/satni.db")
R = {l: pickle.load(open(f"res2-{l}.pkl", "rb"))["cnt"] for l in ("fin", "nob")}
MIN_N, MIN_SHARE = 5, 0.6

tr = {l: collections.defaultdict(set) for l in ("fin", "nob")}
for lang, col in (("fin", "finnish_translation"), ("nob", "nob_translation")):
    for l, p, t in db.execute(f"SELECT sme_lemma, pos, {col} FROM dictionary WHERE {col} <> ''"):
        tr[lang][(l, p)] |= {x.strip().lower() for x in re.split(r"[,;]", re.sub(r"\(.*?\)", "", t)) if x.strip()}
    for l, p, t in db.execute("SELECT d.sme_lemma, d.pos, m.translations FROM meanings m JOIN dictionary d ON d.id = m.word_id WHERE m.lang = ?", (lang,)):
        tr[lang][(l, p)] |= {x.strip().lower() for x in re.split(r"[,;]", re.sub(r"\(.*?\)", "", t or "")) if x.strip()}
by_lemma = {l: collections.defaultdict(set) for l in ("fin", "nob")}
for lang in tr:
    for (l, p), s in tr[lang].items():
        by_lemma[lang][l] |= {x for x in s if " " not in x}

# Suomen yhdyssanan alkuosan muodot: perusmuoto, yksikön genetiivi, -nen -> -s (fin_forms)
fin_gen = {}
for w, p, f in db.execute("SELECT word, pos, forms FROM fin_forms"):
    m = re.search(r"(?:^|;)Sg\+Gen=([^;]+)", f)
    if m: fin_gen.setdefault(w, set()).update(m.group(1).split("/"))
def initial(lang, w):
    if lang == "fin":
        v = {w} | fin_gen.get(w, set())
        if w.endswith("nen"): v.add(w[:-3] + "s")
        return v
    v = {w, w + "s", w + "e"}
    if w.endswith("e"): v |= {w[:-1], w[:-1] + "s"}
    return v
def compose(lang, parts, target):
    """Onko target = osien käännösten yhdistelmä (viimeinen osa perusmuodossa)?"""
    if not parts: return target == ""
    if len(parts) == 1:
        return any(target == t for t in by_lemma[lang][parts[0]])
    return any(target.startswith(v) and compose(lang, parts[1:], target[len(v):].lstrip("-"))
               for t in by_lemma[lang][parts[0]] for v in initial(lang, t) if len(v) >= 2)

# Saamen yhdyssanojen osat
cands = {k for l in R for k in R[l]}
words = sorted({k[0] for k in cands})
A = H + "/.cache/satni-fst-build/fst/lang-sme/src/fst/analyser-gt-norm.hfstol"
out = subprocess.run(["hfst-optimized-lookup", "-q", A], input="\n".join(words) + "\n", capture_output=True, text=True).stdout
splits = collections.defaultdict(list)
for line in out.splitlines():
    p = line.split("\t")
    if len(p) >= 2 and "#" in p[1] and "+?" not in p[1]:
        parts = [seg.split("+")[0] for seg in p[1].split("#")]
        if parts not in splits[p[0]]: splits[p[0]].append(parts)

# fin-nob-parit ja sanaluokat
pairs = set()
D = H + "/.cache/satni-fst-build/dicts-2026-11-25/"
for d, rev in (("dict-fin-nob", False), ("dict-nob-fin", True)):
    for f in glob.glob(D + d + "/src/*.xml"):
        try: root = ET.parse(f).getroot()
        except ET.ParseError: continue
        for e in root.iter("e"):
            l = e.find("lg/l")
            if l is None or not l.text: continue
            for t in e.iter("t"):
                if t.text:
                    a, b = l.text.strip().lower(), t.text.strip().lower()
                    pairs.add((b, a) if rev else (a, b))
import libvoikko
V = libvoikko.Voikko("fi")
VCLASS = {"N": {"nimisana", "nimisana_laatusana"}, "A": {"laatusana", "nimisana_laatusana", "nimisana"}, "V": {"teonsana"}, "Adv": {"seikkasana"}}
def fin_pos_ok(w, p):
    return any(a.get("BASEFORM") == w and a.get("CLASS") in VCLASS.get(p, ()) for a in V.analyze(w))
nob_tags = collections.defaultdict(set)
lem = {}
for line in open(DEV + "/ordbank-nob/lemma.txt", encoding="latin1"):
    c = line.rstrip("\r\n").split("\t")
    if len(c) > 2: lem[c[1]] = c[2].lower()
for line in open(DEV + "/ordbank-nob/fullformsliste.txt", encoding="latin1"):
    c = line.rstrip("\r\n").split("\t")
    if len(c) > 3 and c[1] in lem and lem[c[1]] == c[2].lower(): nob_tags[c[2].lower()].add(c[3].split()[0])
NCLASS = {"N": {"subst"}, "A": {"adj"}, "V": {"verb"}, "Adv": {"adv"}}
def nob_pos_ok(w, p):
    t = nob_tags.get(w)
    if t is None:  # yhdyssana: loppuosan sanaluokka
        for i in range(3, len(w) - 2):
            if w[i:] in nob_tags: t = nob_tags[w[i:]]; break
    return bool(t and t & NCLASS.get(p, set()))

def top(lang, k):
    c = R[lang].get(k)
    if not c: return None
    n = sum(c.values()); b, m = c.most_common(1)[0]
    return (b, m / n, n) if n >= MIN_N and m / n >= MIN_SHARE else None

res = {"fin": [], "nob": []}
parts_of = {}
for k in cands:
    w, p = k
    if p not in ("N", "V", "A", "Adv") or w[:1].isupper() or len(w) < 4 or not re.fullmatch(r"[a-záčđŋšŧž]+", w):
        continue
    t = {l: top(l, k) for l in ("fin", "nob")}
    for lang in ("fin", "nob"):
        if not t[lang]: continue
        b = t[lang][0]
        route = None
        ok_parts = [parts for parts in splits.get(w, []) if compose(lang, parts, b)]
        if ok_parts:
            route = "A-osat"; parts_of[(w, p, lang)] = "+".join(ok_parts[0])
        else:
            other = "nob" if lang == "fin" else "fin"
            if t[other] and ((b, t[other][0]) if lang == "fin" else (t[other][0], b)) in pairs \
                    and (fin_pos_ok(b, p) if lang == "fin" else nob_pos_ok(b, p)) and not splits.get(w):
                route = "B-fi+nb"
        if route:
            res[lang].append((w, p, b, route, round(t[lang][1], 2), int(t[lang][2])))

for lang in ("fin", "nob"):
    rows = res[lang]
    gold = [r for r in rows if (r[0], r[1]) in tr[lang]]
    for route in ("A-osat", "B-fi+nb"):
        g = [r for r in gold if r[3] == route]
        ok = sum(1 for r in g if r[2] in tr[lang][(r[0], r[1])] or any(r[2] in x.split() for x in tr[lang][(r[0], r[1])]))
        new = [r for r in rows if r[3] == route and (r[0], r[1]) not in tr[lang]]
        print(f"{lang} {route}: tarkistettavissa {len(g)}, sanakirjan kanssa sama {ok} ({100*ok/max(len(g),1):.1f} %), uusia {len(new)}")
    with open(f"certain-{lang}.tsv", "w") as f:
        f.write("sme\tpos\tcandidate\troute\tshare\tn\tin_dict\tdict_translation\tparts\n")
        for r in sorted(rows):
            g = tr[lang].get((r[0], r[1]))
            f.write("\t".join(map(str, r)) + f"\t{'yes' if g else 'no'}\t{'; '.join(sorted(g))[:80] if g else ''}\t{parts_of.get((r[0], r[1], lang), '')}\n")
