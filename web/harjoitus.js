/* Sanastojen kuunteluharjoitus (2026-11-19): sana suomeksi (Harri), miettimisaika 3…2…1, vastaus saameksi (Biret)
   ja näytölle. Jatkuu, kunnes painetaan Pysäytä, takaisin-elettä tai suljetaan sovellus. Avataan sanastolistan
   yläreunan painikkeesta tai yleisnäkymän laatasta; valinnat ponnahdusikkunassa (listat, suunta, miettimisaika,
   järjestys) muistetaan laitteella.
   Äänet: web/audio/w/<lista>-<n>-fi.ogg ja -sme.ogg, hakemisto web/audio/w/harjoitus.json (koonti
   ~/.cache/satni-fst-build/drill-audio/build.py samoista otoksista kuin listojen äänitteet).
   Android: soitto natiivisti (DrillService, mediailmoitus), jolloin harjoitus jatkuu näytön sammuttua; sivu vain näyttää
   tilan. Selaimessa ja työpöydällä soitto tässä tiedostossa; sovelluksen siirtyessä taustalle harjoitus pysähtyy.
   Vain suomenkielinen käyttöliittymä ja pohjoissaame toistaiseksi (norjalle ei ole ääntä). */
"use strict";

let harjIndex = null;          // harjoitus.json
let harjRun = null;            // käynnissä oleva harjoitus: { deck, pos, phase, opts, timer, audio, paused }
const HARJ_STORE = "satni-harj";
const HARJ_DEFAULT = { lists: ["kysymykset", "viikonpaivat"], dir: "fi", think: 3, shuffle: true };
const HARJ_GAP = 1500;         // vastauksen jälkeen ennen seuraavaa sanaa (ms)
const HARJ_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/></svg>';
const harjNative = () => !!(window.SatniApp && window.SatniApp.drillStart);

// Käytettävissä: suomenkielinen käyttöliittymä, pohjoissaame, Opus-tuki (sama ehto kuin listojen äänitteillä)
const harjAvailable = () => typeof canOpus !== "undefined" && canOpus && sanastoLang() === "fi" && sanastoSami() === "sme";

function harjOpts() {
  let o = {};
  try { o = JSON.parse(localStorage.getItem(HARJ_STORE) || "{}") || {}; } catch { /* yksityinen tila */ }
  return { ...HARJ_DEFAULT, ...o };
}
function harjSave(o) { try { localStorage.setItem(HARJ_STORE, JSON.stringify(o)); } catch { /* ei tallennusta */ } }

async function harjLoad() {
  if (harjIndex) return harjIndex;
  const r = await fetch("audio/w/harjoitus.json");
  if (!r.ok) throw new Error(r.status);
  harjIndex = await r.json();
  return harjIndex;
}

// Listan nimi: sanastojen otsikko, luvuille omat (sanastoissa luvut ja järjestysluvut ovat yhdessä listassa)
function harjTitle(id) {
  if (id === "luvut") return t("harjNumbers");
  if (id === "jarjestysluvut") return t("harjOrdinals");
  const l = sanastot && sanastot.find((x) => x.id === id);
  return l ? l.title.fi : id;
}

// --- Asetukset (ponnahdus alhaalta) ---
function openHarj(listId) {
  if (!harjAvailable()) return;
  sanastoStopAudio();
  closeFormPop();
  harjLoad().then(() => {
    const o = harjOpts();
    // Listasta avattuna esivalintana se lista (luvut: perusluvut); yleisnäkymästä viimeksi käytetyt
    const lists = listId ? [harjIndex.lists.some((l) => l.id === listId) ? listId : o.lists[0]] : o.lists;
    harjRenderSetup({ ...o, lists: lists.filter((id) => harjIndex.lists.some((l) => l.id === id)) });
  }).catch(() => toast(t("loadFailed", "harjoitus.json")));
}

function harjRenderSetup(o) {
  const el = $("harj");
  const chip = (group, val, label, on) => `<button type="button" class="hj-chip" data-g="${group}" data-v="${esc(String(val))}" aria-pressed="${on}">${esc(label)}</button>`;
  const words = harjIndex.lists.filter((l) => o.lists.includes(l.id)).reduce((n, l) => n + l.rows.length, 0);
  el.innerHTML = `<div class="hj-sheet" role="dialog" aria-modal="true" aria-labelledby="hj-title">` +
    `<div class="hj-top"><h3 id="hj-title">${HARJ_ICON}${esc(t("harjTitle"))}</h3><button type="button" class="chip-btn" data-act="close">${esc(t("close"))}</button></div>` +
    `<p class="hj-help">${esc(t("harjHelp"))}</p>` +
    `<div class="hj-lbl">${esc(t("harjLists"))} <span class="hj-n">${esc(t("harjWords", words))}</span></div>` +
    `<div class="hj-chips">${harjIndex.lists.map((l) => chip("list", l.id, harjTitle(l.id), o.lists.includes(l.id))).join("")}</div>` +
    `<div class="hj-lbl">${esc(t("harjDir"))}</div><div class="hj-chips">${chip("dir", "fi", t("harjDirFi"), o.dir === "fi")}${chip("dir", "sme", t("harjDirSme"), o.dir === "sme")}</div>` +
    `<div class="hj-lbl">${esc(t("harjThink"))}</div><div class="hj-chips">${[2, 3, 4, 5, 7].map((s) => chip("think", s, `${s} s`, o.think === s)).join("")}</div>` +
    `<div class="hj-lbl">${esc(t("harjOrder"))}</div><div class="hj-chips">${chip("shuffle", 1, t("harjShuffle"), o.shuffle)}${chip("shuffle", 0, t("harjInOrder"), !o.shuffle)}</div>` +
    (harjNative() ? `<p class="hj-help">${esc(t("harjScreenOff"))}</p>` : "") +
    `<p class="hj-err" role="alert" hidden>${esc(t("harjPickList"))}</p>` +
    `<button type="button" class="hj-start" data-act="start">${PLAY_ICON_HJ}<span>${esc(t("harjStart"))}</span></button></div>`;
  el.dataset.mode = "setup";
  el.hidden = false;
  el._opts = o;
}
const PLAY_ICON_HJ = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';

function harjSetupClick(e) {
  const el = $("harj"), o = el._opts;
  if (e.target === el) return closeHarj();  // napautus taustaan sulkee asetukset
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.act === "close") return closeHarj();
  if (b.dataset.act === "start") {
    if (!o.lists.length) { el.querySelector(".hj-err").hidden = false; return; }
    harjSave(o);
    return harjStart(o);
  }
  const g = b.dataset.g, v = b.dataset.v;
  if (g === "list") o.lists = o.lists.includes(v) ? o.lists.filter((x) => x !== v) : harjIndex.lists.map((l) => l.id).filter((id) => id === v || o.lists.includes(id));
  else if (g === "dir") o.dir = v;
  else if (g === "think") o.think = Number(v);
  else if (g === "shuffle") o.shuffle = v === "1";
  harjSyncSetup(o);
}

// Valintojen muutos päivittää vain painikkeet ja sanamäärän: koko ikkunan uudelleenpiirto toisti avausanimaation
// (ikkuna välähti alas ja ylös joka napautuksella, Samsung 2026-11-19)
function harjSyncSetup(o) {
  const el = $("harj");
  for (const b of el.querySelectorAll(".hj-chip")) {
    const g = b.dataset.g, v = b.dataset.v;
    const on = g === "list" ? o.lists.includes(v) : g === "dir" ? o.dir === v : g === "think" ? o.think === Number(v) : o.shuffle === (v === "1");
    b.setAttribute("aria-pressed", String(on));
  }
  const words = harjIndex.lists.filter((l) => o.lists.includes(l.id)).reduce((n, l) => n + l.rows.length, 0);
  el.querySelector(".hj-n").textContent = t("harjWords", words);
  if (o.lists.length) el.querySelector(".hj-err").hidden = true;
}

// --- Harjoitus ---
function harjShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function harjDeck(o) {
  const deck = [];
  for (const l of harjIndex.lists) if (o.lists.includes(l.id)) l.rows.forEach((r, k) => deck.push({ ...r, list: l.id, k }));
  return o.shuffle ? harjShuffle(deck) : deck;
}
// Kysymys- ja vastauspuoli valitun suunnan mukaan
const harjSides = (it, dir) => {
  const fi = { text: it.fi, src: `audio/w/${it.list}-${it.k}-fi.ogg`, dur: it.d[0], lang: "fi" };
  const sme = { text: it.sme, src: `audio/w/${it.list}-${it.k}-sme.ogg`, dur: it.d[1], lang: "se" };
  return dir === "sme" ? [sme, fi] : [fi, sme];
};

function harjStart(o) {
  const deck = harjDeck(o);
  harjRun = { deck, deckOrig: deck.slice(), pos: 0, phase: null, opts: o, timer: null, audio: null, paused: false, round: 1 };
  $("harj").dataset.mode = "run";
  harjRenderRun();
  if (harjNative()) {
    // Natiivi soitin hoitaa ajoituksen (myös näyttö pois); sivu saa tapahtumat satniDrill.event-kutsuina
    const items = deck.map((it) => { const [q, a] = harjSides(it, o.dir); return { q: q.src, a: a.src, qt: q.text, at: a.text, list: harjTitle(it.list) }; });
    window.SatniApp.drillStart(JSON.stringify({ items, think: o.think, gap: HARJ_GAP, shuffle: o.shuffle,
      title: t("harjNotifTitle"), pause: t("harjPause"), play: t("harjResume"), next: t("harjNext"), stop: t("stop") }));
    return;
  }
  harjStep();
}

function harjRenderRun() {
  const r = harjRun, it = r.deck[r.pos % r.deck.length];
  const [q, a] = harjSides(it, r.opts.dir);
  const shown = r.phase === "show";
  const askText = r.opts.dir === "sme" ? t("harjAskFi") : t("harjAskSme");
  const num = it.n && r.opts.dir === "fi" ? `<span class="hj-digit">${it.n}</span>` : "";
  // Ponnahdusanimaatio vain ensimmäisellä piirrolla, ei joka vaiheessa (välähti puhelimella läpikuultavana)
  const fresh = !$("harj").querySelector(".hj-card");
  $("harj").innerHTML = `<div class="hj-card${fresh ? " hj-new" : ""}" role="dialog" aria-modal="true" aria-label="${esc(t("harjTitle"))}">` +
    `<div class="hj-meta">${esc(harjTitle(it.list))} · ${(r.pos % r.deck.length) + 1} / ${r.deck.length}${r.round > 1 ? ` · ${esc(t("harjRound", r.round))}` : ""}</div>` +
    `<div class="hj-q" lang="${q.lang}">${num}${esc(q.text)}</div>` +
    `<div class="hj-ask">${esc(shown ? "" : askText)}</div>` +
    `<div class="hj-ring${shown ? " done" : ""}${r.phase === "think" ? " run" : ""}" style="--think: ${r.opts.think}s">` +
    `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" pathLength="100"/><circle class="hj-arc" cx="50" cy="50" r="44" pathLength="100"/></svg>` +
    `<span class="hj-count" aria-live="off">${shown ? "✓" : r.phase === "think" ? r.count : ""}</span></div>` +
    `<div class="hj-a" lang="${a.lang}" aria-live="polite">${shown ? esc(a.text) : ""}</div>` +
    `<div class="hj-ctl">` +
    `<button type="button" data-act="stop" aria-label="${esc(t("stop"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg></button>` +
    `<button type="button" data-act="pause" class="hj-main" aria-label="${esc(r.paused ? t("harjResume") : t("harjPause"))}">${r.paused ? PLAY_ICON_HJ : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/></svg>'}</button>` +
    `<button type="button" data-act="next" aria-label="${esc(t("harjNext"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5.5v13l9-6.5z" fill="currentColor"/><rect x="16" y="5.5" width="2.6" height="13" rx="1" fill="currentColor"/></svg></button>` +
    `</div>${harjNative() ? `<p class="hj-help hj-off">${esc(t("harjScreenOff"))}</p>` : ""}</div>`;
}

// Selaimen soitin: yksi Audio-olio koko harjoituksen ajan (Android WebView sallii vain rajallisen määrän soittimia)
function harjPlay(src, dur, done) {
  const r = harjRun;
  if (!r.audio) r.audio = new Audio();
  const a = r.audio;
  let finished = false;
  const fin = () => { if (finished || harjRun !== r) return; finished = true; clearTimeout(r.timer); a.onended = a.onerror = null; done(); };
  a.onended = a.onerror = fin;
  a.src = src;
  a.play().catch(() => {});
  // Varmistus: ääni ei soi (esim. mykistetty selain estää) -> eteenpäin keston mukaan
  r.timer = setTimeout(fin, Math.round((dur + 1.5) * 1000));
}

function harjStep() {
  const r = harjRun;
  if (!r || r.paused) return;
  const it = r.deck[r.pos % r.deck.length];
  const [q, a] = harjSides(it, r.opts.dir);
  r.phase = "ask";
  harjRenderRun();
  harjPlay(q.src, q.dur, () => {
    r.phase = "think";
    r.count = r.opts.think;
    harjRenderRun();
    const tick = () => {
      if (harjRun !== r || r.paused) return;
      r.count--;
      if (r.count > 0) { $("harj").querySelector(".hj-count").textContent = r.count; r.timer = setTimeout(tick, 1000); return; }
      r.phase = "show";
      harjRenderRun();
      harjPlay(a.src, a.dur, () => { r.timer = setTimeout(() => harjAdvance(), HARJ_GAP); });
    };
    r.timer = setTimeout(tick, 1000);
  });
}

function harjAdvance() {
  const r = harjRun;
  if (!r) return;
  r.pos++;
  if (r.pos % r.deck.length === 0) {
    r.round++;
    if (r.opts.shuffle) harjShuffle(r.deck);
  }
  harjStep();
}

function harjHalt() {
  const r = harjRun;
  if (!r) return;
  clearTimeout(r.timer);
  if (r.audio) { r.audio.onended = r.audio.onerror = null; r.audio.pause(); r.audio.removeAttribute("src"); r.audio.load(); }
}

function harjPause(on) {
  const r = harjRun;
  if (!r || r.paused === on) return;
  if (harjNative()) { window.SatniApp.drillControl(on ? "pause" : "play"); return; }
  r.paused = on;
  if (on) harjHalt();
  harjRenderRun();
  if (!on) harjStep();  // jatko kysymyksestä: kesken jäänyt sana kuullaan alusta
}

function harjNext() {
  const r = harjRun;
  if (!r) return;
  if (harjNative()) { window.SatniApp.drillControl("next"); return; }
  harjHalt();
  r.paused = false;
  harjAdvance();
}

// Kiinni: pysäyttää harjoituksen ja sulkee ikkunan
function closeHarj() {
  const el = $("harj");
  if (!el || el.hidden) return false;
  if (harjRun) {
    harjHalt();
    if (harjNative()) window.SatniApp.drillControl("stop");
    harjRun = null;
  }
  el.hidden = true;
  el.innerHTML = "";
  delete el.dataset.mode;
  return true;
}

// Natiivin soittimen tapahtumat (DrillService -> MainActivity -> evaluateJavascript)
window.satniDrill = {
  event(e) {
    const r = harjRun;
    if (!r) return;
    if (e.type === "stop") { harjRun = null; closeHarj(); return; }
    if (e.pos != null) r.pos = e.pos;
    if (e.round != null) r.round = e.round;
    if (e.order) r.deck = e.order.map((i) => r.deckOrig[i]);
    if (e.paused != null) r.paused = e.paused;
    if (e.phase) { r.phase = e.phase; if (e.phase === "think") r.count = e.count || r.opts.think; }
    if (e.type === "count" && r.phase === "think") {
      const c = $("harj").querySelector(".hj-count");
      if (c) { c.textContent = e.count; return; }
    }
    harjRenderRun();
  },
};

function bindHarj() {
  const view = $("sanasto-view");
  if (!view || $("harj")) return;
  const el = document.createElement("div");
  el.id = "harj";
  el.className = "harj";
  el.hidden = true;
  view.appendChild(el);
  el.addEventListener("click", (e) => {
    if (el.dataset.mode === "setup") return harjSetupClick(e);
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    if (b.dataset.act === "stop") closeHarj();
    else if (b.dataset.act === "pause") harjPause(!harjRun.paused);
    else if (b.dataset.act === "next") harjNext();
  });
  // Sanastojen napautukset: listan painike ja yleisnäkymän laatta
  $("sanasto-body").addEventListener("click", (e) => {
    const b = e.target.closest("[data-harj]");
    if (b) { e.stopPropagation(); openHarj(b.dataset.harj || null); }
  }, true);
  // Takaisin-ele, Esc ja verkkoversion Takaisin: ensin harjoitus kiinni
  overlayLayerFns.push(() => (!el.hidden ? 1 : 0));
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => closeHarj() || (closeOcrBase ? closeOcrBase() : false);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.hidden && closeHarj()) { e.preventDefault(); e.stopImmediatePropagation(); }
    if (e.key === " " && harjRun && !el.hidden && !e.target.closest("input,textarea")) { e.preventDefault(); harjPause(!harjRun.paused); }
  }, true);
  window.addEventListener("popstate", () => { if (!el.hidden) closeHarj(); });
  // Selaimessa taustalle siirtyminen pysäyttää (Androidissa natiivi soitin jatkaa)
  document.addEventListener("visibilitychange", () => { if (document.hidden && harjRun && !harjNative()) harjPause(true); });
  // Sanastonäkymän sulkeminen sulkee myös harjoituksen
  new MutationObserver(() => { if (view.hidden) closeHarj(); }).observe(view, { attributes: true, attributeFilter: ["hidden"] });
}

// Painikkeet sanastoihin (sanastot.js kutsuu): listan yläreunaan ja yleisnäkymän alkuun
function harjListButton(listId) {
  if (!harjAvailable()) return "";
  const id = listId === "luvut" ? "luvut" : listId;
  return `<button type="button" class="hj-open" data-harj="${esc(id)}">${HARJ_ICON}<span>${esc(t("harjTitle"))}</span></button>`;
}
function harjGridTile() {
  if (!harjAvailable()) return "";
  return `<button type="button" class="hj-open hj-tile" data-harj="">${HARJ_ICON}<span class="hj-tt"><span>${esc(t("harjTitle"))}</span>` +
    `<small>${esc(t("harjTileSub"))}</small></span></button>`;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindHarj); else bindHarj();
