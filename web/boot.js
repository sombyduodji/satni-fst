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
