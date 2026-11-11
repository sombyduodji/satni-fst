// Minipeli: neljän vaihtoehdon sanapeli (data/minipeli.json, minipeli.py). Väärä vastaus päättää pelin; paras tulos
// tallentuu tilakohtaisesti laitteelle. Kesken jäänyt peli jatkuu, kun näkymä avataan uudelleen ("Jatka vai uusi?").
// Yläpalkin painike (oletuksena näkyvissä) piilotetaan asetuksista.

let peli = null;        // { words, cats } ladattuna
let peliRun = null;     // käynnissä oleva peli: { mode, score, deck, pos, q }
let peliBusy = false;   // vastaus näkyy hetken ennen seuraavaa kysymystä
let peliLast = null;    // viimeisin kysymys { mode, q }: virheilmoitus myös pelin päätyttyä

const PELI_TEXTS = {
  fi: {
    title: "Minipeli", pick: "Valitse peli", best: "Paras", none: "–", score: (n) => `${n} oikein`,
    lead: "Valitse oikea käännös neljästä. Yksi väärä vastaus päättää pelin.",
    modes: { beginner: ["Aloittelija", "Yleisimmät sanat"], advanced: ["Edistynyt", "Kaikki 1 089 sanaa"],
      ordinals: ["Järjestysluvut", "1.–100."], time: ["Viikonpäivät, vuodenajat ja kuukaudet", "Biret sanoo oikean vastauksen"],
      colours: ["Värit", "9 väriä"], questions: ["Kysymyssanat", "Biret sanoo oikean vastauksen"], animals: ["Eläimet", "23 eläintä"] },
    groups: { words: "Sanat", cats: "Aiheet" },
    askSme: "Mitä tämä on suomeksi?", askUi: "Mikä on saameksi", over: "Peli päättyi", correctWas: "Oikea vastaus:",
    again: "Pelaa uudelleen", menu: "Valitse toinen peli", home: "Etusivulle", top: "Parhaat tulokset",
    newBest: "Uusi ennätys!", resumeQ: "Jatketaanko keskeneräistä peliä?", resume: "Jatka", fresh: "Uusi peli",
    report: "Ilmoita virheestä", streak: "Putki",
  },
  nb: {
    title: "Minispill", pick: "Velg spill", best: "Best", none: "–", score: (n) => `${n} riktige`,
    lead: "Velg riktig oversettelse av fire. Ett feil svar avslutter spillet.",
    modes: { beginner: ["Nybegynner", "De vanligste ordene"], advanced: ["Viderekommen", "Alle 1 089 ord"],
      ordinals: ["Ordenstall", "1.–100."], time: ["Ukedager, årstider og måneder", "Biret sier riktig svar"],
      colours: ["Farger", "9 farger"], questions: ["Spørreord", "Biret sier riktig svar"], animals: ["Dyr", "23 dyr"] },
    groups: { words: "Ord", cats: "Emner" },
    askSme: "Hva er dette på norsk?", askUi: "Hva heter det på samisk", over: "Spillet er over", correctWas: "Riktig svar:",
    again: "Spill igjen", menu: "Velg et annet spill", home: "Til forsiden", top: "Beste resultater",
    newBest: "Ny rekord!", resumeQ: "Vil du fortsette spillet du ikke ble ferdig med?", resume: "Fortsett", fresh: "Nytt spill",
    report: "Meld fra om feil", streak: "Rekke",
  },
};
const pt = () => PELI_TEXTS[sanastoLang()];
const PELI_MODES = [
  { id: "beginner", group: "words", color: "yellow" }, { id: "advanced", group: "words", color: "red" },
  { id: "ordinals", group: "cats", color: "blue" }, { id: "time", group: "cats", color: "blue" },
  { id: "colours", group: "cats", color: "green" }, { id: "questions", group: "cats", color: "yellow" },
  { id: "animals", group: "cats", color: "green" },
];
// Pelitilojen kuvakkeet (sanastojen kuvakkeiden tyyliin): taimi, vuori, luvut, kalenteri, paletti, tassu
const PELI_MODE_ICON = {
  beginner: '<path d="M12 21v-8"/><path d="M12 13c0-4 2.5-6.5 7-6.5 0 4.2-2.6 6.5-7 6.5z"/><path d="M12 15.5C12 12 9.8 10 6 10c0 3.5 2.2 5.5 6 5.5z"/>',
  advanced: '<path d="M3 19l6.5-11 4 6.5 2.5-4 5 8.5z"/><path d="M8 10.5l1.5 1.5 1.5-1.5"/>',
  ordinals: null, time: null, colours: null, questions: null,
  animals: '<circle cx="7.5" cy="9" r="1.8"/><circle cx="12" cy="6.5" r="1.8"/><circle cx="16.5" cy="9" r="1.8"/><path d="M12 11.5c-3 0-5.5 3.5-5.5 5.6 0 1.6 1.3 2.4 2.7 2.4 1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6c1.4 0 2.7-.8 2.7-2.4 0-2.1-2.5-5.6-5.5-5.6z"/>',
};
const PELI_MODE_SANASTO_ICON = { ordinals: "numbers", time: "month", colours: "palette", questions: "question" };
const peliModeIcon = (id) => PELI_MODE_ICON[id]
  ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PELI_MODE_ICON[id]}</svg>`
  : sanastoSvg(PELI_MODE_SANASTO_ICON[id]);
const PELI_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.6a2.3 2.3 0 0 1-4 .9L15 15.5H9l-1.6 1.9a2.3 2.3 0 0 1-4-.9l-.8-3.6A4 4 0 0 1 6.5 8z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="15.5" cy="11.2" r=".6" fill="currentColor"/><circle cx="17.3" cy="13" r=".6" fill="currentColor"/></svg>';

// --- Tallennus laitteelle (parhaat tulokset ja kesken jäänyt peli); yksityinen tila ei kaada peliä ---
const peliStore = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(key, value) { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ei tallennusta */ } },
};
const peliTop = (mode) => (peliStore.get("satni-peli-top", {})[mode] || []);
function peliAddTop(mode, score) {
  const all = peliStore.get("satni-peli-top", {});
  const list = (all[mode] || []).concat([{ score, date: new Date().toISOString().slice(0, 10) }])
    .sort((a, b) => b.score - a.score).slice(0, 3);
  all[mode] = list;
  peliStore.set("satni-peli-top", all);
  return list;
}

async function loadPeli() {
  if (!peli) peli = await (await fetch("data/minipeli.json")).json();
  return peli;
}

// Kysymyspakka: tilan sanat sekoitettuna; [saame, suomi, norja, ryhmä] (ryhmä: vaihtoehdot samasta ryhmästä)
function peliPool(mode) {
  if (mode === "beginner" || mode === "advanced") {
    return peli.words.filter((w) => mode === "advanced" || w[4] === 1).map((w) => [w[0], w[1], w[2], w[3] || "N"]);
  }
  // Aika-aiheessa 5. kenttä = järjestysnumero Biretin palauteäänelle (audio/peli/aika-<i>-ok|no.ogg)
  return (peli.cats[mode] || []).map((w, i) => [w[0], w[1], w[2], mode === "time" ? w[3] : mode, i]);
}
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function peliQuestion(run) {
  const pool = peliPool(run.mode);
  if (run.pos >= run.deck.length) { run.deck = shuffle(pool.map((_, i) => i)); run.pos = 0; }
  const item = pool[run.deck[run.pos++]];
  const ui = sanastoLang() === "nb" ? 2 : 1;
  const toSme = Math.random() < 0.5;  // puolet kysymyksistä käännöksestä saameksi
  const shown = (w) => (toSme ? w[0] : w[ui]);
  // Väärät vaihtoehdot samasta ryhmästä (sanaluokka tai aihe), ei samaa näkyvää tekstiä kahdesti
  const same = shuffle(pool.filter((w) => w[3] === item[3] && w[0] !== item[0]));
  const rest = shuffle(pool.filter((w) => w[3] !== item[3]));
  const opts = [item], seen = new Set([shown(item)]);
  for (const w of same.concat(rest)) {
    if (opts.length === 4) break;
    if (seen.has(shown(w)) || w[ui] === item[ui]) continue;
    seen.add(shown(w));
    opts.push(w);
  }
  return { sme: item[0], prompt: toSme ? item[ui] : item[0], toSme, opts: shuffle(opts.map(shown)), answer: shown(item),
    voice: PELI_VOICE[run.mode] ? item[4] : null };
}

// --- Näkymät ---
function peliHead(title, back) {
  $("peli-title").textContent = title;
  $("peli-back").hidden = !back;
}

function renderPeliMenu() {
  peliHead(pt().title, false);
  const T = pt();
  const tile = (m) => {
    const best = peliTop(m.id)[0];
    return `<button type="button" class="peli-tile" data-mode="${m.id}" style="--tc: var(--flag-${m.color})">` +
      `<span class="pt-ico">${peliModeIcon(m.id)}</span><span class="pt-name">${esc(T.modes[m.id][0])}</span><span class="pt-sub">${esc(T.modes[m.id][1])}</span>` +
      `<span class="pt-best">${esc(T.best)}: <b>${best ? best.score : T.none}</b></span></button>`;
  };
  $("peli-body").innerHTML = `<p class="peli-lead">${esc(T.lead)}</p>` +
    ["words", "cats"].map((g) => `<section class="peli-group"><h3>${esc(T.groups[g])}</h3><div class="peli-grid">` +
      PELI_MODES.filter((m) => m.group === g).map(tile).join("") + `</div></section>`).join("");
}

function renderPeliResume() {
  const T = pt(), run = peliRun;
  peliHead(T.title, false);
  $("peli-body").innerHTML = `<div class="peli-card peli-ask" style="--tc: var(--flag-${PELI_MODES.find((m) => m.id === run.mode).color})">` +
    `<p class="peli-mode"><span class="pt-ico small">${peliModeIcon(run.mode)}</span>${esc(T.modes[run.mode][0])} · ${esc(T.score(run.score))}</p><h3>${esc(T.resumeQ)}</h3>` +
    `<div class="peli-actions"><button type="button" class="peli-primary" data-act="resume">${esc(T.resume)}</button>` +
    `<button type="button" class="peli-secondary" data-act="fresh">${esc(T.fresh)}</button></div></div>`;
}

// Pienet kuvakkeet: putki (liekki), paras (pokaali), oikein, väärin
const PI = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const PELI_FLAME = PI('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.4 2.5-5.3 3.6-8.4.4 2 1.6 3 2.6 3.5.2-2.6 1.5-4.9 3.4-6.5-.4 3 1.2 4.4 2.3 6.2 1 1.6 1.1 3 1.1 4.3C18.5 18.2 15.9 21 12 21z"/>');
const PELI_CUP = PI('<path d="M8 4h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3M16 6h2.5a2.5 2.5 0 0 1-2.6 3M12 12.5V16M9 20h6M10 16h4v4h-4z"/>');
const PELI_OK = PI('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
const PELI_NO = PI('<path d="M7 7l10 10M17 7L7 17"/>');

function renderPeliQuestion() {
  const T = pt(), run = peliRun, q = run.q;
  peliLast = { mode: run.mode, q };
  const color = PELI_MODES.find((m) => m.id === run.mode).color;
  peliHead(T.modes[run.mode][0], true);
  $("peli-body").innerHTML = `<div class="peli-play" style="--tc: var(--flag-${color})">` +
    `<div class="peli-stage"><div class="peli-meta">` +
    `<span class="peli-pill streak" title="${esc(T.streak)}">${PELI_FLAME}<b class="peli-score">${run.score}</b></span>` +
    `<span class="peli-pill best" title="${esc(T.best)}">${PELI_CUP}<b>${peliTop(run.mode)[0]?.score ?? 0}</b></span></div>` +
    `<p class="peli-q">${esc(q.toSme ? `${T.askUi}?` : T.askSme)}</p>` +
    `<p class="peli-word"${q.toSme ? "" : ' lang="se"'}>${esc(q.prompt)}</p></div>` +
    `<div class="peli-opts">${q.opts.map((o, i) => `<button type="button" class="peli-opt" data-o="${esc(o)}">` +
      `<span class="po-key">${"ABCD"[i]}</span><span class="po-txt${o.split(/\s/).some((x) => x.length > 11) ? " long" : ""}"${q.toSme ? ' lang="se"' : ""}>${esc(o)}</span>` +
      `<span class="po-mark"></span></button>`).join("")}</div></div>` +
    `<p class="peli-report"><a href="#" class="report-link peli-report-link"><span aria-hidden="true">⚑</span> ${esc(T.report)}</a></p>`;
}

// Parhaat tulokset: kolme parasta korokkeella (🥈 vasemmalla, 🥇 keskellä korkeimpana, 🥉 oikealla)
function peliPodium(top, isNew) {
  const MEDAL = ["🥇", "🥈", "🥉"];
  const step = (i) => {
    const r = top[i];
    return `<div class="pd-step p${i}${i === 0 && isNew ? " now" : ""}"><span class="pd-medal" aria-hidden="true">${MEDAL[i]}</span>` +
      `<b>${r ? r.score : "–"}</b><span class="pd-date">${r ? esc(r.date.slice(5).split("-").reverse().join(".") + ".") : ""}</span>` +
      `<span class="pd-block">${i + 1}</span></div>`;
  };
  return `<div class="peli-podium">${step(1)}${step(0)}${step(2)}</div>`;
}

function peliMark(btn, ok) {
  btn.classList.add(ok ? "right" : "wrong");
  btn.querySelector(".po-mark").innerHTML = ok ? PELI_OK : PELI_NO;
}

function renderPeliOver(chosen) {
  const T = pt(), run = peliRun, q = run.q, score = run.score;
  const prevBest = peliTop(run.mode)[0]?.score ?? 0;
  const top = peliAddTop(run.mode, score);
  const isNew = score > 0 && score > prevBest;
  // Vastaukset näkyvissä: valittu väärä punaisella, oikea vihreällä
  for (const b of document.querySelectorAll(".peli-opt")) {
    b.disabled = true;
    if (b.dataset.o === q.answer) peliMark(b, true);
    else if (b.dataset.o === chosen) peliMark(b, false);
  }
  const mode = run.mode;
  peliRun = null;
  peliStore.set("satni-peli-run", null);
  const sheet = document.createElement("div");
  sheet.className = "peli-sheet";
  sheet.style.setProperty("--tc", `var(--flag-${PELI_MODES.find((m) => m.id === mode).color})`);
  sheet.innerHTML = `<div class="peli-sheet-in" role="dialog" aria-label="${esc(T.over)}">` +
    `<div class="peli-ring"><b>${score}</b><span>${esc(T.score(score).replace(/^\d+\s*/, ""))}</span></div>` +
    `<h3>${esc(T.over)}${isNew ? ` <span class="peli-new">${PELI_CUP}${esc(T.newBest)}</span>` : ""}</h3>` +
    `<p class="peli-correct">${esc(T.correctWas)} <b${q.toSme ? ' lang="se"' : ""}>${esc(q.answer)}</b></p>` +
    `<div class="peli-tops"><h4>${esc(T.top)}</h4>${peliPodium(top, isNew)}</div>` +
    `<div class="peli-actions"><button type="button" class="peli-primary" data-act="again" data-mode="${mode}">${esc(T.again)}</button>` +
    `<div class="peli-row"><button type="button" class="peli-secondary" data-act="menu">${esc(T.menu)}</button>` +
    `<button type="button" class="peli-secondary" data-act="home">${esc(T.home)}</button></div></div>` +
    `<p class="peli-report"><a href="#" class="report-link peli-report-link"><span aria-hidden="true">⚑</span> ${esc(T.report)}</a></p></div>`;
  $("peli-body").querySelector(":scope > .peli-report")?.remove();
  $("peli-body").appendChild(sheet);
  sheet.querySelector(".peli-primary").focus({ preventScroll: true });
}

function peliStart(mode) {
  peliStopAudio();
  peliRun = { mode, score: 0, deck: [], pos: 0, q: null };
  peliRun.q = peliQuestion(peliRun);
  peliSave();
  renderPeliQuestion();
}
const peliSave = () => peliStore.set("satni-peli-run", peliRun);

// Viikonpäivät, vuodenajat ja kuukaudet sekä kysymyssanat: Biret sanoo saameksi oikean vastauksen ("Riekta, dat lei …" / "Boasttu. Rievttes
// vástádus lea …"). Valmiit äänitteet (välimuistissa kuten sanastojen äänilistat), muissa peleissä ei ääntä.
// Ääniaiheet ja tiedostojen etuliite: aika = kokonaiset lauseet, kysymyssanat = Biretin lause + sanan oma äänite yhdistettynä
const PELI_VOICE = { time: "aika", questions: "kysy" };
let peliAudio = null;
function peliStopAudio() {
  if (!peliAudio) return;
  peliAudio.pause();
  peliAudio.removeAttribute("src");
  peliAudio.load();
  peliAudio = null;
}
function peliVoice(q, ok) {
  if (q.voice == null || !canOpus) return;
  peliStopAudio();
  peliAudio = new Audio(`audio/peli/${PELI_VOICE[peliRun.mode]}-${q.voice}-${ok ? "ok" : "no"}.ogg`);
  peliAudio.play().catch(() => {});
}

function peliAnswer(btn) {
  if (peliBusy || !peliRun) return;
  const q = peliRun.q;
  peliVoice(q, btn.dataset.o === q.answer);
  if (btn.dataset.o === q.answer) {
    peliBusy = true;
    peliMark(btn, true);
    peliRun.score++;
    const s = document.querySelector(".peli-score");
    if (s) { s.textContent = peliRun.score; s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); }
    setTimeout(() => {
      peliBusy = false;
      if (!peliRun) return;
      peliRun.q = peliQuestion(peliRun);
      peliSave();
      renderPeliQuestion();
    }, q.voice == null ? 550 : 1600);  // äänen kanssa hetki aikaa kuulla vastaus
  } else {
    renderPeliOver(btn.dataset.o);
  }
}

// --- Avaus ja sulkeminen ---
function openPeli() {
  stopTts();
  $("peli-view").hidden = false;
  loadPeli().then(() => {
    if (!peliRun) peliRun = peliStore.get("satni-peli-run", null);
    if (peliRun && peliRun.q && PELI_MODES.some((m) => m.id === peliRun.mode)) renderPeliResume();
    else { peliRun = null; renderPeliMenu(); }
  }).catch(() => { $("peli-body").textContent = t("loadFailed", "minipeli.json"); });
}
function hidePeli() { peliStopAudio(); $("peli-view").hidden = true; }
// Takaisin-ele: ensin pelistä valikkoon (peli jää jatkettavaksi), sitten näkymä kiinni
function closePeli() {
  if ($("peli-view").hidden) return false;
  if (peliRun && !$("peli-back").hidden) { renderPeliMenu(); return true; }
  hidePeli();
  return true;
}
function applyPeliButton() {
  const on = settings.game !== false;
  $("peli-btn").hidden = !on;
  if ($("game-toggle")) $("game-toggle").checked = on;
  if (!on) hidePeli();
}

// Virheilmoitus pelin sanasta: sama lomake kuin sanakortissa ja sanastoissa (app.js: report-dlg)
function peliReport() {
  if (!peliLast) return;
  const dlg = $("report-dlg");
  dlg.classList.add("list-mode", "game-mode");
  $("report-about").textContent = `${pt().title}: ${pt().modes[peliLast.mode][0]}`;
  $("report-word").value = peliLast.q.sme;
  $("report-text").value = "";
  dlg.querySelector('input[value="trans"]').checked = true;
  dlg.showModal();
}
function peliSendReport() {
  const L = t("reportLabels"), q = peliLast?.q;
  const kind = $("report-dlg").querySelector('input[name="report-kind"]:checked').value;
  const kindText = { trans: t("reportKindTrans"), inappropriate: t("reportKindBad"), other: t("reportKindOther") }[kind] || kind;
  const word = $("report-word").value.trim().slice(0, 80);
  const item = peli && peli.words.concat(...Object.values(peli.cats)).find((w) => w[0] === word);
  const subject = `${t("reportSubject")} – ${pt().title}: ${word} (${t("reportSubjectKind")[kind] || kind})`;
  const body = [
    $("report-text").value.trim().slice(0, 1200), "",
    `--- ${t("reportDetails")} ---`,
    `${L.error}: ${kindText}`,
    `${pt().title}: ${peliLast ? pt().modes[peliLast.mode][0] : ""}`,
    word ? `${L.word}: ${word}` : "",
    item ? `${L.shown}: ${sanastoLang() === "nb" ? item[2] : item[1]}` : "",
    q && q.toSme ? `${L.search}: ${q.prompt}` : "",
    `${L.ui}: ${UI_LANGUAGES[settings.uiLang].name}`,
    `${L.version}: ${$("about-version").textContent}`,
  ].filter((line, i) => line !== "" || i === 1).join("\n");
  openReportMail(subject, body);
}

function bindPeli() {
  if (!$("peli-view")) return;
  $("peli-btn").innerHTML = PELI_ICON;
  $("peli-btn").onclick = openPeli;
  $("peli-close").onclick = hidePeli;
  $("peli-back").onclick = () => renderPeliMenu();
  if ($("game-toggle")) {
    $("game-toggle").onchange = (e) => { settings.game = e.target.checked; saveSettings(); applyPeliButton(); };
  }
  applyPeliButton();
  $("peli-body").addEventListener("click", (e) => {
    const tile = e.target.closest(".peli-tile");
    if (tile) return peliStart(tile.dataset.mode);
    const opt = e.target.closest(".peli-opt");
    if (opt && !opt.disabled) return peliAnswer(opt);
    if (e.target.closest(".peli-report-link")) { e.preventDefault(); return peliReport(); }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "resume") renderPeliQuestion();
    else if (act === "fresh") { peliRun = null; peliSave(); renderPeliMenu(); }
    else if (act === "again") peliStart(e.target.closest("[data-act]").dataset.mode);
    else if (act === "menu") renderPeliMenu();
    else if (act === "home") { hidePeli(); if (location.hash) { history.pushState(null, "", location.pathname + location.search); routeFromHash(); } }
  });
  // Takaisin-ele (MainActivity: closeOcr) ja Esc: ensin avoin ikkuna, sitten peli
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => {
    const d = document.querySelector("dialog[open]");
    if (d) { d.close(); return true; }
    return closePeli() || (closeOcrBase ? closeOcrBase() : false);
  };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) closePeli(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) peliStopAudio(); });
  // Kieli vaihtui kesken: näkymä uudelleen oikealla kielellä
  const setUiBase = window.setUiLanguage;
  window.setUiLanguage = (code) => { setUiBase(code); if (!$("peli-view").hidden) (peliRun && !$("peli-back").hidden ? renderPeliQuestion : renderPeliMenu)(); };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindPeli); else bindPeli();
