"use strict";
/* Sátni FST – web-versio. Sama tietokanta kuin työpöytäversiossa (export_web_data.py), luetaan sql.js:llä.
   LÄHTEET (ks. CREDITS.md): sanakirjat GiellaLT (CC BY 4.0), taivutus GiellaLT lang-sme (GPL-3.0),
   ääntäminen Divvunin ja Giellateknon puhesynteesi, sql.js (MIT, vendor/LICENSE-sql.js.txt). */

const DATA_URL = "data/satni-web.db.gz";
// Divvunin ja Giellateknon puhesynteesi (UiT), käyttö sovittu Divvunin kanssa 2026-10-29
const TTS_URL = "https://api-giellalt.uit.no/tts/se/";
const VOICES = { "Biret": "biret", "Máhtte": "mahtte", "Sunná": "sunna" };
// Giellateknon Neahttadigisánit-sanakirja (sanit.oahpa.no): käännökset, analyysit, sanahistoria ja haku teksteistä
// (Korp). Käyttöliittymän kielen sanakirja: saame -> suomi tai saame -> norja. (Aiempi taivutusgeneraattori gtweb.uit.no
// toisti sovelluksen oman taulukon, eikä palvelin aina vastannut.)
const SANIT_URL = "https://sanit.oahpa.no/sme/{lang}/?lookup={word}";
// Haku muista lähteistä: sátni.org (Divvunin ja Giellateknon sanakirjat ja Giellagáldun termit)
const SATNI_URL = "https://satni.org/{word}";

// Käännöskielet (GiellaLT:n dict-sme-*-sanakirjat, espanja dict-sme-spa ja dict-spa-sme) ja niiden sarakkeet tietokannassa; main = pääkieli
// (suomi ja norja, joista on myös käänteinen sanakirja), muut näytetään valikossa omana ryhmänään.
// Kielten nimet ovat käyttöliittymän kielellä (i18n.js: langName, langIn).
const LANGUAGES = {
  fin: { col: "finnish_translation", main: true },
  nob: { col: "nob_translation", main: true },
  eng: { col: "eng_translation" },
  smn: { col: "smn_translation" },
  smj: { col: "smj_translation" },
  sma: { col: "sma_translation" },
  spa: { col: "spa_translation" },
};
const TRANS_COLS = Object.keys(LANGUAGES).map((l) => LANGUAGES[l].col).join(", ");

const PERSONS = ["Sg1", "Sg2", "Sg3", "Du1", "Du2", "Du3", "Pl1", "Pl2", "Pl3"];
const PRONOUNS = { Sg1: "mun", Sg2: "don", Sg3: "son", Du1: "moai", Du2: "doai", Du3: "soai", Pl1: "mii", Pl2: "dii", Pl3: "sii" };
// Kieltoverbin (ii) indikatiivi- ja imperatiivimuodot
const NEG_AUX = { Sg1: "in", Sg2: "it", Sg3: "ii", Du1: "ean", Du2: "eahppi", Du3: "eaba", Pl1: "eat", Pl2: "ehpet", Pl3: "eai" };
const NEG_AUX_IMPRT = { Sg1: "allon", Sg2: "ale", Sg3: "allos", Du1: "allu", Du2: "alli", Du3: "alloska", Pl1: "allot", Pl2: "allet", Pl3: "alloset" };
// Saamen koulukieliopin sijataulukko: genetiivi ja akkusatiivi samalla rivillä
const CASE_ROWS = [["Nom", ["Nom"]], ["Gen/Akk", ["Acc", "Gen"]], ["Ill", ["Ill"]], ["Lok", ["Loc"]], ["Kom", ["Com"]]];
// Nimet: i18n.js nonFiniteRows samassa järjestyksessä
const VERB_NONFINITE_TAGS = ["Inf", "PrfPrc", "PrsPrc", "Ger", "VGen", "VAbess", "Sup",
                             "Actio+Nom", "Actio+Loc", "Actio+Com", "Actio+Ess"];
const UNINFLECTED_POS = ["ADV", "CC", "CS", "INTERJ", "PCLE", "PO", "PR", "CMP", "MWE"];
const EXAMPLE_WORDS = ["dahkat", "áhčči", "viessu", "mannat", "buorre", "golbma", "juolgi", "oastit"];

const $ = (id) => document.getElementById(id);
let db = null;
const state = { query: "", results: [], index: 0, word: null, paradigm: null, grades: null, tab: "table" };

// --- Asetukset, historia ja suosikit (selaimen localStorage) ---

const DEFAULT_SETTINGS = {
  theme: "auto", voice: "Biret", uiLang: "fi", lang: "fin", showGrade: true, game: true, gameMute: false, gameSmn: false, history: [], favourites: [],
  // Muut kielet (asetus valikossa): niiden käännökset näkyvät sanakortissa pääkäännöksen lisäksi; oletuksena
  // ei yhtään. Hakuun ne eivät vaikuta.
  extraLangs: [],
  // Koltansaame Muut kielet -kohdassa (skoltFor): skolt = suomen/norjan hakusanan koltan vastineet,
  // skoltViaSme = myös pohjoissaamen sanakortissa suomennoksen kautta (likimääräinen). Ennen 0.9.4 kokeellinen exp.sms.
  skolt: false, skoltViaSme: false,
  // Kokeelliset ominaisuudet (valikon lopussa), kukin erikseen: ocr = kuvasta haku (Android-sovellus),
  // tableTr = muotojen käännökset taivutustaulukossa, apertium = Apertiumin norjan käännökset, pivotFin = suomennosehdotukset. experimental: vanha yhteinen kytkin (= ocr), siirretään exp.ocr:ään.
  exp: { ocr: false, lause: false, tableTr: false, apertium: false, pivotFin: false },
  // Kuvasta haku: suunta ("sme" = saamen teksti, "ui" = käyttöliittymän kielen teksti), merkintätapa ja väri
  ocrFrom: "sme", ocrTo: "", ocrStyle: "frame",
  // Valokuvahaun omat kielet (asetukset → Työkalut → Valokuvahaku): kuvan lisäkielet (inari, koltta) ja käännöskielet
  ocrLangs: [], ocrTargets: ["fin", "nob", "sme"], ocrColor: "#2563eb",
  // Tekstin koko (Asetukset → Kieli ja ulkoasu): "system" = laitteen tekstikoko (Android: fontScale), muuten prosentti
  textSize: "system",
  // Astevaihtelun merkintä: värit (GRADE_COLORS) ja alleviivaus (vahva yhtenäinen, heikko katkoviiva)
  gradeGd: "green", gradeHd: "orange", gradeUnderline: false,
};
// Ensimmäinen käynnistys: asetuksia ei ole vielä tallennettu, joten kysytään käyttöliittymän kieli
const FIRST_RUN = (() => { try { return localStorage.getItem("satni-settings") === null; } catch (e) { return false; } })();
let settings = loadSettings();

function loadSettings() {
  try {
    return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem("satni-settings") || "{}"));
  } catch (e) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}
function saveSettings() {
  try { localStorage.setItem("satni-settings", JSON.stringify(settings)); } catch (e) { /* yksityinen tila */ }
}

// --- Käyttöliittymän kieli (i18n.js) ---

function t(key, ...args) {
  const texts = UI_TEXTS[settings.uiLang] || UI_TEXTS.fi;
  const value = key in texts ? texts[key] : UI_TEXTS.fi[key];
  return typeof value === "function" ? value(...args) : value;
}
const langName = (lang) => t("langName")[lang];

// Hakukentän paikkamerkki: pisin vaihtoehto, joka mahtuu kenttään nykyisellä leveydellä ja tekstikoolla (yötesti
// 2026-11-15: 1080 px:n puhelimissa "…käännöksellä tai t"). Mitataan kentän omalla fontilla; uudelleen kun leveys,
// tekstikoko tai kieli muuttuu.
function fitSearchPlaceholder() {
  const inp = $("search");
  if (!inp || !inp.clientWidth) return;
  const cs = getComputedStyle(inp);
  const avail = inp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
  const ctx = fitSearchPlaceholder.ctx || (fitSearchPlaceholder.ctx = document.createElement("canvas").getContext("2d"));
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const options = [t("searchPlaceholder"), t("searchPlaceholderMid"), t("searchPlaceholderShort")];
  inp.placeholder = options.find((text) => ctx.measureText(text).width <= avail) || options[options.length - 1];
}
let fitPlaceholderTimer = null;
const refitSearchPlaceholder = () => { clearTimeout(fitPlaceholderTimer); fitPlaceholderTimer = setTimeout(fitSearchPlaceholder, 120); };
window.addEventListener("resize", refitSearchPlaceholder);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitSearchPlaceholder);

// index.html:n data-i18n-merkityt tekstit
function applyStaticTexts() {
  document.documentElement.lang = settings.uiLang;
  document.title = t("title");
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-html]")) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) el.placeholder = t(el.dataset.i18nPlaceholder);
  refitSearchPlaceholder();
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll("[data-i18n-title]")) el.title = t(el.dataset.i18nTitle);
  // Android- ja työpöytäsovelluksessa sanakirja tulee paketista (APK:n assets, AppImage/exe), ei verkosta
  if (IS_ANDROID || IS_DESKTOP) $("loading-text").textContent = t("loadingLocal");
  // Versionumeron antaa työpöytäsovellus (satni_desktop.py) tai Android-sovellus (android/); selainversiolle
  // julkaise_sivu.sh kirjoittaa julkaisun numeron (<meta name="satni-web-version">)
  const version = window.SATNI_VERSION;
  const webVersion = document.querySelector('meta[name="satni-web-version"]')?.content || window.SATNI_WEB_VERSION;
  $("about-version").textContent = !version ? t("aboutWeb", webVersion)
    : window.SATNI_PLATFORM === "android" ? t("aboutAndroid", version) : t("aboutDesktop", version);
  $("menu-version").textContent = $("about-version").textContent;
  // Kehitysversio (build_apk.sh --debug: versio päättyy -DEV): nimeen "DEV", ettei sitä sekoita julkaistuun
  const dev = /-DEV$/.test(version || "");
  for (const el of document.querySelectorAll(".brand-name, .menu-name")) {
    el.innerHTML = `Sátni FST${dev ? ' <span class="dev-tag">DEV</span>' : ""}`;
  }
  if (dev && !document.title.endsWith(" DEV")) document.title = document.title.replace("Sátni FST", "Sátni FST DEV");
  // Sähköpostin aiheessa versio, jotta palautteesta näkee, mitä versiota se koskee
  $("feedback-mail").href = "mailto:satni@somby.fi?subject=" +
    encodeURIComponent(`${t("feedbackSubject")} (${$("about-version").textContent})`);
  $("random-btn").textContent = t("randomWord");
  renderExtraLangs();

  // Käyttöliittymän kieli valikossa ja aloitussivulla
  const langButtons = Object.entries(UI_LANGUAGES).map(([code, l]) =>
    `<button role="radio" aria-checked="${code === settings.uiLang}" data-lang="${code}"` +
    `${code === settings.uiLang ? ' class="active"' : ""}>${FLAGS[code]}<span>${esc(l.name)}</span></button>`).join("");
  $("welcome-lang").innerHTML = langButtons;
  $("drawer-lang").innerHTML = langButtons;
  renderVoiceList();
}

// Äänet valikossa: valinta ja 🔈-näyte, sama lause kaikilla äänillä. Näytteet ovat sovelluspaketissa
// (web/voices/, hae_aaninaytteet.sh), joten ne toimivat ilman verkkoyhteyttä; jos tiedostoa ei ole, näyte haetaan
// Divvunin puhesynteesistä ja tallennetaan laitteelle kuten muutkin ääntämiset (speak).
const VOICE_SAMPLE = "Bures boahtin Sápmái";
async function playVoiceSample(name, button) {
  try {
    const signal = startTtsRequest();
    const res = await fetch(`voices/${VOICES[name]}.wav`, { signal });
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    if (!signal.aborted) await playTtsBlob(blob);
  } catch (e) {
    if (e.name !== "AbortError") await speak(VOICE_SAMPLE, button, name);
  }
}
function renderVoiceList() {
  $("voice-list").innerHTML = Object.keys(VOICES).map((name) =>
    `<div class="voice-row"><label><input type="radio" name="voice" value="${name}"` +
    `${name === settings.voice ? " checked" : ""}> ${esc(name)}</label>` +
    `<button class="sample-btn" data-voice="${name}" aria-label="${esc(t("listenTo", name))}" ` +
    `title="${esc(VOICE_SAMPLE)}">🔈</button></div>`).join("");
}

// Ensimmäinen käynnistys: valitaan suomi tai norja (ääni on oletus Biret, vaihdettavissa valikosta)
function showFirstRun() {
  $("first-run-lang").innerHTML = Object.entries(UI_LANGUAGES).map(([code, l]) =>
    `<button data-lang="${code}">${FLAGS[code]}<span>${esc(l.name)}</span></button>`).join("");
  $("first-run-lang").onclick = (e) => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    setUiLanguage(b.dataset.lang);
    $("first-run").close();
  };
  $("first-run").showModal();
}

// Kertavihje valikosta uusille ja päivittäville käyttäjille. Sulkeutuu napautuksesta, näppäilystä tai 10 sekunnissa.
// Lasketaan nähdyksi vasta, kun se on ollut näkyvissä 3 sekuntia; muuten se näytetään uudelleen seuraavalla kerralla.
function showMenuTip() {
  try {
    if (localStorage.getItem("satni-menu-tip")) return;
  } catch (e) {
    return;  // yksityinen tila: ei näytetä joka käynnistyksellä
  }
  if ($("first-run").open) {  // ensin kielen valinta, jotta vihje on oikealla kielellä
    $("first-run").addEventListener("close", showMenuTip, { once: true });
    return;
  }
  const btn = $("sidebar-toggle");
  if (!btn.getClientRects().length) return;  // alapalkki käytössä: valikko on nimetty Lisää-painike
  const tip = $("menu-tip");
  const r = btn.getBoundingClientRect();
  tip.textContent = t("menuTip");
  tip.style.top = `${r.bottom / pageZoom() + 10}px`;
  tip.style.left = `${r.left / pageZoom()}px`;
  tip.hidden = false;
  btn.classList.add("menu-tip-target");
  const seen = setTimeout(() => {
    try { localStorage.setItem("satni-menu-tip", "1"); } catch (e) { /* yksityinen tila */ }
  }, 3000);
  const close = () => {
    clearTimeout(seen);
    clearTimeout(timeout);
    tip.hidden = true;
    btn.classList.remove("menu-tip-target");
    for (const type of ["pointerdown", "keydown", "input"]) document.removeEventListener(type, onUse, true);
  };
  const timeout = setTimeout(close, 10000);
  const onUse = () => close();
  for (const type of ["pointerdown", "keydown", "input"]) document.addEventListener(type, onUse, true);
}

// Valikon sulkeminen: taustan napautus, Esc tai Android-sovelluksen takaisin-ele (MainActivity.goBackOrFinish)
function closeDrawer() {
  const open = document.body.classList.contains("sidebar-open");
  document.body.classList.remove("sidebar-open");
  return open;
}

// Selaimen ja puhelimen Takaisin verkkoversiossa (PWA): jokainen avoin kerros (Sanastot/Minipeli/Lausekääntäjä,
// sanastolista, käynnissä oleva peli, kupla, lauseen valikko ja kortti, ikkuna) saa oman historiamerkintänsä
// (sama osoite, state.satniOverlay + satniDepth = kerrosten määrä), ja Takaisin sulkee yhden kerroksen kerrallaan
// samalla ketjulla kuin Androidin takaisin-ele. Merkinnät lisätään vain käyttäjän napautuksen tai näppäilyn jälkeen
// (syncOverlayHistory), koskaan popstate-käsittelijässä: Chrome merkitsee ilman eleaktivointia lisätyn merkinnän
// edellisen merkinnän ohitettavaksi, ja seuraava Takaisin poistui silloin sovelluksesta (yötesti 2026-11-14).
// Painikkeella, Escillä tai napautuksella suljettu kerros poistaa merkintänsä (history.go(-n)), ettei seuraava
// Takaisin tunnu tekevän mitään. Androidissa MainActivity hoitaa takaisin-eleen itse, joten siellä historiaan ei
// lisätä mitään.
const OVERLAY_HISTORY = location.hostname !== "appassets.androidplatform.net";
let overlayPops = 0;          // omat history.go()-kutsut, joiden popstate ohitetaan
let overlayPopping = false;   // Takaisin käsittelyssä: kerroksen sulkeminen ei poista merkintää uudelleen
const afterOverlayPop = [];
const overlayLayerFns = [];   // näkymäkohtaiset kerrokset (sanastot.js, minipeli.js, lauseet.js)
const isOverlayState = (s) => !!(s && s.satniOverlay);
const overlayDepth = (s) => (isOverlayState(s) ? s.satniDepth || 1 : 0);
const overlayViewOpen = () => ["peli-view", "sanasto-view", "lause-view", "settings-view"].some((id) => $(id) && !$(id).hidden);
// Myös valikko (drawer) ja aloitussivun ikkunat (Tietoa, palaute, tuki) ovat kerroksia: ilman omaa merkintää Takaisin
// valikon ollessa auki poistui Chromessa sovelluksesta (yötesti 2026-11-15)
const drawerOpen = () => document.body.classList.contains("sidebar-open");
const overlayOpen = () => overlayViewOpen() || drawerOpen() || !!document.querySelector("dialog[open]");
function overlayLayers() {
  if (!overlayOpen()) return 0;
  return (overlayViewOpen() ? 1 : 0) + overlayLayerFns.reduce((n, f) => n + f(), 0) + (formPopTarget ? 1 : 0) +
    (document.querySelector("dialog[open]") ? 1 : 0) + (drawerOpen() ? 1 : 0);
}
// Päällimmäinen avoin ikkuna kiinni (Takaisin verkkoversiossa)
function closeTopDialog() {
  const open = [...document.querySelectorAll("dialog[open]")];
  if (!open.length) return false;
  open[open.length - 1].close();
  return true;
}
// Historia vastaamaan avoimia kerroksia: enintään yksi uusi merkintä elettä kohden (jokainen kerros avataan omalla
// napautuksellaan); suljetut kerrokset poistetaan historiasta. trimOnly: vain poisto (Takaisin-käsittelyn jälkeen,
// jolloin eleaktivointia ei ole)
function syncOverlayHistory(trimOnly) {
  if (!OVERLAY_HISTORY || overlayPops > 0 || overlayPopping) return;
  const depth = overlayDepth(history.state), layers = overlayLayers();
  if (layers > depth) { if (!trimOnly) history.pushState({ satniOverlay: true, satniDepth: depth + 1 }, ""); }
  else if (layers < depth) { overlayPops++; history.go(layers - depth); }
}
let overlaySyncQueued = false;
function queueOverlaySync() {
  if (!OVERLAY_HISTORY || overlaySyncQueued) return;
  overlaySyncQueued = true;
  // Kaikkien käsittelijöiden jälkeen (myös näkymien omat napautuskäsittelijät); eleaktivointi on yhä voimassa
  setTimeout(() => { overlaySyncQueued = false; syncOverlayHistory(); }, 0);
}
function overlayOpened() { queueOverlaySync(); }
function overlayClosed() { if (!overlayPopping) syncOverlayHistory(); }
// Historiaan lisääminen heti näkymän sulkemisen jälkeen (pelin Koti): vasta kun oma history.go() on valmis
function whenOverlayHistoryIdle(fn) {
  if (overlayPops > 0) afterOverlayPop.push(fn); else fn();
}
function onPopState(e) {
  if (overlayPops > 0) {
    overlayPops--;
    e.stopImmediatePropagation();
    if (!overlayPops) afterOverlayPop.splice(0).forEach((fn) => fn());
    return;
  }
  if (OVERLAY_HISTORY && overlayOpen() && overlayLayers() > overlayDepth(e.state)) {
    e.stopImmediatePropagation();  // osoite ei muuttunut: ei korttia uudelleen eikä sanastojen/lauseen paluuta
    overlayPopping = true;
    try {
      // Yleensä yksi kerros; useampi, jos merkintöjä on vähemmän kuin kerroksia (esim. kaksi kerrosta yhdellä eleellä)
      for (let i = 0; i < 8 && overlayLayers() > overlayDepth(e.state); i++) {
        if (!(closeTopDialog() || closeFormPop() || (window.closeOcr && closeOcr()) || closeDrawer())) break;
      }
    } finally { overlayPopping = false; }
    syncOverlayHistory(true);  // ei koskaan uutta merkintää tässä (Chromen historiainterventio), vain ylimääräisten poisto
    return;
  }
  if (OVERLAY_HISTORY && overlayOpen() && isOverlayState(e.state)) { e.stopImmediatePropagation(); syncOverlayHistory(true); return; }
  routeFromHash();
  // Sanakortilta takaisin näkymään (sanastot.js, lauseet.js avaavat näkymän omissa popstate-käsittelijöissään):
  // kerroksia voi olla vähemmän kuin merkintöjä
  if (OVERLAY_HISTORY) setTimeout(() => syncOverlayHistory(true), 0);
}

// Muut kielet valikossa: valittujen kielten käännökset näytetään sanakortissa (renderExtraTranslations)
// Koltansaame eteläsaamen jälkeen omana kytkimenään: merkintä "tarkistamaton", ja päällä ollessa sen alla valinta
// pohjoissaamen sanakorteille (suomennoksen kautta)
function renderExtraLangs() {
  // Kielen nimen alla käännösten lähde (Asetukset → Käännöskielet)
  const src = (l) => (t("langSource") || {})[l] ? `<span class="muted small">${esc(t("langSource")[l])}</span>` : "";
  const row = (l) => `<label class="switch-row"><span class="switch-text"><span>${esc(capitalize(langName(l)))}</span>${src(l)}</span>` +
    `<input type="checkbox" class="switch" role="switch" value="${l}"${settings.extraLangs.includes(l) ? " checked" : ""}></label>`;
  const skolt = `<label class="switch-row"><span class="switch-text"><span>${esc(capitalize(langName("sms")))}` +
    `<span class="unchecked-badge">${esc(t("smsUnchecked"))}</span></span>${src("sms")}</span>` +
    `<input type="checkbox" class="switch" role="switch" data-skolt="on"${settings.skolt ? " checked" : ""}></label>` +
    (settings.skolt ? `<label class="skolt-sub"><input type="checkbox" data-skolt="via"${settings.skoltViaSme ? " checked" : ""}>` +
      `<span>${esc(t("skoltViaShort"))}</span></label>` : "");
  const langs = Object.keys(LANGUAGES).filter((l) => !LANGUAGES[l].main);
  const at = langs.includes("sma") ? langs.indexOf("sma") + 1 : langs.length;
  $("extra-langs").innerHTML = [...langs.slice(0, at).map(row), skolt, ...langs.slice(at).map(row)].join("");
}

// --- Virheilmoitus sanakortista ---
// Lomake valmistelee sähköpostin osoitteeseen satni@somby.fi käyttäjän omaan sovellukseen (mailto; Android-sovellus
// avaa oletussovelluksen, MainActivity.shouldOverrideUrlLoading). Mitään ei lähetetä automaattisesti.
const REPORT_ADDRESS = "satni@somby.fi";
const PUBLIC_APP_URL = "https://sombyduodji.github.io/satni-fst/app/";

// Sanakortissa näkyvät kielet ja niiden käännökset: pääkieli, Muut kielet ja koltansaame
function reportLanguages() {
  const w = state.word;
  const out = [[settings.lang, $("translation").textContent.trim()]];
  for (const l of settings.extraLangs) {
    const text = LANGUAGES[l] && w[LANGUAGES[l].col];
    if (text) out.push([l, text]);
  }
  const sms = skoltFor(w);
  if (sms) out.push(["sms", sms.text]);
  return out;
}

function openReport() {
  if (!state.word) return;
  const langs = reportLanguages();
  $("report-lang").innerHTML = langs.map(([l]) => `<option value="${l}">${esc(langName(l))}</option>`).join("");
  $("report-about").textContent = `${shownLemma(state.word)} (${$("pos-badge").textContent}) · ` +
    `${t("reportLabels").search}: ${state.query}`;
  $("report-text").value = "";
  $("report-dlg").classList.remove("list-mode", "game-mode");
  $("report-dlg").querySelector('input[value="trans"]').checked = true;
  $("report-dlg").showModal();
}

function sendReport() {
  if ($("report-dlg").classList.contains("game-mode")) return peliSendReport();  // minipeli (minipeli.js)
  if ($("report-dlg").classList.contains("list-mode")) return sanastoSendReport();  // sanastolista (sanastot.js)
  const w = state.word, L = t("reportLabels");
  const kind = $("report-dlg").querySelector('input[name="report-kind"]:checked').value;
  const lang = $("report-lang").value || settings.lang;
  const shown = Object.fromEntries(reportLanguages())[lang] || "";
  const kindText = { trans: t("reportKindTrans"), word: t("reportKindWord"), form: t("reportKindForm"), other: t("reportKindOther") }[kind];
  const lemma = shownLemma(w);
  const subject = `${t("reportSubject")} – ${lemma} (${t("reportSubjectKind")[kind]}${kind === "trans" ? ", " + langName(lang) : ""})`;
  const others = [...settings.extraLangs.filter((l) => LANGUAGES[l]), ...(settings.skolt ? ["sms"] : [])].map(langName);
  const link = `${PUBLIC_APP_URL}#/sana/${encodeURIComponent(state.query)}${state.index ? "/" + state.index : ""}`;
  const body = [
    $("report-text").value.trim().slice(0, 1200), "",
    `--- ${t("reportDetails")} ---`,
    `${L.error}: ${kindText}${kind === "trans" ? ` (${langName(lang)})` : ""}`,
    `${L.word}: ${lemma} (${w.pos})`,
    kind === "trans" && shown ? `${L.shown}: ${shown}` : "",
    `${L.search}: ${state.query}`,
    `${L.ui}: ${UI_LANGUAGES[settings.uiLang].name}${others.length ? ` · ${L.other}: ${others.join(", ")}` : ""}`,
    `${L.version}: ${$("about-version").textContent}`,
    `${L.link}: ${link}`,
  ].filter((line, i) => line !== "" || i === 1).join("\n");
  openReportMail(subject, body);
}

// Linkki napsautetaan, jotta sähköpostisovellus avautuu samoin kuin palautelinkissä (myös työpöytä- ja Android-sovelluksessa)
function openReportMail(subject, body) {
  $("report-dlg").close();
  const a = document.createElement("a");
  a.href = `mailto:${REPORT_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  a.click();
}

function setSkolt(on, viaSme) {
  settings.skolt = on;
  settings.skoltViaSme = on && viaSme;  // pois kytkettäessä molemmat pois
  saveSettings();
  renderExtraLangs();
  if (state.results.length) searchAgainKeepingWord();
}

// Päälle vasta, kun käyttäjä hyväksyy varoituksen; valinta pohjoissaamen sanakorteille alkaa tyhjänä
function openSkoltDialog() {
  $("skolt-via").checked = false;
  $("skolt-dlg").showModal();
}

// Käännökset ovat aina käyttöliittymän kielellä (suomi -> suomi, norsk -> norja)
function setUiLanguage(code) {
  if (!UI_LANGUAGES[code]) return;
  settings.uiLang = code;
  settings.lang = UI_LANGUAGES[code].translationLang;
  saveSettings();
  applyStaticTexts();
  applyExperimental();
  renderSidebar();
  // Vain kun sanakortti on näkyvissä: etusivulla kielen vaihto ei saa avata edellistä sanaa
  if (db && state.query && !$("word").hidden) searchAgainKeepingWord();
}

// Kielen vaihto muuttaa tulosten järjestystä (ks. queryDatabase): itse valittu sana pysyy valittuna,
// muuten näytetään uusi ensimmäinen tulos
function searchAgainKeepingWord() {
  const id = state.index ? state.results[state.index]?.id : undefined;
  const index = queryDatabase(state.query).findIndex((r) => r.id === id);
  search(state.query, Math.max(index, 0), false);
}

// --- Apufunktiot ---

// Haussa ä = æ ja ö = ø (norjalaiset nimet, esim. Bjørg)
const fold = (s) => (s || "").toLowerCase().replace(/æ/g, "ä").replace(/ø/g, "ö");
// Haettava teksti: yhdistetyt merkit (PDF:stä tai macOS:stä liitetty c + hattu -> č) ja näkymättömät merkit
// (tavutusviiva, leveydettömät välit) pois, muuten oikein kirjoitettu sana ei löydy (sanakirja on NFC-muodossa)
// Haun merkkien siivous: NFC (PDF:stä liitetty ä), näkymättömät merkit ja suuntamerkit (LRM/RLM, upotukset) pois,
// kaarevat heittomerkit (’ ‘ ʼ) tavalliseksi ':ksi (saamen taivutusmuodot, bággogask'oapmi) ja sanan sisäinen
// ajatusviiva yhdysmerkiksi (TV–fálaldat). Päivätesti 2026-11-14.
const cleanQuery = (s) => (s || "").normalize("NFC").replace(/[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
  .replace(/[\u2018\u2019\u02BC]/g, "'").replace(/(?<=\p{L})[\u2010\u2011\u2013\u2014](?=\p{L})/gu, "-");
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nordic = (s) => s.replace(/ä/g, "æ").replace(/ö/g, "ø");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const splitList = (s) => (s || "").split(",").map((p) => p.trim()).filter(Boolean);

// Loukkaavat, halventavat ja alatyyliset käännössanat (taulu register, Wiktionaryn merkinnät käsin tarkistettuina,
// wiktionary_eng.py: register_rows): sanakortissa ja merkityksissä sanan perään merkintä, esim. "vittu (alatyylinen)"
let registerTags = null;
function registerTag(lang, term) {
  if (!registerTags) {
    registerTags = new Map();
    try {
      for (const r of all("SELECT lang, term, tag FROM register")) registerTags.set(`${r.lang}|${r.term}`, r.tag);
    } catch (e) { /* vanha tietokanta ilman taulua */ }
  }
  return registerTags.get(`${lang}|${term.replace(/\s*\([^)]*\)/g, "").trim()}`) || null;
}
// Pilkuilla erotettu käännöslista HTML:ksi merkintöineen; pilkut sulkeiden sisällä eivät erota (naida (kerran, joskus))
function labelledList(text, lang) {
  return String(text || "").split(/,\s*(?![^()]*\))/).map((item) => {
    const tag = registerTag(lang, item);
    return esc(item) + (tag ? ` <span class="reg-label reg-${tag}" title="${esc(t("registerNote"))}">${esc(t("register")[tag])}</span>` : "");
  }).join(", ");
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function toast(text, ms = 3500) {
  const el = $("toast");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), ms);
}

// Vain valitun kielen käännös (muut kielet näkyvät Merkitykset-välilehdellä omina ryhminään)
function translationOf(row, max, lang = settings.lang) {
  return splitList(row[LANGUAGES[lang].col]).slice(0, max).join(", ");
}

// Merkitykset kielittäin, valittu kieli ensin
function meaningsByLanguage(meanings) {
  const groups = Object.keys(LANGUAGES).map((lang) => [lang, meanings.filter((m) => m.lang === lang)]).filter(([, ms]) => ms.length);
  return groups.sort(([a], [b]) => (b === settings.lang) - (a === settings.lang));
}

function wordClassLabel(pos, subtype) {
  let label = t("pos")[(pos || "").toUpperCase()] || pos;
  if (subtype) label += " · " + (t("subtype")[subtype] || subtype);
  return label;
}

// --- Tietokannan lataus ---

let sqlModule = null;  // sql.js: myös inarin ja koltan erillisille tietokannoille (loadMinor)
async function loadDatabase() {
  const SQL = sqlModule = await initSqlJs({ locateFile: (f) => "vendor/" + f });
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(t("loadFailed", response.status));

  // Ladataan ja puretaan virtana: pakattua tiedostoa (~49 Mt) ei pidetä muistissa kokonaisena, joten latauksen
  // muistihuippu on puretut palat + yhdistetty tietokanta (~2 × 156 Mt) eikä ~410 Mt. Edistymispalkki seuraa
  // pakattuja tavuja (content-length).
  const total = Number(response.headers.get("content-length")) || 0;
  const reader = response.body.getReader();
  const first = await reader.read();
  if (first.done) throw new Error(t("loadFailed", 0));
  let received = 0;
  const counted = new ReadableStream({
    start(ctrl) { ctrl.enqueue(first.value); received = first.value.length; },
    async pull(ctrl) {
      const { done, value } = await reader.read();
      if (done) { $("loading-text").textContent = t("unpacking"); ctrl.close(); return; }
      received += value.length;
      if (total) $("progress-bar").style.width = `${Math.round((received / total) * 90)}%`;
      ctrl.enqueue(value);
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  // Palvelin voi jo purkaa gzipin (Content-Encoding); puretaan vain jos tiedosto on yhä pakattu
  const gz = first.value[0] === 0x1f && first.value[1] === 0x8b;
  const out = (gz ? counted.pipeThrough(new DecompressionStream("gzip")) : counted).getReader();
  let chunks = [], size = 0;
  for (;;) {
    const { done, value } = await out.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  chunks = null;
  $("progress-bar").style.width = "100%";
  return new SQL.Database(bytes);
}

// --- Haku ---

// Haku löytää pohjoissaamen sanat ja muodot sekä käännökset suomeksi tai norjaksi (käyttöliittymän kieli). Muut kielet
// -asetuksessa valittujen kielten (englanti, inarin-, luulajan-, eteläsaame, espanja) käännöksillä löytyy vasta niiden
// jälkeen (rank 6.5), joten ne eivät peitä pohjoissaamen muotoja (lea = leahkit eikä luulajansaamen lea).
const COMMON_WORD = 50000;  // korpusfrekvenssi, jota yleisemmän sanan taivutusmuoto menee käännösten edelle

// Uudemman tietokannan rakenteet (export_web_data.py 2026-11-13: nob_items, *_form_alt, paradigms.ord). Tarkistetaan
// kerran; PWA:n välimuistissa voi vielä olla vanha tietokanta, jolloin käytetään vanhoja (hitaampia) kyselyjä.
const dbHas = {};
function hasTable(name) {
  if (!db) return false;  // ei vielä ladattu: ei myöskään tallenneta vastausta
  if (!(name in dbHas)) dbHas[name] = all("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?", [name]).length > 0;
  return dbHas[name];
}
let paradigmOrder = null;  // "p.ord" (WITHOUT ROWID -taulu) tai vanhassa tietokannassa "p.rowid"
function paradigmOrderBy() {
  if (paradigmOrder === null) paradigmOrder = all("PRAGMA table_info(paradigms)").some((c) => c.name === "ord") ? "p.ord" : "p.rowid";
  return paradigmOrder;
}
// Käännöslistan sanat yksitellen (fin_items, nob_items): rajaa trans_search-rivit indeksillä ennen LIKE-ehtoja, jolloin
// koko taulua (216 000 riviä) ei käydä läpi (sql.js noin 20 -> 0,2 ms). Ei pilkkua: sillä vanha tapa.
const itemsTableFor = (lang, q) => (q && !q.includes(",") && hasTable(`${lang}_items`) ? `${lang}_items` : null);

// Ihmistä tarkoittavien substantiivien merkintä (semantics.py) on vain uudemmassa tietokannassa
let humanColumn = null;
function hasHumanColumn() {
  if (humanColumn === null) humanColumn = all("PRAGMA table_info(dictionary)").some((c) => c.name === "human");
  return humanColumn;
}

// Käännöslistan osuma (q on koko lista, sen ensimmäinen tai jokin muu pilkulla erotettu sana). instr-esisuodatin on
// sama ehto kuin LIKE-ehdot (fold ja q ovat pienaakkosin) mutta nopeampi: trans_search käydään läpi 40 % nopeammin
// (sql.js 28 -> 16 ms). % ja _ ovat tavallisia merkkejä (ESCAPE, likeEsc), eivät LIKE-jokerimerkkejä (yötesti 2026-11-14:
// haku % palautti satunnaisia sanoja).
const likeEsc = (s) => s.replace(/[\\%_]/g, "\\$&");
const TRANS_MATCH = "(? OR instr(t.fold, ?)) AND (t.fold = ? OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\')";
const transMatchParams = (q) => { const e = likeEsc(q); return [0, q, q, `${e},%`, `%, ${e},%`, `%, ${e}`]; };

// Jokerihaku: * = mitä tahansa kirjaimia (myös ei yhtään), ? = yksi kirjain (á?bmogis -> álbmogis, *ortnega).
// Vain saamen perusmuodot ja taivutusmuodot; yksi rivi sanaa kohden (perusmuoto, jos se täsmää, muuten yleisin
// täsmäävä muoto), yleisin sana ensin. Vähintään kaksi kirjainta, ettei pelkkä * luettele koko sanakirjaa.
const WILD_LIMIT = 100;
const isWildcard = (query) => /[*?]/.test(query) && query.replace(/[*?\s]/g, "").length >= 2;
function wildcardQuery(query) {
  const pat = fold(query.trim()).replace(/[[\]]/g, "");
  const cols = `id, sme_lemma, pos, subtype, freq, ${TRANS_COLS}${hasHumanColumn() ? ", human" : ""}, dial_same`;
  // Isolla alkava muoto (nimet) vain, jos kuvio alkaa kirjaimella: *- ja ?-alkuinen kuvio on sama isolla, ja toinen
  // GLOB samalle riville lukisi taulun turhaan kahdesti (yötesti 2026-11-18: OnePlus Nord *ortnega 2,7 s -> 1,6 s haussa)
  const cap = capitalize(pat), caps = cap !== pat;
  const rows = all(`SELECT d.${cols.split(", ").join(", d.")}, x.v AS wild FROM (
      SELECT word_id AS id, surface AS v FROM paradigms WHERE surface GLOB ?${caps ? " OR surface GLOB ?" : ""}
      UNION SELECT id, sme_lemma FROM dictionary WHERE lemma_fold GLOB ?) x JOIN dictionary d ON d.id = x.id
    ORDER BY d.freq DESC, d.id LIMIT 2000`, caps ? [pat, cap, pat] : [pat, pat]);
  const byId = new Map();
  for (const r of rows) {
    const prev = byId.get(r.id);
    if (!prev) byId.set(r.id, { ...r, rank: 1 });
    else if (fold(r.wild) === fold(r.sme_lemma)) prev.wild = r.wild;
  }
  return [...byId.values()].slice(0, WILD_LIMIT);
}

// *- tai ?-alkuinen kuvio ei voi käyttää hakemistoa ja lukee koko paradigms-taulun (1,5 milj. riviä): OnePlus Nordilla
// 2-7 s (yötesti 2026-11-18). Haku luetaan siksi paloina sanan id:n mukaan (pääavain word_id, ord) ja jokaisen palan
// välissä selain saa piirtää ja käyttäjä kirjoittaa: hakukenttää voi muokata, uusi haku peruu tämän ja tilarivi näyttää
// edistymisen. Tulos on sama kuin wildcardQuery:llä, paitsi että hyvin laajassa kuviossa näytetään aina 100 yleisintä
// sanaa (wildcardQuery: 2 000 yleisintä täsmäävää riviä ennen sanoittain yhdistämistä).
let searchRun = 0;
const WILD_CHUNK = 1000;  // sanaa palassa: noin 19 000 muotoa, OnePlus Nordilla ~27 ms
// Vuoro selaimelle ilman setTimeoutin 4 ms:n minimiä (MessageChannel); syöte ja piirto käsitellään palojen välissä
const wildChannel = new MessageChannel(), wildWaiting = [];
wildChannel.port1.onmessage = () => wildWaiting.shift()?.();
const isSlowWildcard = (query) => isWildcard(query) && /^\s*[*?]/.test(query);
let wildFreq = null;  // id -> freq, luetaan ensimmäisellä jokerihaulla
function setSearchBusy(query, share) {
  const el = $("search-busy");
  if (query === null) { el.hidden = true; return; }
  el.querySelector(".search-busy-text").textContent = t("wildSearching", query);
  el.querySelector(".search-busy-bar").style.width = `${Math.round(share * 100)}%`;
  el.hidden = false;
}
async function wildcardSearch(query, index, pushHistory, run) {
  const pat = fold(query.trim()).replace(/[[\]]/g, "");
  const yieldNow = () => new Promise((r) => { wildWaiting.push(r); wildChannel.port2.postMessage(0); });
  setSearchBusy(query, 0);
  await yieldNow();
  if (run !== searchRun) return;
  if (!wildFreq) {
    wildFreq = new Map();
    const st = db.prepare("SELECT id, freq FROM dictionary");
    while (st.step()) { const [id, f] = st.get(); wildFreq.set(id, f); }
    st.free();
  }
  const hits = new Map();  // id -> pienin täsmäävä muoto
  const max = all("SELECT MAX(id) AS m FROM dictionary")[0].m;
  // Sanoittain jo SQLitessä (pääavaimen järjestys, ei lajittelua): laajassa kuviossa (*ii*) JS:ään tulee sana eikä joka muoto
  const st = db.prepare("SELECT word_id, MIN(surface) FROM paradigms WHERE word_id >= ? AND word_id < ? AND surface GLOB ? GROUP BY word_id");
  const lt = db.prepare("SELECT id, sme_lemma FROM dictionary WHERE id >= ? AND id < ? AND lemma_fold GLOB ?");  // perusmuoto voittaa
  try {
    // Palat kootaan noin 80 ms:n viipaleiksi ennen vuoroa selaimelle: liian tiheä vuorottelu (joka pala erikseen) lisäsi
    // OnePlus Nordilla piirtoja niin, että *ortnega kesti 3,6 s, vaikka itse luku vie 2,1 s
    let slice = performance.now();
    for (let lo = 0; lo <= max; lo += WILD_CHUNK) {
      st.bind([lo, lo + WILD_CHUNK, pat]);
      while (st.step()) {
        const [id, v] = st.get();
        hits.set(id, v);
      }
      st.reset();
      lt.bind([lo, lo + WILD_CHUNK, pat]);
      while (lt.step()) { const [id, v] = lt.get(); hits.set(id, v); }
      lt.reset();
      if (performance.now() - slice < 80) continue;
      setSearchBusy(query, (lo + WILD_CHUNK) / (max + 1));
      await yieldNow();
      if (run !== searchRun) return;
      slice = performance.now();
    }
  } finally { st.free(); lt.free(); }
  const f = (id) => wildFreq.get(id) ?? -Infinity;
  const top = [...hits.keys()].sort((a, b) => f(b) - f(a) || a - b).slice(0, WILD_LIMIT);
  const cols = `id, sme_lemma, pos, subtype, freq, ${TRANS_COLS}${hasHumanColumn() ? ", human" : ""}, dial_same`;
  const rows = top.length ? all(`SELECT ${cols} FROM dictionary WHERE id IN (${top.map(() => "?").join(",")})`, top) : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const results = top.filter((id) => byId.has(id)).map((id) => {
    const r = byId.get(id), v = hits.get(id);
    return { ...r, wild: fold(v) === fold(r.sme_lemma) ? r.sme_lemma : v, rank: 1 };
  });
  setSearchBusy(null);
  // Käyttäjä on voinut muokata kenttää haun aikana: hänen tekstinsä jää kenttään
  const typed = $("search").value;
  showSearch(query, results, index, pushHistory);
  if (typed !== query) { $("search").value = typed; syncSearchClear(); }
}

function queryDatabase(query) {
  if (isWildcard(query)) return wildcardQuery(query);
  const q = fold(query.trim());
  const found = new Map();
  const add = (row, rank) => {
    const prev = found.get(row.id);
    if (!prev || rank < prev.rank) found.set(row.id, { ...row, rank });
  };
  const cols = `id, sme_lemma, pos, subtype, freq, ${TRANS_COLS}${hasHumanColumn() ? ", human" : ""}`;
  const searchLang = settings.lang;

  // 1 = saamen perusmuoto; 6 = isolla kirjoitettu erisnimi, joka osui vain kirjainkoosta riippumatta.
  // Perusmuoto ilman käännöstä valitulla kielellä 5.5: ensin sana, jonka taivutusmuoto haku on
  // (mas: vain dict-sme-nob:ssa omana sananaan, suomeksi ensin mii "mikä", jonka paikallissija mas on)
  const col = LANGUAGES[settings.lang].col;
  for (const r of all(`SELECT ${cols}, dial_same FROM dictionary WHERE lemma_fold = ? OR variant_fold = ?`, [q, q])) {
    const first = r.sme_lemma.charAt(0);
    add(r, r.sme_lemma !== query.trim() && first !== first.toLowerCase() ? 6 : r[col] ? 1 : 5.5);
  }
  // 1.5 = käänteisen sanakirjan (dict-fin-sme, dict-nob-sme) hakusana, sen ensisijainen saamennos ensin;
  // 2 = ainoa käännös, 3 = ensimmäinen käännös, 4 = jokin muu
  const items = itemsTableFor(searchLang, q);
  for (const r of all(
    `SELECT d.${cols.split(", ").join(", d.")}, t.fold, t.lang, t.nr FROM trans_search t JOIN dictionary d ON d.id = t.word_id
     WHERE t.lang = ? ${items ? `AND t.word_id IN (SELECT word_id FROM ${items} WHERE item = ?)` : ""} AND ${TRANS_MATCH}
     ORDER BY t.rowid`,
    [searchLang, ...(items ? [q] : []), ...transMatchParams(q)]
  )) {
    add(r, r.nr !== null ? (r.fold === q ? 1.5 + Math.min(r.nr, 9) / 100 : 4)
      : r.fold === q ? 2 : r.fold.startsWith(`${q},`) ? 3 : 4);
  }
  // 5 = taivutusmuoto (manan -> mannat); hyvin yleisen sanan muoto 1.2 eli käännösten edelle
  // (lei = leahkit eikä norjan "lei", mus = mun eikä norjan "mus")
  // Myös kirjoitettu asu sellaisenaan: lyhenteellä alkavan yhdyssanan muodot (PP-bálvalusat, TV-fálaldaga)
  const forms = [q, capitalize(q), nordic(q), capitalize(nordic(q)), query.trim()];
  for (const r of all(
    `SELECT DISTINCT d.${cols.split(", ").join(", d.")}
     FROM paradigms p JOIN dictionary d ON d.id = p.word_id WHERE p.surface IN (?, ?, ?, ?, ?)`, forms
  )) add(r, r.freq >= COMMON_WORD ? 1.2 : 5);
  // Passiivimuoto (máksojuvvo -> máksit), sme_passive.py; vanhassa aineistossa taulua ei ole
  try {
    for (const r of all(
      `SELECT DISTINCT d.${cols.split(", ").join(", d.")}
       FROM sme_passive p JOIN dictionary d ON d.id = p.word_id WHERE p.surface IN (?, ?, ?, ?, ?)`, forms
    )) add(r, 5);
  } catch (e) { /* vanha aineisto */ }
  // 4.5–4.9 = taivutettu suomen- tai norjankielinen sana (juon, taloon, husene): sen perusmuodon (juoda, talo, hus)
  // saamennokset perusmuodon omassa järjestyksessä, kaikkien suorien käännösosumien jälkeen. Muodot ovat taulussa
  // fin_forms / nob_forms (sama kuin viesus ≈ talossa -rivillä), joten tämä ei kasvata tietokantaa.
  for (const { base, cell, pos } of translationFormsOf(query.trim().toLowerCase(), searchLang)) {
    const b = fold(base);
    if (b === q) continue;
    const bItems = itemsTableFor(searchLang, b);
    for (const r of all(
      `SELECT d.${cols.split(", ").join(", d.")}, t.fold, t.nr FROM trans_search t JOIN dictionary d ON d.id = t.word_id
       WHERE t.lang = ? AND d.pos = ? ${bItems ? `AND t.word_id IN (SELECT word_id FROM ${bItems} WHERE item = ?)` : ""}
       AND ${TRANS_MATCH} ORDER BY t.rowid`,
      [searchLang, pos, ...(bItems ? [b] : []), ...transMatchParams(b)]
    )) {
      const rank = r.nr !== null ? (r.fold === b ? 1.5 + Math.min(r.nr, 9) / 100 : 4)
        : r.fold === b ? 2 : r.fold.startsWith(`${b},`) ? 3 : 4;
      // Pronominilla pitää olla tämä muoto (jolle: guhte, jolla on Sg+Ill, eikä juohke "jokainen", jolla ei ole)
      if (pos === "Pron" && !all(`SELECT 1 FROM paradigms p JOIN tags t ON t.id = p.tag_id WHERE p.word_id = ? AND t.tag = ? LIMIT 1`,
                                 [r.id, samiCaseOfFinCell(cell, "PRON")]).length) continue;
      // Persoonapronomini ennen samannäköisiä substantiivin muotoja (teille = te eikä tie, tee), tarkin ensin (hänelle = son ennen sanaa dat "se, hän")
      add({ ...r, via: { base, cell } }, pos === "Pron" ? (PERS_PRONOUNS[r.sme_lemma] ? 4.3 : 4.4) + rank / 100 : 4.5 + rank / 10);  // suora osuma (pienempi rank) säilyy ennallaan
    }
  }
  // 6.5 = käännös Muut kielet -asetuksessa valitulla kielellä (espanjaksi perro -> beana): vain sanan oma käännös,
  // ei taivutettuja muotoja. Ensin ainoa tai ensimmäinen käännös, sitten muut.
  const extra = extraSearchLangs();
  if (extra.length) {
    for (const r of all(
      `SELECT d.${cols.split(", ").join(", d.")}, t.fold, t.lang FROM trans_search t JOIN dictionary d ON d.id = t.word_id
       WHERE t.lang IN (${extra.map(() => "?").join(", ")}) AND t.nr IS NULL
         AND (t.fold = ? OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\')`,
      [...extra, q, `${likeEsc(q)},%`, `%, ${likeEsc(q)},%`, `%, ${likeEsc(q)}`]
    )) {
      add({ ...r, extraLang: r.lang }, r.fold === q ? 6.5 : r.fold.startsWith(`${q},`) ? 6.51 : 6.52);
    }
  }
  // 7 = perusmuoto alkaa hakusanalla; monisanaiset ilmaukset (dahkat iežas ...) vain, jos haussa on välilyönti
  const phrases = q.includes(" ") ? "" : "AND instr(lemma_fold, ' ') = 0";
  for (const r of all(`SELECT ${cols} FROM dictionary WHERE lemma_fold >= ? AND lemma_fold < ? ${phrases} LIMIT 60`, [q, q + "￿"])) add(r, 7);

  // Tasatilanteessa saamen sanoista (perusmuoto tai taivutusmuoto) ensin korpuksessa yleisempi
  // (sutnje: son eikä suotnjat), sitten sana, jolla on käännös valitulla kielellä, sitten verbit.
  // Käännösosumien keskinäinen järjestys tulee sanakirjasta (nr), joten frekvenssiä ei käytetä niille.
  const translated = (r) => (r[col] ? 1 : 0);
  const samiFreq = (r) => ([1, 1.2, 5, 5.5].includes(r.rank) || r.extraLang ? r.freq || 0 : 0);
  const results = [...found.values()]
    .sort((a, b) => a.rank - b.rank || samiFreq(b) - samiFreq(a) || translated(b) - translated(a)
      || (b.pos === "V") - (a.pos === "V") || a.sme_lemma.localeCompare(b.sme_lemma, "se"))
    .slice(0, 30);
  // Muun kielen osuma ei estä liitepartikkelin irrotusta (saamen sana ensin)
  if (results.some((r) => r.rank < PREFIX_RANK && !r.extraLang)) return results;
  // Ei osumaa: ehkä sanan perässä on liitepartikkeli (boađátgo = boađát + -go, viesusge, dathan, myös dalle-ge ja
  // kaksi peräkkäin: dahkagohan). Partikkeli irrotetaan ja vartalo haetaan saamen sanana (perusmuoto tai taivutusmuoto).
  for (const clitic of CLITICS) {
    for (const end of [clitic, "-" + clitic]) {
      if (!q.endsWith(end) || q.length - end.length < 2) continue;
      const stem = q.slice(0, -end.length);
      // Nopea esitarkistus: onko vartalo saamen perusmuoto tai taivutusmuoto (tai siinä on toinen partikkeli)
      const exists = all(`SELECT 1 FROM dictionary WHERE lemma_fold = ? UNION ALL
                          SELECT 1 FROM paradigms WHERE surface IN (?, ?, ?, ?) LIMIT 1`,
                         [stem, stem, capitalize(stem), nordic(stem), capitalize(nordic(stem))]).length;
      if (!exists && !CLITICS.some((c) => stem.endsWith(c))) continue;
      const hits = queryDatabase(stem).filter((r) => r.clitics || SAMI_HIT_RANKS.includes(r.rank));
      if (hits.length) {
        return [...hits.map((r) => ({ ...r, clitics: [...(r.clitics || []), clitic], cliticStem: r.cliticStem || stem })),
          ...results];
      }
    }
  }
  // Suomen liitepartikkeli (tuletko, talossakin, tuletkaan, talohan): irrotetaan ja vartalo haetaan suomen sanana
  // (perusmuoto tai taivutettu käännös, rank 1.5–4.9). Norjassa liitteitä ei ole.
  if (searchLang === "fin") {
    for (const clitic of FIN_QUERY_CLITICS) {
      if (!q.endsWith(clitic) || q.length - clitic.length < 2) continue;
      const stem = q.slice(0, -clitic.length);
      const hits = queryDatabase(stem).filter((r) => r.rank > 1.2 && r.rank < 5);
      if (hits.length) return [...hits.map((r) => ({ ...r, finClitic: clitic, finStem: stem })), ...results];
    }
  }
  return results;
}

// Muut kielet -asetuksessa valitut kielet, joilla haku myös löytää (ei suomi eikä norja, jotka ovat käyttöliittymän kieliä)
function extraSearchLangs() {
  return settings.extraLangs.filter((l) => LANGUAGES[l] && !LANGUAGES[l].main && l !== settings.lang);
}

// Hakutuloksen tai ehdotuksen käännösteksti: muun kielen osumassa myös sen kielen käännös (koira · Espanjaksi: perro)
function resultTrans(r, max) {
  const own = translationOf(r, max);
  if (!r.extraLang) return own;
  const other = `${t("langIn")[r.extraLang]}: ${translationOf(r, max, r.extraLang)}`;
  return own ? `${own} · ${other}` : other;
}

// Sama HTML:nä tyylimerkintöineen (tuloslista ja hakuehdotukset): "pylly, perse (alatyylinen)"
function resultTransHtml(r, max) {
  const own = translationOf(r, max);
  const ownHtml = own ? labelledList(own, settings.lang) : "";
  if (!r.extraLang) return ownHtml;
  const other = `${esc(t("langIn")[r.extraLang])}: ${labelledList(translationOf(r, max, r.extraLang), r.extraLang)}`;
  return ownHtml ? `${ownHtml} · ${other}` : other;
}

// Suomen liitepartikkelit haussa (pisimmät ensin) ja niiden pohjoissaamen vastineet (FIN_CLITICS toisin päin)
const FIN_QUERY_CLITICS = ["kään", "kaan", "kin", "hän", "han", "kö", "ko"];
const SME_OF_FIN_CLITIC = { ko: ["go"], kö: ["go"], kin: ["ge", "nai"], kaan: ["ge"], kään: ["ge"], han: ["han"], hän: ["han"] };

// Pohjoissaamen liitepartikkelit (lang-sme: +Qst, +Foc/...), pisimmät ensin. Merkitys näytetään viidelle, joiden
// merkitys on tarkistettu (sanakirjat ja oppikirja): go, ge, nai, son, han (i18n.js: cliticMeaning).
const CLITICS = ["gen", "ges", "gis", "nai", "son", "han", "hal", "bai", "bat", "go", "ge", "ba", "be"];
// Saamen sanan osumat: perusmuoto (1), yleisen sanan muoto (1.2), taivutusmuoto (5), perusmuoto ilman käännöstä (5.5)
const SAMI_HIT_RANKS = [1, 1.2, 5, 5.5, 6];

// Taivutettu suomen- tai norjankielinen sana -> [{base, cell, pos}] (juon -> juoda, Prs+Sg1, V). forms-sarake on
// muotoa "Prs+Sg1=juon;Prs+Sg2=juot;..." ja vaihtoehdot /-merkillä (husene/husa). SQL rajaa rivit nopeasti, tarkka osuma alla.
function translationFormsOf(word, lang) {
  if (!word || word.includes(" ") || !FORM_PHRASES[lang]) return [];
  // Suomen taivutusmuodoissa heittomerkki on ’ (raa’an), haussa ' (cleanQuery)
  if (lang === "fin" && word.includes("'")) return translationFormsOf(word.replace(/'/g, "\u2019"), lang);
  const out = [];
  if (lang === "fin") {
    for (const fi of FIN_PRONOUN_FORMS) {
      for (const [cell, form] of Object.entries(fi)) {
        if (form === word && cell !== "Nom") out.push({ base: fi.Nom, cell, pos: "Pron" });
      }
    }
  }
  try {
    // Erisnimet ovat taulukoissa isolla alkukirjaimella (Inari: Sg+Ine=Inarissa), haku pienillä: kokeillaan molempia
    const cap = word.charAt(0).toUpperCase() + word.slice(1);
    // Muoto alkaa samoilla kahdella kirjaimella kuin perusmuoto (talossa -> talo, Inarissa -> Inari): haetaan vain
    // perusmuodon avainväliltä eikä koko taulusta (16 Mt, 60-120 ms); poikkeukset (aika -> ajan) ovat taulussa *_form_alt
    const rows = hasTable(`${lang}_form_alt`)
      ? (() => {
        const p = word.slice(0, 2).toLowerCase(), P = p.charAt(0).toUpperCase() + p.slice(1);
        return all(
          `SELECT word, pos, forms FROM ${lang}_forms WHERE ((word >= ? AND word < ?) OR (word >= ? AND word < ?))
             AND (instr(forms, ?) OR instr(forms, ?))
           UNION SELECT f.word, f.pos, f.forms FROM ${lang}_form_alt a JOIN ${lang}_forms f ON f.word = a.word AND f.pos = a.pos
             WHERE a.form = ?`,
          [p, p + "\uffff", P, P + "\uffff", word, cap, word.toLowerCase()]
        );
      })()
      : all(`SELECT word, pos, forms FROM ${lang}_forms WHERE instr(forms, ?) OR instr(forms, ?)`, [word, cap]);
    for (const r of rows) {
      for (const cell of r.forms.split(";")) {
        const [c, v] = cell.split("=");
        if (v.split("/").some((f) => f === word || f === cap)) out.push({ base: r.word, cell: c, pos: r.pos });
      }
    }
  } catch (e) { /* vanha tietokanta ilman taulua */ }
  return out;
}

// Suomen muodon solu -> saamen paradigman tagi samassa muodossa (Prs+Sg1 -> Ind+Prs+Sg1 = jugan). null, jos
// saamessa ei ole yhtä vastinetta (partitiivi, adessiivi ...): silloin näytetään vain perusmuoto.
function samiTagOfFinCell(cell, pos, base = null, human = false) {
  return uncertainFinCell(cell, pos, base, human) ? null : samiCaseOfFinCell(cell, pos);
}

// Suomen -lla, -lta, -lle ja -ksi eivät vastaa yhtä saamen muotoa: pöydällä = beavddi alde (ei beavddis), jäällä = jieŋa alde,
// pöydälle = beavddi ala, autolla = biillain. Sana löytyy, mutta saamen muotoa ei näytetä. Ihmisistä puhuttaessa muoto on vakiintunut
// (minulla = mus, minulle = munnje, kenellä = geas, kenelle = geasa); -ksi ei niissäkään.
const UNCERTAIN_FIN_CASE = /(^|\+)(All|Ade|Abl|Tra)$/;
const PEOPLE_PRONOUNS = ["kuka"];
// Ihmistä tarkoittava substantiivi (semantics.py) kuten persoonapronominit: isoäidille = áhkkui, isoäidillä = áhkus;
// tarkistettu esimerkkilauseista ja korpuksesta 2026-11-09 (-lle = illatiivi 18/19, -lla = lokatiivi noin 25/29)
function uncertainFinCell(cell, pos, base, human = false) {
  if (!UNCERTAIN_FIN_CASE.test(cell)) return false;
  if (pos === "N" && human) return cell.endsWith("Tra");
  if (pos !== "PRON" || cell.endsWith("Tra")) return true;
  return cell.includes("+") && !PEOPLE_PRONOUNS.includes(base);  // Persoonapronominien solussa ei ole lukua ("All")
}

function samiCaseOfFinCell(cell, pos) {
  if (pos === "PRON") {
    // Persoonapronominit: "All" -> Ill; muut pronominit: "Pl+All" -> Pl+Ill, essiivi ilman lukua
    const [number, finCase] = cell.includes("+") ? cell.split("+") : [null, cell];
    const sami = finCase === "Nom" ? "Nom" : SAMI_CASE_OF_FIN_PRONOUN[finCase];
    return sami && number && sami !== "Ess" ? `${number}+${sami}` : sami || null;
  }
  const p = cell.split("+");
  if (pos === "V") {
    if (cell === "Inf" || cell === "PrfPrc" || cell === "PrsPrc") return cell;
    // Uudet suomen verbimuodot (fin_forms.py): leikkimässä = stoahkamin, leikkimättä = stoagakeahttá, myymästä = vuovdimis,
    // maksetaan = máksojuvvo, maksettiin = máksojuvvui, maksettu = máksojuvvon (passiivi: sme_passive.py)
    const NONFIN = { "InfMa+Ine": "Actio+Ess", "InfMa+Abe": "VAbess", "InfMa+Ela": "Actio+Loc", "Pss+Prs": "Pass+Ind+Prs+Sg3",
                     "Pss+Prt": "Pass+Ind+Prt+Sg3", "PssPrfPrc": "Pass+PrfPrc" };
    if (NONFIN[cell]) return NONFIN[cell];
    if ((p[0] === "Prs" || p[0] === "Prt") && p[1] !== "ConNeg") return `Ind+${p[0]}+${p[1]}`;
    if ((p[0] === "Cond" || p[0] === "Pot") && p[1] !== "ConNeg") return `${p[0]}+Prs+${p[1]}`;
    if (p[0] === "Imprt") return `Imprt+${p[1]}`;
    return null;
  }
  if (cell === "Comp" || cell === "Superl") return `${cell}+Sg+Nom`;
  const cases = { Nom: "Nom", Gen: "Gen", Ine: "Loc", Ela: "Loc", Ade: "Loc", Abl: "Loc", Ill: "Ill", All: "Ill" };
  if (p[1] === "Ess" || p[1] === "Tra") return "Ess";
  return cases[p[1]] ? `${p[0]}+${cases[p[1]]}` : null;
}

function suggestWords(prefix, withForms = true) {
  const q = fold(cleanQuery(prefix).replace(/\s+/g, " ").trim());
  if (q.length < 2) return [];
  const rows = all(
    `SELECT id, sme_lemma, pos, ${TRANS_COLS} FROM dictionary
     WHERE (lemma_fold >= ? AND lemma_fold < ?) OR (variant_fold >= ? AND variant_fold < ?)
     ORDER BY length(sme_lemma), sme_lemma LIMIT 8`, [q, q + "￿", q, q + "￿"]
  );
  if (rows.length < 8) {
    // Jonkin käännöslistan sanan alku (items-taulun avainväli rajaa rivit, LIKE-ehdot ennallaan)
    const items = itemsTableFor(settings.lang, q);
    rows.push(...all(
      `SELECT DISTINCT d.id, d.sme_lemma, d.pos, ${TRANS_COLS.split(", ").map((c) => "d." + c).join(", ")}
       FROM trans_search t JOIN dictionary d ON d.id = t.word_id
       WHERE t.lang = ? ${items ? `AND t.word_id IN (SELECT word_id FROM ${items} WHERE item >= ? AND item < ?)` : ""}
       AND (t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\') ORDER BY length(d.sme_lemma), d.id LIMIT 8`,
      [settings.lang, ...(items ? [q, q + "\uffff"] : []), `${likeEsc(q)}%`, `%, ${likeEsc(q)}%`]
    ));
  }
  // Saamen sana ilman erikoiskirjaimia (cah -> čáhci, sapm -> sápmi): käännösosumien jälkeen, ettei suomen sana jää
  // samannäköisen saamen sanan alle. Vain, jos haussa ei ole erikoiskirjaimia (taulu lemma_plain: export_web_data.py).
  if (rows.length < 8 && !/[áčđŋšŧž]/.test(q) && hasTable("lemma_plain")) {
    const seen = new Set(rows.map((r) => r.id));
    rows.push(...all(
      `SELECT d.id, d.sme_lemma, d.pos, ${TRANS_COLS.split(", ").map((c) => "d." + c).join(", ")}
       FROM lemma_plain p JOIN dictionary d ON d.id = p.word_id WHERE p.plain >= ? AND p.plain < ?
       ORDER BY d.freq DESC, length(d.sme_lemma) LIMIT 8`, [q, q + "\uffff"]
    ).filter((r) => !seen.has(r.id)).map((r) => ({ ...r, plainMatch: true })));
  }
  // Muut kielet -asetuksessa valitut kielet viimeisinä (espanjaksi per -> beana "perro")
  const extra = extraSearchLangs();
  if (rows.length < 8 && extra.length) {
    rows.push(...all(
      `SELECT d.id, d.sme_lemma, d.pos, ${TRANS_COLS.split(", ").map((c) => "d." + c).join(", ")}, MIN(t.lang) AS extraLang
       FROM trans_search t JOIN dictionary d ON d.id = t.word_id
       WHERE t.lang IN (${extra.map(() => "?").join(", ")}) AND t.nr IS NULL AND (t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\')
       GROUP BY d.id ORDER BY d.freq DESC, length(d.sme_lemma) LIMIT 8`,
      [...extra, `${likeEsc(q)}%`, `%, ${likeEsc(q)}%`]
    ));
  }
  // Kirjoitettu sana taivutusmuotona (munnje = mun, minulle = mun): perusmuodon jälkeen, jos sana on itse käännetty hakusana
  const col = LANGUAGES[settings.lang].col;
  const exact = rows.filter((r) => fold(r.sme_lemma) === q && r[col]);
  // "Tarkoititko" myös hakukentän ehdotuksiin (boadat -> boađát, arbol -> árbol, a la vista) samalla hitaammalla
  // kierroksella kuin muodot ja samalla haulla (queryDatabase vain kerran)
  const typed = prefix.trim();
  // Tarkoititko jo ensimmäisellä (nopealla) kierroksella, ei vasta kirjoitustauon jälkeen (käyttäjä 2026-11-14);
  // taivutusmuodot yhä vasta tauolla (hitaita)
  const searched = fold(typed).length >= 2 ? queryDatabase(typed) : null;
  const forms = withForms ? formSuggestions(prefix, searched) : [];
  const dym = searched
    ? [...(typed.includes(" ") ? [] : didYouMean(typed, searched)), ...extraDidYouMean(typed, searched)].slice(0, 2)
        .map((d) => ({ id: d.id, sme_lemma: d.lemma, pos: d.pos || "", form: d.word, dym: d })) : [];
  // Oma tyhjä hakusana (mus, munnje ilman suomennosta) on turha, kun perusmuoto (mun) näkyy
  const useful = forms.length ? rows.filter((r) => fold(r.sme_lemma) !== q || r[col]) : rows;
  // Sama sana vain kerran tunnisteen mukaan, ei perusmuodon ja sanaluokan: mii = me ja mii = mikä ovat eri sanoja.
  // Muotorivi ja saman sanan tavallinen rivi yhdistyvät; "tarkoititko"-rivit pidetään erillään kuten ennen.
  const key = (r) => r.dym ? "dym|" + r.sme_lemma : r.id != null ? "id|" + r.id : r.sme_lemma + "|" + r.pos;
  const seen = new Set();
  // Tarkoititko-sana on itse perusmuoto (cahci -> čáhci): sama sana ei toistu alempana omana rivinään
  const dymSame = new Set(dym.filter((d) => d.dym.word === d.dym.lemma).map((d) => d.id));
  const unique = [...dym, ...forms, ...exact, ...useful].filter((r) => (r.dym || !dymSame.has(r.id)) && !seen.has(key(r)) && seen.add(key(r)));
  return mergeSameLemma(unique, col).slice(0, 8);
}

// Saman perusmuodon rivit, joiden käännös on sama tai toisen alku (galle Adv/Num/Pron "kuinka monta, montako",
// makkáraš A "millainen" ja Pron "millainen, minkälainen"), yhdeksi riviksi sanaluokat yhdistettyinä. Eri merkitykset
// jäävät erilleen, vaikka sana toistuisi käännöksen lopussa (gosa Adv "minne" ja CC "johon, jonne, mihin, minne";
// mii me / mikä). Rivi ilman käännöstä jätetään pois, kun samalla perusmuodolla on käännetty sana (man Pron ilman
// suomennosta, kun man Adv = kuinka).
function mergeSameLemma(rows, col) {
  const plain = (r) => !r.dym && !r.form && !r.extraLang;
  const words = (r) => (r[col] || "").split(",").map((w) => fold(w.trim())).filter(Boolean);
  const startsWith = (long, short) => short.length <= long.length && short.every((w, i) => long[i] === w);
  const translated = new Set();
  const hasTranslated = (lemma) => {
    if (!translated.has(lemma)) {
      translated.add(lemma);
      if (all(`SELECT 1 FROM dictionary WHERE sme_lemma = ? AND ${col} <> '' LIMIT 1`, [lemma]).length) translated.add("+" + lemma);
    }
    return translated.has("+" + lemma);
  };
  const out = [];
  for (const r of rows) {
    if (!plain(r)) { out.push(r); continue; }
    const mine = words(r);
    if (!mine.length) {
      if (!hasTranslated(r.sme_lemma)) out.push(r);
      continue;
    }
    const i = out.findIndex((o) => plain(o) && o.sme_lemma === r.sme_lemma && o[col] &&
      (startsWith(words(o), mine) || startsWith(mine, words(o))));
    if (i < 0) { out.push(r); continue; }
    // Laajempi käännös jää näkyviin (makkáraš: millainen, minkälainen), sanaluokat yhdessä (Adv/Num/Pron)
    const keep = words(out[i]).length >= mine.length ? out[i] : r;
    const pos = [...new Set([...out[i].pos.split("/"), r.pos])].join("/");
    out[i] = { ...keep, pos };
  }
  return out;
}

// Koko sanan osumat taivutusmuotona tai liitepartikkelin kanssa samalla haulla kuin Enter (queryDatabase); form = kirjoitettu sana
function formSuggestions(text, results = null) {
  const typed = text.trim();
  if (fold(typed).length < 2 || typed.includes(" ")) return [];
  const col = LANGUAGES[settings.lang].col;
  results = results || queryDatabase(typed);
  const isForm = (r) => r.via || r.clitics || r.finClitic || r.rank === 1.2 || r.rank === 5;
  // Suorat osumat samassa järjestyksessä kuin Enterillä: missä = gos ennen pronominin mii muotoa mas
  const direct = results.filter((r) => !isForm(r) && r.rank <= 3).slice(0, 3);
  const hits = results.filter(isForm);
  // Ilman käännöstä oleva rinnakkaismuoto (mon = mun) vain, jos muuta ei ole
  const shown = hits.some((r) => r[col]) ? hits.filter((r) => r[col]) : hits;
  return [...direct, ...shown.slice(0, 3).map((r) => {
    const translated = r.via || r.finClitic;
    // Saamen muoto kursiivilla perusmuodon perässä: mus -> mun mus, minulla -> mun mus (ja oikealla haettu suomen sana)
    // Ei kursiivimuotoa, kun kirjoitettu sana on sanan oma perusmuoto (guhtemuš ilman suomennosta: ei "guhtemuš guhtemuš")
    let smeForm = translated || fold(r.sme_lemma) === fold(typed) ? null : typed;
    if (r.via) {
      const tag = settings.lang === "fin" ? samiTagOfFinCell(r.via.cell, r.pos.toUpperCase(), r.via.base, r.human) : null;
      smeForm = tag ? (loadWord(r.id).paradigm.get(tag) || [])[0] || null : null;
    }
    return { ...r, form: typed, smeForm, formNote: translated ? typed : translationOf(r, 2) };
  })];
}

function loadWord(id) {
  const word = all(`SELECT * FROM dictionary WHERE id = ?`, [id])[0];
  const paradigm = new Map();
  const grades = new Map();
  for (const r of all(
    `SELECT t.tag, p.surface, p.grade FROM paradigms p JOIN tags t ON t.id = p.tag_id WHERE p.word_id = ? ORDER BY ${paradigmOrderBy()}`, [id]
  )) {
    if (!paradigm.has(r.tag)) paradigm.set(r.tag, []);
    if (!paradigm.get(r.tag).includes(r.surface)) paradigm.get(r.tag).push(r.surface);
    if (r.grade) grades.set(r.tag + "|" + r.surface, r.grade);
  }
  // Genetiivin päämuoto ensin: sama kuin akkusatiivi (beavddi ennen rinnakkaismuotoa beavdde, viesu ennen muotoa vieso)
  const acc = paradigm.get("Sg+Acc") || [];
  if (paradigm.has("Sg+Gen")) paradigm.get("Sg+Gen").sort((x, y) => acc.includes(y) - acc.includes(x));
  const examples = new Map();
  for (const r of all(`SELECT lang, meaning_nr, sme, translation, source FROM examples WHERE word_id = ? ORDER BY rowid`, [id])) {
    const key = r.lang + r.meaning_nr;
    if (!examples.has(key)) examples.set(key, []);
    examples.get(key).push(r);
  }
  // Saamen passiivi (sme_passive.py: máksojuvvo, ráhkaduvvon) samaan taulukkoon Pass+-tageilla: haettu passiivimuoto
  // saa käännöksen kuten muutkin muodot (máksojuvvo ≈ maksetaan) ja näkyy Kaikki muodot -välilehdellä
  try {
    for (const r of all(`SELECT tag, surface FROM sme_passive WHERE word_id = ?`, [id])) paradigm.set("Pass+" + r.tag, [r.surface]);
  } catch (e) { /* vanha aineisto ilman passiivia */ }
  const meanings = all(`SELECT * FROM meanings WHERE word_id = ? ORDER BY rowid`, [id])
    .map((m) => ({ ...m, examples: examples.get(m.lang + m.nr) || [] }));
  // Pohjoissaamenkieliset määritelmät (sme_definitions.py, GiellaLT dict-sme)
  let definitions = [];
  try {
    definitions = all(`SELECT nr, definition, synonyms, examples FROM sme_definitions WHERE word_id = ? ORDER BY nr`, [id]);
  } catch (e) { /* vanha aineisto ilman määritelmiä */ }
  // Lisäsuomennokset käänteisestä suomi–saame-sanakirjasta (fin_also.py: gieddi -> aho, keto, vainio)
  let alsoFin = "";
  try {
    alsoFin = all(`SELECT items FROM fin_also WHERE word_id = ?`, [id])[0]?.items || "";
  } catch (e) { /* vanha aineisto ilman lisäsuomennoksia */ }
  return { word, paradigm, grades, meanings, definitions, alsoFin };
}

// --- Näkymät ---

// Aloitussivun otsikko ja tämä päivä saameksi kaikilla käyttöliittymäkielillä:
// tervehdys vuorokaudenajan mukaan ja "Odne lea gaskavahkku, skábmamánu 11. beaivi."
const SME_WEEKDAYS = ["sotnabeaivi", "vuossárga", "maŋŋebárga", "gaskavahkku", "duorastat", "bearjadat", "lávvordat"];
const SME_MONTHS_GEN = ["ođđajagemánu", "guovvamánu", "njukčamánu", "cuoŋománu", "miessemánu", "geassemánu",
  "suoidnemánu", "borgemánu", "čakčamánu", "golggotmánu", "skábmamánu", "juovlamánu"];
const smeGreeting = (h) => (h >= 5 && h < 10 ? "Buorre iđit!" : h < 17 && h >= 10 ? "Buorre beaivi!" : h >= 17 && h < 22 ? "Buorre eahket!" : "Buorre idja!");
const smeDate = (d) => `${SME_MONTHS_GEN[d.getMonth()]} ${d.getDate()}. beaivi`;

function renderToday() {
  const d = new Date();
  $("welcome-title").textContent = smeGreeting(d.getHours());
  $("today").textContent = `Odne lea ${SME_WEEKDAYS[d.getDay()]}, ${smeDate(d)}.`;
}

function showOnly(view) {
  closeFormPop();
  $("welcome").hidden = view !== "welcome";
  if (view === "welcome") {
    renderToday();
    // Kielen valinta vain uudelle käyttäjälle: kun on hakuja tai suosikkeja, kieli vaihdetaan valikosta
    $("welcome-lang").hidden = settings.history.length > 0 || settings.favourites.length > 0;
    renderRecent();
  }
  $("loading").hidden = view !== "loading";
  for (const id of ["results", "word", "tabs", "word-foot"]) $(id).hidden = view !== "word";
  for (const t of TABS) $("panel-" + t).hidden = view !== "word" || state.tab !== t;
}

// Haun pituusraja: sama kuin hakukentän maxlength (index.html); koskee myös osoitetta #/sana/… ja jaettua tekstiä.
// 5 000 merkin haku vei 375 ms (yötesti 2026-11-14). Lausekääntäjällä on oma kenttänsä.
const MAX_QUERY = 100;
// Hakukentän ×: näkyvissä, kun kentässä on tekstiä
function syncSearchClear() { if ($("search-clear")) $("search-clear").hidden = !$("search").value; }
function search(query, index = 0, pushHistory = true) {
  query = cleanQuery(String(query).slice(0, MAX_QUERY)).replace(/\s+/g, " ").trim();  // myös NBSP ja tuplavälit
  if (!query || !db) return;
  hideSuggestions();
  $("search").value = query;
  syncSearchClear();
  const run = ++searchRun;  // uusi haku peruu kesken olevan jokerihaun
  if (isSlowWildcard(query)) { wildcardSearch(query, index, pushHistory, run); return; }
  setSearchBusy(null);
  showSearch(query, queryDatabase(query), index, pushHistory);
}
function showSearch(query, results, index = 0, pushHistory = true) {
  state.query = query;
  state.results = results;
  renderDidYouMean(query, state.results);
  state.showPrefix = false;
  state.index = index;

  const hash = `#/sana/${encodeURIComponent(query)}${index ? "/" + index : ""}`;
  if (location.hash !== hash) history.pushState(null, "", hash);

  if (!state.results.length) {
    showOnly("word");
    $("results").hidden = true;
    $("tabs").hidden = true;
    $("word-foot").hidden = true;
    $("grad-sum").hidden = true;
    for (const t of TABS) $("panel-" + t).hidden = true;
    $("lemma").textContent = t("noHits", query);
    $("pos-badge").hidden = true;
    $("fav-btn").hidden = true;
    $("speak-btn").hidden = true;
    $("word-links").hidden = true;
    $("translation").textContent = t("noHitsHint");
    $("form-translation").hidden = true;  // edellisen sanan rivit pois
    $("extra-translations").hidden = true;
    $("more-meanings").textContent = "";
    $("gradation").innerHTML = "";
    $("word-info").textContent = "";
    return;
  }
  renderResults();
  selectResult(Math.min(index, state.results.length - 1), pushHistory);
}

// "Tarkoititko": saamen erikoiskirjaimet lisättyinä (a -> á, c -> č, d -> đ, n -> ŋ, s -> š, t -> ŧ, z -> ž). Suomalaisella näppäimistöllä
// erikoiskirjaimet jäävät helposti pois, ja a/á voi muuttaa sanan kokonaan (boađatgo = boađadit, boađátgo = boahtit).
// Ehdotus näytetään, jos haku ei löytänyt mitään, tai jos vaihtoehto on korpuksessa selvästi yleisempi sana (10 x).
// Suomen- tai norjankieliselle haulle (käännösosuma) ei ehdoteta mitään.
// Vain lisäys (a -> á), ei poistoa: erikoiskirjain jää pois, kun sitä ei saa näppäimistöltä, mutta harvoin kirjoitetaan
// vahingossa. Poistava ehdotus hämäisi: oikein kirjoitettu áddet (ymmärtää) -> addet (antaa).
const LETTER_PAIRS = { a: "á", c: "č", d: "đ", n: "ŋ", s: "š", t: "ŧ", z: "ž" };
function letterVariants(word) {
  const spots = [...word].map((c, i) => (LETTER_PAIRS[c] ? i : -1)).filter((i) => i >= 0).slice(-10);
  const out = [];
  for (let mask = 1; mask < 1 << spots.length; mask++) {
    const chars = [...word];
    spots.forEach((pos, b) => { if (mask & (1 << b)) chars[pos] = LETTER_PAIRS[chars[pos]]; });
    out.push(chars.join(""));
  }
  return out;
}
let SUGGEST_FACTOR = 10;  // vaihtoehdon oltava näin monta kertaa yleisempi kuin löydetty sana
function didYouMean(query, results) {
  if (/[*?]/.test(query)) return [];
  const q = fold(query);
  if (results.some((r) => r.rank > 1.2 && r.rank < 5 && !r.clitics)) return [];
  const sami = results.filter((r) => r.clitics || SAMI_HIT_RANKS.includes(r.rank));
  // vaihtoehdot koko sanasta ja liitepartikkelin kanssa vartalosta (boadatgo -> boađát + go)
  const cands = new Map(letterVariants(q).map((v) => [v, ""]));
  for (const c of CLITICS) if (q.endsWith(c) && q.length - c.length >= 2) {
    for (const v of [q.slice(0, -c.length), ...letterVariants(q.slice(0, -c.length))]) if (!cands.has(v)) cands.set(v, c);
  }
  if (!cands.size) return [];
  // myös isolla alkukirjaimella (erisnimet: danmarkun -> Dánmárkun)
  for (const [v, c] of [...cands]) if (!cands.has(capitalize(v))) cands.set(capitalize(v), c);
  const words = [...cands.keys()];
  const marks = words.map(() => "?").join(",");
  const col = LANGUAGES[settings.lang].col;
  const rows = all(`SELECT p.surface AS v, d.id, d.sme_lemma, d.pos, d.freq, d.${col} AS tr FROM paradigms p
                    JOIN dictionary d ON d.id = p.word_id WHERE p.surface IN (${marks})
                    UNION SELECT d.sme_lemma, d.id, d.sme_lemma, d.pos, d.freq, d.${col} FROM dictionary d
                    WHERE d.lemma_fold IN (${marks})`, [...words, ...words]);
  const current = Math.max(0, ...sami.map((r) => r.freq || 0));
  const shown = new Set(sami.map((r) => r.id));
  const best = new Map();  // ehdotettu sana -> yleisin perusmuoto
  for (const r of rows) {
    if (shown.has(r.id) || !r.tr) continue;
    if (sami.length && (r.freq || 0) < Math.max(1000, current * SUGGEST_FACTOR)) continue;
    const word = r.v + (cands.get(r.v) ?? cands.get(fold(r.v)) ?? "");
    if (fold(word) === q) continue;  // sama kirjoitusasu kuin haussa (toinen sana): ei ehdotusta
    if (!best.has(word) || (r.freq || 0) > (best.get(word).freq || 0)) best.set(word, r);
  }
  return [...best.entries()].sort((a, b) => (b[1].freq || 0) - (a[1].freq || 0)).slice(0, 2)
    .map(([word, r]) => ({ word, id: r.id, lemma: r.sme_lemma, pos: r.pos, trans: splitList(r.tr)[0] }));
}
// "Tarkoititko" Muut kielet -asetuksessa valituille kielille: sama hakusana erikoiskirjaimin ja tarkkein (arbol -> árbol,
// vyevdi -> vyevdi, cuvgat -> čuvgat). Hakusanat ilman erikoiskirjaimia ovat taulussa trans_bare (export_web_data.py).
// Samat säännöt kuin pohjoissaamessa: ei ehdotusta, jos haku löysi suomen- tai norjankielisen käännöksen tai sanan
// tällä kielellä, ja jos haku löysi saamen sanan, ehdotetun sanan on oltava selvästi yleisempi.
const EXTRA_LETTERS = { đ: "d", ŋ: "n", ŧ: "t", æ: "ae", ø: "o", ß: "ss", ł: "l" };
function withoutLetters(text) {
  return text.toLowerCase().replace(/[đŋŧæøßł]/g, (c) => EXTRA_LETTERS[c]).normalize("NFD").replace(/\p{M}/gu, "");
}
// Ehdotus vain lisää puuttuvia kirjaimia (arbol -> árbol), ei vaihda kirjoitettuja (maŋŋá ei ole mánná, Réunion ei reunión)
function addsLettersOnly(typed, term) {
  const a = [...typed], b = [...term];
  if (a.length !== b.length) return typed === withoutLetters(typed);  // æ -> ae: vain, jos haussa ei ole erikoiskirjaimia
  return a.every((c, i) => c === b[i] || c === withoutLetters(b[i]));
}
function extraDidYouMean(query, results) {
  if (/[*?]/.test(query)) return [];
  const extra = extraSearchLangs();
  if (!extra.length) return [];
  if (results.some((r) => (r.rank > 1.2 && r.rank < 5 && !r.clitics) || (r.extraLang && r.rank < PREFIX_RANK))) return [];
  const q = fold(query.trim());
  let terms = [];
  try {
    terms = all(`SELECT DISTINCT lang, term FROM trans_bare WHERE bare = ? AND lang IN (${extra.map(() => "?").join(", ")})`,
                [withoutLetters(q), ...extra]).filter((r) => r.term !== q && addsLettersOnly(q, r.term));
  } catch (e) { return []; }  // vanha tietokanta ilman taulua
  const sami = results.filter((r) => r.clitics || SAMI_HIT_RANKS.includes(r.rank));
  const current = Math.max(0, ...sami.map((r) => r.freq || 0));
  const col = LANGUAGES[settings.lang].col;
  const out = [];
  for (const { lang, term } of terms) {
    const r = all(
      `SELECT d.id, d.sme_lemma, d.pos, d.freq, d.${col} AS tr, d.${LANGUAGES[lang].col} AS own FROM trans_search t
       JOIN dictionary d ON d.id = t.word_id WHERE t.lang = ? AND (t.fold = ? OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\' OR t.fold LIKE ? ESCAPE '\\')
       ORDER BY d.freq DESC LIMIT 1`, [lang, term, `${likeEsc(term)},%`, `%, ${likeEsc(term)},%`, `%, ${likeEsc(term)}`])[0];
    if (!r || (sami.length && (r.freq || 0) < Math.max(1000, current * SUGGEST_FACTOR))) continue;
    const word = splitList(r.own).find((x) => fold(x) === term) || term;  // alkuperäinen kirjoitusasu (æ, ø)
    out.push({ word, id: r.id, lemma: r.sme_lemma, pos: r.pos, trans: splitList(r.tr)[0], lang, freq: r.freq || 0 });
  }
  return out.sort((a, b) => b.freq - a.freq).slice(0, 2);
}
function renderDidYouMean(query, results) {
  const box = $("did-you-mean");
  const list = [...didYouMean(query, results), ...extraDidYouMean(query, results)].slice(0, 3);
  box.hidden = !list.length;
  box.innerHTML = list.length ? `<span>${esc(t("didYouMean"))}</span>` + list.map((s) =>
    // Taivutusmuoto -> perusmuoto (čázis → čáhci); perusmuodosta vain sana kerran (čáhci, ei "čáhci → čáhci")
    `<button data-q="${esc(s.word)}"><b>${esc(s.word)}</b>${s.word === s.lemma ? "" : ` → ${esc(s.lemma)}`}${s.trans ? ` (${esc(s.trans)})` : ""}` +
    `${s.lang ? ` <span class="muted small">${esc(t("langName")[s.lang])}</span>` : ""}</button>`).join("") : "";
}

// Pelkät "alkaa hakusanalla" -osumat (rank 7, esim. beana -> beanabálvalus) piilotetaan napin taakse,
// jos varsinaisia osumia on (perusmuoto, käännös, taivutusmuoto). Ilman niitä näytetään kaikki.
const PREFIX_RANK = 7;

function renderResults() {
  const box = $("results");
  box.innerHTML = "";
  const strong = state.results.filter((r) => r.rank < PREFIX_RANK).length;
  const prefixOnly = state.results.length - strong;
  const collapsed = strong > 0 && prefixOnly > 0 && !state.showPrefix && state.index < strong;
  state.results.slice(0, collapsed ? strong : state.results.length).forEach((r, i) => {
    const b = document.createElement("button");
    const trans = resultTransHtml(r, 2);
    const pos = r.subtype ? `${r.pos} ${r.subtype}` : r.pos;
    // Jokerihaun täsmännyt muoto ennen perusmuotoa (álbmogis → álbmot)
    const wild = r.wild && fold(r.wild) !== fold(r.sme_lemma) ? `<span class="r-lemma">${esc(r.wild)}</span> → ` : "";
    b.innerHTML = `${wild}<span class="r-lemma">${esc(r.wild && !wild ? r.wild : shownLemma(r))}</span> <span class="trans">(${esc(pos)})${trans ? " – " + trans : ""}</span>`;
    b.dataset.i = i;
    b.onclick = () => selectResult(i);
    box.appendChild(b);
  });
  if (strong > 0 && prefixOnly > 0) {
    const more = document.createElement("button");
    more.className = "more-results";
    more.textContent = collapsed ? t("morePrefix", prefixOnly, state.query) : t("fewerPrefix");
    more.onclick = () => {
      state.showPrefix = collapsed;
      renderResults();
      [...box.children].forEach((b) => b.classList.toggle("selected", Number(b.dataset.i) === state.index));
    };
    box.appendChild(more);
  }
}

function selectResult(i, pushHistory = true) {
  // Vanha tulosrivi edellisestä hausta (tyhjä haku piilottaa listan, rivit jäävät DOMiin): ei kaatumista (yötesti 2026-11-18)
  if (!state.results?.[i]) return;
  closeFormPop();
  state.index = i;
  const r = state.results[i];
  if (i >= state.results.filter((x) => x.rank < PREFIX_RANK).length && !state.showPrefix) {
    state.showPrefix = true;  // osoitteessa (#/sana/beana/12) valittu alkuosuma näkyviin
    state.index = i;
    renderResults();
  }
  [...$("results").children].forEach((b) => b.classList.toggle("selected", b.dataset.i !== undefined && Number(b.dataset.i) === i));
  const hash = `#/sana/${encodeURIComponent(state.query)}${i ? "/" + i : ""}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);

  const data = loadWord(r.id);
  state.via = r.via || null;  // haettu taivutettu käännös (juon = juoda), ks. queryDatabase
  // Liitepartikkeli haussa (boađátgo): vartalo (boađát) ja partikkelit järjestyksessä (renderInfo)
  state.clitic = r.clitics ? { stem: r.cliticStem, clitics: r.clitics } : null;
  // Suomen- tai norjankielinen hakusana, jos sana löytyi sen käännöksenä (rank 1.5–4.9, ks. queryDatabase)
  state.transWord = r.via ? r.via.base : r.rank > 1.2 && r.rank < 5 ? r.finStem || state.query : null;
  // Suomen liitepartikkeli haussa (tuletko): vartalo ja liite (renderInfo)
  state.finClitic = r.finClitic ? { stem: r.finStem, clitic: r.finClitic } : null;
  state.word = data.word;
  state.paradigm = data.paradigm;
  state.grades = data.grades;
  showOnly("word");

  const w = data.word;
  $("lemma").textContent = shownLemma(w);
  $("pos-badge").hidden = false;
  $("pos-badge").textContent = wordClassLabel(w.pos, w.subtype);
  $("fav-btn").hidden = false;
  $("speak-btn").hidden = false;
  $("word-links").hidden = false;
  $("gt-link").href = SANIT_URL.replace("{lang}", settings.lang === "nob" ? "nob" : "fin")
    .replace("{word}", encodeURIComponent(w.sme_lemma));
  $("satni-link").href = SATNI_URL.replace("{word}", encodeURIComponent(w.sme_lemma));
  updateFavButton();

  // Merkitykset vain käyttöliittymän kielellä ja Muut kielet -asetuksessa valituilla kielillä; muita kieliä
  // ei näytetä missään (sanakortti, Merkitykset-välilehti), ennen kuin ne valitaan valikosta.
  const meanings = data.meanings.filter((m) => m.lang === settings.lang || settings.extraLangs.includes(m.lang));
  // Ensimmäinen merkitys käyttörajoituksineen (esim. hyppiä – paksussa lumessa, porosta) käyttöliittymän
  // kielellä; jos sitä ei ole, "(ei suomennosta)" ja valittujen muiden kielten käännökset sen alla
  const groups = meaningsByLanguage(meanings);
  const ownGroup = (groups.find(([lang]) => lang === settings.lang) || [settings.lang, []])[1];
  const first = ownGroup[0];
  let trans = first ? splitList(first.translations || first.explanations).slice(0, 4).join(", ") : translationOf(w, 3);
  state.transWords = first ? splitList(first.translations).slice(0, 4) : splitList(w[LANGUAGES[settings.lang].col]).slice(0, 3);
  // Merkitys, jossa on vain käyttörajoitus (go: "i spørsmål"): "(ei norjannosta)" ja rajoitus perään
  const note = first && first.restrictions ? ` (${first.restrictions})` : "";
  if (trans) trans += note;
  if (trans) $("translation").innerHTML = labelledList(trans, settings.lang);
  else $("translation").textContent = t("noTranslationIn")[settings.lang] + note;
  renderApertium(w, trans);
  renderPivotFin(w, trans);
  renderExtraTranslations(w, groups);
  // Ensimmäinen saamenkielinen määritelmä kortissa, kaikki Merkitykset-välilehdellä
  state.definitions = data.definitions || [];
  state.alsoFin = data.alsoFin || "";
  const def = state.definitions[0];
  $("sme-def").hidden = !def;
  $("sme-def").innerHTML = def ? `<b>${esc(t("smeDef"))}</b>${esc(def.definition)}` : "";
  $("more-meanings").textContent = ownGroup.length > 1 ? t("moreMeanings", ownGroup.length - 1) :
    groups.some(([lang]) => lang !== settings.lang) ? t("otherLangs") : "";
  $("more-meanings").hidden = !$("more-meanings").textContent;  // tyhjä linkki ei jää Tab-järjestykseen

  renderGradation();
  renderInfo(w);
  renderPositions(w);
  renderDialect(w, meanings);
  renderTable();
  renderMeanings(meanings);
  renderRaw();
  if (pushHistory) addHistory(w.sme_lemma);
}

// Sanakirjan omat hakusanat, jotka ovat perussana + liitepartikkeli (ollugo = paljonko = ollu + -go). Vain varmimmat: lang-sme
// analysoi ja generoi sanan liitepartikkelilla, ja suomennos on perussanan suomennos + suomen liite (lang-finin analyysi).
// Merkitystä ei näytetä, koska sana on kiteytynyt omaksi sanakseen (dego = kuten, ei kysymys).
const LEXICAL_CLITICS = Object.fromEntries((
  "ainge=ain+ge attášitgo=attášit+go buorebutge=buorebut+ge dallege=dalle+ge dallehan=dalle+han " +
  "dallenai=dalle+nai deba=de+ba duođaige=duođai+ge dálge=dál+ge earáge=eará+ge galhan=gal+han geasge=geas+ge " +
  "goabbáge=goabbá+ge goasge=goas+ge gosabat=gosa+bat gosage=gosa+ge iige=ii+ge inge=in+ge joba=jo+ba " +
  "jogo=jo+go juoba=juo+ba juobe=juo+be juogo=juo+go maninge=manin+ge mannege=manne+ge moge=mo+ge nuba=nu+ba " +
  "nube=nu+be nuge=nu+ge nuvtge=nuvt+ge oktage=okta+ge ollugo=ollu+go velge=vel+ge velgo=vel+go velába=velá+ba " +
  "veláge=velá+ge álguige=álgui+ge"
).split(" ").map((item) => { const [word, parts] = item.split("="); return [word, parts.split("+")]; }));

// Asemasanat sanakortissa: genetiivi + alde (päällä) tai vuolde (alla). Tässä sanakirjojen esimerkeistä tarkistetut (jieŋa alde =
// jäällä, beavddi vuolde = pöydän alla). Vain nämä: alde ja vuolde eivät sovi kaikkiin sanoihin, joten rivejä ei muodosteta.
const ATTESTED_POSITIONS = {
  beavdi: { alde: "beavddi", vuolde: "beavddi" }, jiekŋa: { alde: "jieŋa" }, spábba: { alde: "spáppa" }, deahkka: { alde: "deahka" },
  eana: { alde: "eatnama" }, seaŋga: { vuolde: "seaŋgga" }, soffá: { vuolde: "soffá" }, šaldi: { vuolde: "šalddi" },
  govččas: { vuolde: "gokčasa" }, muorralátna: { vuolde: "muorralána" },
};

// Saman sanan toinen kirjoitusasu (dialects.py, kirku / girku): näytetään haettu asu otsikkona
// Haettu sana; jokerihaussa valitun rivin täsmännyt muoto (á?bmogis -> álbmogis)
const searchedWord = () => state.results?.[state.index]?.wild || state.query;
function shownLemma(w) {
  return w.dial_same && fold(searchedWord()) === fold(w.dial_same) ? w.dial_same : w.sme_lemma;
}

// Itä- ja länsisaamen merkintä (dialects.py): sanan oma alue ja toisen alueen sana sekä selite käännösten merkinnöille
function renderDialect(w, meanings) {
  const el = $("dialect-line");
  const side = (dial) => t(dial === "east" ? "dialEast" : "dialWest");
  const opposite = w.dialect === "east" ? "west" : "east";
  const parts = [];
  if (w.dial_same) {
    const shown = shownLemma(w);
    const own = shown === w.sme_lemma ? w.dialect : opposite;
    const other = shown === w.sme_lemma ? w.dial_same : w.sme_lemma;
    parts.push(`<b>${esc(shown)}</b> (${esc(side(own))}), <b>${esc(other)}</b> (${esc(side(own === "east" ? "west" : "east"))})`);
  } else if (w.dial_other) {
    const links = splitList(w.dial_other).map((o) => `<a class="base-link" href="#/sana/${encodeURIComponent(o)}">${esc(o)}</a>`);
    parts.push(`<b>${esc(w.sme_lemma)}</b> (${esc(side(w.dialect))}), ${esc(t("dialCompare"))} ${links.join(", ")} (${esc(side(opposite))})`);
  }
  const marked = meanings.some((m) => /\((it|lä|ø|v)\)/.test(m.translations || ""));
  if (parts.length || marked) parts.push(esc(t("dialLegend")));
  el.innerHTML = parts.join("  ·  ");
  el.hidden = !parts.length;
}

function renderPositions(w) {
  const el = $("position-line");
  const attested = w.pos === "N" && w.subtype !== "Prop" ? ATTESTED_POSITIONS[w.sme_lemma] : null;
  el.hidden = !attested;
  if (!attested) return;
  const phrase = (po, gen) => `${esc(t(po === "alde" ? "positionOn" : "positionUnder"))}: <b>${esc(gen)} ${po}</b>`;
  el.innerHTML = Object.entries(attested).map(([po, gen]) => phrase(po, gen)).join("  ·  ");
}

// Muut kielet -asetuksessa valittujen kielten käännökset pääkäännöksen alle (Englanniksi: house)
// Apertium (kokeellinen, tietokannan taulu apertium, apertium_data.py): norjan käännös konekääntimen sanastosta,
// vain jos sanalla ei ole käännöstä sanakirjoissa. Ei vaikuta hakuun, ja rivi merkitään tarkistamattomaksi.
function renderApertium(w, trans) {
  const line = $("apertium-line");
  line.hidden = true;
  if (trans || !settings.exp.apertium || settings.lang !== "nob") return;
  let rows = [];
  try {
    rows = all("SELECT nob FROM apertium WHERE word_id = ?", [w.id]);
  } catch (e) {
    return;  // vanha tietokanta ilman taulua
  }
  if (!rows.length) return;
  line.innerHTML = `${esc(rows[0].nob)} <span class="muted small">(${esc(t("apertiumNote"))})</span>`;
  line.hidden = false;
}

// Suomennosehdotus (kokeellinen, tietokannan taulu pivot_fin, pivot_fin.py): inarinsaamen tai norjan kautta
// muodostettu suomennos, vain jos sanalla ei ole suomennosta. Ei vaikuta hakuun, ja rivi merkitään tarkistamattomaksi.
function renderPivotFin(w, trans) {
  const line = $("pivot-fin-line");
  line.hidden = true;
  if (trans || !settings.exp.pivotFin || settings.lang !== "fin") return;
  let rows = [];
  try {
    rows = all("SELECT fin, via FROM pivot_fin WHERE word_id = ?", [w.id]);
  } catch (e) {
    return;  // vanha tietokanta ilman taulua
  }
  if (!rows.length) return;
  line.innerHTML = `${esc(rows[0].fin)} <span class="muted small">(${esc(t("pivotFinNote")[rows[0].via] || "")})</span>`;
  line.hidden = false;
}

function renderExtraTranslations(w, groups) {
  const lines = settings.extraLangs.filter((l) => LANGUAGES[l]).map((lang) => {
    const own = (groups.find(([l]) => l === lang) || [lang, []])[1][0];
    const text = own ? splitList(own.translations || own.explanations).slice(0, 4).join(", ") : translationOf(w, 3, lang);
    if (!text && lang === "eng") {
      // Wiktionaryn englanti suomen ja norjan kautta (taulu wikt_eng, wiktionary_eng.py): tarkistamaton, ei hakuun
      let row = null;
      try { row = all("SELECT eng FROM wikt_eng WHERE word_id = ?", [w.id])[0]; } catch (e) { /* vanha tietokanta */ }
      if (row) return `<span class="muted">${esc(t("langIn").eng)}:</span> ${labelledList(splitList(row.eng).slice(0, 3).join(", "), "eng")} ` +
        `<span class="muted small">(${esc(t("wiktEngNote"))})</span>`;
    }
    return text && `<span class="muted">${esc(t("langIn")[lang])}:</span> ${labelledList(text, lang)}`;
  }).filter(Boolean);
  const sms = skoltFor(w);
  if (sms) lines.push(`<span class="muted">${esc(t("langIn").sms)}${sms.via ? ` (${esc(t("smsVia"))})` : ""}:</span> ${esc(sms.text)}` +
    ` <span class="unchecked-badge">${esc(t("smsUnchecked"))}</span>`);
  $("extra-translations").hidden = !lines.length;
  $("extra-translations").innerHTML = lines.join("<br>");
}

// Koltansaame (kokeellinen, tietokannan taulu sms, export_web_data.py / skolt_data.py). Pohjoissaamen ja
// koltansaamen välillä ei ole sanakirjaa: suomen- tai norjankielisellä haulla koltan sanat ovat hakusanan omia
// vastineita (talo -> põrtt); muuten sanan suomennosten kautta (via: näytetään "suomen kautta").
function skoltFor(w) {
  if (!settings.skolt) return null;
  const lookup = (lang, word) => {
    try {
      return all("SELECT words FROM sms WHERE lang = ? AND fold = ? AND pos = ?", [lang, fold(word), w.pos])
        .flatMap((r) => splitList(r.words));
    } catch (e) {
      return [];  // vanha tietokanta ilman taulua
    }
  };
  if (state.transWord) {
    const own = lookup(settings.lang, state.transWord);
    if (own.length) return { text: own.join(", ") };
  }
  if (!settings.skoltViaSme) return null;
  // Ensimmäinen suomennos, jolle löytyy koltan sana (pääkäännös; muut suomennokset toisi muita merkityksiä:
  // oabbá = sisar, sisko -> vain sisar = vuäʹbb, ei "sisko"-tätisanoja)
  for (const f of splitList(w.finnish_translation).slice(0, 3)) {
    const viaFin = lookup("fin", f);
    if (viaFin.length) return { text: viaFin.join(", "), via: true };
  }
  return null;
}

function renderInfo(w) {
  const info = [];
  // Liitepartikkeli: muodon tunnistus vartalosta (boađátgo -> boađát) ja selitys omalle rivilleen
  if (state.clitic) {
    const parts = state.clitic.clitics.map((c) => {
      const m = t("cliticMeaning")[c];
      return `-${c}${m ? ` (${m})` : ""}`;
    });
    info.push(t("cliticInfo", state.query, state.clitic.stem, parts.join(" + ")));
  }
  if (state.finClitic) {
    const sme = SME_OF_FIN_CLITIC[state.finClitic.clitic].map((c) => "-" + c).join(", ");
    info.push(t("finCliticInfo", state.query, state.finClitic.stem, state.finClitic.clitic, sme));
  }
  const q = fold(state.clitic ? state.clitic.stem : searchedWord());
  const matches = [];
  for (const [tag, forms] of state.paradigm) {
    for (const f of forms) {
      if (fold(f) === q) {
        const g = state.grades.get(tag + "|" + f);
        matches.push(tag + (g ? ` (${g})` : ""));
      }
    }
  }
  let formTrans = "";
  // Liitepartikkeli: suomeksi sama liite suomen muotoon (boađátgo ≈ tuletko); norjassa liitettä ei ole, joten
  // rivillä on vartalo (boađát ≈ du kommer). Partikkeleille, joilla ei ole suomen vastinetta, sama kuin norjassa.
  const finClitics = state.clitic && settings.lang === "fin" && state.clitic.clitics.every((c) => FIN_CLITICS[c])
    ? state.clitic.clitics : null;
  const formLabel = state.clitic && !finClitics ? state.clitic.stem : searchedWord();
  if (matches.length && q !== fold(w.sme_lemma) && q !== fold(w.dial_same || "")) {
    info.push(t("searchedForm", state.clitic ? state.clitic.stem : searchedWord(), [...new Set(matches)].join(", ")));
    if (FORM_PHRASES[settings.lang]) formTrans = translationOfForm(w, matches.map((m) => m.split(" ")[0]), finClitics);
  }
  // Haetun muodon käännös omalle rivilleen käännöksen alle (viesus ≈ talossa / talosta, i huset / fra huset).
  // Toiseen suuntaan: taivutettu käännös (juon = juoda ≈ jugan), jos haku ei ollut saamen muoto.
  let html = formTrans ? t("formIn", esc(formLabel), esc(formTrans), settings.lang) : "";
  if (!html && state.via) {
    const tag = settings.lang === "fin" ? samiTagOfFinCell(state.via.cell, w.pos.toUpperCase(), state.via.base, w.human) : null;
    const sme = tag && (state.paradigm.get(tag) || [])[0];
    // tuletko = tulla ≈ boađátgo: saamen muotoon sama liite saamen vastineena (-kin: -ge / -nai)
    // Saamen 3. persoonan ja mii-imperatiiviin (boahtos, boahtit) liitettä ei voi lisätä (lang-sme ei hyväksy): muoto ilman
    // (myös monikon 2. persoonan muoto -hket: čuggejehket)
    const noClitic = /^Imprt\+(Sg3|Du1|Du3|Pl1|Pl3)$/.test(tag || "") || (tag === "Imprt+Pl2" && /hket$/.test(sme || ""));
    const smeForm = sme && state.finClitic && !noClitic
      ? SME_OF_FIN_CLITIC[state.finClitic.clitic].map((c) => sme + c).join(" / ") : sme;
    html = t("viaForm", esc(state.query), esc(state.via.base), smeForm ? esc(smeForm) : "", sme ? tag : "");
  }
  $("form-translation").hidden = !html;
  $("form-translation").innerHTML = html;
  if (w.notes) info.push(w.notes);
  // ollugo = ollu + -go, perussana linkkinä
  const parts = !state.clitic && LEXICAL_CLITICS[w.sme_lemma];
  const baseLink = parts ? `${esc(w.sme_lemma)} = <a class="base-link" href="#/sana/${encodeURIComponent(parts[0])}">${esc(parts[0])}</a> + -${esc(parts[1])}` : "";
  $("word-info").innerHTML = [baseLink, ...info.map(esc)].filter(Boolean).join("  ·  ");
}

// --- Käännöksen taivutus: haetun saamen muodon vastine suomeksi tai norjaksi ---
// Muodot taulukoissa fin_forms (GiellaLT lang-fin, ks. fin_forms.py) ja nob_forms (Norsk ordbank, nob_forms.py).

const NOB_PRONOUNS = { Sg1: "jeg", Sg2: "du", Sg3: "han/hun", Du1: "vi (2)", Du2: "dere (2)", Du3: "de (2)",
                       Pl1: "vi", Pl2: "dere", Pl3: "de" };
const FIN_PRONOUNS = { Sg1: "minä", Sg2: "sinä", Sg3: "hän", Du1: "me (2)", Du2: "te (2)", Du3: "he (2)",
                       Pl1: "me", Pl2: "te", Pl3: "he" };
// lang-fin antaa olla-verbin potentiaaliksi ollen / lie; yleiskielessä lienen, en liene
const FIN_OLLA_POTENTIAL = { "Pot+Sg1": "lienen", "Pot+Sg2": "lienet", "Pot+Sg3": "lienee", "Pot+Pl1": "lienemme",
                             "Pot+Pl2": "lienette", "Pot+Pl3": "lienevät", "Pot+ConNeg": "liene" };
const FIN_NEG_AUX = { Sg1: "en", Sg2: "et", Sg3: "ei", Du1: "emme", Du2: "ette", Du3: "eivät", Pl1: "emme", Pl2: "ette", Pl3: "eivät" };

// Persoonapronominien muodot: suomi lang-fin-generaattorista (yleiskieliset muodot), norja vastaa dict-sme-nob:n
// taivutettuja hakusanoja (munnje = til meg, muinna = med meg, munin = som meg). Pronomineja ei ole taulukoissa
// fin_forms / nob_forms, jotka kattavat vain substantiivit, verbit ja adjektiivit.
const finPronoun = (Nom, Acc, Gen, Par, stem, Ill, front, Com) => {
  const [a, o] = front ? ["ä", "ö"] : ["a", "o"];
  return { Nom, Acc, Gen, Par, Ine: `${stem}ss${a}`, Ela: `${stem}st${a}`, Ill, Ade: `${stem}ll${a}`, Abl: `${stem}lt${a}`,
           All: `${stem}lle`, Ess: `${stem}n${a}`, Tra: `${stem}ksi`, Com };
};
const FIN_MINA = finPronoun("minä", "minut", "minun", "minua", "minu", "minuun", false, "minun kanssani");
const FIN_SINA = finPronoun("sinä", "sinut", "sinun", "sinua", "sinu", "sinuun", false, "sinun kanssasi");
const FIN_HAN = finPronoun("hän", "hänet", "hänen", "häntä", "häne", "häneen", true, "hänen kanssaan");
const FIN_ME = finPronoun("me", "meidät", "meidän", "meitä", "mei", "meihin", true, "meidän kanssamme");
const FIN_TE = finPronoun("te", "teidät", "teidän", "teitä", "tei", "teihin", true, "teidän kanssanne");
const FIN_HE = finPronoun("he", "heidät", "heidän", "heitä", "hei", "heihin", true, "heidän kanssaan");
const FIN_PRONOUN_FORMS = [FIN_MINA, FIN_SINA, FIN_HAN, FIN_ME, FIN_TE, FIN_HE];
const nobPronoun = (Nom, obj, Gen) => ({ Nom, Acc: obj, Gen, Ill: `til ${obj}`, Loc: `hos ${obj} / fra ${obj}`,
                                         Com: `med ${obj}`, Ess: `som ${obj}` });
const NOB_MEG = nobPronoun("jeg", "meg", "min"), NOB_DEG = nobPronoun("du", "deg", "din");
const NOB_HAM = nobPronoun("han/hun", "ham/henne", "hans/hennes"), NOB_OSS = nobPronoun("vi", "oss", "vår");
const NOB_DERE = nobPronoun("dere", "dere", "deres"), NOB_DEM = nobPronoun("de", "dem", "deres");
// Saamen persoonapronomini -> muodot; dual: näytetään muodossa "meille (2)"
const PERS_PRONOUNS = {
  mun: { fin: FIN_MINA, nob: NOB_MEG }, don: { fin: FIN_SINA, nob: NOB_DEG }, son: { fin: FIN_HAN, nob: NOB_HAM },
  moai: { fin: FIN_ME, nob: NOB_OSS, dual: true }, doai: { fin: FIN_TE, nob: NOB_DERE, dual: true },
  soai: { fin: FIN_HE, nob: NOB_DEM, dual: true }, mii: { fin: FIN_ME, nob: NOB_OSS },
  dii: { fin: FIN_TE, nob: NOB_DERE }, sii: { fin: FIN_HE, nob: NOB_DEM },
};
// Suomen pronominin sija -> saamen sija (minulle = munnje, minulla = mus)
const SAMI_CASE_OF_FIN_PRONOUN = { Acc: "Acc", Gen: "Gen", Par: "Acc", Ine: "Loc", Ela: "Loc", Ill: "Ill", Ade: "Loc",
                                   Abl: "Loc", All: "Ill", Ess: "Ess", Tra: "Ess", Com: "Com" };

// Saamen sija -> persoonapronominin muodot käännöskielellä, yleisin ensin (mus = minulla / minulta / minussa / minusta)
function pronounPhrase(tag, forms, lang) {
  if (lang === "nob") return forms[tag] || null;
  const cells = { Nom: ["Nom"], Acc: ["Acc", "Par"], Gen: ["Gen"], Ill: ["All", "Ill"], Loc: ["Ade", "Abl", "Ine", "Ela"],
                  Com: ["Com"], Ess: ["Ess"] }[tag];
  return cells ? cells.map((c) => forms[c]).join(" / ") : null;
}
const markDual = (phrase) => phrase.split(" / ").map((p) => `${p} (2)`).join(" / ");
// Saamen duaali on suomeksi monikko (moai dagaime = me (kaksi) teemme)
const FIN_PERSON = { Sg1: "Sg1", Sg2: "Sg2", Sg3: "Sg3", Du1: "Pl1", Du2: "Pl2", Du3: "Pl3", Pl1: "Pl1", Pl2: "Pl2", Pl3: "Pl3" };

// "Sg+Indef=hus;Sg+Def=huset;..." -> {"Sg+Indef": "hus", ...}; vaihtoehdoista (husene/husa) ensimmäinen
function translationForms(lang, word, pos) {
  if (lang === "nob" && pos === "Num") return word ? { word, __back: null } : null;
  try {
    const row = all(`SELECT * FROM ${lang}_forms WHERE word = ? AND pos = ?`, [word, pos])[0];
    if (!row) return null;
    const forms = Object.fromEntries(row.forms.split(";").map((c) => c.split("=")).map(([k, v]) => [k, v.split("/")[0]]));
    if (lang === "fin" && word === "olla") Object.assign(forms, FIN_OLLA_POTENTIAL);
    // Suomen vokaalisointu liitepartikkelia varten (1/0; puuttuu vanhasta tietokannasta)
    forms.__back = row.back === undefined || row.back === null ? null : !!row.back;
    forms.__word = word;
    return forms;
  } catch (e) {
    return null;  // vanha tietokanta ilman taulua
  }
}

// Saamen muodon tagi (Sg+Loc, Ind+Prs+Sg1 ...) -> norjankielinen ilmaus, esim. "i huset / fra huset".
// Saamessa ei ole määräistä artikkelia: prepositioiden kanssa käytetään määräistä muotoa.
function nobPhrase(tag, pos, f) {
  const parts = tag.split("+");
  // Numeraali ei taivu norjassa: tre, til tre, med tre (genetiiville ei ole luonnollista vastinetta)
  if (pos === "Num") {
    return { Nom: f.word, Acc: f.word, Ill: `til ${f.word}`, Loc: `i ${f.word} / fra ${f.word}`, Com: `med ${f.word}`,
             Ess: `som ${f.word}` }[parts[parts.length - 1]] || null;
  }
  if (pos === "V") {
    const person = parts.find((p) => NOB_PRONOUNS[p]);
    if (tag === "Inf") return f.Inf && `å ${f.Inf}`;
    if (tag === "PrfPrc") return f.PrfPrc && `har ${f.PrfPrc}`;
    // Kieltoverbin kanssa käytettävä muoto (ii daga = gjør ikke)
    if (tag === "Ind+Prs+ConNeg") return f.Prs && `(ikke) ${f.Prs}`;
    if (tag === "Ind+Prt+ConNeg") return f.Prt && `(ikke) ${f.Prt}`;
    if (tag === "Imprt+ConNeg") return f.Imp && `ikke ${f.Imp}!`;
    if (!person) return null;
    const who = NOB_PRONOUNS[person];
    if (parts[0] === "Ind") return parts[1] === "Prs" ? f.Prs && `${who} ${f.Prs}` : f.Prt && `${who} ${f.Prt}`;
    if (parts[0] === "Cond") return f.Inf && `${who} ville ${f.Inf}`;
    if (parts[0] === "Pot") return f.Prs && `${who} ${f.Prs} kanskje`;
    if (parts[0] === "Imprt") return ["Sg2", "Du2", "Pl2"].includes(person) ? f.Imp && `${f.Imp}!` : f.Inf && `la ${{ Sg1: "meg", Sg3: "ham/henne", Du1: "oss (2)", Pl1: "oss", Du3: "dem (2)", Pl3: "dem" }[person]} ${f.Inf}`;
    return null;
  }
  if (pos === "A") {
    if (parts[0] === "Comp") return f.Comp;
    if (parts[0] === "Superl") return f.Superl;
    return parts[0] === "Pl" ? f.Pl : f.Pos;
  }
  const pl = parts[0] === "Pl";
  const indef = f[pl ? "Pl+Indef" : "Sg+Indef"], def = f[pl ? "Pl+Def" : "Sg+Def"];
  switch (parts[parts.length - 1]) {
    case "Nom": case "Acc": return indef;
    case "Gen": return def && def + (/[sxz]$/.test(def) ? "'" : "s");
    case "Ill": return def && `til ${def}`;
    case "Loc": return def && `i ${def} / fra ${def}`;
    case "Com": return def && `med ${def}`;
    case "Ess": return f["Sg+Indef"] && `som ${f["Sg+Indef"]}`;
  }
  return null;
}

// Saamen muodon tagi -> suomenkielinen muoto. Saamen lokatiivi on suomeksi sisä- tai ulkopaikallissija
// (viesus = talossa / talosta), illatiivi illatiivi tai allatiivi (taloon / talolle), komitatiivi "kanssa".
function finPhrase(tag, pos, f, human = false) {
  const parts = tag.split("+");
  const join = (...forms) => forms.filter(Boolean).join(" / ") || null;
  if (pos === "V") {
    const person = FIN_PERSON[parts[parts.length - 1]];
    if (tag === "Inf") return f.Inf;
    if (tag === "PrfPrc") return f.PrfPrc;
    // Uudet suomen muodot (fin_forms.py): stoahkamin = leikkimässä, dieđekeahttá = tietämättä, vuovdimis = myymästä
    // (myös myymisestä), bálvaleaddji = palveleva (usein oma adjektiivinsa); rivi on aina likimääräinen (≈)
    if (tag === "Actio+Ess") return f["InfMa+Ine"];
    if (tag === "VAbess") return f["InfMa+Abe"];
    if (tag === "Actio+Loc") return f["InfMa+Ela"];
    if (tag === "PrsPrc") return f.PrsPrc;
    // Passiivi (sme_passive.py): suomen passiivi on persoonaton (mun válljejuvvon = minut valittiin)
    if (parts[0] === "Pass") {
      if (tag === "Pass+PrfPrc") return f.PssPrfPrc;
      if (parts[1] === "Ind" && parts[2] === "Prs" && parts[3] !== "ConNeg") return f["Pss+Prs"];
      if (parts[1] === "Ind" && parts[2] === "Prt" && parts[3] !== "ConNeg") return f["Pss+Prt"];
      return null;
    }
    if (tag === "Ind+Prs+ConNeg") return f["Prs+ConNeg"] && `(ei) ${f["Prs+ConNeg"]}`;
    if (tag === "Ind+Prt+ConNeg") return f.PrfPrc && `(ei) ${f.PrfPrc}`;
    if (tag === "Cond+Prs+ConNeg") return f["Cond+ConNeg"] && `(ei) ${f["Cond+ConNeg"]}`;
    if (tag === "Pot+Prs+ConNeg") return f["Pot+ConNeg"] && `(ei) ${f["Pot+ConNeg"]}`;
    if (tag === "Imprt+ConNeg") return f["Prs+ConNeg"] && `(älä) ${f["Prs+ConNeg"]}`;
    if (!person) return null;
    if (parts[0] === "Ind") return f[`${parts[1]}+${person}`];
    if (parts[0] === "Cond" || parts[0] === "Pot" || parts[0] === "Imprt") return f[`${parts[0]}+${person}`];
    return null;
  }
  if (pos === "A") {
    if (parts[0] === "Comp") return f.Comp;
    if (parts[0] === "Superl") return f.Superl;
    if (tag === "Attr") return f["Sg+Nom"];
  }
  const n = parts[0] === "Pl" ? "Pl" : "Sg";
  const people = (pos === "Pron" && PEOPLE_PRONOUNS.includes(f.__word)) || (pos === "N" && human);
  switch (parts[parts.length - 1]) {
    case "Nom": return f[`${n}+Nom`];
    case "Acc": return join(f[`${n}+Acc`], f[n === "Sg" ? "Sg+Gen" : "Pl+Nom"], f[`${n}+Par`]);  // kenet, talon / taloa (objekti)
    case "Gen": return f[`${n}+Gen`];
    // -lle, -lla ja -lta vain ihmisistä (geasa = keneen / kenelle, áhkkui = isoäitiin / isoäidille), muilla sanoilla ne
    // eivät ole varmoja (ks. uncertainFinCell)
    case "Ill": return join(f[`${n}+Ill`], people && f[`${n}+All`]);
    case "Loc": return join(f[`${n}+Ine`], f[`${n}+Ela`], people && f[`${n}+Ade`], people && f[`${n}+Abl`]);
    case "Com": return f[`${n}+Gen`] && `${f[`${n}+Gen`]} kanssa`;
    case "Ess": return f["Sg+Ess"];
  }
  return null;
}

const FORM_PHRASES = { fin: finPhrase, nob: nobPhrase };
// Sanaluokat, joiden käännökset taipuvat (taulukoissa fin_forms ja nob_forms sanaluokka on kirjoitettu näin)
const FORM_POS = { N: "N", V: "V", A: "A", NUM: "Num", PRON: "Pron" };

// Haetun muodon tagit -> "jeg lager, jeg gjør" (yksi ilmaus käännöstä kohden, tagien vaihtoehdot /-merkillä)
// Pohjoissaamen liitepartikkeli suomeksi (GiellaLT lang-fin: +Qst, +Foc/kin, +Foc/kaan, +Foc/han):
// takavokaalinen ja etuvokaalinen muoto. -ge on myönteisessä lauseessa -kin, kielteisessä -kaan, joten molemmat.
const FIN_CLITICS = { go: [["ko", "kö"]], nai: [["kin", "kin"]], ge: [["kin", "kin"], ["kaan", "kään"]],
                      son: [["han", "hän"]], han: [["han", "hän"]] };
// Vokaalisointu sanan viimeisestä a/o/u- tai ä/ö/y-vokaalista: vain varalla, jos tietokannassa ei ole fin_forms.back-
// merkintää (yhdyssanan jälkiosan mukaan, export_web_data.py: fin_harmony)
function finBackVowels(word) {
  const m = word.toLowerCase().match(/[aouäöy](?=[^aouäöy]*$)/);
  return !!m && "aou".includes(m[0]);
}
// Taivutuspäätteen vokaali kertoo soinnun (maanteistä -> maanteistähän, talossa -> talossako): päätteessä (sanan
// viimeiset 4 kirjainta) oleva a/o/u tai ä/ö/y ratkaisee. null, jos päätteessä ei ole (postimerkeille -> perusmuodon mukaan).
function finEndingBack(word) {
  const m = word.toLowerCase().slice(-4).match(/[aouäöy](?=[^aouäöy]*$)/);
  return m ? "aou".includes(m[0]) : null;
}
// Liite fraasin viimeiseen sanaan: tulet -> tuletko, (ei) tule -> (ei) tulekaan, talon kanssa -> talon kanssako.
// back: perusmuodon sointu (postimerkki -> postimerkillekö); -ge antaa kaksi muotoa (tuletkin / tuletkaan).
// Kieltoverbin kanssa (ei/älä + pääverbi) suomessa kysymys- ja -han-liite tulevat kieltoverbiin: eikö tuleskele,
// eihän tule (ei *tuleskeleko). -kaan jää pääverbiin (ei tulekaan), ja -kin ei käy kieltolauseeseen lainkaan.
const FIN_NEG = /^\((ei|älä)\) (.+)$/;
const FIN_NEG_CLITIC = { go: "kö", son: "hän", han: "hän" };

function finWithClitics(phrase, clitics, back) {
  // "talossa / talosta" (paikallissija) on kaksi vaihtoehtoa: liite kumpaankin
  let variants = phrase.split(" / ");
  const neg = variants.length === 1 && phrase.match(FIN_NEG);
  if (neg) {
    let [, aux, verb] = neg;
    for (const c of clitics) {
      if (FIN_NEG_CLITIC[c]) aux += FIN_NEG_CLITIC[c];
      else verb += (finEndingBack(verb) ?? back ?? finBackVowels(verb)) ? "kaan" : "kään";  // -ge, -nai: ei tulekaan
    }
    return `(${aux}) ${verb}`;
  }
  for (const c of clitics) {
    variants = variants.flatMap((p) => FIN_CLITICS[c].map(([b, f]) => {
      const words = p.split(" ");
      const last = words.pop();
      const isBack = last === "kanssa" ? true : finEndingBack(last) ?? back ?? finBackVowels(last);
      return [...words, last + (isBack ? b : f)].join(" ");
    }));
  }
  return variants.join(" / ");
}

// transWords: käännökset, joita taivutetaan (oletuksena avoimen sanakortin; kuvan kupla antaa omansa)
function translationOfForm(w, tags, finClitics = null, transWords = state.transWords) {
  const pron = w.subtype === "Pers" && PERS_PRONOUNS[w.sme_lemma];
  if (pron && pron[settings.lang]) {
    const phrases = tags.map((tag) => pronounPhrase(tag, pron[settings.lang], settings.lang)).filter(Boolean)
      .map((p) => (finClitics ? finWithClitics(p, finClitics, null) : p)).map((p) => (pron.dual ? markDual(p) : p));
    return [...new Set(phrases)].join(" / ");
  }
  const pos = FORM_POS[w.pos.toUpperCase()];
  if (!pos) return "";
  const out = [];
  for (const word of transWords || []) {
    const forms = translationForms(settings.lang, word.replace(/\(.*?\)/g, "").trim(), pos);
    if (!forms) continue;
    let phrases = [...new Set(tags.map((tag) => FORM_PHRASES[settings.lang](tag, pos, forms, w.human)).filter(Boolean))];
    if (finClitics) phrases = phrases.map((p) => finWithClitics(p, finClitics, forms.__back));
    if (phrases.length) out.push(phrases.join(" / "));
  }
  return [...new Set(out)].join(", ");
}

// Taivutusluokka (inflection_class.py): astesääntö vain substantiiveille, verbeille pelkkä luokka
function inflectionClassCell(w) {
  if (!w.inflection_class) return "";
  const verb = w.pos.toUpperCase() === "V";
  const name = t(verb ? "verbClassNames" : "nomClassNames")[w.inflection_class];
  const rule = verb ? "" : `<span class="gc-rule">${t("nomClassRules")[w.inflection_class]}</span>`;
  return `<div class="grad-cell infl-class"><span class="gc-cap">${esc(t(verb ? "verbClass" : "nomClass"))}</span>` +
         `<span class="gc-val">${esc(name)}${rule}</span></div>`;
}

// Kortissa tiivis rivi (viessu → viesu · ss → s), täydet tiedot Astevaihtelu-välilehdellä (kokeilu B, test-fable)
function renderGradation() {
  renderGradationFull();
  const w = state.word, full = $("gradation"), sum = $("grad-sum");
  const any = full.innerHTML !== "";
  $("grade-tab").hidden = !any;
  if (!any && state.tab === "grade") setTab("table");
  sum.hidden = !any;
  if (!any) return;
  const forms = full.querySelector(".grad-cell.forms .gc-val");
  sum.innerHTML = (forms
    ? `<span class="gs-forms" lang="se" translate="no">${forms.innerHTML}</span><span class="gs-clusters"><span class="gd">${esc(w.gd_cluster)}</span> → <span class="hd">${esc(w.hd_cluster)}</span></span>`
    : `<span class="muted"><i>${esc(t("noGradation"))}</i></span>`) + `<span class="gs-more">${esc(t("gradation"))} ›</span>`;
}
function renderGradationFull() {
  const w = state.word;
  const el = $("gradation");
  if (!settings.showGrade || UNINFLECTED_POS.includes(w.pos.toUpperCase()) || !state.paradigm.size) { el.innerHTML = ""; return; }
  if (!w.gradation) { el.innerHTML = `<div class="grad-head">${esc(t("gradation"))}</div><span class="muted"><i>${esc(t("noGradation"))}</i></span>` +
    (w.inflection_class ? `<div class="grad-cells">${inflectionClassCell(w)}</div>` : ""); return; }

  // Esimerkkimuodot: haettu muoto tai perusmuoto ja tavallisin vastakkaisen asteen muoto
  const preferred = ["Inf", "Sg+Nom", "Nom", "Ind+Prs+Sg1", "Sg+Acc", "Acc", "Sg+Gen", "Pl+Nom"];
  const tags = [...preferred, ...[...state.paradigm.keys()].filter((t) => !preferred.includes(t))];
  const examples = {};
  const q = fold(searchedWord());
  for (const [key, g] of state.grades) {
    const surface = key.split("|")[1];
    if (fold(surface) === q && !examples[g]) examples[g] = surface;
  }
  for (const tag of tags) {
    for (const f of state.paradigm.get(tag) || []) {
      const g = state.grades.get(tag + "|" + f);
      if (g && !examples[g]) examples[g] = f;
    }
  }
  // "hkk (III) · hk (II) · g (I)" -> asteet; vahva vihreä, heikko oranssi, muut harmaina
  const parts = (w.gradation_row || "").split(" · ").filter(Boolean).map((part) => part.replace(/\)$/, "").split(" ("));
  // Sama kirjoitusasu voi esiintyä kahdessa asteessa (nn III, nn II). Yleensä vaihtelu on II ~ I (mannat ~ manan),
  // mutta kontrahoituvassa sanassa heikosta perusmuodosta tullaan asteeseen III (suolu ~ sullo, boazu ~ bohcco).
  const form = (...formTags) => {
    const tag = formTags.find((x) => state.paradigm.get(x)?.length);
    return tag ? [state.paradigm.get(tag)[0], state.grades.get(tag + "|" + state.paradigm.get(tag)[0])] : [];
  };
  const syllables = (s) => (s.toLowerCase().match(/[aáeiouyäöâ]+/g) || []).length;
  const [baseForm, baseGrade] = form("Sg+Nom", "Nom");
  const [genForm, genGrade] = form("Sg+Gen", "Gen");
  const contracted = baseGrade === "HD" && genGrade === "GD" && syllables(baseForm) === syllables(genForm);
  const values = parts.map(([value]) => value);
  const strongIdx = contracted ? values.indexOf(w.gd_cluster) : values.lastIndexOf(w.gd_cluster);
  const grades = parts.map(([value, q2], i) => {
    let cls = "other";
    if (i === strongIdx) cls = "gd";
    else if (value === w.hd_cluster) cls = "hd";
    return `<span class="${cls}">${esc(value)} <small>${esc(q2 || "")}</small></span>`;
  }).join('<span class="sep"> · </span>');
  // Omat solut: esimerkkimuodot, konsonantit, asteet ja astevaihteluryhmä; solu rivittyy kokonaisena
  const cell = (cap, val, cls = "") => `<div class="grad-cell ${cls}"><span class="gc-cap">${esc(cap)}</span><span class="gc-val">${val}</span></div>`;
  const arrow = '<span class="arrow">→</span>';
  el.innerHTML = `<div class="grad-head">${esc(t("gradation"))}</div><div class="grad-cells">`
    + cell(t("gradForms"), `<span class="gd">${esc(examples.GD || "-")}</span> ${arrow} <span class="hd">${esc(examples.HD || "-")}</span>`, "forms")
    + cell(t("gradClusters"), `<span class="gd">${esc(w.gd_cluster)}</span> ${arrow} <span class="hd">${esc(w.hd_cluster)}</span>`)
    + (grades ? cell(t("gradGrades"), grades) : "")
    + (w.gradation_group ? cell(t("gradGroup"),
      // rivitys vain välilyönneistä, ei tavuviivasta (h-čoahkit)
      w.gradation_group.split(" ").map((p) => `<span class="nw">${esc(p)}</span>`).join(" "), "group") : "")
    + inflectionClassCell(w)
    + "</div>";
}

// --- Taivutustaulukko ---

// Kokeellinen (exp.tableTr): muodon käännös taivutustaulukon solussa. Käytetään ensimmäistä käännöstä, jolle on
// taivutus. Jos oikeaa muotoa ei saada (esim. älkää tehkö, partisiipit), solu jää ilman käännöstä eikä muotoa arvata.
function formTranslator(w) {
  const pos = FORM_POS[w.pos.toUpperCase()];
  const lang = settings.lang;
  const pron = w.subtype === "Pers" && PERS_PRONOUNS[w.sme_lemma];
  if (pron && pron[lang]) return (tags) => translationOfForm(w, tags);
  if (!pos || !FORM_PHRASES[lang]) return () => "";
  let forms = null;
  for (const word of state.transWords || []) {
    forms = translationForms(lang, word.replace(/\(.*?\)/g, "").trim(), pos);
    if (forms) break;
  }
  if (!forms) return () => "";
  const f = forms;
  return (tags, neg = null) => {
    const phrases = tags.map((tag) => (neg ? negVerbPhrase(lang, tag, neg, f) : positivePhrase(lang, tag, pos, f, w.human))).filter(Boolean);
    return [...new Set(phrases.flatMap((p) => p.split(" / ")))].join(" / ");
  };
}

function positivePhrase(lang, tag, pos, f, human = false) {
  const phrase = FORM_PHRASES[lang](tag, pos, f, human);
  if (!phrase || pos !== "V") return phrase;
  const person = tag.split("+").pop();
  if (lang !== "fin" || !FIN_PRONOUNS[person]) {
    return lang === "nob" && tag === `Imprt+Du2` ? `${phrase} (2)` : phrase;
  }
  if (tag.startsWith("Imprt")) return person.startsWith("Du") ? `${phrase} (2)` : phrase;
  return `${FIN_PRONOUNS[person]} ${phrase}`;
}

// Kielteinen muoto persoonan mukaan (mun in daga = minä en tee, jeg gjør ikke). tag on saamen ConNeg-tagi.
function negVerbPhrase(lang, tag, person, f) {
  const plural = person.startsWith("Pl") || person.startsWith("Du");
  if (lang === "fin") {
    const who = FIN_PRONOUNS[person], aux = FIN_NEG_AUX[person];
    // Monikon partisiippi: tehnyt -> tehneet, tullut -> tulleet (aina -[uy]t -> -eet)
    const prt = f.PrfPrc && (plural ? f.PrfPrc.replace(/[uy]t$/, "eet") : f.PrfPrc);
    const main = { "Ind+Prs+ConNeg": f["Prs+ConNeg"], "Ind+Prt+ConNeg": prt, "Cond+Prs+ConNeg": f["Cond+ConNeg"],
                   "Pot+Prs+ConNeg": f["Pot+ConNeg"] }[tag];
    if (tag === "Imprt+ConNeg") return person === "Sg2" && f["Prs+ConNeg"] ? `älä ${f["Prs+ConNeg"]}` : null;
    return main && `${who} ${aux} ${main}`;
  }
  const who = NOB_PRONOUNS[person];
  switch (tag) {
    case "Ind+Prs+ConNeg": return f.Prs && `${who} ${f.Prs} ikke`;
    case "Ind+Prt+ConNeg": return f.Prt && `${who} ${f.Prt} ikke`;
    case "Cond+Prs+ConNeg": return f.Inf && `${who} ville ikke ${f.Inf}`;
    case "Pot+Prs+ConNeg": return f.Prs && `${who} ${f.Prs} kanskje ikke`;
    case "Imprt+ConNeg":
      if (!f.Imp || !["Sg2", "Du2", "Pl2"].includes(person)) return null;
      return `ikke ${f.Imp}!${person === "Du2" ? " (2)" : ""}`;
  }
  return null;
}

function renderTable() {
  const w = state.word;
  const pos = w.pos.toUpperCase();
  const p = state.paradigm;
  const showGrade = settings.showGrade;
  const legend = showGrade && state.grades.size;

  const pairs = (...tags) => {
    const out = [], seen = new Set();
    for (const tag of tags) for (const v of p.get(tag) || []) if (!seen.has(v)) { seen.add(v); out.push([tag, v]); }
    return out;
  };
  // Persoonapronominien muodot on tarkistettu, joten ne näkyvät aina; muiden sanojen konekäännökset kokeellisella kytkimellä
  const translate = settings.exp.tableTr || (w.subtype === "Pers" && PERS_PRONOUNS[w.sme_lemma]) ? formTranslator(w) : null;
  // Muotosolu: pronomini harmaana, muodot asteen värillä; napautus ääntää muodon
  const cell = (items, prefix = "", trTags = null, neg = null) => {
    if (!items.length) return `<td class="pron">-</td>`;
    const forms = items.map(([tag, v]) => {
      const g = showGrade ? state.grades.get(tag + "|" + v) : null;
      const cls = g === "GD" ? "gd" : g === "HD" ? "hd" : "";
      const speak = (prefix ? prefix + " " : "") + v;
      return `<span class="form ${cls}" data-speak="${esc(speak)}" title="${esc(t("listenTo", speak))}">${esc(v)}</span>`;
    }).join('<span class="sep"> / </span>');
    const tr = translate ? translate(trTags || items.map(([tag]) => tag), neg) : "";
    return `<td>${prefix ? `<span class="pron">${esc(prefix)}</span> ` : ""}${forms}${tr ? `<span class="form-tr">${esc(tr)}</span>` : ""}</td>`;
  };
  const label = (t) => `<td class="label">${esc(t)}</td>`;
  const section = (...cells) => `<tr class="section">${cells.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`;
  // Verbitaulukko ryhmiteltynä: yksikkö, duaali ja monikko omiin pyöristettyihin laatikoihinsa, pääosioiden väliin pieni rako
  const gap = (cls) => `<tr class="gap ${cls}" aria-hidden="true"><td colspan="5"></td></tr>`;
  const verbSection = (first, ...cells) => (first ? "" : gap("gap-sec")) + section(...cells) + gap("gap-after");
  const personRows = (rowFn) => PERSONS.map((pp, i) => {
    const cls = pp.endsWith("1") ? "g-first" : pp.endsWith("3") ? "g-last" : "";
    return `<tr${cls ? ` class="${cls}"` : ""}>${rowFn(pp)}</tr>` + (pp.endsWith("3") && i < PERSONS.length - 1 ? gap("") : "");
  }).join("");

  let html = "";
  if (!p.size && !UNINFLECTED_POS.includes(pos)) {
    html = `<p class="muted">${esc(t("noForms"))}</p>`;
  } else if (pos === "V") {
    let rows = verbSection(true, t("indicative"), t("present"), "", t("preterite"), "");
    rows += personRows((pp) => {
      const pr = PRONOUNS[pp];
      return `${label(pp)}${cell(pairs(`Ind+Prs+${pp}`), pr)}${cell(pairs("Ind+Prs+ConNeg"), `${pr} ${NEG_AUX[pp]}`, null, pp)}` +
             `${cell(pairs(`Ind+Prt+${pp}`), pr)}${cell(pairs("Ind+Prt+ConNeg"), `${pr} ${NEG_AUX[pp]}`, null, pp)}`;
    });
    rows += verbSection(false, "", t("conditional"), "", t("potential"), "");
    rows += personRows((pp) => {
      const pr = PRONOUNS[pp];
      return `${label(pp)}${cell(pairs(`Cond+Prs+${pp}`), pr)}${cell(pairs("Cond+Prs+ConNeg"), `${pr} ${NEG_AUX[pp]}`, null, pp)}` +
             `${cell(pairs(`Pot+Prs+${pp}`), pr)}${cell(pairs("Pot+Prs+ConNeg"), `${pr} ${NEG_AUX[pp]}`, null, pp)}`;
    });
    rows += verbSection(false, "", t("imperative"), "", "", "");
    rows += personRows((pp) => `${label(pp)}${cell(pairs(`Imprt+${pp}`))}${cell(pairs("Imprt+ConNeg"), NEG_AUX_IMPRT[pp], null, pp)}<td></td><td></td>`);
    let nf = section(t("nonFinite"), "");
    VERB_NONFINITE_TAGS.forEach((tag, i) => { nf += `<tr>${label(t("nonFiniteRows")[i])}${cell(pairs(tag))}</tr>`; });
    html = table(["", t("affirmative"), t("negative"), t("affirmative"), t("negative")], rows, "grouped") + table(null, nf);
  } else if (UNINFLECTED_POS.includes(pos)) {
    html = table(["", t("baseForm")], `<tr>${label(t("uninflected"))}${cell([["", w.sme_lemma]])}</tr>`);
  } else if (!p.has("Sg+Nom") && !p.has("Pl+Nom") && p.has("Nom")) {
    // Persoona- ja refleksiivipronominit: luku ja persoona kuuluvat jo perusmuotoon
    let rows = "";
    for (const [name, cases] of [...CASE_ROWS, ["Ess", ["Ess"]]]) rows += `<tr>${label(name)}${cell(pairs(...cases), "", cases)}</tr>`;
    html = table([t("caseCol"), t("formCol")], rows);
  } else {
    // ol. = ovttaidlohku (yksikkö), ml. = máŋggaidlohku (monikko)
    let rows = p.has("Attr") ? `<tr>${label("Attr")}${cell(pairs("Attr"))}<td></td></tr>` : "";
    for (const [name, cases] of CASE_ROWS) {
      const sg = cases.map((c) => "Sg+" + c), pl = cases.map((c) => "Pl+" + c);
      rows += `<tr>${label(name)}${cell(pairs(...sg), "", sg)}${cell(pairs(...pl), "", pl)}</tr>`;
    }
    rows += `<tr>${label("Ess")}${cell(pairs("Ess"))}<td></td></tr>`;
    if (pos === "A" && [...p.keys()].some((t) => t.startsWith("Comp") || t.startsWith("Superl"))) {
      rows += section(t("comparison"), t("predicative"), t("attributive"));
      rows += `<tr>${label(t("comparative"))}${cell(pairs("Comp+Sg+Nom"))}${cell(pairs("Comp+Attr"))}</tr>`;
      rows += `<tr>${label(t("superlative"))}${cell(pairs("Superl+Sg+Nom"))}${cell(pairs("Superl+Attr"))}</tr>`;
    }
    html = table([t("caseCol"), t("singular"), t("plural")], rows);
  }

  $("panel-table").innerHTML =
    (legend ? `<p class="legend">${t("gradeLegend")}</p>` : "") +
    (settings.exp.tableTr && html.includes("form-tr") ? `<p class="hint form-tr-note">${esc(t("tableTrNote"))}</p>` : "") +
    html + `<p class="hint">${esc(t("tapHint"))}</p>`;
  boxTables($("panel-table"));
}

// Muut taulukot (sijamuodot, vertailumuodot, nominaalimuodot) samaan tyyliin kuin verbitaulukko: jokainen otsikkojen
// välinen riviryhmä omaksi pyöristetyksi laatikokseen, ja otsikkoriville rako ennen ja jälkeen.
function boxTables(root) {
  for (const tbl of root.querySelectorAll("table.paradigm:not(.grouped)")) {
    tbl.classList.add("grouped", "boxed");
    const rows = [...tbl.tBodies[0].rows];
    const cols = Math.max(...rows.map((r) => r.cells.length), tbl.tHead ? tbl.tHead.rows[0].cells.length : 0);
    const gap = (cls) => { const g = document.createElement("tr"); g.className = "gap " + cls; g.setAttribute("aria-hidden", "true");
      g.innerHTML = `<td colspan="${cols}"></td>`; return g; };
    rows.forEach((tr, i) => {
      if (tr.classList.contains("section")) {
        if (i > 0) tr.before(gap("gap-sec"));
        tr.after(gap("gap-after"));
        return;
      }
      if (!rows[i - 1] || rows[i - 1].classList.contains("section")) tr.classList.add("g-first");
      if (!rows[i + 1] || rows[i + 1].classList.contains("section")) tr.classList.add("g-last");
    });
  }
}

function table(headers, rows, cls = "") {
  const head = headers ? `<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>` : "";
  return `<div class="table-wrap"><table class="paradigm${cls ? " " + cls : ""}">${head}<tbody>${rows}</tbody></table></div>`;
}

function meaningHtml(m, numbered) {
  const tags = splitList(m.labels).map((l) => `<span class="tag">${esc(l)}</span>`).join("") +
    (m.geo || "").split(",").filter(Boolean).map((g) => `<span class="tag">${esc(t("usedIn", t("geo")[g] || g, g))}</span>`).join("");
  let html = `<div class="meaning"><div class="head">${numbered ? `<span class="nr">${m.nr}.</span>` : ""}` +
    `${labelledList(m.translations, m.lang)}${m.explanations ? ` <span class="expl">(${esc(m.explanations)})</span>` : ""}` +
    `${m.restrictions ? ` <span class="restr">– ${esc(m.restrictions)}</span>` : ""}${tags}</div>`;
  for (const ex of m.examples) {
    html += `<div class="example"><span class="sme">${esc(ex.sme)}</span>` +
      (ex.translation ? `<span class="fin">${esc(ex.translation)}</span>` : `<span class="missing">${esc(t("noExampleTranslation"))}</span>`) +
      (ex.source ? `<span class="muted small">(${esc(ex.source)})</span>` : "") + `</div>`;
  }
  return html + `</div>`;
}

function renderMeanings(meanings) {
  const w = state.word;
  let html = `<h2 style="margin-top:0">${esc(w.sme_lemma)} <span class="muted small"><i>${esc(wordClassLabel(w.pos))}</i></span></h2>`;
  if (w.notes) html += `<p class="muted small"><i>${esc(w.notes)}</i></p>`;
  // Kielittäin, valittu kieli ensin; otsikko, jos kieliä on useampi tai ainoa kieli ei ole valittu kieli
  const groups = meaningsByLanguage(meanings);
  for (const [lang, ms] of groups) {
    if (groups.length > 1 || lang !== settings.lang) html += `<h3 class="lang-head">${esc(t("langIn")[lang])}</h3>`;
    html += ms.map((m) => meaningHtml(m, ms.length > 1)).join("");
    if (lang === "fin" && state.alsoFin) {
      html += `<div class="meaning also-meanings" lang="fi"><span class="muted" title="${esc(t("alsoFinSource"))}">${esc(t("alsoFin"))}</span> ${esc(state.alsoFin)}</div>`;
    }
  }
  const defs = state.definitions || [];
  // dict-sme:n esimerkit ovat yleensä jo käännösten alla (sama lähde): vain uudet näytetään
  const shownEx = new Set(meanings.flatMap((m) => m.examples.map((ex) => ex.sme)));
  if (defs.length) {
    html += `<h3 class="lang-head">${esc(t("smeDef"))}</h3><div lang="se">`;
    html += defs.map((d) => `<div class="meaning"><div class="head">${defs.length > 1 ? `<span class="nr">${d.nr}.</span>` : ""}` +
      `${esc(d.definition)}${d.synonyms ? ` <span class="expl">(${esc(t("smeDefSyn"))} ${esc(d.synonyms)})</span>` : ""}</div>` +
      (d.examples || "").split("\n").filter((x) => x && !shownEx.has(x)).map((x) => `<div class="example"><span class="sme">${esc(x)}</span></div>`).join("") +
      `</div>`).join("") + `</div>`;
  }
  if (!meanings.length && !defs.length) html += `<p class="muted">${esc(t("noMeanings"))}</p>`;
  $("panel-meanings").innerHTML = html;
  const examples = meanings.reduce((n, m) => n + m.examples.length, 0);
  $("meanings-tab").textContent = t("tabMeanings", meanings.length, examples);
}

function renderRaw() {
  let html = "";
  for (const [tag, forms] of state.paradigm) {
    html += `<div><span class="tag">${esc(tag)}</span>` + forms.map((f) => {
      const g = settings.showGrade ? state.grades.get(tag + "|" + f) : null;
      return `<span class="form ${g === "GD" ? "gd" : g === "HD" ? "hd" : ""}" data-speak="${esc(f)}">${esc(f)}</span>${g ? ` <span class="muted">${g}</span>` : ""}`;
    }).join(", ") + `</div>`;
  }
  $("panel-raw").innerHTML = `<div class="raw">${html || esc(state.word.sme_lemma)}</div>`;
}

const TABS = ["table", "grade", "meanings", "raw"];
function setTab(tab) {
  closeFormPop();
  state.tab = tab;
  for (const b of $("tabs").children) b.classList.toggle("active", b.dataset.tab === tab);
  for (const t of TABS) $("panel-" + t).hidden = t !== tab;
}

// --- Ääntäminen: Divvunin puhesynteesi, välimuisti selaimen Cache Storagessa ---

const memoryCache = new Map();
const IS_DESKTOP = location.protocol === "satni:";
// Android-sovellus (android/) näyttää tiedostot APK:sta tällä osoitteella
const IS_ANDROID = location.hostname === "appassets.androidplatform.net";
// Selain soittaa äänen vain heti napautuksen jälkeen. Ääni haetaan ensin palvelimelta, ja jos haku kestää, selain
// ei enää laske soittoa napautukseksi ("not allowed by the user agent", erityisesti Safari). Siksi yhteinen soitin
// avataan jo napautuksessa lyhyellä hiljaisuudella, ja haettu ääni soitetaan samalla soittimella.
const ttsAudio = typeof Audio === "function" ? new Audio() : null;
const SILENCE = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
let ttsUnlocked = false;
function unlockTtsAudio() {
  if (!ttsAudio || ttsUnlocked) return;
  ttsAudio.src = SILENCE;
  ttsAudio.play().then(() => { ttsUnlocked = true; }).catch(() => {});
}

// Vain viimeksi napautettu ääni: uusi napautus pysäyttää soivan äänen ja peruu kesken olevan haun, jotta äänet eivät
// soi päällekkäin eivätkä peräkkäin sitä mukaa kuin haut valmistuvat.
let ttsRequest = null;
function startTtsRequest() {
  if (ttsRequest) ttsRequest.abort();
  ttsRequest = new AbortController();
  if (ttsAudio) ttsAudio.pause();
  return ttsRequest.signal;
}
// Kaikki soitto pois: kesken oleva haku perutaan ja soitin pysähtyy (sivun vaihto, takaisin-ele, sanastot)
function stopTts() {
  if (ttsRequest) ttsRequest.abort();
  if (ttsAudio) ttsAudio.pause();
  if (window.sanastoStopAudio) sanastoStopAudio();
}

async function playTtsBlob(blob) {
  const audio = ttsAudio || new Audio();
  if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
  audio.src = URL.createObjectURL(blob);
  await audio.play();
}

// Puhutun tekstin ääni (WAV): muistista, selaimen välimuistista tai Divvunin puhepalvelusta. Palauttaa null, jos haku
// peruttiin; verkkovirheessä heittää virheen, jonka viesti näytetään käyttäjälle.
async function ttsBlob(text, signal, voiceName = settings.voice) {
  const voice = VOICES[voiceName] || "biret";
  const key = `tts-cache/${voice}/${encodeURIComponent(text)}`;
  let blob = memoryCache.get(key);
  // Selaimen välimuisti vain verkkosivulla: Cache Storage hyväksyy vain http(s)-osoitteet.
  // Työpöytäsovelluksessa Python tallentaa äänet levylle (~/.cache/satni-fst/tts).
  const cache = !IS_DESKTOP && "caches" in window ? await caches.open("satni-tts") : null;
  if (!blob && cache) {
    const hit = await cache.match(key);
    if (hit) blob = await hit.blob();
  }
  if (signal.aborted) return null;
  if (!blob) {
    let res;
    try {
      res = IS_DESKTOP
        ? await fetch(`tts/${voice}?text=${encodeURIComponent(text)}`, { signal })
        : await fetch(TTS_URL + voice, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }), signal,
          });
    } catch (e) {
      if (e.name === "AbortError") return null;
      throw new Error(t("ttsOffline"));
    }
    if (!res.ok) throw new Error(IS_DESKTOP ? t("ttsOffline") : t("ttsStatus", res.status));
    blob = await res.blob();
    if (cache) cache.put(key, new Response(blob, { headers: { "Content-Type": "audio/wav" } })).catch(() => {});
  }
  memoryCache.set(key, blob);
  return signal.aborted ? null : blob;
}

async function speak(text, button, voiceName = settings.voice) {
  const signal = startTtsRequest();
  unlockTtsAudio();  // ennen ensimmäistä awaitia: vielä napautuksen sisällä
  if (button) { button.disabled = true; button.classList.add("loading"); }  // pyörivä kehä (styles.css)
  try {
    const blob = await ttsBlob(text, signal, voiceName);
    if (!blob) return;
    try {
      await playTtsBlob(blob);
    } catch (e) {
      // Selain esti soiton (napautuksesta ehti kulua liian kauan): ääni on jo muistissa, joten seuraava napautus soittaa
      // sen heti. Ei virheilmoitusta, vaan ohje.
      if (e.name === "NotAllowedError") { toast(t("ttsTapAgain")); return; }
      throw e;
    }
  } catch (e) {
    // Uusi napautus perui tämän äänen, eikä se ole virhe
    if (signal.aborted || e.name === "AbortError") return;
    toast(t("ttsFailed", e.message));
  } finally {
    if (button) { button.disabled = false; button.classList.remove("loading"); }
  }
}

// --- Historia ja suosikit ---

function addHistory(lemma) {
  settings.history = [lemma, ...settings.history.filter((h) => h !== lemma)].slice(0, 30);
  saveSettings();
  renderSidebar();
}
function toggleFavourite() {
  const lemma = state.word.sme_lemma;
  const favs = settings.favourites;
  settings.favourites = favs.includes(lemma) ? favs.filter((f) => f !== lemma) : [lemma, ...favs];
  saveSettings();
  updateFavButton();
  renderSidebar();
}
function updateFavButton() {
  const on = state.word && settings.favourites.includes(state.word.sme_lemma);
  $("fav-btn").textContent = on ? "★" : "☆";
  $("fav-btn").classList.toggle("on", on);
  $("fav-btn").title = on ? t("removeFavourite") : t("addFavourite");
  $("fav-btn").setAttribute("aria-label", $("fav-btn").title);
}
const HISTORY_SHOWN = 6;
let historyExpanded = false;
let menuTab = "history";  // valikon välilehti: historia tai suosikit
// Sanan lyhyt käännös valikon riville (käyttöliittymän kielellä); tyhjä, jos sanakirja ei ole vielä auki tai käännöstä ei ole
const glossCache = new Map();
function menuGloss(lemma) {
  if (!db) return "";
  const key = settings.lang + "|" + lemma;
  if (!glossCache.has(key)) {
    let g = "";
    try {
      const col = (LANGUAGES[settings.lang] || LANGUAGES.fin).col;
      const r = all(`SELECT ${col} AS tr FROM dictionary WHERE sme_lemma = ? AND ${col} <> '' ORDER BY freq DESC LIMIT 1`, [lemma])[0];
      if (r) g = r.tr.split(/[,;]/).slice(0, 2).map((x) => x.trim()).filter(Boolean).join(", ");  // kaksi ensimmäistä merkitystä (giella: ansa, kieli)
    } catch (e) { /* ei käännöstä riville */ }
    glossCache.set(key, g);
  }
  return glossCache.get(key);
}
function renderSidebar() {
  const fill = (id, words, empty) => {
    $(id).innerHTML = words.length
      ? words.map((w) => { const g = menuGloss(w); return `<li><a href="#/sana/${encodeURIComponent(w)}"><b class="wl-w">${esc(w)}</b>${g ? `<span class="wl-tr">${esc(g)}</span>` : ""}</a></li>`; }).join("")
      : `<li class="empty">${empty}</li>`;
  };
  for (const b of document.querySelectorAll(".menu-tabs [data-mtab]")) b.setAttribute("aria-selected", String(b.dataset.mtab === menuTab));
  $("menu-history").hidden = menuTab !== "history";
  $("menu-favourites").hidden = menuTab !== "favourites";
  $("fav-count").textContent = settings.favourites.length ? `(${settings.favourites.length})` : "";
  fill("favourites", settings.favourites, esc(t("noFavourites")));
  // Historiasta 10 viimeisintä; Lisää… näyttää loput, ja valikon avaaminen palauttaa kymmeneen
  fill("history", historyExpanded ? settings.history : settings.history.slice(0, HISTORY_SHOWN), esc(t("noHistory")));
  $("history-more").hidden = historyExpanded || settings.history.length <= HISTORY_SHOWN;
  $("history-more").textContent = t("historyAll", settings.history.length);
  $("clear-history").disabled = !settings.history.length;
  $("history-clear-menu").hidden = !settings.history.length;
  for (const a of $("history").querySelectorAll("a")) a.title = t("historyHint");
  renderSettingsSummary();
}

// --- Hakuehdotukset ---

// Tavalliset ehdotukset heti, taivutusmuodot vasta kirjoitustauolla: muotohaku on hidas ja pysäyttäisi puhelimella kirjoittamisen
let suggestTimer = null, formTimer = null, suggestions = [], activeSuggestion = -1;
const FORM_SUGGEST_PAUSE = 400;
function updateSuggestions(withForms = true) {
  // Jokerimerkki (* tai ?): ehdotusten tilalle yksi rivi, joka kertoo, että Enter (tai napautus) tekee jokerihaun
  const raw = $("search").value.trim();
  if (/[*?]/.test(raw)) {
    const ok = isWildcard(raw);
    suggestions = ok ? [{ recent: raw, wild: true }] : [];
    activeSuggestion = -1;
    $("suggestions").innerHTML = ok
      ? `<li role="option" data-i="0" class="sugg-wild"><span class="sugg-recent-ico" aria-hidden="true">✱</span><b>${esc(raw)}</b><span class="trans">${esc(t("wildHint"))}</span></li>`
      : `<li class="sugg-loading" role="status">${esc(t("wildShort"))}</li>`;
    $("suggestions").hidden = false;
    return;
  }
  suggestions = suggestWords($("search").value, withForms);
  activeSuggestion = -1;
  const list = $("suggestions");
  // Muotohaku on vielä tulossa: rivi kertoo sen, ettei lista näytä tyhjältä (minulle löytyy vasta muotohaulla)
  const value = $("search").value.trim();
  if (!value) suggestions = recentSuggestions();
  const pending = !withForms && fold(value).length >= 2 && !value.includes(" ");
  if (!pending && !suggestions.length) {
    list.hidden = true;  // ei hideSuggestions: odottava muotohaku saa vielä tuoda ehdotuksia (munnje, kolmelle)
    return;
  }
  // "Tarkoititko:" omana otsikkorivinään, ehdotetut sanat sen alla tavallisina riveinä (sana, sanaluokka, käännös);
  // pelkkien erikoiskirjaimitta löytyneiden yllä otsikossa myös kirjoitetun alku erikoiskirjaimin (oažž…)
  const anyDym = suggestions.some((s) => s.dym);
  const firstPlain = suggestions.findIndex((s) => s.dym || s.plainMatch);
  const plainHead = firstPlain < 0 ? "" : (() => {
    if (anyDym) return `<li class="sugg-head" aria-hidden="true">${esc(t("didYouMean"))}</li>`;
    const lemma = suggestions[firstPlain].sme_lemma, stem = lemma.slice(0, [...value].length);
    return `<li class="sugg-head" aria-hidden="true">${esc(t("didYouMean"))} <b>${esc(stem)}${stem.length < lemma.length ? "…" : ""}</b></li>`;
  })();
  // "Haetaan muotoja…" listan loppuun, ettei se työnnä Tarkoititko-riviä alas
  list.innerHTML = suggestions.map((s, i) => (i === firstPlain ? plainHead : "") + (s.recent ?
    `<li role="option" data-i="${i}" class="sugg-recent"><span class="sugg-recent-ico" aria-hidden="true">${s.fav ? "★" : "🕘"}</span><b>${esc(s.recent)}</b></li>` : s.dym ?
    `<li role="option" data-i="${i}" class="sugg-dym"><b>${esc(s.dym.lemma)}</b>` +
    `${s.dym.word === s.dym.lemma ? "" : `<i class="sugg-form">${esc(s.dym.word)}</i>`}<span class="pos">${esc(s.dym.pos || "")}</span>` +
    `<span class="trans">${esc(s.dym.trans || "")}${s.dym.lang ? ` · ${esc(t("langName")[s.dym.lang])}` : ""}</span></li>` :
    `<li role="option" data-i="${i}"><b>${esc(s.sme_lemma)}</b>${s.smeForm ? `<i class="sugg-form">${esc(s.smeForm)}</i>` : ""}` +
    `<span class="pos">${esc(s.pos)}</span><span class="trans">${s.form ? esc(s.formNote) : resultTransHtml(s, 2)}</span></li>`)).join("") +
    (pending ? `<li class="sugg-loading" role="status"><span class="sugg-ring"></span>${esc(t("searchingForms"))}</li>` : "");
  list.hidden = false;
}
function hideSuggestions() { clearTimeout(suggestTimer); clearTimeout(formTimer); $("suggestions").hidden = true; activeSuggestion = -1; }
// Ehdotuksesta avataan juuri valittu sana: samannäköisistä (vuostá = vastaan / juusto) muuten avautuisi ensimmäinen
function pickSuggestion(s) {
  if (s.recent) { search(s.recent); return; }
  const text = s.form || s.sme_lemma;
  const index = queryDatabase(text).findIndex((r) => r.id === s.id);
  search(text, Math.max(index, 0));
}
function moveSuggestion(delta) {
  const items = $("suggestions").querySelectorAll("li[data-i]");
  if ($("suggestions").hidden || !items.length) return false;
  activeSuggestion = (activeSuggestion + delta + items.length) % items.length;
  [...items].forEach((li, i) => li.classList.toggle("active", i === activeSuggestion));
  return true;
}

// --- Teema ---

function applyTheme() {
  const t = settings.theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  if (typeof applyGradeStyle === "function") applyGradeStyle();
}

// --- Astevaihtelun merkintä ---
// Värit vaaleassa ja tummassa teemassa, kumpikin vähintään 4,5:1 taustaa vasten; "none" = tekstin väri (alleviivauksen kanssa)
const GRADE_COLORS = {
  green: ["#15803d", "#4ade80"], orange: ["#c2410c", "#fb923c"], blue: ["#1d4ed8", "#60a5fa"],
  purple: ["#7e22ce", "#c084fc"], red: ["#b91c1c", "#f87171"], brown: ["#92400e", "#f59e0b"], none: [null, null],
};
const darkScheme = () => settings.theme === "dark" ||
  (settings.theme !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
function applyGradeStyle() {
  const root = document.documentElement, dark = darkScheme() ? 1 : 0;
  for (const [grade, name] of [["gd", settings.gradeGd], ["hd", settings.gradeHd]]) {
    const c = (GRADE_COLORS[name] || GRADE_COLORS[grade === "gd" ? "green" : "orange"])[dark];
    root.style.setProperty(`--grade-${grade}`, c || "var(--text)");
  }
  root.classList.toggle("grade-underline", !!settings.gradeUnderline);
  renderGradeSwatches();
}
function renderGradeSwatches() {
  const dark = darkScheme() ? 1 : 0;
  for (const grade of ["gd", "hd"]) {
    const box = $(`${grade}-swatches`);
    if (!box) continue;
    const current = grade === "gd" ? settings.gradeGd : settings.gradeHd;
    box.innerHTML = Object.entries(GRADE_COLORS).map(([name, c]) =>
      `<button type="button" role="radio" data-grade="${grade}" data-color="${name}" aria-checked="${name === current}"` +
      ` aria-label="${esc(t("gradeColors")[name])}" title="${esc(t("gradeColors")[name])}"` +
      (c[dark] ? ` style="--sw:${c[dark]}"` : ' class="sw-none"') + `>${c[dark] ? "" : "Aa"}</button>`).join("");
  }
  if ($("grade-underline")) $("grade-underline").checked = !!settings.gradeUnderline;
}
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyGradeStyle());

// --- Alapalkki (kokeilu, test-fable): kapealla näytöllä yläpalkin tilalla ---
// Painike sulkee ensin avoimen näkymän ja avaa sitten omansa samalla toiminnolla kuin yläpalkin painike; Haku palaa
// hakuun (aloitussivulle, jos mikään näkymä ei ollut auki). Näppäimistön ajaksi palkki piiloon.
const NAV_VIEWS = { sanasto: "sanasto-view", peli: "peli-view", lause: "lause-view", ocr: "ocr-view" };
function closeAllViews() {
  let closed = false;
  if (!$("settings-view").hidden) { hideSettings(); closed = true; }
  if (!$("sanasto-view").hidden) { closeFormPop(); hideSanastot(); closed = true; }
  if (!$("peli-view").hidden) { hidePeli(); closed = true; }
  if (!$("lause-view").hidden) { $("lause-view").hidden = true; overlayClosed(); closed = true; }
  if (!$("ocr-view").hidden) { $("ocr-view").hidden = true; closed = true; }
  return closed;
}
function syncBottomNav() {
  const nav = $("bottom-nav");
  if (!nav) return;
  nav.querySelector('[data-nav="lause"]').hidden = $("lause-btn").hidden;
  nav.querySelector('[data-nav="ocr"]').hidden = $("ocr-btn").hidden;
  nav.querySelector('[data-nav="peli"]').hidden = $("peli-btn").hidden;
  nav.classList.toggle("many", nav.querySelectorAll("button:not([hidden])").length >= 6);  // kuusi painiketta: pienempi teksti
  const open = Object.keys(NAV_VIEWS).find((k) => !$(NAV_VIEWS[k]).hidden) ||
    (document.body.classList.contains("sidebar-open") || !$("settings-view").hidden ? "more" : "home");
  for (const b of nav.querySelectorAll("button")) {
    b.classList.toggle("active", b.dataset.nav === open);
    if (b.dataset.nav === open) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  }
}
function bindBottomNav() {
  const nav = $("bottom-nav");
  if (!nav) return;
  const openers = { sanasto: "sanasto-btn", peli: "peli-btn", lause: "lause-btn", ocr: "ocr-btn" };
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-nav]");
    if (!b) return;
    const what = b.dataset.nav;
    if (what !== "home" && what !== "more" && !$(NAV_VIEWS[what]).hidden) return;  // jo auki
    const closed = closeAllViews();
    const drawer = closeDrawer();
    whenOverlayHistoryIdle(() => {
      if (what === "home") { if (!closed && !drawer) goHome(e); else window.scrollTo(0, 0); }
      else if (what === "more") { if (!drawer) $("sidebar-toggle").click(); }
      else $(openers[what]).click();
      syncBottomNav();
    });
  });
  const watch = new MutationObserver(syncBottomNav);
  for (const id of [...Object.values(NAV_VIEWS), "settings-view", "lause-btn", "ocr-btn", "peli-btn"]) watch.observe($(id), { attributes: true, attributeFilter: ["hidden"] });
  watch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  // Näppäimistö auki: palkki pois tieltä. Tunnistetaan ikkunan korkeuden pienenemisestä (Android: adjustResize;
  // selaimet: visualViewport), ei kentän kohdistuksesta: takaisin-ele sulkee näppäimistön mutta jättää kohdistuksen.
  const tallest = {};  // leveys -> suurin nähty korkeus (pysty ja vaaka erikseen)
  const checkKeyboard = () => {
    const w = window.innerWidth, h = Math.min(window.innerHeight, window.visualViewport ? window.visualViewport.height : Infinity);
    tallest[w] = Math.max(tallest[w] || 0, h);
    // Lisäksi tekstikenttä kohdistettuna: pelkkä matalampi ikkuna (jaettu näyttö, matala selainikkuna) ei ole
    // näppäimistö, eikä palkki saa silloin kadota (yötesti 2026-11-16)
    const el = document.activeElement, typing = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    document.body.classList.toggle("kbd-open", typing && h < tallest[w] - 150);
  };
  window.addEventListener("resize", checkKeyboard);
  document.addEventListener("focusin", checkKeyboard);
  document.addEventListener("focusout", () => setTimeout(checkKeyboard, 0));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", checkKeyboard);
  checkKeyboard();
  syncBottomNav();
}

// --- Tekstin koko ---
// Android-sovelluksessa WebViewin tekstin zoomaus (MainActivity: SatniApp.setTextZoom, "system" = laitteen fonttikoko),
// muualla (selain, työpöytä) koko sivun CSS-zoom; "system" = 100 % (selaimen oma zoomaus toimii kuten ennenkin)
function applyTextSize() {
  setTimeout(refitSearchPlaceholder, 200);  // Androidin tekstin zoomaus vaihtuu natiivisti hetken päästä
  const v = settings.textSize || "system";
  if (window.SatniApp && window.SatniApp.setTextZoom) {
    window.SatniApp.setTextZoom(v === "system" ? -1 : Number(v));
    document.documentElement.style.zoom = "";
    return;
  }
  const z = v === "system" ? 1 : Number(v) / 100;
  document.documentElement.style.zoom = z === 1 ? "" : String(z);
}

// --- Asetukset-näkymä (2026-11-14) ---
// Pääsivulla aiheet ja kunkin nykyinen valinta, aiheet avautuvat alasivuiksi. Ohjaimet (kieli, astevaihtelu, ääni,
// muut kielet, minipeli, kokeilut, historia) ovat samoilla id:illä kuin ennen valikossa, joten niiden käsittelijät
// ovat ennallaan. Takaisin, Esc ja Androidin takaisin-ele: alasivulta pääsivulle, sitten kiinni (verkossa oma
// historiamerkintä kummallekin, overlayLayerFns).
const SETTINGS_PAGES = { look: "setLook", card: "setCard", langs: "setLangs", tools: "setTools", exp: "experimental", history: "setHistory" };
const EXP_KEYS = ["ocr", "lause", "tableTr", "apertium", "pivotFin"];
let settingsPage = "main";
function showSettingsPage(page) {
  settingsPage = page;
  for (const el of document.querySelectorAll("#settings-view .set-page")) el.hidden = el.dataset.page !== page;
  $("settings-title").textContent = t(page === "main" ? "settings" : SETTINGS_PAGES[page]);
  $("settings-back").setAttribute("aria-label", t("back"));
  $("settings-back").hidden = page === "main";  // pääsivulla vain Sulje (molemmat sulkisivat)
  $("settings-view").querySelector(".settings-body").scrollTop = 0;
  renderSettingsSummary();
}
function openSettings() {
  closeDrawer();
  stopTts();
  $("settings-view").hidden = false;
  showSettingsPage("main");
  overlayOpened();
}
function hideSettings() {
  const was = !$("settings-view").hidden;
  $("settings-view").hidden = true;
  settingsPage = "main";
  if (was) overlayClosed();
}
function closeSettings() {
  if ($("settings-view").hidden) return false;
  if (settingsPage !== "main") showSettingsPage("main"); else hideSettings();
  return true;
}
function renderSettingsSummary() {
  if (!$("settings-view") || $("settings-view").hidden) return;
  const set = (id, text) => { if ($(id)) $(id).textContent = text; };
  const size = settings.textSize === "system" ? t("sumTextSystem") : t("sumText", settings.textSize);
  set("sum-look", [UI_LANGUAGES[settings.uiLang].name, t("sumTheme")[settings.theme] || "", size].filter(Boolean).join(" · "));
  const colors = t("gradeColors");
  const gradeSum = settings.showGrade ? `${colors[settings.gradeGd]}/${colors[settings.gradeHd]}` +
    (settings.gradeUnderline ? `, ${t("sumUnderline")}` : "") : "";
  set("sum-card", [t(settings.showGrade ? "sumGradeOn" : "sumGradeOff") + (gradeSum ? ` (${gradeSum})` : ""), settings.voice].join(" · "));
  const langs = [...settings.extraLangs.map((l) => capitalize(langName(l))), ...(settings.skolt ? [capitalize(langName("sms"))] : [])];
  set("sum-langs", langs.length ? langs.join(", ") : t("sumNone"));
  const fi = settings.uiLang === "fi";
  const tools = [settings.game ? t("minipeli") : "", t("sanastot"), settings.exp.ocr && window.SatniOcr ? t("expOcr") : "",
    settings.exp.lause && fi ? t("lauseTitle") : "", settings.gameSmn ? capitalize(langName("smn")) : ""].filter(Boolean);
  set("sum-tools", tools.join(", "));
  set("sum-exp", t("sumExp", ["tableTr", fi ? "pivotFin" : "apertium"].filter((k) => settings.exp[k]).length));
  set("sum-history", t("sumHistory", settings.history.length));
  set("sum-clear", t("sumHistory", settings.history.length));
  set("sum-about", $("about-version").textContent);
  for (const b of document.querySelectorAll("#theme-seg [data-theme-opt]")) b.setAttribute("aria-checked", b.dataset.themeOpt === settings.theme);
  for (const b of document.querySelectorAll("#textsize-seg [data-size]")) b.setAttribute("aria-checked", b.dataset.size === String(settings.textSize));
}
function bindSettings() {
  $("settings-btn").onclick = openSettings;
  $("settings-back").onclick = () => closeSettings();
  $("settings-close").onclick = hideSettings;
  $("settings-about").onclick = () => $("about").showModal();
  $("settings-view").addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) { showSettingsPage(go.dataset.go); return; }
    const theme = e.target.closest("[data-theme-opt]");
    if (theme) { settings.theme = theme.dataset.themeOpt; saveSettings(); applyTheme(); }
    const size = e.target.closest("[data-size]");
    if (size) { settings.textSize = size.dataset.size === "system" ? "system" : Number(size.dataset.size); saveSettings(); applyTextSize(); }
    setTimeout(renderSettingsSummary, 0);
  });
  $("settings-view").addEventListener("change", () => setTimeout(renderSettingsSummary, 0));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]") && closeSettings()) e.preventDefault();
  });
  // Androidin takaisin-ele (MainActivity: closeOcr): ensin avoin ikkuna (esim. kokeilun hyväksyntä), sitten asetukset
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => {
    if (!$("settings-view").hidden) {
      const d = document.querySelector("dialog[open]");
      if (d) { d.close(); return true; }
      return closeSettings();
    }
    return closeOcrBase ? closeOcrBase() : false;
  };
  overlayLayerFns.push(() => (!$("settings-view").hidden && settingsPage !== "main" ? 1 : 0));
  // Kieli vaihtui asetuksissa: otsikko ja yhteenvedot uudelleen
  const setUiBase = window.setUiLanguage;
  window.setUiLanguage = (code) => { setUiBase(code); renderGradeSwatches(); if (!$("settings-view").hidden) showSettingsPage(settingsPage); };
  $("recent-chips").onclick = (e) => { const b = e.target.closest("[data-q]"); if (b) search(b.dataset.q); };
  // Astevaihtelun värit ja alleviivaus
  const gradeChanged = () => { saveSettings(); applyGradeStyle(); renderSettingsSummary(); };
  for (const grade of ["gd", "hd"]) {
    $(`${grade}-swatches`).onclick = (e) => {
      const b = e.target.closest("[data-color]");
      if (!b) return;
      settings[grade === "gd" ? "gradeGd" : "gradeHd"] = b.dataset.color;
      gradeChanged();
    };
  }
  $("grade-cvd").onclick = () => { settings.gradeGd = "blue"; settings.gradeHd = "orange"; gradeChanged(); };
  $("grade-underline").onchange = (e) => { settings.gradeUnderline = e.target.checked; gradeChanged(); };
  applyGradeStyle();
  applyTextSize();
}

// Aloitussivulla suosikit ja viimeksi haetut (enintään 10), hakukentässä samat tyhjän kentän napautuksella
function recentWords() {
  const fav = settings.favourites.map((w) => ({ recent: w, fav: true }));
  const hist = settings.history.filter((w) => !settings.favourites.includes(w)).map((w) => ({ recent: w }));
  return [...fav, ...hist].slice(0, 10);
}
function recentSuggestions() { return recentWords().slice(0, 8); }
function renderRecent() {
  const words = recentWords();
  $("welcome-recent").hidden = !words.length;
  $("recent-chips").innerHTML = words.map((r) =>
    `<button type="button" data-q="${esc(r.recent)}">${r.fav ? '<span class="recent-star" aria-hidden="true">★</span>' : ""}${esc(r.recent)}</button>`).join("");
}

// --- Tekstintunnistus valokuvasta (vain Android-sovellus: Ocr.java, window.SatniOcr) ---

// ML Kitin yleinen latinalainen malli ei tunne kaikkia saamen kirjaimia: tarkkeet jäävät pois (čáhci -> cahci)
// tai tilalle tulee samannäköinen merkki (ð voi olla d tai đ, joten se palautetaan ensin d:ksi). Sana korjataan
// muotoon, joka löytyy sanakirjasta perusmuotona tai taivutusmuotona (enintään kolme korjattua kirjainta,
// vähiten korjauksia ensin).
// Myös vietnamin yhdistelmäkirjaimet (ávvudii -> ấvvudii) ja q (gudnin -> qudnin): saamessa ei ole q:ta (Yle-koe 2026-11-18)
const OCR_LOOKALIKES = { "ð": "d", "ɖ": "d", "η": "n", "ţ": "t", "ş": "s", "ș": "s", "ć": "c", "ż": "z",
  "ấ": "á", "ắ": "á", "ầ": "á", "ạ": "a", "ą": "a", "q": "g", "ı": "i", "ņ": "ŋ", "ü": "ii" };
const OCR_DIACRITICS = { a: "á", c: "č", d: "đ", n: "ŋ", s: "š", t: "ŧ", z: "ž" };

// Kaksoiskirjaimen kokeilujärjestys: ensin i ja j (yleisimmät: sámiid, lijjii), sitten konsonantit, viimeisenä muut
// vokaalit. Lyhyitä sanoja (va, pa) ei tuplata: niistä tuli vääriä sanoja (uutiskoe 2026-11-18).
function doubleOrder(chars, norm = (c) => c) {
  const rank = (c) => (/[ij]/.test(c) ? 0 : /[aáâäeéioóuüyåæø]/.test(c) ? 2 : 1);
  return chars.map((c, i) => i).filter((i) => /\p{L}/u.test(chars[i]) && norm(chars[i]) !== norm(chars[i + 1] || "") && norm(chars[i]) !== norm(chars[i - 1] || ""))
    .sort((a, b) => rank(chars[a]) - rank(chars[b]) || a - b);
}

// --- Inarin- ja koltansaame kuvassa (smn_data.py, sms_data.py; export_web_data.py: {kieli}_words, _forms, _cmp) ---
// Muodot haetaan tarkkeettomalla asulla (fold), koska tunnistus lukee â:n, đ:n ja ŋ:n usein väärin (mäksid = mäksiđ,
// mangâčyet = maŋgâčyet; Anarâš aavis -kuvakaappaukset 2026-11-18). Kuvan sanaa lähin oikea asu valitaan.
// Koltasta myös pehmennysmerkki ʹ pois (tunnistus lukee sen ':ksi tai jättää pois), ǥ -> g, ʒ -> z.
const MINOR = ["smn", "sms"];
const isMinor = (lang) => MINOR.includes(lang);
function minorFold(lang, s) {
  let f = (s || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/ŋ/g, "n").replace(/ŧ/g, "t");
  if (lang === "sms") f = f.replace(/[ʹ'’ʼ]/g, "").replace(/ǥ/g, "g").replace(/ʒ/g, "z");
  return f;
}
const smnFold = (s) => minorFold("smn", s);
const MINOR_LOOKALIKES = {
  smn: { ...OCR_LOOKALIKES, "ấ": "â", "ầ": "â", "ắ": "â", "å": "š" },
  sms: { ...OCR_LOOKALIKES, "'": "ʹ", "’": "ʹ", "ʼ": "ʹ", "ấ": "â", "ầ": "â" },
};
// Liitepartikkelit (lii-uv, mäksimgin): sana haetaan ilman niitä
const MINOR_CLITICS = { smn: ["uv", "ub", "gin", "ge", "han", "hân", "pâ", "pa"], sms: [] };
// Ei ennen tietokannan latausta: kuvan kielivalikko piirretään jo käynnistyksessä (applyOcrLook), ja haku tyhjään
// tietokantaan kaatoi koko käynnistyksen (DEV 2026111811, Samsung)
// Inari ja koltta omissa tiedostoissaan (data/satni-smn.db.gz, satni-sms.db.gz): ladataan vain, kun kieli on valittu
// kuvan kieleksi asetuksista (Valokuvahaku → Kuvan kielet), ja suljetaan, kun valinta poistetaan. Muistia säästyy
// noin 25-35 Mt kieltä kohden niiltä, jotka eivät kieliä käytä (Samsung 2026-11-18: koko sovellus 193-224 Mt).
const minorDb = {}, minorLoading = {};
const hasMinor = (lang) => !!minorDb[lang];
function mall(lang, sql, params = []) {
  const stmt = minorDb[lang].prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
async function loadMinor(lang) {
  if (minorDb[lang] || minorLoading[lang] || !sqlModule) return;
  minorLoading[lang] = true;
  try {
    const res = await fetch(`data/satni-${lang}.db.gz`);
    if (!res.ok) return;
    const raw = new Uint8Array(await res.arrayBuffer());
    // Palvelin voi jo purkaa gzipin (Content-Encoding); puretaan vain jos tiedosto on yhä pakattu
    const bytes = raw[0] === 0x1f && raw[1] === 0x8b
      ? new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()) : raw;
    if (!settings.ocrLangs.includes(lang)) return;  // valinta poistettiin latauksen aikana
    minorDb[lang] = new sqlModule.Database(bytes);
    delete minorCmpCache[lang];
    applyOcrLook();
    // Kuva auki: sanat haetaan uudelleen, nyt myös tällä kielellä
    if (ocr && !$("ocr-view").hidden && ocr.langsKey !== settings.ocrLangs.join()) { ocr.autoDir = true; findOcrWords(); }
  } catch (e) {
    console.warn("loadMinor", lang, e.message);
  } finally {
    minorLoading[lang] = false;
  }
}
function unloadMinor(lang) {
  minorDb[lang]?.close();
  delete minorDb[lang];
  delete minorCmpCache[lang];
}
// Valitut kuvan kielet ladataan, muut suljetaan (käynnistys ja asetusten muutos)
function syncMinorDbs() {
  const want = settings.exp.ocr && window.SatniOcr ? settings.ocrLangs : [];
  for (const lang of MINOR) if (want.includes(lang)) loadMinor(lang); else unloadMinor(lang);
}
const hasSmn = () => hasMinor("smn");
function minorMatcher(lang) {
  const st = minorDb[lang].prepare(`SELECT surface FROM ${lang}_forms WHERE fold = ?`);
  const looks = MINOR_LOOKALIKES[lang], clitics = MINOR_CLITICS[lang], norm = (c) => minorFold(lang, c);
  const cache = new Map();
  const lookup = (w) => {
    st.bind([minorFold(lang, w)]);
    const out = new Set();
    while (st.step()) out.add(st.get()[0]);
    st.reset();
    return [...out];
  };
  const best = (w, cands) => {
    if (!cands.length) return null;
    if (cands.includes(w)) return w;
    const chars = [...w], diff = (c) => [...c].reduce((n, ch, i) => n + (ch !== chars[i]), 0) + Math.abs([...c].length - chars.length);
    return cands.sort((a, b) => diff(a) - diff(b))[0];
  };
  const correct = (word) => {
    const w = [...word.toLowerCase()].map((c) => looks[c] || c).join("");
    if ([...w].filter((c) => /\p{L}/u.test(c)).length < 2) return null;
    if (w.includes("-")) {
      const head = w.slice(0, w.lastIndexOf("-")), last = w.slice(w.lastIndexOf("-") + 1);
      return clitics.includes(last) ? correct(head) : correct(last);
    }
    const hit = best(w, lookup(w));
    if (hit) return hit;
    for (const c of clitics) {
      if (w.length > c.length + 2 && w.endsWith(c)) {
        const h = best(w.slice(0, -c.length), lookup(w.slice(0, -c.length)));
        if (h) return h;
      }
    }
    // Kaksoiskirjain luettu yhdeksi (sáttá -> sátá, iärrás -> iärás, lijjii -> lijii, kevttim -> kevtim)
    const chars = [...w];
    if (chars.length >= 4 && chars.length <= 20) {
      for (const i of doubleOrder(chars, norm)) {
        const v = [...chars.slice(0, i + 1), chars[i], ...chars.slice(i + 1)].join("");
        const h = best(v, lookup(v));
        if (h) return h;
      }
    }
    return null;
  };
  return { correct: (w) => { if (!cache.has(w)) cache.set(w, correct(w)); return cache.get(w); }, free: () => st.free() };
}
const smnMatcher = () => minorMatcher("smn");

// Inarin/koltan yhdyssana, jota ei ole sanakirjassa (tiervâsvuotâtipšo = tiervâsvuotâ + tipšo): loppuosa on kielen
// sana tai muoto, alkuosa yhdysmuoto ({kieli}_cmp, tarkistettu) tai substantiivin/adjektiivin perusmuoto tai yksikön
// genetiivi, enintään kolme alkuosaa. Haku tarkkeettomana. Pisin loppuosa ensin. Palauttaa [{stem, id}] tai null.
function splitMinorCompound(lang, word) {
  const w = [...word.toLowerCase()].map((c) => MINOR_LOOKALIKES[lang][c] || c).join("");
  if (w.length < 7 || !/^[\p{L}ʹ]+$/u.test(w) || !hasMinor(lang)) return null;
  // Kirjainkohtainen fold, jotta palat vastaavat kuvan kirjaimia (koltan ʹ poistuu: osa kuuluu edelliseen kirjaimeen)
  const map = [];
  let wf = "";
  [...w].forEach((ch, i) => { const f = minorFold(lang, ch); for (const c of f) { wf += c; map.push(i); } });
  if (!wf.length) return null;
  const orig = [...w], piece = (a, b) => orig.slice(map[a], b < wf.length ? map[b] : orig.length).join("");
  const subs = new Set();
  for (let i = 0; i < wf.length; i++) for (let j = i + 3; j <= wf.length; j++) subs.add(wf.slice(i, j));
  const list = [...subs], known = new Map(), left = new Map();
  for (let i = 0; i < list.length; i += 300) {
    const part = list.slice(i, i + 300), marks = part.map(() => "?").join(",");
    // Sama tarkkeeton asu useammalle sanalle (fáddáid / faddâ): kuvan kirjaimin täsmäävä ensin
    for (const r of mall(lang, `SELECT fold, surface, word_id AS id FROM ${lang}_forms WHERE fold IN (${marks}) ORDER BY word_id`, part)) {
      const at = wf.indexOf(r.fold), exact = at >= 0 && r.surface === piece(at, at + r.fold.length);
      if (!known.has(r.fold) || (exact && !known.get(r.fold).exact)) known.set(r.fold, { id: r.id, exact });
    }
    for (const r of mall(lang, `SELECT f.fold, MIN(f.word_id) AS id FROM ${lang}_forms f JOIN tags t ON t.id = f.tag_id
        JOIN ${lang}_words s ON s.id = f.word_id WHERE f.fold IN (${marks}) AND t.tag IN ('Lemma', 'Sg+Nom', 'Sg+Gen', 'Attr')
        AND s.pos IN ('N', 'A') GROUP BY f.fold`, part)) left.set(r.fold, r.id);
  }
  // Yhdysmuodot (tallennettu tarkkeineen) tarkkeettomina, kerran kielelle
  for (const sub of list) { const id = minorCmp(lang).get(sub); if (id && !left.has(sub)) left.set(sub, id); }
  const leftParts = (a, b, depth) => {
    const s = wf.slice(a, b);
    if (left.has(s)) return [[a, b]];
    if (depth >= 2) return null;
    for (let i = b - 3; i >= a + 3; i--) {
      if (!left.has(wf.slice(i, b))) continue;
      const head = leftParts(a, i, depth + 1);
      if (head) return [...head, [i, b]];
    }
    return null;
  };
  for (let i = 4; i <= wf.length - 3; i++) {
    if (!known.has(wf.slice(i))) continue;
    const head = leftParts(0, i, 0);
    if (head) return [...head.map(([a, b]) => ({ stem: piece(a, b), id: left.get(wf.slice(a, b)) })), { stem: piece(i, wf.length), id: known.get(wf.slice(i)).id }];
  }
  return null;
}
const splitSmnCompound = (word) => splitMinorCompound("smn", word);
const minorCmpCache = {};
function minorCmp(lang) {
  if (!minorCmpCache[lang]) {
    minorCmpCache[lang] = new Map();
    if (hasMinor(lang)) for (const r of mall(lang, `SELECT stem, word_id FROM ${lang}_cmp`)) minorCmpCache[lang].set(minorFold(lang, r.stem), r.word_id);
  }
  return minorCmpCache[lang];
}

// Kielen sanan rivit (perusmuoto, sanaluokka, käännökset) kuvan muodolle; perusmuoto ensin
function minorRows(lang, surface) {
  return mall(lang, `SELECT DISTINCT w.* FROM ${lang}_forms f JOIN ${lang}_words w ON w.id = f.word_id
    WHERE f.fold = ? AND f.surface = ? ORDER BY (lower(w.lemma) = ?) DESC, w.id`, [minorFold(lang, surface), surface, surface]);
}
const smnRows = (surface) => minorRows("smn", surface);
// Käännös valitulla kielellä. Inari: norja pohjoissaamen kautta (≈). Koltta: norja suoraan, pohjoissaame suoraan tai
// suomennoksen kautta (≈; dict-sms-mul:ssa pohjoissaame on vain noin 400 sanalle)
function minorTranslation(lang, row, to) {
  const uniq = (xs) => [...new Map(xs.map((x) => [x.normalize("NFC").toLowerCase(), x.normalize("NFC")])).values()];
  const direct = uniq(splitList(row[to] || "")).slice(0, 3);
  if (direct.length) return direct.join(", ");
  if (lang === "smn" && to === "nob") {
    const nob = [];
    for (const sme of splitList(row.sme).slice(0, 2)) {
      const r = all(`SELECT nob_translation AS t FROM dictionary WHERE lemma_fold = ? AND nob_translation != '' ORDER BY freq DESC LIMIT 1`, [fold(sme)])[0];
      if (r) for (const x of splitList(r.t).slice(0, 2)) if (!nob.includes(x)) nob.push(x);
    }
    return nob.length ? "≈ " + nob.slice(0, 3).join(", ") : "";
  }
  if (lang === "sms" && to === "sme" && hasTable("fin_items")) {
    const sme = [];
    for (const f of splitList(row.fin).slice(0, 2)) {
      for (const r of all(`SELECT d.sme_lemma FROM fin_items i JOIN dictionary d ON d.id = i.word_id WHERE i.item = ?
          ORDER BY i.first, d.freq DESC LIMIT 2`, [f.replace(/\s*\(.*$/, "").toLowerCase()])) if (!sme.includes(r.sme_lemma)) sme.push(r.sme_lemma);
    }
    return sme.length ? "≈ " + sme.slice(0, 3).join(", ") : "";
  }
  return "";
}
const smnTranslation = (row, to) => minorTranslation("smn", row, to);

function ocrCorrector() {
  const lemma = db.prepare("SELECT 1 FROM dictionary WHERE lemma_fold = ? LIMIT 1");
  const form = db.prepare("SELECT 1 FROM paradigms WHERE surface IN (?, ?) LIMIT 1");
  // Passiivimuodot (ráhkaduvvon, máksojuvvo) sme_passive-taulusta; vanhassa aineistossa ei ole
  let pass = null;
  try { pass = db.prepare("SELECT 1 FROM sme_passive WHERE surface IN (?, ?) LIMIT 1"); } catch (e) { /* vanha aineisto */ }
  const exists = (stmt, params) => { stmt.bind(params); const found = stmt.step(); stmt.reset(); return found; };
  const plain = (w) => exists(lemma, [fold(w)]) || exists(form, [w, capitalize(w)]) || (pass && exists(pass, [w, capitalize(w)]));
  // Liitepartikkelin kanssa (válddátgo = válddát + -go, songe = son + -ge): haku tuntee nämä (queryDatabase)
  const isSami = (w) => plain(w) || CLITICS.some((c) => w.length > c.length + 1 && w.endsWith(c) && plain(w.slice(0, -c.length)));
  const cache = new Map();
  const correct = (word) => {
    const w = [...word.toLowerCase()].map((c) => OCR_LOOKALIKES[c] || c).join("");
    if (isSami(w)) return w;
    // Yhdysmerkkinen nimi (Biret-Iŋgá, Biret-Iŋggáin): viimeinen osa taipuu, joten se haetaan
    if (w.includes("-")) return correct(w.slice(w.lastIndexOf("-") + 1));
    const spots = [...w].map((c, i) => (OCR_DIACRITICS[c] ? i : -1)).filter((i) => i >= 0).slice(0, 10);
    const variant = (picked) => [...w].map((c, i) => (picked.includes(i) ? OCR_DIACRITICS[c] : c)).join("");
    const combos = (k, from = 0) => (k === 0 ? [[]] : spots.slice(from).flatMap((s, j) =>
      combos(k - 1, from + j + 1).map((rest) => [s, ...rest])));
    for (let k = 1; k <= 3; k++) {
      for (const picked of combos(k)) {
        const v = variant(picked);
        if (isSami(v)) return v;
      }
    }
    // Kaksoiskirjain luettu yhdeksi (sámiid -> sámid, áššiid -> áššid, lii -> li, rávagirjji -> rávagirji; uutiskoe
    // 2026-11-18: yleisin lukuvirhe, 129 / 8 637 sanaa). Ensin pelkkä tuplaus, sitten tuplaus ja yksi tarke.
    if (w.length >= 4 && w.length <= 20) {
      const chars = [...w], doubled = [];
      for (const i of doubleOrder(chars)) {
        const v = [...chars.slice(0, i + 1), chars[i], ...chars.slice(i + 1)].join("");
        if (isSami(v)) return v;
        doubled.push(v);
      }
      for (const v of doubled) {
        const vc = [...v];
        for (let i = 0; i < vc.length; i++) {
          if (!OCR_DIACRITICS[vc[i]]) continue;
          const d = [...vc.slice(0, i), OCR_DIACRITICS[vc[i]], ...vc.slice(i + 1)].join("");
          if (isSami(d)) return d;
        }
      }
    }
    // Viimeisenä sumea haku (useampi tarke ja tuplaus yhdessä: vattisvuodat -> váttisvuođat); yhdyssanat erikseen
    // (ocrMatches -> compound), koska niitä ei ole sanakirjassa sellaisinaan
    if (w.length >= 5) {
      fuzzy ||= ocrFuzzySearch();
      const r = fuzzy.search(w);
      if (r && !r.parts) return r.word;
      if (r?.parts) compounds.set(word.toLowerCase(), r);
    }
    return null;
  };
  let fuzzy = null;
  const compounds = new Map();
  return {
    correct: (word) => { if (!cache.has(word)) cache.set(word, correct(word)); return cache.get(word); },
    compound: (word) => compounds.get(word.toLowerCase()) || null,
    free: () => { lemma.free(); form.free(); pass?.free(); fuzzy?.free(); },
  };
}

// Sumea haku kuvan sanalle (coahkkinbalvalusa -> čoahkkinbálválusa): kirjain kerrallaan sanakirjan muotojen
// hakemistoa pitkin. Joka kirjaimella kokeillaan tunnistuksen tavallisia virheitä (tarke puuttuu: a/á, c/č, d/đ, n/ŋ,
// s/š, t/ŧ, z/ž; kaksoiskirjain luettu yhdeksi), ja haara katkaistaan heti, kun yksikään muoto ei ala niin. Yhdyssanan
// alkuosan (sme_cmp) jälkeen haku jatkuu uutena sanana, joten myös väärin luettu yhdyssana löytyy. Halvin korjaus
// ensin (hinta lukuvirheen yleisyyden mukaan, FUZZY_COST; yhdyssanaraja 0,3; sitten osien määrä, lyhyet osat ja korpusfrekvenssi), enintään 4. Ei lisätietoa sovellukseen: käyttää olemassa olevia
// hakemistoja (paradigms.surface, dictionary.sme_lemma, sme_passive.surface, sme_cmp.stem).
const FUZZY_ALTS = { a: "á", c: "č", d: "đ", n: "ŋ", s: "š", t: "ŧ", z: "ž" };
// Hinta testikuvien lukuvirheistä (docs/kuvatunnistus-testipenkki-2026-11-18.md: 121 kallistettua ja sumennettua kuvaa
// ML Kitin läpi): đ -> d ja ŋ -> n yleisiä, á, č ja š luetaan lähes aina oikein
const FUZZY_COST = { a: 1.2, c: 0.9, d: 0.4, n: 0.5, s: 0.9, t: 0.9, z: 0.9 };
function ocrFuzzySearch() {
  const tables = [["paradigms", "surface"], ["dictionary", "sme_lemma"], ["sme_passive", "surface"], ["sme_cmp", "stem"]];
  const pre = [], exact = [];
  for (const [tb, col] of tables) {
    try {
      pre.push(db.prepare(`SELECT 1 FROM ${tb} WHERE ${col} >= ? AND ${col} < ? LIMIT 1`));
      if (tb !== "sme_cmp") exact.push(db.prepare(`SELECT 1 FROM ${tb} WHERE ${col} = ? LIMIT 1`));
    } catch (e) { /* vanha aineisto */ }
  }
  let cmpStmt = null;
  // Yhdyssanan alkuosa kuten splitCompound: substantiivin tai adjektiivin perusmuoto, substantiivin genetiivi,
  // adjektiivin attribuutti- tai genetiivimuoto tai sme_cmp-taulun alkumuoto
  const leftSql = `SELECT 1 FROM dictionary WHERE sme_lemma = ?1 AND pos IN ('N', 'A')
    UNION ALL SELECT 1 FROM paradigms p JOIN dictionary d ON d.id = p.word_id JOIN tags t ON t.id = p.tag_id
      WHERE p.surface = ?1 AND ((d.pos = 'N' AND t.tag = 'Sg+Gen') OR (d.pos = 'A' AND t.tag IN ('Attr', 'Sg+Gen')))`;
  try { cmpStmt = db.prepare(`${leftSql} UNION ALL SELECT 1 FROM sme_cmp WHERE stem = ?1 LIMIT 1`); } catch (e) { cmpStmt = db.prepare(`${leftSql} LIMIT 1`); }
  // Korpusfrekvenssi: harvinainen osa (coahkkin, freq puuttuu) häviää yleiselle (čoahkkin 14 556)
  let freqStmt = null;
  try {
    freqStmt = db.prepare(`SELECT MAX(f) FROM (SELECT d.freq AS f FROM paradigms p JOIN dictionary d ON d.id = p.word_id WHERE p.surface = ?1
      UNION ALL SELECT freq FROM dictionary WHERE sme_lemma = ?1 UNION ALL SELECT d.freq FROM sme_cmp c JOIN dictionary d ON d.sme_lemma = c.lemma WHERE c.stem = ?1)`);
  } catch (e) { /* vanha aineisto */ }
  const freqMemo = new Map();
  const freq = (x) => {
    if (!freqStmt) return 1000;
    if (!freqMemo.has(x)) { freqStmt.bind([x]); freqStmt.step(); freqMemo.set(x, freqStmt.get()[0] || 0); freqStmt.reset(); }
    return freqMemo.get(x);
  };
  const run = (stmt, params) => { stmt.bind(params); const f = stmt.step(); stmt.reset(); return f; };
  const memo = new Map();
  const has = (kind, s) => {
    const k = kind + s;
    if (!memo.has(k)) {
      memo.set(k, kind === "p" ? pre.some((st) => run(st, [s, s + "\uffff"])) : kind === "w" ? exact.some((st) => run(st, [s])) : !!cmpStmt && run(cmpStmt, [s]));
    }
    return memo.get(k);
  };
  const search = (word, maxCost = 4, minLen = 5) => {
    const w = [...word.toLowerCase()].map((c) => OCR_LOOKALIKES[c] || c);
    if (w.length < minLen || w.length > 40 || !w.every((c) => /\p{L}/u.test(c))) return null;
    // Tila: [hinta, kohta w:ssä, osat, nykyinen osa]
    const queue = [[0, 0, [], ""]];
    // Osien määrä ja lyhyet osat lisäävät hintaa (coahkkin + balva + lusa < čoahkkin + bálvalusa): kaikki
    // tulokset 1,5:n sisällä halvimmasta, ja niistä paras
    const score = (r) => r.cost + 0.8 * (r.parts ? r.parts.length - 1 : 0) + 0.7 * (r.parts || []).filter((x) => x.length < 5).length
      // Sanakirjan kokonainen sana voittaa saman asun osiin jaon (šleađgapoasttat, ei šleađga + poasttat), vaikka
      // sen frekvenssiä ei tiedettäisi
      + (r.parts || [r.word]).reduce((sum, x) => sum + Math.max(0, 0.5 * (4 - Math.log10(freq(x) + 1))), 0) * (r.parts ? 1 : 0.25);
    let best = null, steps = 0;
    while (queue.length && steps++ < 4000) {
      let bi = 0;
      for (let i = 1; i < queue.length; i++) if (queue[i][0] < queue[bi][0]) bi = i;
      const [cost, i, parts, seg] = queue.splice(bi, 1)[0];
      if (best && cost > best.cost + 1.5) break;
      if (i === w.length) {
        if (seg && (!parts.length || seg.length >= 4) && has("w", seg)) {
          const r = { word: [...parts, seg].join(""), parts: parts.length ? [...parts, seg] : null, cost };
          if (!best || score(r) < score(best)) best = r;
        }
        continue;
      }
      const push = (c, s) => { if (c <= maxCost && has("p", s)) queue.push([c, i + 1, parts, s]); };
      const ch = w[i];
      push(cost, seg + ch);
      if (FUZZY_ALTS[ch]) push(cost + FUZZY_COST[ch], seg + FUZZY_ALTS[ch]);
      // w = vv (govva -> govwa, árvvoštallat -> árvwoštallat): saamessa ei ole w:tä
      if (ch === "w") { push(cost + 0.4, seg + "vv"); push(cost + 0.6, seg + "v"); }
      // Kaksoiskirjain: luettu yksi, oikeassa kaksi (sámid -> sámiid)
      if (/\p{L}/u.test(ch) && w[i + 1] !== ch && seg.slice(-1) !== ch) {
        for (const d of [ch, FUZZY_ALTS[ch]].filter(Boolean)) {
          const c2 = cost + 1 + (d !== ch ? FUZZY_COST[ch] : 0) + (/[ij]/.test(ch) ? -0.4 : 0);
          if (c2 <= maxCost && has("p", seg + d + d)) queue.push([c2, i + 1, parts, seg + d + d]);
        }
      }
      // Yhdyssanaraja: alkuosa valmis, loppu uutena sanana
      if (seg.length >= (parts.length ? 3 : 4) && w.length - i >= 4 && parts.length < 3 && has("c", seg)) queue.push([cost + 0.3, i, [...parts, seg], ""]);
    }
    return best;
  };
  return { search, free: () => { pre.forEach((st) => st.free()); exact.forEach((st) => st.free()); cmpStmt?.free(); freqStmt?.free(); } };
}

// Viimeisin kuva säilyy: 📷 palaa samaan kuvaan samassa zoomauksessa
let ocr = null;  // { r: Ocr.java:n tulos, words, status, base: sovitettu koko, view: { s, x, y }, picked: sanan nro }
let ocrReturnHash = null;  // kuvasta avatun sanan osoite: takaisin-ele palaa siitä kuvaan

function openOcr() {
  $("ocr-view").hidden = false;
  applyOcrLook();
  if (ocr) {
    layoutOcr(false);
    // Kuvan kieliä muutettu asetuksista (esim. vihjeen kautta): sanat uudelleen, kielen tunnistus mukaan lukien
    if (ocr.r && ocr.langsKey !== undefined && ocr.langsKey !== settings.ocrLangs.join() && settings.ocrLangs.every(hasMinor)) { ocr.autoDir = true; findOcrWords(); }
  } else $("ocr-status").textContent = t("ocrIntro");
}

// Takaisin-ele (MainActivity.goBackOrFinish): ensin suljetaan sanan kupla, sitten kuva
function closeOcr() {
  if (closeSentView()) return true;
  if ($("ocr-view").hidden) return false;
  if (ocr && ocr.picked != null) pickOcrWord(null);
  else $("ocr-view").hidden = true;
  return true;
}

// Takaisin-ele sanakirjasta, kun sana avattiin kuvasta: takaisin kuvaan (sama sana valittuna)
function backToOcr() {
  if (!ocr || !ocrReturnHash || location.hash !== ocrReturnHash) return false;
  ocrReturnHash = null;
  openOcr();
  return true;
}

// Pyörivä kehä kuvan päällä, kun tekstiä tunnistetaan tai sanoja haetaan. Sanojen haku on yksi pitkä synkroninen
// laskenta, joten ennen sitä annetaan sivun piirtyä kerran (nextPaint); kehä pyörii transformilla, jonka selain
// animoi pääsäikeestä riippumatta, joten se ei pysähdy laskennan ajaksi.
function setOcrBusy(text) {
  $("ocr-busy").hidden = !text;
  if (text) $("ocr-status").textContent = text;
}
// (requestAnimationFrame ei aja piilossa olevalla sivulla, joten varalla ajastin)
const nextPaint = () => new Promise((resolve) => {
  requestAnimationFrame(() => setTimeout(resolve, 0));
  setTimeout(resolve, 100);
});

function scanPhoto(source) {
  setOcrBusy(t("ocrWorking"));
  window.SatniOcr.scan(source);
}

// Saamen tekstissä sana on saamen perusmuoto tai taivutusmuoto (korjattu tarkkeet, ocrCorrector); suomen- tai
// norjankielisessä tekstissä sana löytyy käännöksistä, myös taivutettuna (taloon -> talo -> viessu).
const SAMI_RANKS = [1, 1.2, 5, 5.5, 6];
// Muiden kielten osumat (rank 6.5) eivät kuulu kuvan suomen- tai norjankieliseen tekstiin
const uiRows = (word) => queryDatabase(word).filter((r) => r.rank < PREFIX_RANK && !SAMI_RANKS.includes(r.rank) && !r.extraLang);

// Kuplan teksti. Saamesta: perusmuoto ja käännös käyttöliittymän kielellä; kuuntele lausuu kuvan sanan.
// Suomesta/norjasta: saamennokset; kuuntele lausuu ensimmäisen saamennoksen.
function ocrGloss(word, original = "") {
  if (isMinor(settings.ocrFrom)) {
    const lang = settings.ocrFrom, to = ocrTo(), rows = minorRows(lang, word);
    const row = rows.find((r) => minorTranslation(lang, r, to)) || rows[0];
    if (!row) return { trans: "", say: "" };
    const sme = splitList(row.sme)[0], fin = splitList(row.fin)[0];
    // Napautus avaa pohjoissaamen sanan sanakirjasta, tai haun suomennoksella, jos vastinetta ei ole
    return { lemma: row.lemma.toLowerCase() !== word ? row.lemma : "", form: "", trans: minorTranslation(lang, row, to), say: "",
      query: sme || (fin || "").replace(/\s*\(.*$/, "") || word };
  }
  if (settings.ocrFrom === "ui") {
    const rows = uiRows(word);
    const base = rows.find((r) => r.via)?.via.base;
    const sami = [...new Set(rows.map((r) => r.sme_lemma))];
    return { lemma: base && base !== word ? base : "", trans: sami.slice(0, 3).join(", "), say: sami[0] || "" };
  }
  // Isolla kirjoitettu sana kuvassa: nimi ensin, jos sellainen on (Máhte = miehen nimi eikä máhttit "osata",
  // Iŋggáin = Iŋgá). Muuten ensimmäinen saamen osuma, jolla on käännös (in = en, ei pelkkä kieltoverbin hakusana).
  const part = (original || "").slice((original || "").lastIndexOf("-") + 1);
  const sami = (q) => queryDatabase(q).filter((r) => SAMI_RANKS.includes(r.rank));
  let query = word, rows = sami(word);
  if (/^\p{Lu}/u.test(part)) {
    const names = sami(capitalize(word)).filter((r) => r.subtype === "Prop");
    if (names.length && (!rows.length || names[0].rank <= rows[0].rank)) { query = capitalize(word); rows = names; }
  }
  // Käännöskieli: suomi/norja tai inarinsaame (dict-sme-smn)
  const tl = ["fin", "nob", "smn"].includes(ocrTo()) ? ocrTo() : settings.lang;
  const col = LANGUAGES[tl].col;
  const translated = rows.filter((r) => r[col]);
  let row = translated[0] || rows[0];
  if (!row) return { trans: "", say: word };
  // Harvinainen hakusana ei peitä yleisen sanan muotoa: substantiivi, adjektiivi tai verbi, jonka korpusfrekvenssi on alle
  // 5 % saman kirjoitusasun yleisemmästä taivutusmuodosta (orru "liikkumaton" -> orrut "asuu", ovtta -> okta "yhden",
  // bargan -> bargat "tehnyt"). Postpositiot, adverbit ja pronominit pysyvät (áigge = aikaan, rádjái = asti).
  // Tarkistettu 2026-11-10 sanakirjan esimerkkilauseiden 10 919 sanalla.
  const isHead = (r) => fold(r.sme_lemma) === fold(word);
  const common = (r) => !isHead(r) && (r.freq || 0) >= 1000;
  if (isHead(row) && ["N", "A", "V"].includes(row.pos)) {
    const form = translated.filter(common).sort((a, b) => b.freq - a.freq)[0];
    if (form && (row.freq || 0) < form.freq * 0.05) row = form;
  }
  const lemma = fold(row.sme_lemma) !== fold(word) ? row.sme_lemma : "";
  const gloss = { lemma, form: lemma && tl === settings.lang ? ocrFormTranslation(row, word) : "", trans: translationOf(row, 2, tl), say: word, query, id: row.id,
    prop: row.subtype === "Prop" };
  // Toinen yleinen merkitys pienemmällä rivillä (maid = myös · tai: minkä (mii); mii = me · tai: mikä): eri suomennos
  // ja vähintään 10 % yhtä yleinen (sama sana eri merkityksessä, kuten mii Pers / Rel, aina)
  // Ei harvinaisia muotoja (imperatiivi, potentiaali, duaali, kieltomuoto, 1. ja 2. persoona: bargu ≠ työskennelkäämme,
  // dihte ≠ tiedämme) eikä lähes samaa
  // merkitystä (badjel ylitse / yli: toinen sana alkaa toisella)
  const firstWords = (r) => new Set(splitList(r[col]).flatMap((x) => x.toLowerCase().split(/\s+/)));
  const mine = firstWords(row);
  const overlaps = (r) => [...firstWords(r)].some((x) => [...mine].some((y) => x.length > 2 && y.length > 2 && (x.startsWith(y) || y.startsWith(x))));
  const usualForm = (r) => isHead(r) || all(`SELECT t.tag FROM paradigms p JOIN tags t ON t.id = p.tag_id
    WHERE p.word_id = ? AND p.surface IN (?, ?)`, [r.id, word, capitalize(word)]).some((x) => !/(Imprt|Pot|Du\d|ConNeg|Sg1|Sg2|Pl1|Pl2)/.test(x.tag));
  const alt = translated.find((r) => r.id !== row.id && r.subtype !== "Prop"
    && ((r.freq || 0) >= Math.max(1000, (row.freq || 0) * 0.1) || (r.sme_lemma === row.sme_lemma && r.freq === row.freq && r.freq))
    && !overlaps(r) && usualForm(r));
  if (alt) {
    const altForm = !isHead(alt) && tl === settings.lang ? ocrFormTranslation(alt, word) : "";
    const text = (altForm || translationOf(alt, 1, tl)).split(" / ")[0];
    if (text && !mine.has(text.toLowerCase())) gloss.alt = { text, lemma: isHead(alt) ? "" : alt.sme_lemma };
  }
  return gloss;
}

// Kuvan taivutetun sanan käännös samassa muodossa kuin sanakortilla (beavddis = pöydässä / pöydästä, manan = menen).
// Vain ensimmäinen käännös, jotta kupla pysyy lyhyenä. Tekstissä muoto, joka voi olla myös indikatiivi, on lähes
// aina indikatiivi: imperatiivit pois, jos indikatiivi on (áigu = aikoo, ei aikokaamme / aikokaa).
// Tyhjä, jos muotoa ei voi kääntää varmasti (esim. partitiivi): silloin kuplassa on vain perusmuodon käännös.
function ocrFormTranslation(row, word) {
  if (!FORM_PHRASES[settings.lang]) return "";
  const data = loadWord(row.id);
  const stem = fold(row.clitics ? row.cliticStem : word);
  let tags = [...new Set([...data.paradigm].filter(([, forms]) => forms.some((f) => fold(f) === stem)).map(([tag]) => tag))];
  if (tags.some((tag) => tag.startsWith("Ind+"))) tags = tags.filter((tag) => !tag.startsWith("Imprt+"));
  // Duaali on tekstissä harvinainen: samannäköinen muu muoto ensin (dihte = tiesivät, ei tiedämme kahdestaan)
  if (tags.some((tag) => !/Du\d/.test(tag))) tags = tags.filter((tag) => !/Du\d/.test(tag));
  if (!tags.length) return "";
  const own = data.meanings.find((m) => m.lang === settings.lang && m.translations);
  const base = (own ? splitList(own.translations) : splitList(data.word[LANGUAGES[settings.lang].col]))[0];
  if (!base) return "";
  const finClitics = row.clitics && settings.lang === "fin" && row.clitics.every((c) => FIN_CLITICS[c]) ? row.clitics : null;
  const parts = [...new Set(translationOfForm(data.word, tags, finClitics, [base]).split(" / ").map((p) => p.trim()).filter(Boolean))];
  return parts.join(" / ");
}

function ocrResult(r) {
  setOcrBusy(null);
  if (!r) { $("ocr-status").textContent = ocr ? ocr.status : t("ocrIntro"); return; }  // kuvan otto peruttiin
  if (r.error) { $("ocr-status").textContent = t(r.error === "noApp" ? "ocrNoApp" : "ocrError"); return; }
  // Pisteetön ı (Prográmmafıtnodat): ei saamessa, suomessa eikä norjassa, aina i
  for (const w of r.words) { w.t = w.t.replace(/ı/g, "i"); w.clean = w.t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""); }
  joinHyphenated(r.words);
  ocr = { r, view: null, words: [], status: t("ocrFinding"), autoDir: true };
  ocrReturnHash = null;
  // Kuva näkyviin heti; merkinnät tulevat sanojen haun jälkeen
  $("ocr-photo").innerHTML = `<img src="${r.image}" alt="">`;
  layoutOcr(true);
  findOcrWords();
}

// Rivin lopussa tavutettu sana (sympo- / siumist, oovdân- / puohtui; uutiskoe 2026-11-18): molemmat palat haetaan
// yhtenä sanana ja merkitään samana sanana. Pienellä alkava jatko liitetään ilman yhdysmerkkiä, isolla alkava
// yhdysmerkin kanssa (Nuorta- / Lappis = Nuorta-Lappis).
function joinHyphenated(words) {
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    // Koltan pehmennysmerkin kohdalta kahdeksi sanaksi luettu (Sää' + mkiöll = Sääʹmǩiõll; somekuva 2026-11-18):
    // sama rivi, ensimmäinen päättyy merkkiin ʹ tai ', ja väli on kapea
    if (/\p{L}[ʹ'’]$/u.test(a.t) && /^\p{L}/u.test(b.t) && a.w && b.w && Math.abs(b.cy - a.cy) < (a.h || 10) * 0.4
        && (b.cx - b.w / 2) - (a.cx + a.w / 2) < (a.h || 10) * 0.6 && b.cx > a.cx) {
      a.t = b.t = a.t + b.t;
      a.clean = b.clean = a.t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
      i++;
      continue;
    }
    if (!/\p{L}[-‐‑\u00AD]$/u.test(a.t) || !/^\p{L}/u.test(b.t) || !b.clean) continue;
    if (!(b.cy > a.cy + (a.h || 10) * 0.6 && b.cx < a.cx)) continue;  // jatko seuraavalla rivillä, vasemmalla
    const joined = /^\p{Ll}/u.test(b.clean) ? a.clean + b.clean : `${a.clean}-${b.clean}`;
    a.clean = b.clean = joined;
    i++;
  }
}

// Sanojen haku kehän kanssa (uusi kuva tai suunnan vaihto)
async function findOcrWords() {
  setOcrBusy(t("ocrFinding"));
  await nextPaint();
  try { analyzeOcr(); } finally { setOcrBusy(null); }
}

// Suomen- tai norjankielisen kuvan tunnistusvirheet: tekstintunnistus lukee ä:n usein á:ksi tai ă:ksi (Näytä -> Näytá,
// vähemmän -> vähemmăn, käyttäjän kuva 2026-11-18). Jos sanaa ei löydy sellaisenaan, kokeillaan suomessa ä/ö ja muuten
// pelkkä a/o.
function uiOcrVariants(word) {
  if (!/[áàâăãóòôõÁÀÂĂÃÓÒÔÕ]/.test(word)) return [];
  const plain = word.replace(/[áàâăã]/g, "a").replace(/[ÁÀÂĂÃ]/g, "A").replace(/[óòôõ]/g, "o").replace(/[ÓÒÔÕ]/g, "O");
  if (settings.lang !== "fin") return [plain];
  return [word.replace(/[áàâăã]/g, "ä").replace(/[ÁÀÂĂÃ]/g, "Ä").replace(/[óòôõ]/g, "ö").replace(/[ÓÒÔÕ]/g, "Ö"), plain];
}

let ocrFixedCompounds = new Map();
// Kuvan sanat valitun suunnan mukaan; suunnan vaihto laskee ne uudelleen samasta kuvasta
function ocrMatches(r, from) {
  if (isMinor(from) && !hasMinor(from)) return [];
  const corrector = from === "sme" ? ocrCorrector() : isMinor(from) ? minorMatcher(from) : null;
  const cache = new Map();
  const match = (clean) => {
    if (clean.length < 2) return null;
    if (corrector) return corrector.correct(clean);
    if (!cache.has(clean)) cache.set(clean, [clean, ...uiOcrVariants(clean)].find((v) => uiRows(v).length)?.toLowerCase() || null);
    return cache.get(clean);
  };
  const words = r.words.map((w) => ({ ...w, word: match(w.clean) })).filter((w) => w.word);
  // Väärin luettu yhdyssana (coahkkinbalvalusa = čoahkkin + bálvalusa): korjattu asu ja osat tuntemattomalle sanalle
  if (corrector?.compound) ocrFixedCompounds = new Map(r.words.map((w) => [w, corrector.compound(w.clean)]).filter(([, c]) => c));
  corrector?.free();
  return words;
}

function analyzeOcr() {
  const { r } = ocr;
  let words = ocrMatches(r, settings.ocrFrom), switched = false;
  // Uusi kuva: kokeillaan myös toista suuntaa ja vaihdetaan siihen, jos se löytää selvästi enemmän sanoja (vähintään 3
  // ja kolminkertaisesti): saamenkielinen kirja, kun suunta on Suomi -> Saame (sattumaosuma "varas" ei riitä).
  // Käyttäjän oma suunnan vaihto ei käännä takaisin.
  const count = (ws) => new Set(ws.map((w) => w.word)).size;
  // Kolme kieltä: pohjoissaame, inari ja suomi/norja. Saamenkielten välillä riittää puolitoistakertainen ero (ne jakavat
  // sanoja, já, lea/lii), suomen ja saamen välillä kolminkertainen kuten ennen.
  // Koltansaame (sääʹmǩiõl, leʹčči: ʹ ǩ ǥ õ ǯ ʒ) näytti inariksi tunnistettuna (uutiskoe 2026-11-18): ei automaattista
  // vaihtoa, vaan tilarivillä ilmoitus, ettei koltansaamea vielä tueta
  const letterWords = r.words.filter((w) => /\p{L}{2}/u.test(w.clean));
  const skolt = letterWords.filter((w) => /[ʹǩǥõǯʒǨǦÕǮƷ]/u.test(w.t)).length;
  const isSkolt = skolt >= 3 && skolt >= letterWords.length * 0.08;
  // Koltan aineisto mukana: koltta on yksi tunnistettavista kielistä; muuten vain ilmoitus
  const skoltUnsupported = isSkolt && !minorOn("sms");
  if (ocr.autoDir && r.words.length && !skoltUnsupported) {
    let best = null;
    const candidates = ocrSources();
    for (const other of candidates.filter((l) => l !== settings.ocrFrom)) {
      const alt = ocrMatches(r, other), sami = other !== "ui" && settings.ocrFrom !== "ui";
      if (count(alt) >= 3 && count(alt) >= (sami ? 1.5 : 3) * count(words) && (!best || count(alt) > count(best.words))) best = { lang: other, words: alt };
    }
    if (best) {
      settings.ocrFrom = best.lang;
      saveSettings();
      words = best.words;
      switched = true;
    }
  }
  ocr.autoDir = false;
  // Vihje: kuvassa näyttää olevan koltan- tai inarinsaamea (kirjaimet ʹ ǩ ǥ õ / â), mutta kieli ei ole valittuna
  // kuvan kieleksi -> linkki asetuksiin. Ei vaihdeta eikä oteta mitään käyttöön automaattisesti.
  const share = (re) => letterWords.filter((w) => re.test(w.t)).length / Math.max(1, letterWords.length);
  const hint = isSkolt && !minorOn("sms") ? "sms" : settings.ocrFrom !== "smn" && !minorOn("smn") && share(/â/iu) >= 0.08 ? "smn" : null;
  showOcrHint(hint && !hintDismissed[hint] ? hint : null);
  ocr.langsKey = settings.ocrLangs.join();
  applyOcrLook();
  const found = new Set(words.map((w) => w.word)).size;
  // Tuntemattomat sanat (vähintään 3 kirjainta, ei numeroita) himmeällä katkoviivalla: napautus näyttää lähimmät
  // sanakirjan sanat (ocrRepairs) ja jokerihaun (ábmogis -> álbmogis). Ei automaattista korjausta: suomen sana ei
  // muutu saameksi kysymättä (rasismi, valssi).
  const at = new Set(words.map((w) => `${w.cx},${w.cy}`));
  // Vain saamesta: suomesta/norjasta lähimmät sanat ja yhdyssanan jako eivät toimi, ja saamenkielisessä kuvassa
  // jokainen saamen sana näkyisi katkoviivalla (käyttäjän kuva 2026-11-18, Suomi -> Saame).
  // Suomesta: sanakirjasta puuttuva yhdyssana, jonka osat löytyvät (viranomaistiedote), katkoviivalla; napautus
  // näyttää osat saamennoksineen. Muut tuntemattomat suomen sanat jäävät merkitsemättä.
  const finCompounds = settings.ocrFrom === "ui" && settings.lang === "fin"
    ? r.words.filter((w) => !at.has(`${w.cx},${w.cy}`) && /^\p{L}{7,}$/u.test(w.clean))
      .map((w) => { const finParts = splitFinCompound(w.clean); return finParts && { ...w, word: w.clean.toLowerCase(), unknown: true, finParts }; })
      .filter(Boolean)
    : [];
  // Isolla alkava tuntematon sana keskellä virkettä on yleensä nimi tai vieras sana (Microsoft, Riestola, Toppari):
  // ei katkoviivaa, ettei kuva täyty merkinnöistä (Yle-koe 2026-11-18: 25 / 64 tuntemattomasta). Virkkeen alussa
  // (edellinen sana päättyy . ! ? : tai sana on ensimmäinen) merkitään kuten muutkin.
  const sentenceStart = new Set();
  r.words.forEach((w, i) => { if (i === 0 || /[.!?:–—]$/.test(r.words[i - 1].t || "")) sentenceStart.add(w); });
  // Yhdyssanaksi korjautuva sana ei ole nimi (Luossabivdogildosa virkkeen alussa, kun rivijärjestys ei näytä pistettä)
  const nameLike = (w) => /^\p{Lu}/u.test(w.clean) && !sentenceStart.has(w) && !(settings.ocrFrom === "sme" && ocrFixedCompounds.has(w));
  const unknown = settings.ocrFrom === "ui" ? finCompounds : r.words.filter((w) => !at.has(`${w.cx},${w.cy}`) && !nameLike(w) && /^[\p{L}-]+$/u.test(w.clean) && /\p{L}{3}/u.test(w.clean))
    .map((w) => {
      const fixed = settings.ocrFrom === "sme" ? ocrFixedCompounds.get(w) : null;
      return { ...w, word: fixed ? fixed.word : w.clean.toLowerCase(), unknown: true, ...(fixed ? { fuzzyParts: fixed.parts } : {}) };
    });
  ocr.words = [...words, ...unknown];
  ocr.picked = null;
  ocr.status = (!r.words.length ? t("ocrNoText") : found ? t("ocrFound", found) : t("ocrNoWords")) +
    (switched ? ` · ${t("ocrDirSwitched")}` : "");
  $("ocr-bubble").hidden = true;
  $("ocr-photo").innerHTML = `<img src="${r.image}" alt="">`
    + ocr.words.map((w, i) => `<div class="ocr-word${w.unknown ? " unknown" : ""}" data-i="${i}"></div>`).join("");
  layoutOcr(!ocr.view);
}

// Kuva sovitetaan alueeseen kokonaan näkyviin, ja merkinnät asetetaan kuvan pikseleistä sovitettuun kokoon
function layoutOcr(reset) {
  const stage = $("ocr-stage"), photo = $("ocr-photo");
  $("ocr-status").textContent = ocr.status;
  applyOcrLook();
  const { r, words } = ocr;
  if (!r) return;  // kuvaa ei vielä luettu (koon muutos kesken tunnistuksen)
  const k = Math.min(stage.clientWidth / r.width, stage.clientHeight / r.height);
  ocr.base = { w: r.width * k, h: r.height * k };
  photo.style.width = `${ocr.base.w}px`;
  photo.style.height = `${ocr.base.h}px`;
  const frame = settings.ocrStyle === "frame";
  for (const el of photo.querySelectorAll(".ocr-word")) {
    const w = words[el.dataset.i], h = w.h * k;
    Object.assign(el.style, {
      left: `${w.cx * k}px`, top: `${w.cy * k}px`,
      width: `${w.w * k + (frame ? h * 0.3 : 2)}px`, height: `${h * (frame ? 1.3 : 1.15)}px`,
      transform: `translate(-50%, -50%) rotate(${w.a || 0}deg)`,
    });
  }
  if (reset || !ocr.view) ocr.view = { s: 1, x: 0, y: 0 };
  applyOcrView();
}

// Suuntapainike (Saame → Suomi), merkintätapa ja väri asetuksista
// Merkinnän värit: saamelaislipun värit, samat kuin otsikon raidassa (styles.css: .stripe)
const OCR_COLORS = ["#e11d48", "#facc15", "#2563eb", "#16a34a"];
// Kielilista sirun alle: kuvan kieli tai käännöskieli; valittu merkitty, norjan kohdalla "pohjoissaamen kautta"
function openOcrLangMenu(kind) {
  const menu = $("ocr-langs"), chip = $(kind === "from" ? "ocr-from" : "ocr-to");
  const codes = kind === "from" ? ocrSources() : ocrTargets(settings.ocrFrom);
  const cur = kind === "from" ? settings.ocrFrom : ocrTo();
  menu.innerHTML = codes.map((c) => `<button role="option" data-${kind}="${c}" class="ocr-mi${c === cur ? " active" : ""}" aria-selected="${c === cur}">` +
    `<span>${esc(ocrLangName(c))}${kind === "to" && settings.ocrFrom === "smn" && c === "nob" ? `<small>${esc(t("ocrViaSmeShort"))}</small>`
      : kind === "to" && settings.ocrFrom === "sms" && c === "sme" ? `<small>${esc(t("ocrViaFinShort"))}</small>` : ""}</span>` +
    `${c === cur ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>` : ""}</button>`).join("");
  menu.dataset.kind = kind;
  menu.hidden = false;
  // Sirun alle, mutta ei näytön reunan yli (käännöskielen sirun lista oikealla)
  const room = menu.offsetParent ? menu.offsetParent.clientWidth : innerWidth;
  menu.style.left = `${Math.max(0, Math.min(chip.offsetLeft, room - menu.offsetWidth))}px`;
}
function toggleOcrLangMenu(kind) {
  $("ocr-style").hidden = true;
  if (!$("ocr-langs").hidden && $("ocr-langs").dataset.kind === kind) { $("ocr-langs").hidden = true; return; }
  openOcrLangMenu(kind);
}
// Kielten vaihto: kuvan kielen muutos hakee sanat uudelleen, käännöskielen muutos vain kuplan tekstin
function setOcrLangs(from, to) {
  const fromChanged = from !== settings.ocrFrom;
  settings.ocrFrom = from;
  settings.ocrTo = ocrTargets(from).includes(to) ? to : "";
  saveSettings();
  applyOcrLook();
  if (!ocr) return;
  if (fromChanged) { ocr.autoDir = false; showOcrHint(null); findOcrWords(); return; }
  for (const w of ocr.words) { w.gloss = null; w.cands = null; }
  if (ocr.picked != null) pickOcrWord(ocr.picked);
}
// ⇄: pohjoissaame -> suomi/norja vaihtuu suomi/norja -> pohjoissaame ja päinvastoin; pohjoissaame <-> inari
function swapOcrLangs() {
  const from = settings.ocrFrom, to = ocrTo();
  if (from === "sme") return to === "smn" ? setOcrLangs("smn", "sme") : setOcrLangs("ui", "sme");
  if (from === "ui") return setOcrLangs("sme", settings.lang);
  return to === "sme" ? setOcrLangs("sme", from === "smn" ? "smn" : settings.lang) : setOcrLangs("ui", "sme");
}
// Vihje kuvan yläpuolella: kieli näyttää olevan inarin- tai koltansaamea, mutta sitä ei ole valittu kuvan kieleksi.
// Asetukset avaa Työkalut-sivun valokuvahaun kielet; × piilottaa vihjeen tämän käynnistyksen ajaksi.
const hintDismissed = {};
function showOcrHint(lang) {
  const el = $("ocr-offer");
  if (!lang) { el.hidden = true; return; }
  el.dataset.lang = lang;
  el.innerHTML = `<span class="ocr-offer-text">${esc(t("ocrHint")[lang])}</span><span class="ocr-offer-actions">` +
    `<button data-hint="settings" class="primary">${esc(t("ocrHintSettings"))}</button>` +
    `<button data-hint="close" class="ocr-offer-x" aria-label="${esc(t("close"))}">×</button></span>`;
  el.hidden = false;
}
function openOcrSettings() {
  $("ocr-view").hidden = true;
  openSettings();
  showSettingsPage("tools");
  setTimeout(() => $("ocr-opts")?.scrollIntoView({ block: "center" }), 50);
}

// Kuvan kieli (mistä) ja käännöskieli (mihin): pohjoissaame -> suomi/norja (käännöskieli) tai inari;
// inari -> suomi, pohjoissaame tai norja (pohjoissaamen kautta); suomi/norja -> pohjoissaame
// Inarinsaame valittavissa vain, kun se on otettu käyttöön asetuksista (Muut kielet); tunnistus kokeilee sitä silti ja
// tarjoaa käyttöönottoa (showOcrOffer)
// Valokuvahaun omat asetukset: kuvan lisäkielet (settings.ocrLangs: inari, koltta; tiedosto ladattuna) ja käännöskielet
// (settings.ocrTargets; käyttöliittymän kieli aina mukana)
const minorOn = (lang) => hasMinor(lang) && settings.ocrLangs.includes(lang);
const smnOn = () => minorOn("smn");
const ocrSources = () => ["sme", ...MINOR.filter(minorOn), "ui"];
const targetOn = (c) => c === settings.lang || settings.ocrTargets.includes(c);
function ocrTargets(from) {
  const all = from === "sme" ? ["fin", "nob", "smn"] : from === "smn" ? ["fin", "sme", "nob"] : from === "sms" ? ["fin", "nob", "sme"] : ["sme"];
  const ts = all.filter(targetOn).sort((a, b) => (b === settings.lang) - (a === settings.lang));
  return ts.length ? ts : [all[0]];
}
function ocrTo() {
  const ts = ocrTargets(settings.ocrFrom);
  if (ts.includes(settings.ocrTo)) return settings.ocrTo;
  return isMinor(settings.ocrFrom) ? (settings.lang === "nob" ? "nob" : "fin") : ts[0];
}
const ocrLangName = (code) => (code === "ui" ? t("ocrLangs")[settings.lang] : t("ocrLangs")[code]);
function applyOcrLook() {
  // Inari poistettu käytöstä asetuksista: kuvan kieli takaisin pohjoissaameksi (vain kun tietokanta on ladattu)
  if (db && isMinor(settings.ocrFrom) && !minorOn(settings.ocrFrom)) { settings.ocrFrom = "sme"; saveSettings(); }
  const chev = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  $("ocr-from").innerHTML = `<span>${esc(ocrLangName(settings.ocrFrom))}</span>${chev}`;
  $("ocr-to").innerHTML = `<span>${esc(ocrLangName(ocrTo()))}</span>${chev}`;
  $("ocr-from").setAttribute("aria-label", `${t("ocrFromLabel")}: ${ocrLangName(settings.ocrFrom)}`);
  $("ocr-to").setAttribute("aria-label", `${t("ocrToLabel")}: ${ocrLangName(ocrTo())}`);
  if (!$("ocr-langs").hidden) openOcrLangMenu($("ocr-langs").dataset.kind);
  $("ocr-style-btn").innerHTML = "<span></span>";
  $("ocr-style-btn").style.setProperty("--mark-preview", settings.ocrColor);
  const photo = $("ocr-photo");
  photo.classList.toggle("style-frame", settings.ocrStyle === "frame");
  photo.classList.toggle("style-underline", settings.ocrStyle !== "frame");
  photo.style.setProperty("--mark", settings.ocrColor);
  photo.classList.toggle("mark-light", settings.ocrColor === "#facc15");  // keltainen: vahvempi merkintä
  for (const b of $("ocr-style-seg").children) b.classList.toggle("active", b.dataset.style === settings.ocrStyle);
  for (const b of $("ocr-swatches").children) b.classList.toggle("active", b.dataset.color === settings.ocrColor);
}

// Napautettu sana: kupla sanan yläpuolelle (tai alle, jos yläpuolella ei ole tilaa); null sulkee kuplan.
// Kuuntele-painike lausuu sanan kuvassa olevassa muodossa (dagan, ei dahkat).
const OPEN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;
const SPEAK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
function pickOcrWord(i) {
  const photo = $("ocr-photo"), bubble = $("ocr-bubble");
  if (ocr?.pickMode && i != null) {
    ocr.pickMode = false;
    $("ocr-status").textContent = ocr.status;
    ocr.picked = i;
    pickSentence();
    return;
  }
  photo.querySelector(".picked")?.classList.remove("picked");
  ocr.picked = i;
  if (i == null) { bubble.hidden = true; return; }
  const w = ocr.words[i];
  photo.querySelector(`[data-i="${i}"]`).classList.add("picked");
  if (w.unknown) { pickUnknownOcrWord(w); return; }
  if (!w.gloss) w.gloss = ocrGloss(w.word, w.clean);
  // Rivi = saamen sana ja sen käännös: ensin kuvan muoto (beavddis  pöydässä / pöydästä), alla himmeämpänä perusmuoto
  // (beavdi  pöytä). Perusmuotoinen sana yhdellä rivillä; jos muotoa ei voi kääntää, ylärivillä on vain saamen sana.
  // Enintään kaksi muotoa (mus = minulla / minulta …): loput näkyvät sanakortilla
  const short = (trans) => {
    const parts = trans.split(" / ");
    return parts.slice(0, 2).map(esc).join(" /<wbr> ") + (parts.length > 2 ? ` <span class="b-more">…</span>` : "");
  };
  const g = w.gloss, row = (sme, trans, cls) =>
    `<span class="b-row ${cls}"><span class="b-sme">${esc(sme)}</span>${trans ? `<span class="b-tr">${short(trans)}</span>` : ""}</span>`;
  // Toinen yleinen merkitys omalle himmeälle rivilleen (maid = myös · tai: minkä (mii))
  const altRow = g.alt ? `<span class="b-row b-alt"><span class="b-sme">${esc(t("ocrAlso"))}</span><span class="b-tr">${esc(g.alt.text)}` +
    (g.alt.lemma ? ` <span class="b-more">(${esc(g.alt.lemma)})</span>` : "") + `</span></span>` : "";
  const rows = (g.lemma ? row(w.word, g.form, "b-form") + row(g.lemma, g.trans, "b-base") : row(w.word, g.trans, "b-form")) + altRow;
  bubble.innerHTML = `<span class="b-text">${rows}</span><span class="b-actions"><span class="b-speak" role="button"
    aria-label="${esc(t("listen"))}" ${w.gloss.say ? "" : "hidden"}>${SPEAK_ICON}</span><span class="b-open">${OPEN_ICON}</span></span>`;
  bubble.setAttribute("aria-label", w.word);
  bubble.hidden = false;
  placeOcrBubble();
}

// Tuntematon sana: enintään kolme lähintä saamen sanaa (yksi kirjain eri, puuttuu tai liikaa) ja muokkaa-painike,
// joka vie sanan hakukenttään jokerihakua varten (á?bmogis). Rivin napautus avaa sen sanan.
const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>`;
function pickUnknownOcrWord(w) {
  const bubble = $("ocr-bubble");
  if (!w.cands && w.finParts) {
    // Suomen yhdyssana: osat perusmuodossa saamennoksineen (viranomainen = eiseváldi …, tiedote = dieđáhus …)
    w.parts = w.finParts.map((p) => p.word);
    w.cands = w.finParts.map((p) => ({ word: p.word, trans: ocrGloss(p.word).trans, lemma: "", part: true }));
  }
  if (!w.cands && isMinor(settings.ocrFrom)) {
    // Inarin/koltan yhdyssana: osat perusmuodossa käännöksineen; napautus avaa pohjoissaamen vastineen
    const lang = settings.ocrFrom, parts = splitMinorCompound(lang, w.word), to = ocrTo();
    w.parts = parts && parts.map((p) => p.stem);
    w.cands = (parts || []).map((p) => {
      const row = mall(lang, `SELECT * FROM ${lang}_words WHERE id = ?`, [p.id])[0] || {};
      const open = splitList(row.sme)[0] || (splitList(row.fin)[0] || "").replace(/\s*\(.*$/, "") || p.stem;
      return { word: p.stem, open, trans: minorTranslation(lang, row, to), lemma: row.lemma && row.lemma.toLowerCase() !== p.stem ? row.lemma : "", part: true };
    });
  }
  if (!w.cands) {
    w.cands = settings.ocrFrom === "sme" ? ocrRepairs(w.word, /^\p{Lu}/u.test(w.clean)) : [];
    // Yhdyssana, jota ei ole sanakirjassa: osat omille riveilleen (almmustahttin + ortnega)
    w.parts = settings.ocrFrom === "sme" ? w.fuzzyParts || splitCompound(w.word) : null;
    if (w.parts) w.cands = [...w.cands.slice(0, 1), ...w.parts.map((part) => {
      // Yhdysmuoto (geaidno): käännös ja haku perusmuodolla (geaidnu)
      const base = cmpLemma.get(part), g = ocrGloss(base || part);
      return { word: part, open: base, trans: (g.lemma ? g.form || g.trans : g.trans).split(" / ").slice(0, 2).join(" / "),
        lemma: base || g.lemma || "", part: true };
    })];
  }
  const label = w.parts ? (w.cands.length > w.parts.length ? "ocrNearestOrParts" : "ocrParts") : w.cands.length ? "ocrNearest" : "ocrUnknown";
  const cands = w.cands.map((c) => `<span class="b-row b-cand${c.part ? " b-part" : ""}" data-cand="${esc(c.open || c.word)}"><span class="b-sme">${c.part && c !== w.cands.find((x) => x.part) ? "+ " : ""}${esc(c.word)}</span>` +
    `<span class="b-tr">${esc(c.trans)}${c.lemma ? ` <span class="b-more">(${esc(c.lemma)})</span>` : ""}</span></span>`).join("");
  // Jaa osiin: lauseen näkymään sanan jakoon (sanan kirjainten väliin napauttamalla)
  const split = settings.ocrFrom === "sme" && [...w.word].length >= 6
    ? `<span class="b-row b-cand b-split" data-split="1"><span class="b-sme">✂ ${esc(t("sentSplit"))}</span><span class="b-tr">${esc(t("sentSplitShort"))}</span></span>` : "";
  bubble.innerHTML = `<span class="b-text"><span class="b-row b-form b-unknown"><span class="b-sme">${esc(w.word)}</span>` +
    `<span class="b-tr">${esc(t(label))}</span></span>${cands}${split}</span>` +
    `<span class="b-actions"><span class="b-open b-edit" role="button" aria-label="${esc(t("ocrEdit"))}">${EDIT_ICON}</span></span>`;
  bubble.setAttribute("aria-label", w.word);
  bubble.hidden = false;
  placeOcrBubble();
}

// Yhden kirjaimen korjaukset (puuttuva, väärä tai ylimääräinen kirjain) saamen sanoiksi ja muodoiksi; yleisin sana
// ensin. Korpuskoe 2026-11-17: pudotetusta kirjaimesta 69 % ainoa ehdokas ja oikea, 23 % oikea ehdokkaiden joukossa.
const OCR_ALPHABET = [..."abcdefghijklmnopqrstuvwyzáčđŋšŧžåäöâ"];
// Suomen yhdyssana, jota ei ole sanakirjassa (viranomaistiedote = viranomainen + tiedote): loppuosa on suomen sana tai
// sen taivutusmuoto, jolla on saamennos (uiRows), alkuosa Voikolla tarkistettu yhdyssanan alkumuoto (fin_cmp:
// viranomais -> viranomainen, kansan -> kansa) tai kaksi-kolme sellaista peräkkäin (tieto + suoja + seloste).
// Pisin loppuosa ensin. Palauttaa [{stem, word}] (word = perusmuoto) tai null.
function splitFinCompound(word) {
  const w = word.toLowerCase();
  if (w.length < 7 || !/^\p{L}+$/u.test(w) || !hasTable("fin_cmp")) return null;
  const subs = new Set();
  for (let i = 0; i < w.length; i++) for (let j = i + 2; j <= w.length - 3; j++) subs.add(w.slice(i, j));
  const list = [...subs], left = new Map();
  for (let i = 0; i < list.length; i += 400) {
    const part = list.slice(i, i + 400);
    for (const r of all(`SELECT stem, word FROM fin_cmp WHERE stem IN (${part.map(() => "?").join(",")})`, part)) {
      if (!left.has(r.stem)) left.set(r.stem, r.word);
    }
  }
  if (!left.size) return null;
  const leftParts = (s, depth) => {
    if (left.has(s)) return [s];
    if (depth >= 2) return null;
    for (let i = s.length - 2; i >= 2; i--) {
      if (!left.has(s.slice(i))) continue;
      const head = leftParts(s.slice(0, i), depth + 1);
      if (head) return [...head, s.slice(i)];
    }
    return null;
  };
  for (let i = 2; i <= w.length - 3; i++) {
    const head = leftParts(w.slice(0, i), 0);
    if (!head) continue;
    // Loppuosa on substantiivi tai adjektiivi (saamennos N/A): suomen yhdyssana päättyy niihin, ja verbinmuoto
    // jakaisi taivutettuja sanoja väärin (kuva + tulla, kirja + imin, tyypillis + esti; Voikko-koe 2026-11-18)
    const right = w.slice(i), rows = uiRows(right).filter((r) => r.pos === "N" || r.pos === "A");
    if (!rows.length) continue;
    return [...head.map((p) => ({ stem: p, word: left.get(p) })), { stem: right, word: rows.find((r) => r.via)?.via.base || right }];
  }
  return null;
}

// Yhdyssanan jako (almmustahttinortnega = almmustahttin + ortnega): loppuosa on tunnettu sana tai muoto, alkuosa
// substantiivin tai adjektiivin perusmuoto, substantiivin yksikön genetiivi tai adjektiivin attribuuttimuoto (tai
// itse kahdesta tällaisesta, kaksi tasoa). Osat vähintään 4 kirjainta (alkuosan osat 3). Pisin loppuosa ensin.
// Korpuskoe 2026-11-17: sanakirjasta puuttuvista yhdyssanoista 58 % oikea pääsana, selvästi väärin alle 1 %,
// suomen sanoista jaettiin 0,4 %. Näytetään vain napautuksesta, ei automaattisesti.
// Yhdysmuoto -> perusmuoto (geaidno -> geaidnu): kuplassa osan käännös ja napautus haetaan perusmuodolla
const cmpLemma = new Map();
function splitCompound(word) {
  const w = word.toLowerCase();
  if (w.length < 8 || !/^\p{L}+$/u.test(w)) return null;
  const subs = new Set();
  for (let i = 0; i < w.length; i++) for (let j = i + 3; j <= w.length; j++) subs.add(w.slice(i, j));
  const list = [...subs], known = new Set(), left = new Set();
  for (let i = 0; i < list.length; i += 300) {
    const part = list.slice(i, i + 300), marks = part.map(() => "?").join(",");
    for (const r of all(`SELECT surface AS v FROM paradigms WHERE surface IN (${marks})
                         UNION SELECT lemma_fold FROM dictionary WHERE lemma_fold IN (${marks})`, [...part, ...part])) known.add(r.v);
    for (const r of all(`SELECT lemma_fold AS v FROM dictionary WHERE pos IN ('N', 'A') AND lemma_fold IN (${marks})
        UNION SELECT p.surface FROM paradigms p JOIN dictionary d ON d.id = p.word_id JOIN tags t ON t.id = p.tag_id
        WHERE p.surface IN (${marks}) AND ((d.pos = 'N' AND t.tag = 'Sg+Gen') OR (d.pos = 'A' AND t.tag IN ('Attr', 'Sg+Gen')))`,
      [...part, ...part])) left.add(r.v);
    if (hasTable("sme_cmp")) {
      for (const r of all(`SELECT stem, lemma FROM sme_cmp WHERE stem IN (${marks})`, part)) { left.add(r.stem); cmpLemma.set(r.stem, r.lemma); }
    }
  }
  const leftParts = (s, depth) => {
    if (left.has(s)) return [s];
    if (depth >= 2) return null;
    for (let i = 3; i <= s.length - 3; i++) {
      if (!left.has(s.slice(i))) continue;
      const head = leftParts(s.slice(0, i), depth + 1);
      if (head) return [...head, s.slice(i)];
    }
    return null;
  };
  for (let i = 4; i <= w.length - 4; i++) {
    if (!known.has(w.slice(i))) continue;
    const head = leftParts(w.slice(0, i), 0);
    if (head && head.every((p) => p.length >= 3) && head[0].length >= 4) return [...head, w.slice(i)];
  }
  return null;
}

// Pienellä alkava sana kuvassa: ei nimiä ehdokkaiksi (lij -> Liv, type -> Tyge)
function ocrRepairs(word, capital = false) {
  const w = [...word].map((c) => OCR_LOOKALIKES[c] || c).join("").replace(/[[\]*?]/g, "");
  const chars = [...w];
  const pats = new Set(), exact = new Set();
  for (let i = 0; i <= chars.length; i++) pats.add([...chars.slice(0, i), "?", ...chars.slice(i)].join(""));
  for (let i = 0; i < chars.length; i++) {
    pats.add([...chars.slice(0, i), "?", ...chars.slice(i + 1)].join(""));
    exact.add([...chars.slice(0, i), ...chars.slice(i + 1)].join(""));
  }
  // Kirjaimella alkavat kuviot käyttävät hakemistoa. Ensimmäisen kirjaimen korjaus kirjaimisto läpi tarkkoina
  // sanoina (myös hakemistolla): ?-alkuinen GLOB lukisi koko taulun, OnePlus Nordilla 2,4 s.
  const rest = [...pats].filter((p) => p[0] !== "?");
  for (const p of pats) if (p[0] === "?") for (const c of OCR_ALPHABET) exact.add(c + p.slice(1));
  const found = new Map();
  const take = (rows) => { for (const r of rows) if (!found.has(r.v) || r.freq > found.get(r.v)) found.set(r.v, r.freq || 0); };
  const q = (where, params) => take(all(`SELECT p.surface AS v, MAX(d.freq) AS freq FROM paradigms p JOIN dictionary d ON d.id = p.word_id
    WHERE ${where} GROUP BY p.surface UNION SELECT d.sme_lemma, d.freq FROM dictionary d
    WHERE ${where.replace(/p\.surface/g, "d.lemma_fold")}`, [...params, ...params]));
  for (const p of rest) q("p.surface GLOB ?", [p]);
  const ex = [...exact];
  for (let i = 0; i < ex.length; i += 400) q(`p.surface IN (${ex.slice(i, i + 400).map(() => "?").join(",")})`, ex.slice(i, i + 400));
  const out = [];
  for (const [v] of [...found].sort((a, b) => b[1] - a[1])) {
    if (fold(v) === fold(w) || v.length < 2 || (!capital && /^\p{Lu}/u.test(v))) continue;
    const g = ocrGloss(v);
    if (!g.trans) continue;
    const trans = (g.lemma ? g.form || g.trans : g.trans).split(" / ").slice(0, 2).join(" / ");
    out.push({ word: v, trans, lemma: g.lemma || "" });
    if (out.length >= 3) break;
  }
  return out;
}

function placeOcrBubble() {
  const bubble = $("ocr-bubble"), stage = $("ocr-stage");
  const el = $("ocr-photo").querySelector(".picked");
  if (!el) return;
  const s = stage.getBoundingClientRect(), b = el.getBoundingClientRect();
  const x = b.left + b.width / 2 - s.left, top = b.top - s.top, bottom = b.bottom - s.top;
  // Sana vieritetty pois näkyvistä: kupla piiloon siksi aikaa
  bubble.style.visibility = bottom < 0 || top > s.height || x < 0 || x > s.width ? "hidden" : "";
  // Yläpuolelle, jos kupla mahtuu; muuten sille puolelle, jolla on enemmän tilaa. Jos kupla ei mahdu sinnekään
  // (matala kuva-alue vaakatasossa), sen rivit rajataan tilaan ja ne vierivät (.tight), ettei alaosa leikkaudu.
  bubble.classList.remove("tight");
  const need = bubble.offsetHeight + 16, roomAbove = top - 8, roomBelow = s.height - bottom - 8;
  const below = need > roomAbove && roomBelow > roomAbove;
  const room = below ? roomBelow : roomAbove;
  if (need > room) {
    const text = bubble.querySelector(".b-text");
    bubble.style.setProperty("--bmax", `${Math.max(72, text.offsetHeight - (need - room))}px`);
    bubble.classList.add("tight");
  }
  bubble.classList.toggle("below", below);
  const half = bubble.offsetWidth / 2;
  const left = Math.min(Math.max(x, half + 8), s.width - half - 8);
  bubble.style.left = `${left}px`;
  bubble.style.top = `${below ? bottom : top}px`;
  bubble.style.setProperty("--arrow", `${Math.min(Math.max(x - left + half, 16), half * 2 - 16)}px`);
}

// --- Poimi lause: kuvan lause omaan näkymäänsä (sanat siruina, käännös alla) ---
// Lause löytyy valitun sanan ympäriltä lukujärjestyksessä (. ! ? : rajaavat). Sirun napautus: merkitykset ja sanan
// muokkaus; tuntematon sana näytetään kuvasta leikattuna, ja sen voi korjata (lähimmät sanat, yhdyssanan osat).
// Käännös kootaan sana sanalta: taivutettu sana muotonsa käännöksenä (bálválusain -> palveluissa), nimet sellaisinaan.
// Suuntaa antava; käyttäjän valinnat säilyvät kuvan ajan (ocr.sentChoice).
let sent = null;  // { toks: [{ t, clean, cx, cy, w, h, punct, word, unknown, name, opts, choice }], sheet: index }
function ocrSentenceAround(rIndex) {
  const ws = ocr.r.words, end = (t) => /[.!?:]["”»)]*$/.test(t || "");
  // Raja myös otsikon ja leipätekstin välillä (ei pistettä): rivien väli yli 1,65 kertaa korkeamman rivin korkeus
  // (Yle-otsikossa riviväli 1,3-1,45 x, otsikosta ingressiin 1,8 x; tekstin korkeus vaihtelee rivin kirjaimien mukaan)
  const brk = (x, y) => Math.abs((y.cy || 0) - (x.cy || 0)) > Math.max(x.h || 10, y.h || 10, 1) * 1.65;
  let a = rIndex, b = rIndex;
  while (a > 0 && !end(ws[a - 1].t) && !brk(ws[a - 1], ws[a]) && rIndex - a < 40) a--;
  while (b < ws.length - 1 && !end(ws[b].t) && !brk(ws[b], ws[b + 1]) && b - rIndex < 40) b++;
  return ws.slice(a, b + 1);
}
function sentTokens(raw) {
  const rows = raw.filter((r) => /\p{L}|\d/u.test(r.clean || r.t));
  return rows.map((r, n) => {
    const w = ocr.words.find((x) => x.cx === r.cx && x.cy === r.cy);
    const prev = n > 0 ? (rows[n - 1].clean || "").toLowerCase() : "";
    const pw = n > 0 ? ocr.words.find((x) => x.cx === rows[n - 1].cx && x.cy === rows[n - 1].cy) : null;
    const prevLemma = pw?.gloss?.lemma || pw?.word || prev;
    const punct = (r.t.match(/[.,!?:;)"”»]+$/) || [""])[0];
    const tok = { t: r.t, clean: r.clean, cx: r.cx, cy: r.cy, w: r.w, h: r.h, a: r.a, punct, word: w ? w.word : (r.clean || r.t).toLowerCase() };
    const cap = /^\p{Lu}/u.test(r.clean || "");
    // Yhdysmerkillä nimeen liitetty saamen sana (Microsoft-bálválusain): nimi sellaisenaan, loppuosa käännettynä
    const hy = (r.clean || "").match(/^(.+)-([\p{L}]+)$/u);
    const hyGloss = hy && settings.ocrFrom !== "ui" ? ocrGloss(hy[2].toLowerCase(), hy[2]) : null;
    if (hyGloss?.trans) {
      tok.opts = [...new Set([...(hyGloss.form ? hyGloss.form.split(" / ") : []), ...splitList(hyGloss.trans).map((x) => x.replace(/\s*\([^)]*\)/g, "").trim())])]
        .filter(Boolean).map((x) => `${hy[1]}-${x}`);
      tok.lemma = hyGloss.lemma || "";
    } else if (!w) {
      // Ei sanakirjassa eikä merkitty: nimi tai vieras sana (Microsoft, Toppari) sellaisenaan, luku sellaisenaan.
      // Nimeen yhdysmerkillä liitetty tuntematon saamen sana (Microsoft-bálválusain) korjattavaksi.
      // Lauseen alussa iso alkukirjain ei kerro nimestä (Prográmmafitnodat): tuntematon, korjattavissa
      tok.name = (cap && !hy && n > 0) || /^\d/.test(r.t);
      tok.unknown = !tok.name;
    } else if (w.unknown) tok.unknown = true;
    else {
      const g = w.gloss || (w.gloss = ocrGloss(w.word, w.clean));
      if (g.prop || cap && n > 0 && !g.trans) tok.name = true;
      else if (!g.trans) tok.unknown = true;
      const strip = (x) => x.replace(/\s*\([^)]*\)/g, "").trim();
      const opts = [...(g.form ? g.form.split(" / ") : []), ...splitList(g.trans).map(strip), ...(g.alt ? [g.alt.text] : [])]
        .map((x) => x.trim()).filter(Boolean);
      const verb = settings.ocrFrom === "sme" && settings.lang === ocrTo() ? sentVerbForms(g, w.word, prev, prevLemma) : null;
      tok.opts = verb ? [...new Set([...verb, ...opts.filter((o) => !g.form || !g.form.split(" / ").includes(o))])] : sentNegOrder([...new Set(opts)], prev);
      tok.lemma = g.lemma || "";
      // Iso alkukirjain keskellä lausetta (Siiddas = Siida-museo, ei "kotona"): oletuksena sana sellaisenaan, käännös valittavissa
      if (cap && n > 0 && !tok.name) tok.opts = [r.clean, ...tok.opts];
    }
    // Tuntematon yhdyssana (prográmma + fitnodat): osien käännökset ehdotukseksi
    if (tok.unknown && settings.ocrFrom === "sme" && !hy) {
      const lw = w?.fuzzyParts ? w.word : (r.clean || "").toLowerCase(), parts = w?.fuzzyParts || (lw.length >= 6 ? splitCompound(lw) : null);
      if (!parts && n === 0 && /^\p{Lu}/u.test(r.clean || "")) { tok.unknown = false; tok.name = true; }  // Microsoft lauseen alussa: nimenä, napautettavissa
      if (parts) { tok.unknown = false; tok.opts = [parts.map((x, k) => { const g = ocrGloss(cmpLemma.get(x) || x); return ((k === parts.length - 1 && g.form ? g.form.split(" / ").pop() : g.trans) || x).split(", ")[0].replace(/\s*\([^)]*\)/g, "").trim(); }).join("")]; tok.lemma = parts.join(" + "); }
    }
    const key = `${r.cx},${r.cy}`;
    if (ocr.sentChoice?.[key]) Object.assign(tok, ocr.sentChoice[key]);
    return tok;
  });
}
// Kieltoverbin jälkeinen muoto (ii álgán = ei alkanut): "(ei) …" vain, kun edellinen sana on kieltoverbi; muuten
// sama muoto on partisiippi (leat álgán = ovat alkaneet), joten "(ei)"-vaihtoehdot pois tai viimeisiksi
const SME_NEG = new Set(["in", "it", "ii", "ean", "eahppi", "eaba", "eat", "ehpet", "eai", "ale", "allet", "alli", "allo", "allos", "allot"]);
function sentNegOrder(opts, prev) {
  const neg = opts.filter((o) => /^\(ei\)\s/.test(o)), other = opts.filter((o) => !/^\(ei\)\s/.test(o));
  if (!neg.length) return opts;
  if (settings.ocrFrom === "sme" && SME_NEG.has(prev)) return [...neg.map((o) => o.replace(/^\(ei\)\s+/, "")), ...other];
  return other.length ? other : opts;
}
// Verbin muoto lauseyhteyden mukaan (leat = olet / olemme / ovat / ei ole / olla): kieltoverbin jälkeen kieltomuoto
// (ii leat = ei ole), persoonapronominin jälkeen sen persoona (mii leat = olemme), apuverbin jälkeen infinitiivi
// (sáhttá leat = voi olla), muuten ensin 3. persoona, infinitiivi ja partisiippi (leat álgán = alkanut)
const SME_PRON = { mun: "Sg1", don: "Sg2", son: "Sg3", moai: "Du1", doai: "Du2", soai: "Du3", mii: "Pl1", dii: "Pl2", sii: "Pl3" };
const SME_MODAL = new Set(["sáhttit", "galgat", "áigut", "berret", "fertet", "háliidit", "oažžut", "máhttit", "viggat", "dárbbašit", "lohpidit"]);
function sentVerbForms(g, word, prev, prevLemma) {
  if (!g.id || !FORM_PHRASES[settings.lang]) return null;
  const data = loadWord(g.id);
  if (data.word.pos !== "V") return null;
  const stem = fold(word);
  const tags = [...new Set([...data.paradigm].filter(([, forms]) => forms.some((f) => fold(f) === stem)).map(([tag]) => tag))]
    .filter((tag) => !/Du\d/.test(tag) || /^(moai|doai|soai)$/.test(prev));
  if (!tags.length) return null;
  const own = data.meanings.find((m) => m.lang === settings.lang && m.translations);
  const base = (own ? splitList(own.translations) : splitList(data.word[LANGUAGES[settings.lang].col]))[0];
  if (!base) return null;
  const neg = SME_NEG.has(prev), person = SME_PRON[prev], modal = SME_MODAL.has(prevLemma);
  const score = (tag) => {
    if (/ConNeg/.test(tag)) return neg ? 0 : 9;
    if (neg) return 5;
    if (person) return tag.endsWith(person) ? 0 : /(Sg|Pl|Du)\d$/.test(tag) ? 6 : 4;
    if (modal) return tag === "Inf" ? 0 : 5;
    if (/^Imprt|Pot/.test(tag)) return 7;
    return /(Sg3|Pl3)$/.test(tag) ? 1 : /^(Inf|PrfPrc)/.test(tag) ? 2 : /(Sg1|Sg2|Pl1|Pl2)$/.test(tag) ? 3 : 4;
  };
  const ranked = tags.map((tag) => [score(tag), tag]).filter(([sc]) => sc < 9).sort((a, b) => a[0] - b[0]);
  const out = ranked.map(([, tag]) => translationOfForm(data.word, [tag], null, [base]).split(" / ")[0].trim())
    .map((x) => (neg ? x.replace(/^\(ei\)\s+/, "") : x)).filter(Boolean);
  return out.length ? [...new Set(out)] : null;
}
// Jokerihaku sanan korjauskenttään (*oahkkinb*lvalusa, sámi?): enintään viisi yleisintä sanaa ja niiden täsmäävä muoto.
// Paloissa kuten wildcardSearch, ettei näkymä jäädy; uusi kirjoitus keskeyttää vanhan haun (stale).
async function quickWildcard(query, limit, stale) {
  const pat = fold(query.trim()).replace(/[[\]]/g, "");
  if (!/[^*?]/.test(pat.replace(/[*?]/g, "")) || pat.replace(/[*?]/g, "").length < 3) return [];
  if (!wildFreq) {
    wildFreq = new Map();
    const st = db.prepare("SELECT id, freq FROM dictionary");
    while (st.step()) { const [id, f] = st.get(); wildFreq.set(id, f); }
    st.free();
  }
  const hits = new Map(), max = all("SELECT MAX(id) AS m FROM dictionary")[0].m;
  const st = db.prepare("SELECT word_id, MIN(surface) FROM paradigms WHERE word_id >= ? AND word_id < ? AND surface GLOB ? GROUP BY word_id");
  const lt = db.prepare("SELECT id, sme_lemma FROM dictionary WHERE id >= ? AND id < ? AND lemma_fold GLOB ?");
  try {
    let slice = performance.now();
    for (let lo = 0; lo <= max; lo += WILD_CHUNK) {
      for (const q of [st, lt]) {
        q.bind([lo, lo + WILD_CHUNK, pat]);
        while (q.step()) { const [id, v] = q.get(); if (q === lt || !hits.has(id)) hits.set(id, v); }
        q.reset();
      }
      if (performance.now() - slice > 60) {
        await new Promise((r) => setTimeout(r, 0));
        if (stale()) return null;
        slice = performance.now();
      }
    }
  } finally { st.free(); lt.free(); }
  const f = (id) => wildFreq.get(id) ?? -Infinity;
  return [...hits.keys()].sort((a, b) => f(b) - f(a) || a - b).slice(0, limit).map((id) => hits.get(id));
}
let sentWildRun = 0;
// Yhdyssanan osat käännöksineen (käsin jaettu tai haettu): alkuosat perusmuodon käännöksellä, viimeinen muodon
// mukaan (čoahkkin + bálvalusa = kokous + palvelun -> kokouspalvelun). Osa, jota ei löydy sellaisenaan, haetaan
// sumealla haulla (coahkkin -> čoahkkin).
function compoundPartsInfo(parts) {
  let fz = null;
  const cmpOf = (p) => cmpLemma.get(p) || (hasTable("sme_cmp") ? all("SELECT lemma FROM sme_cmp WHERE stem = ?", [p])[0]?.lemma : null);
  const out = parts.map((raw, k) => {
    let p = raw.toLowerCase(), base = cmpOf(p), g = ocrGloss(base || p);
    if (!g.trans && p.length >= 3) {
      fz ||= ocrFuzzySearch();
      const f = fz.search(p, 3, 3);
      if (f && !f.parts) { p = f.word; base = cmpOf(p); g = ocrGloss(base || p); }
    }
    const last = k === parts.length - 1;
    const trans = ((last && g.form ? g.form.split(" / ").pop() : g.trans) || "").split(", ")[0].replace(/\s*\([^)]*\)/g, "").trim();
    return { word: p, trans, base: base || g.lemma || "" };
  });
  fz?.free();
  const trans = out.every((x) => x.trans) ? out.map((x) => x.trans).join("") : out.map((x) => x.trans || `[${x.word}]`).join(" + ");
  return { parts: out, word: out.map((x) => x.word).join(""), trans };
}
// Käsin jako: oletusjako haun mukaan, jos osien pituudet täsmäävät tekstiin
function sentDefaultCuts(text) {
  const w = text.toLowerCase(), cuts = new Set();
  if (settings.ocrFrom !== "sme" || w.length < 6) return cuts;
  const fz = ocrFuzzySearch(), f = fz.search(w);
  fz.free();
  const parts = f?.parts || splitCompound(w);
  if (parts && parts.join("").length === [...w].length) {
    let pos = 0;
    for (const p of parts.slice(0, -1)) { pos += [...p].length; cuts.add(pos); }
  }
  return cuts;
}
function sentSplitParts() {
  const letters = [...sent.split.text], parts = [];
  let from = 0;
  for (const c of [...sent.split.cuts].sort((a, b) => a - b)) { parts.push(letters.slice(from, c).join("")); from = c; }
  parts.push(letters.slice(from).join(""));
  return parts.filter(Boolean);
}
function renderSentSplit() {
  const box = $("sent-split");
  if (!box || !sent?.split) return;
  const letters = [...sent.split.text];
  const parts = sentSplitParts(), info = parts.length > 1 ? compoundPartsInfo(parts) : null;
  sent.split.info = info;
  box.innerHTML = `<p class="sent-lab">${esc(t("sentSplitHint"))}</p><div class="sent-split-w">` +
    letters.map((c, i) => `<span class="sl">${esc(c)}</span>` + (i < letters.length - 1
      ? `<button type="button" class="sg${sent.split.cuts.has(i + 1) ? " cut" : ""}" data-cut="${i + 1}" aria-label="${esc(t("sentSplit"))} ${i + 1}"></button>` : "")).join("") +
    `</div>` + (info ? `<div class="sent-split-res">${info.parts.map((x) => `<span><b>${esc(x.word)}</b> ${esc(x.trans || "?")}</span>`).join(" + ")}` +
      `<div class="sent-split-tr">→ ${esc(info.trans)}</div></div>` : "");
}
const sentKey = (tok) => `${tok.cx},${tok.cy}`;
function sentWordText(tok) {
  if (tok.fixed) return tok.fixed.trans || (tok.fixed.keep ? tok.fixed.word : `[${tok.fixed.word}]`);
  if (tok.name) return tok.clean || tok.t;
  if (tok.unknown) return `[${tok.clean || tok.t}]`;
  return tok.opts?.[tok.choice || 0] || tok.clean;
}
function sentTranslation() {
  let text = sent.toks.map((tok) => sentWordText(tok) + tok.punct).join(" ").replace(/\s+([.,!?:;])/g, "$1");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
// Tuntemattoman sanan kuva: leikataan kuvasta sanan laatikon kohdalta (canvas)
function sentCutout(tok, scale = 1) {
  const img = $("ocr-photo").querySelector("img");
  if (!img || !img.naturalWidth || !tok.w) return "";
  const k = img.naturalWidth / ocr.r.width, pad = (tok.h || 20) * 0.25;
  const sx = Math.max(0, (tok.cx - tok.w / 2 - pad) * k), sy = Math.max(0, (tok.cy - tok.h / 2 - pad) * k);
  const sw = Math.min(img.naturalWidth - sx, (tok.w + pad * 2) * k), sh = Math.min(img.naturalHeight - sy, (tok.h + pad * 2) * k);
  const c = document.createElement("canvas"), hh = Math.round(28 * scale);
  c.height = hh; c.width = Math.max(1, Math.round(sw * hh / sh));
  try { c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height); return c.toDataURL("image/png"); } catch (e) { return ""; }
}
function openSentView(rIndex) {
  ocr.sentChoice ||= {};
  sent = { toks: sentTokens(ocrSentenceAround(rIndex)), sheet: null };
  renderSentView();
  $("sent-view").hidden = false;
}
function closeSentView() {
  if (!sent || $("sent-view").hidden) return false;
  if (sent.solo != null) {
    const idx = sent.solo, tok = sent.toks[0], done = sent.soloDone;
    $("sent-view").hidden = true;
    $("sent-view").classList.remove("solo");
    sent = null;
    if (done) applyOcrFix(idx, tok);
    if (ocr?.words?.[idx]) { const w = ocr.words[idx]; w.cands = null; pickOcrWord(idx); }
    return true;
  }
  if (sent.sheet != null) { sent.sheet = null; sent.split = null; renderSentView(); return true; }
  $("sent-view").hidden = true;
  sent = null;
  return true;
}
function renderSentView() {
  const chip = (tok, i) => {
    const cls = tok.fixed ? "" : tok.unknown ? " unk" : tok.name ? " name" : "";
    const src = tok.unknown && !tok.fixed ? sentCutout(tok) : "";
    const top = src ? `<img src="${src}" alt="${esc(tok.clean || tok.t)}">` : esc(tok.fixed ? tok.fixed.word : tok.clean || tok.t);
    const sub = tok.fixed ? tok.fixed.trans || "" : tok.unknown ? t("sentUnknown") : tok.name ? t("sentName") : sentWordText(tok) + (tok.opts?.length > 1 ? "…" : "");
    return `<button class="sent-chip${cls}${sent.sheet === i ? " on" : ""}" data-i="${i}"><b>${top}</b><span>${esc(sub)}</span></button>`;
  };
  const from = ocrLangName(settings.ocrFrom), to = ocrLangName(ocrTo());
  $("sent-body").innerHTML = `<p class="sent-lab">${esc(t("sentWords"))}</p><div class="sent-chips">${sent.toks.map(chip).join("")}</div>` +
    `<div class="sent-tr"><div class="sent-tr-head"><span>${esc(from)} → ${esc(to)}</span>` +
    `<button class="link-btn" id="sent-copy">${esc(t("sentCopy"))}</button></div><p id="sent-text">${esc(sentTranslation())}</p>` +
    `<small>${esc(t("sentGist"))}</small></div>`;
  const sheet = $("sent-sheet");
  if (sent.sheet == null) { sheet.hidden = true; return; }
  const tok = sent.toks[sent.sheet];
  if (tok.unknown || tok.name || tok.fixed?.edited) {
    const src = sentCutout(tok, 1.8), guess = sent.split?.text || tok.fixed?.word || (tok.name ? tok.clean || tok.t : (tok.clean || tok.t).toLowerCase());
    const canSplit = settings.ocrFrom === "sme";
    sheet.innerHTML = `<div class="sent-sh-head">${src ? `<img class="sent-cut" src="${src}" alt="${esc(t("sentInPhoto"))}">` : "<span></span>"}` +
      `<button class="chip-btn" data-act="cancel">${esc(t("cancel"))}</button><button class="chip-btn primary" data-act="done">${esc(t("sentDone"))}</button></div>` +
      `<div class="sent-in-row"><input id="sent-input" type="text" autocapitalize="none" spellcheck="false" aria-label="${esc(t("sentWhat"))}" placeholder="${esc(t("sentWhat"))}" value="${esc(guess)}">` +
      (canSplit ? `<button type="button" class="chip-btn sent-split-btn${sent.split ? " on" : ""}" data-act="split" aria-pressed="${!!sent.split}">${esc(t("sentSplit"))}</button>` : "") + `</div>` +
      (sent.split ? `<div id="sent-split" class="sent-split"></div>` : `<div id="sent-sugs" class="sent-opts"></div>`);
    if (sent.split) renderSentSplit();
    else renderSentSugs(guess);
  } else {
    sheet.innerHTML = `<div class="sent-sh-head"><p class="sent-lab">${esc(tok.clean || tok.t)}${tok.lemma ? ` <span class="muted">(${esc(tok.lemma)})</span>` : ""}</p>` +
      `<button class="chip-btn" data-act="edit">${esc(t("sentEditWord"))}</button><button class="chip-btn" data-act="open">${esc(t("sentOpen"))}</button></div>` +
      `<div class="sent-opts">${(tok.opts || []).map((o, k) => `<button class="sent-opt${k === (tok.choice || 0) ? " sel" : ""}" data-opt="${k}">${esc(o)}</button>`).join("")}</div>`;
  }
  sheet.hidden = false;
}
// Ehdotukset korjattavalle sanalle: tarkka osuma, lähimmät sanat (yksi kirjain eri), yhdyssanan osat, sellaisenaan
function renderSentSugs(text) {
  const lang = settings.ocrFrom, raw = (text || "").trim(), out = [];
  const sugs = $("sent-sugs");
  const show = (list) => {
    sugs.innerHTML = list.map((o, k) => `<button class="sent-opt${k === 0 ? " sel" : ""}" data-sug="${k}">` +
      `<span>${esc(o.keep ? t("sentKeep") : o.parts || o.word)}</span>${o.trans ? `<i>${esc(o.trans)}</i>` : ""}</button>`).join("");
    sugs.sugs = list;
  };
  const run = ++sentWildRun;
  // Jokerit (*oahkkinb*lvalusa): yleisimmät osumat taustalla, kirjoitus keskeyttää
  if (lang === "sme" && /[*?]/.test(raw)) {
    sugs.innerHTML = `<p class="sent-lab">${esc(t("wildSearching"))}</p>`;
    sugs.sugs = [];
    quickWildcard(raw, 5, () => run !== sentWildRun || !sent).then((hits) => {
      if (hits == null || run !== sentWildRun || !$("sent-sugs")) return;
      const list = hits.map((h) => { const g = ocrGloss(h); return { word: h, trans: ((g.lemma ? g.form || g.trans : g.trans) || "").split(" / ")[0].split(", ")[0] }; });
      show(list.length ? list : [{ word: raw, trans: "", keep: true }]);
    });
    return;
  }
  // Käsin jaettu: čoahkkin+bálvalusa tai čoahkkin-bálvalusa (pienellä alkava; Microsoft-bálvalusain on nimi + sana)
  const manual = lang === "sme" && (/\S\s*\+\s*\S/.test(raw) || /^\p{Ll}[^-]*\p{L}-\p{Ll}[^-]*$/u.test(raw));
  if (manual) {
    const info = compoundPartsInfo(raw.split(/[+-]/).map((x) => x.trim()).filter(Boolean));
    out.push({ word: info.word, parts: info.parts.map((x) => x.word).join(" + "), trans: info.trans });
    out.push({ word: raw.replace(/\s*\+\s*/g, ""), trans: "", keep: true });
    show(out);
    return;
  }
  // Yhdysmerkillä nimeen liitetty sana (Microsoft-bálvalusain): haetaan loppuosa, alkuosa sellaisenaan
  const hy = raw.match(/^(.+-)([^-]+)$/u), pre = hy ? hy[1] : "", w = (hy ? hy[2] : raw).toLowerCase();
  if (w) {
    const g = lang === "ui" ? null : ocrGloss(w);
    if (g?.trans) out.push({ word: w, trans: (g.lemma ? g.form || g.trans : g.trans).split(" / ")[0].split(", ")[0] });
    if (lang === "sme") {
      for (const c of ocrRepairs(w, false)) if (!out.some((o) => o.word === c.word)) out.push({ word: c.word, trans: c.trans.split(" / ")[0] });
      const parts = splitCompound(w);
      if (parts) out.push({ word: w, trans: parts.map((x) => (ocrGloss(cmpLemma.get(x) || x).trans || x).split(", ")[0]).join(" + "), parts: parts.join(" + ") });
      // Sumea haku (sleađgapoasttat -> šleađgapoasttat, coahkkinbalvalusa -> čoahkkin + bálvalusa)
      const fz = ocrFuzzySearch(), f = fz.search(w);
      fz.free();
      if (f && !out.some((o) => o.word === f.word)) {
        const fg = f.parts ? null : ocrGloss(f.word);
        out.splice(out.length ? 1 : 0, 0, f.parts
          ? { word: f.word, parts: f.parts.join(" + "), trans: f.parts.map((x) => (ocrGloss(cmpLemma.get(x) || x).trans || x).split(", ")[0]).join(" + ") }
          : { word: f.word, trans: ((fg.lemma ? fg.form || fg.trans : fg.trans) || "").split(" / ")[0].split(", ")[0] });
      }
    } else if (isMinor(lang)) {
      const parts = splitMinorCompound(lang, w);
      if (parts) out.push({ word: w, parts: parts.map((p) => p.stem).join(" + "),
        trans: parts.map((p) => splitList(minorTranslation(lang, mall(lang, `SELECT * FROM ${lang}_words WHERE id = ?`, [p.id])[0] || {}, ocrTo()))[0] || p.stem).join(" + ") });
    }
  }
  if (pre) for (const o of out) { o.word = pre + o.word; if (o.trans) o.trans = pre + o.trans; if (o.parts) o.parts = pre + o.parts; }
  out.push({ word: raw, trans: "", keep: true });
  $("sent-sugs").innerHTML = out.slice(0, 5).map((o, k) => `<button class="sent-opt${k === 0 ? " sel" : ""}" data-sug="${k}">` +
    `<span>${esc(o.keep ? t("sentKeep") : o.parts || o.word)}</span>${o.trans ? `<i>${esc(o.trans)}</i>` : ""}</button>`).join("");
  $("sent-sugs").sugs = out;
}
function bindSentView() {
  $("sent-back").onclick = () => { if (sent) { sent.sheet = null; } closeSentView(); };
  $("sent-body").onclick = (e) => {
    if (e.target.closest("#sent-copy")) { copyText($("sent-text").textContent); toast(t("sentCopied"), 1500); return; }
    const c = e.target.closest("[data-i]");
    if (!c) return;
    const i = +c.dataset.i, tok = sent.toks[i];
    sent.sheet = sent.sheet === i ? null : i;
    sent.split = null;
    renderSentView();
  };
  $("sent-sheet").oninput = (e) => {
    if (e.target.id !== "sent-input") return;
    if (sent?.split) { sent.split.text = e.target.value.trim(); sent.split.cuts = sentDefaultCuts(sent.split.text); renderSentSplit(); }
    else renderSentSugs(e.target.value);
  };
  $("sent-sheet").onclick = (e) => {
    if (!sent || sent.sheet == null) return;
    const tok = sent.toks[sent.sheet], key = sentKey(tok);
    const save = (patch) => { Object.assign(tok, patch); ocr.sentChoice[key] = { ...(ocr.sentChoice[key] || {}), ...patch }; };
    const opt = e.target.closest("[data-opt]"), sug = e.target.closest("[data-sug]"), act = e.target.closest("[data-act]")?.dataset.act;
    const cut = e.target.closest("[data-cut]");
    if (cut && sent.split) { const c = +cut.dataset.cut; sent.split.cuts.has(c) ? sent.split.cuts.delete(c) : sent.split.cuts.add(c); renderSentSplit(); return; }
    if (act === "split") {
      const text = ($("sent-input").value || "").trim();
      sent.split = sent.split ? null : { text, cuts: sentDefaultCuts(text) };
      renderSentView(); return;
    }
    if (opt) { save({ choice: +opt.dataset.opt }); sent.sheet = null; renderSentView(); return; }
    if (sug) { $("sent-sugs").querySelectorAll(".sent-opt").forEach((b) => b.classList.toggle("sel", b === sug)); return; }
    if (act === "cancel") { if (sent.solo != null) { closeSentView(); return; } sent.sheet = null; sent.split = null; renderSentView(); return; }
    if (act === "edit") { save({ fixed: { word: tok.clean || tok.t, trans: sentWordText(tok), edited: true } }); renderSentView(); return; }
    if (act === "open") { const q = tok.lemma || tok.word; closeSentView(); closeSentView(); $("ocr-view").hidden = true; search(q); ocrReturnHash = location.hash; return; }
    if (act === "done" && sent.split) {
      const info = sent.split.info, text = sent.split.text;
      if (info) save({ fixed: { word: info.word, trans: info.trans, edited: true }, lemma: info.parts.map((x) => x.word).join(" + "), unknown: false, name: false });
      else if (text) save({ fixed: { word: text, trans: "", edited: true, keep: true }, unknown: false, name: false });
      if (sent.solo != null) { sent.soloDone = true; closeSentView(); return; }
      sent.split = null; sent.sheet = null; renderSentView(); return;
    }
    if (act === "done") {
      const list = $("sent-sugs").sugs || [], k = [...$("sent-sugs").querySelectorAll(".sent-opt")].findIndex((b) => b.classList.contains("sel"));
      const pick = list[Math.max(0, k)] || { word: $("sent-input").value };
      const word = pick.keep ? $("sent-input").value.trim() : pick.word;
      // Sellaisenaan: kuvan kirjoitusasu (isot kirjaimet säilyvät), ei hakasulkeita
      const kept = pick.keep && word.toLowerCase() === (tok.clean || tok.t).toLowerCase() ? tok.clean || tok.t : word;
      save({ fixed: { word: kept, trans: pick.keep ? "" : pick.trans, edited: true, keep: !!pick.keep }, unknown: false, name: false, ...(pick.parts ? { lemma: pick.parts } : {}) });
      if (sent.solo != null) { sent.soloDone = true; closeSentView(); return; }
      sent.sheet = null; renderSentView();
    }
  };
}
// Kuvan tuntemattoman sanan korjaus suoraan kuvanäkymässä (ilman lausenäkymää): sama korjauspaneeli kuin Poimi lause
// -näkymässä (kenttä, ehdotukset, jokerit, + -jako, Jaa osiin), kuvan päällä alhaalla. Valmis merkitsee sanan kuvaan
// korjattuna ja käännettynä; korjaus näkyy myös lausenäkymässä (ocr.sentChoice).
function openOcrFix(split = false) {
  const idx = ocr?.picked, w = ocr?.words?.[idx];
  if (!w) return;
  ocr.sentChoice ||= {};
  const raw = ocr.r.words.find((r) => r.cx === w.cx && r.cy === w.cy) || w;
  const tok = sentTokens([raw])[0];
  const text = (w.word || tok.clean || tok.t).toLowerCase();
  if (!tok.unknown && !tok.fixed?.edited) tok.fixed = { word: text, trans: sentWordText(tok), edited: true };
  sent = { toks: [tok], sheet: 0, solo: idx, split: split ? { text, cuts: sentDefaultCuts(text) } : null };
  $("ocr-bubble").hidden = true;
  $("sent-view").classList.add("solo");
  $("sent-view").hidden = false;
  renderSentView();
}
// Korjaus kuvan sanaan: tunnettu sana käännöksineen (kupla), merkintä ei enää katkoviivalla
function applyOcrFix(idx, tok) {
  const w = ocr?.words?.[idx], f = tok.fixed;
  if (!w || !f) return;
  if (f.keep || !f.trans) { w.word = f.word.toLowerCase(); w.cands = null; w.parts = null; w.fuzzyParts = null; return; }
  Object.assign(w, { word: f.word.toLowerCase(), unknown: false, gloss: { lemma: tok.lemma || "", form: "", trans: f.trans, say: f.word, query: (tok.lemma || f.word).split(" + ").pop() } });
  $("ocr-photo").querySelector(`.ocr-word[data-i="${idx}"]`)?.classList.remove("unknown");
}
// Poimi lause -painike: valitun sanan lause; ilman valintaa seuraava napautettu sana valitsee lauseen
function pickSentence() {
  if (!ocr?.words?.length) return;
  if (ocr.picked == null) { ocr.pickMode = true; $("ocr-status").textContent = t("sentTapWord"); return; }
  const w = ocr.words[ocr.picked], i = ocr.r.words.findIndex((r) => r.cx === w.cx && r.cy === w.cy);
  pickOcrWord(null);
  openSentView(Math.max(0, i));
}

// Kuplasta sanakirjaan; takaisin-ele palaa kuvaan (backToOcr). Napautuksen perään selain lähettää vielä
// click-tapahtuman samaan kohtaan, joka on nyt sanakortilla (esim. sátni.org-linkki): se ohitetaan.
let suppressClickUntil = 0;
document.addEventListener("click", (e) => {
  if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); }
}, true);
function openOcrWord(cand = null) {
  const w = ocr.words[ocr.picked];
  suppressClickUntil = Date.now() + 700;
  $("ocr-view").hidden = true;
  // Tuntematon sana: valittu ehdokas, tai sana hakukenttään muokattavaksi (jokerihaku, ks. noHitsHint)
  if (w.unknown) {
    search(cand || w.word);
    ocrReturnHash = location.hash;
    if (!cand) setTimeout(() => $("search").focus(), 0);
    return;
  }
  // Sama sana kuin kuplassa (Máhte avaa nimen, ei verbiä máhttit)
  const q = w.gloss?.query || w.word;
  const index = w.gloss?.id ? queryDatabase(q).findIndex((r) => r.id === w.gloss.id) : 0;
  search(q, Math.max(index, 0));
  ocrReturnHash = location.hash;
}

// Zoomaus 1–8-kertaiseksi; kuva pysyy alueen sisällä (pienempi kuin alue -> keskelle)
function applyOcrView() {
  const stage = $("ocr-stage"), v = ocr.view;
  v.s = Math.min(8, Math.max(1, v.s));
  const clamp = (pos, size, room) => (size <= room ? (room - size) / 2 : Math.min(0, Math.max(room - size, pos)));
  v.x = clamp(v.x, ocr.base.w * v.s, stage.clientWidth);
  v.y = clamp(v.y, ocr.base.h * v.s, stage.clientHeight);
  $("ocr-photo").style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
  if (ocr.picked != null) placeOcrBubble();
}

// Kosketus: yksi sormi siirtää, kaksi zoomaa sormien välistä kohtaa. Napautus sanaan avaa kuplan, kuplan
// (tai saman sanan) napautus sanakirjan, napautus muualle sulkee kuplan; kaksoisnapautus zoomaa (tai palauttaa
// koko kuvan).
function bindOcrGestures() {
  const stage = $("ocr-stage");
  const pointers = new Map();
  let tap = null, lastTap = 0, prev = null, pressed = null, scrollBox = null;
  // Painettava kuplan painike: kuuntele, tai sanakirjalinkki kun painetaan muuta kuplan kohtaa
  // Korostus pysyy hetken irrottamisen jälkeen, jotta nopeakin napautus näkyy
  const press = (el) => {
    const old = pressed;
    if (old && old !== el) setTimeout(() => old.classList.remove("pressed"), 180);
    pressed = el;
    el?.classList.add("pressed");
  };
  const local = (e) => { const b = stage.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const pinch = () => {
    const [a, b] = [...pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
  };
  const zoomAt = (x, y, s) => {
    const v = ocr.view;
    v.x = x - (x - v.x) * (s / v.s);
    v.y = y - (y - v.y) * (s / v.s);
    v.s = s;
  };
  stage.addEventListener("pointerdown", (e) => {
    $("ocr-style").hidden = true;
    if (!ocr) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, local(e));
    tap = pointers.size === 1 ? { ...local(e), cx: e.clientX, cy: e.clientY, time: Date.now() } : null;
    prev = pointers.size === 2 ? pinch() : null;
    const box = e.target.closest?.("#ocr-bubble.tight .b-text");
    scrollBox = pointers.size === 1 && box && box.scrollHeight > box.clientHeight ? box : null;
    press(tap ? e.target.closest(".b-speak") || (e.target.closest("#ocr-bubble") && $("ocr-bubble").querySelector(".b-open")) : null);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!ocr || !pointers.has(e.pointerId)) return;
    const p = local(e), old = pointers.get(e.pointerId);
    pointers.set(e.pointerId, p);
    if (tap && Math.hypot(p.x - tap.x, p.y - tap.y) > 10) { tap = null; press(null); }
    if (pointers.size === 1 && scrollBox) {
      scrollBox.scrollTop -= p.y - old.y;  // kuplan rivit vierivät, kuva pysyy paikallaan
      return;
    }
    if (pointers.size === 1) {
      ocr.view.x += p.x - old.x;
      ocr.view.y += p.y - old.y;
    } else if (pointers.size === 2) {
      const now = pinch();
      if (prev && prev.d > 0) {
        zoomAt(now.x, now.y, Math.min(8, Math.max(1, ocr.view.s * now.d / prev.d)));
        ocr.view.x += now.x - prev.x;
        ocr.view.y += now.y - prev.y;
      }
      prev = now;
    }
    applyOcrView();
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (!pointers.size) scrollBox = null;
    prev = pointers.size === 2 ? pinch() : null;
    press(null);
    if (!tap || e.type !== "pointerup" || Date.now() - tap.time > 500) { tap = null; return; }
    const target = document.elementFromPoint(tap.cx, tap.cy);
    const word = target?.closest(".ocr-word");
    const speaker = target?.closest(".b-speak");
    if (speaker) {
      if (!speaker.classList.contains("loading")) speak(ocr.words[ocr.picked].gloss.say, speaker);
    } else if (target?.closest("#ocr-bubble [data-split]")) openOcrFix(true);
    else if (ocr.words[ocr.picked]?.unknown && settings.ocrFrom === "sme" && target?.closest("#ocr-bubble .b-edit")) openOcrFix(false);
    else if (target?.closest("#ocr-bubble")) openOcrWord(target.closest("[data-cand]")?.dataset.cand || null);
    else if (word) {
      if (Number(word.dataset.i) === ocr.picked) openOcrWord();
      else pickOcrWord(Number(word.dataset.i));
    } else if (ocr.picked != null) {
      pickOcrWord(null);
    } else if (Date.now() - lastTap < 350) {
      zoomAt(tap.x, tap.y, ocr.view.s > 1.5 ? 1 : 3);
      applyOcrView();
      lastTap = 0;
    } else {
      lastTap = Date.now();
    }
    tap = null;
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  window.addEventListener("resize", () => { if (ocr && !$("ocr-view").hidden) layoutOcr(true); });
}

// Kuvasta haku on kokeellinen: 📷 näkyy vain, kun kokeelliset ominaisuudet on kytketty päälle valikosta
// --- Lisenssit ---
// Kaikissa versioissa samat tiedostot (web/licenses/); työpöytäversion build lisää Pythonin ja Debian-kirjastojen
// lisenssit kansioon licenses/desktop/ ja niiden luettelon tiedostoon files.txt
const LICENSE_FILES = ["NOTICES.txt", "GPL-3.0.txt", "LGPL-3.0.txt", "CC-BY-4.0.txt", "CC-BY-SA-4.0.txt", "CC-BY-3.0.txt", "MPL-2.0.txt", "Apache-2.0.txt",
  "../vendor/LICENSE-sql.js.txt"];
async function showLicenses() {
  let files = LICENSE_FILES;
  try {
    const r = await fetch("licenses/desktop/files.txt");
    // Ilman verkkoa vanha service worker voi palauttaa index.html:n puuttuvan tiedoston tilalle
    if (r.ok && !(r.headers.get("content-type") || "").includes("text/html")) files = files.concat((await r.text()).split("\n").map((f) => f.trim()).filter(Boolean).map((f) => "desktop/" + f));
  } catch (e) { /* ei työpöytäversio */ }
  $("lic-select").innerHTML = files.map((f) =>
    `<option value="${esc(f)}">${esc(f.replace("../vendor/LICENSE-", "").replace(/^desktop\/(debian\/)?/, ""))}</option>`).join("");
  $("licenses-dlg").showModal();
  showLicenseFile(files[0]);
}
// Lisenssitekstit on rivitetty ~76 merkkiin; puhelimessa rivit katkeaisivat rumasti. Kovat rivinvaihdot
// yhdistetään kappaleiksi: täysi rivi + samalla sisennyksellä jatkuva rivi, joka ei ole otsikko, luettelon
// kohta tai "Licence:"-tyyppinen avainrivi.
function reflowLicense(text) {
  const out = [];
  let lastRaw = "";
  const indent = (l) => l.length - l.trimStart().length;
  for (const line of text.replace(/\r/g, "").split("\n")) {
    const join = out.length && lastRaw.trim() && line.trim() && lastRaw.trimEnd().length >= 60
      && indent(line) <= indent(lastRaw) && !/^\s*(=+|-+)\s*$/.test(line)
      && !/^\s*([-*•]\s|\(?[0-9a-z]{1,3}[.)]\s|©|[A-Z][A-Za-z ]{0,20}:\s)/.test(line);
    if (join) out[out.length - 1] += " " + line.trim();
    else out.push(line);
    lastRaw = line;
  }
  return out.join("\n");
}
async function showLicenseFile(file) {
  const pre = $("lic-text");
  try {
    const r = await fetch("licenses/" + file);
    if (!r.ok) throw new Error(r.status);
    pre.textContent = reflowLicense(await r.text());
  } catch (e) {
    pre.textContent = "licenses/" + file + ": " + e.message;
  }
  pre.scrollTop = 0;
}

// Kokeelliset ominaisuudet: jokainen oma kytkimensä. Päälle kytkettäessä ikkuna kertoo, mitä ominaisuus tekee,
// ja Peruuta jättää sen pois päältä; pois kytkettäessä ei kysytä mitään.
// Valokuvahaun kielet asetuksissa: kuvan kielet (pohjoissaame ja käyttöliittymän kieli aina; inari ja koltta valittavissa,
// niiden sanasto ladataan vasta valittaessa) ja käännöskielet (käyttöliittymän kieli aina)
function renderOcrOpts() {
  const el = $("ocr-opts");
  el.hidden = !(window.SatniOcr && settings.exp.ocr);
  if (el.hidden) return;
  const box = (attr, code, on, extra = "", disabled = false) => `<label class="ocr-opt"><input type="checkbox" ${attr}="${code}"` +
    `${on ? " checked" : ""}${disabled ? " disabled" : ""}><span>${esc(ocrLangName(code))}${extra}</span></label>`;
  const unchecked = ` <span class="unchecked-badge">${esc(t("smsUnchecked"))}</span>`;
  el.innerHTML = `<div class="ocr-opts-head">${esc(t("ocrLangsTitle"))}</div>` +
    `<div class="ocr-opts-row">${box("data-ocr-lang", "sme", true, "", true)}${box("data-ocr-lang", settings.lang, true, "", true)}` +
    `${box("data-ocr-lang", "smn", settings.ocrLangs.includes("smn"))}${box("data-ocr-lang", "sms", settings.ocrLangs.includes("sms"), unchecked)}</div>` +
    `<p class="muted small">${esc(t("ocrLangsNote"))}</p>` +
    `<div class="ocr-opts-head">${esc(t("ocrTargetsTitle"))}</div>` +
    `<div class="ocr-opts-row">${["fin", "nob", "sme", "smn"].map((c) => box("data-ocr-target", c, targetOn(c), "", c === settings.lang)).join("")}</div>`;
}
function bindOcrOpts() {
  $("ocr-opts").onchange = (e) => {
    const lang = e.target.dataset.ocrLang, target = e.target.dataset.ocrTarget;
    if (lang) settings.ocrLangs = e.target.checked ? [...new Set([...settings.ocrLangs, lang])] : settings.ocrLangs.filter((l) => l !== lang);
    if (target) settings.ocrTargets = e.target.checked ? [...new Set([...settings.ocrTargets, target])] : settings.ocrTargets.filter((l) => l !== target);
    saveSettings();
    syncMinorDbs();
    applyOcrLook();
  };
}

function applyExperimental() {
  for (const box of document.querySelectorAll("[data-exp]")) box.checked = !!settings.exp[box.dataset.exp];
  $("exp-ocr-row").hidden = !window.SatniOcr;
  renderOcrOpts();
  if (sqlModule) syncMinorDbs();
  $("ocr-btn").hidden = !(window.SatniOcr && settings.exp.ocr);
  if (!settings.exp.ocr) $("ocr-view").hidden = true;
  // Lausekääntäjä (lauseet.js): painike yläpalkkiin kameran ja sanastojen viereen. Toimii vain suomeksi, joten
  // norjankielisessä käyttöliittymässä se piilotetaan kokonaan (asetus säilyy, palaa suomeksi vaihdettaessa).
  if ($("lause-btn")) {
    const fi = settings.uiLang === "fi";
    $("exp-lause-row").hidden = !fi;
    // Suomennosehdotukset vain suomeksi ja Apertiumin norjannokset vain norjaksi (muuten ne eivät vaikuta mihinkään)
    $("exp-pivotfin-row").hidden = !fi;
    $("exp-apertium-row").hidden = fi;
    $("lause-btn").hidden = !(fi && settings.exp.lause);
    if (!(fi && settings.exp.lause) && !$("lause-view").hidden) { $("lause-view").hidden = true; overlayClosed(); }
  }
}
function bindExperimental() {
  bindOcrOpts();
  let pending = null;
  const set = (name, on) => {
    settings.exp = { ...settings.exp, [name]: on };
    saveSettings();
    applyExperimental();
    if (name === "tableTr" && state.word) renderTable();
    if (name === "apertium" && state.results.length) searchAgainKeepingWord();
    if (name === "pivotFin" && state.results.length) searchAgainKeepingWord();
  };
  // Kokeelliset kytkimet ovat kahdella asetussivulla (Työkalut: valokuvahaku ja lausekääntäjä; Kokeelliset käännökset)
  $("settings-view").addEventListener("change", (e) => {
    const name = e.target.dataset.exp;
    if (!name) return;
    if (!e.target.checked) { set(name, false); return; }
    e.target.checked = false;  // päälle vasta, kun käyttäjä hyväksyy
    pending = name;
    const key = { ocr: "expOcr", lause: "lauseTitle", tableTr: "expTableTr", apertium: "expApertium", pivotFin: "expPivotFin" }[name];
    $("exp-dlg-title").textContent = t(key);
    $("exp-dlg-body").innerHTML = t(name === "lause" ? "expLauseInfo" : key + "Info");
    $("exp-dlg").showModal();
  });
  $("exp-ok").onclick = () => { $("exp-dlg").close(); if (pending) set(pending, true); pending = null; };
  $("exp-cancel").onclick = () => { $("exp-dlg").close(); pending = null; };
  $("exp-dlg").addEventListener("close", () => { pending = null; });
  applyExperimental();
}

function bindOcr() {
  if (!window.SatniOcr) return;
  $("ocr-btn").onclick = openOcr;
  $("ocr-camera").onclick = () => scanPhoto("camera");
  $("ocr-gallery").onclick = () => scanPhoto("gallery");
  // Kääntö 90 astetta (Ocr.java: rotate): kuva tunnistetaan uudelleen. Sivuttain oleva teksti käännetään myös
  // automaattisesti, joten painikkeita tarvitaan vain, jos automaattinen kääntö ei osu.
  for (const [id, deg] of [["ocr-rotate-left", -90], ["ocr-rotate-right", 90]]) {
    $(id).onclick = () => { if (!ocr || !window.SatniOcr.rotate) return; setOcrBusy(t("ocrWorking")); window.SatniOcr.rotate(deg); };
  }
  $("ocr-close").onclick = () => { if (ocr) pickOcrWord(null); $("ocr-view").hidden = true; };
  $("ocr-pick").onclick = (e) => { e.stopPropagation(); pickSentence(); };
  bindSentView();
  $("ocr-swatches").innerHTML = OCR_COLORS.map((c) =>
    `<button data-color="${c}" style="--c:${c}" aria-label="${c}"></button>`).join("");
  const relook = () => { saveSettings(); if (ocr) layoutOcr(false); else applyOcrLook(); };
  // Sirut avaavat kielilistan sirun alle; vaihtopainike kääntää suunnan
  $("ocr-from").onclick = (e) => { e.stopPropagation(); toggleOcrLangMenu("from"); };
  $("ocr-to").onclick = (e) => { e.stopPropagation(); toggleOcrLangMenu("to"); };
  $("ocr-swap").onclick = (e) => { e.stopPropagation(); $("ocr-langs").hidden = true; swapOcrLangs(); };
  $("ocr-langs").onclick = (e) => {
    e.stopPropagation();
    const from = e.target.closest("[data-from]")?.dataset.from, to = e.target.closest("[data-to]")?.dataset.to;
    if (!from && !to) return;
    $("ocr-langs").hidden = true;
    setOcrLangs(from || settings.ocrFrom, to || settings.ocrTo);
  };
  $("ocr-offer").onclick = (e) => {
    const b = e.target.closest("[data-hint]");
    if (!b) return;
    if (b.dataset.hint === "settings") openOcrSettings();
    else { hintDismissed[$("ocr-offer").dataset.lang] = true; showOcrHint(null); }
  };
  $("ocr-style-btn").onclick = (e) => { e.stopPropagation(); $("ocr-style").hidden = !$("ocr-style").hidden; };
  $("ocr-style-seg").onclick = (e) => {
    const b = e.target.closest("[data-style]");
    if (b) { settings.ocrStyle = b.dataset.style; relook(); }
  };
  $("ocr-swatches").onclick = (e) => {
    const b = e.target.closest("[data-color]");
    if (b) { settings.ocrColor = b.dataset.color; relook(); }
  };
  $("ocr-view").addEventListener("click", (e) => {
    if (!e.target.closest("#ocr-style, #ocr-style-btn")) $("ocr-style").hidden = true;
    if (!e.target.closest("#ocr-langs, #ocr-from, #ocr-to")) $("ocr-langs").hidden = true;
  });
  applyOcrLook();
  bindOcrGestures();
}

// --- Sanakortin muodon kupla: napautettu muoto (taivutustaulukko, Kaikki muodot), kuuntele ja kopioi ---

const COPY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
let formPopTarget = null;

function openFormPop(form) {
  closeFormPop();
  const pop = $("form-pop");
  formPopTarget = form;
  form.classList.add("picked");
  pop.innerHTML = `<span class="b-word">${esc(form.textContent)}</span>`
    + `<button class="b-speak" aria-label="${esc(t("listenTo", form.dataset.speak))}">${SPEAK_ICON}</button>`
    + `<button class="b-copy" aria-label="${esc(t("copy"))}">${COPY_ICON}</button>`;
  pop.hidden = false;
  placeFormPop();
}

// Takaisin-ele (MainActivity.goBackOrFinish), Esc ja napautus muualle
function closeFormPop() {
  if (!formPopTarget) return false;
  formPopTarget.classList.remove("picked");
  formPopTarget = null;
  $("form-pop").hidden = true;
  return true;
}

// Kupla muodon yläpuolelle (tai alle, jos yläpuolella ei ole tilaa), sivun koordinaateissa
// Tekstin koko selaimessa (applyTextSize: CSS-zoom): getBoundingClientRect ja vieritys ovat näytön pikseleitä, tyylit CSS-pikseleitä
const pageZoom = () => parseFloat(document.documentElement.style.zoom) || 1;
function placeFormPop() {
  if (!formPopTarget) return;
  const pop = $("form-pop"), r = formPopTarget.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) { closeFormPop(); return; }
  // Vanhemmat Chromiumit (alle 128, esim. Qt WebEngine) antavat zoomatun sivun mitat CSS-pikseleinä: mitataan suhde
  // elementistä itsestään (näytön leveys / CSS-leveys), eikä oleteta
  const k = formPopTarget.offsetWidth ? r.width / formPopTarget.offsetWidth : 1;
  const z = Math.abs(k - pageZoom()) < 0.12 ? pageZoom() : 1;
  const b = { left: r.left / z, top: r.top / z, bottom: r.bottom / z, width: r.width / z };
  const below = b.top < pop.offsetHeight + 16;
  pop.classList.toggle("below", below);
  const x = b.left + b.width / 2, half = pop.offsetWidth / 2;
  const left = Math.min(Math.max(x, half + 8), document.documentElement.clientWidth / z - half - 8);
  pop.style.left = `${left + scrollX / z}px`;
  pop.style.top = `${(below ? b.bottom : b.top) + scrollY / z}px`;
  pop.style.setProperty("--arrow", `${Math.min(Math.max(x - left + half, 16), half * 2 - 16)}px`);
}

// Leikepöydälle. Työpöytäsovelluksessa Python kopioi (satni_desktop.py: copy), muualla Clipboard API ja
// vanhempi tapa (execCommand) varalla.
async function copyText(text) {
  if (IS_DESKTOP) { await fetch(`copy?text=${encodeURIComponent(text)}`); return; }
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const area = Object.assign(document.createElement("textarea"), { value: text });
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function bindFormPop() {
  const pop = $("form-pop");
  for (const id of ["panel-table", "panel-raw"]) {
    $(id).addEventListener("click", (e) => {
      const form = e.target.closest(".form");
      if (form && form !== formPopTarget) openFormPop(form);
      else closeFormPop();
    });
  }
  // Painettu painike näkyy myös nopealla napautuksella (korostus pysyy hetken)
  pop.addEventListener("pointerdown", (e) => e.target.closest("button")?.classList.add("pressed"));
  const release = () => setTimeout(() => pop.querySelector(".pressed")?.classList.remove("pressed"), 180);
  pop.addEventListener("pointerup", release);
  pop.addEventListener("pointercancel", release);
  pop.addEventListener("click", async (e) => {
    const form = formPopTarget;
    if (!form) return;
    const speaker = e.target.closest(".b-speak"), copy = e.target.closest(".b-copy");
    if (speaker && !speaker.classList.contains("loading")) speak(form.dataset.speak, speaker);
    if (copy) {
      await copyText(form.textContent);
      copy.innerHTML = CHECK_ICON;
      setTimeout(() => { if (copy.isConnected) copy.innerHTML = COPY_ICON; }, 1200);
      // Android 13+ näyttää itse kopioidun tekstin
      if (!(Number(navigator.userAgent.match(/Android (\d+)/)?.[1]) >= 13)) toast(t("copied", form.textContent), 1800);
    }
  });
  document.addEventListener("click", (e) => {
    if (formPopTarget && !e.target.closest("#form-pop, .form, #sanasto-body .sw")) closeFormPop();
  });
  // Esc sulkee vain päällimmäisen kerroksen: käsitelty Esc merkitään (preventDefault), jolloin näkymien omat
  // Esc-kuuntelijat (sanastot, peli, lause) ohittavat sen. Avoimen ikkunan (dialog) Esc sulkee vain ikkunan.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]") && closeFormPop()) e.preventDefault();
  });
  addEventListener("scroll", placeFormPop, true);
  addEventListener("resize", placeFormPop);
}

// --- Osoite (#/sana/dahkat/1) ---

// Muusta sovelluksesta jaettu teksti (Android: Jaa -> Sátni FST; asennettu selainversio:
// share_target, ?text=...). Ensin koko ilmaus (dahkat iežas), sitten sanat järjestyksessä:
// haetaan ensimmäinen, josta löytyy osumia. Välimerkit ja linkit pois. Ennen sanakirjan latautumista
// teksti odottaa (pendingShared).
let pendingShared = null;
function openShared(text) {
  text = String(text).slice(0, MAX_QUERY);
  const words = cleanQuery(text).replace(/https?:\/\/\S+/g, " ").split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
  if (!words.length) return false;  // pelkkä linkki, välimerkit tai tyhjä: ei haettavaa
  if (!db) { pendingShared = text; return false; }
  const tries = [words.slice(0, 4).join(" "), ...words.slice(0, 20)];
  search(tries.find((q) => queryDatabase(q).length) || words[0]);
  return true;
}

function routeFromHash() {
  stopTts();  // edellisen sanan ääntämys ei jatku uudella sivulla
  const m = location.hash.match(/^#\/sana\/([^/]+)(?:\/(\d+))?/);
  if (m) search(decodeURIComponent(m[1]), Number(m[2] || 0));
  else { searchRun++; setSearchBusy(null); showOnly("welcome"); $("search").value = ""; syncSearchClear(); $("did-you-mean").hidden = true; }
}

// Logo ja nimi: takaisin aloitussivulle. Sivua ei ladata uudelleen, koska sanakirja on jo muistissa.
function goHome(e) {
  e.preventDefault();
  closeDrawer();
  hideSuggestions();
  if (location.hash) history.pushState(null, "", location.pathname + location.search);
  routeFromHash();
  window.scrollTo(0, 0);
}

// --- Käynnistys ---

function bindEvents() {
  const input = $("search");
  input.addEventListener("input", syncSearchClear);
  $("search-clear").onclick = () => {
    input.value = "";
    syncSearchClear();
    input.focus();
    updateSuggestions(false);  // tyhjä kenttä: viimeksi haetut ja suosikit
  };
  input.addEventListener("input", () => {
    clearTimeout(suggestTimer);
    clearTimeout(formTimer);
    suggestTimer = setTimeout(() => updateSuggestions(false), 120);
    // Ei kesken nuolinäppäimillä tehdyn valinnan
    formTimer = setTimeout(() => {
      if (activeSuggestion < 0) updateSuggestions(true);
      else $("suggestions").querySelector(".sugg-loading")?.remove();
    }, FORM_SUGGEST_PAUSE);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && moveSuggestion(1)) e.preventDefault();
    else if (e.key === "ArrowUp" && moveSuggestion(-1)) e.preventDefault();
    else if (e.key === "Escape") hideSuggestions();
    else if (e.key === "Enter") {
      e.preventDefault();
      const s = activeSuggestion >= 0 ? suggestions[activeSuggestion] : null;
      if (s) pickSuggestion(s); else search(input.value);
      input.blur();
    }
  });
  input.addEventListener("blur", () => setTimeout(hideSuggestions, 150));
  // Tyhjän kentän napautus tai nuoli alas: viimeksi haetut ja suosikit (ei automaattisesta kohdistuksesta käynnistyksessä)
  input.addEventListener("click", () => { if (!input.value.trim()) updateSuggestions(false); });
  input.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" && !input.value.trim() && $("suggestions").hidden) { updateSuggestions(false); e.preventDefault(); } });
  $("suggestions").addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");  // ei hakurivi
    if (li) { e.preventDefault(); pickSuggestion(suggestions[li.dataset.i]); input.blur(); }
  });
  $("search-btn").onclick = () => search(input.value);
  $("search-busy-cancel").onclick = () => { searchRun++; setSearchBusy(null); };

  $("grade-toggle").checked = settings.showGrade;
  $("grade-toggle").onchange = (e) => {
    settings.showGrade = e.target.checked; saveSettings();
    if (state.word) { renderGradation(); renderTable(); renderRaw(); }
  };
  $("voice-list").addEventListener("change", (e) => { settings.voice = e.target.value; saveSettings(); });
  // Koko äänisiru valitsee äänen ja soittaa sen näytteen (sovelluksessa oleva lause); kaiutinpainike soittaa vain
  $("voice-list").addEventListener("click", (e) => {
    const b = e.target.closest(".sample-btn");
    if (b) { playVoiceSample(b.dataset.voice, b); return; }
    const row = e.target.closest(".voice-row");
    if (!row) return;
    const radio = row.querySelector("input[type=radio]");
    if (e.target === radio) return;  // label-napautus tuottaa myös radion klikkauksen: käsitellään vain kerran
    if (!radio.checked) { radio.checked = true; settings.voice = radio.value; saveSettings(); renderSettingsSummary(); }
    const sample = row.querySelector(".sample-btn");
    playVoiceSample(sample.dataset.voice, sample);
  });
  $("drawer-lang").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (b) setUiLanguage(b.dataset.lang);
  });
  $("extra-langs").onchange = (e) => {
    if (e.target.dataset.skolt === "on") {
      if (e.target.checked) { e.target.checked = false; openSkoltDialog(); } else setSkolt(false, false);
      return;
    }
    if (e.target.dataset.skolt === "via") { setSkolt(true, e.target.checked); return; }
    const lang = e.target.value;
    settings.extraLangs = e.target.checked ? [...settings.extraLangs, lang] : settings.extraLangs.filter((l) => l !== lang);
    saveSettings();
    if (state.results.length) searchAgainKeepingWord();
  };
  $("skolt-ok").onclick = () => {
    $("skolt-dlg").close();
    setSkolt(true, $("skolt-via").checked);
  };
  $("report-btn").onclick = (e) => { e.preventDefault(); openReport(); };
  $("report-cancel").onclick = () => $("report-dlg").close();
  $("report-send").onclick = sendReport;
  // Kielivalinta koskee vain käännösvirhettä: valinnan muutos valitsee sen
  $("report-lang").onchange = () => { $("report-dlg").querySelector('input[value="trans"]').checked = true; };
  $("skolt-cancel").onclick = () => $("skolt-dlg").close();
  bindSettings();
  bindBottomNav();

  $("tabs").onclick = (e) => { if (e.target.dataset.tab) setTab(e.target.dataset.tab); };
  $("grad-sum").onclick = () => { setTab("grade"); $("tabs").scrollIntoView({ block: "start", behavior: "smooth" }); };
  $("more-meanings").onclick = (e) => { e.preventDefault(); setTab("meanings"); };
  $("speak-btn").onclick = () => speak(shownLemma(state.word), $("speak-btn"));
  $("fav-btn").onclick = toggleFavourite;
  bindFormPop();
  // Tietoa: Asetukset → Tietoa sovelluksesta ja valikon tekijärivi (valikon oma Tietoa-rivi poistettu 2026-11-15)
  $("author-btn").onclick = () => $("about").showModal();
  $("support-btn").onclick = () => $("support-dlg").showModal();
  $("feedback-btn").onclick = () => $("feedback-dlg").showModal();
  $("support-feedback").onclick = () => { $("support-dlg").close(); $("feedback-dlg").showModal(); };
  $("feedback-copy").onclick = async () => { await copyText("satni@somby.fi"); toast(t("copied", "satni@somby.fi"), 1800); };
  for (const a of document.querySelectorAll(".home-link")) a.onclick = goHome;
  $("licenses-btn").onclick = showLicenses;
  $("did-you-mean").onclick = (e) => { const b = e.target.closest("[data-q]"); if (b) search(b.dataset.q); };
  $("lic-select").onchange = (e) => showLicenseFile(e.target.value);
  $("welcome-lang").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (b) setUiLanguage(b.dataset.lang);
  });
  $("sidebar-toggle").onclick = () => {
    // Avattaessa lista lyhyenä ja käännökset ajan tasalla (sanakirja on voinut latautua valikon piirtämisen jälkeen)
    if (document.body.classList.toggle("sidebar-open")) { historyExpanded = false; renderSidebar(); }
  };
  document.querySelector(".menu-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mtab]");
    if (b && b.dataset.mtab !== menuTab) { menuTab = b.dataset.mtab; renderSidebar(); }
  });
  // Puhelimessa alhaalta nousevan valikon voi vetää alas kiinni (kahva, välilehdet tai lista, kun se on alussa)
  {
    const sb = $("sidebar"), sheet = window.matchMedia("(max-width: 700px)");
    let drag = null;
    sb.addEventListener("touchstart", (e) => {
      drag = null;
      if (!sheet.matches || !drawerOpen() || e.touches.length !== 1) return;
      const list = e.target.closest(".word-list");
      if ((list && list.scrollTop > 0) || sb.scrollTop > 0) return;  // lista (matalassa näkymässä koko valikko) vierii ensin alkuun
      drag = { y: e.touches[0].clientY, t: Date.now(), dy: 0, on: false };
    }, { passive: true });
    sb.addEventListener("touchmove", (e) => {
      if (!drag) return;
      drag.dy = e.touches[0].clientY - drag.y;
      if (!drag.on && drag.dy < -8) { drag = null; return; }  // ylöspäin: tavallinen vieritys
      if (!drag.on && drag.dy > 8) {
        drag.on = true;
        sb.style.transition = "none";
        $("history").dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));  // ei pitkän painalluksen poistoa kesken vedon
      }
      if (drag.on) { if (e.cancelable) e.preventDefault(); sb.style.transform = `translateY(${Math.max(0, drag.dy)}px)`; }
    }, { passive: false });
    const end = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.on) return;
      sb.style.transition = "";
      sb.style.transform = "";
      // Riittävän pitkä tai nopea veto sulkee, muuten paneeli palaa paikalleen
      // Veto ei tuota click-tapahtumaa (touchmove estetty), joten valikon historiamerkintä poistetaan tässä; muuten
      // seuraava Takaisin verkkoversiossa ei tekisi näkyvää (yötesti 2026-11-16)
      if (d.dy > 90 || (d.dy > 30 && d.dy / Math.max(1, Date.now() - d.t) > 0.5)) { closeDrawer(); overlayClosed(); }
    };
    sb.addEventListener("touchend", end);
    sb.addEventListener("touchcancel", end);
  }
  $("drawer-scrim").onclick = closeDrawer;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]") && closeDrawer()) e.preventDefault();
  });
  $("sidebar").addEventListener("click", (e) => { if (e.target.closest("a")) document.body.classList.remove("sidebar-open"); });
  // Saamenkieliset sanat: lang="se" ja translate="no", jottei selaimen automaattinen käännös (Chrome, Edge, Safari)
  // käännä saamen sanoja suomen tai norjan mukana (käyttöliittymä saa yhä kääntyä). Merkitään keskitetysti valitsimilla,
  // myös myöhemmin piirretty sisältö (MutationObserver), ettei jokaista mallia tarvitse muistaa erikseen.
  const SAMI_SEL = '#lemma, #lause-sme, #sme-def, #welcome-title, #today, .r-lemma, .form, .sme, .sw, .b-word, .lcard-lemma, ' +
    '.lc-sme, .lc-base, .cv-sme, .wl-w, #lause-pop b, #suggestions li > b, .sugg-form, #examples button:not(.random), .st-prev, [lang="se"], [lang="smn"]';
  const markSami = (root) => {
    for (const el of [...(root.matches(SAMI_SEL) ? [root] : []), ...root.querySelectorAll(SAMI_SEL)]) {
      if (el.getAttribute("translate") !== "no") { el.setAttribute("translate", "no"); if (!el.lang) el.lang = "se"; }
    }
  };
  markSami(document.body);
  new MutationObserver((list) => {
    for (const m of list) for (const n of m.addedNodes) if (n.nodeType === 1) markSami(n);
  }).observe(document.body, { childList: true, subtree: true });
  // Suljettu valikko on vain siirretty näytön ulkopuolelle: inert pois ruudunlukijalta ja Tab-järjestyksestä (päivätesti 2026-11-14)
  // Avoimen valikon ajaksi pääsisältö inert (ruudunlukija ja Tab eivät eksy taustan taakse) ja valikon avaavilla
  // painikkeilla aria-expanded (yötesti 2026-11-17)
  const syncDrawer = () => {
    const open = document.body.classList.contains("sidebar-open");
    $("sidebar").inert = !open;
    $("main").inert = open;
    for (const b of [$("sidebar-toggle"), document.querySelector('#bottom-nav [data-nav="more"]')]) {
      if (b) { b.setAttribute("aria-expanded", String(open)); b.setAttribute("aria-controls", "sidebar"); }
    }
  };
  new MutationObserver(syncDrawer).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  syncDrawer();
  $("clear-history").onclick = () => $("clear-history-dlg").showModal();
  $("history-clear-menu").onclick = () => $("clear-history-dlg").showModal();
  // Historian sanan pitkä painallus poistaa sen (ilmoitus kertoo); tavallinen napautus avaa sanan kuten ennen
  let histPress = null, histLong = false;
  const histCancel = () => { clearTimeout(histPress); histPress = null; $("history").querySelector(".pressing")?.classList.remove("pressing"); };
  $("history").addEventListener("pointerdown", (e) => {
    const a = e.target.closest("li a");
    histLong = false;
    if (!a) return;
    a.classList.add("pressing");
    histPress = setTimeout(() => {
      histLong = true;
      const w = decodeURIComponent(a.getAttribute("href").replace("#/sana/", ""));
      settings.history = settings.history.filter((x) => x !== w);
      saveSettings();
      renderSidebar();
      toast(t("historyRemoved", w), 2500);
    }, 600);
  });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) $("history").addEventListener(ev, histCancel);
  $("history").addEventListener("click", (e) => { if (histLong) { e.preventDefault(); e.stopPropagation(); histLong = false; } }, true);
  $("history").addEventListener("contextmenu", (e) => { if (e.target.closest("li a")) e.preventDefault(); });
  $("clear-history-cancel").onclick = () => $("clear-history-dlg").close();
  $("clear-history-ok").onclick = () => {
    $("clear-history-dlg").close();
    settings.history = [];
    saveSettings();
    renderSidebar();
  };
  $("history-more").onclick = () => { historyExpanded = true; renderSidebar(); };
  window.addEventListener("popstate", onPopState);
  // Kerrosten historiamerkinnät käyttäjän eleiden jälkeen (napautus, näppäin) ja ikkunan sulkeuduttua
  for (const ev of ["click", "keyup"]) document.addEventListener(ev, queueOverlaySync, true);
  document.addEventListener("close", queueOverlaySync, true);
  window.addEventListener("hashchange", routeFromHash);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f" && db) { e.preventDefault(); input.focus(); input.select(); }
  });
}

async function main() {
  if (!UI_LANGUAGES[settings.uiLang]) settings.uiLang = "fi";
  // Käännökset käyttöliittymän kielellä. Aiemmin käännöskieleksi valittu muu kieli (englanti, inarin-, luulajan-
  // tai eteläsaame) siirtyy Muut kielet -asetukseen, jolloin sen käännökset näkyvät edelleen sanakortissa.
  if (settings.experimental) {  // 0.8.1 ja aiemmat: yksi yhteinen kytkin = kuvasta haku
    settings.exp = { ...settings.exp, ocr: true };
    delete settings.experimental;
  }
  if (settings.exp && "sms" in settings.exp) {  // 0.9.3 ja aiemmat: kokeellinen koltansaame = molemmat reitit
    if (settings.exp.sms) { settings.skolt = true; settings.skoltViaSme = true; }
    const { sms, ...rest } = settings.exp;
    settings.exp = rest;
  }
  settings.extraLangs = (settings.extraLangs || []).filter((l) => LANGUAGES[l] && !LANGUAGES[l].main);
  if (LANGUAGES[settings.lang] && !LANGUAGES[settings.lang].main && !settings.extraLangs.includes(settings.lang)) {
    settings.extraLangs.push(settings.lang);
  }
  settings.lang = UI_LANGUAGES[settings.uiLang].translationLang;
  // Vanhemmissa versioissa valittavana oli muitakin värejä; ne vaihtuvat siniseen
  if (!OCR_COLORS.includes(settings.ocrColor)) settings.ocrColor = "#2563eb";
  applyTheme();
  const ex = $("examples");
  for (const w of EXAMPLE_WORDS) {
    const b = document.createElement("button");
    b.textContent = w;
    b.onclick = () => search(w);
    ex.appendChild(b);
  }
  const rnd = document.createElement("button");
  rnd.className = "random";
  rnd.id = "random-btn";
  rnd.onclick = () => {
    const r = all(`SELECT sme_lemma FROM dictionary WHERE pos IN ('N','V','A') AND gradation IS NOT NULL
                   AND ${LANGUAGES[settings.lang].col} != '' AND (subtype IS NULL OR subtype = '') ORDER BY RANDOM() LIMIT 1`)[0];
    if (r) search(r.sme_lemma);
  };
  ex.appendChild(rnd);
  applyStaticTexts();
  bindEvents();
  bindExperimental();
  bindOcr();
  renderSidebar();
  if (FIRST_RUN) showFirstRun();

  // Service worker vain verkkosivuna (PWA); työpöytä- ja Android-sovellus lukevat tiedostot omasta paketistaan
  if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !IS_ANDROID) {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker:", e));
  }

  pendingShared = new URLSearchParams(location.search).get("text");
  if (pendingShared) history.replaceState(null, "", location.pathname);

  try {
    showOnly("loading");
    db = await loadDatabase();
  } catch (e) {
    $("loading-text").textContent = t("loadFailedLong", e.message);
    return;
  }
  $("search").disabled = false;
  $("search-btn").disabled = false;
  $("ocr-btn").disabled = false;
  syncMinorDbs();
  // Jaettu teksti ilman sanoja (esim. pelkkä linkki): aloitussivu, ettei latausnäkymä jää näkyviin
  if (!(pendingShared && openShared(pendingShared))) routeFromHash();
  if (!location.hash) $("search").focus();
  showMenuTip();
}

// --- Näppäimistökäyttö koko näytön näkymissä (minipeli, sanastot, lausekääntäjä) ---
// Avoimen näkymän alla oleva sivu on inert (Tab ei kulje näkymättömien painikkeiden kautta). Näppäimistöllä
// käytettäessä fokus siirtyy avattuun näkymään, pysyy siinä uudelleenpiirron jälkeen (sama painike tai näkymän
// pääpainike) ja palaa suljettaessa avanneeseen painikkeeseen. Kosketus- ja hiirikäytössä fokusta ei siirretä.
function bindViewFocus() {
  const views = ["peli-view", "sanasto-view", "lause-view", "settings-view"].map($).filter(Boolean);
  const shell = [".topbar", ".searchbar", ".layout"].map((s) => document.querySelector(s)).filter(Boolean);
  let kbd = false, opener = null, lastKey = null, autoFocused = null;
  document.addEventListener("keydown", (e) => { if (["Tab", "Enter", " ", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) kbd = true; }, true);
  document.addEventListener("pointerdown", () => { kbd = false; }, true);
  // Viimeksi painettu painike tunnistetaan data-attribuuteista, jotta sama painike löytyy uudelleenpiirron jälkeen
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("button, [tabindex]");
    if (!b || !views.some((v) => v.contains(b))) return;
    const attrs = ["data-act", "data-mode", "data-list", "data-style", "data-sami"].filter((a) => b.hasAttribute(a));
    lastKey = attrs.length ? attrs.map((a) => `[${a}="${CSS.escape(b.getAttribute(a))}"]`).join("") : null;
  }, true);
  const visible = (el) => el && !el.disabled && !el.hidden && el.getClientRects().length > 0;
  const FOCUSABLE = "input:not([disabled]), textarea, .peli-primary, .peli-opt, button, [tabindex='0']";
  const focusIn = (view) => {
    const a = document.activeElement;
    if (view.contains(a) && a !== view && a !== autoFocused) return;
    const body = view.querySelector(".peli-body, .sanasto-body, .lause-view");
    const remembered = lastKey && view.querySelector(lastKey);
    let target = visible(remembered) ? remembered : null;
    // Näkymän sisältö ensin (kirjoituskenttä, pääpainike, vastausvaihtoehto, muu painike), sitten otsikkorivi
    for (const sel of FOCUSABLE.split(", ")) {
      if (target) break;
      target = [...(body ? body.querySelectorAll(sel) : [])].find((el) => visible(el) && !el.closest(".sanasto-head, .lause-head"));
    }
    autoFocused = null;
    if (!target) target = autoFocused = [...view.querySelectorAll("button")].find(visible);
    if (target) target.focus({ preventScroll: false });
  };
  const sync = () => {
    const open = views.filter((v) => !v.hidden);
    for (const el of shell) el.inert = open.length > 0;
    document.documentElement.classList.toggle("view-open", open.length > 0);
    if (!open.length) {
      if (kbd && opener && opener.isConnected && visible(opener)) opener.focus();
      opener = null;
    }
  };
  for (const v of views) {
    new MutationObserver(() => {
      if (!v.hidden) {
        if (!opener && !views.some((o) => o !== v && !o.hidden)) opener = document.activeElement;
        lastKey = null;
        if (kbd) requestAnimationFrame(() => focusIn(v));
      }
      sync();
    }).observe(v, { attributes: true, attributeFilter: ["hidden"] });
    // Sisällön uudelleenpiirto (innerHTML) pudottaa fokuksen <body>:lle: palautetaan se näkymään
    const body = v.querySelector(".peli-body, .sanasto-body, .lause-chips");
    if (body) new MutationObserver(() => {
      const a = document.activeElement;
      if (kbd && !v.hidden && (!v.contains(a) || a === autoFocused)) requestAnimationFrame(() => focusIn(v));
    }).observe(body, { childList: true });
  }
}
bindViewFocus();

main();
