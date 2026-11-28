"""Yhdyssanojen suomennokset sanoille, joilla sanakirjassa ei ole suomennosta (2026-11-19).

Lähde: cmp_fin_hyvaksytyt.tsv (saame, suomi, osat). Suomennos on koottu osien suomennoksista samalla tavalla kuin
sanakirjahaun yhdyssanoissa (app.js: compoundPartsInfo): yhdistelmä on suomen korpuksessa (Leipzig, CC BY) Voikon
hyväksymänä sanana. Mukana ryhmä A (sanan norjannoksen konekäännös, smi-mt, antaa saman suomen sanan; käsin
tarkistettu otos 44/44 oikein) sekä ryhmistä B ja C käsin tarkistetut 233 ja 354 (osien merkitykset ja norjannos). Ks. muistiinpanot/yhdyssanat-ehdotukset-2026-11-19.md. Uusia rivejä vain tarkistettuina.

Ryhmä D (2026-11-27): GiellaLT:n vapaan korpuksen ihmisen kääntämät rinnakkaistekstit (corpus-fin TMX), sanat linjattu
eflomalilla; mukana vain yhdyssanat, joiden tavallisin suomennos on täsmälleen osien sanakirjasuomennosten yhdistelmä
(50/51 samaa kuin käsin tarkistetut ryhmät). Ks. muistiinpanot/rinnakkaistekstit-2026-11-27.md.

Taulu cmp_fin (word_id, fin, parts): sanakortissa ≈ suomennos (osista: osa + osa), suomenkielinen haku löytää sanan.
"""
import csv
import os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cmp_fin_hyvaksytyt.tsv")


def rows(src):
    if not os.path.exists(FILE):
        return []
    ids = {}
    for wid, lemma, fin in src.execute("SELECT id, sme_lemma, finnish_translation FROM dictionary"):
        if not fin:
            ids.setdefault(lemma, wid)
    out, seen = [], set()
    with open(FILE, encoding="utf-8") as f:
        for row in csv.reader((line for line in f if not line.startswith("#")), delimiter="\t"):
            if len(row) >= 3 and row[0] in ids and ids[row[0]] not in seen:
                seen.add(ids[row[0]])
                out.append((ids[row[0]], row[1], row[2]))
    return out
