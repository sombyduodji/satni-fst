/* Service worker: sovellus ja sanakirja toimivat ilman verkkoyhteyttä ensimmäisen käynnin jälkeen.
   Kun tiedostoja päivitetään, kasvata VERSION, jolloin selaimet hakevat uudet tiedostot. */
const VERSION = "satni-v355";  // v355: inarinsaamen pelit 15 uudelle sanastopelille (vain kahden lähteen sanat, ei lauseita); v354: kuvahaku: ả/ẩ/ẳ -> á; v353: kuvahaku: å/ä -> á myös yhdyssanojen haussa (buođđoåigumušain -> buođđo + áigumušain), ä vasta 5 kirjaimesta; v352: kuvahaku: pohjoissaamen sanassa å/ä -> á (ráđđádallan luettiin råđđádallan), nimet ennallaan; v351: syystalvella (Vuodenajat), norjan vai = eller (i spørsmål), danin = på grunn av det, derfor; v350: lyhyet vinkit 9 sanastoon (Vuodenajat, Vuorokausi, Porot, Kysymyssanat, Värit, Kaupassa, Liikkeellä, Syöminen ja juominen, Puut ja kasvit); v349: 5 sanakirjan esimerkkiä lisää (monni, lássa, ruhta, vuolláičállit, beassi); v348: Puut ja kasvit: äänet kolmella äänellä ja kuunteluharjoitus (27 sanaa); v347: Arki: sanakirjan esimerkkilauseet sanojen alla (12, layout ex); Puut ja kasvit -sanasto ja peli; v346: Arki-listojen kuunteluharjoitus (52 sanaa, Harrin suomi Whisperillä tarkistettu; lasi ja tie pois harjoituksesta); v345: Arki-sanojen äänet (Biret, Máhtte, Sunná, 54 sanaa) sovelluksen mukana; v344: Sanastot: Arki-ryhmä (Kaupassa, Pankissa, Liikkeellä, Syöminen ja juominen; 54 sanaa) ja niiden pelit; v343: minipeli: Guldal-kuuntelupeli (sana soi, valitse merkitys; vain sanat, joilla on ääni mukana); v342: minipeli: 10 uutta sanastopeliä (Vuorokausi, Ennen ja jälkeen, Perhe ja suku, Pronominit, Tervehdykset, Porot, Sää ja lumi, Täällä ja tuolla, Tämä ja se, Sidesanat), sukulaissanat tarkalla merkityksellä; v341: minipeli: 3 elämää (väärä vaihtoehto himmenee, sama sana jatkuu), yksi yritys valittavissa, pelin sanat tulossivulla; v340: asetusyhteenvedon kuollut sum-exp-rivi pois; v339: Lähellä ja kaukana -kuunteluharjoitus (Harri + Biret/Máhtte/Sunná, osiot etäisyyden mukaan); v338: inari, koltta ja sanaparit natiivilla SQLitellä Androidissa (vaihe 4), sql.js vain varalle; ensimmäinen jokerihaku ei lue koko sanaluetteloa; v337: taivutustaulukon kauttaviiva ei jää yksin omalle rivilleen kapealla näytöllä; v336: Androidin takaisin-ele sulkee ensin avoimen ikkunan (closeOpenDialog, kuten Play-versiossa); v335: Lähellä ja kaukana: selitteet eivät katkea kesken sanan kapealla näytöllä; v334: ?-oppaan tuplanapautus ei sulje juuri avattua opasta; v333: inarin tilassa Pelaa-painike vain peleille, joilla on inarin sanat; v332: Lähellä ja kaukana -sanasto (taulukko) ja peli, dot Tämä ja se -listaan, Täällä ja tuolla -ohje korjattu (do- kauimpana); v331: sql-test: Androidilla sanakirja laitteen omalla SQLitellä (NativeDb); v329: ?-opas piiloon Lisää-valikon ja ikkunoiden ajaksi; v328: oppaan kohdistus paneeliin; v327: ?-opas ei näy valokuvahaussa eikä muissa näkymissä; v326: ohjeen kohdevalo (nykyinen kohta kirkkaana, muu himmeänä); v325: ohjeessa hehku vain nykyiselle kohdalle, kohdan napautus selittää, Sulje opas -painike; v324: ohje askel kerrallaan (Edellinen / Seuraava), sivu vierii ja renkaat seuraavat; v323: ilmoita virheestä -kuvake otsikossa, ?-ohjetila sanakortille; v322: uusi sana avautuu aina Taivutus-välilehdelle; v321: sanaluokkarivi rivittyy osittain omiin sulkeisiinsa, jos ei mahdu; v320: muiden kielten erotinviiva pois; v319: Muut merkitykset kuvakkeena käännösrivillä, Sanaperhe pillerinä; v318: käännös pyöristetyssä laatikossa, haettu muoto ja sen kielioppi laatikossa, Muut merkitykset -linkki, sanaluokka sanan perässä; v317: astevaihtelu pois asetuksista -> pääsanamuodot ilman korostusta; v316: astevaihtelulinkki "astevaihtelu nn → n ›", tiiviimmät otsikkorivit; v315: otsikko: sanaluokka kursiivilla sanan alla, muodot omalla rivillään; muut osumat tiiviinä; tyhjä Aste piiloon; verbitaulukko allekkain kapealla näytöllä; v314: sanaperheen yhteenveto kortin alareunaan; v313: pääsanamuodoissa astevaihtelun konsonantit korostettuina, "Astevaihtelu: hčč → hč ›" muotojen jälkeen; v312: pääsanamuodot tietorivillä (áhčči, áhči; vielgat, vielgada, attr. vilges), saamenkielinen selitys vain Merkityksissä; v311: sanakortin selkeytys (tietorivi, muut kielet palstoina, lyhyet välilehdet, käännökset riveittäin); v310: sanakirjan lataus: jumiutuminen tunnistetaan ja ladataan uudelleen, latauspalkki Androidissa; v309: lausekääntäjä: monikon olemassaolon subjekti, duaali (me kaksi), kotona = ruovttus, partisiipit/2. infinitiivi/-minen/passiivin kielto, nimen translatiivi; v308: Android: sähköpostisovellusta ei löytynyt -ikkuna (kopioi viesti); v307: saksa: Apertium sme-deu kuudentena lähteenä (noin 5 700 sanaa); v306: Sanaperhe: tuplanapautus "Näytä kaikki" ei avaa riviä painikkeen alta, norjan "1 sammensatt ord"; v305: Sanaperhe-välilehti (johdokset, yhdyssanat, pohjasana kortissa); v304: Eläimet aakkostaulukkona (käyttöliittymän kieli | saame); v303: Pelaa: peli listan päällä (z-index); v302: Takaisin: Pelaa-pelistä suoraan listaan, tulosruudusta pelivalikkoon; v301: lisenssit: työpöydän luetteloa ei haeta Androidissa eikä verkossa; v300: käännös puuttuu: varakieli, johdos sanasta X, ilmoituslinkki; -min-muoto verbinä ensin; inarista epävarmat pois; v299: Marjat-sanaston inarinsaame 31/33, dát/dat-monikko inariksi (taah, toh); v298: Takaisin-painike sulkee pelin/sanaston verkkoversiossa; v297: taivutetun haun järjestys (tavallinen taivutus ennen verbinominia); v296: komitatiivit (muinna, dáinna, geainna …) ja dát/dat-monikko; v295: Ilmoita puuttuvasta sanasta (ei osumia -näkymä); v294: Marjat, hedelmät ja kasvikset -sanasto, harjoitus ja peli; v293: pelivalikko ei piirry ennen pelidatan latausta; v292: vanhan selaimen ilmoitus laitteen kielellä ensimmäisellä käynnistyksellä; v291: Biretin áhkku, Sunnán dudno ja odne; v290: Máhtten 6 sanaa kierrokselta 2; v289: kuunnellen valitut äänet (Biret 24, Sunná 31, Máhtte 80, harjoitus 19); v288: Valitse itse kuvanäkymän alariviin; v287: Kellonajat-sanaston suomi samoin; v286: kellon suomi puolesta tunnista (20, 25, 35, 40)
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
const DATA_CACHE = "satni-data-v60";  // v58: saksan ja koltan haun indeksit, suomennosehdotusten tasapelit aakkosjärjestyksessä; v57: englannin, suomen, espanjan ja saksan konekäännökset (eng_mt, fin_mt, spa_mt, deu_mt); v56: ryhmä A tarkistettu, 24 pois; v55: yhdyssanojen suomennokset + ryhmä B; v54: yhdyssanojen suomennokset + ryhmä C; v53: yhdyssanojen tarkistetut suomennokset (cmp_fin); v52: suomen sanojen yleisyys vain Voikon hyväksymille; v51: johdokset (der_base, der_fin: váralašvuohta ≈ vaarallisuus); v50: suomen yleiset sanat yhdyssanojen käännökseen; v49: norjan sanaparit (satni-nob-ngram.db.gz); v48: suomen sanojen yleisyys (fin_unigram); v47: suomen sanaparit (satni-fin-ngram.db.gz, Leipzig CC BY); v46: inari ja koltta omiin tiedostoihinsa; v45: koltansaame kuviin (sms_words, sms_forms, sms_cmp); v44: inarin partitiivi, passiivi, vertailumuodot, teonnimi; v43: inarinsaame kuviin (smn_words, smn_forms, smn_cmp); v42: sme_cmp (saamen yhdysmuodot); v41: fin_cmp (suomen yhdyssanojen alkuosat); v40: fin_also

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
