"""Inarinsaamen sana pohjoissaamen sanalle kahdesta lähteestä tarkistettuna (minipeli.py ja sanastot.py, kokeellinen).

Sana hyväksytään, kun kaksi lähdettä täsmää: pohjoissaamen sanan inarinsaamen käännös (dict-sme-smn, satni.db) ja
suora sanakirja (dict-smn-fin inari -> suomi, dict-fin-smn suomi -> inari, CC BY 4.0) antaa sille saman suomennoksen.
- Jos suora sanakirja antaa saman sanan uudemmalla kirjoitusasulla (poolitlâš -> pooliitlâš), käytetään sitä.
- Ilman pivotia kelpaa sana, jonka suora sanakirja antaa yksiselitteisesti molempiin suuntiin (keskipäivä -> koskâpeivi).
- Ei etu- tai jälkiliitteitä (tiätu-), ja sanaluokan on oltava sama kuin pohjoissaamen sanalla, jos sanakirja sen kertoo
  (uáinusân on adverbi 'esiin', ei adjektiivi 'näkyvä').
Muut menevät tarkistuslistaan (TSV). Sen viimeinen sarake: inarinsaamen sana = käyttöön, '-' = ei käyttöön
(tarkistettu), tyhjä = vielä tarkistamatta (jää listalle).
"""
import glob
import os
import re
import xml.etree.ElementTree as ET

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def terms(text):
    return [x.strip().lower() for x in re.split(r"[,;]\s*", re.sub(r"\([^)]*\)", "", text or "")) if x.strip()]


def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i]
        for j, y in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y)))
        prev = cur
    return prev[-1]


_DIRECT = None


def direct():
    """({inarin sana: {suomennokset}}, {suomen sana: {inarin sanat}}, {inarin sana: {sanaluokat}})
    sanakirjoista dict-smn-fin ja dict-fin-smn (luetaan kerran)"""
    global _DIRECT
    if _DIRECT is not None:
        return _DIRECT
    smn_fin, fin_smn, smn_pos = {}, {}, {}
    for repo, forward in (("dict-smn-fin", True), ("dict-fin-smn", False)):
        for path in glob.glob(os.path.join(SCRIPT_DIR, repo, "src", "*.xml")):
            try:
                root = ET.parse(path).getroot()
            except ET.ParseError:
                continue
            for e in root.iter("e"):
                l = e.find("lg/l")
                if l is None or not (l.text or "").strip():
                    continue
                head = l.text.strip()
                if forward and l.get("pos"):
                    smn_pos.setdefault(head, set()).add(l.get("pos"))
                for t in e.iter("t"):
                    if not forward and t.get("pos") and (t.text or "").strip():
                        smn_pos.setdefault(t.text.strip(), set()).add(t.get("pos"))
                    for x in terms(t.text):
                        if forward:
                            smn_fin.setdefault(head, set()).add(x)
                            fin_smn.setdefault(x, set()).add(head)
                        else:
                            fin_smn.setdefault(head.lower(), set()).add((t.text or "").strip())
                            smn_fin.setdefault((t.text or "").strip(), set()).add(head.lower())
    _DIRECT = (smn_fin, fin_smn, smn_pos)
    return _DIRECT


class InariPicker:
    """pick(pohjoissaamen sana, suomennos, sanaluokka, norjannos) -> (inarin sana tai None, syy, pivot)"""

    def __init__(self, db, review_path, what):
        self.db, self.review_path, self.what = db, review_path, what
        self.smn_fin, self.fin_smn, self.smn_pos = direct()
        self.reviewed, self.review = {}, []
        self.stats = {"kahdesta lähteestä": 0, "uudempi asu": 0, "suora molempiin suuntiin": 0, "tarkistettu": 0, "tarkistettavana": 0}
        if os.path.exists(review_path):
            for line in open(review_path, encoding="utf-8"):
                c = line.rstrip("\n").split("\t")
                if line.startswith("#") or len(c) < 6 or c[0] == "pohjoissaame":
                    continue
                if c[5].strip():
                    # avain (pohjoissaame, suomi): sama sana voi olla kahdella rivillä (dát tämä / dát nämä);
                    # tyhjä suomi = vanha merkintä, joka koskee sanan kaikkia rivejä
                    self.reviewed[(c[0], c[1].strip())] = c[5].strip()

    @property
    def available(self):
        return bool(self.smn_fin)

    def fits(self, cand, pos):
        if not cand or cand.startswith("-") or cand.endswith("-"):
            return False
        return not (pos in ("N", "V", "A", "Adv") and self.smn_pos.get(cand) and pos not in self.smn_pos[cand])

    def pivot(self, sme):
        r = self.db.execute("SELECT smn_translation FROM dictionary WHERE sme_lemma = ? ORDER BY freq DESC LIMIT 1", (sme,)).fetchone()
        return (terms(r[0]) or [""])[0] if r and r[0] else ""

    def pick(self, sme, fi, pos=None, nb=""):
        piv = self.pivot(sme)
        concept = set(terms(fi))
        cands = sorted(set().union(*[self.fin_smn.get(t, set()) for t in concept])) if concept else []
        rk = (sme, fi) if (sme, fi) in self.reviewed else (sme, "") if (sme, "") in self.reviewed else None
        if rk:
            word, why = (None if self.reviewed[rk] == "-" else self.reviewed[rk]), "tarkistettu"
        elif piv and self.fits(piv, pos) and (self.smn_fin.get(piv, set()) & concept or piv in cands):
            word, why = piv, "kahdesta lähteestä"
        else:
            near = [d for d in cands if lev(d.lower(), piv.lower()) <= 2 and self.fits(d, pos)] if piv else []
            if len(near) == 1:
                word, why = near[0], "uudempi asu"
            elif len(concept) == 1 and len(cands) == 1 and self.fits(cands[0], pos) and self.smn_fin.get(cands[0], set()) & concept:
                word, why = cands[0], "suora molempiin suuntiin"
            else:
                word, why = None, "tarkistettavana"
        self.stats[why] += 1
        if why == "tarkistettavana":
            self.review.append([sme, fi, nb, piv, ", ".join(cands[:6])])
        return word, why, piv

    def unpick(self, sme, fi, nb, piv, reason):
        """Hyväksytty sana palautetaan tarkistettavaksi (esim. sama inarin sana kahdelle sukulaissanalle)"""
        self.stats["tarkistettavana"] += 1
        self.review.append([sme, fi, nb, piv, reason])

    def save(self):
        with open(self.review_path, "w", encoding="utf-8") as f:
            f.write(f"# Inarinsaamen {self.what}, joita kaksi lähdettä ei vahvistanut (kirjoitetaan uudelleen joka koonnissa).\n"
                    "# Viimeinen sarake: inarinsaamen sana = käyttöön, '-' = ei käyttöön (tarkistettu), tyhjä = vielä tarkistamatta.\n"
                    "# pivot = dict-sme-smn:n käännös pohjoissaamen sanalle; suora = dict-fin-smn/dict-smn-fin suomennoksen perusteella.\n")
            f.write("pohjoissaame\tsuomi\tnorja\tpivot\tsuora sanakirja\tinarinsaame (tarkistettu)\n")
            for (sme, fi), ok in sorted(self.reviewed.items()):
                f.write(f"{sme}\t{fi}\t\t\t\t{ok}\n")
            for r in self.review:
                f.write("\t".join(r) + "\t\n")

    def summary(self):
        return ", ".join(f"{k} {v}" for k, v in self.stats.items()) + f" -> {os.path.basename(self.review_path)}"
