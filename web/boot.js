// Ladataan heti <head>-osassa (index.html), ennen piirtämistä. Erillisenä tiedostona eikä sivun sisällä, jotta
// sisällön suojauskäytäntö (CSP) voi kieltää sivun sisäiset skriptit.
// Teema ja kieli heti ennen piirtämistä, ettei sivu välähdä väärän värisenä
try {
  const s = JSON.parse(localStorage.getItem("satni-settings") || "{}");
  if (s.theme === "light" || s.theme === "dark") document.documentElement.dataset.theme = s.theme;
  if (s.uiLang === "nb") document.documentElement.lang = "nb";
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
    var nb = document.documentElement.lang === "nb", app = location.hostname === "appassets.androidplatform.net";
    h.textContent = nb ? "Nettleseren er for gammel" : "Selain on liian vanha";
    p.textContent = nb
      ? (app ? "Oppdater «Android System WebView» i Google Play og åpne appen på nytt." : "Oppdater nettleseren til nyeste versjon og åpne siden på nytt.")
      : (app ? "Päivitä ”Android System WebView” Google Playssa ja avaa sovellus uudelleen." : "Päivitä selain uusimpaan versioon ja avaa sivu uudelleen.");
  }
  window.addEventListener("error", function (e) {
    // Vain sivun latauksen aikana (skriptin jäsennysvirhe), ei myöhempiä virheitä kuten JSON.parse käyttäjän toimista
    if (document.readyState === "complete" || !/SyntaxError/.test(String((e && e.message) || ""))) return;
    // "load": vasta kun i18n.js on kirjoittanut käännöksensä (data-i18n), muuten se kirjoittaisi tämän yli
    if (document.readyState !== "complete") window.addEventListener("load", show); else show();
  });
})();
