"""Kellonajat kellopeliin ja kuunteluharjoitukseen (käyttäjä 2026-11-22): kello.json (-> web/data/kello.json) ja äänet.

144 aikaa (12 tuntia x 5 minuuttia), tasot 0 tasatunnit, 1 puolet, 2 vartit, 3 muut viiden minuutin ajat.
  - Saame: GiellaLT lang-sme transcriptor-clock-digit2text (GPL-3.0): 3.30 -> beal njeallje, 3.20 -> logi váile beal
    njeallje. Lause "Diibmu lea …" (sanakirjojen esimerkit: Diibmu lea beal golbma). Kysymys "Ollugo diibmu lea?"
    (dict-spa-sme: ¿qué hora es?). Kirjoituspeli hyväksyy myös vartin sanalla njealjádas.
  - Suomi: minuutit 20, 25, 35 ja 40 puolesta tunnista kuten saamessa (kymmentä vaille puoli viisi); muuten säännöillä (yli: viisi, kymmenen, varttia, kaksikymmentä, kaksikymmentäviisi; vaille partitiivilla:
    kahtakymmentäviittä, kahtakymmentä, varttia, kymmentä, viittä), Voikko tarkistaa jokaisen sanan.
  - Äänet: Biret (Divvunin puhesynteesi, lupa koota valmiiksi) ja Harri (fi-tts). Raaka-äänet
    ~/.cache/satni-fst-build/clock/{biret,harri}; tämä skripti tekee niistä Ogg Opus -tiedostot:
      web/audio/w/kello-<i>-fi.ogg, kello-<i>-sme.ogg   (kuunteluharjoitus; myös pelin kuuntelukysymys)
      web/audio/peli/kello-<i>-ok.ogg, kello-<i>-no.ogg (pelin palaute: Riekta! / Boastut. + oikea aika)
      web/audio/peli/kello-q.ogg                         (Ollugo diibmu lea?)
Aja: python3 kello.py [--texts-only]
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.expanduser("~/.cache/satni-fst-build/clock/")
T = os.path.expanduser("~/.cache/satni-fst-build/fst/lang-sme/src/fst/transcriptions/transcriptor-clock-digit2text.filtered.lookup.hfstol")
FI = ["", "yksi", "kaksi", "kolme", "neljä", "viisi", "kuusi", "seitsemän", "kahdeksan", "yhdeksän", "kymmenen", "yksitoista", "kaksitoista"]
YLI = {5: "viisi", 10: "kymmenen", 15: "varttia", 20: "kaksikymmentä", 25: "kaksikymmentäviisi"}
VAILLE = {35: "kahtakymmentäviittä", 40: "kahtakymmentä", 45: "varttia", 50: "kymmentä", 55: "viittä"}
# Minuutit 20-40 saamen tapaan puolesta tunnista (käyttäjä 2026-11-23: kuuntelussa "kahtakymmentä vaille viisi" vs.
# "logi badjel beal vihtta" hämäsi). Luontevaa puhuttua suomea: kymmentä vaille puoli viisi = 4.20.
PUOLI = {20: "kymmentä vaille", 25: "viittä vaille", 35: "viisi yli", 40: "kymmenen yli"}


def texts():
    times = [(h, m) for h in range(1, 13) for m in range(0, 60, 5)]
    out = subprocess.run(["hfst-lookup", "-q", T], input="".join(f"{h}.{m:02d}\n" for h, m in times),
                         capture_output=True, text=True, check=True).stdout
    sme = {}
    for line in out.splitlines():
        p = line.split("\t")
        if len(p) >= 2 and "+?" not in p[1]:
            sme.setdefault(p[0], p[1])
    import libvoikko
    v = libvoikko.Voikko("fi")
    rows = []
    for h, m in times:
        n = h % 12 + 1
        fi = FI[h] if m == 0 else f"puoli {FI[n]}" if m == 30 else f"{PUOLI[m]} puoli {FI[n]}" if m in PUOLI else f"{YLI[m]} yli {FI[h]}" if m < 30 else f"{VAILLE[m]} vaille {FI[n]}"
        bad = [w for w in fi.split() if not v.spell(w)]
        assert not bad, (h, m, bad)
        s = sme[f"{h}.{m:02d}"]
        rows.append({"h": h, "m": m, "level": 0 if m == 0 else 1 if m == 30 else 2 if m in (15, 45) else 3,
                     "sme": s, "smeFull": f"Diibmu lea {s}.", "fiShort": fi, "fi": f"Kello on {fi}."})
    return rows


def audio(rows):
    sys.path.insert(0, os.path.expanduser("~/.cache/satni-fst-build/drill-audio"))
    import numpy as np
    import soundfile as sf
    # build.py:n apufunktiot (lataus, reunojen siistiminen, tasoitus); ei ajeta build.py:tä itseään
    src = open(os.path.expanduser("~/.cache/satni-fst-build/drill-audio/build.py")).read()
    ns = {}
    exec(src.split("def first(")[0].replace('OUT = os.path.expanduser("~/Git/satni-fst/web/audio/w/")', "OUT = ''"), ns)
    load, trim, norm, SR, LEVEL = ns["load"], ns["trim"], ns["norm"], ns["SR"], ns["LEVEL"]
    trim_fi = ns.get("trim_fi", trim)  # Harrin loppu siihen, kun ääni on hiipunut (ei loppupursketta)

    def write(parts, out, fi=False):
        seq = [np.zeros(int(SR * .05))]
        for k, p in enumerate(parts):
            seq += ([np.zeros(int(SR * .35))] if k else []) + [norm((trim_fi if fi else trim)(load(p)))]
        x = np.concatenate(seq + [np.zeros(int(SR * .1))]).clip(-1, 1)
        sf.write(out, x, SR, format="OGG", subtype="OPUS", compression_level=LEVEL)
        return round(len(x) / SR, 2)

    W, P = os.path.join(HERE, "web/audio/w/"), os.path.join(HERE, "web/audio/peli/")
    write([B + "biret/q.wav"], P + "kello-q.ogg")
    for i, r in enumerate(rows):
        key = f'{r["h"]}-{r["m"]:02d}'
        fi_wav = harri_file(r["fi"].rstrip("."))
        r["d"] = [write([fi_wav], f"{W}kello-{i}-fi.ogg", fi=True), write([B + f"biret/{key}.wav"], f"{W}kello-{i}-sme.ogg")]
        write([B + "biret/ok.wav", B + f"biret/{key}.wav"], f"{P}kello-{i}-ok.ogg")
        write([B + "biret/no.wav", B + f"biret/{key}.wav"], f"{P}kello-{i}-no.ogg")


def harri_file(text):
    for ext in (".wav", ".mp3"):
        p = B + "harri/" + text + ext
        if os.path.exists(p):
            return p
    raise FileNotFoundError(text)


if __name__ == "__main__":
    rows = texts()
    if "--texts-only" not in sys.argv:
        audio(rows)
    json.dump({"source": "GiellaLT lang-sme transcriptor-clock-digit2text (GPL-3.0); suomi: kello.py; äänet Biret (Divvun) ja Harri (fi-tts)",
               "rows": rows}, open(os.path.join(HERE, "kello.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    # Sovellukseen export_web_data.py:n kautta (web/data on gitignoressa); kopio heti myös suoraan
    import shutil
    shutil.copyfile(os.path.join(HERE, "kello.json"), os.path.join(HERE, "web/data/kello.json"))
    print(len(rows), "kellonaikaa")
