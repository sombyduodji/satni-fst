// Sanastot: aihekohtaiset sanalistat (luvut, viikonpäivät, kuukaudet ...). Aineisto data/sanastot.json (sanastot.py:
// sanakirjasta ja GiellaLT-malleista, Divvunin oikoluvulla tarkistettu). Ylätunnisteen kirjapainike avaa näkymän;
// sanan napautus avaa kuplan (kuuntele, kopioi, sanakortti), pitkä painallus suoraan sanakortin (takaisin-ele palaa listaan).

let sanastot = null;          // listat, ladataan ensimmäisellä avauksella
let sanastoDur = {};          // äänilistojen kestot sekunteina (Android WebView ilmoittaa keston äärettömäksi)
let sanastoAuki = null;       // avoimen listan id tai null (yleisnäkymä)
let sanastoReturnHash = null; // listasta avatun sanakortin osoite: takaisin-ele palaa listaan
let sanastoCardHash = null;   // sanakortti, jolta palattiin listaan: näkymän sulkeminen vie aloitussivulle, ei kortille

const SANASTO_ICON = {
  numbers: '<path d="M4 9l2-2v10M10 8.5c.5-1 1.5-1.5 2.5-1.5 1.5 0 2.5 1 2.5 2.3 0 2.2-5 3.7-5 7.7h5M17.5 7h3l-2 3.5c1.5 0 2.5 1 2.5 2.3S20 15 18.7 15c-.7 0-1.4-.3-1.9-.8"/>',
  week: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2"/>',
  month: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M10 14h4v4h-4z"/>',
  season: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  family: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2.5 1-4 3-4s3 1.5 3 4"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.5 0-1-.8-1.4-.8-2.3 0-.9.7-1.7 1.7-1.7H17a4 4 0 004-4c0-4.7-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  deer: '<path d="M12 21v-6M8.5 13c1 1.5 2 2 3.5 2s2.5-.5 3.5-2M8.5 13c-1-1-1.5-2.5-1-4M15.5 13c1-1 1.5-2.5 1-4M7.5 9C5 8 4 6 4 3M7.5 9c0-2 1-3.5 2.5-4.5M6 6l-2 0M16.5 9c2.5-1 3.5-3 3.5-6M16.5 9c0-2-1-3.5-2.5-4.5M18 6h2"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17v.5"/>',
  greet: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
};
const sanastoSvg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true">${SANASTO_ICON[name] || ""}</svg>`;
const sanastoLang = () => (settings.uiLang === "nb" ? "nb" : "fi");

async function loadSanastot() {
  if (!sanastot) {
    const d = await (await fetch("data/sanastot.json")).json();
    sanastot = d.lists;
    sanastoDur = d.audioDur || {};
  }
  return sanastot;
}

function openSanastot() {
  stopTts();  // sanakortin ääntämys ei jatku sanastojen päällä
  $("sanasto-view").hidden = false;
  loadSanastot().then(() => (sanastoAuki ? renderSanasto(sanastoAuki) : renderSanastoGrid()))
    .catch(() => { $("sanasto-body").textContent = t("loadFailed", "sanastot.json"); });
}

// Takaisin-ele ja Esc: ensin lista -> yleisnäkymä, sitten näkymä kiinni
function closeSanastot() {
  if ($("sanasto-view").hidden) return false;
  sanastoStopAudio();
  if (closeFormPop()) return true;  // takaisin-ele sulkee ensin sanan kuplan
  if (sanastoAuki) { sanastoAuki = null; renderSanastoGrid(); } else hideSanastot();
  return true;
}

// Näkymä kiinni. Jos listaan palattiin sanakortilta (Androidin takaisin-ele ei muuta osoitetta), kortti korvataan
// aloitussivulla, jottei sulkeminen näytä vanhaa korttia.
function hideSanastot() {
  sanastoStopAudio();
  $("sanasto-view").hidden = true;
  const card = sanastoCardHash;
  sanastoCardHash = null;
  if (card && location.hash === card) {
    history.replaceState(null, "", location.pathname + location.search);
    routeFromHash();
    window.scrollTo(0, 0);
  }
}

// Yleisnäkymä: listat neljässä ryhmässä saamen lipun väreillä (sama kuin yläpalkin raita). Kortissa ikoni, nimi,
// muutama saamen sana esimakuna ja sanojen määrä.
const SANASTO_GROUPS = [
  { id: "perus", color: "yellow", lists: ["luvut", "varit", "kysymykset"] },
  { id: "aika", color: "blue", lists: ["viikonpaivat", "kuukaudet", "vuodenajat", "aika"] },
  { id: "ihmiset", color: "red", lists: ["suku", "pronominit", "tervehdykset"] },
  { id: "luonto", color: "green", lists: ["suunnat", "saa", "porot"] },
];
const sanastoPreview = (l) => l.rows.slice(0, 3).map((r) => (l.kind === "numbers" ? r.card : r.sme[0].w[0])).join(", ");

function renderSanastoGrid() {
  sanastoStopAudio();
  closeFormPop();
  const lang = sanastoLang();
  $("sanasto-title").textContent = t("sanastot");
  $("sanasto-ico").hidden = true;
  $("sanasto-back").hidden = true;
  $("sanasto-speak").hidden = true;
  const byId = Object.fromEntries(sanastot.map((l) => [l.id, l]));
  const listed = new Set(SANASTO_GROUPS.flatMap((g) => g.lists));
  const groups = SANASTO_GROUPS.map((g) => ({ ...g, lists: g.lists.filter((id) => byId[id]) }));
  const rest = sanastot.filter((l) => !listed.has(l.id)).map((l) => l.id);  // uusi lista ilman ryhmää: viimeiseen
  if (rest.length) groups[groups.length - 1].lists.push(...rest);
  const words = sanastot.reduce((n, l) => n + l.rows.length, 0);
  const tile = (l, color) => `<button type="button" class="sanasto-tile" data-list="${esc(l.id)}" style="--tc: var(--flag-${color})">` +
    `<span class="st-ico">${sanastoSvg(l.icon)}</span><span class="st-txt"><span class="st-title">${esc(l.title[lang])}</span>` +
    `<span class="st-prev">${esc(sanastoPreview(l))}</span></span><span class="st-n">${l.rows.length}</span></button>`;
  $("sanasto-body").innerHTML = `<p class="sanasto-intro">${esc(t("sanastoIntro", sanastot.length, words))}</p>` +
    groups.filter((g) => g.lists.length).map((g) => `<section class="sanasto-group" style="--tc: var(--flag-${g.color})">` +
      `<h3>${esc(t("sanastoGroup_" + g.id))}</h3><div class="sanasto-grid">${g.lists.map((id) => tile(byId[id], g.color)).join("")}</div></section>`).join("");
  $("sanasto-body").scrollTop = 0;
}

// Tervehdysten puhujat: pieni saamelaispoika ja -tyttö gáktissa (sininen, punainen ja keltainen reunus, tytöllä solki)
const FACE_PARTS = (back, front, extra) => '<svg viewBox="3.5 5 33 33">' +
  '<path d="M17.6 24h4.8v6h-4.8z" fill="#e3b48f"/><path d="M5 41c1-9 7-13 15-13s14 4 15 13z" fill="#1e4fc2"/>' +
  '<path d="M7 34.6h26" stroke="#d62828" stroke-width="2.6"/><path d="M7.5 37.6h25" stroke="#f4c20d" stroke-width="2"/>' +
  back + '<circle cx="20" cy="18.5" r="8" fill="#f0c7a2"/>' + front +
  '<circle cx="17.2" cy="19.4" r="1.05" fill="#1f2937"/><circle cx="22.8" cy="19.4" r="1.05" fill="#1f2937"/>' +
  '<circle cx="15.6" cy="22" r="1.3" fill="#f29b8f" opacity=".55"/><circle cx="24.4" cy="22" r="1.3" fill="#f29b8f" opacity=".55"/>' +
  '<ellipse cx="20" cy="23.3" rx="1.7" ry="1.2" fill="#9b1c31"/>' + extra + "</svg>";
// Hiukset: otsatukka kasvojen päällä (ei näytä kaljulta tummalla pohjalla), tytöllä pitkät hiukset kasvojen takana
const HAIR = "#8a5532";
const FACE_BOY = FACE_PARTS("",
  `<path d="M11.2 20.5C10.4 12 14.3 7.6 20 7.6s9.6 4.4 8.8 12.9c-.6-2.6-1.6-4.4-2.9-5.4-1.8 1.1-4.6 1.6-7.4 1.3-2.2-.2-3.8-.9-5-1.8-1.1 1.4-1.9 3.2-2.3 5.9z" fill="${HAIR}"/>`, "");
const FACE_GIRL = FACE_PARTS(
  `<path d="M10.6 30c-1.6-4.2-2-8.6-1.5-12 .8-6.3 5.1-9.8 10.9-9.8s10.1 3.5 10.9 9.8c.5 3.4.1 7.8-1.5 12-1.3-3.4-1.6-6.3-1.5-9.6H12.1c.1 3.3-.2 6.2-1.5 9.6z" fill="${HAIR}"/>`,
  `<path d="M11.6 18.6C11.5 12 15.2 8.5 20 8.5s8.5 3.5 8.4 10.1c-1.4-2.4-3.2-3.6-5.4-4.1-1.4 1-3.3 1.4-5.3 1.2-1.6-.1-2.7-.6-3.5-1.2-1.2.9-2 2.2-2.6 4.1z" fill="${HAIR}"/>`,
  '<circle cx="20" cy="30.6" r="1.9" fill="#d9dee6" stroke="#9aa3b0" stroke-width=".6"/>');

// Listan loppu: ohje ja virheilmoitus (sama lomake kuin sanakortissa, app.js: report-dlg)
const sanastoFoot = () => `<p class="sanasto-hint">${esc(t("sanastoHelp"))}</p>` +
  `<p class="report-line sanasto-report"><a href="#" class="report-link sanasto-report-link"><span aria-hidden="true">⚑</span> ` +
  `<span>${esc(t("reportError"))}</span></a></p>`;
let sanastoLastWord = null;  // viimeksi napautettu sana: virheilmoituksen Mikä sana? -kenttään valmiiksi

function sanastoReport() {
  const l = sanastot.find((x) => x.id === sanastoAuki);
  if (!l) return;
  sanastoStopAudio();
  closeFormPop();
  const dlg = $("report-dlg");
  dlg.classList.remove("game-mode");
  dlg.classList.add("list-mode");
  $("report-about").textContent = `${t("reportList")}: ${l.title[sanastoLang()]}`;
  $("report-word").value = sanastoLastWord || "";
  // Äänitevaihtoehto vain listoilla, joilla on valmis äänilista (kuukaudet, viikonpäivät, vuodenajat, luvut)
  dlg.querySelector('input[value="audio"]').closest("label").hidden = !(l.audio || l.numSections);
  $("report-text").value = "";
  dlg.querySelector('input[value="trans"]').checked = true;
  dlg.showModal();
}

function sanastoSendReport() {
  const l = sanastot.find((x) => x.id === sanastoAuki);
  const L = t("reportLabels"), lang = sanastoLang();
  const kind = $("report-dlg").querySelector('input[name="report-kind"]:checked').value;
  const kindText = { trans: t("reportKindTrans"), sme: t("reportKindSme"), audio: t("reportKindAudio"), other: t("reportKindOther") }[kind];
  const word = $("report-word").value.trim().slice(0, 80);
  const title = l ? l.title[lang] : "";
  // Sanan rivi listassa: näytetty käännös mukaan (saamen sana tai sen muoto, tai käännös)
  const row = word && l && l.rows.find((r) => (r.sme || []).some((x) => x.w.includes(word)) || [...(r.fi || []), ...(r.nb || [])].includes(word));
  const shown = row ? (lang === "nb" ? row.nb : row.fi).filter(Boolean).join(", ") : "";
  const subject = `${t("reportSubject")} – ${title}${word ? ": " + word : ""} (${t("reportSubjectKind")[kind]})`;
  const body = [
    $("report-text").value.trim().slice(0, 1200), "",
    `--- ${t("reportDetails")} ---`,
    `${L.error}: ${kindText}`,
    `${t("reportList")}: ${title}${l ? ` (${l.id})` : ""}`,
    word ? `${L.word}: ${word}` : "",
    shown ? `${L.shown}: ${shown}` : "",
    `${L.ui}: ${UI_LANGUAGES[settings.uiLang].name}`,
    `${L.version}: ${$("about-version").textContent}`,
    `${L.link}: ${PUBLIC_APP_URL}`,
  ].filter((line, i) => line !== "" || i === 1).join("\n");
  openReportMail(subject, body);
}

// Saamen sana: perässä kaiutin ja sanakortti (myös taivutusmuodoilla: vuossárgga avaa sanan vuossárga kortin, jossa
// muodon käännös). Sanan napautus lukee sen myös ääneen ja pitkä painallus avaa kortin. Ilman sanakirjan sanaa
// (čuođiokta) vain kaiutin.
const sanastoWord = (w, id, main) => `<span class="sw${main ? " main" : ""}" data-say="${esc(w)}"${id ? ` data-id="${id}"` : ""}>${esc(w)}</span>`;

function renderSanasto(listId) {
  const lang = sanastoLang();
  const l = sanastot.find((x) => x.id === listId);
  if (!l) return renderSanastoGrid();
  if (sanastoAuki !== listId) sanastoLastWord = null;
  sanastoAuki = listId;
  closeFormPop();
  const grp = SANASTO_GROUPS.find((g) => g.lists.includes(listId));
  $("sanasto-view").style.setProperty("--tc", `var(--flag-${grp ? grp.color : "blue"})`);
  $("sanasto-title").textContent = l.title[lang];
  $("sanasto-ico").innerHTML = sanastoSvg(l.icon);
  $("sanasto-ico").hidden = false;
  $("sanasto-back").hidden = false;
  sanastoStopAudio();
  $("sanasto-speak").hidden = canOpus && !!(l.audio || (l.numSections && l.numSections.some((x) => x.card)));
  // Ohje esimerkkeinä riveittäin: "saame = suomi" -> saame lihavoituna, suomi harmaana; muu teksti sellaisenaan
  const hintLine = (x) => {
    const m = x.match(/^(.+?) = (.+)$/);
    return `<span class="sh-line">${m ? `<b>${esc(m[1])}</b> <span>${esc(m[2])}</span>` : esc(x)}</span>`;
  };
  // Ohjelaatikko: valmiin äänilistan painike (suomi + saame) ja esimerkit samassa laatikossa
  const band = l.audio && canOpus ? `<div class="list-band">${playBtn(l.audio, t("sanastoListenAll"))}<span>${esc(t("sanastoListenHint"))}</span></div>` : "";
  let html = l.hint || band ? `<div class="sanasto-hint">${band}${l.hint ? l.hint[lang].split(" · ").map(hintLine).join("") : ""}</div>` : "";
  if (l.kind === "numbers") {
    // Taulukko: numero | perusluku | järjestysluku; solussa sana ja sen alla kaiutin ja sanakortti, joten jokainen rivi on
    // samanmuotoinen. Suomen järjestyslukua ei toisteta riveillä: esimerkki on sarakeotsikossa (järjestysluku (ensimmäinen))
    // Pitkä yhdysluku saa rivittyä vain osien välistä (guokte|nuppelohkái, čuođi|guoktelogi), ei kesken osan
    // Yhdysluvun toistuvat osat (nuppelohkái, logi, čuođi) vaaleampina, jolloin vaihteleva osa erottuu: okta|nuppelohkái,
    // guokte|logi|okta. Rivitys vain osien välistä.
    let zi = 0;  // joka toinen rivi sävytetty, osion alusta alkaen
    const parts = (w) => {
      const m = (x) => `<span class="np">${x}</span>`;
      return esc(w).replace(/(.)(nuppelohkái|nuppelogát)$/, (_, a, b) => `${a}<wbr>${m(b)}`)
        .replace(/(?<!nuppe)(?<=[^>])(logi|logát)/g, (b) => `<wbr>${m(b)}<wbr>`)
        .replace(/^(čuođi)(.)/, (_, a, b) => `${m(a)}<wbr>${b}`)
        .replace(/(.)(vuosttaš|nubbi)$/, "$1<wbr>$2");
    };
    html += `<div class="num-table"><span class="nt-corner"></span><span class="nt-head"><b>${esc(t("sanastoCardinal"))}</b><small>${esc(t("sanastoCardinalEx"))}</small></span>` +
      `<span class="nt-head"><b>${esc(t("sanastoOrdinal"))}</b><small>${esc(t("sanastoOrdinalEx"))}</small></span>` +
      l.rows.map((r) => {
        const sec = (l.numSections || []).find((x) => x.from === r.n);
        if (sec) zi = 0;
        const z = zi++ % 2 ? " zebra" : "";
        // Osion otsikko: sävytetty kaistale, jossa soittopainike (kaiutin + 1–29) kummankin sarakkeen kohdalla
        return (sec ? `<div class="nt-band${canOpus && (sec.card || sec.ord) ? "" : " plain"}"><span></span>` + (canOpus && (sec.card || sec.ord)
          ? [sec.card, sec.ord].map((src) => `<span class="nt-playcell">${src ? playBtn(src, sec.playLabel || sec.label) : ""}</span>`).join("")
          : `<span class="nt-sec">${esc(sec.label)}</span>`) + `</div>` : "") +
          `<span class="nt-n${z}">${r.n}</span>` +
          `<span class="nt-cell${z}"><span class="sw main" data-say="${esc(r.card)}"${r.card_id ? ` data-id="${r.card_id}"` : ""}>${parts(r.card)}</span></span>` +
          `<span class="nt-cell${z}">${r.ord ? `<span class="sw" data-say="${esc(r.ord)}"${r.ord_id ? ` data-id="${r.ord_id}"` : ""}>${parts(r.ord)}</span>` +
            "" : ""}</span>`;
      }).join("") + `</div>`;
  } else {
    // Taulukko: suomen (norjan) muodot sarakeotsikoina saamen muotojen yläpuolella (maanantai | maanantaina),
    // murremerkintä omassa sarakkeessaan vasemmalla; sarakkeet samoissa kohdissa kaikissa laatikoissa
    const cols = Math.max(...l.rows.flatMap((r) => r.sme.map((x) => x.w.length)));
    // Yhden muodon sana (äiti = eadni) mahtuu puolikkaaseen soluun: kaksi rinnakkain, monimuotoiset koko leveydeltä
    const isOne = (r) => r.sme.length === 1 && r.sme[0].w.length === 1 && !r.sme[0].dial && (lang === "nb" ? r.nb : r.fi).filter(Boolean).length <= 1;
    const rowHtml = (r, wide) => {
      const ui = (lang === "nb" ? r.nb : r.fi).filter(Boolean);
      if (isOne(r)) {
        const note = r.note && r.note[lang] ? `<span class="sanasto-note">${esc(r.note[lang])}</span>` : "";
        return `<div class="sanasto-row one${wide ? " wide" : ""}"><span class="sg-ui">${esc(ui[0] || "")}</span>` +
          `<span class="one-w">${sanastoWord(r.sme[0].w[0], r.sme[0].id, true)}</span>${note}</div>`;
      }
      // Kolme muotoa (kuukaudet): perusmuoto lihavoituna ja suomeksi oikealla, toisella rivillä muut muodot. Pitkät
      // sanat (ođđajagemánnu) eivät mahdu kolmeen sarakkeeseen katkeamatta
      // Neljä muotoa (pronominit): taulukkorivi, saamen muodot rinnakkain ja suomen muoto kunkin alla. Ei kuvakkeita
      // (eivät mahdu): sanan napautus lukee sen, pitkä painallus avaa sanakortin
      if (cols >= 4) {
        const labels = ui.length === 1 && ui[0].includes(" · ") ? ui[0].split(" · ") : ui;
        const x = r.sme[0];
        return `<div class="sanasto-row ptab" style="--cols:${cols}">` + x.w.map((w, k) => `<span class="pt-cell"><span class="sw${k === 0 ? " main" : ""}" ` +
          `data-say="${esc(w)}"${x.id ? ` data-id="${x.id}"` : ""}>${esc(w)}</span><span class="pt-fi">${esc(labels[k] || "")}</span></span>`).join("") + `</div>`;
      }
      // Kaksi tai kolme muotoa (viikonpäivät, kuukaudet, vuodenajat, ilmansuunnat): perusmuoto lihavoituna ja suomeksi
      // oikealla, toisella rivillä muut muodot pienemmin. Murremuodot rinnakkain (vuossárga it · mánnodat lä)
      const tap = (x, w, main) => `<span class="sw${main ? " main" : ""}" data-say="${esc(w)}"${x.id ? ` data-id="${x.id}"` : ""}>${esc(w)}</span>`;
      // Murremerkintä käyttöliittymän kielellä (it/lä, norjaksi ø/v), selite listan lopussa
      const dial = (d) => t(d === "it" ? "dialEast" : "dialWest");
      const main = r.sme.map((x) => tap(x, x.w[0], true) + (x.dial ? `<span class="mr-dial">${esc(dial(x.dial))}</span>` : "")).join(`<span class="mr-sep">·</span>`);
      const forms = r.sme.flatMap((x) => x.w.slice(1).map((w) => tap(x, w))).join(" · ");
      const note = r.note && r.note[lang] ? `<span class="mr-note">${esc(r.note[lang])}</span>` : "";
      return `<div class="sanasto-row mrow"><span class="mr-main">${main}</span><span class="mr-fi">${esc(ui[0] || "")}</span>` +
        (forms ? `<span class="mr-forms">${forms}</span>` : "") + note + `</div>`;
    };
    const tapX = (x, w, main) => `<span class="sw${main ? " main" : ""}" data-say="${esc(w)}"${x.id ? ` data-id="${x.id}"` : ""}>${esc(w)}</span>`;
    const uiOf = (r) => (lang === "nb" ? r.nb : r.fi).filter(Boolean);
    const finish = () => {
      html += `${sanastoFoot()}`;
      $("sanasto-body").innerHTML = html;
      $("sanasto-body").scrollTop = 0;
    };
    // Ilmansuunnat kompassina: pohjoinen ylhäällä, etelä alhaalla, itä oikealla, länsi vasemmalla
    if (l.id === "suunnat") {
      const pos = ["n", "s", "e", "w"];
      html += `<div class="compass"><div class="cmp-rose" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/>` +
        `<path class="cmp-n" d="M50 10 L58 50 L50 50 Z M50 10 L42 50 L50 50 Z"/><path class="cmp-s" d="M50 90 L58 50 L50 50 Z M50 90 L42 50 L50 50 Z"/>` +
        `<path class="cmp-ew" d="M10 50 L50 45 L50 55 Z M90 50 L50 45 L50 55 Z"/></svg></div>` +
        l.rows.map((r, k) => {
          const x = r.sme[0], ui = uiOf(r);
          return `<div class="cmp-dir cmp-${pos[k]}"><span class="cmp-sme">${tapX(x, x.w[0], true)}</span><span class="cmp-fi">${esc(ui[0] || "")}</span>` +
            `<span class="cmp-forms">${x.w.slice(1).map((w) => tapX(x, w)).join(" · ")}</span></div>`;
        }).join("") + `</div>`;
      return finish();
    }
    // Värit: värinäyte sanan edessä, kaksi rinnakkain; toisella rivillä attribuuttimuoto (rukses dállu), jos se eroaa
    if (l.id === "varit") {
      const SWATCH = { vielgat: "#ffffff", "čáhppat": "#111111", ruoksat: "#dc2626", alit: "#2563eb", "ruoná": "#16a34a",
        fiskat: "#facc15", "ruškat": "#8b5a2b", "ránis": "#9ca3af", "oránša": "#f97316" };
      html += `<div class="colour-grid">` + l.rows.map((r) => {
        // Toisella rivillä esimerkki attribuuttimuodosta käännöksineen (vilges muohta · valkoinen lumi); koko ilmaus avaa kuplan
        const x = r.sme[0], ui = uiOf(r), ex = r.ex;
        return `<div class="colour" style="--c:${SWATCH[x.w[0]] || "transparent"}"><span class="col-sw"></span><span class="col-txt">` +
          `<span class="col-sme">${tapX(x, x.w[0], true)}</span>` +
          (ex ? `<span class="col-ex"><span class="sw" data-say="${esc(ex.sme)}">${esc(ex.sme)}</span> <span class="col-ex-fi">${esc(ex[lang] || ex.fi)}</span></span>` : "") +
          `</span><span class="col-fi">${esc(ui[0] || "")}</span></div>`;
      }).join("") + `</div>`;
      return finish();
    }
    const nbi = lang === "nb" ? 1 : 0;
    const byLemma = () => Object.fromEntries(l.rows.map((r) => [r.sme[0].w[0], r]));
    // Perhe ja suku sukupuuna: isovanhemmat, isän ja äidin puoli (omine sisarussanoineen), sinä ja sisarukset, lapset
    if (l.id === "suku") {
      const by = byLemma();
      const KIN = { "siessá": ["sisar", "søster"], eahki: ["vanhempi veli", "eldre bror"], "čeahci": ["nuorempi veli", "yngre bror"],
        goaski: ["vanhempi sisar", "eldre søster"], "muoŧŧá": ["nuorempi sisar", "yngre søster"], eanu: ["veli", "bror"] };
      const CAP = { gp: ["Isovanhemmat", "Besteforeldre"], fs: ["Isän puoli", "Fars side"], ms: ["Äidin puoli", "Mors side"],
        me: ["Sinä ja sisarukset", "Du og søsken"], kids: ["Lapset", "Barn"], gk: ["Lapsenlapset", "Barnebarn"], you: ["sinä", "du"] };
      const cap = (k) => `<span class="kt-cap">${esc(CAP[k][nbi])}</span>`;
      const node = (lemma, cls = "") => {
        const r = by[lemma];
        if (!r) return "";
        const lab = KIN[lemma] ? KIN[lemma][nbi] : uiOf(r)[0];
        return `<div class="kt-node ${cls}"><span class="kt-sme">${tapX(r.sme[0], lemma, true)}</span><span class="kt-fi">${esc(lab || "")}</span></div>`;
      };
      html += `<div class="kin-tree"><div class="kt-level">${cap("gp")}<div class="kt-row">${node("áhkku")}${node("áddjá")}</div></div>` +
        `<div class="kt-sides"><div class="kt-side f">${cap("fs")}${node("áhčči", "parent")}<div class="kt-sib">${node("siessá")}${node("eahki")}${node("čeahci")}</div></div>` +
        `<div class="kt-side m">${cap("ms")}${node("eadni", "parent")}<div class="kt-sib">${node("goaski")}${node("muoŧŧá")}${node("eanu")}</div></div></div>` +
        `<div class="kt-level">${cap("me")}<div class="kt-row wrap"><div class="kt-node you"><span class="kt-sme">${esc(CAP.you[nbi])}</span></div>` +
        `${node("oabbá")}${node("viellja")}${node("oappáš")}${node("vieljaš")}</div></div>` +
        `<div class="kt-level">${cap("kids")}<div class="kt-row">${node("mánná")}${node("nieida")}${node("bárdni")}</div></div>` +
        `<div class="kt-level">${cap("gk")}<div class="kt-row">${node("mánáidmánná")}</div></div></div>`;
      return finish();
    }
    // Tervehdykset keskusteluna: puhekuplat parittain (tervehdys ja vastaus), muut ilmaukset siruina
    if (l.id === "tervehdykset") {
      const by = byLemma();
      // Vastaus, jota ei ole listassa omana rivinään (Bures! -> Bures bures!)
      const REPLY = { "Bures bures!": ["hei hei", "hei hei"] };
      const bubble = (lemma, side) => {
        const r = by[lemma];
        if (!r && REPLY[lemma]) {
          return `<div class="cv-b ${side}"><span class="cv-sme"><span class="sw main" data-say="${esc(lemma)}">${esc(lemma)}</span></span>` +
            `<span class="cv-fi">${esc(REPLY[lemma][nbi])}</span></div>`;
        }
        return r ? `<div class="cv-b ${side}"><span class="cv-sme">${tapX(r.sme[0], lemma, true)}</span><span class="cv-fi">${esc(uiOf(r)[0] || "")}</span></div>` : "";
      };
      // Puhujat: vasemmalla poika (äänilistassa Máhtte), oikealla tyttö (Biret), molemmilla gákti
      const face = (side) => `<span class="cv-face ${side}" aria-hidden="true">${side === "l" ? FACE_BOY : FACE_GIRL}</span>`;
      const line = (lemma, side) => { const b = bubble(lemma, side); return b ? `<div class="cv-line ${side}">${face(side)}${b}</div>` : ""; };
      const DIALOG = [["Bures!", "Bures bures!", "Tavatessa", "Når man møtes"], ["Mo manná?", "Bures manná", "Kuulumiset", "Hvordan går det"],
        ["Bures boahtin", "Giitu", "Vieraan tullessa", "Når noen kommer"], ["Báze dearvan", "Mana dearvan", "Lähtiessä: lähtijä ja jäävä", "Ved avskjed: den som går og den som blir"]];
      const used = new Set(DIALOG.flatMap((d) => [d[0], d[1]]));
      html += DIALOG.map((d) => `<div class="cv"><span class="kt-cap">${esc(d[2 + nbi])}</span>${line(d[0], "l")}${line(d[1], "r")}</div>`).join("") +
        `<div class="cv-more">${l.rows.filter((r) => !used.has(r.sme[0].w[0])).map((r) =>
          `<div class="cv-chip"><span class="cv-sme">${tapX(r.sme[0], r.sme[0].w[0], true)}</span><span class="cv-fi">${esc(uiOf(r)[0] || "")}</span></div>`).join("")}</div>`;
      return finish();
    }
    // Porot: poron elämä vasasta aikuiseksi (vasa, ensimmäinen talvi, sitten kaksi kaistaa urokset | naaraat), alla porot ja tokka
    if (l.id === "porot") {
      const by = byLemma();
      const node = (lemma) => {
        const r = by[lemma];
        return r ? `<div class="rd-node"><span class="kt-sme">${tapX(r.sme[0], lemma, true)}</span><span class="kt-fi">${esc(uiOf(r)[0] || "")}</span></div>` : "<div></div>";
      };
      const CAP = { life: ["Vasasta aikuiseksi", "Fra kalv til voksen"], m: ["Urokset", "Hanndyr"], f: ["Naaraat", "Hunndyr"], herd: ["Porot ja tokka", "Rein og flokk"] };
      html += `<section class="sl-sec"><h3>${esc(CAP.life[nbi])}</h3><div class="rd-life"><div class="rd-calf">${node("miessi")}</div>` +
        // čearpmat = vasa ensimmäisenä talvenaan (kumpaa tahansa sukupuolta), sitten toisen ikävuoden varit | vuonjal
        `<div class="rd-calf">${node("čearpmat")}</div>` +
        `<span class="rd-lane m">♂ ${esc(CAP.m[nbi])}</span><span class="rd-lane f">♀ ${esc(CAP.f[nbi])}</span>` +
        `${node("varit")}${node("vuonjal")}${node("sarvvis")}${node("áldu")}${node("heargi")}${node("rotnu")}</div></section>` +
        `<section class="sl-sec"><h3>${esc(CAP.herd[nbi])}</h3><div class="ico-grid">${["boazu", "eallu", "gárdi"].map((w) => node(w).replace("rd-node", "ico-tile rd-herd")).join("")}</div></section>`;
      return finish();
    }
    // Sää ja lumi: säätiilet kuvakkeineen ja lumisanat omana sinisenä korttinaan
    if (l.id === "saa") {
      const W = {
        "dálki": '<path d="M8 15a4 4 0 0 1 .5-8A5 5 0 0 1 18 9a3 3 0 0 1-1 6z"/><path d="M15 4l1-1.5M19.5 6.5L21 6"/>',
        "beaivváš": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        balva: '<path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 10a4 4 0 0 1-.5 8z"/>',
        arvi: '<path d="M7 14a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 6a4 4 0 0 1-.5 8z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
        biegga: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8"/>',
        stoarbma: '<path d="M3 7h10a3 3 0 1 0-3-3M3 11h14a3 3 0 1 1-3 3M3 15h7M3 19h11"/>',
        "baján": '<path d="M7 13a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 5a4 4 0 0 1-.5 8"/><path d="M12 11l-3 5h4l-2 5"/>',
        "mierká": '<path d="M4 8h16M2 12h20M4 16h16M7 20h10"/>',
        "njáhcu": '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>',
        "buolaš": '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
        liekkas: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
        galmmas: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 15v1"/>',
      };
      const tile = (r, snow) => `<div class="ico-tile${snow ? " snow" : ""}">${W[r.sme[0].w[0]] ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
        `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${W[r.sme[0].w[0]]}</svg>` : ""}<span class="it-txt">` +
        `<span class="it-sme">${tapX(r.sme[0], r.sme[0].w[0], true)}</span><span class="it-fi">${esc(uiOf(r)[0] || "")}</span></span></div>`;
      const secs = l.sections || [{}, {}];
      html += `<section class="sl-sec"><h3>${esc(secs[0][lang] || "")}</h3><div class="ico-grid">${l.rows.filter((r) => !r.sec).map((r) => tile(r)).join("")}</div></section>` +
        `<section class="snow-card"><h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">` +
        `<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/></svg>${esc(secs[1][lang] || "")}</h3>` +
        `<div class="snow-grid">${l.rows.filter((r) => r.sec === 1).map((r) => `<div class="snow-w"><span class="it-sme">${tapX(r.sme[0], r.sme[0].w[0], true)}</span>` +
          `<span class="it-fi">${esc(uiOf(r)[0] || "")}</span></div>`).join("")}</div></section>`;
      return finish();
    }
    // Kysymyssanat: kortti, jossa kysymyssana isona ja esimerkkikysymys käännöksineen
    if (l.id === "kysymykset") {
      const secs = l.sections || [{}];
      html += secs.map((sec, i) => `<section class="sl-sec">${sec[lang] ? `<h3>${esc(sec[lang])}</h3>` : ""}<div class="q-list">` +
        l.rows.filter((r) => (r.sec || 0) === i).map((r) => `<div class="q-card"><div class="q-word"><span class="q-sme">${tapX(r.sme[0], r.sme[0].w[0], true)}</span>` +
          `<span class="q-fi">${esc(uiOf(r)[0] || "")}</span></div>` + (r.ex ? `<div class="q-ex"><span class="sw" data-say="${esc(r.ex.sme)}">${esc(r.ex.sme)}</span>` +
          `<span class="q-ex-fi">${esc(r.ex[lang] || r.ex.fi)}</span></div>` : "") + `</div>`).join("") + `</div></section>`).join("");
      return finish();
    }
    // Vuorokausi: päivän kierto taivaan väreinä aamusta yöhön, kulmassa aurinko tai kuu; muut osiot tavallisina
    const rays = (cx, cy, r1, r2, n) => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI;
      return `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}" x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}"/>`;
    }).join("");
    const stars = (pts) => pts.map(([x, y, r]) => `<circle class="star" cx="${x}" cy="${y}" r="${r}"/>`).join("");
    const DAY_ART = [
      `<path class="sun" d="M18 58a22 22 0 0 1 44 0z"/><g class="ray">${rays(40, 58, 27, 35, 14).split("<line").filter((l, i) => i && i > 7).map((l) => "<line" + l).join("")}</g><line class="hz" x1="4" y1="58" x2="76" y2="58"/>`,
      `<circle class="sun" cx="44" cy="40" r="15"/><g class="ray">${rays(44, 40, 20, 27, 10)}</g>`,
      `<circle class="sun" cx="52" cy="22" r="13"/><g class="ray">${rays(52, 22, 17, 24, 12)}</g>`,
      `<circle class="sun" cx="48" cy="48" r="13"/><g class="ray">${rays(48, 48, 17, 23, 9)}</g>`,
      `<path class="sun" d="M16 54a24 24 0 0 1 48 0z"/><line class="hz" x1="4" y1="54" x2="76" y2="54"/><g class="wave"><line x1="22" y1="61" x2="58" y2="61"/><line x1="30" y1="67" x2="50" y2="67"/></g>`,
      `<path class="moon" d="M52 16a24 24 0 1 0 14 40a19 19 0 1 1 -14 -40z"/>${stars([[18, 18, 1.6], [28, 34, 1.1], [14, 50, 1.3], [66, 14, 1]])}`,
      `<circle class="moon" cx="50" cy="34" r="17"/><circle class="crater" cx="44" cy="30" r="3.5"/><circle class="crater" cx="55" cy="40" r="2.5"/>${stars([[14, 16, 1.4], [24, 44, 1.1], [12, 62, 1.5], [72, 60, 1.2], [30, 22, 1], [70, 12, 1.1]])}`,
    ];
    // Vuodenajat: vuoden kierto ruudukkona, pääkausi riveittäin omalla värillään (giđđadálvi | giđđa, ...)
    if (l.id === "vuodenajat") {
      // Pääkauden kuvake kulmassa: verso, aurinko, lehti, lumihiutale
      const SEASON_ICON = [
        '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 7-7 0 4-3 7-7 7z"/><path d="M12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"/>',
        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
        '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/>',
      ];
      html += `<div class="season-grid">` + l.rows.map((r, k) => {
        const x = r.sme[0], ui = lang === "nb" ? r.nb : r.fi;
        const tap = (w, main) => `<span class="sw${main ? " main" : ""}" data-say="${esc(w)}"${x.id ? ` data-id="${x.id}"` : ""}>${esc(w)}</span>`;
        return `<div class="season s${r.sec || 0}${k % 2 ? " main" : ""}"><svg class="se-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
          `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SEASON_ICON[r.sec || 0]}</svg><span class="se-fi">${esc(ui[0] || "")}</span><span class="se-sme">${tap(x.w[0], true)}</span>` +
          `<span class="se-form">${x.w.slice(1).map((w) => tap(w)).join(" · ")}</span>${ui[1] ? `<span class="se-ui">${esc(ui[1])}</span>` : ""}` +
          (r.note && r.note[lang] ? `<span class="se-note">${esc(r.note[lang])}</span>` : "") + `</div>`;
      }).join("") + `</div>`;
      html += `${sanastoFoot()}`;
      $("sanasto-body").innerHTML = html;
      $("sanasto-body").scrollTop = 0;
      return;
    }
    // Osiot (sanastot.py SECTIONS): jokainen oma korttinsa otsikkoineen; rivit kortin sisällä ohuin viivoin erotettuina
    const secs = l.sections || [{}];
    html += secs.map((sec, i) => {
      const rows = l.rows.filter((r) => (r.sec || 0) === i);
      if (!rows.length) return "";
      // Parittoman yhden muodon jakson viimeinen solu koko leveydelle, ettei ruudukkoon jää tyhjää koloa
      const wide = rows.map(() => false);
      for (let k = 0, run = 0; k <= rows.length; k++) {
        if (k < rows.length && isOne(rows[k])) { run++; continue; }
        if (run % 2) wide[k - 1] = true;
        run = 0;
      }
      // Päivät aikajanana: eilen → tänään (korostettu) → huomenna, ja "nyt" omana sirunaan
      if (l.id === "aika" && i === 1) {
        const by = Object.fromEntries(rows.map((r) => [r.sme[0].w[0], r]));
        const step = (lemma, cls) => {
          const r = by[lemma];
          return r ? `<div class="tl-step ${cls}"><span class="tl-fi">${esc(uiOf(r)[0] || "")}</span><span class="tl-sme">${tapX(r.sme[0], lemma, true)}</span></div>` : "";
        };
        const now = by["dál"];
        return `<section class="sl-sec">${sec[lang] ? `<h3>${esc(sec[lang])}</h3>` : ""}<div class="timeline">${step("ikte", "past")}<span class="tl-arrow" aria-hidden="true">→</span>` +
          `${step("odne", "today")}<span class="tl-arrow" aria-hidden="true">→</span>${step("ihttin", "next")}</div>` +
          (now ? `<div class="tl-now"><span class="tl-dot" aria-hidden="true"></span><span class="tl-sme">${tapX(now.sme[0], "dál", true)}</span><span class="tl-fi">${esc(uiOf(now)[0] || "")}</span></div>` : "") + `</section>`;
      }
      // Kello ja aika: kuvakkeelliset tiilet (viikko, tunti, minuutti, monelta?)
      if (l.id === "aika" && i === 2) {
        const ICON = {
          vahkku: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
          diibmu: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
          minuhtta: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M10 2h4M19 6l1.5-1.5"/>',
          galles: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01"/>',
        };
        return `<section class="sl-sec">${sec[lang] ? `<h3>${esc(sec[lang])}</h3>` : ""}<div class="ico-grid">` + rows.map((r) => {
          const x = r.sme[0];
          return `<div class="ico-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
            `${ICON[x.w[0]] || ""}</svg><span class="it-txt"><span class="it-sme">${tapX(x, x.w[0], true)}</span><span class="it-fi">${esc(uiOf(r)[0] || "")}</span></span></div>`;
        }).join("") + `</div></section>`;
      }
      if (l.id === "aika" && i === 0) {
        return `<section class="sl-sec">${sec[lang] ? `<h3>${esc(sec[lang])}</h3>` : ""}<div class="day-grid">` + rows.map((r, k) => {
          const x = r.sme[0], ui = uiOf(r);
          return `<div class="day d${k}">${DAY_ART[k] ? `<svg class="day-art" viewBox="0 0 80 80" aria-hidden="true">${DAY_ART[k]}</svg>` : ""}<span class="day-fi">${esc(ui[0] || "")}</span><span class="day-sme">${tapX(x, x.w[0], true).replace(/>maŋŋel/, ">maŋŋel<wbr>")}</span>` +
            `<span class="day-form">${x.w.slice(1).map((w) => tapX(x, w)).join(" · ")}${ui[1] ? ` <span class="day-ui">${esc(ui[1])}</span>` : ""}</span></div>`;
        }).join("") + `</div></section>`;
      }
      return `<section class="sl-sec">${sec[lang] ? `<h3>${esc(sec[lang])}</h3>` : ""}<div class="sl-card">${rows.map((r, k) => rowHtml(r, wide[k])).join("")}</div></section>`;
    }).join("");
  }
  if (l.rows.some((r) => (r.sme || []).some((x) => x.dial))) html += `<p class="sanasto-hint">${esc(t("dialLegend"))}</p>`;
  html += `${sanastoFoot()}`;
  $("sanasto-body").innerHTML = html;
  $("sanasto-body").scrollTop = 0;
}

// Koko listan perusmuodot ääneen yhtenä pyyntönä (pilkut tuovat tauot)
// Valmis äänilista (kuukaudet: suomi Harri, saame Biret). Soidessa kaiutin vaihtuu pysäytyskuvakkeeseen, jonka ympärillä
// kehä täyttyy soiton edetessä; uusi painallus pysäyttää ja palauttaa kaiuttimen.
const STOP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>';
const RING = '<svg class="play-ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" pathLength="100"/></svg>';
let sanastoAudio = null, sanastoAudioBtn = null, sanastoAudioHtml = null;
// Ogg Opus (puheelle paras pakkaus). Safari ennen versiota 17 ei soita sitä: silloin kaiutin lukee saamen sanat kuten muissa listoissa
const canOpus = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="opus"'); } catch { return false; } })();
// Lukutaulukon osion soittopainike (perusluvut / järjestysluvut)
const playBtn = (src, label) => `<button type="button" class="nt-play" data-audio="${esc(src)}" aria-label="${esc(t("listen"))} ${esc(label)}">` +
  `<span class="pl-ico">${SPEAK_ICON}</span><span>${esc(label)}</span></button>`;

function sanastoStopAudio() {
  if (!sanastoAudio) return;
  const a = sanastoAudio, b = sanastoAudioBtn;
  sanastoAudio = sanastoAudioBtn = null;
  // Puhepalvelun haku kesken (lista ilman valmista äänitettä): perutaan
  if (a === ttsAudio && ttsRequest) ttsRequest.abort();
  a.pause();
  if (a.src.startsWith("blob:")) URL.revokeObjectURL(a.src);
  // Vapautetaan mediasoitin heti (Android WebView sallii vain rajallisen määrän soittimia ennen roskienkeruuta)
  a.removeAttribute("src");
  a.load();
  b.classList.remove("playing");
  (b.querySelector(".pl-ico") || b).innerHTML = sanastoAudioHtml;
  b.setAttribute("aria-label", b.dataset.label || t("listen"));
}

// Painike soittotilaan: pysäytyskuvake ja kehä (odottaessa kehä pyörii, soidessa se täyttyy)
function sanastoBeginAudio(a, b, pending) {
  sanastoAudio = a;
  sanastoAudioBtn = b;
  const host = b.querySelector(".pl-ico") || b;
  sanastoAudioHtml = host.innerHTML;
  b.dataset.label = b.getAttribute("aria-label") || t("listen");
  host.innerHTML = STOP_ICON + RING;
  if (pending) host.querySelector(".play-ring").classList.add("pending");
  b.classList.add("playing");
  b.setAttribute("aria-label", t("stop"));
}

// Soitto ja edistymiskehä. Käsittelijät ominaisuuksina (onended), koska puhepalvelun soitin on yhteinen eikä
// kuuntelijoita saa kertyä siihen.
function sanastoRunAudio(a, b, durKey) {
  const ring = b.querySelector(".play-ring");
  ring.classList.remove("pending");
  const circle = ring.querySelector("circle");
  const tick = () => {
    if (sanastoAudio !== a) return;
    const d = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : sanastoDur[durKey];
    if (d) circle.style.strokeDashoffset = String(Math.max(0, 100 - (100 * a.currentTime) / d));
    requestAnimationFrame(tick);
  };
  a.onended = a.onerror = () => { if (sanastoAudio === a) sanastoStopAudio(); };
  a.play().then(tick).catch(() => { if (sanastoAudio === a) sanastoStopAudio(); });
}

function sanastoPlayAudio(src, b) {
  // Norjankielinen käyttöliittymä: pelkkä saame (…-sme.ogg), ei suomenkielistä sanaa ennen saamea
  if (sanastoLang() === "nb") src = src.replace(/\.ogg$/, "-sme.ogg");
  const a = new Audio(src);
  sanastoBeginAudio(a, b, false);
  sanastoRunAudio(a, b, src);
}

// Lista ilman valmista äänitettä: saamen sanat Divvunin puhepalvelulta (yhteinen soitin, avataan jo napautuksessa)
function sanastoPlayTts(text, b) {
  const signal = startTtsRequest();
  unlockTtsAudio();
  const a = ttsAudio || new Audio();
  sanastoBeginAudio(a, b, true);
  ttsBlob(text, signal).then((blob) => {
    if (sanastoAudio !== a || !blob) return;
    a.src = URL.createObjectURL(blob);
    sanastoRunAudio(a, b, null);
  }).catch((e) => {
    if (sanastoAudio !== a) return;
    sanastoStopAudio();
    toast(t("ttsFailed", e.message));
  });
}

function sanastoSpeakAll() {
  const l = sanastot.find((x) => x.id === sanastoAuki);
  if (!l) return;
  if (sanastoAudio) {
    const mine = sanastoAudioBtn === $("sanasto-speak");
    sanastoStopAudio();
    if (mine) return;
  }
  if (l.audio && canOpus) return sanastoPlayAudio(l.audio, $("sanasto-speak"));
  const words = l.kind === "numbers" ? l.rows.map((r) => r.card) : l.rows.map((r) => r.sme[0].w[0]);
  sanastoPlayTts(words.join(", "), $("sanasto-speak"));
}

function sanastoOpenCard(id, word) {
  sanastoStopAudio();
  closeFormPop();
  const index = queryDatabase(word).findIndex((r) => r.id === Number(id));
  sanastoCardHash = null;
  $("sanasto-view").hidden = true;
  search(word, Math.max(index, 0));
  sanastoReturnHash = location.hash;
}

function bindSanastot() {
  if (!$("sanasto-view")) return;
  $("sanasto-btn").onclick = openSanastot;
  $("sanasto-close").onclick = () => { sanastoStopAudio(); closeFormPop(); hideSanastot(); };
  $("sanasto-back").onclick = () => { sanastoStopAudio(); sanastoAuki = null; renderSanastoGrid(); };
  $("sanasto-speak").onclick = sanastoSpeakAll;
  // Esc avoimessa ikkunassa (virheilmoitus) sulkee vain ikkunan, ei listaa sen takana
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) closeSanastot(); });
  // Sovellus taustalle (kotinäppäin, näyttö kiinni): äänilista pysähtyy, ettei se jää soimaan ilman pysäytyspainiketta
  document.addEventListener("visibilitychange", () => { if (document.hidden) sanastoStopAudio(); });
  const closeOcrBase = window.closeOcr;
  // Androidin takaisin-ele: ensin avoin ikkuna (esim. virheilmoitus), sitten sanastot
  const closeDialog = () => { const d = document.querySelector("dialog[open]"); if (d) d.close(); return !!d; };
  window.closeOcr = () => closeDialog() || closeSanastot() || (closeOcrBase ? closeOcrBase() : false);
  const backBase = window.backToOcr;
  window.backToOcr = () => {
    if (sanastoReturnHash && location.hash === sanastoReturnHash) {
      sanastoCardHash = sanastoReturnHash;
      sanastoReturnHash = null;
      openSanastot();
      return true;
    }
    return backBase ? backBase() : false;
  };
  // Selaimen takaisin-painike (verkkosovellus): Android hoitaa saman backToOcr:llä ennen historiaa
  window.addEventListener("popstate", () => {
    sanastoStopAudio();
    if (sanastoReturnHash && location.hash !== sanastoReturnHash) { sanastoReturnHash = null; openSanastot(); }
  });
  let press = null, longDone = false;
  const body = $("sanasto-body");
  body.addEventListener("pointerdown", (e) => {
    const w = e.target.closest(".sw[data-id]");
    longDone = false;
    if (!w) return;
    press = setTimeout(() => { longDone = true; sanastoOpenCard(w.dataset.id, w.dataset.say); }, 550);
  });
  const cancel = () => { clearTimeout(press); press = null; };
  body.addEventListener("pointerup", cancel);
  body.addEventListener("pointerleave", cancel);
  body.addEventListener("pointercancel", cancel);
  body.addEventListener("contextmenu", (e) => { if (e.target.closest(".sw")) e.preventDefault(); });
  body.addEventListener("click", (e) => {
    const tile = e.target.closest(".sanasto-tile");
    if (tile) return renderSanasto(tile.dataset.list);
    if (e.target.closest(".sanasto-report-link")) { e.preventDefault(); return sanastoReport(); }
    const play = e.target.closest(".nt-play");
    if (play) {
      const same = sanastoAudioBtn === play;
      sanastoStopAudio();
      if (!same) sanastoPlayAudio(play.dataset.audio, play);
      return;
    }
    // Sanan napautus avaa kuplan (kuuntele, kopioi, sanakortti); uusi napautus samaan sanaan sulkee sen
    const w = e.target.closest(".sw");
    if (!w || longDone) return;
    sanastoStopAudio();
    if (w === formPopTarget) closeFormPop(); else sanastoOpenPop(w);
  });
  // Kuplan sanakorttipainike (kuuntelu ja kopiointi: app.js bindFormPop)
  $("form-pop").addEventListener("click", (e) => {
    const w = formPopTarget;
    if (!e.target.closest(".b-open") || !w || !w.closest("#sanasto-body")) return;
    closeFormPop();
    sanastoOpenCard(w.dataset.id, w.dataset.say);
  });
}

// Sanakortin muodon kupla (app.js: #form-pop) myös sanastojen sanoille, lisänä sanakortin avaus
function sanastoOpenPop(w) {
  closeFormPop();
  const pop = $("form-pop");
  formPopTarget = w;
  sanastoLastWord = w.dataset.say;
  w.dataset.speak = w.dataset.say;
  w.classList.add("picked");
  pop.innerHTML = `<span class="b-word">${esc(w.dataset.say)}</span>`
    + `<button class="b-speak" aria-label="${esc(t("listenTo", w.dataset.say))}">${SPEAK_ICON}</button>`
    + `<button class="b-copy" aria-label="${esc(t("copy"))}">${COPY_ICON}</button>`
    + (w.dataset.id ? `<button class="b-open" aria-label="${esc(t("sanastoCard"))}">${OPEN_ICON}</button>` : "");
  pop.hidden = false;
  placeFormPop();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindSanastot); else bindSanastot();
