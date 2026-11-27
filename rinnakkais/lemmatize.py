"""Saamen puoli perusmuodoiksi GiellaLT:n jäsentimellä ja yhteysriippuvalla erottelulla (giella-sme: tokeniser +
mwe-dis + disambiguator, GPL-3.0). Tulos {lang}.smelem.txt: sana per token muodossa lemma|POS, tuntematon ?|sana.
Kaksi jäsentämätöntä riviä kerrallaan ei saa sekoittua: rivit erotetaan tunnisteella."""
import os, re, subprocess, sys

G = os.path.expanduser("~/.cache/gievra-sme/root/usr/share/giella/sme")
lang = sys.argv[1]
lines = [l.rstrip("\n") for l in open(f"{lang}.sme.txt")]
MARK = "qqxxqq"
CHUNK = int(os.environ.get("CHUNK", "2000"))  # paloina: koko korpus kerralla vei muistin (2026-11-27)
cmd = (f"hfst-tokenise -g {G}/tokeniser-disamb-gt-desc.pmhfst | vislcg3 -g {G}/mwe-dis.bin | "
       f"vislcg3 -g {G}/disambiguator.bin")
def outputs():
    for k in range(0, len(lines), CHUNK):
        text = "".join(f"{l} . {MARK} .\n" for l in lines[k:k + CHUNK])
        yield from subprocess.run(cmd, shell=True, input=text, capture_output=True, text=True).stdout.splitlines()
        print(f"  {min(k + CHUNK, len(lines))}/{len(lines)}", file=sys.stderr, flush=True)
res, cur, word, done = [], [], None, False
for l in outputs():
    if l.startswith('"<'):
        word, done = l[2:-2], False
        if word == MARK:
            res.append(cur[:-1] if cur and cur[-1] == "PUNCT" else cur); cur = []; word = None
        continue
    if l.startswith("\t") and word is not None and not done:
        m = re.match(r'\t"(.+?)"\s+(\S+)', l)
        done = True
        if not m or "?" in l: cur.append("?|" + word.lower()); continue
        lem, pos = m.group(1), m.group(2)
        if pos in ("CLB", "PUNCT", "LEFT", "RIGHT", "QUOTE"): cur.append("PUNCT"); continue
        cur.append(f"{lem}|{pos}".replace(" ", "_"))
res = [[t for t in r if t != "PUNCT"] for r in res]
assert len(res) == len(lines), (len(res), len(lines))
with open(f"{lang}.smelem.txt", "w") as f:
    for r in res: f.write(" ".join(r) + "\n")
print(lang, len(res), "riviä")
