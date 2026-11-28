// Ladataan heti <head>-osassa (index.html), ennen piirtämistä. Erillisenä tiedostona eikä sivun sisällä, jotta
// sisällön suojauskäytäntö (CSP) voi kieltää sivun sisäiset skriptit.
// Teema ja kieli heti ennen piirtämistä, ettei sivu välähdä väärän värisenä
try {
  const s = JSON.parse(localStorage.getItem("satni-settings") || "{}");
  if (s.theme === "light" || s.theme === "dark") document.documentElement.dataset.theme = s.theme;
  if (s.uiLang === "nb" || s.uiLang === "en") document.documentElement.lang = s.uiLang;
} catch (e) {}
// Android-sovellus jättää tilarivin tilan itse (MainActivity): yläpalkki ei lisää sitä toista kertaa
if (location.hostname === "appassets.androidplatform.net") document.documentElement.classList.add("android-app");
// Liian vanha selainmoottori (esim. Android 7–9:n alkuperäinen Android System WebView 69; tarvitaan Chrome/WebView 97+):
// app.js ei jäsenny, ja sivu jäisi ikuisesti "Ladataan sanakirjaa…" -tilaan ilman syytä (yötesti 2026-11-21, Android 9
// -emulaattori). Kerrotaan syy ja keino. Tämä tiedosto on tarkoituksella vanhaa JavaScriptiä (ES5), jotta se toimii siellä.
(function () {
  var shown = false;
  function show() {
    if (shown) return;
    var h = document.querySelector("#loading h2"), p = document.getElementById("loading-text");
    if (!h || !p) return;
    shown = true;
    h.removeAttribute("data-i18n"); p.removeAttribute("data-i18n");
    var lang = document.documentElement.lang;
    // Ensimmäinen käynnistys (kieltä ei vielä valittu): laitteen kieli, ettei englannin- tai norjankielinen puhelin saa
    // ilmoitusta suomeksi (yötesti 2026-11-24, Android 9 -emulaattori en-US); suomi ja saame kuten ennen suomeksi
    try {
      if (!JSON.parse(localStorage.getItem("satni-settings") || "{}").uiLang) {
        var nl = String(navigator.language || "").toLowerCase();
        lang = /^(nb|nn|no)\b/.test(nl) ? "nb" : /^(fi|se|smn|sms)\b/.test(nl) || !nl ? "fi" : "en";
      }
    } catch (e) {}
    var nb = lang === "nb", en = lang === "en", app = location.hostname === "appassets.androidplatform.net";
    h.textContent = nb ? "Nettleseren er for gammel" : en ? "Your browser is too old" : "Selain on liian vanha";
    p.textContent = nb
      ? (app ? "Oppdater «Android System WebView» i Google Play og åpne appen på nytt." : "Oppdater nettleseren til nyeste versjon og åpne siden på nytt.")
      : en
      ? (app ? "Update \u201cAndroid System WebView\u201d in Google Play and open the app again." : "Update your browser to the latest version and open the page again.")
      : (app ? "Päivitä ”Android System WebView” Google Playssa ja avaa sovellus uudelleen." : "Päivitä selain uusimpaan versioon ja avaa sivu uudelleen.");
    // Muu käyttöliittymä (hakukenttä, valikko, alapalkki, painikkeet) ei toimi ilman app.js:ää ja jäisi suomeksi,
    // koska i18n.js ei myöskään aja: piilotetaan, jolloin näkyy vain nimi ja tämä ilmoitus (käyttäjä 2026-11-28)
    var hide = document.querySelectorAll("#sidebar-toggle, .header-tools, .brand-sub, .searchbar, #search-busy, #sidebar, #drawer-scrim, #menu-tip, #bottom-nav, #loading .progress");
    for (var i = 0; i < hide.length; i++) hide[i].style.display = "none";
    var main = document.getElementById("main");
    for (var c = main ? main.firstElementChild : null; c; c = c.nextElementSibling) if (c.id !== "loading") c.style.display = "none";
  }
  window.addEventListener("error", function (e) {
    // Vain sivun latauksen aikana (skriptin jäsennysvirhe), ei myöhempiä virheitä kuten JSON.parse käyttäjän toimista
    if (document.readyState === "complete" || !/SyntaxError/.test(String((e && e.message) || ""))) return;
    // "load": vasta kun i18n.js on kirjoittanut käännöksensä (data-i18n), muuten se kirjoittaisi tämän yli
    if (document.readyState !== "complete") window.addEventListener("load", show); else show();
  });
})();
