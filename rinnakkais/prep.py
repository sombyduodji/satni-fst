"""GiellaLT:n vapaan korpuksen lauseparit (TMX) pohjoissaame -> nob/fin eflomalia varten.
Lähde: ~/Git/corpus-nob/tmx/sme, ~/Git/corpus-fin/tmx/sme (vapaa osa, GiellaLT). Vain tilastoihin.
Tulos: {lang}.sme.txt, {lang}.trg.txt (pienaakkosin, välilyönnein erotetut sanat)."""
import glob, html, os, re, sys

H = os.path.expanduser("~")
TOK = re.compile(r"[a-zA-ZáčđŋšŧžÁČĐŊŠŦŽåøæÅØÆäöÄÖéèü]+(?:-[a-zA-ZáčđŋšŧžÁČĐŊŠŦŽåøæÅØÆäöÄÖ]+)*")
TU = re.compile(r"<tu>(.*?)</tu>", re.S)
TUV = re.compile(r'<tuv xml:lang="(\w+)">\s*<seg>(.*?)</seg>', re.S)

for lang in ("nob", "fin"):
    seen, n = set(), 0
    with open(f"{lang}.sme.txt", "w") as fs, open(f"{lang}.trg.txt", "w") as ft:
        for f in sorted(glob.glob(f"{H}/Git/corpus-{lang}/tmx/sme/**/*.tmx", recursive=True)):
            for tu in TU.findall(open(f, encoding="utf-8", errors="replace").read()):
                d = {l: html.unescape(re.sub(r"<[^>]+>", "", s)) for l, s in TUV.findall(tu)}
                if "sme" not in d or lang not in d:
                    continue
                a = [w.lower() for w in TOK.findall(d["sme"])]
                b = [w.lower() for w in TOK.findall(d[lang])]
                if not (1 <= len(a) <= 80 and 1 <= len(b) <= 80) or max(len(a), len(b)) > 3 * min(len(a), len(b)) + 2:
                    continue
                key = (" ".join(a), " ".join(b))
                if key in seen:
                    continue
                seen.add(key)
                fs.write(key[0] + "\n"); ft.write(key[1] + "\n"); n += 1
    print(lang, n, "lauseparia")
