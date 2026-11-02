#!/usr/bin/env python3
"""Koltansaamen sanojen esiintymismäärät hakusanojen järjestämiseen (skolt_data.py).

Lukee GiellaLT:n korpuksen corpus-sms (git clone https://github.com/giellalt/corpus-sms ~/Git/corpus-sms) vapaat tekstit
(<availability><free/>, ei license type="standard"). Tulos sms_frekvenssit.tsv sisältää vain sanakirjojen koltansaamen
sanojen esiintymismäärät, ei korpuksen tekstiä. Lasketaan vain perusmuoto sellaisena kuin se tekstissä esiintyy.
"""
import collections
import os
import re
import sys

import skolt_data

ROOT = os.path.dirname(os.path.abspath(__file__))
CORPUS = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Git/corpus-sms/converted")
OUT = os.path.join(ROOT, "sms_frekvenssit.tsv")


def main():
    counts = collections.Counter()
    files = 0
    for folder, _, names in os.walk(CORPUS):
        for name in names:
            if not name.endswith(".xml"):
                continue
            text = open(os.path.join(folder, name), encoding="utf-8", errors="ignore").read()
            if not re.search(r"<availability>\s*<free", text[:6000]):
                continue
            files += 1
            for para in re.findall(r"<p(?![^>]*xml:lang)[^>]*>(.*?)</p>", text, re.S):
                counts.update(w.lower() for w in re.findall(r"[^\W\d_]+(?:[ʹ'][^\W\d_]+)*ʹ?", re.sub(r"<[^>]+>", " ", para)))
    info, _ = skolt_data.load(ROOT)
    lemmas = {sms.lower() for sms in info}
    rows = sorted(((w, n) for w, n in counts.items() if w in lemmas), key=lambda r: (-r[1], r[0]))
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(f"# Vapaita tekstejä {files}, sanoja {sum(counts.values())}. Lähde: GiellaLT corpus-sms. Ks. sms_frekvenssit.py\n")
        f.writelines(f"{w}\t{n}\n" for w, n in rows)
    print(files, "tiedostoa,", sum(counts.values()), "sanaa,", len(rows), "/", len(lemmas), "hakusanaa")


if __name__ == "__main__":
    main()
