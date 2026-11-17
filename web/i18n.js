"use strict";
/* Käyttöliittymän tekstit: suomi (oletus) ja norja (bokmål). Avaimet ovat samat molemmissa kielissä.
   Funktiona annettu teksti saa parametrit, esim. t("noHits", "dahkat"). index.html:ssä elementit
   merkitään data-i18n-attribuuteilla (ks. applyStaticTexts app.js:ssä). */

const UI_LANGUAGES = {
  fi: { name: "Suomi", translationLang: "fin" },
  nb: { name: "Norsk", translationLang: "nob" },
};

const UI_TEXTS = {
  fi: {
    title: "Sátni FST – pohjoissaamen sanakirja ja taivutin",
    brandSub: "Pohjoissaamen avoin sanakirja ja taivutusgeneraattori",
    uiLanguage: "Käyttöliittymän kieli", language: "Kieli",
    sidebar: "Historia ja suosikit",
    theme: "Teema", themeAuto: "Automaattinen", themeLight: "Vaalea", themeDark: "Tumma",
    about: "Tietoa",
    searchPlaceholder: "Hae saameksi, käännöksellä tai taivutusmuodolla",
    // Kapealle kentälle lyhyemmät (app.js: fitSearchPlaceholder valitsee pisimmän, joka mahtuu)
    searchPlaceholderMid: "Hae saameksi tai suomeksi", searchPlaceholderShort: "Hae sanaa",
    search: "Hae",
    ocrTitle: "Hae sanaa valokuvasta", ocrCamera: "📷 Ota kuva", ocrGallery: "🖼️ Valitse kuva",
    ocrIntro: "Ota kuva saamen- tai suomenkielisestä tekstistä tai valitse kuva, ja valitse suunta yltä. Teksti tunnistetaan puhelimessa, eikä kuva lähde laitteelta.",
    ocrWorking: "Tunnistetaan tekstiä…", ocrFinding: "Haetaan sanoja…",
    ocrFound: (n) => `Sanakirjan sanoja ${n} · napauta sanaa · zoomaa sormilla`,
    ocrSami: "Saame", ocrUiLang: "Suomi", ocrDirTitle: "Vaihda suuntaa",
    ocrStyle: "Merkintätapa ja väri", ocrFrame: "Kehys", ocrUnderline: "Alleviivaus",
    ocrNoText: "Kuvasta ei löytynyt tekstiä. Kokeile ottaa kuva lähempää ja suoraan edestä.",
    ocrNoWords: "Tekstiä löytyi, mutta ei sanakirjan sanoja.",
    ocrDirSwitched: "suunta vaihdettu", ocrAlso: "tai", ocrUnknown: "ei löytynyt", ocrNearest: "ei löytynyt, lähimmät:", ocrEdit: "Muokkaa hakua", ocrRotateLeft: "Käännä kuvaa vasemmalle", ocrRotateRight: "Käännä kuvaa oikealle",
    experimental: "Kokeelliset käännökset", experimentalOn: "Käytössä", experimentalOff: "Pois käytöstä",
    experimentalHint: "Konekäännöksiä ja ehdotuksia sanoille, joilla ei ole käännöstä sanakirjoissa. Ne ovat vielä kehitteillä, ja niissä voi olla virheitä. Palaute auttaa!",
    // Lausekääntäjä (test-lauseet, lauseet.js)
    lauseTitle: "Lausekääntäjä", lauseBadge: "kokeilu", lauseShort: "Lause", ocrShort: "Kuva", expLauseDesc: "Lyhyt suomenkielinen lause saameksi. Avataan yläpalkin puhekuplasta.",
    expLauseInfo: `<p>Yläpalkkiin tulee <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> puhekuplapainike, joka avaa lausekääntäjän: kirjoita lyhyt suomenkielinen lause, niin sovellus
      tekee siitä pohjoissaamenkielisen lauseen sanakirjan sanoista ja taivutusmuodoista.</p>
      <p>Jokainen sana näkyy omana laatikkonaan; napauttamalla voit vaihtaa tulkinnan tai saamen sanan. Lause on
      likimääräinen: se sopii lyhyisiin arkilauseisiin, ei pitkiin tai vaikeisiin.</p>`,
    lauseHint: "Kirjoita lyhyt suomenkielinen lause. Napauta sanaa nähdäksesi tulkinnan tai vaihtaaksesi saamen sanan.",
    lausePlaceholder: "saisinko yhden kahvin ja voileivän?", lauseUnknown: "tuntematon", lauseDidYouMean: "tarkoititko",
    lauseSkip: "Ohita sana", lauseResult: "Saameksi (likimääräinen, tarkista sanat)",
    lauseSearchWord: (w) => `Hae sanakirjasta: ${w}`,
    lauseReading: "Tulkinta", lauseSamiWord: "Saamen sana", lauseForm: "Muoto", lauseSmeForm: "Saamen taivutusmuoto", lauseAuto: "automaattinen",
    lauseForm_place_Ade: "paikassa (missä?)", lauseForm_means_Ade: "keinona (millä?)", lauseForm_top_Ade: "päällä",
    lauseForm_place_Abl: "paikasta (mistä?)", lauseForm_top_Abl: "päältä",
    lauseForm_place_All: "paikkaan (mihin?)", lauseForm_top_All: "päälle",
    sanastot: "Sanastot", back: "Takaisin", stop: "Pysäytä", sanastoIntro: (n, w) => `${n} aihetta, ${w} sanaa ääntämyksineen`, sanastoIntroSmn: (n, w) => `${n} aihetta, ${w} sanaa inarinsaameksi (perusmuodot, ilman ääntämystä)`, sanastoGroup_perus: "Perussanat", sanastoGroup_aika: "Aika", sanastoGroup_ihmiset: "Ihmiset", sanastoGroup_luonto: "Luonto", sanastoHelp: "Napauta sanaa: kuuntele, kopioi tai avaa sanakortti.", sanastoHelpSmn: "Napauta sanaa kopioidaksesi sen.", sanastoCard: "Avaa sanakortti", sanastoListenAll: "Kuuntele lista", sanastoListenHint: "suomi → saame", sanastoCardinal: "Perusluku", sanastoCardinalEx: "yksi, kaksi, kolme", sanastoOrdinal: "Järjestysluku", sanastoOrdinalEx: "ensimmäinen, toinen",
    lauseClear: "Tyhjennä lause", lauseCheckWord: "Näytä sanan tiedot", lauseInSentence: "Tässä lauseessa", lauseChoose: "Valitse tämä", lauseFullCard: "Koko sanakortti",
    expOcr: "Valokuvahaku", expOcrDesc: "Tunnistaa valokuvan tekstistä sanakirjan sanat. Käynnistys yläpalkin kamerapainikkeesta.",
    expOcrInfo: `<p>Yläpalkkiin tulee <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> kamerapainike. Ota kuva tekstistä tai valitse kuva, ja sanakirjan sanat merkitään
      kuvaan. Napauta sanaa, niin näet käännöksen.</p>
      <p>Teksti tunnistetaan puhelimessa Googlen ML Kitillä, eikä kuva lähde laitteelta. ML Kit voi lähettää Googlelle
      nimettömiä käyttötilastoja, kun toimintoa käytetään.</p>`,
    expTableTr: "Taivutusmuotojen käännökset", expTableTrDesc: "Konekäännös jokaisen muodon alla taivutustaulukossa.",
    positionOn: "päällä", positionUnder: "alla",
    expTableTrInfo: `<p>Taivutustaulukon muotojen alle tulee konekäännös pienellä: <i>mun lean – minä olen</i>. Duaali merkitään
      numerolla: <i>moai letne – me (2) olemme</i>.</p>
      <p>Käännökset muodostetaan automaattisesti sanan ensimmäisestä käännöksestä, joten ne eivät ole aina oikein.
      Muodolla, jolle käännöstä ei saada, ei näytetä mitään.</p>`,
    tableTrNote: "Käännökset on muodostettu automaattisesti.",
    expApertium: "Norjannokset konekäännöksenä", expApertiumDesc: "Apertium: norjannos sanoille, joilla sitä ei ole sanakirjoissa.",
    expApertiumInfo: `<p>Kun käännöskielenä on norja ja sanalta puuttuu käännös, sanakortissa näytetään käännös
      Apertium-konekääntimen sanastosta (apertium-sme-nob).</p>
      <p>Sanasto on tehty konekääntämistä varten, ei sanakirjaksi. Käännös voi olla karkea tai väärä, eikä sitä ole
      tarkistettu. Nämä käännökset eivät vaikuta hakuun.</p>`,
    apertiumNote: "Apertium, tarkistamaton",
    expPivotFin: "Suomennosehdotukset", expPivotFinDesc: "Muiden kielten kautta sanoille, joilla ei ole suomennosta sanakirjoissa.",
    expPivotFinInfo: `<p>Kun käännöskielenä on suomi ja sanalta puuttuu suomennos, sanakortissa näytetään ehdotus, joka on
      muodostettu toisen kielen kautta: inarinsaamen käännöksestä GiellaLT:n inarinsaamen ja suomen sanakirjoilla tai,
      jos sitä ei ole, suomennoksesta, joka muilla sanoilla on samalle norjan sanalle.</p>
      <p>Pistokokeissa noin yhdeksän kymmenestä inarin kautta tulleesta ja neljä viidestä norjan kautta tulleesta
      ehdotuksesta oli oikein. Ehdotuksia ei ole tarkistettu, eivätkä ne vaikuta hakuun.</p>`,
    pivotFinNote: { smn: "inarinsaamen kautta, tarkistamaton", nob: "norjan kautta, tarkistamaton" },
    wiktEngNote: "Wiktionary suomen ja norjan kautta, tarkistamaton",
    register: { vulgar: "alatyylinen", derogatory: "halventava", offensive: "loukkaava" },
    registerNote: "Wiktionaryn mukaan sanaa pidetään alatyylisenä, halventavana tai loukkaavana",
    expEnable: "Ota käyttöön", cancel: "Peruuta", smsVia: "suomen kautta, likimääräinen",
    // Koltansaame Muut kielet -kohdassa: varoitus päälle kytkettäessä ja valinta pohjoissaamen sanakorteille
    // Virheilmoitus sanakortista (app.js: openReport, sendReport)
    reportError: "Ilmoita virheestä", reportWhat: "Mikä on väärin?", reportKindTrans: "Käännös on väärä tai huono",
    reportKindWord: "Haku toi kokonaan väärän sanan", reportKindForm: "Taivutusmuoto on väärin", reportKindOther: "Muu",
    reportFix: "Mikä olisi oikein? (valinnainen)", reportSend: "Valmistele sähköposti", reportSubject: "Sátni FST: virheilmoitus",
    reportSubjectKind: { trans: "käännös", word: "väärä sana", form: "taivutus", sme: "saamen sana", audio: "äänite", inappropriate: "sopimaton", other: "muu" },
    // Virheilmoitus sanastolistasta (sanastot.js)
    reportKindSme: "Saamen sana tai muoto on väärin", reportKindAudio: "Äänitteessä on virhe",
    reportWhichWord: "Mikä sana? (valinnainen)", reportList: "Sanasto",
    // Minipeli (minipeli.js)
    minipeli: "Minipeli", gameButton: "Minipeli yläpalkissa", gameSmn: "Inarinsaame minipelissä ja sanastoissa", gameSmnNote: "", reportKindBad: "Sana on sopimaton",
    reportDetails: "Tiedot ilmoituksesta",
    reportLabels: { error: "Virhe", word: "Sana", shown: "Näytetty käännös", search: "Hakusana", ui: "Käyttöliittymä",
      other: "muut kielet", version: "Versio", link: "Linkki" },
    smsUnchecked: "tarkistamaton", skoltDlgTitle: "Otetaanko koltansaame käyttöön?",
    skoltDlgBody: `<p>Koltansaamen sanat tulevat GiellaLT:n suomi–koltansaame- ja norja–koltansaame-sanakirjoista.
      Koltansaamen puhuja ei ole vielä tarkistanut niitä, joten ne voivat olla epätarkkoja. Sanat näkyvät, kun haet suomeksi.</p>`,
    skoltViaLabel: "Näytä koltansaame myös pohjoissaamen sanakortissa",
    skoltViaDesc: "Suomennoksen kautta, likimääräinen: noin joka kolmas voi olla väärä.",
    skoltViaShort: "Myös pohjoissaamen sanoille (likimääräinen)",
    ocrError: "Kuvan käsittely ei onnistunut.", ocrNoApp: "Kamerasovellusta ei löytynyt.",
    showGrade: "Näytä astevaihtelu",
    settings: "Asetukset", otherLanguages: "Muut kielet",
    extraLangsHint: "Valittujen kielten käännökset näkyvät sanakortissa suomennoksen lisäksi, ja niillä voi myös hakea.",
    voice: "Ääni",
    // Asetukset omana näkymänään (2026-11-14)
    setGeneral: "Yleiset", setMore: "Lisää", setLook: "Kieli ja ulkoasu", setCard: "Sanakortti ja ääntäminen",
    setLangs: "Käännöskielet", setTools: "Työkalut", setHistory: "Historia ja suosikit", setAbout: "Tietoa sovelluksesta",
    themeNote: "Automaattinen seuraa laitteen asetusta.",
    textSize: "Tekstin koko", textSizeSystem: "Laitteen", textSizeNote: "Laitteen: sama tekstikoko kuin laitteen omissa asetuksissa.",
    previewHouse: "talo", previewInHouse: "talossa",
    showGradeDesc: "Vahva ja heikko aste väreinä", voiceHead: "Ääntämisen ääni",
    toolsIntro: "Päälle kytketyn työkalun painike näkyy yläpalkissa. BETA-merkityt ovat vielä kehitteillä.",
    toolGameDesc: "Sanapeli: valitse oikea vaihtoehto tai kirjoita sana saameksi.", toolWordlistsDesc: "Aihekohtaiset sanalistat ääntämyksineen.",
    toolAlways: "Aina", toolSmnDesc: "Sanat myös inarinsaameksi; osa vielä tarkistamatta.",
    langSource: { eng: "Wiktionary ja Giellatekno", smn: "Giellatekno", smj: "Giellatekno", sma: "Giellatekno", spa: "dict-sme-spa (UNED)", sms: "suomennosten kautta" },
    historyNote: "Suosikit ja historia näkyvät valikossa ja aloitussivulla.",
    sumGradeOn: "Astevaihtelu näkyy", sumGradeOff: "Astevaihtelu piilossa", sumNone: "Ei valittuja", sumOff: "Ei painikkeita",
    sumExp: (n) => (n ? `${n} käytössä` : "Ei käytössä"), sumHistory: (n) => `${n} hakua historiassa`,
    sumTextSystem: "laitteen tekstikoko", sumText: (n) => `tekstikoko ${n} %`, sumTheme: { auto: "automaattinen teema", light: "vaalea teema", dark: "tumma teema" },
    gradeStyleHead: "Astevaihtelun merkintä", gradeGdColor: "Vahva aste (GD)", gradeHdColor: "Heikko aste (HD)",
    gradeUnderline: "Alleviivaus", gradeUnderlineDesc: "Vahva aste yhtenäisellä viivalla, heikko katkoviivalla: erottuu ilman värejäkin.",
    gradeCvd: "Värisokeille sopiva: sininen ja oranssi", gradeSample: "esimerkki",
    gradeColors: { green: "vihreä", orange: "oranssi", blue: "sininen", purple: "violetti", red: "punainen", brown: "ruskea", none: "ei väriä" },
    sumUnderline: "alleviivaus",
    clearSearch: "Tyhjennä haku", historyRemoved: (w) => `Poistettu historiasta: ${w}`, historyHint: "Pitkä painallus poistaa sanan historiasta.",
    navLabel: "Päävalikko", navSearch: "Haku", navGame: "Peli", navSentence: "Lause", navPhoto: "Kuva", navMore: "Lisää",
    sanastoPrev: "edellinen", sanastoNext: "seuraava", menuFeedback: "Palaute", menuSupport: "Tue", menuAbout: "Tietoa ja lisenssit", historyAll: (n) => `Näytä kaikki (${n})`, sanastoCount: (n, w) => `${n} aihetta · ${w} sanaa`,
    recentHead: "Viimeksi haetut", expTools: "Uudet työkalut", expMore: "Lisää käännöksiä",
    favourites: "★ Suosikit", history: "Historia", searchingForms: "Haetaan muotoja…", clearHistory: "Tyhjennä historia", clearHistoryTitle: "Tyhjennetäänkö historia?",
    clearHistoryBody: "Kaikki hakuhistoria poistetaan. Suosikit säilyvät.", clearHistoryOk: "Tyhjennä", historyMore: "Lisää…",
    supportStory: `<p><strong>Buorre beaivi! Olen Juha Somby.</strong></p>
      <p>UNESCO luokittelee kaikki saamen kielet uhanalaisiksi, ja puhujia on kaikkiaan arviolta alle 30 000. Pienille
         kieliyhteisöille ja alkuperäiskansoille saavutettavat digitaaliset työkalut, kuten oikolukijat, morfologiset
         jäsentimet (FST), sanakirjat ja oppimisvälineet, ovat tärkeitä, jotta kieli pysyy elävänä nykyajan arjessa.</p>
      <p>Teen maksuttomia ja avoimen lähdekoodin sovelluksia ja työkaluja pohjoissaamelle ja muille saamen kielille.</p>`,
    supportHelpTitle: "Näin voit auttaa",
    supportCoffeeTitle: "Miksi tukea?",
    supportCoffee: `<p>Avoimen kieliteknologian kehittäminen ja ylläpito vie aikaa ja vaatii aineiston ja koodin jatkuvaa hoitoa.
         Tarjoamalla kahvit tuet suoraan tätä työtä:</p>
      <ul class="support-ways">
        <li>työkalut pysyvät maksuttomina ja avoimina oppijoille, äidinkielisille puhujille ja tutkijoille</li>
        <li>uhanalaisille kielille rakentuu nykyaikaista digitaalista infrastruktuuria</li>
        <li>yhteisölle syntyy uusia työkaluja, jäsentimiä ja vuorovaikutteisia sovelluksia</li>
      </ul>`,
    supportNote: `Tuki on vapaaehtoista eikä avaa mitään lisäominaisuuksia: sovellus ja sanakirja pysyvät kaikille maksuttomina.
      Tuki menee sovelluksen kehittäjälle, ei sanakirjojen tekijöille. Sanakirja-aineisto on GiellaLT:n, Divvunin,
      Giellateknon ja muiden tekijöiden työtä.`,
    supportThanks: "Giitu olu! Kiitos, että tuet saamen kieliteknologiaa!",
    supportWays: `<li><strong>Korjaa käännöksiä ja sanoja:</strong> kerro virheellisestä käännöksestä tai puuttuvasta sanasta.</li>
      <li><strong>Ilmoita virheistä:</strong> kerro, jos jokin ei toimi tai näyttää oudolta.</li>
      <li><strong>Ehdota ideoita:</strong> uusia ominaisuuksia, teemoja tai käyttöliittymän muutoksia.</li>
      <li><strong>Saavutettavuus:</strong> kerro, mikä helpottaisi käyttöä, jos sinulla on esimerkiksi näkö- tai liikuntavamma tai lukivaikeus.</li>
      <li><strong>Osallistu kehitykseen:</strong> lähdekoodi on avointa, ja korjaukset ovat tervetulleita.</li>`,
    noFavourites: "Ei vielä suosikkeja", noHistory: "Ei hakuja",
    addFavourite: "Lisää suosikkeihin", removeFavourite: "Poista suosikeista",
    loadingTitle: "Ladataan sanakirjaa…",
    loadingText: "Ensimmäisellä kerralla ladataan noin 47 Mt. Sen jälkeen sanakirja toimii myös ilman verkkoyhteyttä.",
    loadingLocal: "Sanakirja on mukana sovelluksessa, joten mitään ei ladata verkosta. Avaaminen kestää muutaman sekunnin.",
    unpacking: "Puretaan…",
    loadFailed: (status) => `Sanakirjan lataus epäonnistui (${status})`,
    loadFailedLong: (msg) => `Sanakirjan lataus epäonnistui: ${msg}`,
    welcomeTitle: "Bures boahtin! – Tervetuloa",
    welcomeLead: "Pohjoissaamen sanakirja, jossa on sanojen koko taivutus. Käännökset suomeksi ja norjaksi " +
      "sekä osalle sanoista englanniksi, inarin-, luulajan- ja eteläsaameksi.",
    welcomeTips: `<dt>Hae</dt><dd>saamen sanalla (dahkat), suomen sanalla (tehdä) tai taivutetulla muodolla (dagan).</dd>
      <dt>Taivutus</dt><dd>verbeillä kaikki tapaluokat, nomineilla sijamuodot (ol. ja ml.).</dd>
      <dt>Astevaihtelu</dt><dd>vahva aste <b class="gd">GD</b> ja heikko aste <b class="hd">HD</b> omilla väreillään (valittavissa asetuksista).</dd>
      <dt>Ääntäminen</dt><dd>🔈 sanan vieressä, tai napauta taulukon muotoa: kuuntele tai kopioi.</dd>
      <dt>Suosikit</dt><dd>★ tallentaa sanan omalle listalle.</dd>
      <dt>Sanastot</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.6 4 9 4 12 6c3-2 6.4-2 9-.5V19c-2.6-1.5-6-1.5-9 .5-3-2-6.4-2-9-.5z"/><path d="M12 6v13.5"/><path d="M15.5 5.2v5.3l1.5-1.2 1.5 1.2V4.9"/></svg> oikeassa yläkulmassa: aihekohtaiset sanalistat ääntämyksineen (luvut, kuukaudet, perhe, värit…), osassa kuunneltava äänilista.</dd>
      <dt>Minipeli</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.6a2.3 2.3 0 0 1-4 .9L15 15.5H9l-1.6 1.9a2.3 2.3 0 0 1-4-.9l-.8-3.6A4 4 0 0 1 6.5 8z"/><path d="M8 10.5v3M6.5 12h3"/></svg> sanapeli: valitse oikea neljästä tai kirjoita sana saameksi (vihjeet maksavat pisteitä). Aloittelija, edistynyt tai aihe (järjestysluvut, ajat, värit, kysymyssanat, eläimet). Inarinsaame kokeellisena asetuksista. Piilotettavissa asetuksista.</dd>
      <dt>Kuva ja lause</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> hakee sanat valokuvasta (sovelluksessa), <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> kääntää lyhyen suomenkielisen lauseen. Kokeellisia: kytke päälle valikosta, jolloin painikkeet ilmestyvät ylhäälle.</dd>
      <dt>Valikko</dt><dd>☰ ylhäällä: kieli, asetukset, suosikit ja historia, muut kielet ja kokeelliset ominaisuudet.</dd>`,
    menuTip: "Kieli ja asetukset löytyvät valikosta.",
    tryThese: "Kokeile:", randomWord: "Satunnainen sana",
    listen: "Kuuntele", fetching: "Haetaan…", listenTo: (text) => `Kuuntele: ${text}`,
    copy: "Kopioi", copied: (text) => `Kopioitu: ${text}`,
    tabTable: "Taivutus", tabRaw: "Kaikki muodot",
    tabMeanings: (n, examples) => `Merkitykset (${n})` + (examples ? ` ja esimerkit (${examples})` : ""),
    noHits: (q) => `Ei osumia haulle ”${q}”`,
    noHitsHint: "Kokeile toista kirjoitusasua, perusmuotoa tai käännöstä. Epäselvän kirjaimen tilalle ? ja useamman kirjaimen tilalle *: á?bmogis, *ortnega.",
    noTranslation: "(ei käännöstä)",
    noTranslationIn: { fin: "(ei suomennosta)", nob: "(ei norjankielistä käännöstä)", eng: "(ei englanninkielistä käännöstä)",
                       smn: "(ei inarinsaamenkielistä käännöstä)", smj: "(ei luulajansaamenkielistä käännöstä)",
                       sma: "(ei eteläsaamenkielistä käännöstä)" },
    morePrefix: (n, q) => `+${n} muuta sanaa, jotka alkavat ”${q}”`, fewerPrefix: "Näytä vähemmän",
    moreMeanings: (n) => `+${n} merkitystä`, otherLangs: "muut kielet",
    searchedForm: (q, tags) => `Haettu muoto ${q}: ${tags}`,
    cliticInfo: (q, stem, parts) => `${q} = ${stem} + ${parts}`,
    finCliticInfo: (q, stem, c, sme) => `${q} = ${stem} + -${c} (saameksi ${sme})`,
    didYouMean: "Tarkoititko:",
    // Liitepartikkelien merkitykset: GiellaLT dict-sme-fin / dict-sme-nob ja oppikirja (tarkistettu 2026-10-31)
    cliticMeaning: { go: "kysymys: -ko, -kö", ge: "-kin, kieltolauseessa -kaan, -kään", nai: "-kin",
                     son: "kysymyksessä -han, -hän", han: "-han, -hän" },
    formIn: (q, forms, lang) => `<b>${q}</b> ≈ ${forms} <span class="muted small">(${lang === "fin" ? "suomeksi" : "norjaksi"}, likimäärin)</span>`,
    viaForm: (q, base, sme, tag) => `<b>${q}</b> = ${base}` + (sme ? ` ≈ <b>${sme}</b> <span class="muted small">(${tag}, likimäärin)</span>` : ` <span class="muted small">(perusmuoto)</span>`),
    gradation: "Astevaihtelu", noGradation: "ei näkyvää astevaihtelua",
    gradForms: "Vahva → heikko aste", gradClusters: "Konsonantit", gradGrades: "Asteet", gradGroup: "Astevaihteluryhmä",
    nomClass: "Nominiluokka", verbClass: "Verbiluokka",
    verbClassNames: { I: "I · parillistavuinen", II: "II · paritontavuinen", III: "III · supistumaverbi" },
    nomClassNames: { I: "I · parillistavuinen", II: "II · paritontavuinen", III: "III · supistumanomini" },
    nomClassRules: { I: "<b class=\"gd\">Vahva:</b> yks. nominatiivi, yks. illatiivi, essiivi · <b class=\"hd\">Heikko:</b> muut muodot",
                     II: "<b class=\"hd\">Heikko:</b> yks. nominatiivi, essiivi · <b class=\"gd\">Vahva:</b> muut muodot",
                     III: "<b class=\"hd\">Heikko:</b> yks. nominatiivi, essiivi · <b class=\"gd\">Vahva:</b> muut muodot" },
    gradeLegend: `Aste: <b class="gd">GD</b> vahva aste &nbsp;&nbsp; <b class="hd">HD</b> heikko aste`,
    noForms: "FST-generaattori ei tuottanut tälle sanalle taivutusmuotoja.",
    tapHint: "Napauta muotoa: kuuntele tai kopioi.",
    noMeanings: "Ei merkitystietoja.", noExampleTranslation: "(ei käännöstä lähteessä)",
    usedIn: (place, code) => `käytössä ${place} (${code})`,
    dialEast: "it", dialWest: "lä", dialCompare: "vrt.", dialLegend: "it = itäinen, lä = läntinen",
    geo: { N: "Norjassa", S: "Suomessa", R: "Ruotsissa" },
    ttsFailed: (msg) => `Ääntämistä ei saatu: ${msg}.`,
    ttsTapAgain: "Ääni on valmis – napauta uudelleen kuunnellaksesi.",
    ttsOffline: "puhepalveluun ei saatu yhteyttä. Ensimmäinen kuuntelu vaatii verkkoyhteyden",
    ttsStatus: (status) => `puhepalvelu vastasi ${status}`,
    // Taivutustaulukko
    indicative: "Indikatiivi", present: "preesens", preterite: "preteriti", conditional: "Konditionaali",
    potential: "Potentiaali", imperative: "Imperatiivi", nonFinite: "Nominaalimuodot",
    affirmative: "Myönteinen", negative: "Kielteinen", baseForm: "Perusmuoto", uninflected: "Taipumaton",
    caseCol: "Sijamuoto", formCol: "Muoto", singular: "ol. (yksikkö)", plural: "ml. (monikko)",
    comparison: "Vertailumuodot", predicative: "predikatiivi", attributive: "attribuutti",
    comparative: "Komparatiivi", superlative: "Superlatiivi",
    nonFiniteRows: ["Infinitiivi", "Perfektipartisiippi", "Preesenspartisiippi", "Gerundi", "Verbigenetiivi",
                    "Verbiabessiivi", "Supiini", "Aktio (Nom)", "Aktio (Loc)", "Aktio (Com)", "Aktio (Ess)"],
    pos: {
      V: "Verbi", N: "Substantiivi", A: "Adjektiivi", ADV: "Adverbi", PRON: "Pronomini", NUM: "Numeraali",
      CC: "Rinnastuskonjunktio", CS: "Alistuskonjunktio", PCLE: "Partikkeli", INTERJ: "Interjektio",
      PO: "Postpositio", PR: "Prepositio", CMP: "Yhdyssanan alkuosa", MWE: "Monisanainen ilmaus",
      PHRASE: "Fraasi", ABBR: "Lyhenne",
    },
    subtype: {
      Prop: "Erisnimi", NomAg: "Tekijännimi", Pers: "Persoonapronomini", Dem: "Demonstratiivipronomini",
      Indef: "Indefiniittipronomini", Interr: "Interrogatiivipronomini", Refl: "Refleksiivipronomini",
      Rel: "Relatiivipronomini", Ord: "Järjestysluku", Coll: "Kollektiivi",
    },
    elsewhere: "Sanasta muualla",
    gtTitle: "Sana Giellateknon Neahttadigisánit-sanakirjassa (käännökset, sanahistoria, esimerkit teksteistä)", satniTitle: "Sana sátni.org-sanakirjoissa",
    langName: { fin: "suomi", nob: "norja", eng: "englanti", smn: "inarinsaame", smj: "luulajansaame", sma: "eteläsaame", sms: "koltansaame", spa: "espanja" },
    smeDef: "Selitys saameksi", smeDefSyn: "sama kuin",
    alsoFin: "Myös:", alsoFinSource: "Suomi–saame-sanakirjan hakusanat, joiden saamennos tämä sana on",
    langIn: { fin: "Suomeksi", nob: "Norjaksi", eng: "Englanniksi", smn: "Inarinsaameksi", sms: "Koltansaameksi", smj: "Luulajansaameksi", sma: "Eteläsaameksi", spa: "Espanjaksi" },
    // Tietoa-ikkuna. Ääntämisen kuvaus on sovittu Divvunin kanssa (2026-10-29), älä muuta sisältöä.
    aboutWeb: (v) => (v ? `Versio ${v} (web)` : "Web-versio"), aboutDesktop: (v) => `Versio ${v} (työpöytä)`,
    aboutAndroid: (v) => `Versio ${v} (Android)`,
    home: "Aloitussivulle", madeBy: "Tekijä:", sendFeedback: "Lähetä palautetta", feedbackIntro: "Virheet, puuttuvat sanat, käännöskorjaukset ja ideat ovat tervetulleita.", feedbackOpenMail: "Avaa sähköposti", feedbackGithub: "Tee ilmoitus GitHubissa", feedbackSubject: "Sátni FST -palaute", support: "Osallistu ja tue",
    aboutBody: `<p class="about-tagline">Pohjoissaamen taivutin ja sanakirja, joka perustuu avoimeen lähdekoodiin.</p>
      <h3>Tekijä</h3>
      <p><strong>Juha Somby</strong><br>
         <a href="mailto:satni@somby.fi">satni@somby.fi</a> ·
         <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">GitHub</a></p>
      <h3>Kielidata ja kieliteknologia</h3>
      <p>Sanakirjadata ja kieliteknologiapohja ovat peräisin Giellateknolta ja Divvunilta. Kielidata ja
         taivutussäännöt on laskettu Giellateknon / Divvunin avoimilla FST-malleilla ja XML-sanakirjoilla.</p>
      <p>Ääntäminen: Divvunin ja Giellateknon puhesynteesi (UiT Norjan arktinen yliopisto), äänet Biret,
         Máhtte ja Sunná. Äänet haetaan palvelusta api-giellalt.uit.no samaan tapaan kuin sátni.org-sivustolla.</p>
      <h3>Palaute</h3>
      <p>Jos huomaat ongelman, ota yhteyttä sähköpostitse <a href="mailto:satni@somby.fi">satni@somby.fi</a>
         tai tee ilmoitus GitHubissa: <a href="https://github.com/sombyduodji/satni-fst/issues" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst/issues</a>.
         Palaute ja ehdotukset ovat tervetulleita sähköpostitse.</p>
      <details><summary>Lähteet, lisenssit ja tietosuoja</summary>
      <p>Lisenssit: sanakirjat © GiellaLT (CC BY 4.0, yhdistetty ja täydennetty taivutusmuodoilla),
         taivutus GiellaLT lang-sme (GPL-3.0), käännösten taivutus GiellaLT lang-fin (GPL-3.0) ja Norsk ordbank
         (Språkbanken / Nasjonalbiblioteket, CC BY 4.0), koltansaame (kokeellinen) GiellaLT dict-sms-mul, dict-fin-sms ja
         dict-nob-sms (CC BY 4.0 / 3.0), norjan käännökset (kokeellinen) Apertium apertium-sme-nob (GPL-2.0-or-later), suomennosehdotukset (kokeellinen) GiellaLT dict-smn-sme, dict-smn-fin ja dict-fin-smn (CC BY 4.0), espanjan käännökset GiellaLT dict-sme-spa ja dict-spa-sme (Ángel, CC BY 4.0), osa englannin käännöksistä Wiktionary (CC BY-SA 4.0, kaikki.org), sql.js (MIT). Android-sovelluksen kokeellinen
         tekstintunnistus: Google ML Kit (Googlen käyttöehdot). Kuva käsitellään puhelimessa eikä lähde laitteelta;
         ML Kit voi lähettää Googlelle nimettömiä käyttötilastoja, kun tekstintunnistusta käytetään. Sátni FST on vapaa ohjelma (GPL-3.0).
         Astevaihtelun ryhmät: Oahpa (Giellatekno). Kaikki lähteet, lisenssit ja tehdyt muutokset: Lisenssit-painike alla.
         Lähdekoodi: <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst</a>.</p>
      </details>`,
    close: "Sulje", licenses: "Lisenssit", licensesTitle: "Lisenssit ja tekijänoikeudet",
  },

  nb: {
    title: "Sátni FST – nordsamisk ordbok og bøyingsverktøy",
    brandSub: "Åpen nordsamisk ordbok og bøyingsgenerator",
    uiLanguage: "Språk i brukergrensesnittet", language: "Språk",
    sidebar: "Historikk og favoritter",
    theme: "Tema", themeAuto: "Automatisk", themeLight: "Lyst", themeDark: "Mørkt",
    about: "Om",
    searchPlaceholder: "Søk på samisk, med oversettelse eller bøyd form",
    searchPlaceholderMid: "Søk på samisk eller norsk", searchPlaceholderShort: "Søk etter ord",
    search: "Søk",
    ocrTitle: "Søk etter ord i et bilde", ocrCamera: "📷 Ta bilde", ocrGallery: "🖼️ Velg bilde",
    ocrIntro: "Ta et bilde av samisk eller norsk tekst eller velg et bilde, og velg retning ovenfor. Teksten gjenkjennes på telefonen, og bildet forlater ikke enheten.",
    ocrWorking: "Gjenkjenner tekst…", ocrFinding: "Søker etter ord…",
    ocrFound: (n) => `Ord fra ordboka: ${n} · trykk på et ord · zoom med fingrene`,
    ocrSami: "Samisk", ocrUiLang: "Norsk", ocrDirTitle: "Bytt retning",
    ocrStyle: "Merking og farge", ocrFrame: "Ramme", ocrUnderline: "Understreking",
    ocrNoText: "Fant ingen tekst i bildet. Prøv å ta bildet nærmere og rett forfra.",
    ocrNoWords: "Fant tekst, men ingen ord fra ordboka.",
    ocrDirSwitched: "retning byttet", ocrAlso: "eller", ocrUnknown: "ikke funnet", ocrNearest: "ikke funnet, nærmeste:", ocrEdit: "Rediger søket", ocrRotateLeft: "Roter bildet mot venstre", ocrRotateRight: "Roter bildet mot høyre",
    experimental: "Eksperimentelle oversettelser", experimentalOn: "På", experimentalOff: "Av",
    experimentalHint: "Maskinoversettelser og forslag for ord som ikke har oversettelse i ordbøkene. De er fortsatt under utvikling og kan inneholde feil. Tilbakemeldinger hjelper!",
    lauseTitle: "Setningsoversetter", lauseBadge: "prøve", lauseShort: "Setning", ocrShort: "Bilde", expLauseDesc: "Kort finsk setning til samisk. Åpnes med snakkeboble-knappen i topplinjen.",
    expLauseInfo: `<p>I topplinjen kommer en <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> snakkeboble-knapp som åpner setningsoversetteren: skriv en kort setning på finsk, så
      lager appen en nordsamisk setning av ordboksordene og bøyningsformene.</p>
      <p>Hvert ord vises i sin egen boks; trykk for å bytte tolkning eller samisk ord. Setningen er omtrentlig: den passer
      for korte hverdagssetninger, ikke lange eller vanskelige.</p>`,
    lauseHint: "Skriv en kort setning på finsk. Trykk på et ord for å se tolkningen eller bytte det samiske ordet.",
    lausePlaceholder: "saisinko yhden kahvin ja voileivän?", lauseUnknown: "ukjent", lauseDidYouMean: "mente du",
    lauseSkip: "Hopp over ordet", lauseResult: "På samisk (omtrentlig, sjekk ordene)",
    lauseSearchWord: (w) => `Søk i ordboken: ${w}`,
    lauseReading: "Tolkning", lauseSamiWord: "Samisk ord", lauseForm: "Form", lauseSmeForm: "Samisk bøyningsform", lauseAuto: "automatisk",
    lauseForm_place_Ade: "sted (hvor?)", lauseForm_means_Ade: "middel (med hva?)", lauseForm_top_Ade: "oppå",
    lauseForm_place_Abl: "fra sted (hvorfra?)", lauseForm_top_Abl: "ned fra",
    lauseForm_place_All: "til sted (hvor hen?)", lauseForm_top_All: "opp på",
    sanastot: "Ordlister", back: "Tilbake", stop: "Stopp", sanastoIntro: (n, w) => `${n} emner, ${w} ord med uttale`, sanastoIntroSmn: (n, w) => `${n} emner, ${w} ord på enaresamisk (grunnformer, uten uttale)`, sanastoGroup_perus: "Grunnord", sanastoGroup_aika: "Tid", sanastoGroup_ihmiset: "Mennesker", sanastoGroup_luonto: "Natur", sanastoHelp: "Trykk på et ord: lytt, kopier eller åpne ordkortet.", sanastoHelpSmn: "Trykk på et ord for å kopiere det.", sanastoCard: "Åpne ordkortet", sanastoListenAll: "Lytt til lista", sanastoListenHint: "på samisk", sanastoCardinal: "Grunntall", sanastoCardinalEx: "en, to, tre", sanastoOrdinal: "Ordenstall", sanastoOrdinalEx: "første, andre",
    lauseClear: "Tøm setningen", lauseCheckWord: "Vis opplysninger om ordet", lauseInSentence: "I denne setningen", lauseChoose: "Velg dette", lauseFullCard: "Hele ordkortet",
    expOcr: "Bildesøk", expOcrDesc: "Finner ordene fra ordboka i teksten på et bilde. Starter med kameraknappen i topplinjen.",
    expOcrInfo: `<p>I topplinjen kommer en <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> kameraknapp. Ta et bilde av tekst eller velg et bilde, så blir ordene fra ordboka
      merket i bildet. Trykk på et ord for å se oversettelsen.</p>
      <p>Teksten gjenkjennes på telefonen med Googles ML Kit, og bildet forlater ikke enheten. ML Kit kan sende anonym
      bruksstatistikk til Google når funksjonen brukes.</p>`,
    expTableTr: "Oversettelse av bøyingsformer", expTableTrDesc: "Maskinoversettelse under hver form i bøyingstabellen.",
    positionOn: "på", positionUnder: "under",
    expTableTrInfo: `<p>Under formene i bøyingstabellen vises maskinoversettelsen med liten skrift: <i>mun lean – jeg er</i>. Dualis merkes
      med tall: <i>moai letne – vi (2) er</i>.</p>
      <p>Oversettelsene lages automatisk fra ordets første oversettelse, så de er ikke alltid riktige.
      Former uten oversettelse viser ingenting.</p>`,
    tableTrNote: "Oversettelsene er laget automatisk.",
    expApertium: "Norske maskinoversettelser", expApertiumDesc: "Apertium: norsk oversettelse av ord som ikke har det i ordbøkene.",
    expApertiumInfo: `<p>Når oversettelsesspråket er norsk og et ord mangler oversettelse, viser ordkortet en oversettelse
      fra ordlisten til maskinoversetteren Apertium (apertium-sme-nob).</p>
      <p>Ordlisten er laget for maskinoversettelse, ikke som ordbok. Oversettelsen kan være grov eller feil, og den er
      ikke kontrollert. Disse oversettelsene påvirker ikke søket.</p>`,
    apertiumNote: "Apertium, ikke kontrollert",
    expPivotFin: "Finske forslag", expPivotFinDesc: "Finsk oversettelse av ord som ikke har det i ordbøkene.",
    expPivotFinInfo: `<p>Når oversettelsesspråket er finsk og et ord mangler finsk oversettelse, viser ordkortet et forslag
      laget via et annet språk: fra den enaresamiske oversettelsen med GiellaLTs enaresamiske og finske ordbøker, eller,
      hvis den mangler, fra den finske oversettelsen andre ord har for det samme norske ordet.</p>
      <p>I stikkprøver var omtrent ni av ti forslag via enaresamisk og fire av fem via norsk riktige. Forslagene er
      ikke kontrollert og påvirker ikke søket.</p>`,
    pivotFinNote: { smn: "via enaresamisk, ikke kontrollert", nob: "via norsk, ikke kontrollert" },
    wiktEngNote: "Wiktionary via finsk og norsk, ikke kontrollert",
    register: { vulgar: "vulgært", derogatory: "nedsettende", offensive: "støtende" },
    registerNote: "Ifølge Wiktionary regnes ordet som vulgært, nedsettende eller støtende",
    expEnable: "Slå på", cancel: "Avbryt", smsVia: "via finsk, omtrentlig",
    reportError: "Meld fra om feil", reportWhat: "Hva er feil?", reportKindTrans: "Oversettelsen er feil eller dårlig",
    reportKindWord: "Søket ga et helt feil ord", reportKindForm: "En bøyningsform er feil", reportKindOther: "Annet",
    reportFix: "Hva ville vært riktig? (valgfritt)", reportSend: "Lag e-post", reportSubject: "Sátni FST: feilmelding",
    reportSubjectKind: { trans: "oversettelse", word: "feil ord", form: "bøyning", sme: "samisk ord", audio: "lydopptak", inappropriate: "upassende", other: "annet" },
    reportKindSme: "Et samisk ord eller en form er feil", reportKindAudio: "Det er feil i lydopptaket",
    reportWhichWord: "Hvilket ord? (valgfritt)", reportList: "Ordliste",
    minipeli: "Minispill", gameButton: "Minispill i topplinjen", gameSmn: "Enaresamisk i minispillet og ordlistene",
    // Inarin sanat on tarkistettu suomea vasten; norjannokset tulevat pohjoissaamen kautta (ei inari–norja-sanakirjaa)
    gameSmnNote: "De enaresamiske ordene er kontrollert mot finsk. De norske oversettelsene går via nordsamisk og kan være mindre presise.", reportKindBad: "Ordet er upassende",
    reportDetails: "Opplysninger om meldingen",
    reportLabels: { error: "Feil", word: "Ord", shown: "Vist oversettelse", search: "Søkeord", ui: "Brukergrensesnitt",
      other: "andre språk", version: "Versjon", link: "Lenke" },
    smsUnchecked: "ikke kontrollert", skoltDlgTitle: "Slå på skoltesamisk?",
    skoltDlgBody: `<p>De skoltesamiske ordene kommer fra GiellaLTs finsk–skoltesamisk- og norsk–skoltesamisk-ordbøker.
      De er ennå ikke kontrollert av noen som snakker skoltesamisk, så de kan være unøyaktige. Ordene vises når du søker på norsk.</p>`,
    skoltViaLabel: "Vis skoltesamisk også på nordsamiske ordkort",
    skoltViaDesc: "Via den finske oversettelsen, omtrentlig: omtrent hvert tredje ord kan være feil.",
    skoltViaShort: "Også for nordsamiske ord (omtrentlig)",
    ocrError: "Kunne ikke behandle bildet.", ocrNoApp: "Fant ingen kameraapp.",
    showGrade: "Vis stadieveksling",
    settings: "Innstillinger", otherLanguages: "Andre språk",
    extraLangsHint: "Oversettelser på valgte språk vises på ordkortet i tillegg til den norske, og du kan også søke med dem.",
    voice: "Stemme",
    // Innstillinger som egen visning (2026-11-14)
    setGeneral: "Generelt", setMore: "Mer", setLook: "Språk og utseende", setCard: "Ordkort og uttale",
    setLangs: "Oversettelsesspråk", setTools: "Verktøy", setHistory: "Historikk og favoritter", setAbout: "Om appen",
    themeNote: "Automatisk følger innstillingen på enheten.",
    textSize: "Tekststørrelse", textSizeSystem: "Enhetens", textSizeNote: "Enhetens: samme tekststørrelse som i innstillingene på enheten.",
    previewHouse: "hus", previewInHouse: "i huset",
    showGradeDesc: "Sterkt og svakt stadium i farger", voiceHead: "Stemme for uttale",
    toolsIntro: "Når et verktøy er slått på, vises knappen i topplinjen. Verktøy merket BETA er fortsatt under utvikling.",
    toolGameDesc: "Ordspill: velg riktig alternativ eller skriv ordet på samisk.", toolWordlistsDesc: "Ordlister etter tema, med uttale.",
    toolAlways: "Alltid", toolSmnDesc: "Ordene også på enaresamisk; noen er ennå ikke kontrollert.",
    langSource: { eng: "Wiktionary og Giellatekno", smn: "Giellatekno", smj: "Giellatekno", sma: "Giellatekno", spa: "dict-sme-spa (UNED)", sms: "via finske oversettelser" },
    historyNote: "Favoritter og historikk vises i menyen og på startsiden.",
    sumGradeOn: "Stadieveksling vises", sumGradeOff: "Stadieveksling skjult", sumNone: "Ingen valgt", sumOff: "Ingen knapper",
    sumExp: (n) => (n ? `${n} i bruk` : "Ikke i bruk"), sumHistory: (n) => `${n} søk i historikken`,
    sumTextSystem: "enhetens tekststørrelse", sumText: (n) => `tekststørrelse ${n} %`, sumTheme: { auto: "automatisk tema", light: "lyst tema", dark: "mørkt tema" },
    gradeStyleHead: "Merking av stadieveksling", gradeGdColor: "Sterkt stadium (GD)", gradeHdColor: "Svakt stadium (HD)",
    gradeUnderline: "Understreking", gradeUnderlineDesc: "Sterkt stadium med heltrukken linje, svakt med stiplet: synlig også uten farger.",
    gradeCvd: "Egnet for fargeblinde: blå og oransje", gradeSample: "eksempel",
    gradeColors: { green: "grønn", orange: "oransje", blue: "blå", purple: "lilla", red: "rød", brown: "brun", none: "ingen farge" },
    sumUnderline: "understreking",
    clearSearch: "Tøm søket", historyRemoved: (w) => `Fjernet fra historikken: ${w}`, historyHint: "Trykk lenge for å fjerne et ord fra historikken.",
    navLabel: "Hovedmeny", navSearch: "Søk", navGame: "Spill", navSentence: "Setning", navPhoto: "Bilde", navMore: "Mer",
    sanastoPrev: "forrige", sanastoNext: "neste", menuFeedback: "Tilbakemelding", menuSupport: "Støtt", menuAbout: "Om og lisenser", historyAll: (n) => `Vis alle (${n})`, sanastoCount: (n, w) => `${n} emner · ${w} ord`,
    recentHead: "Sist søkt", expTools: "Nye verktøy", expMore: "Flere oversettelser",
    favourites: "★ Favoritter", history: "Historikk", searchingForms: "Søker etter former…", clearHistory: "Tøm historikken", clearHistoryTitle: "Tømme historikken?",
    clearHistoryBody: "All søkehistorikk slettes. Favorittene beholdes.", clearHistoryOk: "Tøm", historyMore: "Flere…",
    supportStory: `<p><strong>Buorre beaivi! Jeg er Juha Somby.</strong></p>
      <p>UNESCO klassifiserer alle samiske språk som truet, og det er anslagsvis under 30 000 talere til sammen. For små
         språksamfunn og urfolk er tilgjengelige digitale verktøy, som stavekontroller, morfologiske analysatorer (FST),
         ordbøker og læremidler, viktige for at språket skal holde seg levende i dagens hverdag.</p>
      <p>Jeg lager gratis programvare og verktøy med åpen kildekode for nordsamisk og andre samiske språk.</p>`,
    supportHelpTitle: "Slik kan du hjelpe",
    supportCoffeeTitle: "Hvorfor støtte?",
    supportCoffee: `<p>Å utvikle og vedlikeholde åpen språkteknologi tar tid og krever løpende arbeid med data og kode.
         Ved å spandere en kaffe støtter du dette arbeidet direkte:</p>
      <ul class="support-ways">
        <li>verktøyene forblir gratis og åpne for elever, morsmålsbrukere og forskere</li>
        <li>truede språk får moderne digital infrastruktur</li>
        <li>det kommer nye verktøy, parsere og interaktive apper for samfunnet</li>
      </ul>`,
    supportNote: `Støtten er frivillig og gir ingen ekstra funksjoner: appen og ordboken forblir gratis for alle.
      Støtten går til appens utvikler, ikke til dem som har laget ordbøkene. Ordbokdataene er arbeidet til GiellaLT, Divvun,
      Giellatekno og andre bidragsytere.`,
    supportThanks: "Giitu olu! Takk for at du støtter samisk språkteknologi!",
    supportWays: `<li><strong>Rett oversettelser og ord:</strong> si fra om feil oversettelser eller ord som mangler.</li>
      <li><strong>Meld fra om feil:</strong> si fra hvis noe ikke virker eller ser rart ut.</li>
      <li><strong>Foreslå ideer:</strong> nye funksjoner, temaer eller endringer i brukergrensesnittet.</li>
      <li><strong>Tilgjengelighet:</strong> si fra om hva som ville gjøre appen enklere å bruke, for eksempel hvis du har syns- eller bevegelseshemming eller dysleksi.</li>
      <li><strong>Bidra til utviklingen:</strong> kildekoden er åpen, og rettelser er velkomne.</li>`,
    noFavourites: "Ingen favoritter ennå", noHistory: "Ingen søk",
    addFavourite: "Legg til i favoritter", removeFavourite: "Fjern fra favoritter",
    loadingTitle: "Laster ordboken…",
    loadingText: "Første gang lastes ca. 47 MB ned. Deretter fungerer ordboken også uten nettilkobling.",
    loadingLocal: "Ordboken følger med appen, så ingenting lastes ned fra nettet. Åpningen tar noen sekunder.",
    unpacking: "Pakker ut…",
    loadFailed: (status) => `Kunne ikke laste ordboken (${status})`,
    loadFailedLong: (msg) => `Kunne ikke laste ordboken: ${msg}`,
    welcomeTitle: "Bures boahtin! – Velkommen",
    welcomeLead: "Nordsamisk ordbok med full bøying av ordene. Oversettelser til norsk og finsk, " +
      "og for en del av ordene til engelsk, enaresamisk, lulesamisk og sørsamisk.",
    welcomeTips: `<dt>Søk</dt><dd>med et samisk ord (dahkat), et norsk ord (gjøre) eller en bøyd form (dagan).</dd>
      <dt>Bøying</dt><dd>alle modi for verb, kasus for nomen (ol. og ml.).</dd>
      <dt>Stadieveksling</dt><dd>sterkt stadium <b class="gd">GD</b> og svakt stadium <b class="hd">HD</b> i hver sin farge (kan velges i innstillingene).</dd>
      <dt>Uttale</dt><dd>🔈 ved ordet, eller trykk på en form i tabellen: lytt eller kopier.</dd>
      <dt>Favoritter</dt><dd>★ lagrer ordet i din egen liste.</dd>
      <dt>Ordlister</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.6 4 9 4 12 6c3-2 6.4-2 9-.5V19c-2.6-1.5-6-1.5-9 .5-3-2-6.4-2-9-.5z"/><path d="M12 6v13.5"/><path d="M15.5 5.2v5.3l1.5-1.2 1.5 1.2V4.9"/></svg> øverst til høyre: ordlister etter tema med uttale (tall, måneder, familie, farger…), noen med lydliste å lytte til.</dd>
      <dt>Minispill</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.6a2.3 2.3 0 0 1-4 .9L15 15.5H9l-1.6 1.9a2.3 2.3 0 0 1-4-.9l-.8-3.6A4 4 0 0 1 6.5 8z"/><path d="M8 10.5v3M6.5 12h3"/></svg> ordspill: velg riktig av fire eller skriv ordet på samisk (hint koster poeng). Nybegynner, viderekommen eller et emne (ordenstall, tid, farger, spørreord, dyr). Enaresamisk som eksperiment i innstillingene. Kan skjules i innstillingene.</dd>
      <dt>Bilde og setning</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> finner ord i et bilde (i appen), <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> oversetter en kort finsk setning. Eksperimentelle: slå dem på i menyen, så dukker knappene opp øverst.</dd>
      <dt>Meny</dt><dd>☰ øverst: språk, innstillinger, favoritter og historikk, andre språk og eksperimentelle funksjoner.</dd>`,
    menuTip: "Språk og innstillinger finner du i menyen.",
    tryThese: "Prøv:", randomWord: "Tilfeldig ord",
    listen: "Lytt", fetching: "Henter…", listenTo: (text) => `Lytt: ${text}`,
    copy: "Kopier", copied: (text) => `Kopiert: ${text}`,
    tabTable: "Bøying", tabRaw: "Alle former",
    tabMeanings: (n, examples) => `Betydninger (${n})` + (examples ? ` og eksempler (${examples})` : ""),
    noHits: (q) => `Ingen treff for «${q}»`,
    noHitsHint: "Prøv en annen skrivemåte, grunnformen eller en oversettelse. Skriv ? for en uklar bokstav og * for flere: á?bmogis, *ortnega.",
    noTranslation: "(ingen oversettelse)",
    noTranslationIn: { fin: "(ingen finsk oversettelse)", nob: "(ingen norsk oversettelse)", eng: "(ingen engelsk oversettelse)",
                       smn: "(ingen enaresamisk oversettelse)", smj: "(ingen lulesamisk oversettelse)",
                       sma: "(ingen sørsamisk oversettelse)" },
    morePrefix: (n, q) => `+${n} andre ord som begynner med «${q}»`, fewerPrefix: "Vis færre",
    moreMeanings: (n) => `+${n} betydninger`, otherLangs: "andre språk",
    searchedForm: (q, tags) => `Søkt form ${q}: ${tags}`,
    cliticInfo: (q, stem, parts) => `${q} = ${stem} + ${parts}`,
    finCliticInfo: (q, stem, c, sme) => `${q} = ${stem} + -${c} (på samisk ${sme})`,
    didYouMean: "Mente du:",
    cliticMeaning: { go: "spørrepartikkel", ge: "også, i nektende setning: heller, engang", nai: "også",
                     son: "i spørsmål: mon tro", han: "vel, jo" },
    formIn: (q, forms, lang) => `<b>${q}</b> ≈ ${forms} <span class="muted small">(${lang === "fin" ? "på finsk" : "på norsk"}, omtrent)</span>`,
    viaForm: (q, base, sme, tag) => `<b>${q}</b> = ${base}` + (sme ? ` ≈ <b>${sme}</b> <span class="muted small">(${tag}, omtrent)</span>` : ` <span class="muted small">(grunnform)</span>`),
    gradation: "Stadieveksling", noGradation: "ingen synlig stadieveksling",
    gradForms: "Sterkt → svakt stadium", gradClusters: "Konsonanter", gradGrades: "Stadier", gradGroup: "Stadievekslingsgruppe",
    nomClass: "Nominalklasse", verbClass: "Verbklasse",
    verbClassNames: { I: "I · likestavelses", II: "II · ulikestavelses", III: "III · kontrahert" },
    nomClassNames: { I: "I · likestavelses", II: "II · ulikestavelses", III: "III · kontrahert" },
    nomClassRules: { I: "<b class=\"gd\">Sterkt:</b> ent. nominativ, ent. illativ, essiv · <b class=\"hd\">Svakt:</b> andre former",
                     II: "<b class=\"hd\">Svakt:</b> ent. nominativ, essiv · <b class=\"gd\">Sterkt:</b> andre former",
                     III: "<b class=\"hd\">Svakt:</b> ent. nominativ, essiv · <b class=\"gd\">Sterkt:</b> andre former" },
    gradeLegend: `Stadium: <b class="gd">GD</b> sterkt stadium &nbsp;&nbsp; <b class="hd">HD</b> svakt stadium`,
    noForms: "FST-generatoren ga ingen bøyingsformer for dette ordet.",
    tapHint: "Trykk på en form: lytt eller kopier.",
    noMeanings: "Ingen opplysninger om betydning.", noExampleTranslation: "(ingen oversettelse i kilden)",
    usedIn: (place, code) => `brukt ${place} (${code})`,
    dialEast: "ø", dialWest: "v", dialCompare: "jf.", dialLegend: "ø = østlig, v = vestlig",
    geo: { N: "i Norge", S: "i Finland", R: "i Sverige" },
    ttsFailed: (msg) => `Kunne ikke hente uttalen: ${msg}.`,
    ttsTapAgain: "Lyden er klar – trykk igjen for å lytte.",
    ttsOffline: "fikk ikke kontakt med taletjenesten. Første avspilling krever nettilkobling",
    ttsStatus: (status) => `taletjenesten svarte ${status}`,
    indicative: "Indikativ", present: "presens", preterite: "preteritum", conditional: "Kondisjonalis",
    potential: "Potensialis", imperative: "Imperativ", nonFinite: "Infinitte former",
    affirmative: "Bekreftende", negative: "Nektende", baseForm: "Grunnform", uninflected: "Ubøyelig",
    caseCol: "Kasus", formCol: "Form", singular: "ol. (entall)", plural: "ml. (flertall)",
    comparison: "Gradbøying", predicative: "predikativ", attributive: "attributiv",
    comparative: "Komparativ", superlative: "Superlativ",
    nonFiniteRows: ["Infinitiv", "Perfektum partisipp", "Presens partisipp", "Gerundium", "Verbgenitiv",
                    "Verbabessiv", "Supinum", "Aktio (Nom)", "Aktio (Loc)", "Aktio (Com)", "Aktio (Ess)"],
    pos: {
      V: "Verb", N: "Substantiv", A: "Adjektiv", ADV: "Adverb", PRON: "Pronomen", NUM: "Tallord",
      CC: "Sideordningskonjunksjon", CS: "Subjunksjon", PCLE: "Partikkel", INTERJ: "Interjeksjon",
      PO: "Postposisjon", PR: "Preposisjon", CMP: "Forledd i sammensetning", MWE: "Flerordsuttrykk",
      PHRASE: "Frase", ABBR: "Forkortelse",
    },
    subtype: {
      Prop: "Egennavn", NomAg: "Agentiv", Pers: "Personlig pronomen", Dem: "Demonstrativt pronomen",
      Indef: "Ubestemt pronomen", Interr: "Spørrepronomen", Refl: "Refleksivt pronomen",
      Rel: "Relativt pronomen", Ord: "Ordenstall", Coll: "Kollektiv",
    },
    elsewhere: "Ordet andre steder",
    gtTitle: "Ordet i Giellateknos ordbok Neahttadigisánit (oversettelser, ordhistorie, eksempler fra tekster)", satniTitle: "Ordet i ordbøkene på sátni.org",
    langName: { fin: "finsk", nob: "norsk", eng: "engelsk", smn: "enaresamisk", smj: "lulesamisk", sma: "sørsamisk", sms: "skoltesamisk", spa: "spansk" },
    smeDef: "Forklaring på samisk", smeDefSyn: "samme som",
    alsoFin: "Også:", alsoFinSource: "Oppslagsord i den finsk–samiske ordboka som har dette ordet som oversettelse",
    langIn: { fin: "På finsk", nob: "På norsk", eng: "På engelsk", smn: "På enaresamisk", sms: "På skoltesamisk", smj: "På lulesamisk", sma: "På sørsamisk", spa: "På spansk" },
    // Oversettelse av den finske teksten som er avtalt med Divvun (2026-10-29)
    aboutWeb: (v) => (v ? `Versjon ${v} (nett)` : "Nettversjon"), aboutDesktop: (v) => `Versjon ${v} (skrivebord)`,
    aboutAndroid: (v) => `Versjon ${v} (Android)`,
    home: "Til startsiden", madeBy: "Laget av", sendFeedback: "Send tilbakemelding", feedbackIntro: "Feil, manglende ord, rettelser av oversettelser og ideer er velkomne.", feedbackOpenMail: "Åpne e-post", feedbackGithub: "Meld fra på GitHub", feedbackSubject: "Tilbakemelding om Sátni FST", support: "Bidra og støtt",
    aboutBody: `<p class="about-tagline">Nordsamisk bøyingsverktøy og ordbok basert på åpen kildekode.</p>
      <h3>Laget av</h3>
      <p><strong>Juha Somby</strong><br>
         <a href="mailto:satni@somby.fi">satni@somby.fi</a> ·
         <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">GitHub</a></p>
      <h3>Språkdata og språkteknologi</h3>
      <p>Ordbokdataene og språkteknologien kommer fra Giellatekno og Divvun. Språkdataene og
         bøyingsreglene er beregnet med Giellateknos og Divvuns åpne FST-modeller og XML-ordbøker.</p>
      <p>Uttale: talesyntese fra Divvun og Giellatekno (UiT Norges arktiske universitet), stemmene Biret,
         Máhtte og Sunná. Lyden hentes fra tjenesten api-giellalt.uit.no på samme måte som på nettstedet sátni.org.</p>
      <h3>Tilbakemelding</h3>
      <p>Hvis du finner et problem, ta kontakt på e-post <a href="mailto:satni@somby.fi">satni@somby.fi</a>
         eller meld det på GitHub: <a href="https://github.com/sombyduodji/satni-fst/issues" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst/issues</a>.
         Tilbakemeldinger og forslag tas gjerne imot på e-post.</p>
      <details><summary>Kilder, lisenser og personvern</summary>
      <p>Lisenser: ordbøkene © GiellaLT (CC BY 4.0, slått sammen og utvidet med bøyingsformer),
         bøying GiellaLT lang-sme (GPL-3.0), bøying av oversettelsene GiellaLT lang-fin (GPL-3.0) og Norsk ordbank
         (Språkbanken / Nasjonalbiblioteket, CC BY 4.0), skoltesamisk (eksperimentelt) GiellaLT dict-sms-mul, dict-fin-sms og
         dict-nob-sms (CC BY 4.0 / 3.0), norske oversettelser (eksperimentelt) Apertium apertium-sme-nob (GPL-2.0-or-later), finske forslag (eksperimentelt) GiellaLT dict-smn-sme, dict-smn-fin og dict-fin-smn (CC BY 4.0), spanske oversettelser GiellaLT dict-sme-spa og dict-spa-sme (Ángel, CC BY 4.0), en del av de engelske oversettelsene Wiktionary (CC BY-SA 4.0, kaikki.org), sql.js (MIT). Eksperimentell tekstgjenkjenning i
         Android-appen: Google ML Kit (Googles vilkår). Bildet behandles på telefonen og forlater ikke enheten;
         ML Kit kan sende anonym bruksstatistikk til Google når tekstgjenkjenningen brukes. Sátni FST er fri programvare (GPL-3.0).
         Stadievekslingsgrupper: Oahpa (Giellatekno). Alle kilder, lisenser og endringer: Lisenser-knappen nedenfor.
         Kildekode: <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst</a>.</p>
      </details>`,
    close: "Lukk", licenses: "Lisenser", licensesTitle: "Lisenser og opphavsrett",
  },
};

// Liput SVG:nä (emoji-liput eivät näy Windowsissa)
const FLAGS = {
  fi: `<svg viewBox="0 0 18 11" aria-hidden="true"><rect width="18" height="11" fill="#fff"/>` +
      `<rect x="5" width="3" height="11" fill="#002f6c"/><rect y="4" width="18" height="3" fill="#002f6c"/></svg>`,
  nb: `<svg viewBox="0 0 22 16" aria-hidden="true"><rect width="22" height="16" fill="#ba0c2f"/>` +
      `<rect x="6" width="4" height="16" fill="#fff"/><rect y="6" width="22" height="4" fill="#fff"/>` +
      `<rect x="7" width="2" height="16" fill="#00205b"/><rect y="7" width="22" height="2" fill="#00205b"/></svg>`,
};
