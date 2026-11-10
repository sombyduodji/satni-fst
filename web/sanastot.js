// Sanastot: aihekohtaiset sanalistat (luvut, viikonpäivät, kuukaudet ...). Aineisto data/sanastot.json (sanastot.py:
// sanakirjasta ja GiellaLT-malleista, Divvunin oikoluvulla tarkistettu). Ylätunnisteen kirjapainike avaa näkymän;
// saamen sanan napautus lukee sen ääneen, pitkä painallus avaa sanakortin (takaisin-ele palaa listaan).

let sanastot = null;          // listat, ladataan ensimmäisellä avauksella
let sanastoAuki = null;       // avoimen listan id tai null (yleisnäkymä)
let sanastoReturnHash = null; // listasta avatun sanakortin osoite: takaisin-ele palaa listaan

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
  if (!sanastot) sanastot = (await (await fetch("data/sanastot.json")).json()).lists;
  return sanastot;
}

function openSanastot() {
  $("sanasto-view").hidden = false;
  loadSanastot().then(() => (sanastoAuki ? renderSanasto(sanastoAuki) : renderSanastoGrid()))
    .catch(() => { $("sanasto-body").textContent = t("loadFailed", "sanastot.json"); });
}

// Takaisin-ele ja Esc: ensin lista -> yleisnäkymä, sitten näkymä kiinni
function closeSanastot() {
  if ($("sanasto-view").hidden) return false;
  if (sanastoAuki) { sanastoAuki = null; renderSanastoGrid(); } else $("sanasto-view").hidden = true;
  return true;
}

function renderSanastoGrid() {
  const lang = sanastoLang();
  $("sanasto-title").textContent = t("sanastot");
  $("sanasto-back").hidden = true;
  $("sanasto-speak").hidden = true;
  $("sanasto-body").innerHTML = `<div class="sanasto-grid">` + sanastot.map((l) =>
    `<button type="button" class="sanasto-tile" data-list="${esc(l.id)}">${sanastoSvg(l.icon)}<span>${esc(l.title[lang])}</span></button>`).join("") + `</div>`;
  $("sanasto-body").scrollTop = 0;
}

// Saamen sana: napautus lukee ääneen, pitkä painallus avaa sanakortin
const sanastoWord = (w, id, main) => `<span class="sw${main ? " main" : ""}" data-say="${esc(w)}"${id ? ` data-id="${id}"` : ""}>${esc(w)}</span>`;

function renderSanasto(listId) {
  const lang = sanastoLang();
  const l = sanastot.find((x) => x.id === listId);
  if (!l) return renderSanastoGrid();
  sanastoAuki = listId;
  $("sanasto-title").textContent = l.title[lang];
  $("sanasto-back").hidden = false;
  $("sanasto-speak").hidden = false;
  let html = l.hint ? `<p class="sanasto-hint">${esc(l.hint[lang])}</p>` : "";
  if (l.kind === "numbers") {
    html += l.rows.map((r) => `<div class="sanasto-row num"><span class="sanasto-n">${r.n}</span><div>` +
      `<div class="sme-line">${sanastoWord(r.card, r.card_id, true)}</div>` +
      `<div class="sub-line">${r.n}. ${r.ord ? sanastoWord(r.ord, r.ord_id) : ""}${(lang === "nb" ? r.nb_ord : r.fi_ord) ? ` · ${esc(lang === "nb" ? r.nb_ord : r.fi_ord)}` : ""}</div></div></div>`).join("");
  } else {
    html += l.rows.map((r) => {
      const ui = (lang === "nb" ? r.nb : r.fi).filter(Boolean).join(" · ");
      const smes = r.sme.map((s) => `<div class="sme-line">${s.w.map((w, k) => sanastoWord(w, k === 0 ? s.id : null, k === 0)).join(" · ")}` +
        (s.dial ? `<span class="sanasto-dial">${esc(s.dial)}</span>` : "") + `</div>`).join("");
      const note = r.note && r.note[lang] ? `<div class="sanasto-note">${esc(r.note[lang])}</div>` : "";
      return `<div class="sanasto-row"><div class="ui-line">${esc(ui)}</div>${smes}${note}</div>`;
    }).join("");
  }
  html += `<p class="sanasto-hint">${esc(t("sanastoHelp"))}</p>`;
  $("sanasto-body").innerHTML = html;
  $("sanasto-body").scrollTop = 0;
}

// Koko listan perusmuodot ääneen yhtenä pyyntönä (pilkut tuovat tauot)
function sanastoSpeakAll() {
  const l = sanastot.find((x) => x.id === sanastoAuki);
  if (!l) return;
  const words = l.kind === "numbers" ? l.rows.map((r) => r.card) : l.rows.map((r) => r.sme[0].w[0]);
  speak(words.join(", "), $("sanasto-speak"));
}

function sanastoOpenCard(id, word) {
  const index = queryDatabase(word).findIndex((r) => r.id === Number(id));
  $("sanasto-view").hidden = true;
  search(word, Math.max(index, 0));
  sanastoReturnHash = location.hash;
}

function bindSanastot() {
  if (!$("sanasto-view")) return;
  $("sanasto-btn").onclick = openSanastot;
  $("sanasto-close").onclick = () => { $("sanasto-view").hidden = true; };
  $("sanasto-back").onclick = () => { sanastoAuki = null; renderSanastoGrid(); };
  $("sanasto-speak").onclick = sanastoSpeakAll;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSanastot(); });
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => closeSanastot() || (closeOcrBase ? closeOcrBase() : false);
  const backBase = window.backToOcr;
  window.backToOcr = () => {
    if (sanastoReturnHash && location.hash === sanastoReturnHash) {
      sanastoReturnHash = null;
      openSanastot();
      return true;
    }
    return backBase ? backBase() : false;
  };
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
    const w = e.target.closest(".sw");
    if (w && !longDone) speak(w.dataset.say, null);
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindSanastot); else bindSanastot();
