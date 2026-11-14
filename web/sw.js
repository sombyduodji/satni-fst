/* Service worker: sovellus ja sanakirja toimivat ilman verkkoyhteyttä ensimmäisen käynnin jälkeen.
   Kun tiedostoja päivitetään, kasvata VERSION, jolloin selaimet hakevat uudet tiedostot. */
const VERSION = "satni-v143";
// Sanastojen äänilistat (suomi + saame ja pelkkä saame): välimuistiin erikseen, jottei puuttuva tiedosto kaada asennusta
const AUDIO = [
  "audio/kuukaudet.ogg", "audio/kuukaudet-sme.ogg", "audio/viikonpaivat.ogg", "audio/viikonpaivat-sme.ogg", "audio/vuodenajat.ogg", "audio/vuodenajat-sme.ogg", "audio/luvut-1.ogg", "audio/luvut-1-sme.ogg", "audio/luvut-2.ogg", "audio/luvut-2-sme.ogg", "audio/luvut-3.ogg", "audio/luvut-3-sme.ogg", "audio/jarjestysluvut-1.ogg", "audio/jarjestysluvut-1-sme.ogg", "audio/jarjestysluvut-2.ogg", "audio/jarjestysluvut-2-sme.ogg", "audio/jarjestysluvut-3.ogg", "audio/jarjestysluvut-3-sme.ogg",
  "audio/varit.ogg", "audio/varit-sme.ogg", "audio/kysymykset.ogg", "audio/kysymykset-sme.ogg", "audio/aika.ogg", "audio/aika-sme.ogg", "audio/suku.ogg", "audio/suku-sme.ogg", "audio/pronominit.ogg", "audio/pronominit-sme.ogg", "audio/tervehdykset.ogg", "audio/tervehdykset-sme.ogg", "audio/suunnat.ogg", "audio/suunnat-sme.ogg", "audio/saa.ogg", "audio/saa-sme.ogg", "audio/porot.ogg", "audio/porot-sme.ogg",
];
// Minipelin palauteäänet (Biret): viikonpäivät, vuodenajat ja kuukaudet, oikein ja väärin
for (let i = 0; i < 27; i++) AUDIO.push(`audio/peli/aika-${i}-ok.ogg`, `audio/peli/aika-${i}-no.ogg`);
for (let i = 0; i < 11; i++) AUDIO.push(`audio/peli/kysy-${i}-ok.ogg`, `audio/peli/kysy-${i}-no.ogg`);
const APP_SHELL = [
  "./", "index.html", "boot.js", "styles.css", "i18n.js", "app.js", "lauseet.js", "sanastot.js", "data/sanastot.json", "minipeli.js", "data/minipeli.json", "manifest.webmanifest",
  "vendor/sql-wasm.js", "vendor/sql-wasm.wasm",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/coffee.svg",
  "voices/biret.wav", "voices/mahtte.wav", "voices/sunna.wav",  // äänivalinnan näytteet
  "licenses/NOTICES.txt", "licenses/GPL-3.0.txt", "licenses/LGPL-3.0.txt", "licenses/CC-BY-4.0.txt", "licenses/CC-BY-3.0.txt",  // Lisenssit
  "licenses/MPL-2.0.txt", "licenses/Apache-2.0.txt", "licenses/CC-BY-SA-4.0.txt", "vendor/LICENSE-sql.js.txt",
];
const DATA = "data/satni-web.db.gz";
// Sanakirjalla on oma välimuistinsa, jottei noin 47 Mt ladata uudelleen joka sovelluspäivityksessä.
// Kasvata numeroa, kun tietokannan sisältö tai rakenne muuttuu (v2: käännökset kielittäin, v3: käänteiset sanakirjat,
// v5: astevaihtelun korjaus, dilli ll ~ l, v6: taivutusluokat,
// v7: muiden saamenkielten käännöksiä lisää ja suomennosehdotukset, v8: espanja, v9: haku ilman sulkeissa olevia tarkenteita,
// v10: Tarkoititko-hakusanat muille kielille, v11: englantia Wiktionarysta)
const DATA_CACHE = "satni-data-v37";  // v37: suomennosten korjaukset ja heittomerkit haussa (päivätesti 2026-11-14)

self.addEventListener("install", (event) => {
  // cache: "reload": sovelluksen tiedostot verkosta eikä selaimen HTTP-välimuistista (muuten vanha app.js voisi jäädä);
  // äänilistat saavat tulla HTTP-välimuistista, ne muuttuvat harvoin ja ovat isoja
  const fresh = (f) => new Request(f, { cache: "reload" });
  event.waitUntil(caches.open(VERSION).then((cache) =>
    cache.addAll(APP_SHELL.map(fresh)).then(() => Promise.allSettled(AUDIO.map((f) => cache.add(f))))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Poistetaan vanhojen versioiden välimuistit (sanakirja ja ääntämiset säilyvät)
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![VERSION, DATA_CACHE, "satni-tts"].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.endsWith(DATA)) {
    // Sanakirja (~47 Mt): välimuistista, verkosta vain ensimmäisellä kerralla
    event.respondWith(caches.open(DATA_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }

  // Sovelluksen tiedostot: verkosta, jotta päivitykset näkyvät heti; ilman verkkoa välimuistista
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      // index.html vain sivun avaukselle: muuten puuttuva tiedosto (esim. licenses/desktop/files.txt) saisi sivun HTML:n
      .catch(() => caches.match(event.request, { ignoreSearch: true })
        .then((r) => r || (event.request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
