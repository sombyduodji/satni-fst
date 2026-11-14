// Lausekääntäjä (kokeilu, haara test-lauseet): suomenkielinen lyhyt lause -> pohjoissaame vain sovelluksen omalla
// aineistolla. Jokainen sana tunnistetaan suomen taivutustaulukosta (fin_forms), saamen sana valitaan sanakirjasta
// (trans_search, yleisin ensin) ja muoto haetaan saamen paradigmasta (paradigms). Sanojen väliset säännöt ovat
// tässä tiedostossa (objekti, luku + substantiivi, kielto, -ko -> -go). Käyttäjä näkee jokaisen sanan valinnan ja voi
// vaihtaa sen; tuntemattomalle sanalle ehdotetaan lähimpiä suomen sanoja. Tulos on likimääräinen.

// Kieltoverbi persoonittain (sanakirjan kieltoverbeillä ei ole paradigmaa)
const LAUSE_NEG = { en: "in", et: "it", ei: "ii", emme: "eat", ette: "ehpet", eivät: "eai" };
const LAUSE_NEG_PERSON = { en: "Sg1", et: "Sg2", ei: "Sg3", emme: "Pl1", ette: "Pl2", eivät: "Pl3" };
// Suomen liitepartikkeli -> saamen: -ko/-kö = -go (tuletko = boađátgo), -kin = -nai (minäkin = munnai),
// -kaan/-kään = -ge (kielteisessä lauseessa), -han/-hän = -han (onhan = leahan). Pisin ensin.
const LAUSE_CLITICS = [["kään", "ge"], ["kaan", "ge"], ["kin", "nai"], ["han", "han"], ["hän", "han"], ["ko", "go"], ["kö", "go"]];
// Suomen persoonapronomini -> saamen (mii = me on persoonapronomini, ei kysymyssana mii = mikä)
const LAUSE_PRONOUN = { minä: "mun", sinä: "don", hän: "son", me: "mii", te: "dii", he: "sii" };
// Luvut, joiden jälkeen saamen substantiivi on yksikön genetiivissä (guokte gáfe); 7- ei ole vielä tarkistettu
const LAUSE_SMALL_NUMBERS = ["kaksi", "kolme", "neljä", "viisi", "kuusi"];
const LAUSE_POS = { N: ["N"], V: ["V"], A: ["A"], Num: ["Num"], Pron: ["Pron"] };
// Suomen postpositio -> saamen (sanakirjan Po-sanat); edeltävä substantiivi genetiivissä kummassakin kielessä
// (auton alla = biilla vuolde, pöydän päälle = beavddi ala)
const LAUSE_POSTPOS = {
  päällä: "alde", päälle: "ala", päältä: "alde", alla: "vuolde", alle: "vuollái", alta: "vuolde",
  vieressä: "bálddas", viereen: "báldii", vierestä: "bálddas", takana: "duohken", taakse: "duohkái", takaa: "duohken",
  edessä: "ovddas", eteen: "ovdii", edestä: "ovddas", luona: "luhtte", luo: "lusa", luokse: "lusa", luota: "luhtte",
  sisällä: "siste", sisälle: "sisa", sisään: "sisa", sisältä: "siste", lähellä: "lahka",
};

// Suomen omistusliite -> saamen omistuspronomini substantiivin edessä (talossani = mu viesus, isäänsä = su áhčči).
// Saamessa on myös liitteelliset muodot (áhkkon), mutta pronomini on aina oikein eikä vaadi lisäaineistoa;
// sanakirjan esimerkkilauseissa molemmat ovat yleisiä (2026-11-10: liite 53, pronomini 33, ei merkitty 19).
const LAUSE_PX = [["nsa", "3"], ["nsä", "3"], ["mme", "Pl1"], ["nne", "Pl2"], ["ni", "Sg1"], ["si", "Sg2"]];
const LAUSE_PX_PRONOUN = { Sg1: "mu", Sg2: "du", 3: "su", Pl1: "min", Pl2: "din" };

let lause = { tokens: [] };

// Välimuisti: lause luetaan uudelleen jokaisen näppäilyn jälkeen, ja haut ovat lähes koko ajan (2026-11-10 profiloitu:
// 94 % ajasta SQL-kyselyissä). Sama sana haetaan vain kerran; palautetaan kopio, koska tulkintoja järjestetään ja täydennetään.
const lauseCache = new Map();
function lauseCached(key, fn) {
  if (!lauseCache.has(key)) {
    if (lauseCache.size > 5000) lauseCache.clear();
    lauseCache.set(key, fn());
  }
  return [...lauseCache.get(key)];
}
const lauseFinForms = (w) => lauseCached("f\u0000" + w, () => translationFormsOf(w, "fin"));

function lauseCandidates(base, pos, exactOnly = false) {
  return lauseCached(`c\u0000${base}\u0000${pos}\u0000${exactOnly}`, () => lauseCandidatesUncached(base, pos, exactOnly));
}
function lauseCandidatesUncached(base, pos, exactOnly) {
  // Saamen sanat, joiden suomennos on base; sama sanaluokka ensin, sitten yleisin (korpusfrekvenssi)
  // Käännöslista on haussa yhtenä tekstinä ("mihin kellonaikaan, monelta, moneltako"): sana voi olla missä kohtaa
  // listaa tahansa, kuten hakukentässä
  const f = fold(base);
  // at = 0: käännös on tämä sana tai alkaa sillä (pääkäännös), 1: sana on listassa myöhemmin (galgat "täytyä, saada")
  // fin_items (export_web_data.py) on sama lista sanoittain indeksoituna; vanhassa aineistossa LIKE-haku
  let rows;
  try {
    rows = all(`SELECT d.id, d.sme_lemma, d.pos, d.subtype, d.freq, d.human, d.sem, MIN(COALESCE(i.nr, 9)) AS nr, MIN(i.first) AS at
      FROM fin_items i JOIN dictionary d ON d.id = i.word_id WHERE i.item = ? GROUP BY d.id`, [f]);
  } catch (e) {
    rows = all(`SELECT DISTINCT d.id, d.sme_lemma, d.pos, d.subtype, d.freq, d.human, d.sem, MIN(COALESCE(t.nr, 9)) AS nr,
      MIN(CASE WHEN t.fold = ? OR t.fold LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END) AS at FROM trans_search t
      JOIN dictionary d ON d.id = t.word_id WHERE t.lang = 'fin'
      AND (t.fold = ? OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\') GROUP BY d.id`,
      [f, `${likeEsc(f)}, %`, f, `${likeEsc(f)}, %`, `%, ${likeEsc(f)}`, `%, ${likeEsc(f)}, %`]);
  }
  rows = rows.filter((r) => !exactOnly || r.at === 0);
  const want = LAUSE_POS[pos] || null;
  // Pienellä kirjoitettu sana ei saa isolla alkavaa saamen sanaa (kanssa ≠ Máhtiin), jos muitakin on
  const lower = !/^\p{Lu}/u.test(base) && rows.some((r) => !/^\p{Lu}/u.test(r.sme_lemma));
  return rows
    .filter((r) => !lower || !/^\p{Lu}/u.test(r.sme_lemma))
    .filter((r) => !r.sme_lemma.includes(" ") || rows.length === 1)
    .sort((a, b) => ((want && !want.includes(a.pos)) - (want && !want.includes(b.pos))) || (a.at - b.at)
      || ((b.freq || 0) - (a.freq || 0)) || (a.nr - b.nr))
    .slice(0, 6);
}

// Suomen sanan tulkinnat: [{ base, cell, pos }] (saisinko -> saada Cond+Sg1 + -ko)
function lauseAnalyses(word, raw = word) {
  let clitic = null, stem = word;
  let out = lauseFinForms(word);
  // Erisnimet ovat taulukoissa isolla alkukirjaimella (Inariin = Inari, Sg+Ill): kirjoitettu muoto, sitten iso
  // alkukirjain myös pienellä kirjoitetulle (karigasniemellä = Karigasniemi)
  for (const alt of [raw, word.charAt(0).toUpperCase() + word.slice(1)]) {
    if (out.length || alt === word) continue;
    out = lauseFinForms(alt);
    if (out.length) stem = alt;
  }
  if (!out.length) {
    for (const [c] of LAUSE_CLITICS) {
      if (word.endsWith(c) && word.length >= c.length + 2) {  // myös lyhyt vartalo: onko = on + -ko
        const st = word.slice(0, -c.length);
        // Persoonapronominin perusmuoto ei ole taivutustaulukoissa (minäkin = minä + -kin = munnai)
        const a = LAUSE_PRONOUN[st] ? [{ base: st, cell: "Nom", pos: "Pron" }] : lauseFinForms(st);
        if (a.length) { out = a; clitic = c; stem = st; break; }
      }
    }
  }
  // Omistusliite (vain muuten tuntemattomalle sanalle): liite pois ja loppu taivutustaulukosta. talossani -> talossa,
  // taloni -> talo tai talon (genetiivin n katoaa), talooni -> taloon, talossaan -> talossa (3. persoonan -Vn).
  // Tarkistettu GiellaLT lang-fin -analysaattoria vastaan 2026-11-10: oikea perusmuoto ja sija 79/80.
  let px = null;
  if (!out.length && !clitic) {
    const tries = [];
    for (const [suf, per] of LAUSE_PX) {
      if (word.endsWith(suf) && word.length > suf.length + 2) tries.push([word.slice(0, -suf.length), per], [word.slice(0, -suf.length) + "n", per]);
    }
    const m = word.match(/^(.*([aeiouyäö]))\2n$/u);
    if (m && word.length > 4) tries.push([m[1], "3"]);
    for (const [st, per] of tries) {
      const a = lauseFinForms(st).filter((x) => ["N", "A", "Num"].includes(x.pos));
      if (a.length && (!px || px === per)) { out.push(...a.filter((x) => !out.some((y) => y.base === x.base && y.cell === x.cell))); px = per; stem = out[0].base; }
    }
    // Omistusliitteinen yksikön nominatiivi näyttää genetiiviltä (kaari -> kaareni = kaaren + -ni): genetiiville myös
    // nominatiivitulkinta ensin; finiittiverbin jälkeen objektisääntö vaihtaa sen takaisin genetiiviksi (lauseParse)
    if (px) {
      for (const g of out.filter((x) => x.cell === "Sg+Gen")) {
        if (!out.some((y) => y.base === g.base && y.cell === "Sg+Nom")) out.unshift({ base: g.base, cell: "Sg+Nom", pos: g.pos });
      }
    }
  }
  return { analyses: out, clitic, stem, px };
}

function lauseSuggestions(word) {
  // Lähimmät suomen sanamuodot (sama alku, enintään kaksi merkkiä eri): voilevän -> voileivän
  const dist = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== b[j - 1]));
    return d[a.length][b.length];
  };
  const found = new Map();
  for (const r of all("SELECT word, forms FROM fin_forms WHERE word >= ? AND word < ?", [word.slice(0, 2), word.slice(0, 2) + "￿"])) {
    for (const cell of r.forms.split(";")) {
      for (const v of (cell.split("=")[1] || "").split("/")) {
        const dd = Math.abs(v.length - word.length) <= 2 ? dist(word, v) : 9;
        if (dd <= 2 && (!found.has(v) || found.get(v) > dd)) found.set(v, dd);
      }
    }
  }
  return [...found].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([v]) => v);
}

// Lause sanoiksi ja välimerkeiksi; jokaiselle sanalle tulkinta ja saamen ehdokkaat
function lauseParse(text) {
  const tokens = [];
  // cleanQuery (app.js): NFC, jottei PDF:stä liitetty ä (a + yhdistävä merkki) katkaise sanaa kahtia
  for (const m of cleanQuery(text).matchAll(/\d+(?:[.,:]\d+)*|[\p{L}-]+|[^\s\p{L}\d]+/gu)) {
    const raw = m[0];
    // Numero sellaisenaan (200, 7,5, 12.30); arvo luvun jälkeisen sanan muotoa varten
    if (/^\d/.test(raw)) { tokens.push({ raw, word: raw, num: true, value: parseFloat(raw.replace(",", ".")), known: true }); continue; }
    if (!/\p{L}/u.test(raw)) { tokens.push({ punct: raw }); continue; }
    const word = raw.toLowerCase();
    if (LAUSE_NEG[word]) { tokens.push({ raw, word, neg: word, known: true }); continue; }
    // kanssa: edeltävä sana komitatiivissa (hevosten kanssa = heasttaiguin), itse sana jää pois
    if (word === "kanssa" && tokens.some((x) => !x.punct)) { tokens.push({ raw, word, post: "", withPost: true, known: true }); continue; }
    if (LAUSE_POSTPOS[word] && tokens.some((x) => !x.punct)) { tokens.push({ raw, word, post: LAUSE_POSTPOS[word], known: true }); continue; }
    // Kieltoverbi kysymyksenä: eikö = iigo, etkö = itgo
    const negq = [...LAUSE_CLITICS].find(([c]) => (c === "ko" || c === "kö") && word.endsWith(c) && LAUSE_NEG[word.slice(0, -c.length)]);
    if (negq) { tokens.push({ raw, word, neg: word.slice(0, -negq[0].length), clitic: negq[0], known: true }); continue; }
    const { analyses, clitic, stem, px } = lauseAnalyses(word, raw);
    if (LAUSE_PROGRESSIVE[word]) analyses.unshift({ base: LAUSE_PROGRESSIVE[word], cell: "InfMa+Ine", pos: "V" });
    // Tulkintojen järjestys: sana itse perusmuotona (maksaa = maksaa, ei maksa-sanan partitiivi), yksikkö ennen monikkoa
    // Persoonapronomini ennen samannäköistä sanaa (häntä = hän, ei häntä "seaibi"); omistusliitteellä yksikkö ensin
    const pron = (a) => a.pos === "Pron" && !!LAUSE_PRONOUN[a.base];
    analyses.sort((a, b) => (pron(b) - pron(a)) || (!px && ((b.base === stem) - (a.base === stem)))
      || (a.cell.startsWith("Pl") - b.cell.startsWith("Pl")));
    let pick = analyses[0] || null;
    // Sanalla oma sanakirjan vastine, eikä se ole minkään sanan perusmuoto (missä = gos, kotiin = ruoktot): se ensin
    // Vain sanan oma pääkäännös, eikä nimi pienellä kirjoitetulle sanalle (anna = antaa, ei nimi Anne)
    const direct = !clitic && lauseCandidates(word, null, true)
      .some((c) => c.subtype !== "Prop" || /^\p{Lu}/u.test(raw));
    if (direct && !(pick && (pick.base === stem || pron(pick)))) pick = { base: word, cell: null, pos: null };
    // Ei taivutusta eikä pääkäännöstä: myös käännöslistan myöhempi sana kelpaa (monelta = galles "mihin kellonaikaan, monelta")
    if (!pick && !clitic && lauseCandidates(word, null).some((c) => c.subtype !== "Prop" || /^\p{Lu}/u.test(raw))) {
      pick = { base: word, cell: null, pos: null };
    }
    // Iso alkukirjain lauseen keskellä ja tuntematon sana: nimi, joka säilyy sellaisenaan (Juha)
    if (!pick && tokens.some((x) => !x.punct) && /^\p{Lu}/u.test(raw)) {
      tokens.push({ raw, word, name: true, known: true }); continue;
    }
    // Lauseen alussa tuntematon isolla alkava sana: nimi. Saamen kirjaimella varma (Máret, Ánne), muuten harmaana
    // arvauksena (Elsa), koska se voi olla myös kirjoitusvirhe; napautus näyttää ehdotukset
    // Pitkä sana (Unelmani, Vesiputket) on todennäköisemmin tuntematon suomen sana kuin nimi
    const samiLetters = /[áčđŋšŧžÁČĐŊŠŦŽ]/.test(raw);
    if (!pick && /^\p{Lu}/u.test(raw) && (samiLetters || raw.length <= 6)) {
      tokens.push({ raw, word, name: true, guess: !samiLetters, known: true }); continue;
    }
    tokens.push({ raw, word, stem, clitic, px, analyses, pick, known: !!pick });
  }
  // Kiellon jälkeen verbi on kieltomuodossa (en saa = in oaččo)
  tokens.forEach((t, i) => {
    if (t.neg) {
      const v = tokens.slice(i + 1).find((x) => x.analyses?.some((a) => a.cell === "Prs+ConNeg"));
      if (v) v.pick = v.analyses.find((a) => a.cell === "Prs+ConNeg");
    }
  });
  // Luvun jälkeen substantiivi partitiivissa, ei samannäköinen verbi (kaksi palaa = pala, ei palaa "polttaa")
  tokens.forEach((t, i) => {
    const prev = tokens.slice(0, i).reverse().find((x) => !x.punct);
    const par = t.analyses?.find((a) => a.cell?.endsWith("Par") && a.pos !== "V");
    if (par && lauseIsCount(prev)) {
      t.pick = par;
      t.candidates = lauseCandidates(par.base, par.pos);
      t.choice = t.candidates[0] || null;
    }
  });
  // Verbin perusmuoto vain toisen verbin jälkeen (haluan maksaa); muuten preesens (kahvi maksaa = máksá)
  tokens.forEach((t, i) => {
    if (t.pick?.cell !== "Inf") return;
    const prev = tokens.slice(0, i).reverse().find((x) => !x.punct);
    const finite = t.analyses.find((a) => a.cell.startsWith("Prs+") && a.cell !== "Prs+ConNeg");
    if (finite && !(prev?.pick?.pos === "V" || prev?.neg)) t.pick = finite;
  });
  // Lauseessa ei muuta verbiä: monitulkintainen sana verbinä (tulenkin huomenna = tulla, ei tuli "dolla")
  tokens.forEach((t, i) => {
    // Vain finiittiverbi lasketaan (tulen kaupasta ostamasta = boađán, ei dola: ostamasta ei ole finiittiverbi), ja vain
    // samasta lauseesta pilkkujen välissä (talo, jonka näin, on iso = jonka näin: nähdä, ei näin "nu")
    const finite = (x) => x.neg || (x.pick?.pos === "V" && /^(Prs|Prt|Cond|Pot|Imprt|Pss)\+/.test(x.pick.cell || ""));
    const isBreak = (x) => x.punct && /[,.;:!?]/.test(x.punct);
    let a0 = i; while (a0 > 0 && !isBreak(tokens[a0 - 1])) a0--;
    let b0 = i; while (b0 < tokens.length - 1 && !isBreak(tokens[b0 + 1])) b0++;
    const clause = tokens.slice(a0, b0 + 1);
    if (!t.analyses?.length || t.pick?.pos === "V" || clause.some((x) => x !== t && finite(x))) return;
    const verb = t.analyses.find((a) => a.pos === "V" && /^(Prs|Prt|Cond|Pot)\+(Sg|Pl)/.test(a.cell));
    if (verb) t.pick = verb;
  });
  // Verbi mieluummin indikatiivina kuin imperatiivina (saa = Prs+Sg3)
  for (const t of tokens) {
    if (t.pick?.cell?.startsWith("Imprt") && t.analyses.some((a) => a.cell.startsWith("Prs+") && a.cell !== "Prs+ConNeg")) {
      t.pick = t.analyses.find((a) => a.cell.startsWith("Prs+") && a.cell !== "Prs+ConNeg");
    }
  }
  // Omistusliitteinen nominatiivi/genetiivi (työni, kirjani) finiittiverbin jälkeen on objekti: genetiivi, josta
  // saamen akkusatiivi (olen tehnyt työni = lean bargan mu barggu); verbin edellä subjekti (äitini on = mu eadni lea)
  tokens.forEach((t, i) => {
    if (!t.px || !/(^|\+)Nom$/.test(t.pick?.cell || "")) return;
    const verbBefore = tokens.slice(0, i).some((x) => x.neg || (x.pick?.pos === "V" && /^(Prs|Prt|Cond|Pot|Imprt)\+/.test(x.pick.cell || "")));
    const gen = t.analyses.find((a) => a.base === t.pick.base && a.cell === t.pick.cell.replace("Nom", "Gen"));
    if (verbBefore && gen) t.pick = gen;
  });
  for (const t of tokens) {
    if (!t.pick) continue;
    const pron = LAUSE_PRONOUN[t.pick.base];
    t.candidates = pron ? all("SELECT id, sme_lemma, pos, freq FROM dictionary WHERE sme_lemma = ? AND subtype = 'Pers'", [pron])
      : lauseCandidates(t.pick.base, t.pick.pos);
    t.choice = t.candidates[0] || null;
  }
  // joka: substantiivin edellä "jokainen" (joka päivä = juohke beaivi), muuten relatiivipronomini: ihmisen jälkeen gii
  // (mies, joka tuli = olmmái, gii bođii), muuten mii (talo, jonka näin = viessu, man/maid oidnen)
  tokens.forEach((t, i) => {
    if (t.pick?.base !== "joka") return;
    const next = tokens.slice(i + 1).find((x) => !x.punct);
    if (next?.pick && ["N", "A"].includes(next.pick.pos)) return;
    const prevNoun = tokens.slice(0, i).reverse().find((x) => x.choice && x.pick?.pos === "N");
    const rel = all("SELECT id, sme_lemma, pos, subtype, freq, human, sem FROM dictionary WHERE sme_lemma = ? AND subtype = 'Rel'",
      [prevNoun?.choice?.human ? "gii" : "mii"])[0];
    if (rel) { t.candidates = [rel, ...t.candidates.filter((c) => c.id !== rel.id)]; t.choice = rel; }
  });
  return tokens;
}

// Luku, jonka jälkeen suomessa on partitiivi ja saamessa yksikön genetiivi: numero (200 kilometriä = 200 kilomehtera)
// tai lukusana (kaksi, seitsemän, sata), ei yksi
// Suomen -lla/-lta/-lle substantiivin oletusmuoto saameksi (ks. lauseSamiTag): place, means tai top
const LAUSE_BOAT = /(fanas|vanas|láiva|bárku)$/;
// olla tulossa / menossa / lähdössä = matkalla: saamen progressiivi (olen tulossa = lean boahtime), ei tulo-sanan inessiivi
const LAUSE_PROGRESSIVE = { tulossa: "tulla", menossa: "mennä", lähdössä: "lähteä" };
function lauseDefaultMuoto(choice, fcase, existential = false) {
  if (choice.sem === "surf") return "top";
  // Vene olla-lauseessa on paikka (olemme veneellä = leat fatnasis), muuten kulkuneuvolla liikutaan (menen veneellä = fatnasiin)
  if (choice.sem === "com" && fcase === "Ade") return existential && LAUSE_BOAT.test(choice.sme_lemma) ? "place" : "means";
  return "place";
}
// Muodon vaihtoehdot sijoittain (valikon Muoto-lista)
const LAUSE_MUOTOT = { Ade: ["place", "means", "top"], Abl: ["place", "top"], All: ["place", "top"] };

function lauseIsCount(tok) {
  if (!tok) return false;
  if (tok.num) return tok.value !== 1;
  return !!tok.pick && (LAUSE_SMALL_NUMBERS.includes(tok.pick.base) || (tok.pick.pos === "Num" && tok.pick.base !== "yksi"));
}

// Saamen muoto sanalle lauseessa: tulkinnan solu + lauseen säännöt
function lauseSamiTag(tokens, i) {
  const t = tokens[i], cell = t.pick.cell, pos = (t.pick.pos || t.choice.pos || "").toUpperCase();
  if (!cell) return null;
  const hasVerb = tokens.some((x) => x.pick?.pos === "V" || x.neg);
  // Olla-verbin lause (onko täällä vessaa, on kahvia): suomen partitiivi on olemassaolon subjekti, saamessa nominatiivi
  // (Leago dáppe hivsset?), ei objektin akkusatiivi
  const existential = tokens.some((x) => x.pick?.base === "olla");
  const prev = tokens.slice(0, i).reverse().find((x) => !x.punct);
  const [num, fcase] = cell.includes("+") ? cell.split("+") : [null, cell];
  if (pos === "V") {
    if (cell === "Prs+ConNeg") return "Ind+Prs+ConNeg";
    // Liikeverbin jälkeen tarkoitus: suomen 3. infinitiivin illatiivi = saamen infinitiivi (lähden juoksemaan = manan viehkat)
    if (cell === "InfMa+Ill") return "Inf";
    // leikkimässä = stoahkamin (progressiivi), myymästä = vuovdimis, aavistamatta = ávaškeahttá (sanakirjan esimerkeistä)
    if (cell === "InfMa+Ine") return "Actio+Ess";
    if (cell === "InfMa+Ela") return "Actio+Loc";
    if (cell === "InfMa+Abe") return "VAbess";
    // olla + partisiippi on perfekti (olen tehnyt = lean dahkan, on tehty = lea dahkkojuvvon); muuten partisiipin
    // käännös vaihtelee (johdokset, progressiivi), joten se näkyy arvauksena
    const afterOlla = prev?.pick?.base === "olla" || prev?.neg;
    if (cell === "PrfPrc") return afterOlla ? "PrfPrc" : { tag: "PrfPrc", guess: true };
    if (cell === "PrsPrc") return { tag: "PrsPrc", guess: true };
    // Passiivi: saamen -juvvo-passiivi (maksetaan = máksojuvvo); intransitiiviverbillä monikon 3. persoona (lauseSamiForm)
    if (cell === "Pss+Prs") return { tag: "Ind+Prs+Sg3", passive: true };
    if (cell === "Pss+Prt") return { tag: "Ind+Prt+Sg3", passive: true };
    if (cell === "PssPrfPrc") return { tag: "PrfPrc", passive: true, guess: !afterOlla };
    return samiCaseOfFinCell(cell, "V");
  }
  if (t.pick.pos === "Pron" && LAUSE_PRONOUN[t.pick.base]) return samiCaseOfFinCell(cell, "PRON");
  // Luvun 2-6 jälkeen yksikön genetiivi (kaksi kahvia = guokte gáfe), samoin mittasanan jälkeen (palaa kakkua = bihtá gáhku)
  if (fcase === "Par" && (lauseIsCount(prev) || prev?.pick?.cell === "Sg+Par")) return "Sg+Gen";
  // Lauseen objekti: suomen genetiivi tai partitiivi -> saamen akkusatiivi (yhden kahvin = ovtta gáfe)
  if (existential && fcase === "Par") return `${num || "Sg"}+Nom`;
  // Postposition edellä genetiivi (auton alla = biilla vuolde), ei objektin akkusatiivi
  const next = tokens.slice(i + 1).find((x) => !x.punct);
  if (next?.withPost && fcase === "Gen") return `${num || "Sg"}+Com`;
  if (next?.post && fcase === "Gen") return `${num || "Sg"}+Gen`;
  if (hasVerb && (fcase === "Gen" || fcase === "Par")) return `${num || "Sg"}+Acc`;
  if (fcase === "Nom") return `${num || "Sg"}+Nom`;
  // Muut substantiivit (ei ihminen eikä nimi): saamessa vähemmän sijoja kuin suomessa, joten -ssa/-sta/-lla/-lta =
  // lokatiivi ja -Vn/-lle = illatiivi (talolla = viesus, kassalla ja kassassa = kássas). Poikkeukset (muoto):
  //   means: -lla = keino, komitatiivi (autolla = biillain, kynällä = peannain); kulkuneuvo ja väline (dictionary.sem com)
  //   top:   pöydän päällä, genetiivi + alde/ala (pöydällä = beavddi alde, pöydälle = beavddi ala); sem surf
  // Vene tai laiva olla-lauseessa voi olla myös paikka (olemme veneellä), joten se näkyy arvauksena. Käyttäjä voi
  // vaihtaa muodon sanan valikosta (tok.muoto, lauseOpenChip).
  if (pos === "N" && t.choice.subtype !== "Prop" && !t.choice.human && /^(All|Ade|Abl)$/.test(fcase)) {
    const n = num || "Sg";
    // Omistus: -lla-sana ennen 3. persoonan olla-verbiä (helikopterilla oli vaikeuksia = helikopteris ledje) on paikka
    const ollaAfter = tokens.slice(i + 1).find((x) => x.pick?.base === "olla" && /(Sg3|Pl3)$/.test(x.pick.cell || ""));
    const owner = fcase === "Ade" && !!ollaAfter;
    const muoto = t.muoto || (owner ? "place" : lauseDefaultMuoto(t.choice, fcase, existential));
    const guess = !t.muoto && fcase === "Ade" && existential && t.choice.sem === "com" && LAUSE_BOAT.test(t.choice.sme_lemma);
    if (muoto === "top") return { tag: `${n}+Gen`, post: fcase === "All" ? "ala" : "alde" };
    if (muoto === "means" && fcase === "Ade") return { tag: `${n}+Com`, guess };
    return guess ? { tag: `${n}+Loc`, guess } : `${n}+${fcase === "All" ? "Ill" : "Loc"}`;
  }
  // Paikannimi kuten ihmissana: Rovaniemellä = Roavvenjárggas, Rovaniemelle = Roavvenjárgii (sijat ovat nimellä aina samat)
  return samiTagOfFinCell(cell, pos, t.pick.base, !!t.choice.human || t.choice.subtype === "Prop");
}

function lauseSamiForm(tokens, i) {
  const t = tokens[i];
  const clitic = t.clitic ? Object.fromEntries(LAUSE_CLITICS)[t.clitic] : "";
  if (t.neg) return { form: LAUSE_NEG[t.neg] + clitic, base: "ii", note: LAUSE_NEG_PERSON[t.neg], exact: true };
  if (t.name || t.num) return { form: t.raw, base: t.raw, exact: !t.guess };
  if (t.withPost) return { form: "", base: "", tag: "Com", exact: true };
  if (t.post) return { form: t.post, base: t.post, tag: "Po", exact: true };
  if (!t.choice) return null;
  let tag = lauseSamiTag(tokens, i), post = "", guess = false, passive = false;
  if (tag && typeof tag === "object") ({ tag, post = "", guess = false, passive = false } = tag);
  let form = t.choice.sme_lemma, exact = !t.pick.cell;
  if (passive) {
    let pf = null;
    try { pf = all("SELECT surface FROM sme_passive WHERE word_id = ? AND tag = ?", [t.choice.id, tag])[0]?.surface; } catch (e) { /* vanha aineisto */ }
    if (pf) { form = pf; exact = !guess; tag = "Pass+" + tag; }
    else {
      // Ei passiivia (mannat): monikon 3. persoona (käsitellään = gieđahallet), arvauksena
      guess = true;
      tag = tag.replace("Sg3", "Pl3");
    }
  }
  if (tag && !tag.startsWith("Pass+")) {
    let forms = loadWord(t.choice.id).paradigm.get(tag);
    // Konditionaalin rinnakkaismuodoista -š- (sáhtášin, boađášin, oččošin) eikä -l- (sáhtálin), jotta valinta on aina sama
    if (forms?.length > 1 && tag.startsWith("Cond")) forms = [...forms].sort((a, b) => b.includes("š") - a.includes("š"));
    // Rinnakkaismuodoista sanakirjan esimerkkilauseissa yleisin (lei eikä leai), sitten perusmuodon kanssa sama (mun eikä mon)
    if (forms?.length > 1) {
      let seen = {};
      try {
        seen = Object.fromEntries(all(`SELECT form, n FROM sme_seen WHERE form IN (${forms.map(() => "?").join(",")})`,
          forms.map((f) => f.toLowerCase())).map((r) => [r.form, r.n]));
      } catch (e) { /* vanha aineisto */ }
      forms = [...forms].sort((a, b) => (seen[b.toLowerCase()] || 0) - (seen[a.toLowerCase()] || 0));
    }
    // Rinnakkaismuodoista perusmuodon kanssa sama ensin (mun eikä mon)
    if (forms?.length > 1 && forms.includes(t.choice.sme_lemma)) forms = [t.choice.sme_lemma, ...forms.filter((f) => f !== t.choice.sme_lemma)];
    if (forms?.length) { form = forms[0]; exact = true; }
  }
  form += clitic;
  // Omistusliite: pronomini eteen (talossani = mu viesus)
  // 3. persoona muualla kuin subjektina on refleksiivinen (hän rakastaa lapsiaan = son ráhkista iežas mánáid);
  // monikon subjektilla iežaset (he menivät koteihinsa)
  // Edellä jo genetiivi (hänen talonsa = su viessu, äidin kotiin): ei toista pronominia
  const before = tokens.slice(0, i).reverse().find((x) => !x.punct);
  if (t.px && !(before?.pick && /(^|\+)Gen$/.test(before.pick.cell || ""))) {
    let pron = LAUSE_PX_PRONOUN[t.px];
    if (t.px === "3" && !/(^|\+)Nom$/.test(t.pick.cell || "")) {
      pron = tokens.some((x) => x.pick?.pos === "V" && /Pl3$/.test(x.pick.cell || "") || x.pick?.base === "he") ? "iežaset" : "iežas";
    }
    form = pron + " " + form;
  }
  // Taso: genetiivi + postpositio (pöydälle = beavddi ala); arvaus näkyy harmaana (likimääräinen)
  if (post) { form += " " + post; tag += " + " + post; }
  return { form, base: t.choice.sme_lemma, tag, exact: exact && !guess };
}

function lauseSentence(tokens) {
  const parts = [];
  tokens.forEach((t, i) => {
    if (t.punct) { parts.push({ punct: t.punct }); return; }
    const s = lauseSamiForm(tokens, i);
    if (s && s.form === "") return;  // kanssa sisältyy edeltävän sanan komitatiiviin
    parts.push({ text: s ? s.form : `[${t.raw}]` });
  });
  let out = "";
  for (const p of parts) out += p.punct ? p.punct : (out && !/[\s(]$/.test(out) ? " " : "") + p.text;
  // Iso alkukirjain myös pisteen, huutomerkin ja kysymysmerkin jälkeen (useampi lause samassa kentässä)
  // (ei järjestysluvun pisteen jälkeen: 79. jagis, mánu 12. beaivi)
  return out.replace(/(^|(?<!\d)[.!?]\s+)(\p{Ll})/gu, (m, a, c) => a + c.toUpperCase());
}

// --- Näkymä ---

// Avaus haun vierestä: haun teksti mukaan, jos siinä on useampi sana (saisinko yhden kahvin); muuten edellinen lause
// Kirjoitettu lause ja sanojen valinnat (tulkinta, saamen sana, korjattu sana, ohitus) muistetaan: näkymästä
// vahingossa poistuminen (takaisin-ele, Sulje, sanakortti) tai sovelluksen sulkeminen ei hävitä niitä.
function lauseSave() {
  const text = $("lause-input").value;
  const picks = {};
  lause.tokens.forEach((tok, i) => {
    const p = {};
    if (tok.fixed) p.w = tok.raw;
    if (tok.analyses?.length > 1 && tok.pick !== tok.analyses[0]) p.r = tok.analyses.indexOf(tok.pick);
    if (tok.choice && tok.candidates?.[0] && tok.choice !== tok.candidates[0]) p.c = tok.choice.id;
    if (tok.skip) p.s = 1;
    if (tok.muoto) p.m = tok.muoto;
    if (Object.keys(p).length) picks[i] = p;
  });
  lause.parsedText = text;
  try {
    localStorage.setItem("satni-lause", text);
    localStorage.setItem("satni-lause-picks", JSON.stringify({ text, picks }));
  } catch (e) { /* yksityinen tila */ }
}

function lauseParseRestoring(text) {
  const tokens = lauseParse(text);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("satni-lause-picks") || "null"); } catch (e) { /* ei tallennettua */ }
  if (saved && saved.text === text) {
    for (const [i, p] of Object.entries(saved.picks || {})) {
      const tok = tokens[Number(i)];
      if (!tok) continue;
      if (p.w) Object.assign(tok, lauseParse(p.w)[0], { raw: p.w, fixed: true });
      if (p.r != null && tok.analyses?.[p.r]) {
        tok.pick = tok.analyses[p.r];
        tok.candidates = lauseCandidates(tok.pick.base, tok.pick.pos);
        tok.choice = tok.candidates[0] || null;
      }
      if (p.c != null) tok.choice = tok.candidates?.find((c) => c.id === p.c) || tok.choice;
      if (p.s) { tok.skip = true; tok.known = true; }
      if (p.m) tok.muoto = p.m;
    }
  }
  lause.parsedText = text;
  return tokens;
}

function openLause() {
  const typed = $("search").value.trim(), input = $("lause-input");
  // Haussa kirjoitettu lause tulee mukaan vain kerran: palatessa oma muokattu lause säilyy
  if (typed.includes(" ") && typed !== lause.carried) { input.value = typed; lause.carried = typed; }
  else if (!input.value) {
    try { input.value = localStorage.getItem("satni-lause") || ""; } catch (e) { /* yksityinen tila */ }
  }
  $("lause-view").hidden = false;
  overlayOpened();  // verkkoversion Takaisin sulkee lauseen (app.js)
  if (input.value !== lause.parsedText || !lause.tokens.length) lause.tokens = lauseParseRestoring(input.value);
  renderLause();
  // Valmiin lauseen kohdalla ei avata näppäimistöä sanojen päälle
  if (!input.value.trim()) input.focus();
}

// Takaisin-ele ja Esc: ensin pieni sanakortti, sitten sanan valikko, sitten näkymä (MainActivity.goBackOrFinish kutsuu closeOcr:ia)
function closeLause() {
  if ($("lause-view").hidden) return false;
  if (!$("lause-card").hidden) $("lause-card").hidden = true;
  else if (!$("lause-pop").hidden) lauseClosePop();
  else { $("lause-view").hidden = true; overlayClosed(); }
  return true;
}

function renderLause() {
  const tokens = lause.tokens;
  $("lause-chips").innerHTML = tokens.map((tok, i) => {
    if (tok.punct) return "";
    const s = lauseSamiForm(tokens, i);
    const cls = !tok.known ? "unk" : s && !s.exact ? "approx" : "";
    return `<button class="lause-chip ${cls}" data-i="${i}"><span class="lc-fin">${esc(tok.raw)}</span>` +
      (s ? `<span class="lc-sme">${esc(s.form || "–")}</span><span class="lc-base">${esc(s.base)}</span>`
         : `<span class="lc-sme">?</span><span class="lc-base">${esc(t("lauseUnknown"))}</span>`) + "</button>";
  }).join("");
  $("lause-clear").hidden = !$("lause-input").value;
  lauseGrow();
  const ready = tokens.length && tokens.every((tok) => tok.punct || tok.neg || tok.name || tok.num || tok.post || tok.choice || tok.skip);
  $("lause-result").hidden = !ready;
  if (ready) $("lause-sme").textContent = lauseSentence(tokens.filter((tok) => !tok.skip));
  $("lause-pop").hidden = true;
}

function lauseOpenChip(i) {
  const tok = lause.tokens[i], pop = $("lause-pop");
  let html = "";
  if (tok.known && tok.candidates?.length) {
    const cell = tok.pick.cell ? ` · ${lauseCellLabel(tok.pick.cell)}` : "";
    // Monitulkintainen muoto (tulen = tulla, 1. p. / tuli, genetiivi): tulkinnan voi vaihtaa
    const readings = (tok.analyses || []).length > 1
      ? `<p class="lp-sub">${esc(t("lauseReading"))}</p>` + tok.analyses.map((a, k) =>
          `<label><input type="radio" name="lp-reading" value="${k}"${a === tok.pick ? " checked" : ""}> ${esc(a.base)} · ${esc(lauseCellLabel(a.cell))}</label>`).join("") : "";
    const muoto = lauseMuotoHtml(i);
    html = lauseHead(`${esc(tok.raw)} = ${esc(tok.pick.base)}${esc(cell)}${tok.clitic ? " + -" + esc(tok.clitic) : ""}`) + muoto + readings +
      (muoto || readings ? `<p class="lp-sub">${esc(t("lauseSamiWord"))}</p>` : "") +
      tok.candidates.map((c, k) => `<div class="lp-row"><label><input type="radio" name="lp" value="${k}"${c === tok.choice ? " checked" : ""}>` +
        `<span><b>${esc(c.sme_lemma)}</b> <span class="muted small">${esc(c.pos)}</span>` +
        `<span class="lp-gloss">${esc(lauseGloss(c.id))}</span></span></label>` +
        `<button type="button" class="lp-info" data-k="${k}" aria-label="${esc(t("lauseCheckWord"))}" title="${esc(t("lauseCheckWord"))}">i</button></div>`).join("");
  } else {
    const sug = lauseSuggestions(tok.word);
    html = lauseHead(`${esc(tok.raw)}: ${esc(t("lauseDidYouMean"))}`) +
      sug.map((w) => `<label><input type="radio" name="lp" data-word="${esc(w)}"> ${esc(w)}</label>`).join("") +
      `<label><input type="radio" name="lp" data-skip="1"> ${esc(t("lauseSkip"))}</label>` +
      `<button type="button" class="chip-btn lp-search" data-q="${esc(tok.raw)}">${esc(t("lauseSearchWord", tok.raw))}</button>`;
  }
  pop.innerHTML = html;
  pop.dataset.i = i;
  pop.hidden = false;
  for (const b of document.querySelectorAll(".lause-chip")) b.classList.toggle("open", Number(b.dataset.i) === i);
}

// Suomen taivutusmuodon nimi tulkintalistaan (Sg+Par = yks. partitiivi, Prs+ConNeg = preesens, kieltomuoto)
const LAUSE_LABELS = {
  fi: { Sg: "yks.", Pl: "mon.", Nom: "nominatiivi", Gen: "genetiivi", Acc: "akkusatiivi", Par: "partitiivi", Ine: "inessiivi",
        Ela: "elatiivi", Ill: "illatiivi", Ade: "adessiivi", Abl: "ablatiivi", All: "allatiivi", Ess: "essiivi", Tra: "translatiivi",
        Prs: "preesens", Prt: "imperfekti", Cond: "konditionaali", Pot: "potentiaali", Imprt: "imperatiivi", ConNeg: "kieltomuoto",
        Inf: "perusmuoto", PrfPrc: "perfektin partisiippi", PrsPrc: "preesensin partisiippi", PssPrfPrc: "passiivin partisiippi",
        Pss: "passiivi", InfMa: "3. infinitiivi", Comp: "komparatiivi", Superl: "superlatiivi", person: (n, p) => `${p}. persoona ${n}` },
  nb: { Sg: "ent.", Pl: "fl.", Nom: "nominativ", Gen: "genitiv", Acc: "akkusativ", Par: "partitiv", Ine: "inessiv", Ela: "elativ",
        Ill: "illativ", Ade: "adessiv", Abl: "ablativ", All: "allativ", Ess: "essiv", Tra: "translativ", Prs: "presens",
        Prt: "preteritum", Cond: "kondisjonalis", Pot: "potensialis", Imprt: "imperativ", ConNeg: "nektende form", Inf: "infinitiv",
        PrfPrc: "perfektum partisipp", PrsPrc: "presens partisipp", PssPrfPrc: "passiv partisipp", Pss: "passiv",
        InfMa: "3. infinitiv", Comp: "komparativ", Superl: "superlativ", person: (n, p) => `${p}. person ${n}` },
};
function lauseCellLabel(cell) {
  if (!cell) return "";
  const L = LAUSE_LABELS[settings.uiLang] || LAUSE_LABELS.fi;
  return cell.split("+").map((part) => {
    const m = part.match(/^(Sg|Pl)([123])$/);
    return m ? L.person(L[m[1]], m[2]) : L[part] || part;
  }).join(", ").replace(/^(yks\.|mon\.|ent\.|fl\.), /, "$1 ");
}

// Tekstikenttä kasvaa tekstin mukana (pitkä lause ei katkea), enintään 40 % näytön korkeudesta
function lauseGrow() {
  const el = $("lause-input");
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight + 2, window.innerHeight * 0.4) + "px";
}

// Muoto-lista substantiiville, jonka -lla/-lta/-lle voi tarkoittaa saamessa eri asioita: paikka (kassalla = kássas),
// keino (autolla = biillain) tai päällä (pöydällä = beavddi alde). Jokaisen vaihtoehdon kohdalla näkyy valmis saamen muoto.
function lauseMuotoHtml(i) {
  const tok = lause.tokens[i];
  const m = (tok.pick?.cell || "").match(/^(Sg|Pl)\+(Ade|Abl|All)$/);
  if (!m || tok.pick.pos !== "N" || !tok.choice || tok.choice.subtype === "Prop" || tok.choice.human) return "";
  const owner = m[2] === "Ade" && lause.tokens.slice(i + 1).some((x) => x.pick?.base === "olla" && /(Sg3|Pl3)$/.test(x.pick.cell || ""));
  const current = tok.muoto || (owner ? "place" : lauseDefaultMuoto(tok.choice, m[2], lause.tokens.some((x) => x.pick?.base === "olla")));
  const saved = tok.muoto;
  const rows = LAUSE_MUOTOT[m[2]].map((opt) => {
    tok.muoto = opt;
    const form = lauseSamiForm(lause.tokens, i)?.form || "";
    return `<label><input type="radio" name="lp-muoto" value="${opt}"${opt === current ? " checked" : ""}>` +
      `<span><b>${esc(form)}</b> <span class="muted small">${esc(t("lauseForm_" + opt + "_" + m[2]))}</span></span></label>`;
  });
  tok.muoto = saved;
  return `<p class="lp-sub">${esc(t("lauseForm"))}</p>` + rows.join("");
}

// Valikon otsikkorivi ja sulkemisrasti
function lauseHead(html) {
  return `<div class="lp-top"><p class="lp-head">${html}</p><button type="button" class="lp-close" aria-label="${esc(t("close"))}" title="${esc(t("close"))}">×</button></div>`;
}

// Sanan valikko kiinni: sama sana uudelleen, rasti, tekstikenttä tai tyhjä kohta näkymässä
function lauseClosePop() {
  $("lause-pop").hidden = true;
  for (const b of document.querySelectorAll(".lause-chip.open")) b.classList.remove("open");
}

// Saamen sanan lyhyt käännös valikkoon (käyttöliittymän kieli, varalla suomi): galles  mihin kellonaikaan, monelta
function lauseGloss(id) {
  const rows = all(`SELECT lang, translations FROM meanings WHERE word_id = ? AND lang IN (?, 'fin') ORDER BY rowid`, [id, settings.lang]);
  const pick = rows.filter((r) => r.lang === settings.lang);
  const list = (pick.length ? pick : rows).flatMap((r) => splitList(r.translations));
  return [...new Set(list)].slice(0, 3).join(", ");
}

// Pieni sanakortti vaihtoehdon tarkistamiseen lausekääntäjästä poistumatta: merkitykset (enintään 4, kustakin
// yksi esimerkki), muoto tässä lauseessa, kaiutin; "Valitse" vaihtaa sanan, "Koko sanakortti" avaa sanakirjan
// (takaisin-ele palaa lauseeseen).
function lauseShowCard(i, k) {
  const tok = lause.tokens[i], c = tok.candidates[k], card = $("lause-card");
  const { word, meanings } = loadWord(c.id);
  const groups = meaningsByLanguage(meanings).slice(0, 2);
  const chosen = c === tok.choice;
  const s = chosen ? lauseSamiForm(lause.tokens, i) : null;
  const body = groups.map(([lang, ms]) => `<p class="lp-sub">${esc(capitalize(langName(lang) || lang))}</p>` +
    ms.slice(0, 4).map((m) => meaningHtml({ ...m, examples: m.examples.slice(0, 1) }, ms.length > 1)).join("") +
    (ms.length > 4 ? `<p class="muted small">+ ${ms.length - 4}</p>` : "")).join("");
  card.innerHTML = `<div class="lcard-box" role="dialog" aria-label="${esc(word.sme_lemma)}">` +
    `<div class="lcard-head"><span class="lcard-lemma">${esc(word.sme_lemma)}</span>` +
    `<span class="muted small">${esc(wordClassLabel(word.pos, word.subtype))}</span>` +
    `<button type="button" class="speak-btn lcard-speak" aria-label="${esc(t("listen"))}">${SPEAK_ICON}</button></div>` +
    (s && s.form !== word.sme_lemma ? `<p class="small lcard-form">${esc(t("lauseInSentence"))}: <b>${esc(s.form)}</b>` +
      (s.tag ? ` <span class="muted">(${esc(s.tag)})</span>` : "") + `</p>` : "") +
    `<div class="lcard-body">${body || `<p class="muted">${esc(t("lauseUnknown"))}</p>`}</div>` +
    `<div class="lcard-actions">${chosen ? "" : `<button type="button" class="chip-btn lcard-pick">${esc(t("lauseChoose"))}</button>`}` +
    `<button type="button" class="chip-btn lcard-open">${esc(t("lauseFullCard"))}</button>` +
    `<button type="button" class="chip-btn lcard-close">${esc(t("close"))}</button></div></div>`;
  card.hidden = false;
  card.querySelector(".lcard-speak").onclick = (e) => speak(word.sme_lemma, e.currentTarget);
  card.querySelector(".lcard-close").onclick = () => { card.hidden = true; };
  card.onclick = (e) => { if (e.target === card) card.hidden = true; };
  const pick = card.querySelector(".lcard-pick");
  if (pick) pick.onclick = () => { tok.choice = c; card.hidden = true; renderLause(); lauseSave(); lauseOpenChip(i); };
  card.querySelector(".lcard-open").onclick = () => {
    card.hidden = true;
    $("lause-view").hidden = true;
    const index = queryDatabase(word.sme_lemma).findIndex((r) => r.id === c.id);
    search(word.sme_lemma, Math.max(index, 0));
    lauseReturnHash = location.hash;
  };
}

let lauseReturnHash = null;  // lauseesta avatun sanakortin osoite: takaisin-ele palaa siitä lauseeseen

function bindLause() {
  if (!$("lause-view")) return;
  $("lause-btn").onclick = openLause;
  $("lause-close").onclick = () => { $("lause-view").hidden = true; overlayClosed(); };
  overlayLayerFns.push(() => ($("lause-view").hidden ? 0 : (!$("lause-pop").hidden) + (!$("lause-card").hidden)));  // sanan valikko ja kortti (app.js)
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => closeLause() || (closeOcrBase ? closeOcrBase() : false);
  const backToOcrBase = window.backToOcr;
  // Paluu lauseeseen vain, jos lausekääntäjä on yhä käytössä: kortilla ollessa käyttöliittymä on voitu vaihtaa
  // norjaksi (lause vain suomeksi) tai kokeilu kytkeä pois (applyExperimental piilottaa painikkeen)
  const lauseAvailable = () => !$("lause-btn").hidden;
  window.backToOcr = () => {
    if (lauseReturnHash && !lauseAvailable()) lauseReturnHash = null;
    if (lauseReturnHash && location.hash === lauseReturnHash) {
      lauseReturnHash = null;
      $("lause-view").hidden = false;
      renderLause();
      return true;
    }
    return backToOcrBase ? backToOcrBase() : false;
  };
  // Selaimen takaisin-painike (verkkosovellus): sanakortista takaisin lauseeseen
  window.addEventListener("popstate", () => {
    if (lauseReturnHash && location.hash !== lauseReturnHash) {
      const back = lauseAvailable();
      lauseReturnHash = null;
      if (!back) return;
      $("lause-view").hidden = false;
      renderLause();
    }
  });
  $("lause-pop").addEventListener("click", (e) => {
    const b = e.target.closest(".lp-info");
    if (b) lauseShowCard(Number($("lause-pop").dataset.i), Number(b.dataset.k));
    // Tuntematon sana: haku sanakirjasta (esim. saamenkielinen sana tai kirjoitusvirhe); takaisin-ele palaa lauseeseen
    const q = e.target.closest(".lp-search");
    if (q) {
      lauseClosePop();
      $("lause-view").hidden = true;
      $("search").value = q.dataset.q;
      search(q.dataset.q);
      lauseReturnHash = location.hash;
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]") && closeLause()) e.preventDefault();
  });
  $("lause-speak").onclick = () => speak($("lause-sme").textContent, $("lause-speak"));
  let timer = null;
  const reparse = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // Tekstikentän change-tapahtuma (kentästä poistuttaessa) ilman muutosta ei saa lukea lausetta uudelleen:
      // muuten sanan napautus heti kirjoittamisen jälkeen avaa valikon, jonka uudelleenpiirto heti sulkee
      if ($("lause-input").value === lause.parsedText) return;
      lause.tokens = lauseParseRestoring($("lause-input").value);
      renderLause();
      lauseSave();
    }, 300);
  };
  // Puhelimen näppäimistö: viimeinen sana voi olla vielä kesken (alleviivattu), joten luetaan myös sanan valmistuttua
  $("lause-input").oninput = () => { $("lause-clear").hidden = !$("lause-input").value; lauseGrow(); reparse(); };
  // × tyhjentää lauseen, sanojen valinnat ja tallennetun lauseen; kenttä saa kohdistuksen (näppäimistö auki)
  $("lause-clear").onclick = () => {
    clearTimeout(timer);
    $("lause-input").value = "";
    lause.tokens = [];
    renderLause();
    lauseSave();
    $("lause-input").focus();
  };
  $("lause-input").addEventListener("compositionend", reparse);
  $("lause-input").addEventListener("change", reparse);
  $("lause-chips").onclick = (e) => {
    const b = e.target.closest(".lause-chip");
    if (!b) return;
    const i = Number(b.dataset.i);
    if (lause.tokens[i]?.num || lause.tokens[i]?.post) return;  // numerolla ja postpositiolla ei ole vaihtoehtoja
    if (!$("lause-pop").hidden && Number($("lause-pop").dataset.i) === i) lauseClosePop();
    else lauseOpenChip(i);
  };
  $("lause-input").addEventListener("focus", lauseClosePop);
  $("lause-view").addEventListener("click", (e) => {
    if (e.target.closest(".lp-close")) { lauseClosePop(); return; }
    if (!e.target.closest(".lause-chip, .lause-pop, .lause-card")) lauseClosePop();
  });
  $("lause-pop").onchange = (e) => {
    const t = lause.tokens[Number($("lause-pop").dataset.i)], r = e.target;
    if (r.name === "lp-muoto") {
      t.muoto = r.value;
      renderLause();
      lauseSave();
      lauseOpenChip(Number($("lause-pop").dataset.i));
      return;
    }
    if (r.name === "lp-reading") {
      t.muoto = null;
      t.pick = t.analyses[Number(r.value)];
      t.candidates = lauseCandidates(t.pick.base, t.pick.pos);
      t.choice = t.candidates[0] || null;
      renderLause();
      lauseSave();
      lauseOpenChip(Number($("lause-pop").dataset.i));
      return;
    }
    if (r.dataset.skip) { t.skip = true; t.known = true; }
    else if (r.dataset.word) {
      const fresh = lauseParse(r.dataset.word)[0];
      Object.assign(t, fresh, { raw: r.dataset.word, fixed: true });
    } else t.choice = t.candidates[Number(r.value)];
    renderLause();
    lauseSave();
  };
}

// Sivun elementit ovat index.html:ssä valmiina; sidotaan heti, kun sivu on luettu (app.js:n main ei odota tätä tiedostoa)
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindLause); else bindLause();
