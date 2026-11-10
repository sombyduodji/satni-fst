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

let lause = { tokens: [] };

function lauseCandidates(base, pos, exactOnly = false) {
  // Saamen sanat, joiden suomennos on base; sama sanaluokka ensin, sitten yleisin (korpusfrekvenssi)
  // Käännöslista on haussa yhtenä tekstinä ("mihin kellonaikaan, monelta, moneltako"): sana voi olla missä kohtaa
  // listaa tahansa, kuten hakukentässä
  const f = fold(base);
  // at = 0: käännös on tämä sana tai alkaa sillä (pääkäännös), 1: sana on listassa myöhemmin (galgat "täytyä, saada")
  const rows = all(`SELECT DISTINCT d.id, d.sme_lemma, d.pos, d.subtype, d.freq, MIN(COALESCE(t.nr, 9)) AS nr,
    MIN(CASE WHEN t.fold = ? OR t.fold LIKE ? THEN 0 ELSE 1 END) AS at FROM trans_search t
    JOIN dictionary d ON d.id = t.word_id WHERE t.lang = 'fin'
    AND (t.fold = ? OR t.fold LIKE ? OR t.fold LIKE ? OR t.fold LIKE ?) GROUP BY d.id`,
    [f, `${f}, %`, f, `${f}, %`, `%, ${f}`, `%, ${f}, %`]).filter((r) => !exactOnly || r.at === 0);
  const want = LAUSE_POS[pos] || null;
  return rows
    .filter((r) => !r.sme_lemma.includes(" ") || rows.length === 1)
    .sort((a, b) => ((want && !want.includes(a.pos)) - (want && !want.includes(b.pos))) || (a.at - b.at)
      || ((b.freq || 0) - (a.freq || 0)) || (a.nr - b.nr))
    .slice(0, 6);
}

// Suomen sanan tulkinnat: [{ base, cell, pos }] (saisinko -> saada Cond+Sg1 + -ko)
function lauseAnalyses(word, raw = word) {
  let clitic = null, stem = word;
  let out = translationFormsOf(word, "fin");
  // Erisnimet ovat taulukoissa isolla alkukirjaimella (Inariin = Inari, Sg+Ill)
  if (!out.length && raw !== word) {
    out = translationFormsOf(raw, "fin");
    if (out.length) stem = raw;
  }
  if (!out.length) {
    for (const [c] of LAUSE_CLITICS) {
      if (word.endsWith(c) && word.length >= c.length + 2) {  // myös lyhyt vartalo: onko = on + -ko
        const st = word.slice(0, -c.length);
        // Persoonapronominin perusmuoto ei ole taivutustaulukoissa (minäkin = minä + -kin = munnai)
        const a = LAUSE_PRONOUN[st] ? [{ base: st, cell: "Nom", pos: "Pron" }] : translationFormsOf(st, "fin");
        if (a.length) { out = a; clitic = c; stem = st; break; }
      }
    }
  }
  return { analyses: out, clitic, stem };
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
  for (const m of text.matchAll(/[\p{L}-]+|[^\s\p{L}]+/gu)) {
    const raw = m[0];
    if (!/\p{L}/u.test(raw)) { tokens.push({ punct: raw }); continue; }
    const word = raw.toLowerCase();
    if (LAUSE_NEG[word]) { tokens.push({ raw, word, neg: word, known: true }); continue; }
    // Kieltoverbi kysymyksenä: eikö = iigo, etkö = itgo
    const negq = [...LAUSE_CLITICS].find(([c]) => (c === "ko" || c === "kö") && word.endsWith(c) && LAUSE_NEG[word.slice(0, -c.length)]);
    if (negq) { tokens.push({ raw, word, neg: word.slice(0, -negq[0].length), clitic: negq[0], known: true }); continue; }
    const { analyses, clitic, stem } = lauseAnalyses(word, raw);
    // Tulkintojen järjestys: sana itse perusmuotona (maksaa = maksaa, ei maksa-sanan partitiivi), yksikkö ennen monikkoa
    analyses.sort((a, b) => ((b.base === stem) - (a.base === stem)) || (a.cell.startsWith("Pl") - b.cell.startsWith("Pl")));
    let pick = analyses[0] || null;
    // Sanalla oma sanakirjan vastine, eikä se ole minkään sanan perusmuoto (missä = gos, kotiin = ruoktot): se ensin
    // Vain sanan oma pääkäännös, eikä nimi pienellä kirjoitetulle sanalle (anna = antaa, ei nimi Anne)
    const direct = !clitic && lauseCandidates(word, null, true)
      .some((c) => c.subtype !== "Prop" || /^\p{Lu}/u.test(raw));
    if (direct && !(pick && pick.base === stem)) pick = { base: word, cell: null, pos: null };
    // Ei taivutusta eikä pääkäännöstä: myös käännöslistan myöhempi sana kelpaa (monelta = galles "mihin kellonaikaan, monelta")
    if (!pick && !clitic && lauseCandidates(word, null).some((c) => c.subtype !== "Prop" || /^\p{Lu}/u.test(raw))) {
      pick = { base: word, cell: null, pos: null };
    }
    // Iso alkukirjain lauseen keskellä ja tuntematon sana: nimi, joka säilyy sellaisenaan (Juha)
    if (!pick && tokens.some((x) => !x.punct) && /^\p{Lu}/u.test(raw)) {
      tokens.push({ raw, word, name: true, known: true }); continue;
    }
    tokens.push({ raw, word, stem, clitic, analyses, pick, known: !!pick });
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
    if (par && prev?.pick && (prev.pick.pos === "Num" || LAUSE_SMALL_NUMBERS.includes(prev.pick.base))) {
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
  tokens.forEach((t) => {
    if (!t.analyses?.length || t.pick?.pos === "V" || tokens.some((x) => x !== t && (x.pick?.pos === "V" || x.neg))) return;
    const verb = t.analyses.find((a) => a.pos === "V" && /^(Prs|Prt|Cond|Pot)\+(Sg|Pl)/.test(a.cell));
    if (verb) t.pick = verb;
  });
  // Verbi mieluummin indikatiivina kuin imperatiivina (saa = Prs+Sg3)
  for (const t of tokens) {
    if (t.pick?.cell?.startsWith("Imprt") && t.analyses.some((a) => a.cell.startsWith("Prs+") && a.cell !== "Prs+ConNeg")) {
      t.pick = t.analyses.find((a) => a.cell.startsWith("Prs+") && a.cell !== "Prs+ConNeg");
    }
  }
  for (const t of tokens) {
    if (!t.pick) continue;
    const pron = LAUSE_PRONOUN[t.pick.base];
    t.candidates = pron ? all("SELECT id, sme_lemma, pos, freq FROM dictionary WHERE sme_lemma = ? AND subtype = 'Pers'", [pron])
      : lauseCandidates(t.pick.base, t.pick.pos);
    t.choice = t.candidates[0] || null;
  }
  return tokens;
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
    return samiCaseOfFinCell(cell, "V");
  }
  if (t.pick.pos === "Pron" && LAUSE_PRONOUN[t.pick.base]) return samiCaseOfFinCell(cell, "PRON");
  // Luvun 2-6 jälkeen yksikön genetiivi (kaksi kahvia = guokte gáfe), samoin mittasanan jälkeen (palaa kakkua = bihtá gáhku)
  if (fcase === "Par" && prev?.pick && (LAUSE_SMALL_NUMBERS.includes(prev.pick.base) || prev.pick.cell === "Sg+Par")) return "Sg+Gen";
  // Lauseen objekti: suomen genetiivi tai partitiivi -> saamen akkusatiivi (yhden kahvin = ovtta gáfe)
  if (existential && fcase === "Par") return `${num || "Sg"}+Nom`;
  if (hasVerb && (fcase === "Gen" || fcase === "Par")) return `${num || "Sg"}+Acc`;
  if (fcase === "Nom") return `${num || "Sg"}+Nom`;
  // Paikannimi kuten ihmissana: Rovaniemellä = Roavvenjárggas, Rovaniemelle = Roavvenjárgii (sijat ovat nimellä aina samat)
  return samiTagOfFinCell(cell, pos, t.pick.base, !!t.choice.human || t.choice.subtype === "Prop");
}

function lauseSamiForm(tokens, i) {
  const t = tokens[i];
  const clitic = t.clitic ? Object.fromEntries(LAUSE_CLITICS)[t.clitic] : "";
  if (t.neg) return { form: LAUSE_NEG[t.neg] + clitic, base: "ii", note: LAUSE_NEG_PERSON[t.neg] };
  if (t.name) return { form: t.raw, base: t.raw, exact: true };
  if (!t.choice) return null;
  const tag = lauseSamiTag(tokens, i);
  let form = t.choice.sme_lemma, exact = !t.pick.cell;
  if (tag) {
    let forms = loadWord(t.choice.id).paradigm.get(tag);
    // Konditionaalin rinnakkaismuodoista -š- (sáhtášin, boađášin, oččošin) eikä -l- (sáhtálin), jotta valinta on aina sama
    if (forms?.length > 1 && tag.startsWith("Cond")) forms = [...forms].sort((a, b) => b.includes("š") - a.includes("š"));
    // Rinnakkaismuodoista perusmuodon kanssa sama ensin (mun eikä mon)
    if (forms?.length > 1 && forms.includes(t.choice.sme_lemma)) forms = [t.choice.sme_lemma, ...forms.filter((f) => f !== t.choice.sme_lemma)];
    if (forms?.length) { form = forms[0]; exact = true; }
  }
  form += clitic;
  return { form, base: t.choice.sme_lemma, tag, exact };
}

function lauseSentence(tokens) {
  const parts = [];
  tokens.forEach((t, i) => {
    if (t.punct) { parts.push({ punct: t.punct }); return; }
    const s = lauseSamiForm(tokens, i);
    parts.push({ text: s ? s.form : `[${t.raw}]` });
  });
  let out = "";
  for (const p of parts) out += p.punct ? p.punct : (out && !/[\s(]$/.test(out) ? " " : "") + p.text;
  return out.charAt(0).toUpperCase() + out.slice(1);
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
  else $("lause-view").hidden = true;
  return true;
}

function renderLause() {
  const tokens = lause.tokens;
  $("lause-chips").innerHTML = tokens.map((tok, i) => {
    if (tok.punct) return "";
    const s = lauseSamiForm(tokens, i);
    const cls = !tok.known ? "unk" : s && !s.exact ? "approx" : "";
    return `<button class="lause-chip ${cls}" data-i="${i}"><span class="lc-fin">${esc(tok.raw)}</span>` +
      (s ? `<span class="lc-sme">${esc(s.form)}</span><span class="lc-base">${esc(s.base)}</span>`
         : `<span class="lc-sme">?</span><span class="lc-base">${esc(t("lauseUnknown"))}</span>`) + "</button>";
  }).join("");
  const ready = tokens.length && tokens.every((tok) => tok.punct || tok.neg || tok.name || tok.choice || tok.skip);
  $("lause-result").hidden = !ready;
  if (ready) $("lause-sme").textContent = lauseSentence(tokens.filter((tok) => !tok.skip));
  $("lause-pop").hidden = true;
}

function lauseOpenChip(i) {
  const tok = lause.tokens[i], pop = $("lause-pop");
  let html = "";
  if (tok.known && tok.candidates?.length) {
    const cell = tok.pick.cell ? ` · ${tok.pick.cell}` : "";
    // Monitulkintainen muoto (tulen = tulla, 1. p. / tuli, genetiivi): tulkinnan voi vaihtaa
    const readings = (tok.analyses || []).length > 1
      ? `<p class="lp-sub">${esc(t("lauseReading"))}</p>` + tok.analyses.map((a, k) =>
          `<label><input type="radio" name="lp-reading" value="${k}"${a === tok.pick ? " checked" : ""}> ${esc(a.base)} · ${esc(a.cell)}</label>`).join("") +
        `<p class="lp-sub">${esc(t("lauseSamiWord"))}</p>` : "";
    html = lauseHead(`${esc(tok.raw)} = ${esc(tok.pick.base)}${esc(cell)}${tok.clitic ? " + -" + esc(tok.clitic) : ""}`) + readings +
      tok.candidates.map((c, k) => `<div class="lp-row"><label><input type="radio" name="lp" value="${k}"${c === tok.choice ? " checked" : ""}>` +
        `<span><b>${esc(c.sme_lemma)}</b> <span class="muted small">${esc(c.pos)}</span>` +
        `<span class="lp-gloss">${esc(lauseGloss(c.id))}</span></span></label>` +
        `<button type="button" class="lp-info" data-k="${k}" aria-label="${esc(t("lauseCheckWord"))}" title="${esc(t("lauseCheckWord"))}">i</button></div>`).join("");
  } else {
    const sug = lauseSuggestions(tok.word);
    html = lauseHead(`${esc(tok.raw)}: ${esc(t("lauseDidYouMean"))}`) +
      sug.map((w) => `<label><input type="radio" name="lp" data-word="${esc(w)}"> ${esc(w)}</label>`).join("") +
      `<label><input type="radio" name="lp" data-skip="1"> ${esc(t("lauseSkip"))}</label>`;
  }
  pop.innerHTML = html;
  pop.dataset.i = i;
  pop.hidden = false;
  for (const b of document.querySelectorAll(".lause-chip")) b.classList.toggle("open", Number(b.dataset.i) === i);
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
  $("lause-close").onclick = () => { $("lause-view").hidden = true; };
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => closeLause() || (closeOcrBase ? closeOcrBase() : false);
  const backToOcrBase = window.backToOcr;
  window.backToOcr = () => {
    if (lauseReturnHash && location.hash === lauseReturnHash) {
      lauseReturnHash = null;
      $("lause-view").hidden = false;
      renderLause();
      return true;
    }
    return backToOcrBase ? backToOcrBase() : false;
  };
  $("lause-pop").addEventListener("click", (e) => {
    const b = e.target.closest(".lp-info");
    if (b) lauseShowCard(Number($("lause-pop").dataset.i), Number(b.dataset.k));
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLause(); });
  $("lause-speak").onclick = () => speak($("lause-sme").textContent, $("lause-speak"));
  let timer = null;
  const reparse = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      lause.tokens = lauseParseRestoring($("lause-input").value);
      renderLause();
      lauseSave();
    }, 300);
  };
  // Puhelimen näppäimistö: viimeinen sana voi olla vielä kesken (alleviivattu), joten luetaan myös sanan valmistuttua
  $("lause-input").oninput = reparse;
  $("lause-input").addEventListener("compositionend", reparse);
  $("lause-input").addEventListener("change", reparse);
  $("lause-chips").onclick = (e) => {
    const b = e.target.closest(".lause-chip");
    if (!b) return;
    const i = Number(b.dataset.i);
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
    if (r.name === "lp-reading") {
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
