"""eflomalin linkit -> (saamen perusmuoto, sanaluokka) -> kohdekielen perusmuoto -ehdokkaat, ja tarkistus sanakirjan
ihmisen käännöksiä vastaan. Käyttö: python3 score.py nob|fin"""
import collections, json, os, re, sqlite3, sys, pickle

lang = sys.argv[1]
H = os.path.expanduser("~")
DEV = H + "/.cache/satni-fst-night/dev"
db = sqlite3.connect(DEV + "/satni.db")

# saamen sanamuoto -> {(lemma, pos)}
sme = collections.defaultdict(set)
for s, l, p in db.execute("SELECT p.surface, d.sme_lemma, d.pos FROM paradigms p JOIN dictionary d ON d.id = p.word_id"):
    sme[s.lower()].add((l, p))
for t in ("sme_extra", "sme_passive"):
    for s, l, p in db.execute(f"SELECT x.surface, d.sme_lemma, d.pos FROM {t} x JOIN dictionary d ON d.id = x.word_id"):
        sme[s.lower()].add((l, p))
for l, p in db.execute("SELECT sme_lemma, pos FROM dictionary"):
    sme[l.lower()].add((l, p))

# kohdekielen sanamuoto -> {perusmuoto}
cache = f"trglem-{lang}.pkl"
if os.path.exists(cache):
    trg = pickle.load(open(cache, "rb"))
else:
    trg = collections.defaultdict(set)
    if lang == "nob":
        lem = {}
        for line in open(DEV + "/ordbank-nob/lemma.txt", encoding="latin1"):
            c = line.rstrip("\r\n").split("\t")
            if len(c) > 2: lem[c[1]] = c[2].lower()
        for line in open(DEV + "/ordbank-nob/fullformsliste.txt", encoding="latin1"):
            c = line.rstrip("\r\n").split("\t")
            if len(c) > 3 and c[1] in lem: trg[c[2].lower()].add(lem[c[1]])
    else:
        import libvoikko
        v = libvoikko.Voikko("fi")
        words = {w for line in open("fin.trg.txt") for w in line.split()}
        for w in words:
            for a in v.analyze(w):
                if a.get("BASEFORM"): trg[w].add(a["BASEFORM"].lower())
    trg = dict(trg)
    pickle.dump(trg, open(cache, "wb"))

def comp(w):  # yhdyssana: pisin tunnettu loppuosa (språkressurser -> språk + ressurs)
    for i in range(3, len(w) - 2):
        e = trg.get(w[i:])
        if e and len(w[i:]) >= 4:
            return {w[:i] + x for x in e}
    return {w}
S = [l.split() for l in open(f"{lang}.sme.txt")]
T = [l.split() for l in open(f"{lang}.trg.txt")]
F = [l.split() for l in open(f"{lang}.fwd")]
R = [l.split() for l in open(f"{lang}.rev")]
cnt = collections.defaultdict(collections.Counter)
unk = collections.defaultdict(collections.Counter)  # saamen sana, jota sanakirjassa ei ole
freq = collections.Counter()
for s, t, f, r in zip(S, T, F, R):
    links = set(f) & set(r)  # leikkaus: tarkkuus ennen kattavuutta
    for w in s:
        for k in sme.get(w, ()): freq[k] += 1
    for x in links:
        i, j = map(int, x.split("-"))
        sw, tw = s[i], t[j]
        ls = sme.get(sw)
        lt = trg.get(tw) or comp(tw)
        if ls:
            for k in ls:
                for b in lt: cnt[k][b] += 1 / (len(ls) * len(lt))
        else:
            for b in lt: unk[sw][b] += 1 / len(lt)

# Sanakirjan ihmisen käännökset
gold = collections.defaultdict(set)
col = "finnish_translation" if lang == "fin" else "nob_translation"
for l, p, tr in db.execute(f"SELECT sme_lemma, pos, {col} FROM dictionary WHERE {col} <> ''"):
    gold[(l, p)] |= {x.strip().lower() for x in re.split(r"[,;]", tr) if x.strip()}
for l, p, tr in db.execute("SELECT d.sme_lemma, d.pos, m.translations FROM meanings m JOIN dictionary d ON d.id = m.word_id WHERE m.lang = ?", (lang,)):
    gold[(l, p)] |= {x.strip().lower() for x in re.split(r"[,;]", tr or "") if x.strip()}

def heads(g):  # monisanaisen käännöksen sanat (hyvällä tuulella -> myös sanat)
    out = set(g)
    for x in g: out |= set(x.split())
    return out

def evaluate(min_n, min_share):
    ok = tot = 0
    for k, c in cnt.items():
        if k not in gold or k[1] not in ("N", "V", "A", "Adv") or k[0][:1].isupper(): continue
        n = sum(c.values()); b, m = c.most_common(1)[0]
        if n < min_n or m / n < min_share: continue
        tot += 1; ok += b in heads(gold[k])
    return ok, tot

print(f"{lang}: linkkejä {sum(sum(c.values()) for c in cnt.values()):.0f}, sanoja {len(cnt)}")
for mn in (3, 5, 10, 20):
    for sh in (0.3, 0.5, 0.7):
        ok, tot = evaluate(mn, sh)
        print(f"  n>={mn:<3} osuus>={sh}: {ok}/{tot} = {100*ok/max(tot,1):.1f} % ylin ehdokas on sanakirjan käännös")
pickle.dump({"cnt": dict(cnt), "unk": dict(unk), "freq": freq}, open(f"res-{lang}.pkl", "wb"))
