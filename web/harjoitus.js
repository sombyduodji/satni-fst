/* Sanastojen kuunteluharjoitus (2026-11-19): sana suomeksi (Harri), miettimisaika 3…2…1, vastaus saameksi (Biret)
   ja näytölle. Jatkuu, kunnes painetaan Pysäytä, takaisin-elettä tai suljetaan sovellus. Avataan sanastolistan
   yläreunan painikkeesta tai yleisnäkymän laatasta; valinnat ponnahdusikkunassa (listat, suunta, miettimisaika,
   järjestys) muistetaan laitteella.
   Äänet: web/audio/w/<lista>-<n>-fi.ogg ja -sme.ogg (Biret; Máhtte ja Sunná rivin v-kentästä), hakemisto web/audio/w/harjoitus.json (koonti
   ~/.cache/satni-fst-build/drill-audio/build.py samoista otoksista kuin listojen äänitteet).
   Android: soitto natiivisti (DrillService, mediailmoitus), jolloin harjoitus jatkuu näytön sammuttua; sivu vain näyttää
   tilan. Selaimessa ja työpöydällä soitto tässä tiedostossa; sovelluksen siirtyessä taustalle harjoitus pysähtyy.
   Vain suomenkielinen käyttöliittymä ja pohjoissaame toistaiseksi (norjalle ei ole ääntä). */
"use strict";

let harjIndex = null;          // harjoitus.json
let harjRun = null;            // käynnissä oleva harjoitus: { deck, pos, phase, opts, timer, audio, paused }
const HARJ_STORE = "satni-harj";
const HARJ_DEFAULT = { lists: ["kysymykset", "viikonpaivat"], dir: "fi", think: 3, shuffle: true, ranges: [0, 1, 2, 3, 4], clock: [0, 1, 2] };
// Kello (data/kello.json, 2026-11-22): tasot 0 tasatunnit, 1 puolet, 2 vartit, 3 muut viiden minuutin ajat
const HARJ_CLOCK_LV = 4;
// Luvut ja järjestysluvut: lukualueet kuten listan hyppypainikkeissa; harjoitukseen vain valitut alueet
const HARJ_RANGES = [[1, 10], [11, 20], [21, 29], [30, 100], [101, 120]];
const HARJ_NUMERIC = ["luvut", "jarjestysluvut"];
const harjInRanges = (row, o) => row.n == null || o.ranges.some((i) => row.n >= HARJ_RANGES[i][0] && row.n <= HARJ_RANGES[i][1]);
const harjRowOk = (l, r, o) => (l.id === "kello" ? o.clock.includes(r.level) : !HARJ_NUMERIC.includes(l.id) || harjInRanges(r, o));
const harjRows = (l, o) => l.rows.filter((r) => harjRowOk(l, r, o));
const HARJ_GAP = 1500;         // vastauksen jälkeen ennen seuraavaa sanaa (ms)
const HARJ_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/></svg>';
// Natiivi soitin (näyttö voi sammua) Android 10+:lla; vanhemmilla ja selaimessa sivun oma soitin
let harjNativeOk = null;
const harjNative = () => {
  if (harjNativeOk === null) {
    try { harjNativeOk = !!(window.SatniApp && window.SatniApp.drillStart && (!window.SatniApp.drillSupported || window.SatniApp.drillSupported())); } catch (e) { harjNativeOk = false; }
  }
  return harjNativeOk;
};

// Käytettävissä: suomenkielinen käyttöliittymä, pohjoissaame, Opus-tuki (sama ehto kuin listojen äänitteillä)
const harjAvailable = () => typeof canOpus !== "undefined" && canOpus && sanastoLang() === "fi" && sanastoSami() === "sme";

function harjOpts() {
  let o = {};
  try { o = JSON.parse(localStorage.getItem(HARJ_STORE) || "{}") || {}; } catch { /* yksityinen tila */ }
  const r = { ...HARJ_DEFAULT, ...o };
  if (!Array.isArray(r.ranges) || !r.ranges.length) r.ranges = HARJ_DEFAULT.ranges.slice();
  if (!Array.isArray(r.clock) || !r.clock.length) r.clock = HARJ_DEFAULT.clock.slice();
  return r;
}
function harjSave(o) { try { localStorage.setItem(HARJ_STORE, JSON.stringify(o)); } catch { /* ei tallennusta */ } }

async function harjLoad() {
  if (harjIndex) return harjIndex;
  const r = await fetch("audio/w/harjoitus.json");
  if (!r.ok) throw new Error(r.status);
  harjIndex = await r.json();
  // Kellonajat omasta tiedostostaan: Harri sanoo ajan suomeksi, Biret saameksi (audio/w/kello-<i>-fi|sme.ogg)
  try {
    const k = await fetch("data/kello.json");
    if (k.ok) harjIndex.lists.push({ id: "kello", rows: (await k.json()).rows.map((x) => ({ fi: x.fi, sme: x.smeFull, d: x.d || [2, 2], level: x.level, h: x.h, m: x.m })) });
  } catch (e) { /* ei kelloharjoitusta */ }
  return harjIndex;
}

// Listan nimi: sanastojen otsikko, luvuille omat (sanastoissa luvut ja järjestysluvut ovat yhdessä listassa)
function harjTitle(id) {
  if (id === "luvut") return t("harjNumbers");
  if (id === "jarjestysluvut") return t("harjOrdinals");
  if (id === "kello") return t("harjClock");
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

// Aiheen ryhmä (Sanastojen värit ja kuvakkeet): järjestysluvut kulkevat lukujen kanssa
function harjGroup(id) {
  const key = id === "jarjestysluvut" ? "luvut" : id === "kello" ? "aika" : id;
  return SANASTO_GROUPS.find((g) => g.lists.includes(key)) || SANASTO_GROUPS[SANASTO_GROUPS.length - 1];
}
function harjIcon(id) {
  // Oma kuvake (herätyskello): sanastojen Vuorokausi-listan kellosta erottuva (käyttäjä 2026-11-22)
  if (id === "kello") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.2V13l2.6 1.8"/><path d="M4.2 6.2l3-2.4M19.8 6.2l-3-2.4M7.3 19.2l-1.6 1.9M16.7 19.2l1.6 1.9"/></svg>';
  const l = sanastot && sanastot.find((x) => x.id === (id === "jarjestysluvut" ? "luvut" : id));
  return l ? sanastoSvg(l.icon) : HARJ_ICON;
}
const HJ_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const HJ_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const HJ_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// Asetusikkuna: aiheet ryhmittäin laattoina (kuvake, nimi, sanamäärä), sitten suunta, miettimisaika ja järjestys
// valitsimina, alareunassa aina näkyvä Aloita sanamäärineen
function harjRenderSetup(o) {
  const el = $("harj");
  const ids = harjIndex.lists.map((l) => l.id);
  const count = Object.fromEntries(harjIndex.lists.map((l) => [l.id, l.rows.length]));
  // Aiheet pieninä valintanappeina Sanastojen järjestyksessä, kuvake ryhmän värillä; useita voi valita
  const order = SANASTO_GROUPS.flatMap((g) => ids.filter((id) => harjGroup(id) === g));
  const chip = (id) => { const c = harjGroup(id).color;
    return `<button type="button" class="hj-chip" data-g="list" data-v="${esc(id)}" aria-pressed="${o.lists.includes(id)}" title="${esc(id === "kello" ? t("harjTimes", count[id]) : t("harjWords", count[id]))}" style="--tc: var(--flag-${c}); --tb: var(--btn-${c})">` +
      `<span class="hj-ci">${harjIcon(id)}</span>${esc(harjTitle(id))}</button>`; };
  const seg = (group, opts, label) => `<div class="hj-row"><span class="hj-rl" id="hj-l-${group}">${esc(label)}</span><div class="hj-seg" role="group" aria-labelledby="hj-l-${group}">` +
    opts.map(([v, txt]) => `<button type="button" data-g="${group}" data-v="${esc(String(v))}" aria-pressed="false">${esc(txt)}</button>`).join("") + `</div></div>`;
  el.innerHTML = `<div class="hj-sheet" role="dialog" aria-modal="true" aria-labelledby="hj-title"><div class="hj-grab" aria-hidden="true"></div>` +
    `<div class="hj-top"><div class="hj-tt2"><h3 id="hj-title">${HARJ_ICON}${esc(t("harjTitle"))}</h3><p>${esc(t("harjHelp"))}</p></div>` +
    `<button type="button" class="hj-x" data-act="close" aria-label="${esc(t("close"))}">${HJ_X}</button></div>` +
    `<div class="hj-sec"><span>${esc(t("harjTopics"))}</span><button type="button" class="hj-link" data-act="all"></button></div>` +
    `<div class="hj-chips">${order.map(chip).join("")}</div>` +
    `<div class="hj-opts">` +
    `<div class="hj-row hj-numrow"><span class="hj-rl" id="hj-l-nr">${esc(t("harjRange"))}</span><div class="hj-seg multi" role="group" aria-labelledby="hj-l-nr">` +
      HARJ_RANGES.map(([a, b], i) => `<button type="button" data-g="nr" data-v="${i}" aria-pressed="false">${a}–${b}</button>`).join("") + `</div></div>` +
    `<div class="hj-row hj-clockrow"><span class="hj-rl" id="hj-l-cl">${esc(t("harjClockLv"))}</span><div class="hj-seg multi" role="group" aria-labelledby="hj-l-cl">` +
      t("harjClockLvs").map((txt, i) => `<button type="button" data-g="cl" data-v="${i}" aria-pressed="false">${esc(txt)}</button>`).join("") + `</div></div>` +
    seg("dir", [["fi", t("harjDirFi")], ["sme", t("harjDirSme")]], t("harjDir")) +
    seg("think", [2, 3, 4, 5, 7].map((x) => [x, `${x} s`]), t("harjThink")) +
    seg("shuffle", [[1, t("harjShuffle")], [0, t("harjInOrder")]], t("harjOrder")) + `</div>` +
    `<div class="hj-foot"><p class="hj-err" role="alert" hidden>${esc(t("harjPickList"))}</p>` +
    `<button type="button" class="hj-start" data-act="start">${PLAY_ICON_HJ}<span></span></button>` +
    (harjNative() ? `<p class="hj-note">${HJ_MOON}<span>${esc(t("harjScreenOff"))}</span></p>` : "") + `</div></div>`;
  el.dataset.mode = "setup";
  el.hidden = false;
  el._opts = o;
  harjSyncSetup(o);
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
  const ids = harjIndex.lists.map((l) => l.id);
  if (b.dataset.act === "all") o.lists = o.lists.length === ids.length ? [] : ids.slice();
  const g = b.dataset.g, v = b.dataset.v;
  if (g === "list") o.lists = o.lists.includes(v) ? o.lists.filter((x) => x !== v) : ids.filter((id) => id === v || o.lists.includes(id));
  else if (g === "dir") o.dir = v;
  else if (g === "think") o.think = Number(v);
  else if (g === "shuffle") o.shuffle = v === "1";
  else if (g === "cl") {
    const i = Number(v);
    if (!o.clock.includes(i)) o.clock = [...o.clock, i].sort((a, b) => a - b);
    else if (o.clock.length > 1) o.clock = o.clock.filter((x) => x !== i);  // vähintään yksi taso
  }
  else if (g === "nr") {
    const i = Number(v);
    if (!o.ranges.includes(i)) o.ranges = [...o.ranges, i].sort((a, b) => a - b);
    else if (o.ranges.length > 1) o.ranges = o.ranges.filter((x) => x !== i);  // vähintään yksi alue
  }
  harjSyncSetup(o);
}

// Valintojen muutos päivittää vain painikkeet ja sanamäärän: koko ikkunan uudelleenpiirto toisti avausanimaation
// (ikkuna välähti alas ja ylös joka napautuksella, Samsung 2026-11-19)
function harjSyncSetup(o) {
  const el = $("harj");
  for (const b of el.querySelectorAll("[data-g]")) {
    const g = b.dataset.g, v = b.dataset.v;
    const on = g === "list" ? o.lists.includes(v) : g === "dir" ? o.dir === v : g === "think" ? o.think === Number(v)
      : g === "nr" ? o.ranges.includes(Number(v)) : g === "cl" ? o.clock.includes(Number(v)) : o.shuffle === (v === "1");
    if (b.getAttribute("aria-pressed") !== String(on)) b.setAttribute("aria-pressed", String(on));
  }
  const words = harjIndex.lists.filter((l) => o.lists.includes(l.id) && l.id !== "kello").reduce((n, l) => n + harjRows(l, o).length, 0);
  const times = o.lists.includes("kello") ? harjRows(harjIndex.lists.find((l) => l.id === "kello"), o).length : 0;
  el.querySelector(".hj-numrow").hidden = !o.lists.some((id) => HARJ_NUMERIC.includes(id));
  el.querySelector(".hj-clockrow").hidden = !o.lists.includes("kello");
  el.querySelector(".hj-start span").textContent = !o.lists.length ? t("harjStart") : times ? t("harjStartMix", words, times) : t("harjStartN", words);
  el.querySelector(".hj-start").classList.toggle("off", !o.lists.length);
  el.querySelector(".hj-link").textContent = o.lists.length === harjIndex.lists.length ? t("harjNone") : t("harjAll");
  if (o.lists.length) el.querySelector(".hj-err").hidden = true;
}

// --- Harjoitus ---
function harjShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function harjDeck(o) {
  const deck = [];
  for (const l of harjIndex.lists) if (o.lists.includes(l.id)) l.rows.forEach((r, k) => { if (harjRowOk(l, r, o)) deck.push({ ...r, list: l.id, k }); });
  return o.shuffle ? harjShuffle(deck) : deck;
}
// Kysymys- ja vastauspuoli valitun suunnan mukaan
const harjSides = (it, dir) => {
  const fi = { text: it.fi, src: `audio/w/${it.list}-${it.k}-fi.ogg`, dur: it.d[0], lang: "fi" };
  // Saamenpuoli valitulla äänellä (asetukset: Biret, Máhtte, Sunná); Biret harjoituksen omista äänistä, muut
  // sanastojen sanojen valmiista äänistä (it.v, drill-audio/voices.py)
  const v = it.v?.[VOICES[settings.voice]];
  const sme = v ? { text: it.sme, src: v[0], dur: v[1], lang: "se" } : { text: it.sme, src: `audio/w/${it.list}-${it.k}-sme.ogg`, dur: it.d[1], lang: "se" };
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

const HJ_PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/></svg>';
// Kortti rakennetaan kerran ja vaiheiden välillä päivitetään vain tekstit ja kehä: koko kortin uudelleenpiirto
// välähti puhelimella joka vaiheessa (kysymys, laskenta, vastaus; Samsung 2026-11-19)
const HJ_SPEAK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="w1" d="M16.5 8.5a5 5 0 0 1 0 7"/><path class="w2" d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
function harjRenderRun() {
  const r = harjRun, it = r.deck[r.pos % r.deck.length];
  const [q, a] = harjSides(it, r.opts.dir);
  const shown = r.phase === "show", think = r.phase === "think";
  const el = $("harj");
  let card = el.querySelector(".hj-card");
  if (!card) {
    el.innerHTML = `<div class="hj-card hj-new" role="dialog" aria-modal="true" aria-label="${esc(t("harjTitle"))}">` +
      `<div class="hj-head"><span class="hj-li"></span><span class="hj-ln"></span><span class="hj-round"></span><span class="hj-pos"></span></div>` +
      `<div class="hj-prog"><span></span></div>` +
      `<div class="hj-say">${HJ_SPEAK}<span></span></div>` +
      `<div class="hj-clock" hidden></div>` +
      `<div class="hj-q"><span class="hj-digit"></span><span class="hj-qt"></span></div>` +
      `<div class="hj-ring" style="--think: ${r.opts.think}s">` +
      `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" pathLength="100"/><circle class="hj-arc" cx="50" cy="50" r="44" pathLength="100"/></svg>` +
      `<span class="hj-count" aria-live="off"></span></div>` +
      `<div class="hj-a" aria-live="polite"><span class="hj-at"></span><span class="hj-ask"></span></div>` +
      `<div class="hj-ctl">` +
      `<button type="button" data-act="stop" aria-label="${esc(t("stop"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg></button>` +
      `<button type="button" data-act="pause" class="hj-main"></button>` +
      `<button type="button" data-act="next" aria-label="${esc(t("harjNext"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5.5v13l9-6.5z" fill="currentColor"/><rect x="16" y="5.5" width="2.6" height="13" rx="1" fill="currentColor"/></svg></button>` +
      `</div>${harjAwakeSupported() ? `<button type="button" class="hj-awake" data-act="awake" aria-pressed="${harjAwakePref()}">` +
        `<span class="hj-sw" aria-hidden="true"></span><span>${esc(t("harjAwake"))}</span></button>` : ""}` +
      `${harjNative() ? `<p class="hj-note">${HJ_MOON}<span>${esc(t("harjScreenOff"))}</span></p>` : ""}` +
      `<button type="button" class="hj-report report-link" data-act="report"><span aria-hidden="true">⚑</span> ${esc(t("reportError"))}</button></div>`;
    card = el.querySelector(".hj-card");
    harjSetAwake(harjAwakePref());
  }
  const set = (sel, text) => { const n = card.querySelector(sel); if (n.textContent !== text) n.textContent = text; return n; };
  const n = r.deck.length, i = r.pos % n;
  // Otsikkorivi: aiheen kuvake ryhmän värillä, nimi, kierros ja sijainti; edistymispalkki
  const grp = harjGroup(it.list);
  card.style.setProperty("--tc", `var(--flag-${grp.color})`);
  card.style.setProperty("--tb", `var(--btn-${grp.color})`);
  const li = card.querySelector(".hj-li");
  if (li.dataset.id !== it.list) { li.innerHTML = harjIcon(it.list); li.dataset.id = it.list; }
  set(".hj-ln", harjTitle(it.list));
  set(".hj-round", r.round > 1 ? t("harjRound", r.round) : "").hidden = r.round < 2;
  set(".hj-pos", `${i + 1} / ${n}`);
  card.querySelector(".hj-prog span").style.width = `${Math.round(((i + (shown ? 1 : 0.5)) / n) * 1000) / 10}%`;
  // Kumpi kieli kuuluu nyt: kysymys ja vastaus; aaltoviivat liikkuvat soiton ajan
  const sayLang = shown ? a.lang : q.lang;
  const say = card.querySelector(".hj-say");
  set(".hj-say span", sayLang === "fi" ? t("harjHearFi") : t("harjHearSme"));
  say.classList.toggle("on", !r.paused && (r.phase === "ask" || shown));
  say.classList.toggle("sme", sayLang === "se");
  card.querySelector(".hj-q").lang = q.lang;
  const digit = set(".hj-digit", it.n && r.opts.dir === "fi" ? String(it.n) : "");
  digit.hidden = !digit.textContent;
  set(".hj-qt", q.text);
  // Kellonaika: analoginen kello kysymyksen yläpuolella
  const ck = card.querySelector(".hj-clock"), ckKey = it.list === "kello" ? `${it.h}:${it.m}` : "";
  if (ck.dataset.k !== ckKey) { ck.innerHTML = ckKey ? kelloSvg(it.h, it.m) : ""; ck.hidden = !ckKey; ck.dataset.k = ckKey; }
  const ring = card.querySelector(".hj-ring");
  // Kehän täyttö alkaa alusta vain laskennan alkaessa (uusi sana tai jatko tauolta)
  const key = think ? `${r.pos}:${r.paused}` : "";
  if (ring.dataset.run !== key) {
    ring.classList.remove("run");
    if (think) { void ring.offsetWidth; ring.classList.add("run"); }
    ring.dataset.run = key;
  }
  ring.classList.toggle("done", shown);
  set(".hj-count", shown ? "✓" : think ? String(r.count) : "?");
  // Vastaus: ennen paljastusta kysymys harmaana, sitten sana nousee esiin (animaatio vain paljastuksessa)
  const ans = card.querySelector(".hj-a");
  ans.lang = a.lang;
  if (ans.classList.contains("shown") !== shown) {
    ans.classList.toggle("shown", shown);
    if (shown) { ans.classList.remove("rise"); void ans.offsetWidth; ans.classList.add("rise"); }
  }
  set(".hj-at", shown ? a.text : "");
  set(".hj-ask", shown ? "" : r.opts.dir === "sme" ? t("harjAskFi") : t("harjAskSme"));
  const pb = card.querySelector('[data-act="pause"]');
  const label = r.paused ? t("harjResume") : t("harjPause");
  if (pb.getAttribute("aria-label") !== label) { pb.setAttribute("aria-label", label); pb.innerHTML = r.paused ? PLAY_ICON_HJ : HJ_PAUSE_ICON; }
  card.classList.toggle("paused", r.paused);
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

// Virheilmoitus näkyvästä sanasta: harjoitus tauolle, tiedoissa lista, molemmat puolet ja ääni
function harjReport() {
  const r = harjRun;
  if (!r) return;
  harjPause(true);
  const it = r.deck[r.pos % r.deck.length], [q, a] = harjSides(it, r.opts.dir);
  const sme = q.lang === "se" ? q : a, fi = q.lang === "se" ? a : q;
  openCtxReport({ place: "harj", word: sme.text, audio: true, lines: [
    ["list", `${harjTitle(it.list)} (${it.list})`], ["shown", fi.text], ["voice", settings.voice || ""],
  ] });
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
// Näyttö päällä harjoituksen ajan (valinta muistiin): Androidissa ikkunan FLAG_KEEP_SCREEN_ON, selaimessa Wake Lock
// -rajapinta (vapautuu itsestään, kun sivu menee taustalle, joten pyydetään uudelleen palatessa)
let harjWake = null;
const harjAwakePref = () => { try { return localStorage.getItem("satni-harj-awake") === "1"; } catch (e) { return false; } };
function harjSetAwake(on) {
  try {
    if (window.SatniApp?.keepScreenOn) { window.SatniApp.keepScreenOn(!!on); return; }
  } catch (e) { /* vanha sovellusversio */ }
  if (!on) { harjWake?.release().catch(() => {}); harjWake = null; return; }
  if (!harjWake && navigator.wakeLock && !document.hidden) {
    navigator.wakeLock.request("screen").then((w) => {
      if (!harjRun || !harjAwakePref()) { w.release().catch(() => {}); return; }
      harjWake = w; w.addEventListener("release", () => { if (harjWake === w) harjWake = null; });
    }).catch(() => {});
  }
}
const harjAwakeSupported = () => !!(window.SatniApp?.keepScreenOn || navigator.wakeLock);
function closeHarj() {
  const el = $("harj");
  if (!el || el.hidden) return false;
  harjSetAwake(false);
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
    else if (b.dataset.act === "report") harjReport();
    else if (b.dataset.act === "awake") {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      try { localStorage.setItem("satni-harj-awake", on ? "1" : "0"); } catch (err) { /* ei tallennusta */ }
      harjSetAwake(on);
    }
  });
  // Selaimen Wake Lock vapautuu taustalla: uudelleen, kun harjoitus on taas näkyvissä
  document.addEventListener("visibilitychange", () => { if (!document.hidden && harjRun && !el.hidden && harjAwakePref()) harjSetAwake(true); });
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
