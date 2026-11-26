// Minipeli: sanapeli (data/minipeli.json, minipeli.py) pohjoissaameksi tai (asetuksista, kokeellinen) inarinsaameksi, kaksi tapaa: Vállje (valitse neljästä) ja Čále (kirjoita sana
// saameksi; vihjeet maksavat pisteitä, puuttuvat tarkkeet -1 p). Väärä vastaus päättää pelin; parhaat tulokset
// tallentuvat tila- ja tapakohtaisesti laitteelle. Kesken jäänyt peli jatkuu, kun näkymä avataan uudelleen ("Jatka vai uusi?").
// Yläpalkin painike (oletuksena näkyvissä) piilotetaan asetuksista.

let peli = null;        // { words, cats } ladattuna
let peliRun = null;     // käynnissä oleva peli: { mode, score, deck, pos, q }
let peliBusy = false;   // vastaus näkyy hetken ennen seuraavaa kysymystä
let peliLast = null;
let peliShownAt = 0;    // kysymyksen piirtohetki: heti sen jälkeen tulleet napautukset (edellisen kysymyksen tuplanapautus) ohitetaan    // viimeisin kysymys { mode, q }: virheilmoitus myös pelin päätyttyä

const PELI_TEXTS = {
  fi: {
    statStreak: "paras putki", statModes: "peliä pelattu", statGames: "pelattua peliä", record: "ennätys", rulesBtn: "Säännöt",
    unfinished: (n) => `kesken ${n} p`, restart: "Aloita kesken jäänyt peli alusta",
    title: "Minipeli", pick: "Valitse peli", best: "Paras", none: "–", score: (n) => `${n} oikein`,
    lead: "Valitse oikea käännös neljästä. Yksi väärä vastaus päättää pelin.",
    modes: { beginner: ["Aloittelija", "Yleisimmät sanat"], advanced: ["Edistynyt", "Kaikki sanat"],
      ordinals: ["Järjestysluvut", "1.–100."], time: ["Viikonpäivät, vuodenajat ja kuukaudet", "Biret sanoo oikean vastauksen"],
      colours: ["Värit", "9 väriä"], questions: ["Kysymyssanat", "Biret sanoo oikean vastauksen"], animals: ["Eläimet", "23 eläintä"], berries: ["Marjat, hedelmät ja kasvikset", "33 sanaa"], nearfar: ["Lähellä ja kaukana", "dát, diet, duot, dot …"],
      daytime: ["Vuorokausi", "23 sanaa"], beforeafter: ["Ennen ja jälkeen", "12 sanaa"], family: ["Perhe ja suku", "18 sanaa"], pronouns: ["Pronominit", "9 sanaa"], greetings: ["Tervehdykset", "14 sanaa"], reindeer: ["Porot", "9 sanaa"], weather: ["Sää ja lumi", "18 sanaa"], herethere: ["Täällä ja tuolla", "17 sanaa"], thisthat: ["Tämä ja se", "7 sanaa"], smallwords: ["Sidesanat ja pikkusanat", "38 sanaa"],
      clock: ["Kellonajat", "Tasan, puoli ja vartit"], clockAll: ["Kellonajat: kaikki", "Viiden minuutin välein, 144 aikaa"] },
    clockListen: "Kuuntele ja valitse kello", clockAsk: "Paljonko kello on?", clockAgain: "Kuuntele uudelleen", clockText: "Näytä teksti", seeList: "Katso sanasto",
    groups: { words: "Sanat", cats: "Aiheet" }, groupSub: { words: "Sanakirjan sanoja kahdella tasolla", cats: "Lyhyitä teemapelejä" },
    lives3: "3 elämää", lives1: "Yksi yritys", livesLabel: "Elämät", livesRule: "kolmas väärä vastaus päättää pelin", livesLeft: (n) => `${n} elämää jäljellä`, played: "Pelin sanat", openCard: "Avaa sanakortti", listenTo: "Kuuntele",
    rules: [["4 vaihtoehtoa"], ["oikein", "+1"], ["väärä vastaus päättää pelin"]],
    rulesWrite: [["oikea sana", "+3"], ["vihje", "−1"], ["tarkkeet puuttuvat", "−1"], ["väärä sana päättää pelin"]],
    askSme: "Mitä tämä on suomeksi?", askUi: (l) => `Mikä on ${l}`, inLang: { sme: "saameksi", smn: "inarinsaameksi" }, over: "Peli päättyi", correctWas: "Oikea vastaus:",
    again: "Pelaa uudelleen", menu: "Valitse toinen peli", home: "Etusivulle", top: "Parhaat tulokset",
    newBest: "Uusi ennätys!", youAnswered: "Vastasit:", resumeQ: "Jatketaanko keskeneräistä peliä?", resume: "Jatka", fresh: "Uusi peli",
    report: "Ilmoita virheestä", streak: "Putki", mute: "Mykistä pelin äänet", unmute: "Pelin äänet päälle",
    style: "Pelitapa", choose: "valitse", write: "kirjoita", points: (n) => `${n} ${n === 1 ? "piste" : "pistettä"}`,
    leadWrite: "Kirjoita sana saameksi. Vihje maksaa pisteen, samoin puuttuvat tarkkeet ja vain osin sopiva sana. Väärä sana päättää pelin.",
    askWrite: (l) => `Kirjoita ${l}`, allWords: (n) => `Kaikki ${n} sanaa`, count: (n) => `${n} sanaa`, samiLang: "Kieli", experimental: "kokeellinen", check: "Tarkista", inputLabel: "Vastauksesi saameksi", almost: "Melkein!", nearly: "Lähellä!", better: "Tähän sopii paremmin:",
    youWrote: "Kirjoitit:", letters: (n) => `${n} kirjainta`,
    hints: ["Vihje: kirjainten määrä", "Vihje: ensimmäinen kirjain", "Vihje: Biret sanoo sanan"], listenAgain: "Kuuntele uudelleen",
    keys: "Saamen kirjaimet", hideKeys: "Piilota saamen kirjaimet", showKeys: "Näytä saamen kirjaimet",
    kbdTip: "Saamen näppäimistöllä kirjoitat saamea kaikissa sovelluksissa. iPhonessa se on valmiina (Asetukset → Yleiset → Näppäimistö), Androidiin ilmainen Divvun Keyboards.",
    kbdLink: "Näin lisäät sen", close: "Sulje",
  },
  nb: {
    statStreak: "beste rekke", statModes: "spill prøvd", statGames: "spill spilt", record: "rekord", rulesBtn: "Regler",
    unfinished: (n) => `uferdig ${n} p`, restart: "Start det uferdige spillet på nytt",
    title: "Minispill", pick: "Velg spill", best: "Best", none: "–", score: (n) => `${n} riktige`,
    lead: "Velg riktig oversettelse av fire. Ett feil svar avslutter spillet.",
    modes: { beginner: ["Nybegynner", "De vanligste ordene"], advanced: ["Viderekommen", "Alle ordene"],
      ordinals: ["Ordenstall", "1.–100."], time: ["Ukedager, årstider og måneder", "Biret sier riktig svar"],
      colours: ["Farger", "9 farger"], questions: ["Spørreord", "Biret sier riktig svar"], animals: ["Dyr", "23 dyr"], berries: ["Bær, frukt og grønnsaker", "33 ord"], nearfar: ["Nær og fjern", "dát, diet, duot, dot …"],
      daytime: ["Døgnet", "23 ord"], beforeafter: ["Før og etter", "12 ord"], family: ["Familie og slekt", "18 ord"], pronouns: ["Pronomen", "9 ord"], greetings: ["Hilsener", "14 ord"], reindeer: ["Rein", "9 ord"], weather: ["Vær og snø", "18 ord"], herethere: ["Her og der", "17 ord"], thisthat: ["Dette og det", "7 ord"], smallwords: ["Bindeord og småord", "38 ord"],
      clock: ["Klokkeslett", "Hel, halv og kvarter"], clockAll: ["Klokkeslett: alle", "Hvert femte minutt, 144 tider"] },
    clockListen: "Lytt og velg klokka", clockAsk: "Hva er klokka?", clockAgain: "Lytt igjen", clockText: "Vis teksten", seeList: "Se ordlisten",
    groups: { words: "Ord", cats: "Emner" }, groupSub: { words: "Ord fra ordboka på to nivåer", cats: "Korte temaspill" },
    lives3: "3 liv", lives1: "Ett forsøk", livesLabel: "Liv", livesRule: "tredje feil svar avslutter spillet", livesLeft: (n) => `${n} liv igjen`, played: "Ordene i spillet", openCard: "Åpne ordkortet", listenTo: "Lytt",
    rules: [["4 alternativer"], ["riktig", "+1"], ["feil svar avslutter spillet"]],
    rulesWrite: [["riktig ord", "+3"], ["hint", "−1"], ["manglende tegn", "−1"], ["feil ord avslutter spillet"]],
    askSme: "Hva er dette på norsk?", askUi: (l) => `Hva heter det på ${l}`, inLang: { sme: "samisk", smn: "enaresamisk" }, over: "Spillet er over", correctWas: "Riktig svar:",
    again: "Spill igjen", menu: "Velg et annet spill", home: "Til forsiden", top: "Beste resultater",
    newBest: "Ny rekord!", youAnswered: "Du svarte:", resumeQ: "Vil du fortsette spillet du ikke ble ferdig med?", resume: "Fortsett", fresh: "Nytt spill",
    report: "Meld fra om feil", streak: "Rekke", mute: "Slå av lyden i spillet", unmute: "Slå på lyden i spillet",
    style: "Spillmåte", choose: "velg", write: "skriv", points: (n) => `${n} poeng`,
    leadWrite: "Skriv ordet på samisk. Et hint koster ett poeng, det samme gjør manglende diakritiske tegn og et ord som bare passer delvis. Feil ord avslutter spillet.",
    askWrite: (l) => `Skriv på ${l}`, allWords: (n) => `Alle ${n} ord`, count: (n) => `${n} ord`, samiLang: "Språk", experimental: "eksperimentell", check: "Sjekk", inputLabel: "Svaret ditt på samisk", almost: "Nesten!", nearly: "Nesten riktig!", better: "Her passer bedre:",
    youWrote: "Du skrev:", letters: (n) => `${n} bokstaver`,
    hints: ["Hint: antall bokstaver", "Hint: første bokstav", "Hint: Biret sier ordet"], listenAgain: "Hør igjen",
    keys: "Samiske bokstaver", hideKeys: "Skjul samiske bokstaver", showKeys: "Vis samiske bokstaver",
    kbdTip: "Med samisk tastatur skriver du samisk i alle apper. På iPhone er det innebygd (Innstillinger → Generelt → Tastatur), til Android finnes gratis Divvun Keyboards.",
    kbdLink: "Slik legger du det til", close: "Lukk",
  },
  en: {
    statStreak: "best streak", statModes: "games tried", statGames: "games played", record: "record", rulesBtn: "Rules",
    unfinished: (n) => `unfinished ${n} p`, restart: "Start the unfinished game again",
    title: "Mini game", pick: "Choose a game", best: "Best", none: "–", score: (n) => `${n} right`,
    lead: "Choose the right translation of four. One wrong answer ends the game.",
    modes: { beginner: ["Beginner", "The most common words"], advanced: ["Advanced", "All words"],
      ordinals: ["Ordinal numbers", "1st–100th"], time: ["Days, seasons and months", "Biret says the right answer"],
      colours: ["Colours", "9 colours"], questions: ["Question words", "Biret says the right answer"], animals: ["Animals", "23 animals"], berries: ["Berries, fruit and vegetables", "33 words"], nearfar: ["Near and far", "dát, diet, duot, dot …"],
      daytime: ["Times of day", "23 words"], beforeafter: ["Before and after", "12 words"], family: ["Family and relatives", "18 words"], pronouns: ["Pronouns", "9 words"], greetings: ["Greetings", "14 words"], reindeer: ["Reindeer", "9 words"], weather: ["Weather and snow", "18 words"], herethere: ["Here and there", "17 words"], thisthat: ["This and that", "7 words"], smallwords: ["Linking and little words", "38 words"],
      clock: ["Clock times", "O'clock, half and quarters"], clockAll: ["Clock times: all", "Every five minutes, 144 times"] },
    clockListen: "Listen and pick the clock", clockAsk: "What time is it?", clockAgain: "Listen again", clockText: "Show text", seeList: "See the word list",
    groups: { words: "Words", cats: "Topics" }, groupSub: { words: "Dictionary words on two levels", cats: "Short topic games" },
    lives3: "3 lives", lives1: "One try", livesLabel: "Lives", livesRule: "the third wrong answer ends the game", livesLeft: (n) => `${n} ${n === 1 ? "life" : "lives"} left`, played: "Words in this game", openCard: "Open the word card", listenTo: "Listen",
    rules: [["4 options"], ["right", "+1"], ["a wrong answer ends the game"]],
    rulesWrite: [["right word", "+3"], ["hint", "−1"], ["missing diacritics", "−1"], ["a wrong word ends the game"]],
    askSme: "What is this in English?", askUi: (l) => `What is it ${l}`, inLang: { sme: "in Sámi", smn: "in Inari Sámi" }, over: "Game over", correctWas: "Right answer:",
    again: "Play again", menu: "Choose another game", home: "To the start page", top: "Best results",
    newBest: "New record!", youAnswered: "You answered:", resumeQ: "Continue the unfinished game?", resume: "Continue", fresh: "New game",
    report: "Report an error", streak: "Streak", mute: "Mute the game sounds", unmute: "Turn the game sounds on",
    style: "How to play", choose: "choose", write: "write", points: (n) => `${n} ${n === 1 ? "point" : "points"}`,
    leadWrite: "Write the word in Sámi. A hint costs a point, and so do missing diacritics and a word that only partly fits. A wrong word ends the game.",
    askWrite: (l) => `Write it ${l}`, allWords: (n) => `All ${n} words`, count: (n) => `${n} words`, samiLang: "Language", experimental: "experimental", check: "Check", inputLabel: "Your answer in Sámi", almost: "Almost!", nearly: "Close!", better: "A better fit here:",
    youWrote: "You wrote:", letters: (n) => `${n} letters`,
    hints: ["Hint: number of letters", "Hint: first letter", "Hint: Biret says the word"], listenAgain: "Listen again",
    keys: "Sámi letters", hideKeys: "Hide Sámi letters", showKeys: "Show Sámi letters",
    kbdTip: "With a Sámi keyboard you can write Sámi in every app. On iPhone it is built in (Settings → General → Keyboard); for Android there is the free Divvun Keyboards.",
    kbdLink: "How to add it", close: "Close",
  },
};
const pt = () => PELI_TEXTS[sanastoLang()];
const PELI_MODES = [
  { id: "beginner", group: "words", color: "yellow" }, { id: "advanced", group: "words", color: "red" },
  { id: "ordinals", group: "cats", color: "blue" }, { id: "time", group: "cats", color: "blue" },
  { id: "colours", group: "cats", color: "green" }, { id: "questions", group: "cats", color: "yellow" },
  { id: "animals", group: "cats", color: "green" }, { id: "berries", group: "cats", color: "red" },
  { id: "nearfar", group: "cats", color: "yellow" },
  // Sanastojen pelit (2026-11-26): sanat ja käännökset sanastoista (minipeli.py: LIST_GAMES)
  { id: "daytime", group: "cats", color: "blue" },
  { id: "beforeafter", group: "cats", color: "blue" },
  { id: "family", group: "cats", color: "red" },
  { id: "pronouns", group: "cats", color: "red" },
  { id: "greetings", group: "cats", color: "red" },
  { id: "reindeer", group: "cats", color: "green" },
  { id: "weather", group: "cats", color: "green" },
  { id: "herethere", group: "cats", color: "green" },
  { id: "thisthat", group: "cats", color: "yellow" },
  { id: "smallwords", group: "cats", color: "yellow" },
  { id: "clock", group: "cats", color: "blue" }, { id: "clockAll", group: "cats", color: "blue" },
];
// Pelattava saamen kieli: pohjoissaame aina, inarinsaame vain asetuksista valittuna (kokeellinen, minipeli.json: smn).
// Biret puhuu vain pohjoissaamea, joten inarinsaamessa ei ole ääntä eikä kolmatta (kuuntelu)vihjettä.
const PELI_SAMI = {
  // Pelitavan nimet: pohjoissaamessa käskymuoto (vállje, čále), inarissa perusmuoto (valjiđ, čäälliđ: sanakirja ja
  // inarin oikoluku vahvistavat; käskymuotoja ei voi tarkistaa ilman generaattoria)
  sme: { name: "Davvisámegiella", keys: ["á", "č", "đ", "ŋ", "š", "ŧ", "ž"], hints: 3, voice: true, choose: "Vállje", write: "Čále" },
  smn: { name: "Anarâškielâ", keys: ["á", "â", "ä", "č", "đ", "ŋ", "š", "ž"], hints: 2, voice: false, choose: "Valjiđ", write: "Čäälliđ" },
};
const peliSamiEnabled = () => !!settings.gameSmn && !!(peli && peli.smn);
const peliMenuSami = () => (peliSamiEnabled() && peliStore.get("satni-peli-sami", "sme") === "smn" ? "smn" : "sme");
const peliSamiOf = (run) => (run && run.sami === "smn" ? "smn" : "sme");
const peliSet = (sami) => (sami === "smn" ? peli.smn : peli);
// Käyttöliittymän kielen sarake pelin sanoissa: [saame, suomi, norja, ...]; englanniksi norjan paikalle englanti
// (minipeli.json: en = saamen sana -> englanti), ja sana ilman englantia jää pois
const peliUi = () => (sanastoLang() === "fi" ? 1 : 2);
// Aiheissa oma kartta (enCats): sama saamen sana voi olla eri merkityksessä (mii = we pronomineissa, what kysymyksissä)
const peliEn = (set, w, cat) => (cat && set.enCats && set.enCats[cat] ? set.enCats[cat][w[0]] : set.en && set.en[w[0]]);
const peliLangWords = (list, set, cat) => (sanastoLang() !== "en" ? list
  : list.map((w) => { const e = peliEn(set, w, cat); return e ? [w[0], w[1], e, ...w.slice(3)] : null; }).filter(Boolean));
// Kellopelit (data/kello.json): vain pohjoissaame (GiellaLT:n kellogeneraattori ja Biretin äänet)
const PELI_CLOCK = ["clock", "clockAll"];
const peliIsClock = (mode) => PELI_CLOCK.includes(mode);
const peliModesFor = (sami) => PELI_MODES.filter((m) => m.group === "words" || (peliIsClock(m.id) ? sami === "sme" && !!(peli && peli.clock)
  : (peliSet(sami).cats[m.id] || []).length));

// Pelitilojen kuvakkeet (sanastojen kuvakkeiden tyyliin): taimi, vuori, luvut, kalenteri, paletti, tassu
const PELI_MODE_ICON = {
  beginner: '<path d="M12 21v-8"/><path d="M12 13c0-4 2.5-6.5 7-6.5 0 4.2-2.6 6.5-7 6.5z"/><path d="M12 15.5C12 12 9.8 10 6 10c0 3.5 2.2 5.5 6 5.5z"/>',
  advanced: '<path d="M3 19l6.5-11 4 6.5 2.5-4 5 8.5z"/><path d="M8 10.5l1.5 1.5 1.5-1.5"/>',
  ordinals: null, time: null, colours: null, questions: null, nearfar: null,
  clock: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.2V13l2.6 1.8"/><path d="M4.2 6.2l3-2.4M19.8 6.2l-3-2.4M7.3 19.2l-1.6 1.9M16.7 19.2l1.6 1.9"/>', clockAll: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6.5V12h5"/><path d="M12 3.5v1.5M20.5 12H19M12 20.5V19M3.5 12H5"/>',
  berries: '<circle cx="8.3" cy="15.2" r="3.6"/><circle cx="15.7" cy="15.2" r="3.6"/><circle cx="12" cy="9.2" r="3.6"/><path d="M12 5.6c.3-1.6 1.4-2.6 3.2-2.9"/>',
  animals: '<circle cx="7.5" cy="9" r="1.8"/><circle cx="12" cy="6.5" r="1.8"/><circle cx="16.5" cy="9" r="1.8"/><path d="M12 11.5c-3 0-5.5 3.5-5.5 5.6 0 1.6 1.3 2.4 2.7 2.4 1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6c1.4 0 2.7-.8 2.7-2.4 0-2.1-2.5-5.6-5.5-5.6z"/>',
};
const PELI_MODE_SANASTO_ICON = { ordinals: "numbers", time: "month", colours: "palette", questions: "question", nearfar: "pointer",
  daytime: "clock", beforeafter: "hourglass", family: "family", pronouns: "person", greetings: "greet", reindeer: "deer", weather: "snow", herethere: "place", thisthat: "pointer", smallwords: "link" };
const peliModeIcon = (id) => PELI_MODE_ICON[id]
  ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PELI_MODE_ICON[id]}</svg>`
  : sanastoSvg(PELI_MODE_SANASTO_ICON[id]);
// Noppa (neliö kuten yläpalkin muut kuvakkeet; aiempi peliohjain oli matala ja alempana, käyttäjä 2026-11-15)
const PELI_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.6 8.6h.01M15.4 8.6h.01M12 12h.01M8.6 15.4h.01M15.4 15.4h.01" stroke-width="2.6"/></svg>';

// --- Tallennus laitteelle (parhaat tulokset ja kesken jäänyt peli); yksityinen tila ei kaada peliä ---
const peliStore = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(key, value) { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ei tallennusta */ } },
};
// Kirjoituspelin tulokset omana listanaan ("beginner:w"): pisteet eivät ole verrattavissa oikeiden vastausten määrään
// Inarinsaamen tulokset omana listanaan ("beginner:w@smn")
// Kolmen elämän pelin ennätykset erikseen (|3); vanhat ennätykset ovat yhden yrityksen pelistä (2026-11-26)
const peliLives = () => (peliStore.get("satni-peli-lives", 3) === 1 ? 1 : 3);
const peliKey = (mode, write, sami = "sme", lives = peliLives()) => (write ? mode + ":w" : mode) + (sami === "smn" ? "@smn" : "") + (lives === 3 ? "|3" : "");
const peliTop = (mode, write = false, sami = "sme", lives = peliLives()) => (peliStore.get("satni-peli-top", {})[peliKey(mode, write, sami, lives)] || []);
function peliAddTop(mode, score, write = false, sami = "sme", lives = peliLives()) {
  const all = peliStore.get("satni-peli-top", {});
  mode = peliKey(mode, write, sami, lives);
  const list = (all[mode] || []).concat([{ score, date: new Date().toISOString().slice(0, 10) }])
    .sort((a, b) => b.score - a.score).slice(0, 3);
  all[mode] = list;
  peliStore.set("satni-peli-top", all);
  peliStore.set("satni-peli-games", peliStore.get("satni-peli-games", 0) + 1);  // pelattujen pelien määrä (valikon tilastot)
  return list;
}

async function loadPeli() {
  if (!peli) {
    peli = await (await fetch("data/minipeli.json")).json();
    // Kellonajat (kello.py): ilman tiedostoa kellopelit vain puuttuvat valikosta
    try { const r = await fetch("data/kello.json"); if (r.ok) peli.clock = (await r.json()).rows; } catch (e) { /* ei kellopeliä */ }
  }
  return peli;
}

const peliVariantMap = {};
const peliVariants = (sami = "sme") => peliVariantMap[sami] ||
  (peliVariantMap[sami] = Object.fromEntries(peliSet(sami).words.filter((w) => w[5]).map((w) => [w[0], w[5]])));

// Kysymyspakka: tilan sanat sekoitettuna; [saame, suomi, norja, ryhmä] (ryhmä: vaihtoehdot samasta ryhmästä)
function peliPool(mode, sami = "sme") {
  // Kello: [saame (beal njeallje), suomi (puoli neljä), digitaalinen (3.30), taso, indeksi]; norjaksi ja englanniksi
  // näytetään digitaalinen aika
  if (peliIsClock(mode)) return (peli.clock || []).map((r, i) => [r.sme, r.fiShort, `${r.h}.${String(r.m).padStart(2, "0")}`, r.level, i])
    .filter((w) => mode === "clockAll" || w[3] <= 2);
  const set = peliSet(sami);
  if (mode === "beginner" || mode === "advanced") {
    return peliLangWords(set.words, set).filter((w) => mode === "advanced" || w[4] === 1).map((w) => [w[0], w[1], w[2], w[3] || "N"]);
  }
  // Aika-aiheessa 5. kenttä = järjestysnumero Biretin palauteäänelle (audio/peli/aika-<i>-ok|no.ogg)
  // Indeksi ennen englannin suodatusta: Biretin äänitteet ovat alkuperäisen listan järjestyksessä
  return peliLangWords((set.cats[mode] || []).map((w, i) => [w[0], w[1], w[2], mode === "time" ? w[3] : mode, i]), set, mode);
}
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function peliQuestion(run) {
  const sami = peliSamiOf(run);
  const pool = peliPool(run.mode, sami);
  // Uusi pakka myös, jos tallennettu pakka on eri mittainen kuin sanalista (minipeli.json muuttui päivityksessä)
  if (run.pos >= run.deck.length || run.deck.length !== pool.length) { run.deck = shuffle(pool.map((_, i) => i)); run.pos = 0; }
  const item = pool[run.deck[run.pos++]];
  const ui = peliUi();
  if (peliIsClock(run.mode)) return peliClockQuestion(run, pool, item);
  if (run.write) {
    // Täysin oikein: sana, jonka käännökset kattavat kaikki kysymyksen merkitykset (ajatella: jurddašit ja smiehttat;
    // tuuli: biegga ja miella). Lähellä (-1 p): sana, jolla on vain osa merkityksistä (mieli, tuuli → biegga).
    const terms = (w) => w[ui].split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    const itemTerms = terms(item);
    const all = pool.concat(peliLangWords(peliSet(sami).words, peliSet(sami)));
    // Kirjoitusasut (sihkkar = sihkar) kelpaavat kuten sana itse (minipeli.json: sanan 6. kenttä)
    const withVariants = (list) => list.flatMap((w) => [w, ...((peliVariants(sami)[w]) || [])]);
    const accept = new Set(withVariants([item[0], ...all.filter((w) => { const t = terms(w); return itemTerms.every((x) => t.includes(x)); }).map((w) => w[0])]));
    const related = new Set(withVariants(all.filter((w) => !accept.has(w[0]) && terms(w).some((x) => itemTerms.includes(x))).map((w) => w[0]))
      .filter((w) => !accept.has(w)));
    return { sme: item[0], prompt: item[ui], toSme: true, write: true, accept: [...accept], related: [...related], answer: item[0], hints: 0,
      voice: PELI_VOICE[run.mode] && PELI_SAMI[sami].voice ? item[4] : null };
  }
  const toSme = Math.random() < 0.5;  // puolet kysymyksistä käännöksestä saameksi
  const shown = (w) => (toSme ? w[0] : w[ui]);
  // Väärät vaihtoehdot samasta ryhmästä (sanaluokka tai aihe), ei samaa näkyvää tekstiä kahdesti eikä sanaa, jolla on
  // yhteinen käännös oikean kanssa (ajatella: jurddašit ja smiehttat "miettiä, ajatella" olisivat molemmat oikein)
  const terms = (w) => w[ui].split(",").map((x) => x.trim());
  const itemTerms = terms(item);
  const same = shuffle(pool.filter((w) => w[3] === item[3] && w[0] !== item[0]));
  const rest = shuffle(pool.filter((w) => w[3] !== item[3]));
  const opts = [item], seen = new Set([shown(item)]);
  for (const w of same.concat(rest)) {
    if (opts.length === 4) break;
    if (seen.has(shown(w)) || terms(w).some((x) => itemTerms.includes(x))) continue;
    seen.add(shown(w));
    opts.push(w);
  }
  return { sme: item[0], prompt: toSme ? item[ui] : item[0], toSme, opts: shuffle(opts.map(shown)), answer: shown(item),
    voice: PELI_VOICE[run.mode] && PELI_SAMI[sami].voice ? item[4] : null };
}

// Kellokysymys: luku (kello näkyy, Ollugo diibmu lea?, vastaus saameksi) tai kuuntelu (Biret sanoo ajan, valitaan kello);
// kirjoituspelissä aina luku. Väärät vaihtoehdot mieluiten läheltä (sama tai seuraava tunti), jotta pitää lukea tarkasti.
function peliClockQuestion(run, pool, item) {
  const r = peli.clock[item[4]];
  const base = { sme: item[0], clock: [r.h, r.m], toSme: true, voice: item[4] };
  if (run.write) {
    // Kelpaa myös koko lause (diibmu lea …) ja vartti sanalla njealjádas (sanakirjan esimerkit: njealjádas váile guokte)
    const forms = [item[0], item[0].replace(/^kvárta /, "njealjádas ")];
    return { ...base, prompt: "", write: true, accept: [...new Set(forms.flatMap((f) => [f, `diibmu lea ${f}`]))], related: [], answer: item[0], hints: 0 };
  }
  const listen = Math.random() < 0.5;
  const near = (w) => Math.min(Math.abs(peli.clock[w[4]].h - r.h), 12 - Math.abs(peli.clock[w[4]].h - r.h)) <= 1;
  const others = shuffle(pool.filter((w) => w[4] !== item[4]));
  const opts = [item, ...others.filter(near).slice(0, 2)];
  for (const w of others) { if (opts.length === 4) break; if (!opts.includes(w)) opts.push(w); }
  const key = (w) => (listen ? String(w[4]) : w[0]);
  return { ...base, listen, prompt: listen ? item[0] : "", opts: shuffle(opts.map(key)), answer: key(item) };
}
// Kellokysymyksen ääni: lukukysymyksessä Biret kysyy (Ollugo diibmu lea?), kuuntelussa sanoo ajan
function peliClockSay(q) {
  if (!q || !q.clock || settings.gameMute || !canOpus) return;
  peliStopAudio();
  peliAudio = new Audio(q.listen ? `audio/w/kello-${q.voice}-sme.ogg` : "audio/peli/kello-q.ogg");
  peliAudio.play().catch(() => {});
}
const peliClockText = (q, o) => (q && q.listen && /^\d+$/.test(o) ? peli.clock[+o].sme : o);

// --- Näkymät ---
function peliHead(title, back) {
  renderPeliMute();  // kielen mukainen nimi
  $("peli-title").textContent = title;
  $("peli-back").hidden = !back;
  $("peli-rules-btn").hidden = back;  // säännöt vain valikossa
  $("peli-rules-btn").textContent = "ⓘ " + pt().rulesBtn;
  if (!back) $("peli-meta-head").replaceChildren();  // valikossa ei pisteitä otsikossa
  // Äänipainike vain, kun pelissä on ääntä: inarinsaamessa Biret ei puhu (pelissä pelin kieli, valikossa valittu kieli)
  $("peli-mute").hidden = !PELI_SAMI[back && peliRun ? peliSamiOf(peliRun) : peliMenuSami()].voice;
}

// Pelitapa: Vállje (valitse neljästä) tai Čále (kirjoita). Nimet saameksi, alla käyttöliittymän kielellä.
let peliWrite = !!peliStore.get("satni-peli-write", false);
const PELI_STYLE_ICON = {
  choose: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  write: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
};
function peliStyleSwitch() {
  const T = pt();
  // Pieni esikatselu: neljä vaihtoehtoa (yksi oikein) tai kirjoituskenttä vilkkuvalla kursorilla
  const art = { choose: '<span class="ps-grid4"><i></i><i class="on"></i><i></i><i></i></span>', write: '<span class="ps-field" lang="se">čá</span>' };
  const b = (id, sme, ui) => `<button type="button" role="radio" class="ps-opt" data-style="${id}" aria-checked="${(id === "write") === peliWrite}">` +
    `<span class="ps-art" aria-hidden="true">${art[id]}</span><span class="ps-txt"><b lang="${peliMenuSami() === "smn" ? "smn" : "se"}">${sme}</b><small>${esc(ui)}</small></span>` +
    `<span class="ps-check" aria-hidden="true">${PELI_OK}</span></button>`;
  const L = PELI_SAMI[peliMenuSami()];
  return `<div class="peli-style" role="radiogroup" aria-label="${esc(T.style)}">${b("choose", L.choose, T.choose)}${b("write", L.write, T.write)}</div>`;
}

// Elämät: 3 (oletus) tai yksi yritys; ennätykset erikseen
function peliLivesSwitch() {
  const T = pt(), n = peliLives();
  const b = (k, label) => `<button type="button" role="radio" class="pli-opt" data-act="lives" data-n="${k}" aria-checked="${k === n}">${label}</button>`;
  return `<div class="peli-lives" role="radiogroup" aria-label="${esc(T.livesLabel)}">${b(3, `<span class="pli-h">${PELI_HEART}${PELI_HEART}${PELI_HEART}</span> ${esc(T.lives3)}`)}${b(1, `<span class="pli-h">${PELI_HEART}</span> ${esc(T.lives1)}`)}</div>`;
}
// Kielivalinta (vain kun inarinsaame on otettu käyttöön asetuksista): kielten omat nimet
function peliSamiSwitch(sami) {
  if (!peliSamiEnabled()) return "";
  const T = pt();
  const b = (id) => `<button type="button" role="radio" class="pl-opt" data-sami="${id}" aria-checked="${id === sami}" lang="${id === "smn" ? "smn" : "se"}">` +
    `${PELI_SAMI[id].name}${id === "smn" ? ` <small lang="${sanastoLang()}">${esc(T.experimental)}</small>` : ""}</button>`;
  return `<div class="peli-sami" role="radiogroup" aria-label="${esc(T.samiLang)}">${b("sme")}${b("smn")}</div>`;
}
// Tilan alaotsikko: pohjoissaamessa kiinteät tekstit, inarinsaamessa sanamäärä (ei Biretin ääntä)
function peliModeSub(id, sami) {
  const T = pt();
  // Sanamäärä aina datasta (ennen kiinteä "Kaikki 1 089 sanaa", vaikka sanoja oli 1 079; testi 2026-11-21)
  if (id === "advanced") return T.allWords(peliPool(id, sami).length);
  if (sami === "sme" || id === "beginner") return T.modes[id][1];
  const n = peliPool(id, sami).length;
  return id === "advanced" ? T.allWords(n) : T.count(n);
}

function renderPeliMenu() {
  if (!peli) return;  // vasta loadPeli:n jälkeen (openPeli piirtää valikon, kun data on ladattu; yötesti 2026-11-24)
  peliHead(pt().title, false);
  const T = pt();
  const sami = peliMenuSami();
  const modes = peliModesFor(sami);
  const run = peliRun && peliRun.q && !!peliRun.write === peliWrite && peliSamiOf(peliRun) === sami ? peliRun : null;
  // V2 (test-fable): omat tulokset ylhäällä, jokainen peli rivinä (ennätys ja palkki), säännöt ⓘ-painikkeen takana.
  // Palkin täysi mitta: pelin sanamäärä, enintään 30 (pitkissä sanapeleissä 30 oikeaa peräkkäin täyttää palkin).
  const bests = modes.map((m) => peliTop(m.id, peliWrite, sami)[0]?.score ?? 0);
  const stat = (n, label) => `<div class="pm-stat"><b>${n}</b>${esc(label)}</div>`;
  const row = (m, i) => {
    const best = bests[i], goal = Math.max(1, Math.min(30, peliPool(m.id, sami).length));
    const unfinished = run && run.mode === m.id;
    return `<button type="button" class="peli-tile pm-row${unfinished ? " unfinished" : ""}" data-mode="${m.id}"${unfinished ? ' data-resume="1"' : ""} style="--tc: var(--flag-${m.color}); --tb: var(--btn-${m.color})">` +
      `<span class="pt-ico">${peliModeIcon(m.id)}</span><span class="pm-text"><span class="pt-name">${esc(T.modes[m.id][0])}` +
      (unfinished ? `<small> · ${esc(T.unfinished(run.score))}</small>` : "") + `</span>` +
      `<span class="pm-bar"><i style="width:${Math.round(100 * Math.min(1, best / goal))}%"></i></span></span>` +
      `<span class="pm-best${best ? "" : " none"}"><small>${esc(T.record)}</small><b>${best || T.none}${best >= goal ? " ✓" : ""}</b></span></button>`;
  };
  const rules = (peliWrite ? T.rulesWrite : T.rules).map((r, i, all) => (i === all.length - 1 && peliLives() === 3 ? [T.livesRule] : r)).map(([txt, pts]) =>
    `<li${pts ? ` class="${pts.startsWith("+") ? "gain" : "cost"}"` : ""}>${pts ? `<b>${esc(pts)}</b>` : ""}${esc(txt)}</li>`).join("");
  $("peli-body").innerHTML = peliSamiSwitch(sami) +
    `<div class="pm-stats">${stat(Math.max(0, ...bests), T.statStreak)}${stat(`${bests.filter(Boolean).length} / ${modes.length}`, T.statModes)}` +
    `${stat(peliStore.get("satni-peli-games", 0), T.statGames)}</div>` + peliStyleSwitch() + peliLivesSwitch() +
    `<ul class="peli-rules" aria-label="${esc(peliWrite ? T.leadWrite : T.lead)}"${$("peli-rules-btn").getAttribute("aria-expanded") === "true" ? "" : " hidden"}>${rules}</ul>` +
    `<div class="pm-list">${modes.map(row).join("")}</div>` +
    (run ? `<p class="pm-fresh"><button type="button" class="link-btn" data-act="fresh">${esc(T.restart)}</button></p>` : "");
}

function renderPeliResume() {
  const T = pt(), run = peliRun;
  peliHead(T.title, false);
  $("peli-body").innerHTML = `<div class="peli-card peli-ask" style="--tc: var(--flag-${PELI_MODES.find((m) => m.id === run.mode).color}); --tb: var(--btn-${PELI_MODES.find((m) => m.id === run.mode).color})">` +
    `<p class="peli-mode"><span class="pt-ico small">${peliModeIcon(run.mode)}</span>${esc(T.modes[run.mode][0])}${peliSamiOf(run) === "smn" ? " · " + PELI_SAMI.smn.name : ""}${run.write ? " · " + PELI_SAMI[peliSamiOf(run)].write : ""} · ${esc(run.write ? T.points(run.score) : T.score(run.score))}</p><h3>${esc(T.resumeQ)}</h3>` +
    `<div class="peli-actions"><button type="button" class="peli-primary" data-act="resume">${esc(T.resume)}</button>` +
    `<button type="button" class="peli-secondary" data-act="fresh">${esc(T.fresh)}</button></div></div>`;
}

// Pienet kuvakkeet: putki (liekki), paras (pokaali), oikein, väärin
const PI = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const PELI_FLAME = PI('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.4 2.5-5.3 3.6-8.4.4 2 1.6 3 2.6 3.5.2-2.6 1.5-4.9 3.4-6.5-.4 3 1.2 4.4 2.3 6.2 1 1.6 1.1 3 1.1 4.3C18.5 18.2 15.9 21 12 21z"/>');
const PELI_CUP = PI('<path d="M8 4h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3M16 6h2.5a2.5 2.5 0 0 1-2.6 3M12 12.5V16M9 20h6M10 16h4v4h-4z"/>');
const PELI_OK = PI('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
const PELI_NO = PI('<path d="M7 7l10 10M17 7L7 17"/>');

// Pitkä yksittäinen sana pienemmällä, jottei se katkea kesken (bearjadat, gaskavahkku, jievjaskuolfi)
const peliLongClass = (o) => { const n = Math.max(...o.split(/\s/).map((x) => x.length)); return n > 11 ? " xlong" : n > 8 ? " long" : ""; };

// Elämät (2026-11-26, käyttäjän ehdotus): väärä vastaus vie elämän, mutta sama sana jatkuu; väärä vaihtoehto
// himmenee, joten jäljellä on yksi vähemmän. Viimeinen elämä päättää pelin. Yhden yrityksen peli valittavissa.
const PELI_HEART = PI('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>');
// Tulossivun lista: pelin sanat (viimeisin ensin), ✓ ensimmäisellä yrityksellä, ✗ virheen jälkeen tai pelin
// päättänyt sana; sana avaa sanakortin, 🔊 soittaa sanan (sanastojen äänet sovelluksen mukana)
function peliPlayedHtml(run, T) {
  const log = (run.log || []).slice().reverse();
  if (!log.length) return "";
  const lang = peliSamiOf(run) === "smn" ? "smn" : "se";
  const clock = PELI_CLOCK.includes(run.mode);
  // ✓ vihreä: ensimmäisellä yrityksellä; ✓ oranssi: oikein virheen jälkeen; ✗: peli päättyi tähän sanaan
  const cls = (e) => (!e.ok ? "no" : e.miss ? "retry" : "ok");
  const rows = log.map((e) => `<li class="${cls(e)}"><span class="pp-mark" aria-label="${e.ok ? "✓" : "✗"}${e.miss ? ` (${e.miss})` : ""}">${e.ok ? PELI_OK : PELI_NO}</span>` +
    (clock ? `<span class="pp-w" lang="${lang}">${esc(e.w)}</span>`
      : `<button type="button" class="pp-w link-btn" data-act="card" data-w="${esc(e.w)}" lang="${lang}" title="${esc(T.openCard)}">${esc(e.w)}</button>`) +
    `<span class="pp-t">${esc(e.t)}</span>` +
    `<button type="button" class="pp-say" data-act="say" data-w="${esc(e.w)}" aria-label="${esc(T.listenTo)}: ${esc(e.w)}">${PELI_SOUND_ON}</button></li>`).join("");
  return `<details class="peli-played"${log.length <= 12 ? " open" : ""}><summary>${esc(T.played)} (${log.length})</summary><ul>${rows}</ul></details>`;
}
function peliHearts(run) {
  if (!run || (run.maxLives || 1) < 2) return "";
  const T = pt();
  // Yksi sydän ja luku: kolme sydäntä katkaisi pelin nimen yläpalkissa kapealla näytöllä
  return `<span class="peli-pill lives${run.lives ? "" : " empty"}" title="${esc(T.livesLeft(run.lives))}" aria-label="${esc(T.livesLeft(run.lives))}">` +
    `${PELI_HEART}<b>${run.lives}</b></span>`;
}
function peliUpdateHearts() {
  const el = document.querySelector(".peli-pill.lives");
  if (el && peliRun) el.outerHTML = peliHearts(peliRun);
}
// Pelin sanat tulossivulle: saame, käännös ja meniko ensimmäisellä yrityksellä
function peliLog(run, q, ok) {
  if (!run || !q || q.logged) return;
  q.logged = true;
  const item = q.clock ? null : peliPool(run.mode, peliSamiOf(run)).find((w) => w[0] === q.sme);
  (run.log ||= []).push({ w: q.sme, t: q.clock ? `${q.clock[0]}.${String(q.clock[1]).padStart(2, "0")}` : item ? item[peliUi()] : "", ok, miss: q.misses || 0 });
}
function renderPeliQuestion() {
  const T = pt(), run = peliRun, q = run.q;
  peliLast = { mode: run.mode, q, sami: peliSamiOf(run) };
  if (q.write) return renderPeliWrite();
  const color = PELI_MODES.find((m) => m.id === run.mode).color;
  peliHead(T.modes[run.mode][0], true);
  $("peli-body").innerHTML = `<div class="peli-play" style="--tc: var(--flag-${color}); --tb: var(--btn-${color})">` +
    `<div class="peli-stage"><div class="peli-meta">` +
    `<span class="peli-pill streak" title="${esc(T.streak)}">${PELI_FLAME}<b class="peli-score">${run.score}</b></span>` +
    `<span class="peli-pill best" title="${esc(T.best)}">${PELI_CUP}<b>${peliTop(run.mode, false, peliSamiOf(run), run.maxLives || 1)[0]?.score ?? 0}</b></span>${peliHearts(run)}</div>` +
    (q.clock ? peliClockStage(q, T)
      : `<p class="peli-q">${esc(q.toSme ? `${T.askUi(T.inLang[peliSamiOf(run)])}?` : T.askSme)}</p>` +
        `<p class="peli-word"${q.toSme ? "" : ' lang="se"'}>${esc(peliHy(q.prompt))}</p>`) + `</div>` +
    `<div class="peli-opts${q.clock && q.listen ? " clocks" : ""}">${q.opts.map((o, i) => `<button type="button" class="peli-opt" data-o="${esc(o)}">` +
      `<span class="po-key">${"ABCD"[i]}</span>` + (q.clock && q.listen ? `<span class="po-clock">${kelloSvg(peli.clock[+o].h, peli.clock[+o].m)}</span>`
        : `<span class="po-txt${peliLongClass(o)}"${q.toSme ? ' lang="se"' : ""}>${esc(peliHy(o))}</span>`) +
      `<span class="po-mark"></span></button>`).join("")}</div></div>` +
    `<p class="peli-report"><a href="#" class="report-link peli-report-link"><span aria-hidden="true">⚑</span> ${esc(T.report)}</a></p>`;
  peliMetaToHead();
  // Jo väärin valitut vaihtoehdot (elämä menetetty, sama sana jatkuu) pysyvät himmennettyinä myös jatkettaessa
  for (const b of document.querySelectorAll(".peli-opt")) if ((q.wrong || []).includes(b.dataset.o)) { b.disabled = true; peliMark(b, false); }
  peliShownAt = performance.now();
  peliClockSay(q);
}
// Kellokysymyksen yläosa: Biretin kysymys saameksi ja kello, tai kuuntelussa ohje, saamen aika ja Kuuntele uudelleen
function peliClockStage(q, T) {
  // Kuuntelu (käyttäjä 2026-11-23): äänet päällä aika on piilossa, kunnes käyttäjä pyytää tekstin (muuten tehtävän voi
  // ratkaista lukemalla); mykistettynä tai ilman Opus-tukea teksti näkyy heti
  if (q.listen) {
    const show = q.showText || settings.gameMute || !canOpus;
    return `<p class="peli-q">${esc(T.clockListen)}</p><p class="peli-word peli-clock-say${show ? "" : " masked"}" lang="se">${show ? esc(q.prompt) : "• • •"}</p>` +
      `<div class="peli-clock-tools">${show ? "" : `<button type="button" class="peli-secondary peli-clock-again" data-act="clock-again">🔊 ${esc(T.clockAgain)}</button>`}` +
      `${show ? "" : `<button type="button" class="peli-secondary peli-clock-text" data-act="clock-text">👁 ${esc(T.clockText)}</button>`}</div>`;
  }
  return `<p class="peli-q"><span lang="se">Ollugo diibmu lea?</span> <small>${esc(T.clockAsk)}</small></p>` +
    `<div class="peli-clock">${kelloSvg(q.clock[0], q.clock[1])}</div>`;
}
// Putki ja ennätys otsikkoriville (kysymyskortti pienemmäksi, vastaukset alas peukalon ulottuville)
function peliMetaToHead() {
  const meta = $("peli-body").querySelector(".peli-meta");
  if (meta) $("peli-meta-head").replaceChildren(...meta.children);
  meta?.remove();
}

// Parhaat tulokset: kolme parasta korokkeella (🥈 vasemmalla, 🥇 keskellä korkeimpana, 🥉 oikealla)
function peliPodium(top, isNew) {
  const MEDAL = ["🥇", "🥈", "🥉"];
  const step = (i) => {
    const r = top[i];
    return `<div class="pd-step p${i}${i === 0 && isNew ? " now" : ""}"><span class="pd-medal" aria-hidden="true">${MEDAL[i]}</span>` +
      `<b>${r ? r.score : "–"}</b><span class="pd-date">${r ? esc(r.date.slice(5).split("-").reverse().join(".") + ".") : ""}</span>` +
      `<span class="pd-block">${i + 1}</span></div>`;
  };
  return `<div class="peli-podium">${step(1)}${step(0)}${step(2)}</div>`;
}

// Oikea vastaus: iso peukalo kasvaa kysymyksen päälle, alla oikea saamen sana ja sen käännös
function peliSplash(q) {
  const item = peliPool(peliRun.mode, peliSamiOf(peliRun)).find((w) => w[0] === q.sme);
  const ui = item ? item[peliUi()] : "";
  const el = document.createElement("div");
  el.className = "peli-splash";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="ps-in"><span class="ps-thumb">👍</span><b lang="se">${esc(q.sme)}</b><span>${esc(ui)}</span></div>`;
  document.querySelector(".peli-play")?.appendChild(el);
}

function peliMark(btn, ok) {
  btn.classList.add(ok ? "right" : "wrong");
  btn.querySelector(".po-mark").innerHTML = ok ? PELI_OK : PELI_NO;
}

// Loppuikkunan painikkeet eivät reagoi heti: väärän vastauksen tuplanapautus (tai kaksi Enteriä kirjoituspelissä) osui
// muuten samalla kohdalla avautuvaan Pelaa uudelleen -painikkeeseen, ja uusi peli alkoi ennen kuin tuloksen ehti nähdä
// (OnePlus Nord, testi 2026-11-21)
let peliOverAt = 0;
const PELI_OVER_GUARD = 1000;  // OnePlus Nord: kaksi nopeaa napautusta tuli 700 ms:n välein
function renderPeliOver(chosen) {
  peliOverAt = performance.now();
  const T = pt(), run = peliRun, q = run.q, score = run.score, write = !!run.write;
  const prevBest = peliTop(run.mode, write, peliSamiOf(run), run.maxLives || 1)[0]?.score ?? 0;
  const top = peliAddTop(run.mode, score, write, peliSamiOf(run), run.maxLives || 1);
  peliLog(run, q, false);
  if ((run.maxLives || 1) > 1) { run.lives = 0; peliUpdateHearts(); }
  const isNew = score > 0 && score > prevBest;
  // Vastaukset näkyvissä: valittu väärä punaisella, oikea vihreällä
  for (const b of document.querySelectorAll(".peli-opt")) {
    b.disabled = true;
    if (b.dataset.o === q.answer) peliMark(b, true);
    else if (b.dataset.o === chosen) peliMark(b, false);
  }
  const mode = run.mode;
  peliRun = null;
  peliStore.set("satni-peli-run", null);
  const sheet = document.createElement("div");
  sheet.className = "peli-sheet";
  const sheetColor = PELI_MODES.find((m) => m.id === mode).color;
  sheet.style.setProperty("--tc", `var(--flag-${sheetColor})`);
  sheet.style.setProperty("--tb", `var(--btn-${sheetColor})`);
  sheet.innerHTML = `<div class="peli-sheet-in" role="dialog" aria-label="${esc(T.over)}">` +
    `<div class="peli-ring"><b>${score}</b><span>${esc((write ? T.points : T.score)(score).replace(/^\d+\s*/, ""))}</span></div>` +
    `<h3>${esc(T.over)}${isNew ? ` <span class="peli-new">${PELI_CUP}${esc(T.newBest)}</span>` : ""}</h3>` +
    `<p class="peli-correct">${esc(write ? T.youWrote : T.youAnswered)} <s${q.toSme ? ' lang="se"' : ""}>${esc(peliClockText(q, chosen))}</s> · ${esc(T.correctWas)} <b${q.toSme ? ' lang="se"' : ""}>${esc(peliClockText(q, q.answer))}</b></p>` +
    // Minuutit 20-40 saameksi puolesta tunnista: vihje, jos virhe osui sellaiseen aikaan (käyttäjä 2026-11-23)
    (q.clock && [20, 25, 35, 40].includes(q.clock[1]) ? `<p class="peli-cltip">${esc(t("harjClockTip"))}</p>` : "") +
    `<div class="peli-tops"><h4>${esc(T.top)}</h4>${peliPodium(top, isNew)}</div>` +
    `<div class="peli-actions"><button type="button" class="peli-primary" data-act="again" data-mode="${mode}">${esc(T.again)}</button>` +
    `<div class="peli-row"><button type="button" class="peli-secondary" data-act="menu">${esc(T.menu)}</button>` +
    `<button type="button" class="peli-secondary" data-act="home">${esc(T.home)}</button></div></div>` +
    (PELI_LIST[mode] ? `<p class="peli-list-link"><button type="button" class="link-btn" data-act="open-list" data-list="${PELI_LIST[mode]}">📖 ${esc(T.seeList)}</button></p>` : "") +
    peliPlayedHtml(run, T) +
    `<p class="peli-report"><a href="#" class="report-link peli-report-link"><span aria-hidden="true">⚑</span> ${esc(T.report)}</a></p></div>`;
  $("peli-body").querySelector(":scope > .peli-report")?.remove();
  document.querySelector(".pw-in")?.blur();  // näppäimistö alas, tulokset näkyviin
  document.querySelector(".peli-splash")?.remove();
  $("peli-body").appendChild(sheet);
  sheet.querySelector(".peli-primary").focus({ preventScroll: true });
}

function peliStart(mode) {
  peliStopAudio();
  peliBusy = false;  // edellisen pelin peukalon ajastin ei estä uuden pelin vastauksia
  peliRun = { mode, score: 0, deck: [], pos: 0, q: null, write: peliWrite, sami: peliMenuSami(), lives: peliLives(), maxLives: peliLives(), log: [] };
  peliRun.q = peliQuestion(peliRun);
  peliSave();
  renderPeliQuestion();
}
const peliSave = () => peliStore.set("satni-peli-run", peliRun);

// Viikonpäivät, vuodenajat ja kuukaudet sekä kysymyssanat: Biret sanoo saameksi oikean vastauksen ("Riekta, dat lei …" / "Boastut. Rievttes
// vástádus lea …"). Valmiit äänitteet (välimuistissa kuten sanastojen äänilistat), muissa peleissä ei ääntä.
// Ääniaiheet ja tiedostojen etuliite: aika = kokonaiset lauseet, kysymyssanat = Biretin lause + sanan oma äänite yhdistettynä
const PELI_VOICE = { time: "aika", questions: "kysy", clock: "kello", clockAll: "kello" };
let peliAudio = null;
function peliStopAudio() {
  if (!peliAudio) return;
  peliAudio.pause();
  peliAudio.removeAttribute("src");
  peliAudio.load();
  peliAudio = null;
}
function peliVoice(q, ok) {
  if (q.voice == null || !canOpus || settings.gameMute) return;
  peliStopAudio();
  peliAudio = new Audio(`audio/peli/${PELI_VOICE[peliRun.mode]}-${q.voice}-${ok ? "ok" : "no"}.ogg`);
  peliAudio.play().catch(() => {});
}

// Väärä vastaus, kun elämiä on jäljellä: elämä pois, sama sana jatkuu (palauttaa true). Ääntä ei soiteta, koska
// Biretin palautelause kertoisi oikean vastauksen.
function peliLoseLife() {
  const run = peliRun;
  if (!run || (run.lives || 1) <= 1) return false;
  run.lives--;
  run.q.misses = (run.q.misses || 0) + 1;
  peliUpdateHearts();
  const el = document.querySelector(".peli-pill.lives");
  if (el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  return true;
}
function peliAnswer(btn) {
  if (peliBusy || !peliRun || performance.now() - peliShownAt < 450) return;
  const q = peliRun.q;
  if (btn.dataset.o !== q.answer && peliLoseLife()) {
    btn.disabled = true;
    peliMark(btn, false);
    (q.wrong ||= []).push(btn.dataset.o);
    peliSave();
    return;
  }
  peliVoice(q, btn.dataset.o === q.answer);
  if (btn.dataset.o === q.answer) {
    peliBusy = true;
    peliMark(btn, true);
    peliSplash(q);
    peliLog(peliRun, q, true);
    peliRun.score++;
    const s = document.querySelector(".peli-score");
    if (s) { s.textContent = peliRun.score; s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); }
    // Seuraava kysymys vasta, kun Biret on sanonut lauseensa loppuun (enintään 3,5 s), muuten ääni puhuisi edellisestä
    // sanasta uuden kysymyksen aikana
    peliNext(q, 1000);
  } else {
    renderPeliOver(btn.dataset.o);
  }
}

// Seuraava kysymys vasta, kun Biret on sanonut lauseensa loppuun (enintään 3,5 s) ja peukalo on näkynyt (wait ms).
// Vain tämän kysymyksen ajastimet: edellisen kysymyksen 3,5 s:n varmistus ei saa ohittaa uutta peukaloa.
function peliNext(answered, wait) {
  const next = () => {
    if (!peliBusy || (peliRun && peliRun.q !== answered)) return;
    peliBusy = false;
    if (!peliRun) return;
    peliRun.q = peliQuestion(peliRun);
    peliSave();
    renderPeliQuestion();
  };
  if (peliAudio && !settings.gameMute) {
    const t0 = performance.now();
    peliAudio.addEventListener("ended", () => setTimeout(next, Math.max(250, wait - (performance.now() - t0))), { once: true });
    peliAudio.addEventListener("error", () => setTimeout(next, Math.max(0, wait - (performance.now() - t0))), { once: true });
    setTimeout(next, Math.max(3500, wait));
  } else {
    setTimeout(next, wait);
  }
}

// --- Čále: kirjoita sana saameksi ---
// Pisteet: 3 ilman vihjeitä, jokainen vihje -1; puuttuvat tarkkeet (cahci → čáhci) -1; ei koskaan alle nollan.
// Vihjeet heikoimmasta: kirjainten määrä, ensimmäinen kirjain, Biret sanoo sanan (Divvunin puhepalvelu: vaatii verkon
// tai aiemmin kuullun sanan; jos ääni ei onnistu, vihje ei maksa).
const PELI_FOLD = { á: "a", â: "a", ä: "a", č: "c", đ: "d", ŋ: "n", š: "s", ŧ: "t", ž: "z" };
// Pitkät sanat näytöllä pehmein tavuviivoin (minipeli.py: data.hy), jotta ne katkeavat oikeasta kohdasta
// (kolmas-kymmenes-ensimmäinen); vastausten tarkistus käyttää alkuperäisiä sanoja
const peliHy = (s) => (peli && peli.hy ? String(s).replace(/[^\s,;/()]+/g, (w) => peli.hy[w] || w) : String(s));
const peliNorm = (s) => s.normalize("NFC").toLowerCase().replace(/[’ʼ´`]/g, "'").replace(/\s+/g, " ").trim().replace(/[?!.]+$/, "");
const peliFold = (s) => s.replace(/[áâäčđŋšŧž]/g, (c) => PELI_FOLD[c]);
const peliPoints = (q, r) => Math.max(0, 3 - q.hints - (r.almost ? 1 : 0) - (r.related ? 1 : 0));

// { ok, almost, related, word }: oikein, tarkkeet puuttuvat, lähellä (vain osa merkityksistä) tai väärin;
// null, jos kenttä on tyhjä
function peliCheck(q, typed) {
  const t = peliNorm(typed);
  if (!t) return null;
  for (const [list, related] of [[q.accept, false], [q.related || [], true]]) {
    const n = list.map(peliNorm);
    let i = n.indexOf(t);
    if (i >= 0) return { ok: true, related, word: list[i], typed: t };
    i = n.findIndex((a) => peliFold(a) === peliFold(t));
    if (i >= 0) return { ok: true, almost: true, related, word: list[i], typed: t };
  }
  return { ok: false };
}

// Kirjainrivi: oletuksena näkyvissä; piiloutuu itsestään, kun käyttäjä kirjoittaa saamen kirjaimen omalla näppäimistöllään.
// Käsin valittu näytä/piilota (satni-peli-keys: "show" | "hide") voittaa automaattisen.
const peliKeysShown = () => { const m = peliStore.get("satni-peli-keys", null); return m ? m === "show" : !peliStore.get("satni-peli-kbd", false); };

function peliHintHtml(q) {
  const T = pt();
  if (!q.hints) return "";
  const word = q.sme;
  const cells = [...word].map((c, i) => c === " " ? '<span class="gap"></span>' : `<span>${q.hints >= 2 && i === 0 ? esc(c) : "&nbsp;"}</span>`).join("");
  return `<div class="pw-pattern" lang="se" aria-label="${esc(T.letters(word.replace(/ /g, "").length))}">${cells}</div>` +
    `<p class="pw-len">${esc(T.letters(word.replace(/ /g, "").length))}</p>`;
}

function peliHintButton(q) {
  const T = pt(), max = PELI_SAMI[peliSamiOf(peliRun)].hints;
  if (q.hints >= max && max < 3) return "";  // inarinsaame: ei kuunteluvihjettä
  if (q.hints >= 3) return `<button type="button" class="peli-secondary pw-hint-btn" data-act="listen">🔊 ${esc(T.listenAgain)}</button>`;
  return `<button type="button" class="peli-secondary pw-hint-btn" data-act="hint">💡 ${esc(T.hints[q.hints])} <span class="pw-cost">−1</span></button>`;
}

function renderPeliWrite() {
  const T = pt(), run = peliRun, q = run.q;
  const color = PELI_MODES.find((m) => m.id === run.mode).color;
  peliHead(T.modes[run.mode][0], true);
  const keys = peliKeysShown()
    ? `<div class="pw-letters" role="group" aria-label="${esc(T.keys)}" style="--keys:${PELI_SAMI[peliSamiOf(run)].keys.length + 1}">${PELI_SAMI[peliSamiOf(run)].keys.map((k) => `<button type="button" class="pw-key" data-key="${k}" lang="se">${k}</button>`).join("")}` +
      `<button type="button" class="pw-key x" data-act="keys-hide" aria-label="${esc(T.hideKeys)}" title="${esc(T.hideKeys)}">✕</button></div>`
    : `<button type="button" class="pw-show" data-act="keys-show">${esc(T.showKeys)}</button>`;
  const tip = peliStore.get("satni-peli-kbdtip", false) || peliStore.get("satni-peli-kbd", false) ? ""
    : `<p class="pw-tip"><span>⌨️</span><span>${esc(T.kbdTip)} <a href="${/Android/i.test(navigator.userAgent)
      ? "https://divvun.no/en/keyboards/installation_android.html" : "https://divvun.no/en/keyboards/mobileindex.html"}" target="_blank" rel="noopener">${esc(T.kbdLink)} ↗</a></span>` +
      `<button type="button" data-act="tip-close" aria-label="${esc(T.close)}">✕</button></p>`;
  $("peli-body").innerHTML = `<div class="peli-play" style="--tc: var(--flag-${color}); --tb: var(--btn-${color})">` +
    `<div class="peli-stage compact"><div class="peli-meta">` +
    `<span class="peli-pill streak" title="${esc(T.points(run.score))}">${PELI_FLAME}<b class="peli-score">${run.score}</b></span>` +
    `<span class="peli-pill best" title="${esc(T.best)}">${PELI_CUP}<b>${peliTop(run.mode, true, peliSamiOf(run), run.maxLives || 1)[0]?.score ?? 0}</b></span>${peliHearts(run)}</div>` +
    (q.clock ? peliClockStage(q, T) : `<p class="peli-q">${esc(T.askWrite(T.inLang[peliSamiOf(run)]))}</p><p class="peli-word">${esc(peliHy(q.prompt))}</p>`) +
    `<div class="pw-hint" aria-live="polite">${peliHintHtml(q)}</div></div>` +
    `<form class="pw-form" autocomplete="off"><input class="pw-in" type="text" lang="se" autocomplete="off" autocapitalize="none" autocorrect="off" ` +
    `spellcheck="false" enterkeyhint="go" aria-label="${esc(T.inputLabel)}"><button type="submit" class="peli-primary pw-check">${esc(T.check)}</button></form>` +
    keys + `<div class="pw-tools">${peliHintButton(q)}</div>` + tip + `</div>` +
    `<p class="peli-report"><a href="#" class="report-link peli-report-link"><span aria-hidden="true">⚑</span> ${esc(T.report)}</a></p>`;
  const inp = document.querySelector(".pw-in");
  inp.addEventListener("input", (e) => {
    // Saamen kirjain omalta näppäimistöltä: kirjainriviä ei enää tarvita (ellei käyttäjä ole valinnut toisin)
    if (e.isTrusted && e.data && /[áâäčđŋšŧž]/i.test(e.data) && !peliStore.get("satni-peli-kbd", false)) {
      peliStore.set("satni-peli-kbd", true);
      if (!peliStore.get("satni-peli-keys", null)) { document.querySelector(".pw-letters")?.remove(); document.querySelector(".pw-tip")?.remove(); }
    }
  });
  peliMetaToHead();
  peliShownAt = performance.now();
  peliClockSay(q);
  inp.focus({ preventScroll: true });
}

function peliInsertKey(k) {
  const inp = document.querySelector(".pw-in");
  if (!inp || inp.disabled) return;
  const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
  inp.setRangeText(k, a, b, "end");
  inp.focus({ preventScroll: true });
}

// Oikea kirjoitusasu, korjatut kirjaimet korostettuna (cahci → čáhci)
function peliDiffHtml(word, typed) {
  const w = [...peliNorm(word)], t = [...typed];
  if (w.length !== t.length) return esc(word);
  return w.map((c, i) => (c !== t[i] ? `<mark>${esc(c)}</mark>` : esc(c))).join("");
}

function peliSubmit() {
  if (peliBusy || !peliRun || !peliRun.q?.write) return;
  const q = peliRun.q, inp = document.querySelector(".pw-in");
  const r = peliCheck(q, inp.value);
  if (!r) { inp.focus(); return; }
  if (!r.ok && peliLoseLife()) {
    // Sama sana uudelleen: kenttä punaisena hetken, kirjoitettu teksti valittuna korjattavaksi
    inp.classList.remove("wrong"); void inp.offsetWidth; inp.classList.add("wrong");
    setTimeout(() => { inp.classList.remove("wrong"); inp.select(); }, 900);
    peliSave();
    return;
  }
  peliVoice(q, r.ok);
  if (!r.ok) {
    inp.classList.add("wrong");
    inp.disabled = true;
    return renderPeliOver(inp.value.trim());
  }
  peliLog(peliRun, q, true);
  const pts = peliPoints(q, r);
  peliBusy = true;
  inp.disabled = true;
  inp.classList.add(r.almost ? "almost" : "right");
  inp.blur();
  peliRun.score += pts;
  const s = document.querySelector(".peli-score");
  if (s) { s.textContent = peliRun.score; s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); }
  const item = peliPool(peliRun.mode, peliSamiOf(peliRun)).find((w) => w[0] === q.sme);
  const ui = item ? item[peliUi()] : "";
  const el = document.createElement("div");
  const soft = r.almost || r.related;
  el.className = "peli-splash" + (soft ? " almost" : "");
  el.setAttribute("aria-hidden", "true");
  // Lähellä: kirjoitettu sana (tarkkeet korjattuina) ja tähän paremmin sopiva sana
  const better = r.related ? `<span class="ps-better">${esc(pt().better)} <b lang="se">${esc(q.sme)}</b></span>` : "";
  el.innerHTML = `<div class="ps-in"><span class="ps-thumb">${soft ? "👌" : "👍"}</span>` +
    (soft ? `<span class="ps-almost">${esc(r.related ? pt().nearly : pt().almost)}</span>` : "") +
    `<b lang="se">${r.almost ? peliDiffHtml(r.word, r.typed) : esc(r.word)}</b>${better}<span class="ps-pts">+${pts}</span><span>${esc(ui)}</span></div>`;
  document.querySelector(".peli-play")?.appendChild(el);
  peliNext(q, r.related ? 3000 : r.almost ? 2400 : 1200);
}

let peliHintAt = 0;
async function peliHint(btn) {
  const q = peliRun?.q;
  if (!q || !q.write || peliBusy) return;
  // Tuplanapautus ei saa ottaa kahta vihjettä (kumpikin maksaa pisteen; testi 2026-11-21)
  if (performance.now() - peliHintAt < 600) return;
  peliHintAt = performance.now();
  if (q.hints < 2) {
    q.hints++;
    peliSave();
    document.querySelector(".pw-hint").innerHTML = peliHintHtml(q);
    btn.outerHTML = peliHintButton(q);
    document.querySelector(".pw-in")?.focus({ preventScroll: true });
    return;
  }
  // Kolmas vihje maksaa vain, jos ääni todella soi
  if (await peliSayWord(q.sme, btn) && peliRun?.q === q && q.hints < 3) {
    q.hints = 3;
    peliSave();
    document.querySelector(".pw-hint-btn").outerHTML = peliHintButton(q);
  }
}

async function peliSayWord(word, btn) {
  peliStopAudio();
  const signal = startTtsRequest();
  unlockTtsAudio();
  if (btn) btn.disabled = true;
  try {
    const blob = await ttsBlob(word, signal);
    if (!blob) return false;
    await playTtsBlob(blob);
    return true;
  } catch (e) {
    if (!signal.aborted && e.name !== "AbortError") toast(t("ttsFailed", e.message));
    return false;
  } finally {
    if (btn && btn.isConnected) btn.disabled = false;
  }
}

// --- Avaus ja sulkeminen ---
function openPeli() {
  stopTts();
  peliFromList = false;
  $("peli-view").hidden = false;
  overlayOpened();  // verkkoversion Takaisin sulkee pelin (app.js)
  loadPeli().then(() => {
    if (!peliRun) peliRun = peliStore.get("satni-peli-run", null);
    // Inarinsaamen keskeneräinen peli vain, jos inarinsaame on yhä käytössä asetuksissa
    // Kesken jäänyt peli näkyy valikon yläosassa Jatka-painikkeella (ei enää omana kysymysnäkymänään)
    if (!(peliRun && peliRun.q && PELI_MODES.some((m) => m.id === peliRun.mode) && (peliSamiOf(peliRun) === "sme" || peliSamiEnabled()))) peliRun = null;
    renderPeliMenu();
  }).catch(() => { $("peli-body").textContent = t("loadFailed", "minipeli.json"); });
}
// Peli pystyasennossa (käyttäjä 2026-11-23): lukitus näkymän avautuessa ja vapautus sulkeutuessa, kulki se mitä
// reittiä tahansa (Sulje, Takaisin, Koti, toinen näkymä). Android: SatniApp.lockPortrait; asennettu verkkosovellus:
// Screen Orientation API (toimii vain koko näytön tilassa, muuten ohitetaan).
function peliOrientation() {
  const on = !$("peli-view").hidden;
  try { if (window.SatniApp && window.SatniApp.lockPortrait) return window.SatniApp.lockPortrait(on); } catch (e) { /* ei siltaa */ }
  try { if (on) screen.orientation?.lock?.("portrait").catch(() => {}); else screen.orientation?.unlock?.(); } catch (e) { /* ei tukea */ }
}
if ($("peli-view")) new MutationObserver(peliOrientation).observe($("peli-view"), { attributes: true, attributeFilter: ["hidden"] });
// Sanastojen Pelaa-painike (2026-11-23): peli auki suoraan listan tilaan (valittu pelitapa); jos tila ei ole käytössä
// valitulla saamen kielellä (kello inariksi), näkyy valikko
// Pelaa-reitti (käyttäjä 2026-11-24): Takaisin pelistä tai tulosruudusta suoraan listaan, ei pelivalikon kautta
// (Android ja verkko samoin). Valikkoon itse siirtynyt käyttäjä palaa taas tavalliseen järjestykseen.
let peliFromList = false;
const peliSheetOpen = () => !!$("peli-body").querySelector(".peli-sheet");
// Kerros pelin sisällä: käynnissä oleva peli tai tulosruutu (Takaisin vie pelivalikkoon); ei Pelaa-reitillä
const peliInnerLayer = () => !$("peli-view").hidden && !peliFromList && ((peliRun && !$("peli-back").hidden) || peliSheetOpen());
function peliOpenMode(mode) {
  openPeli();
  peliFromList = true;
  loadPeli().then(() => { if (peliModesFor(peliMenuSami()).some((m) => m.id === mode)) peliStart(mode); }).catch(() => {});
}
// Pelitilan sanasto (tulossivun linkki): pelitila -> Sanastojen lista
const PELI_LIST = { colours: "varit", questions: "kysymykset", time: "viikonpaivat", ordinals: "luvut", animals: "elaimet", berries: "marjat", nearfar: "lahellajakaukana",
  clock: "kellonajat", clockAll: "kellonajat", daytime: "aika", beforeafter: "aikasanat", family: "suku", pronouns: "pronominit", greetings: "tervehdykset", reindeer: "porot", weather: "saa", herethere: "taallajatuolla", thisthat: "tamajase", smallwords: "sidesanat" };
function hidePeli() { peliStopAudio(); const was = !$("peli-view").hidden; $("peli-view").hidden = true; if (was) overlayClosed(); }
// Takaisin-ele: ensin pelistä tai tulosruudusta valikkoon (peli jää jatkettavaksi), sitten näkymä kiinni;
// Sanastojen Pelaa-reitillä suoraan listaan
function closePeli() {
  if ($("peli-view").hidden) return false;
  if (peliInnerLayer()) { renderPeliMenu(); return true; }
  hidePeli();
  return true;
}
// Mykistys koskee kaikkia pelejä ja säilyy asetuksissa, kunnes äänet kytketään takaisin
const PELI_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const PELI_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>';
function renderPeliMute() {
  const muted = !!settings.gameMute, b = $("peli-mute");
  b.innerHTML = muted ? PELI_SOUND_OFF : PELI_SOUND_ON;
  b.setAttribute("aria-pressed", String(muted));
  b.setAttribute("aria-label", muted ? pt().unmute : pt().mute);
  b.title = muted ? pt().unmute : pt().mute;
  b.classList.toggle("muted", muted);
}
function togglePeliMute() {
  settings.gameMute = !settings.gameMute;
  saveSettings();
  if (settings.gameMute) peliStopAudio();
  renderPeliMute();
}

function applyPeliButton() {
  const on = settings.game !== false;
  $("peli-btn").hidden = !on;
  if ($("game-toggle")) $("game-toggle").checked = on;
  if ($("game-smn-toggle")) $("game-smn-toggle").checked = !!settings.gameSmn;
  if (!on) hidePeli();
}

// Virheilmoitus pelin sanasta: sama lomake kuin sanakortissa ja sanastoissa (app.js: report-dlg)
function peliReport() {
  if (!peliLast) return;
  const dlg = $("report-dlg");
  dlg.classList.remove("ctx-mode");
  dlg.classList.add("list-mode", "game-mode");
  $("report-about").textContent = `${pt().title}: ${pt().modes[peliLast.mode][0]}`;
  $("report-word").value = peliLast.q.sme;
  $("report-text").value = "";
  dlg.querySelector('input[value="trans"]').checked = true;
  dlg.showModal();
}
function peliSendReport() {
  const L = t("reportLabels"), q = peliLast?.q;
  const kind = $("report-dlg").querySelector('input[name="report-kind"]:checked').value;
  const kindText = { trans: t("reportKindTrans"), inappropriate: t("reportKindBad"), other: t("reportKindOther") }[kind] || kind;
  const word = $("report-word").value.trim().slice(0, 80);
  const set = peli && peliSet(peliLast?.sami || "sme");
  const item = set && set.words.concat(...Object.values(set.cats)).find((w) => w[0] === word);
  const subject = `${t("reportSubject")} – ${pt().title}: ${word} (${t("reportSubjectKind")[kind] || kind})`;
  const body = [
    $("report-text").value.trim().slice(0, 1200), "",
    `--- ${t("reportDetails")} ---`,
    `${L.error}: ${kindText}`,
    `${pt().title}: ${peliLast ? pt().modes[peliLast.mode][0] : ""}${peliLast?.sami === "smn" ? " (" + PELI_SAMI.smn.name + ")" : ""}`,
    word ? `${L.word}: ${word}` : "",
    item ? `${L.shown}: ${sanastoLang() === "en" ? (set.en || {})[item[0]] || "" : item[peliUi()]}` : "",
    q && q.toSme ? `${L.search}: ${q.prompt}` : "",
    `${L.ui}: ${UI_LANGUAGES[settings.uiLang].name}`,
    `${L.version}: ${$("about-version").textContent}`,
  ].filter((line, i) => line !== "" || i === 1).join("\n");
  openReportMail(subject, body);
}

function bindPeli() {
  if (!$("peli-view")) return;
  $("peli-btn").innerHTML = PELI_ICON;
  $("peli-btn").onclick = openPeli;
  $("peli-close").onclick = hidePeli;
  $("peli-mute").onclick = togglePeliMute;
  $("peli-rules-btn").onclick = () => {
    const b = $("peli-rules-btn"), open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    const list = $("peli-body").querySelector(".peli-rules");
    if (list) list.hidden = !open;
  };
  renderPeliMute();
  $("peli-back").onclick = () => { peliFromList = false; renderPeliMenu(); };
  if ($("game-toggle")) {
    $("game-toggle").onchange = (e) => { settings.game = e.target.checked; saveSettings(); applyPeliButton(); };
  }
  if ($("game-smn-toggle")) {
    // Inarinsaame minipelissä: kielivalinta näkyy pelin valikossa vain, kun tämä on päällä
    $("game-smn-toggle").onchange = (e) => {
      settings.gameSmn = e.target.checked;
      saveSettings();
      if (!$("peli-view").hidden && $("peli-back").hidden) renderPeliMenu();
    };
  }
  applyPeliButton();
  $("peli-body").addEventListener("click", (e) => {
    const tile = e.target.closest(".peli-tile");
    if (tile) return tile.dataset.resume ? renderPeliQuestion() : peliStart(tile.dataset.mode);
    const lang = e.target.closest(".pl-opt");
    if (lang) { peliStore.set("satni-peli-sami", lang.dataset.sami); return renderPeliMenu(); }
    const style = e.target.closest(".ps-opt");
    if (style) { peliWrite = style.dataset.style === "write"; peliStore.set("satni-peli-write", peliWrite); return renderPeliMenu(); }
    const key = e.target.closest(".pw-key[data-key]");
    if (key) return peliInsertKey(key.dataset.key);
    const opt = e.target.closest(".peli-opt");
    if (opt && !opt.disabled) return peliAnswer(opt);
    if (e.target.closest(".peli-report-link")) { e.preventDefault(); return peliReport(); }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (e.target.closest(".peli-sheet") && performance.now() - peliOverAt < PELI_OVER_GUARD) return;
    if (act === "resume") renderPeliQuestion();
    else if (act === "fresh") { peliRun = null; peliSave(); renderPeliMenu(); }
    else if (act === "again") peliStart(e.target.closest("[data-act]").dataset.mode);
    else if (act === "menu") { peliFromList = false; renderPeliMenu(); }
    else if (act === "clock-again") peliClockSay(peliRun?.q);
    else if (act === "open-list") {
      const id = e.target.closest("[data-act]").dataset.list;
      hidePeli();
      if (typeof openSanastot === "function") { sanastoAuki = id; openSanastot(); }
    }
    else if (act === "clock-text" && peliRun?.q?.listen) {
      peliRun.q.showText = true;
      peliSave();
      const say = document.querySelector(".peli-clock-say");
      if (say) { say.textContent = peliRun.q.prompt; say.classList.remove("masked"); }
      e.target.closest("[data-act]").remove();
    }
    else if (act === "say") peliSayWord(e.target.closest("[data-act]").dataset.w, e.target.closest("[data-act]"));
    else if (act === "card") { const w = e.target.closest("[data-act]").dataset.w; hidePeli(); if (typeof search === "function") search(w); }
    else if (act === "lives") { peliStore.set("satni-peli-lives", Number(e.target.closest("[data-act]").dataset.n) === 1 ? 1 : 3); renderPeliMenu(); }
    else if (act === "hint") peliHint(e.target.closest("[data-act]"));
    else if (act === "listen") peliSayWord(peliRun?.q?.sme, e.target.closest("[data-act]"));
    else if (act === "keys-hide" || act === "keys-show") {
      peliStore.set("satni-peli-keys", act === "keys-show" ? "show" : "hide");
      const inp = document.querySelector(".pw-in"), v = inp?.value ?? "";
      renderPeliWrite();
      document.querySelector(".pw-in").value = v;
    } else if (act === "tip-close") { peliStore.set("satni-peli-kbdtip", true); e.target.closest(".pw-tip")?.remove(); }
    else if (act === "home") {
      hidePeli();
      whenOverlayHistoryIdle(() => { if (location.hash) { history.pushState(null, "", location.pathname + location.search); routeFromHash(); } });
    }
  });
  $("peli-body").addEventListener("submit", (e) => { e.preventDefault(); peliSubmit(); });
  // Kirjainrivin napautus ei saa viedä kohdistusta kentästä (puhelimen näppäimistö pysyy auki)
  for (const ev of ["pointerdown", "mousedown"]) {
    $("peli-body").addEventListener(ev, (e) => { if (e.target.closest(".pw-key, .pw-hint-btn")) e.preventDefault(); });
  }
  overlayLayerFns.push(() => (peliInnerLayer() ? 1 : 0));  // käynnissä oleva peli tai tulosruutu (app.js); ei Pelaa-reitillä
  // Takaisin-ele (MainActivity: closeOcr) ja Esc: ensin avoin ikkuna, sitten peli
  const closeOcrBase = window.closeOcr;
  window.closeOcr = () => {
    const d = document.querySelector("dialog[open]");
    if (d) { d.close(); return true; }
    return closePeli() || (closeOcrBase ? closeOcrBase() : false);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]") && closePeli()) e.preventDefault();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) peliStopAudio(); });
  // Kieli vaihtui kesken: näkymä uudelleen oikealla kielellä
  const setUiBase = window.setUiLanguage;
  window.setUiLanguage = (code) => { setUiBase(code); if (!$("peli-view").hidden) (peliRun && !$("peli-back").hidden ? renderPeliQuestion : renderPeliMenu)(); };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindPeli); else bindPeli();
