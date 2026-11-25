/* Service worker: sovellus ja sanakirja toimivat ilman verkkoyhteyttä ensimmäisen käynnin jälkeen.
   Kun tiedostoja päivitetään, kasvata VERSION, jolloin selaimet hakevat uudet tiedostot. */
const VERSION = "satni-v311";  // v311: sanakortin selkeytys (tietorivi, muut kielet palstoina, lyhyet välilehdet, käännökset riveittäin); v310: sanakirjan lataus: jumiutuminen tunnistetaan ja ladataan uudelleen, latauspalkki Androidissa; v309: lausekääntäjä: monikon olemassaolon subjekti, duaali (me kaksi), kotona = ruovttus, partisiipit/2. infinitiivi/-minen/passiivin kielto, nimen translatiivi; v308: Android: sähköpostisovellusta ei löytynyt -ikkuna (kopioi viesti); v307: saksa: Apertium sme-deu kuudentena lähteenä (noin 5 700 sanaa); v306: Sanaperhe: tuplanapautus "Näytä kaikki" ei avaa riviä painikkeen alta, norjan "1 sammensatt ord"; v305: Sanaperhe-välilehti (johdokset, yhdyssanat, pohjasana kortissa); v304: Eläimet aakkostaulukkona (käyttöliittymän kieli | saame); v303: Pelaa: peli listan päällä (z-index); v302: Takaisin: Pelaa-pelistä suoraan listaan, tulosruudusta pelivalikkoon; v301: lisenssit: työpöydän luetteloa ei haeta Androidissa eikä verkossa; v300: käännös puuttuu: varakieli, johdos sanasta X, ilmoituslinkki; -min-muoto verbinä ensin; inarista epävarmat pois; v299: Marjat-sanaston inarinsaame 31/33, dát/dat-monikko inariksi (taah, toh); v298: Takaisin-painike sulkee pelin/sanaston verkkoversiossa; v297: taivutetun haun järjestys (tavallinen taivutus ennen verbinominia); v296: komitatiivit (muinna, dáinna, geainna …) ja dát/dat-monikko; v295: Ilmoita puuttuvasta sanasta (ei osumia -näkymä); v294: Marjat, hedelmät ja kasvikset -sanasto, harjoitus ja peli; v293: pelivalikko ei piirry ennen pelidatan latausta; v292: vanhan selaimen ilmoitus laitteen kielellä ensimmäisellä käynnistyksellä; v291: Biretin áhkku, Sunnán dudno ja odne; v290: Máhtten 6 sanaa kierrokselta 2; v289: kuunnellen valitut äänet (Biret 24, Sunná 31, Máhtte 80, harjoitus 19); v288: Valitse itse kuvanäkymän alariviin; v287: Kellonajat-sanaston suomi samoin; v286: kellon suomi puolesta tunnista (20, 25, 35, 40)
// Sanastojen äänet: tervehdysten keskustelu saameksi; sanat ja lauseet kolmella äänellä hakemistosta (audio/s/index.json)
const AUDIO = ["audio/tervehdykset-sme.ogg"];
// Minipelin palauteäänet (Biret): viikonpäivät, vuodenajat ja kuukaudet, oikein ja väärin
for (let i = 0; i < 27; i++) AUDIO.push(`audio/peli/aika-${i}-ok.ogg`, `audio/peli/aika-${i}-no.ogg`);
for (let i = 0; i < 11; i++) AUDIO.push(`audio/peli/kysy-${i}-ok.ogg`, `audio/peli/kysy-${i}-no.ogg`);
// Kello (kello.py): 144 aikaa, pelin palaute ja kuunteluharjoitus (Biret ja Harri), Biretin kysymys
AUDIO.push("audio/peli/kello-q.ogg");
for (let i = 0; i < 144; i++) AUDIO.push(`audio/peli/kello-${i}-ok.ogg`, `audio/peli/kello-${i}-no.ogg`, `audio/w/kello-${i}-fi.ogg`, `audio/w/kello-${i}-sme.ogg`);
const APP_SHELL = [
  "./", "index.html", "boot.js", "styles.css", "i18n.js", "app.js", "lauseet.js", "sanastot.js", "harjoitus.js", "audio/w/harjoitus.json", "audio/s/index.json", "data/sanastot.json", "minipeli.js", "data/minipeli.json", "data/kello.json", "manifest.webmanifest",
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
const DATA_CACHE = "satni-data-v58";  // v58: saksan ja koltan haun indeksit, suomennosehdotusten tasapelit aakkosjärjestyksessä; v57: englannin, suomen, espanjan ja saksan konekäännökset (eng_mt, fin_mt, spa_mt, deu_mt); v56: ryhmä A tarkistettu, 24 pois; v55: yhdyssanojen suomennokset + ryhmä B; v54: yhdyssanojen suomennokset + ryhmä C; v53: yhdyssanojen tarkistetut suomennokset (cmp_fin); v52: suomen sanojen yleisyys vain Voikon hyväksymille; v51: johdokset (der_base, der_fin: váralašvuohta ≈ vaarallisuus); v50: suomen yleiset sanat yhdyssanojen käännökseen; v49: norjan sanaparit (satni-nob-ngram.db.gz); v48: suomen sanojen yleisyys (fin_unigram); v47: suomen sanaparit (satni-fin-ngram.db.gz, Leipzig CC BY); v46: inari ja koltta omiin tiedostoihinsa; v45: koltansaame kuviin (sms_words, sms_forms, sms_cmp); v44: inarin partitiivi, passiivi, vertailumuodot, teonnimi; v43: inarinsaame kuviin (smn_words, smn_forms, smn_cmp); v42: sme_cmp (saamen yhdysmuodot); v41: fin_cmp (suomen yhdyssanojen alkuosat); v40: fin_also

self.addEventListener("install", (event) => {
  // cache: "reload": sovelluksen tiedostot verkosta eikä selaimen HTTP-välimuistista (muuten vanha app.js voisi jäädä);
  // äänilistat saavat tulla HTTP-välimuistista, ne muuttuvat harvoin ja ovat isoja
  const fresh = (f) => new Request(f, { cache: "reload" });
  event.waitUntil(caches.open(VERSION).then((cache) =>
    cache.addAll(APP_SHELL.map(fresh)).then(() => Promise.allSettled([
      ...AUDIO.map((f) => cache.add(f)),
      // Kuunteluharjoituksen sanat (harjoitus.js): tiedostot hakemistosta, suomi ja saame kustakin sanasta
      cache.match("audio/w/harjoitus.json").then((r) => r.json()).then((d) => Promise.allSettled(
        d.lists.flatMap((l) => l.rows.flatMap((r, k) => [`audio/w/${l.id}-${k}-fi.ogg`, `audio/w/${l.id}-${k}-sme.ogg`,
          ...Object.values(r.v || {}).map((x) => x[0]).filter((f) => f.startsWith("audio/w/"))])).map((f) => cache.add(f)))),
      cache.match("audio/s/index.json").then((r) => r.json()).then((d) => Promise.allSettled(
        Object.entries(d).flatMap(([v, idx]) => Object.values(idx).map((n) => `audio/s/${v}/${n}.ogg`)).map((f) => cache.add(f)))),
    ]))));
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

  // Sanakirja ja inarin/koltan kuvasanastot (data/satni-smn.db.gz, satni-sms.db.gz; ladataan vain valittaessa)
  if (url.pathname.endsWith(DATA) || /\/data\/satni-(smn|sms|fin-ngram|nob-ngram)\.db\.gz$/.test(url.pathname)) {
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
