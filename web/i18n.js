"use strict";
/* Käyttöliittymän tekstit: suomi (oletus) ja norja (bokmål). Avaimet ovat samat molemmissa kielissä.
   Funktiona annettu teksti saa parametrit, esim. t("noHits", "dahkat"). index.html:ssä elementit
   merkitään data-i18n-attribuuteilla (ks. applyStaticTexts app.js:ssä). */

const UI_LANGUAGES = {
  fi: { name: "Suomi", translationLang: "fin" },
  nb: { name: "Norsk", translationLang: "nob" },
  en: { name: "English", translationLang: "eng" },
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
    ocrIntro: "Ota kuva saamen- tai suomenkielisestä tekstistä tai valitse kuva. Kielet vaihdetaan yläreunan kielipainikkeesta. Teksti tunnistetaan puhelimessa, eikä kuva lähde laitteelta.",
    ocrWorking: "Tunnistetaan tekstiä…", ocrFinding: "Haetaan sanoja…", ocrSecond: "tarkistetaan epävarmoja sanoja…",
    ocrFound: (n) => `Sanakirjan sanoja ${n} · napauta sanaa · zoomaa sormilla`,
    ocrSami: "Saame", ocrUiLang: "Suomi", ocrDirTitle: "Kuvan kieli ja käännös",
    ocrLangs: { sme: "Pohjoissaame", smn: "Inarinsaame", sms: "Koltansaame", fin: "Suomi", nob: "Norja" }, ocrOffer: { smn: "Kuvassa on inarinsaamea. Otetaanko inarinsaame käyttöön?", sms: "Kuvassa on koltansaamea. Otetaanko koltansaame käyttöön?" }, ocrViaFinShort: "suomen kautta, likimääräinen", ocrFromLabel: "Kuvan kieli", sentPick: "Poimi lause", sentTitle: "Lause kuvasta", sentWords: "Sanat kuvasta · napauta muuttaaksesi", sentCopy: "Kopioi", sentCopied: "Kopioitu", sentGist: "Sana sanalta koottu, suuntaa antava.", sentUnknown: "tunnistamaton", sentCmpHint: "Yhdyssana koottu osista; napauta sanaa nähdäksesi osat", sentName: "nimi", sentInPhoto: "Kuvassa:", sentWhat: "Mikä sana se on?", sentKeep: "Jätä kääntämättä", sentDone: "Valmis", sentMeaning: "merkitys", sentEditWord: "Muokkaa", sentOpen: "Sanakirja", sentTapWord: "Napauta lauseen sanaa", sentSplit: "Jaa osiin", sentSplitShort: "yhdyssanan osat itse", sentSplitHint: "Napauta kirjainten väliin, mistä sana jakautuu", ocrLangsTitle: "Kuvan kielet", ocrTargetsTitle: "Käännöskielet", ocrLangsNote: "Inarin- ja koltansaamen sanasto otetaan muistiin vasta, kun kieli valitaan.", ocrHint: { smn: "Kuvassa voi olla inarinsaamea. Sen voi ottaa kuvan kieleksi asetuksista.", sms: "Kuvassa voi olla koltansaamea. Sen voi ottaa kuvan kieleksi asetuksista." }, ocrHintSettings: "Asetukset", ocrSwap: "Vaihda suunta", ocrViaSmeShort: "pohjoissaamen kautta, likimääräinen", ocrSmnOffer: "Kuvassa on inarinsaamea. Otetaanko inarinsaame käyttöön?", ocrNotNow: "Ei nyt", ocrEnable: "Ota käyttöön", ocrSkolt: "kuvassa on ilmeisesti koltansaamea, jota kuvahaku ei vielä tue", ocrToLabel: "Käännös", ocrViaSme: "Norja pohjoissaamen kautta, likimääräinen",
    ocrStyle: "Merkintätapa ja väri", ocrFrame: "Kehys", ocrUnderline: "Alleviivaus",
    ocrNoText: "Kuvasta ei löytynyt tekstiä. Kokeile ottaa kuva lähempää ja suoraan edestä.",
    ocrNoWords: "Tekstiä löytyi, mutta ei sanakirjan sanoja.",
    ocrDirSwitched: "suunta vaihdettu", ocrAlso: "tai", ocrUnknown: "ei löytynyt", ocrNearest: "ei löytynyt, lähimmät:", ocrParts: "ei löytynyt, yhdyssanan osat:", ocrNearestOrParts: "ei löytynyt, lähin tai osat:", ocrEdit: "Muokkaa hakua", ocrRotateLeft: "Käännä kuvaa vasemmalle", ocrRotateRight: "Käännä kuvaa oikealle",
    ocrMore: "Kuva-asetukset", ocrGalleryShort: "Valitse kuva", ocrShoot: "Ota kuva", ocrPhotoSect: "Kuva", ocrMarkSect: "Sanojen merkintä",
    ocrRotL: "Käännä vasemmalle", ocrRotR: "Käännä oikealle", ocrBaseForm: "perusmuoto", ocrMeant: "Tarkoititko?",
    ocrNoMatch: "Ei löytynyt sanakirjasta sellaisenaan.", ocrTypeSelf: "Kirjoita sana itse", ocrSplitSelf: "Jaa osiin itse",
    ocrFix: "Korjaa", ocrReportShort: "Ilmoita", ocrBackToSugs: "Takaisin ehdotuksiin", sentSelectShort: "Valitse itse", sentSelect: "Valitse sanat itse", selHint: "Maalaa sanat sormella tai piirrä ympyrä niiden ympäri · kaksi sormea siirtää", selCount: (n) => `${n} sanaa valittu`, ocrTargetAdded: (n) => `${n} lisätty käännöskieliin`, ocrSourceAdded: (n) => `${n} lisätty kuvan kieliin`, ocrNoSugs: "Ei ehdotuksia.",
    experimental: "Kokeelliset käännökset", experimentalOn: "Käytössä", experimentalOff: "Pois käytöstä",
    experimentalHint: "Konekäännöksiä ja ehdotuksia sanoille, joilla ei ole käännöstä sanakirjoissa. Ne ovat vielä kehitteillä, ja niissä voi olla virheitä. Palaute auttaa!",
    // Lausekääntäjä (test-lauseet, lauseet.js)
    lauseTitle: "Lausekääntäjä", lauseBadge: "kokeilu", lauseShort: "Lause", ocrShort: "Kuva", expLauseDesc: "Lyhyt lause suomesta saameksi tai saamesta suomeksi. Avataan Lause-painikkeesta.", lauseDirLabel: "Käännöksen suunta", lauseDirFi: "suomi → saame", lauseDirSme: "saame → suomi", lauseHintSme: "Kirjoita pohjoissaamenkielinen lause. Napauta sanaa nähdäksesi merkitykset tai korjataksesi sanan.", lausePlaceholderSme: "Mun boađán ihttin.", lauseWordsSme: "Sanat · napauta muuttaaksesi",
    expLauseInfo: `<p>Alapalkkiin (leveällä näytöllä yläpalkkiin) tulee <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> Lause-painike, joka avaa lausekääntäjän: kirjoita lyhyt suomenkielinen lause, niin sovellus
      tekee siitä pohjoissaamenkielisen lauseen sanakirjan sanoista ja taivutusmuodoista.</p>
      <p>Jokainen sana näkyy omana laatikkonaan; napauttamalla voit vaihtaa tulkinnan tai saamen sanan. Lause on
      likimääräinen: se sopii lyhyisiin arkilauseisiin, ei pitkiin tai vaikeisiin.</p>
      <p>Suunnan voi vaihtaa: saame → suomi kääntää pohjoissaamenkielisen lauseen suomeksi samoilla säännöillä kuin kuvahaku
      (sana sanalta, suuntaa antava). Myös ilman saamen näppäimistöä kirjoitettu sana löytyy (cahci = čáhci).</p>`,
    lauseHint: "Kirjoita lyhyt suomenkielinen lause. Napauta sanaa nähdäksesi tulkinnan tai vaihtaaksesi saamen sanan.",
    lausePlaceholder: "saisinko yhden kahvin ja voileivän?", lauseUnknown: "tuntematon", lauseDidYouMean: "tarkoititko",
    lauseSkip: "Ohita sana", lauseResult: "Saameksi (likimääräinen, tarkista sanat)",
    lauseSearchWord: (w) => `Hae sanakirjasta: ${w}`,
    lauseReading: "Tulkinta", lauseSamiWord: "Saamen sana", lauseForm: "Muoto", lauseSmeForm: "Saamen taivutusmuoto", lauseAuto: "automaattinen",
    lauseForm_place_Ade: "paikassa (missä?)", lauseForm_means_Ade: "keinona (millä?)", lauseForm_top_Ade: "päällä",
    lauseForm_place_Abl: "paikasta (mistä?)", lauseForm_top_Abl: "päältä",
    lauseForm_place_All: "paikkaan (mihin?)", lauseForm_top_All: "päälle",
    sanastot: "Sanastot", back: "Takaisin", stop: "Pysäytä", sanastoIntro: (n, w) => `${n} aihetta, ${w} sanaa ääntämyksineen`, sanastoIntroSmn: (n, w) => `${n} aihetta, ${w} sanaa inarinsaameksi (perusmuodot, ilman ääntämystä)`, sanastoGroup_perus: "Perussanat", sanastoGroup_aika: "Aika", sanastoGroup_ihmiset: "Ihmiset", sanastoGroup_luonto: "Luonto", sanastoGroup_arki: "Arki", sanastoHelp: "Napauta sanaa: kuuntele, kopioi tai avaa sanakortti.", sanastoHelpSmn: "Napauta sanaa kopioidaksesi sen.", sanastoCard: "Avaa sanakortti", sanastoListenAll: "Kuuntele keskustelu", sanastoListenHint: "saameksi", sanastoCardinal: "Perusluku", sanastoCardinalEx: "yksi, kaksi, kolme", sanastoOrdinal: "Järjestysluku", sanastoOrdinalEx: "ensimmäinen, toinen",
    ttsStoreHead: "Tallennetut ääntämiset", ttsStoreInfo: (n, size, limit) => `${n} sanaa · ${size} / ${limit}`, ttsNone: "Ei tallennettuja ääntämisiä", ttsLimit: "Enimmäiskoko", ttsStoreNote: "Kuunnellut sanat tallentuvat laitteelle, joten ne soivat heti myös ilman verkkoa. Kun raja täyttyy, pisimpään kuuntelematta olleet poistetaan.", ttsClear: "Tyhjennä tallennetut ääntämiset", ttsClearTitle: "Tyhjennetäänkö tallennetut ääntämiset?", ttsClearBody: "Sanat haetaan seuraavalla kuuntelukerralla taas verkosta. Sanastojen, harjoituksen ja pelin äänitteet, suosikit ja historia säilyvät.", ttsCleared: "Tallennetut ääntämiset tyhjennetty",
    sanastoPlay: "Pelaa", sanastoAgain: "Kuuntele uudelleen",
    apuExNote: "Esimerkkilauseet ovat sanakirjoista; osa käännöksistä on uusia. Jos huomaat virheen, ilmoita siitä.",
    harjClockTip: "Saameksi minuutit 20–40 lasketaan puolesta tunnista: beal vihtta = puoli viisi (4.30), logi badjel beal vihtta = kymmenen yli puoli viisi (4.40).", harjClock: "Kellonajat", harjClockLv: "Kellonajat", harjClockLvs: ["tasan", "puoli", "vartit", "5 min välein"],
    harjStartMix: (w, c) => (w ? `Aloita · ${w} sanaa + ${c} kellonaikaa` : `Aloita · ${c} kellonaikaa`), harjTimes: (n) => `${n} kellonaikaa`,
    harjTitle: "Harjoittele kuunnellen", harjTileSub: "Sana suomeksi, hetki miettimisaikaa, vastaus saameksi", harjHelp: "Kuule sana, mieti vastaus, kuule ja näe oikea. Jatkuu, kunnes pysäytät.", harjTopics: "Aiheet", harjRange: "Lukualue", harjAll: "Valitse kaikki", harjNone: "Tyhjennä", harjStartN: (n) => `Aloita · ${n} sanaa`, harjHearFi: "suomeksi", harjHearSme: "saameksi", harjLists: "Listat", harjWords: (n) => `${n} sanaa`, harjDir: "Suunta", harjDirFi: "suomi → saame", harjDirSme: "saame → suomi", harjThink: "Miettimisaika", harjOrder: "Järjestys", harjShuffle: "sekoitettu", harjInOrder: "listan järjestys", harjAwake: "Pidä näyttö päällä", harjScreenOff: "Näytön voi sammuttaa: harjoitus jatkuu, ja sen voi pysäyttää ilmoituksesta.", harjPickList: "Valitse ainakin yksi lista.", harjStart: "Aloita", harjAskSme: "Mikä se on saameksi?", harjAskFi: "Mikä se on suomeksi?", harjRound: (n) => `${n}. kierros`, harjPause: "Tauko", harjResume: "Jatka", harjNext: "Seuraava", harjNotifTitle: "Sátni FST · harjoitus", harjNumbers: "Luvut", harjOrdinals: "Järjestysluvut",
    lauseClear: "Tyhjennä lause", lauseCheckWord: "Näytä sanan tiedot", lauseInSentence: "Tässä lauseessa", lauseChoose: "Valitse tämä", lauseFullCard: "Koko sanakortti",
    expOcr: "Valokuvahaku", expOcrDesc: "Tunnistaa valokuvan tekstistä sanakirjan sanat ja kääntää sanoja ja lauseita. Avataan Kuva-painikkeesta.",
    expOcrInfo: `<p>Alapalkkiin (leveällä näytöllä yläpalkkiin) tulee <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> Kuva-painike. Ota kuva tekstistä tai valitse
      kuva, ja sanakirjan sanat merkitään kuvaan. Napauta sanaa, niin näet käännöksen. <b>Poimi lause</b> kääntää koko
      lauseen, ja <b>Valitse sanat itse</b> -toiminnolla voit maalata tai ympyröidä sormella haluamasi sanat.</p>
      <p>Kuvan kieli valitaan kielipainikkeesta: pohjoissaame, käännöskieli (suomi tai norja; sanat käännetään saameksi) sekä inarin- ja
      koltansaame, jos ne on otettu käyttöön asetuksista.</p>
      <p>Teksti tunnistetaan puhelimessa Googlen ML Kitillä. Tuntemattomat saamen sanat luetaan vielä toiseen kertaan
      Norjan kansalliskirjaston saamen tekstintunnistusmallilla (Tesseract), myös puhelimessa. Kuva ei lähde
      laitteelta, ja ML Kitin käyttötilastojen lähetys Googlelle on poistettu käytöstä.</p>`,
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
    expPivotFin: "Suomennosehdotukset", expPivotFinDesc: "Konekäännös ja muiden kielten kautta sanoille, joilla ei ole suomennosta sanakirjoissa.",
    expPivotFinInfo: `<p>Kun sanalta puuttuu suomennos, sanakortissa näytetään ehdotus. Ensisijaisesti se on konekäännös
      (noin 2 200 sanaa), joka hyväksytään vain, jos vähintään kaksi toisistaan riippumatonta reittiä antaa saman suomen
      sanan: saamesta käännösmallilla, sanan norjannoksesta (käännösmalli ja avoimet sanakirjat), inarin- tai
      eteläsaamen kautta GiellaLT:n sanakirjoilla tai sanan englannista. Voikko tarkistaa, että sana on suomen perusmuoto.
      Testissä noin 75–80 % oli oikein kahden reitin ja 85–98 % kolmen tai useamman reitin ollessa samaa mieltä.
      Näitä sanoja voi myös hakea suomeksi sanakirjan omien käännösten jälkeen.</p>
      <p>Muille sanoille näytetään kuten ennenkin ehdotus inarinsaamen kautta tai suomennos, joka muilla sanoilla on
      samalle norjan sanalle (pistokokeissa noin neljä viidestä oikein). Ehdotuksia ei ole tarkistettu.</p>`,
    pivotFinNote: { smn: "inarinsaamen kautta, tarkistamaton", nob: "norjan kautta, tarkistamaton" }, derFinNote: "johdettu", cmpFinNote: "osista", cmpPartsMeaning: "osien merkitykset",
    expEngMt: "Englannin konekäännökset", expEngMtDesc: "Sanoille, joilla ei ole englantia sanakirjoissa, kun kaksi tai kolme käännösreittiä on samaa mieltä.",
    expEngMtInfo: `<p>Sanakirjoissa englanninkielinen käännös on vain noin 10 000 pohjoissaamen sanalla. Noin 17 000 sanalle
      tämä näyttää konekäännöksenä tehdyn englannin sanan. Jokainen sana käännettiin kolmea reittiä: saamesta, sanan
      suomennoksesta ja sen norjannoksesta, kahdella käännösmallilla ja avoimilla sanakirjoilla (WordNet, Wiktionary,
      Apertium). Sana näytetään vain, jos vähintään kaksi reittiä antaa saman englannin sanan.</p>
      <p>Testissä sanoilla, joilla englanti on, noin 97 % oli oikein, kun kaikki kolme reittiä olivat samaa mieltä, ja noin
      85–90 %, kun kaksi oli. Ne ovat silti konekäännöksiä. Sanoja voi myös hakea englanniksi sanakirjan omien käännösten jälkeen.</p>`,
    engMtNote: (level) => `konekäännös, ${Math.max(2, level || 2)} lähdettä samaa mieltä`,
    expEngMtShort: "+ konekäännökset", expEngMtSub: "Noin 17 000 sanaa lisää, kun vähintään 2 lähdettä on samaa mieltä",
    expSpaMtShort: "+ konekäännökset", expSpaMtSub: "Noin 6 300 sanaa lisää, kun vähintään 3 lähdettä on samaa mieltä",
    expSpaMt: "Espanjan konekäännökset", expSpaMtDesc: "Sanoille, joilla ei ole espanjaa sanakirjassa, kun vähintään kolme lähdettä on samaa mieltä.",
    expSpaMtInfo: `<p>Espanjan sanakirjassa (Ángel Díaz de Rada ja Kjell Kemi) on noin 7 700 pohjoissaamen sanaa. Noin 6 300
      sanalle tämä näyttää konekäännöksenä tehdyn espanjan sanan, kun vähintään kolme lähdettä antaa saman sanan: käännösmallit
      sanan suomennoksesta, norjannoksesta ja englannista sekä saamesta, Wiktionary ja espanjan wordnet (MCR).</p>
      <p>Testissä sanakirjan omia käännöksiä vasten kolmen lähteen sanoista noin 74 % ja neljän tai useamman 85–97 % oli
      sama tai synonyymi. Ne ovat silti konekäännöksiä. Sanakirjaan ei kosketa, ja sanoja voi hakea espanjaksi sanakirjan
      omien käännösten jälkeen.</p>`,
    wiktEngNote: "Wiktionary suomen ja norjan kautta, tarkistamaton",
    register: { vulgar: "alatyylinen", derogatory: "halventava", offensive: "loukkaava" },
    registerNote: "Wiktionaryn mukaan sanaa pidetään alatyylisenä, halventavana tai loukkaavana",
    expEnable: "Ota käyttöön", cancel: "Peruuta", smsVia: "suomen kautta, likimääräinen",
    // Koltansaame Muut kielet -kohdassa: varoitus päälle kytkettäessä ja valinta pohjoissaamen sanakorteille
    // Virheilmoitus sanakortista (app.js: openReport, sendReport)
    reportError: "Ilmoita virheestä", reportWhat: "Mikä on väärin?", reportKindTrans: "Käännös on väärä tai huono", reportKindMissing: "Käännös puuttuu", reportMissingTrans: "Ilmoita puuttuvasta käännöksestä", fallbackLang: "varakieli", derOf: "johdos sanasta",
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
      other: "muut kielet", version: "Versio", link: "Linkki", place: "Näkymä", lang: "Kieli", base: "Perusmuoto",
      via: "Välikieli", sentence: "Lause", words: "Sanat", form: "Muoto lauseessa", list: "Lista", voice: "Ääni", read: "Kuvan luku", dir: "Hakusuunta" },
    reportPlaces: { photo: "Kuvahaku", sent: "Lausenäkymä", lause: "Lausekääntäjä", harj: "Kuunteluharjoitus", missing: "Haku: puuttuva sana" },
    reportMissing: "Ilmoita puuttuvasta sanasta", reportMissingSubject: "Sátni FST: puuttuva sana",
    reportMissingFix: "Mitä sana tarkoittaa tai missä näit sen? (valinnainen)", missingDir: (l) => `pohjoissaame ↔ ${l}`,
    viaSme: (w) => `pohjoissaamen kautta: ${w}`, viaFin: (w) => `suomen kautta: ${w}`,
    smsUnchecked: "tarkistamaton", skoltDlgTitle: "Otetaanko koltansaame käyttöön?",
    skoltDlgBody: `<p>Koltansaamen sanat tulevat GiellaLT:n suomi–koltansaame- ja norja–koltansaame-sanakirjoista.
      Pohjoissaamen ja koltansaamen välillä ei ole sanakirjaa, joten yhteys kulkee suomen (tai norjan) kautta.</p>
      <p>Päällä ollessa:</p><ul><li>sanakortti näyttää koltansaamen sanan, myös saameksi haetuille sanoille (sanan
      suomennoksen kautta)</li><li>voit hakea koltansaamen sanalla: põrtt → talo → dállu</li></ul>
      <p>Koltansaamen puhuja ei ole vielä tarkistanut sanoja, ja suomen kautta kulkeva yhteys on likimääräinen: noin
      joka kolmas voi olla väärä. Siksi ominaisuus on kokeellinen (BETA).</p>`,
    skoltViaLabel: "Näytä koltansaame myös pohjoissaamen sanakortissa",
    skoltViaDesc: "Suomennoksen kautta, likimääräinen: noin joka kolmas voi olla väärä.",
    skoltViaShort: "+ myös pohjoissaamen sanakorteille",
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
    toolsIntro: "Päälle kytketyn työkalun painike näkyy alapalkissa (leveällä näytöllä yläpalkissa). BETA-merkityt ovat vielä kehitteillä.",
    toolGameDesc: "Sanapeli: valitse oikea vaihtoehto tai kirjoita sana saameksi.", toolWordlistsDesc: "Aihekohtaiset sanalistat ääntämyksineen ja kuunteluharjoitus.",
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
    favourites: "★ Suosikit", history: "Historia", searchingForms: "Haetaan muotoja…", wildSearching: (q) => `Jokerihaku ${q}…`, wildHint: "jokerihaku: paina Enter tai napauta", wildShort: (n) => `Jokerihaku tarvitsee vähintään ${n} kirjainta`, clearHistory: "Tyhjennä historia", clearHistoryTitle: "Tyhjennetäänkö historia?",
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
    importMain: "Tuo suosikit ja historia Play-versiosta", importMainDesc: "Lisää Play-version sanat tämän BETA-version omien perään. Mitään ei poisteta, eikä Play-versioon kirjoiteta.",
    importMainDone: (f, h) => `Tuotu ${f} ${f === 1 ? "suosikki" : "suosikkia"} ja ${h} ${h === 1 ? "haku" : "hakua"}`, importMainNone: "Play-versiosta ei saatu tietoja. Päivitä Play-versio uusimpaan ja avaa se kerran.",
    betaOnTitle: "Tämä on testiversio (BETA)", betaOnOk: "Selvä",
    betaOnBody: `<p>Tässä BETA-versiossa uudet ominaisuudet ovat valmiiksi päällä, jotta voit testata ne:</p>
      <ul><li>englannin ja espanjan konekäännökset (englanti ja espanja käännöskielinä)</li><li>suomennosehdotukset</li>
      <li>koltansaame sanakorteilla ja haussa</li><li>saksa (konekäännös, BETA)</li></ul>
      <p>Ne ovat konekäännöksiä ja voivat olla vääriä. Voit kytkeä ne pois kohdasta Asetukset → Käännöskielet, niin näet
      sovelluksen kuten tavallinen käyttäjä. Palaute auttaa!</p>`,
    expDeuMt: "Saksa", expDeuMtDesc: "Konekäännös noin 5 700 sanalle, kun vähintään 3 lähdettä on samaa mieltä. Ei sanakirjaa.",
    expDeuMtInfo: `<p>Pohjoissaamen ja saksan välillä ei ole kattavaa avointa sanakirjaa, joten saksan sanat ovat konekäännöksiä.
      Sana näytetään vain, jos vähintään kolme kuudesta toisistaan riippumattomasta lähteestä antaa saman saksan sanan:
      käännösmalli saamesta, sanan suomennoksesta, norjannoksesta ja sanakirjan englannista, Wiktionary sekä Apertiumin pieni
      saame–saksa-sanalista. Noin 5 700 sanaa,
      enimmäkseen yleisiä sanoja.</p>
      <p>Testissä Wiktionaryn saame–saksa-sanoja vasten noin 80 % kolmen lähteen ja noin 94 % neljän tai useamman lähteen sanoista
      oli sama tai synonyymi. Testisanoja oli vain noin 800, joten luku on suuntaa antava. Sanakortissa näkyy saksa (≈) ja
      lähteiden määrä, ja saksan sanalla voi hakea.</p>`,
    noFavourites: "Ei vielä suosikkeja", noHistory: "Ei hakuja",
    addFavourite: "Lisää suosikkeihin", removeFavourite: "Poista suosikeista",
    loadingTitle: "Ladataan sanakirjaa…",
    loadingText: "Ensimmäisellä kerralla ladataan noin 47 Mt. Sen jälkeen sanakirja toimii myös ilman verkkoyhteyttä.",
    loadingLocal: "Sanakirja on mukana sovelluksessa, joten mitään ei ladata verkosta. Avaaminen kestää muutaman sekunnin.",
    unpacking: "Puretaan…", mtTag: "kone", moreHits: (n) => `+${n} ${n === 1 ? "muu osuma" : "muuta osumaa"}`, tabGrade: "Aste", tabFamilyShort: "Perhe", tabRawShort: "Kaikki", loadRetrying: "Lataus pysähtyi, yritetään uudelleen…", loadStalled: "Sanakirjan avaaminen pysähtyi. Sulje sovellus kokonaan ja avaa se uudelleen.",
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
      <dt>Sanastot</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.6 4 9 4 12 6c3-2 6.4-2 9-.5V19c-2.6-1.5-6-1.5-9 .5-3-2-6.4-2-9-.5z"/><path d="M12 6v13.5"/><path d="M15.5 5.2v5.3l1.5-1.2 1.5 1.2V4.9"/></svg> alapalkissa: aihekohtaiset sanalistat ääntämyksineen (luvut, kuukaudet, perhe, värit…) ja kuunteluharjoitus.</dd>
      <dt>Minipeli</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.6a2.3 2.3 0 0 1-4 .9L15 15.5H9l-1.6 1.9a2.3 2.3 0 0 1-4-.9l-.8-3.6A4 4 0 0 1 6.5 8z"/><path d="M8 10.5v3M6.5 12h3"/></svg> sanapeli: valitse oikea neljästä tai kirjoita sana saameksi (vihjeet maksavat pisteitä). Aloittelija, edistynyt tai aihe (järjestysluvut, ajat, värit, kysymyssanat, eläimet). Peli alapalkissa; inarinsaame (kokeellinen) ja pelin piilotus kohdasta Lisää → Työkalut.</dd>
      <dt>Kuva ja lause</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> hakee ja kääntää sanat ja lauseet valokuvasta (Android-sovelluksessa), <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> kääntää lyhyen suomenkielisen lauseen. Kokeellisia: kytke päälle kohdasta Lisää → Työkalut, jolloin painikkeet ilmestyvät alapalkkiin.</dd>
      <dt>Lisää</dt><dd>☰ alapalkissa (leveällä näytöllä ylhäällä): kieli, asetukset, työkalut, suosikit ja historia, muut kielet ja kokeelliset ominaisuudet.</dd>`,
    menuTip: "Kieli ja asetukset löytyvät valikosta.",
    tryThese: "Kokeile:", randomWord: "Satunnainen sana",
    listen: "Kuuntele", fetching: "Haetaan…", listenTo: (text) => `Kuuntele: ${text}`,
    copy: "Kopioi", copied: (text) => `Kopioitu: ${text}`,
    noMailTitle: "Sähköpostisovellusta ei löytynyt", noMailBody: "Puhelimesta ei löytynyt sähköpostisovellusta. Voit kopioida viestin ja lähettää sen muulla tavalla osoitteeseen satni@somby.fi.", noMailCopy: "Kopioi viesti", noMailCopied: "Viesti kopioitu leikepöydälle", noMailTo: "Vastaanottaja", noMailSubject: "Aihe",
    tabTable: "Taivutus", tabRaw: "Kaikki muodot",
    tabMeanings: "Merkitykset",
    tabFamily: "Sanaperhe", famBase: "Pohjasana", famParts: "Osat", famDerived: "Johdokset", famCompounds: "Yhdyssanat",
    famSiblings: (b) => `Muut johdokset sanasta ${b}`, famShowAll: (n) => `Näytä kaikki (${n})`, derFrom: "sanasta", famPartsLine: "yhdyssana:",
    famSum: (d, c) => "Sanaperhe: " + [d ? `${d} ${d === 1 ? "johdos" : "johdosta"}` : "", c ? `${c} ${c === 1 ? "yhdyssana" : "yhdyssanaa"}` : ""].filter(Boolean).join(", "),
    famNote: "Vain sanakirjan sanoja, jotka GiellaLT:n analysaattori yhdistää johdokseksi tai yhdyssanaksi.",
    noHits: (q) => `Ei osumia haulle ”${q}”`,
    noHitsHint: "Kokeile toista kirjoitusasua, perusmuotoa tai käännöstä. Epäselvän kirjaimen tilalle ? ja useamman kirjaimen tilalle *: á?bmogis, *ortnega.",
    noTranslation: "(ei käännöstä)",
    noTranslationIn: { fin: "(ei suomennosta)", nob: "(ei norjankielistä käännöstä)", eng: "(ei englanninkielistä käännöstä)",
                       smn: "(ei inarinsaamenkielistä käännöstä)", smj: "(ei luulajansaamenkielistä käännöstä)",
                       sma: "(ei eteläsaamenkielistä käännöstä)" },
    morePrefix: (n, q) => `+${n} muuta sanaa, jotka alkavat ”${q}”`, fewerPrefix: "Näytä vähemmän",
    moreMeanings: (n) => `+${n} merkitystä`, otherLangs: "muut kielet",
    searchedForm: (q, tags) => `Haettu muoto ${q}: ${tags}`,
    helpBtn: "Ohje tälle sivulle", helpClose: "Napauta mitä tahansa tai paina Takaisin sulkeaksesi.", helpNext: "Seuraava", helpPrev: "Edellinen", helpDone: "Valmis", helpCloseBtn: "Sulje opas", helpTapTip: "Voit myös napauttaa kohtaa sivulla. Napautus muualle sulkee oppaan.",
    help: { word: { title: "Sanakortti", items: {
      speak: "Kuuntele sana. Ääni tulee Divvunin saamen puhesynteesistä; äänen (Biret, Máhtte tai Sunná) voi vaihtaa Asetuksista. Osa sanoista on tallennettu sovellukseen, ja ne soivat ilman verkkoa.",
      fav: "Lisää sana suosikkeihin. Suosikit ja hakuhistoria löytyvät Lisää-valikosta.",
      report: "Ilmoita virheestä tai puuttuvasta käännöksestä. Sovellus valmistelee sähköpostin; mitään ei lähetetä ilman sinua.",
      forms: "Pääsanamuodot: substantiivilla perusmuoto ja genetiivi, adjektiivilla myös attribuuttimuoto, verbillä infinitiivi ja yksikön 1. persoona. Astevaihtelun konsonantit: vahva aste vihreällä, heikko oranssilla. Linkki avaa selityksen.",
      trans: "Käännös. Jos hait taivutettua muotoa, sen likimääräinen suomennos ja kielioppi näkyvät samassa laatikossa.",
      more: "Muut merkitykset: avaa kaikki merkitykset ja esimerkit.",
      extra: "Muut kielet, jotka olet valinnut Asetuksista. \"kone\" tarkoittaa konekäännöstä; napauta sitä nähdäksesi lähteet.",
      fam: "Sanaperhe: tästä sanasta johdetut sanat ja yhdyssanat, joissa se on osana.",
      tabs: "Välilehdet: Taivutus (kaikki muodot taulukkona, napauta muotoa kuunnellaksesi), Aste (astevaihtelun selitys), Merkitykset, Perhe ja Kaikki muodot." } } },
    searchedFormShort: "hakemasi muoto", otherMeanings: "Muut merkitykset",
    tagWords: { joinNum: true, SgOf: "yksikön", DuOf: "duaalin", PlOf: "monikon", Nom: "nominatiivi", Gen: "genetiivi", Acc: "akkusatiivi",
      Ill: "illatiivi", Loc: "lokatiivi", Com: "komitatiivi", Ess: "essiivi", Attr: "attribuuttimuoto", Inf: "infinitiivi", Prs: "preesens",
      Prt: "preteriti", Cond: "konditionaali", Pot: "potentiaali", Imprt: "imperatiivi", ConNeg: "kieltomuoto", PrfPrc: "perfektipartisiippi",
      PrsPrc: "preesenspartisiippi", Ger: "gerundi", Actio: "aktio", VGen: "verbigenetiivi", VAbess: "verbiabessiivi", Sup: "supiini",
      Comp: "komparatiivi", Superl: "superlatiivi", Pss: "passiivi",
      person: (n, p) => `${{ Sg: "yks.", Du: "duaalin", Pl: "mon." }[n]} ${p}. persoona` },
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
    langName: { deu: "saksa", fin: "suomi", nob: "norja", eng: "englanti", smn: "inarinsaame", smj: "luulajansaame", sma: "eteläsaame", sms: "koltansaame", spa: "espanja" },
    smeDef: "Selitys saameksi", smeDefSyn: "sama kuin",
    relatedSami: "Sukulaissanat muissa saamen kielissä", relatedNote: "Sama alkuperä, merkitys voi poiketa. Lähde: Álgu (Kotimaisten kielten keskus).",
    placeName: "Paikannimi", placeSource: "© Kartverket",
    placeTypes: { by: "kaupunki", tettsted: "taajama", tettbebyggelse: "taajama", bygdelagBygd: "kylä", grend: "kylä", kommune: "kunta",
      fjell: "tunturi", vann: "järvi", tjern: "lampi", elv: "joki", bekk: "puro", fjord: "vuono", "øy": "saari", "øyISjø": "saari",
      dal: "laakso", nesISjø: "niemi", nes: "niemi", vikISjø: "lahti", vik: "lahti", "ås": "harju", gard: "talo", bruk: "tila",
      haug: "kumpu", myr: "suo", li: "rinne", foss: "koski", sund: "salmi", sundISjø: "salmi", "halvøy": "niemimaa", fylke: "lääni" },
    alsoFin: "Myös:", alsoFinSource: "Suomi–saame-sanakirjan hakusanat, joiden saamennos tämä sana on",
    langIn: { deu: "Saksaksi", fin: "Suomeksi", nob: "Norjaksi", eng: "Englanniksi", smn: "Inarinsaameksi", sms: "Koltansaameksi", smj: "Luulajansaameksi", sma: "Eteläsaameksi", spa: "Espanjaksi" },
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
      <p>Sanakirjat ovat GiellaLT-yhteisön avoimia sanakirjoja (CC BY 4.0), joita ylläpitävät Giellatekno ja Divvun
         (UiT Norjan arktinen yliopisto). Niiden tekijöitä ovat muun muassa Nils Jernsletten (pohjoissaame–norja ja osa
         pohjoissaame–suomesta), Kotimaisten kielten keskus (suomi–pohjoissaame ja pohjoissaame–suomi), Marja-Liisa
         Olthuis ja Taarna Valtonen (inarinsaame–suomi), Ángel Díaz de Rada ja Kjell Kemi (pohjoissaame–espanja),
         AKU ja Koneen Säätiö (koltansaame) sekä kieliyhteisöjen jäsenet.</p>
      <p>Taivutusmuodot on laskettu GiellaLT:n avoimilla kielimalleilla (pohjoissaame lang-sme, suomi lang-fin,
         inarinsaame lang-smn ja koltansaame lang-sms), norjan taivutus Norsk ordbankista (Språkbanken).</p>
      <p>Ääntäminen: Divvunin ja Giellateknon puhesynteesi (UiT Norjan arktinen yliopisto), äänet Biret,
         Máhtte ja Sunná. Äänet haetaan palvelusta api-giellalt.uit.no samaan tapaan kuin sátni.org-sivustolla.
         Sanastojen ja kuunteluharjoituksen suomenkielinen ääni: Chatterbox Finnish (Finnish-NLP, MIT), äänenä
         Harri Tapani Ylilammin LibriVox-luenta (public domain).</p>
      <h3>Palaute</h3>
      <p>Jos huomaat ongelman, ota yhteyttä sähköpostitse <a href="mailto:satni@somby.fi">satni@somby.fi</a>
         tai tee ilmoitus GitHubissa: <a href="https://github.com/sombyduodji/satni-fst/issues" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst/issues</a>.
         Palaute ja ehdotukset ovat tervetulleita sähköpostitse.</p>
      <details><summary>Lähteet, lisenssit ja tietosuoja</summary>
      <p>Lisenssit: sanakirjat © GiellaLT (CC BY 4.0, yhdistetty ja täydennetty taivutusmuodoilla),
         taivutus GiellaLT lang-sme (GPL-3.0), käännösten taivutus GiellaLT lang-fin (GPL-3.0) ja Norsk ordbank
         (Språkbanken / Nasjonalbiblioteket, CC BY 4.0), koltansaame (kokeellinen) GiellaLT dict-sms-mul, dict-fin-sms ja
         dict-nob-sms (CC BY 4.0 / 3.0), norjan käännökset (kokeellinen) Apertium apertium-sme-nob (GPL-2.0-or-later), suomennosehdotukset (kokeellinen) GiellaLT dict-smn-sme, dict-smn-fin ja dict-fin-smn (CC BY 4.0), espanjan käännökset GiellaLT dict-sme-spa ja dict-spa-sme (Ángel, CC BY 4.0), osa englannin käännöksistä Wiktionary (CC BY-SA 4.0, kaikki.org), konekäännökset ja -ehdotukset (kokeellinen; englanti, suomi, espanja, saksa) smi-mt eli TartuNLP Smugri -malli (CC BY 4.0; pohjamalli NLLB-200, CC BY-NC 4.0), Helsinki-NLP opus-mt (Apache-2.0; opus-mt-en-de CC BY 4.0), FinnWordNet (CC BY 3.0), espanjan wordnet MCR 3.0 (CC BY 3.0), saksan wordnet OdeNet (CC BY-SA 4.0) ja CILI (CC BY 4.0), Wiktionary ja WikDict (CC BY-SA), GiellaLT-sanakirjat (CC BY) ja Apertium apertium-fin-eng (GPL-3.0), sql.js (MIT). Android-sovelluksen kokeellinen
         tekstintunnistus: Google ML Kit (Googlen käyttöehdot). Kuva käsitellään puhelimessa eikä lähde laitteelta,
         ja ML Kitin käyttötilastojen lähetys Googlelle on poistettu käytöstä. Tuntemattomien saamen sanojen toinen luku:
         Tesseract (Apache-2.0) ja Norjan kansalliskirjaston saamen malli (Nasjonalbiblioteket, CC BY 4.0; Enstad ym. 2025). Kuvan inarin- ja koltansaamen
         taivutusmuodot: GiellaLT lang-smn ja lang-sms (GPL-3.0). Kuvan lausenäkymän suomen ja norjan sanaparit:
         Leipzig Corpora Collection (Wortschatz Leipzig, CC BY; vain sanaparien ja sanojen määrät, ei lauseita). Sukulaissanat muissa saamen kielissä: Álgu (Kotimaisten kielten keskus, CC BY 4.0). Paikannimet: Kartverket Stedsnavn (© Kartverket, CC BY 4.0). Korpusfrekvenssit: SIKOR (UiT, CC BY 3.0). Sátni FST on vapaa ohjelma (GPL-3.0).
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
    ocrIntro: "Ta et bilde av samisk eller norsk tekst eller velg et bilde. Språkene byttes med språkknappen øverst. Teksten gjenkjennes på telefonen, og bildet forlater ikke enheten.",
    ocrWorking: "Gjenkjenner tekst…", ocrFinding: "Søker etter ord…", ocrSecond: "kontrollerer usikre ord…",
    ocrFound: (n) => `Ord fra ordboka: ${n} · trykk på et ord · zoom med fingrene`,
    ocrSami: "Samisk", ocrUiLang: "Norsk", ocrDirTitle: "Språk i bildet og oversettelse",
    ocrLangs: { sme: "Nordsamisk", smn: "Enaresamisk", sms: "Skoltesamisk", fin: "Finsk", nob: "Norsk" }, ocrOffer: { smn: "Bildet ser ut til å ha enaresamisk. Vil du slå på enaresamisk?", sms: "Bildet ser ut til å ha skoltesamisk. Vil du slå på skoltesamisk?" }, ocrViaFinShort: "via finsk, omtrentlig", ocrFromLabel: "Språk i bildet", sentPick: "Hent setning", sentTitle: "Setning fra bildet", sentWords: "Ord fra bildet · trykk for å endre", sentCopy: "Kopier", sentCopied: "Kopiert", sentGist: "Satt sammen ord for ord, veiledende.", sentUnknown: "ukjent", sentCmpHint: "Sammensatt ord satt sammen av delene; trykk på ordet for å se delene", sentName: "navn", sentInPhoto: "I bildet:", sentWhat: "Hvilket ord er det?", sentKeep: "La stå uoversatt", sentDone: "Ferdig", sentMeaning: "betydning", sentEditWord: "Rediger", sentOpen: "Ordbok", sentTapWord: "Trykk på et ord i setningen", sentSplit: "Del opp", sentSplitShort: "del sammensatt ord selv", sentSplitHint: "Trykk mellom bokstavene der ordet deles", ocrLangsTitle: "Språk i bilder", ocrTargetsTitle: "Oversettelsesspråk", ocrLangsNote: "Ordlisten for enaresamisk og skoltesamisk lastes først når språket velges.", ocrHint: { smn: "Bildet kan ha enaresamisk. Du kan velge det som bildespråk i innstillingene.", sms: "Bildet kan ha skoltesamisk. Du kan velge det som bildespråk i innstillingene." }, ocrHintSettings: "Innstillinger", ocrSwap: "Bytt retning", ocrViaSmeShort: "via nordsamisk, omtrentlig", ocrSmnOffer: "Bildet ser ut til å ha enaresamisk. Vil du slå på enaresamisk?", ocrNotNow: "Ikke nå", ocrEnable: "Slå på", ocrSkolt: "bildet ser ut til å ha skoltesamisk, som bildesøket ikke støtter ennå", ocrToLabel: "Oversettelse", ocrViaSme: "Norsk via nordsamisk, omtrentlig",
    ocrStyle: "Merking og farge", ocrFrame: "Ramme", ocrUnderline: "Understreking",
    ocrNoText: "Fant ingen tekst i bildet. Prøv å ta bildet nærmere og rett forfra.",
    ocrNoWords: "Fant tekst, men ingen ord fra ordboka.",
    ocrDirSwitched: "retning byttet", ocrAlso: "eller", ocrUnknown: "ikke funnet", ocrNearest: "ikke funnet, nærmeste:", ocrParts: "ikke funnet, deler av sammensatt ord:", ocrNearestOrParts: "ikke funnet, nærmeste eller deler:", ocrEdit: "Rediger søket", ocrRotateLeft: "Roter bildet mot venstre", ocrRotateRight: "Roter bildet mot høyre",
    ocrMore: "Bildeinnstillinger", ocrGalleryShort: "Velg bilde", ocrShoot: "Ta bilde", ocrPhotoSect: "Bilde", ocrMarkSect: "Merking av ord",
    ocrRotL: "Roter mot venstre", ocrRotR: "Roter mot høyre", ocrBaseForm: "grunnform", ocrMeant: "Mente du?",
    ocrNoMatch: "Ikke funnet i ordboka slik det står.", ocrTypeSelf: "Skriv ordet selv", ocrSplitSelf: "Del opp selv",
    ocrFix: "Rett", ocrReportShort: "Meld feil", ocrBackToSugs: "Tilbake til forslag", sentSelectShort: "Velg selv", sentSelect: "Velg ordene selv", selHint: "Mal over ordene med fingeren eller tegn en ring rundt dem · to fingre flytter", selCount: (n) => `${n} ord valgt`, ocrTargetAdded: (n) => `${n} lagt til som oversettelsesspråk`, ocrSourceAdded: (n) => `${n} lagt til som bildespråk`, ocrNoSugs: "Ingen forslag.",
    experimental: "Eksperimentelle oversettelser", experimentalOn: "På", experimentalOff: "Av",
    experimentalHint: "Maskinoversettelser og forslag for ord som ikke har oversettelse i ordbøkene. De er fortsatt under utvikling og kan inneholde feil. Tilbakemeldinger hjelper!",
    lauseTitle: "Setningsoversetter", lauseBadge: "prøve", lauseShort: "Setning", ocrShort: "Bilde", expLauseDesc: "Kort finsk setning til samisk. Åpnes med Setning-knappen (bare finsk brukergrensesnitt).", lauseDirLabel: "Retning", lauseDirFi: "finsk → samisk", lauseDirSme: "samisk → norsk", lauseHintSme: "Skriv en nordsamisk setning. Trykk på et ord for å se betydningene eller rette ordet.", lausePlaceholderSme: "Mun boađán ihttin.", lauseWordsSme: "Ordene · trykk for å endre",
    expLauseInfo: `<p>I bunnlinjen (på bred skjerm i topplinjen) kommer en <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> Setning-knapp som åpner setningsoversetteren: skriv en kort setning på finsk, så
      lager appen en nordsamisk setning av ordboksordene og bøyningsformene. Den virker bare med finsk brukergrensesnitt.</p>
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
    sanastot: "Ordlister", back: "Tilbake", stop: "Stopp", sanastoIntro: (n, w) => `${n} emner, ${w} ord med uttale`, sanastoIntroSmn: (n, w) => `${n} emner, ${w} ord på enaresamisk (grunnformer, uten uttale)`, sanastoGroup_perus: "Grunnord", sanastoGroup_aika: "Tid", sanastoGroup_ihmiset: "Mennesker", sanastoGroup_luonto: "Natur", sanastoGroup_arki: "Hverdag", sanastoHelp: "Trykk på et ord: lytt, kopier eller åpne ordkortet.", sanastoHelpSmn: "Trykk på et ord for å kopiere det.", sanastoCard: "Åpne ordkortet", sanastoListenAll: "Lytt til samtalen", sanastoListenHint: "på samisk", sanastoCardinal: "Grunntall", sanastoCardinalEx: "en, to, tre", sanastoOrdinal: "Ordenstall", sanastoOrdinalEx: "første, andre",
    ttsStoreHead: "Lagrede uttaler", ttsStoreInfo: (n, size, limit) => `${n} ord · ${size} / ${limit}`, ttsNone: "Ingen lagrede uttaler", ttsLimit: "Maks. størrelse", ttsStoreNote: "Ord du har lyttet til, lagres på enheten, så de spilles straks også uten nett. Når grensen er nådd, fjernes de som har vært lengst ubrukt.", ttsClear: "Tøm lagrede uttaler", ttsClearTitle: "Tømme lagrede uttaler?", ttsClearBody: "Ordene hentes fra nettet igjen neste gang du lytter. Lydene i ordlistene, øvingen og spillet, favoritter og historikk beholdes.", ttsCleared: "Lagrede uttaler er tømt",
    sanastoPlay: "Spill", sanastoAgain: "Lytt igjen",
    apuExNote: "Eksempelsetningene er fra ordbøkene; noen av oversettelsene er nye. Si fra hvis du ser en feil.",
    harjClockTip: "På samisk regnes minuttene 20–40 fra halvtimen, som på norsk: beal vihtta = halv fem (4.30), logi badjel beal vihtta = ti over halv fem (4.40).", harjClock: "Klokkeslett", harjClockLv: "Klokkeslett", harjClockLvs: ["hel", "halv", "kvarter", "hvert 5. min"],
    harjStartMix: (w, c) => (w ? `Start · ${w} ord + ${c} klokkeslett` : `Start · ${c} klokkeslett`), harjTimes: (n) => `${n} klokkeslett`,
    harjTitle: "Øv med lytting", harjTileSub: "Ordet, litt betenkningstid, svaret på samisk", harjHelp: "Hør ordet, tenk på svaret, hør og se det riktige. Fortsetter til du stopper.", harjTopics: "Emner", harjRange: "Tallområde", harjAll: "Velg alle", harjNone: "Fjern alle", harjStartN: (n) => `Start · ${n} ord`, harjHearFi: "på finsk", harjHearSme: "på samisk", harjLists: "Lister", harjWords: (n) => `${n} ord`, harjDir: "Retning", harjDirFi: "finsk → samisk", harjDirSme: "samisk → finsk", harjThink: "Betenkningstid", harjOrder: "Rekkefølge", harjShuffle: "blandet", harjInOrder: "listens rekkefølge", harjAwake: "Hold skjermen på", harjScreenOff: "Du kan slå av skjermen: øvingen fortsetter, og du kan stoppe den fra varselet.", harjPickList: "Velg minst én liste.", harjStart: "Start", harjAskSme: "Hva heter det på samisk?", harjAskFi: "Hva heter det på finsk?", harjRound: (n) => `runde ${n}`, harjPause: "Pause", harjResume: "Fortsett", harjNext: "Neste", harjNotifTitle: "Sátni FST · øving", harjNumbers: "Tall", harjOrdinals: "Ordenstall",
    lauseClear: "Tøm setningen", lauseCheckWord: "Vis opplysninger om ordet", lauseInSentence: "I denne setningen", lauseChoose: "Velg dette", lauseFullCard: "Hele ordkortet",
    expOcr: "Bildesøk", expOcrDesc: "Finner ordene fra ordboka i teksten på et bilde og oversetter ord og setninger. Åpnes med Bilde-knappen.",
    expOcrInfo: `<p>I bunnlinjen (på bred skjerm i topplinjen) kommer en <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> Bilde-knapp. Ta et bilde av tekst eller
      velg et bilde, så blir ordene fra ordboka merket i bildet. Trykk på et ord for å se oversettelsen. <b>Hent setning</b>
      oversetter hele setningen, og med <b>Velg ordene selv</b> kan du male eller ringe inn ordene du vil ha med fingeren.</p>
      <p>Bildets språk velges med språkknappen: nordsamisk, oversettelsesspråket (norsk eller finsk; ordene oversettes til samisk) og enaresamisk og
      skoltesamisk hvis de er slått på i innstillingene.</p>
      <p>Teksten gjenkjennes på telefonen med Googles ML Kit. Ukjente samiske ord leses en gang til med Nasjonalbibliotekets
      samiske tekstgjenkjenningsmodell (Tesseract), også på telefonen. Bildet forlater ikke enheten, og ML Kits sending av
      bruksstatistikk til Google er slått av.</p>`,
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
    pivotFinNote: { smn: "via enaresamisk, ikke kontrollert", nob: "via norsk, ikke kontrollert" }, derFinNote: "avledet", cmpFinNote: "av delene", cmpPartsMeaning: "delenes betydning",
    expEngMt: "Engelske maskinoversettelser", expEngMtDesc: "For ord uten engelsk i ordbøkene, når to eller tre oversettelsesveier er enige.",
    expEngMtInfo: `<p>Bare rundt 10 000 nordsamiske ord har engelsk oversettelse i ordbøkene. For rundt 17 000 flere ord
      viser dette et engelsk ord laget med maskinoversettelse. Hvert ord ble oversatt på tre veier: fra samisk, fra ordets
      finske oversettelse og fra den norske, med to oversettelsesmodeller og åpne ordbøker (WordNet, Wiktionary, Apertium).
      Et ord vises bare når minst to veier gir det samme engelske ordet.</p>
      <p>I en test med ord som har engelsk, var rundt 97 % riktige når alle tre veiene var enige, og rundt 85–90 % når to
      var det. Det er likevel maskinoversettelser. Ordene kan også søkes på engelsk, etter ordbokas egne oversettelser.</p>`,
    engMtNote: (level) => `maskinoversettelse, ${Math.max(2, level || 2)} kilder enige`,
    expEngMtShort: "+ maskinoversettelser", expEngMtSub: "Rundt 17 000 ord til, når minst 2 kilder er enige",
    expSpaMtShort: "+ maskinoversettelser", expSpaMtSub: "Rundt 6 300 ord til, når minst 3 kilder er enige",
    expSpaMt: "Spanske maskinoversettelser", expSpaMtDesc: "For ord uten spansk i ordboka, når minst tre kilder er enige.",
    expSpaMtInfo: `<p>Den spanske ordboka (Ángel Díaz de Rada og Kjell Kemi) har rundt 7 700 nordsamiske ord. For rundt 6 300
      ord viser dette et spansk ord laget med maskinoversettelse når minst tre kilder gir det samme ordet: oversettelsesmodeller
      fra ordets finske, norske og engelske oversettelse og fra samisk, Wiktionary og den spanske wordneten (MCR).</p>
      <p>I en test mot ordbokas egne oversettelser var rundt 74 % av ordene med tre kilder og 85–97 % med fire eller flere
      like eller synonymer. Det er likevel maskinoversettelser. Ordboka endres ikke, og ordene kan søkes på spansk etter
      ordbokas egne oversettelser.</p>`,
    wiktEngNote: "Wiktionary via finsk og norsk, ikke kontrollert",
    register: { vulgar: "vulgært", derogatory: "nedsettende", offensive: "støtende" },
    registerNote: "Ifølge Wiktionary regnes ordet som vulgært, nedsettende eller støtende",
    expEnable: "Slå på", cancel: "Avbryt", smsVia: "via finsk, omtrentlig",
    reportError: "Meld fra om feil", reportWhat: "Hva er feil?", reportKindTrans: "Oversettelsen er feil eller dårlig", reportKindMissing: "Oversettelsen mangler", reportMissingTrans: "Meld fra om manglende oversettelse", fallbackLang: "reservespråk", derOf: "avledet av",
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
      other: "andre språk", version: "Versjon", link: "Lenke", place: "Visning", lang: "Språk", base: "Grunnform",
      via: "Via", sentence: "Setning", words: "Ord", form: "Form i setningen", list: "Liste", voice: "Stemme", read: "Lest fra bildet", dir: "Søkeretning" },
    reportPlaces: { photo: "Bildesøk", sent: "Setningsvisning", lause: "Setningsoversetter", harj: "Lytteøving", missing: "Søk: manglende ord" },
    reportMissing: "Meld fra om et manglende ord", reportMissingSubject: "Sátni FST: manglende ord",
    reportMissingFix: "Hva betyr ordet, eller hvor så du det? (valgfritt)", missingDir: (l) => `nordsamisk ↔ ${l}`,
    viaSme: (w) => `via nordsamisk: ${w}`, viaFin: (w) => `via finsk: ${w}`,
    smsUnchecked: "ikke kontrollert", skoltDlgTitle: "Slå på skoltesamisk?",
    skoltDlgBody: `<p>De skoltesamiske ordene kommer fra GiellaLTs finsk–skoltesamisk og norsk–skoltesamisk ordbøker.
      Det finnes ingen ordbok mellom nordsamisk og skoltesamisk, så forbindelsen går via finsk (eller norsk).</p>
      <p>Når det er slått på:</p><ul><li>ordkortet viser det skoltesamiske ordet, også for ord du har søkt på
      samisk (via den finske oversettelsen)</li><li>du kan søke med et skoltesamisk ord: põrtt → talo → dállu</li></ul>
      <p>En skoltesamisk språkbruker har ikke kontrollert ordene ennå, og forbindelsen via finsk er omtrentlig: rundt
      ett av tre kan være feil. Derfor er funksjonen eksperimentell (BETA).</p>`,
    skoltViaLabel: "Vis skoltesamisk også på nordsamiske ordkort",
    skoltViaDesc: "Via den finske oversettelsen, omtrentlig: omtrent hvert tredje ord kan være feil.",
    skoltViaShort: "+ også på nordsamiske ordkort",
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
    toolsIntro: "Når et verktøy er slått på, vises knappen i bunnlinjen (på bred skjerm i topplinjen). Verktøy merket BETA er fortsatt under utvikling.",
    toolGameDesc: "Ordspill: velg riktig alternativ eller skriv ordet på samisk.", toolWordlistsDesc: "Ordlister etter tema, med uttale og lytteøvelse.",
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
    favourites: "★ Favoritter", history: "Historikk", searchingForms: "Søker etter former…", wildSearching: (q) => `Jokersøk ${q}…`, wildHint: "jokersøk: trykk Enter eller her", wildShort: (n) => `Jokersøk trenger minst ${n} bokstaver`, clearHistory: "Tøm historikken", clearHistoryTitle: "Tømme historikken?",
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
    importMain: "Hent favoritter og historikk fra Play-versjonen", importMainDesc: "Legger Play-versjonens ord til etter denne BETA-versjonens egne. Ingenting slettes, og ingenting skrives til Play-versjonen.",
    importMainDone: (f, h) => `Hentet ${f} ${f === 1 ? "favoritt" : "favoritter"} og ${h} søk`, importMainNone: "Fikk ingen data fra Play-versjonen. Oppdater Play-versjonen og åpne den én gang.",
    betaOnTitle: "Dette er en testversjon (BETA)", betaOnOk: "Greit",
    betaOnBody: `<p>I denne BETA-versjonen er de nye funksjonene slått på, så du kan teste dem:</p>
      <ul><li>engelske og spanske maskinoversettelser (engelsk og spansk som oversettelsesspråk)</li><li>finske forslag</li>
      <li>skoltesamisk på ordkort og i søk</li><li>tysk (maskinoversettelse, BETA)</li></ul>
      <p>Det er maskinoversettelser og kan være feil. Du kan slå dem av under Innstillinger → Oversettelsesspråk for å se
      appen slik en vanlig bruker ser den. Tilbakemeldinger hjelper!</p>`,
    expDeuMt: "Tysk", expDeuMtDesc: "Maskinoversettelse for rundt 5 700 ord, når minst 3 kilder er enige. Ingen ordbok.",
    expDeuMtInfo: `<p>Det finnes ingen dekkende åpen ordbok mellom nordsamisk og tysk, så de tyske ordene er maskinoversettelser. Et ord
      vises bare når minst tre av seks uavhengige kilder gir det samme tyske ordet: oversettelsesmodeller fra samisk, fra ordets
      finske og norske oversettelse og fra ordbokas engelske, Wiktionary og Apertiums lille samisk–tyske ordliste. Rundt 5 700 ord, mest vanlige ord.</p>
      <p>I en test mot Wiktionarys samisk–tyske ord var rundt 80 % av ordene med tre kilder og rundt 94 % med fire eller flere
      like eller synonymer. Testen hadde bare rundt 800 ord, så tallet er omtrentlig. Ordkortet viser tysk (≈) og antall
      kilder, og du kan søke med det tyske ordet.</p>`,
    noFavourites: "Ingen favoritter ennå", noHistory: "Ingen søk",
    addFavourite: "Legg til i favoritter", removeFavourite: "Fjern fra favoritter",
    loadingTitle: "Laster ordboken…",
    loadingText: "Første gang lastes ca. 47 MB ned. Deretter fungerer ordboken også uten nettilkobling.",
    loadingLocal: "Ordboken følger med appen, så ingenting lastes ned fra nettet. Åpningen tar noen sekunder.",
    unpacking: "Pakker ut…", mtTag: "maskin", moreHits: (n) => `+${n} ${n === 1 ? "annet treff" : "andre treff"}`, tabGrade: "Stadium", tabFamilyShort: "Familie", tabRawShort: "Alle", loadRetrying: "Lastingen stoppet, prøver på nytt…", loadStalled: "Åpningen av ordboka stoppet. Lukk appen helt og åpne den igjen.",
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
      <dt>Ordlister</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.6 4 9 4 12 6c3-2 6.4-2 9-.5V19c-2.6-1.5-6-1.5-9 .5-3-2-6.4-2-9-.5z"/><path d="M12 6v13.5"/><path d="M15.5 5.2v5.3l1.5-1.2 1.5 1.2V4.9"/></svg> i bunnlinjen: ordlister etter tema med uttale (tall, måneder, familie, farger…) og lytteøvelse.</dd>
      <dt>Minispill</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.6a2.3 2.3 0 0 1-4 .9L15 15.5H9l-1.6 1.9a2.3 2.3 0 0 1-4-.9l-.8-3.6A4 4 0 0 1 6.5 8z"/><path d="M8 10.5v3M6.5 12h3"/></svg> ordspill: velg riktig av fire eller skriv ordet på samisk (hint koster poeng). Nybegynner, viderekommen eller et emne (ordenstall, tid, farger, spørreord, dyr). Spill i bunnlinjen; enaresamisk (eksperimentelt) og skjuling av spillet under Mer → Verktøy.</dd>
      <dt>Bilde og setning</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> finner og oversetter ord og setninger i et bilde (i Android-appen), <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 10h6"/><path d="M12 7.5l2.5 2.5-2.5 2.5"/></svg> oversetter en kort finsk setning. Eksperimentelle: slå dem på under Mer → Verktøy, så dukker knappene opp i bunnlinjen.</dd>
      <dt>Mer</dt><dd>☰ i bunnlinjen (på bred skjerm øverst): språk, innstillinger, verktøy, favoritter og historikk, andre språk og eksperimentelle funksjoner.</dd>`,
    menuTip: "Språk og innstillinger finner du i menyen.",
    tryThese: "Prøv:", randomWord: "Tilfeldig ord",
    listen: "Lytt", fetching: "Henter…", listenTo: (text) => `Lytt: ${text}`,
    copy: "Kopier", copied: (text) => `Kopiert: ${text}`,
    noMailTitle: "Fant ingen e-postapp", noMailBody: "Fant ingen e-postapp på telefonen. Du kan kopiere meldingen og sende den på en annen måte til satni@somby.fi.", noMailCopy: "Kopier meldingen", noMailCopied: "Meldingen er kopiert", noMailTo: "Til", noMailSubject: "Emne",
    tabTable: "Bøying", tabRaw: "Alle former",
    tabMeanings: "Betydninger",
    tabFamily: "Ordfamilie", famBase: "Grunnord", famParts: "Ledd", famDerived: "Avledninger", famCompounds: "Sammensatte ord",
    famSiblings: (b) => `Andre avledninger av ${b}`, famShowAll: (n) => `Vis alle (${n})`, derFrom: "av", famPartsLine: "sammensatt:",
    famSum: (d, c) => "Ordfamilie: " + [d ? `${d} ${d === 1 ? "avledning" : "avledninger"}` : "", c ? `${c} ${c === 1 ? "sammensatt ord" : "sammensatte ord"}` : ""].filter(Boolean).join(", "),
    famNote: "Bare ordbokord som GiellaLTs analysator knytter sammen som avledning eller sammensetning.",
    noHits: (q) => `Ingen treff for «${q}»`,
    noHitsHint: "Prøv en annen skrivemåte, grunnformen eller en oversettelse. Skriv ? for en uklar bokstav og * for flere: á?bmogis, *ortnega.",
    noTranslation: "(ingen oversettelse)",
    noTranslationIn: { fin: "(ingen finsk oversettelse)", nob: "(ingen norsk oversettelse)", eng: "(ingen engelsk oversettelse)",
                       smn: "(ingen enaresamisk oversettelse)", smj: "(ingen lulesamisk oversettelse)",
                       sma: "(ingen sørsamisk oversettelse)" },
    morePrefix: (n, q) => `+${n} andre ord som begynner med «${q}»`, fewerPrefix: "Vis færre",
    moreMeanings: (n) => `+${n} betydninger`, otherLangs: "andre språk",
    searchedForm: (q, tags) => `Søkt form ${q}: ${tags}`,
    helpBtn: "Hjelp for denne siden", helpClose: "Trykk hvor som helst eller Tilbake for å lukke.", helpNext: "Neste", helpPrev: "Forrige", helpDone: "Ferdig", helpCloseBtn: "Lukk guiden", helpTapTip: "Du kan også trykke på et element på siden. Trykk et annet sted for å lukke.",
    help: { word: { title: "Ordkortet", items: {
      speak: "Lytt til ordet. Lyden kommer fra Divvuns samiske talesyntese; stemmen (Biret, Máhtte eller Sunná) kan byttes i Innstillinger. Noen ord er lagret i appen og spilles uten nett.",
      fav: "Legg ordet til favoritter. Favoritter og søkehistorikk finner du i Mer-menyen.",
      report: "Meld fra om feil eller manglende oversettelse. Appen lager en e-post; ingenting sendes uten deg.",
      forms: "Hovedformer: substantiv i grunnform og genitiv, adjektiv også attributiv form, verb infinitiv og 1. person entall. Stadievekslingens konsonanter: sterkt stadium grønt, svakt oransje. Lenken åpner forklaringen.",
      trans: "Oversettelse. Hvis du søkte på en bøyd form, vises omtrentlig oversettelse og grammatikk i samme boks.",
      more: "Andre betydninger: åpner alle betydninger og eksempler.",
      extra: "Andre språk du har valgt i Innstillinger. «maskin» betyr maskinoversettelse; trykk for å se kildene.",
      fam: "Ordfamilie: ord avledet av dette ordet og sammensatte ord der det inngår.",
      tabs: "Faner: Bøying (alle former i tabell, trykk på en form for å høre den), Stadium (forklaring av stadievekslingen), Betydninger, Familie og Alle former." } } },
    searchedFormShort: "søkt form", otherMeanings: "Andre betydninger",
    tagWords: { Sg: "entall", Du: "dualis", Pl: "flertall", Nom: "nominativ", Gen: "genitiv", Acc: "akkusativ", Ill: "illativ", Loc: "lokativ",
      Com: "komitativ", Ess: "essiv", Attr: "attributiv form", Inf: "infinitiv", Prs: "presens", Prt: "preteritum", Cond: "kondisjonalis",
      Pot: "potensialis", Imprt: "imperativ", ConNeg: "nektingsform", PrfPrc: "perfektum partisipp", PrsPrc: "presens partisipp", Ger: "gerundium",
      Actio: "aktio", VGen: "verbgenitiv", VAbess: "verbabessiv", Sup: "supinum", Comp: "komparativ", Superl: "superlativ", Pss: "passiv",
      person: (n, p) => `${p}. person ${{ Sg: "entall", Du: "dualis", Pl: "flertall" }[n]}` },
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
    langName: { deu: "tysk", fin: "finsk", nob: "norsk", eng: "engelsk", smn: "enaresamisk", smj: "lulesamisk", sma: "sørsamisk", sms: "skoltesamisk", spa: "spansk" },
    smeDef: "Forklaring på samisk", smeDefSyn: "samme som",
    relatedSami: "Beslektede ord i andre samiske språk", relatedNote: "Samme opphav, betydningen kan avvike. Kilde: Álgu (Kotus, Institute for the Languages of Finland).",
    placeName: "Stedsnavn", placeSource: "© Kartverket",
    placeTypes: { by: "by", tettsted: "tettsted", tettbebyggelse: "tettsted", bygdelagBygd: "bygd", grend: "grend", kommune: "kommune",
      fjell: "fjell", vann: "vann", tjern: "tjern", elv: "elv", bekk: "bekk", fjord: "fjord", "øy": "øy", "øyISjø": "øy",
      dal: "dal", nesISjø: "nes", nes: "nes", vikISjø: "vik", vik: "vik", "ås": "ås", gard: "gard", bruk: "bruk",
      haug: "haug", myr: "myr", li: "li", foss: "foss", sund: "sund", sundISjø: "sund", "halvøy": "halvøy", fylke: "fylke" },
    alsoFin: "Også:", alsoFinSource: "Oppslagsord i den finsk–samiske ordboka som har dette ordet som oversettelse",
    langIn: { deu: "På tysk", fin: "På finsk", nob: "På norsk", eng: "På engelsk", smn: "På enaresamisk", sms: "På skoltesamisk", smj: "På lulesamisk", sma: "På sørsamisk", spa: "På spansk" },
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
      <p>Ordbøkene er åpne ordbøker fra GiellaLT-fellesskapet (CC BY 4.0), som vedlikeholdes av Giellatekno og Divvun
         (UiT Norges arktiske universitet). Blant forfatterne er Nils Jernsletten (nordsamisk–norsk og deler av
         nordsamisk–finsk), Institutt for de nasjonale språkene i Finland, Kotus (finsk–nordsamisk og nordsamisk–finsk),
         Marja-Liisa Olthuis og Taarna Valtonen (enaresamisk–finsk), Ángel Díaz de Rada og Kjell Kemi
         (nordsamisk–spansk), AKU og Kone-stiftelsen (skoltesamisk) og medlemmer av språksamfunnene.</p>
      <p>Bøyingsformene er laget med GiellaLTs åpne språkmodeller (nordsamisk lang-sme, finsk lang-fin,
         enaresamisk lang-smn og skoltesamisk lang-sms), norsk bøying med Norsk ordbank (Språkbanken).</p>
      <p>Uttale: talesyntese fra Divvun og Giellatekno (UiT Norges arktiske universitet), stemmene Biret,
         Máhtte og Sunná. Lyden hentes fra tjenesten api-giellalt.uit.no på samme måte som på nettstedet sátni.org.
         Den finske stemmen i ordlistene og lytteøvelsen: Chatterbox Finnish (Finnish-NLP, MIT), med stemmen fra
         Harri Tapani Ylilammis LibriVox-opplesning (public domain).</p>
      <h3>Tilbakemelding</h3>
      <p>Hvis du finner et problem, ta kontakt på e-post <a href="mailto:satni@somby.fi">satni@somby.fi</a>
         eller meld det på GitHub: <a href="https://github.com/sombyduodji/satni-fst/issues" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst/issues</a>.
         Tilbakemeldinger og forslag tas gjerne imot på e-post.</p>
      <details><summary>Kilder, lisenser og personvern</summary>
      <p>Lisenser: ordbøkene © GiellaLT (CC BY 4.0, slått sammen og utvidet med bøyingsformer),
         bøying GiellaLT lang-sme (GPL-3.0), bøying av oversettelsene GiellaLT lang-fin (GPL-3.0) og Norsk ordbank
         (Språkbanken / Nasjonalbiblioteket, CC BY 4.0), skoltesamisk (eksperimentelt) GiellaLT dict-sms-mul, dict-fin-sms og
         dict-nob-sms (CC BY 4.0 / 3.0), norske oversettelser (eksperimentelt) Apertium apertium-sme-nob (GPL-2.0-or-later), finske forslag (eksperimentelt) GiellaLT dict-smn-sme, dict-smn-fin og dict-fin-smn (CC BY 4.0), spanske oversettelser GiellaLT dict-sme-spa og dict-spa-sme (Ángel, CC BY 4.0), en del av de engelske oversettelsene Wiktionary (CC BY-SA 4.0, kaikki.org), maskinoversettelser og -forslag (eksperimentelt; engelsk, finsk, spansk, tysk) smi-mt med TartuNLP Smugri-modellen (CC BY 4.0; grunnmodell NLLB-200, CC BY-NC 4.0), Helsinki-NLP opus-mt (Apache-2.0; opus-mt-en-de CC BY 4.0), FinnWordNet (CC BY 3.0), den spanske wordneten MCR 3.0 (CC BY 3.0), den tyske wordneten OdeNet (CC BY-SA 4.0) og CILI (CC BY 4.0), Wiktionary og WikDict (CC BY-SA), GiellaLT-ordbøker (CC BY) og Apertium apertium-fin-eng (GPL-3.0), sql.js (MIT). Eksperimentell tekstgjenkjenning i
         Android-appen: Google ML Kit (Googles vilkår). Bildet behandles på telefonen og forlater ikke enheten,
         og ML Kits sending av bruksstatistikk til Google er slått av. Annen lesing av ukjente samiske ord: Tesseract
         (Apache-2.0) og Nasjonalbibliotekets samiske modell (Nasjonalbiblioteket, CC BY 4.0; Enstad mfl. 2025). Bøyingsformer for enaresamisk og
         skoltesamisk i bilder: GiellaLT lang-smn og lang-sms (GPL-3.0). Finske og norske ordpar i setningsvisningen
         for bilder: Leipzig Corpora Collection (Wortschatz Leipzig, CC BY; bare antall ordpar og ord, ingen setninger). Beslektede ord i andre samiske språk: Álgu (Kotus, Institute for the Languages of Finland, CC BY 4.0). Stedsnavn: Kartverket Stedsnavn (© Kartverket, CC BY 4.0). Korpusfrekvenser: SIKOR (UiT, CC BY 3.0). Sátni FST er fri programvare (GPL-3.0).
         Stadievekslingsgrupper: Oahpa (Giellatekno). Alle kilder, lisenser og endringer: Lisenser-knappen nedenfor.
         Kildekode: <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst</a>.</p>
      </details>`,
    close: "Lukk", licenses: "Lisenser", licensesTitle: "Lisenser og opphavsrett",
  },
};

// Englanti (2026-11-21, kokeellinen kolmas käyttöliittymän kieli). Samat avaimet kuin fi ja nb.
// Kuunteluharjoitus (suomenkielinen ääni) ja lausekääntäjä (suomi -> saame) eivät ole englanniksi käytössä.
UI_TEXTS.en = {
  title: "Sátni FST – North Sámi dictionary and inflector",
  brandSub: "Open North Sámi dictionary and inflection generator",
  uiLanguage: "User interface language", language: "Language",
  sidebar: "History and favourites",
  theme: "Theme", themeAuto: "Automatic", themeLight: "Light", themeDark: "Dark",
  about: "About",
  searchPlaceholder: "Search in Sámi, by translation or by inflected form",
  searchPlaceholderMid: "Search in Sámi or English", searchPlaceholderShort: "Search",
  search: "Search",
  ocrTitle: "Find words in a photo", ocrCamera: "📷 Take a photo", ocrGallery: "🖼️ Choose a photo",
  ocrIntro: "Take a photo of Sámi text or choose a photo. Change the languages with the language button at the top. The text is recognised on the phone, and the photo never leaves the device.",
  ocrWorking: "Recognising text…", ocrFinding: "Looking up words…", ocrSecond: "checking uncertain words…",
  ocrFound: (n) => `${n} dictionary words · tap a word · pinch to zoom`,
  ocrSami: "Sámi", ocrUiLang: "English", ocrDirTitle: "Photo language and translation",
  ocrLangs: { sme: "North Sámi", smn: "Inari Sámi", sms: "Skolt Sámi", fin: "Finnish", nob: "Norwegian", eng: "English" }, ocrOffer: { smn: "The photo contains Inari Sámi. Turn on Inari Sámi?", sms: "The photo contains Skolt Sámi. Turn on Skolt Sámi?" }, ocrViaFinShort: "via Finnish, approximate", ocrFromLabel: "Photo language", sentPick: "Pick sentence", sentTitle: "Sentence from photo", sentWords: "Words from the photo · tap to change", sentCopy: "Copy", sentCopied: "Copied", sentGist: "Put together word by word, a rough guide.", sentUnknown: "unrecognised", sentCmpHint: "Compound put together from its parts; tap the word to see the parts", sentName: "name", sentInPhoto: "In the photo:", sentWhat: "Which word is it?", sentKeep: "Leave untranslated", sentDone: "Done", sentMeaning: "meaning", sentEditWord: "Edit", sentOpen: "Dictionary", sentTapWord: "Tap a word in the sentence", sentSplit: "Split", sentSplitShort: "compound parts yourself", sentSplitHint: "Tap between the letters where the word splits", ocrLangsTitle: "Photo languages", ocrTargetsTitle: "Translation languages", ocrLangsNote: "The Inari and Skolt Sámi word lists are loaded only when the language is selected.", ocrHint: { smn: "The photo may contain Inari Sámi. You can make it a photo language in the settings.", sms: "The photo may contain Skolt Sámi. You can make it a photo language in the settings." }, ocrHintSettings: "Settings", ocrSwap: "Swap direction", ocrViaSmeShort: "via North Sámi, approximate", ocrSmnOffer: "The photo contains Inari Sámi. Turn on Inari Sámi?", ocrNotNow: "Not now", ocrEnable: "Turn on", ocrSkolt: "the photo seems to contain Skolt Sámi, which photo search does not support yet", ocrToLabel: "Translation", ocrViaSme: "Norwegian via North Sámi, approximate",
  ocrStyle: "Marking style and colour", ocrFrame: "Frame", ocrUnderline: "Underline",
  ocrNoText: "No text was found in the photo. Try taking the photo closer and straight on.",
  ocrNoWords: "Text was found, but no dictionary words.",
  ocrDirSwitched: "direction swapped", ocrAlso: "or", ocrUnknown: "not found", ocrNearest: "not found, nearest:", ocrParts: "not found, compound parts:", ocrNearestOrParts: "not found, nearest or parts:", ocrEdit: "Edit search", ocrRotateLeft: "Rotate photo left", ocrRotateRight: "Rotate photo right",
  ocrMore: "Photo settings", ocrGalleryShort: "Choose photo", ocrShoot: "Take photo", ocrPhotoSect: "Photo", ocrMarkSect: "Word marking",
  ocrRotL: "Rotate left", ocrRotR: "Rotate right", ocrBaseForm: "base form", ocrMeant: "Did you mean?",
  ocrNoMatch: "Not found in the dictionary as it is.", ocrTypeSelf: "Type the word yourself", ocrSplitSelf: "Split it yourself",
  ocrFix: "Fix", ocrReportShort: "Report", ocrBackToSugs: "Back to suggestions", sentSelectShort: "Choose words", sentSelect: "Choose words yourself", selHint: "Paint the words with a finger or draw a circle around them · two fingers move the photo", selCount: (n) => `${n} words selected`, ocrTargetAdded: (n) => `${n} added to translation languages`, ocrSourceAdded: (n) => `${n} added to photo languages`, ocrNoSugs: "No suggestions.",
  experimental: "Experimental translations", experimentalOn: "On", experimentalOff: "Off",
  experimentalHint: "Machine translations and suggestions for words that have no translation in the dictionaries. They are still being developed and may contain mistakes. Feedback helps!",
  lauseTitle: "Sentence translator", lauseBadge: "trial", lauseShort: "Sentence", ocrShort: "Photo", expLauseDesc: "A short Finnish sentence into Sámi. Opened from the Sentence button (Finnish user interface only).", lauseDirLabel: "Direction", lauseDirFi: "Finnish → Sámi", lauseDirSme: "Sámi → English", lauseHintSme: "Write a North Sámi sentence. Tap a word to see its meanings or correct it. The English is rough: many words have only machine-translated English.", lausePlaceholderSme: "Mun boađán ihttin.", lauseWordsSme: "Words · tap to change",
  expLauseInfo: `<p>The sentence translator turns a short Finnish sentence into North Sámi, and a North Sámi sentence into Finnish. It works only in the Finnish user interface.</p>`,
  lauseHint: "Write a short Finnish sentence. Tap a word to see how it was read or to change the Sámi word.",
  lausePlaceholder: "saisinko yhden kahvin ja voileivän?", lauseUnknown: "unknown", lauseDidYouMean: "did you mean",
  lauseSkip: "Skip word", lauseResult: "In Sámi (approximate, check the words)",
  lauseSearchWord: (w) => `Look up in the dictionary: ${w}`,
  lauseReading: "Reading", lauseSamiWord: "Sámi word", lauseForm: "Form", lauseSmeForm: "Sámi inflected form", lauseAuto: "automatic",
  lauseForm_place_Ade: "at a place (where?)", lauseForm_means_Ade: "by means of (with what?)", lauseForm_top_Ade: "on top of",
  lauseForm_place_Abl: "from a place (from where?)", lauseForm_top_Abl: "off",
  lauseForm_place_All: "to a place (where to?)", lauseForm_top_All: "onto",
  sanastot: "Word lists", back: "Back", stop: "Stop", sanastoIntro: (n, w) => `${n} topics, ${w} words with pronunciation`, sanastoIntroSmn: (n, w) => `${n} topics, ${w} words in Inari Sámi (base forms, no pronunciation)`, sanastoGroup_perus: "Basic words", sanastoGroup_aika: "Time", sanastoGroup_ihmiset: "People", sanastoGroup_luonto: "Nature", sanastoGroup_arki: "Everyday", sanastoHelp: "Tap a word: listen, copy or open the word card.", sanastoHelpSmn: "Tap a word to copy it.", sanastoCard: "Open word card", sanastoListenAll: "Listen to the dialogue", sanastoListenHint: "in Sámi", sanastoCardinal: "Cardinal number", sanastoCardinalEx: "one, two, three", sanastoOrdinal: "Ordinal number", sanastoOrdinalEx: "first, second",
  ttsStoreHead: "Saved pronunciations", ttsStoreInfo: (n, size, limit) => `${n} words · ${size} / ${limit}`, ttsNone: "No saved pronunciations", ttsLimit: "Maximum size", ttsStoreNote: "Words you listen to are saved on the device, so they also play at once without a network. When the limit is reached, the ones not heard for the longest time are removed.", ttsClear: "Clear saved pronunciations", ttsClearTitle: "Clear saved pronunciations?", ttsClearBody: "The words are fetched from the network again the next time you listen. Recordings for the word lists, practice and game, favourites and history are kept.", ttsCleared: "Saved pronunciations cleared",
  sanastoPlay: "Play", sanastoAgain: "Listen again",
  apuExNote: "The example sentences come from the dictionaries; some of the translations are new. If you spot a mistake, please report it.",
  harjClockTip: "In Sámi, minutes 20–40 are counted from the half hour: beal vihtta = 4:30 (literally “half five”), logi badjel beal vihtta = 4:40 (“ten past half five”).", harjClock: "Clock times", harjClockLv: "Clock times", harjClockLvs: ["o'clock", "half", "quarters", "every 5 min"],
  harjStartMix: (w, c) => (w ? `Start · ${w} words + ${c} clock times` : `Start · ${c} clock times`), harjTimes: (n) => `${n} clock times`,
  harjTitle: "Listening practice", harjTileSub: "A word in Finnish, a moment to think, the answer in Sámi", harjHelp: "Hear a word, think of the answer, then hear and see the right one. Continues until you stop.", harjTopics: "Topics", harjRange: "Number range", harjAll: "Select all", harjNone: "Clear", harjStartN: (n) => `Start · ${n} words`, harjHearFi: "in Finnish", harjHearSme: "in Sámi", harjLists: "Lists", harjWords: (n) => `${n} words`, harjDir: "Direction", harjDirFi: "Finnish → Sámi", harjDirSme: "Sámi → Finnish", harjThink: "Thinking time", harjOrder: "Order", harjShuffle: "shuffled", harjInOrder: "list order", harjAwake: "Keep the screen on", harjScreenOff: "You can turn the screen off: the practice continues, and you can stop it from the notification.", harjPickList: "Choose at least one list.", harjStart: "Start", harjAskSme: "What is it in Sámi?", harjAskFi: "What is it in Finnish?", harjRound: (n) => `Round ${n}`, harjPause: "Pause", harjResume: "Resume", harjNext: "Next", harjNotifTitle: "Sátni FST · practice", harjNumbers: "Numbers", harjOrdinals: "Ordinal numbers",
  lauseClear: "Clear sentence", lauseCheckWord: "Show word details", lauseInSentence: "In this sentence", lauseChoose: "Choose this", lauseFullCard: "Full word card",
  expOcr: "Photo search", expOcrDesc: "Finds dictionary words in the text of a photo and translates words and sentences. Opened from the Photo button.",
  expOcrInfo: `<p>A <svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> Photo button appears in the bottom bar (in the top bar on a wide screen). Take a photo of text or choose
    a photo, and the dictionary words are marked in it. Tap a word to see its translation. With <b>Choose words yourself</b>
    you can paint or circle the words you want with a finger.</p>
    <p>Choose the photo language with the language button: North Sámi, and Inari and Skolt Sámi if they are turned on in
    the settings. In the English user interface, translating a whole sentence is not available.</p>
    <p>The text is recognised on the phone with Google's ML Kit. Unknown Sámi words are read once more with the National
    Library of Norway's Sámi text recognition model (Tesseract), also on the phone. The photo never leaves the device,
    and ML Kit's sending of usage statistics to Google is turned off.</p>`,
  expTableTr: "Translations of inflected forms", expTableTrDesc: "A machine translation under each form in the inflection table.",
  positionOn: "on", positionUnder: "under",
  expTableTrInfo: `<p>A small machine translation appears under the forms of the inflection table. It is available in the
    Finnish and Norwegian user interfaces.</p>`,
  tableTrNote: "The translations were made automatically.",
  expApertium: "Norwegian machine translations", expApertiumDesc: "Apertium: Norwegian for words that have none in the dictionaries.",
  expApertiumInfo: `<p>When Norwegian is the translation language and a word has no translation, the word card shows a
    translation from the vocabulary of the Apertium machine translator (apertium-sme-nob).</p>
    <p>The vocabulary was made for machine translation, not as a dictionary. The translation may be rough or wrong, and
    it has not been checked. These translations do not affect search.</p>`,
  apertiumNote: "Apertium, unchecked",
  expPivotFin: "Finnish suggestions", expPivotFinDesc: "Via other languages, for words with no Finnish translation in the dictionaries.",
  expPivotFinInfo: `<p>When Finnish is the translation language and a word has no Finnish translation, the word card shows
    a suggestion made via another language (Inari Sámi or Norwegian). The suggestions have not been checked, and they do
    not affect search.</p>`,
  // Konekäännetty englanti (eng_mt.py): vain englanniksi ja Muut kielet -kohdan englannille
  expEngMt: "English machine translations", expEngMtDesc: "For words without English in the dictionaries, when two or three translation routes agree.",
  expEngMtInfo: `<p>Only about 10,000 North Sámi words have an English translation in the dictionaries. For about
    17,000 more words, this shows an English word made by machine translation. Each word was translated by three routes:
    from Sámi, from the word's Finnish translation and from its Norwegian translation, with two translation models and
    open dictionaries (WordNet, Wiktionary, Apertium). A word is shown only when at least two routes give the same English word.</p>
    <p>In a test with words that already have English, about 97 % were right when all three routes agreed and about
    85–90 % when two agreed. They are still machine translations: check important words. These words can also be
    found by searching in English, after the dictionary's own translations.</p>`,
  engMtNote: (level) => `machine translation, ${Math.max(2, level || 2)} sources agree`,
  pivotFinNote: { smn: "via Inari Sámi, unchecked", nob: "via Norwegian, unchecked" }, derFinNote: "derived", cmpFinNote: "from its parts", cmpPartsMeaning: "meanings of the parts",
  expEngMtShort: "+ machine translations", expEngMtSub: "About 17,000 more words, when at least 2 sources agree",
  expSpaMtShort: "+ machine translations", expSpaMtSub: "About 6,300 more words, when at least 3 sources agree",
  expSpaMt: "Spanish machine translations", expSpaMtDesc: "For words without Spanish in the dictionary, when at least three sources agree.",
  expSpaMtInfo: `<p>The Spanish dictionary (Ángel Díaz de Rada and Kjell Kemi) has about 7,700 North Sámi words. For about
    6,300 more words, this shows a Spanish word made by machine translation when at least three sources give the same word:
    translation models from the word's Finnish, Norwegian and English translations and from Sámi, Wiktionary and the
    Spanish wordnet (MCR).</p>
    <p>In a test against the dictionary's own translations, about 74 % of the words with three sources and 85–97 % with four
    or more were the same or a synonym. They are still machine translations. The dictionary itself is not changed, and these
    words can be found by searching in Spanish after the dictionary's own translations.</p>`,
  wiktEngNote: "Wiktionary via Finnish and Norwegian, unchecked",
  register: { vulgar: "vulgar", derogatory: "derogatory", offensive: "offensive" },
  registerNote: "According to Wiktionary, the word is considered vulgar, derogatory or offensive",
  expEnable: "Turn on", cancel: "Cancel", smsVia: "via Finnish, approximate",
  reportError: "Report an error", reportWhat: "What is wrong?", reportKindTrans: "The translation is wrong or poor", reportKindMissing: "The translation is missing", reportMissingTrans: "Report a missing translation", fallbackLang: "fallback", derOf: "derived from",
  reportKindWord: "The search gave a completely wrong word", reportKindForm: "An inflected form is wrong", reportKindOther: "Other",
  reportFix: "What would be right? (optional)", reportSend: "Prepare email", reportSubject: "Sátni FST: error report",
  reportSubjectKind: { trans: "translation", word: "wrong word", form: "inflection", sme: "Sámi word", audio: "recording", inappropriate: "inappropriate", other: "other" },
  reportKindSme: "The Sámi word or form is wrong", reportKindAudio: "The recording has an error",
  reportWhichWord: "Which word? (optional)", reportList: "Word list",
  minipeli: "Mini game", gameButton: "Mini game in the top bar", gameSmn: "Inari Sámi in the mini game and word lists", gameSmnNote: "", reportKindBad: "The word is inappropriate",
  reportDetails: "Report details",
  reportLabels: { error: "Error", word: "Word", shown: "Translation shown", search: "Search", ui: "User interface",
    other: "other languages", version: "Version", link: "Link", place: "View", lang: "Language", base: "Base form",
    via: "Pivot language", sentence: "Sentence", words: "Words", form: "Form in the sentence", list: "List", voice: "Voice", read: "Photo reading", dir: "Search direction" },
  reportPlaces: { photo: "Photo search", sent: "Sentence view", lause: "Sentence translator", harj: "Listening practice", missing: "Search: missing word" },
  reportMissing: "Report a missing word", reportMissingSubject: "Sátni FST: missing word",
  reportMissingFix: "What does the word mean, or where did you see it? (optional)", missingDir: (l) => `North Sámi ↔ ${l}`,
  viaSme: (w) => `via North Sámi: ${w}`, viaFin: (w) => `via Finnish: ${w}`,
  smsUnchecked: "unchecked", skoltDlgTitle: "Turn on Skolt Sámi?",
  skoltDlgBody: `<p>The Skolt Sámi words come from GiellaLT's Finnish–Skolt Sámi and Norwegian–Skolt Sámi dictionaries.
    There is no dictionary between North Sámi and Skolt Sámi, so the link goes via Finnish (or Norwegian).</p>
    <p>When it is on:</p><ul><li>the word card shows the Skolt Sámi word, also for words you searched in Sámi (via
    the Finnish translation)</li><li>you can search with a Skolt Sámi word: põrtt → talo → dállu</li></ul>
    <p>A Skolt Sámi speaker has not yet checked the words, and the link via Finnish is approximate: about one in three
    may be wrong. That's why the feature is experimental (BETA).</p>`,
  skoltViaLabel: "Also show Skolt Sámi on North Sámi word cards",
  skoltViaDesc: "Via the Finnish translation, approximate: about one in three may be wrong.",
  skoltViaShort: "+ also on North Sámi word cards",
  ocrError: "Processing the photo failed.", ocrNoApp: "No camera app was found.",
  showGrade: "Show consonant gradation",
  settings: "Settings", otherLanguages: "Other languages",
  extraLangsHint: "Translations in the selected languages appear on the word card in addition to English, and you can also search with them.",
  voice: "Voice",
  setGeneral: "General", setMore: "More", setLook: "Language and appearance", setCard: "Word card and pronunciation",
  setLangs: "Translation languages", setTools: "Tools", setHistory: "History and favourites", setAbout: "About the app",
  themeNote: "Automatic follows the device setting.",
  textSize: "Text size", textSizeSystem: "Device", textSizeNote: "Device: the same text size as in the device's own settings.",
  previewHouse: "house", previewInHouse: "in the house",
  showGradeDesc: "Strong and weak grade in colour", voiceHead: "Pronunciation voice",
  toolsIntro: "The button of a tool that is turned on appears in the bottom bar (in the top bar on a wide screen). Tools marked BETA are still being developed.",
  toolGameDesc: "Word game: choose the right option or write the word in Sámi.", toolWordlistsDesc: "Word lists by topic with pronunciation.",
  toolAlways: "Always", toolSmnDesc: "Words also in Inari Sámi; some not yet checked.",
  langSource: { eng: "Wiktionary and Giellatekno", smn: "Giellatekno", smj: "Giellatekno", sma: "Giellatekno", spa: "dict-sme-spa (UNED)", sms: "via Finnish translations", fin: "Giellatekno and Kotus", nob: "Giellatekno" },
  historyNote: "Favourites and history appear in the menu and on the start page.",
  sumGradeOn: "Gradation shown", sumGradeOff: "Gradation hidden", sumNone: "None selected", sumOff: "No buttons",
  sumExp: (n) => (n ? `${n} on` : "Off"), sumHistory: (n) => `${n} searches in history`,
  sumTextSystem: "device text size", sumText: (n) => `text size ${n} %`, sumTheme: { auto: "automatic theme", light: "light theme", dark: "dark theme" },
  gradeStyleHead: "Gradation marking", gradeGdColor: "Strong grade (GD)", gradeHdColor: "Weak grade (HD)",
  gradeUnderline: "Underline", gradeUnderlineDesc: "Strong grade with a solid line, weak with a dashed line: visible even without colours.",
  gradeCvd: "Colour-blind friendly: blue and orange", gradeSample: "example",
  gradeColors: { green: "green", orange: "orange", blue: "blue", purple: "purple", red: "red", brown: "brown", none: "no colour" },
  sumUnderline: "underline",
  clearSearch: "Clear search", historyRemoved: (w) => `Removed from history: ${w}`, historyHint: "Long-press to remove a word from history.",
  navLabel: "Main menu", navSearch: "Search", navGame: "Game", navSentence: "Sentence", navPhoto: "Photo", navMore: "More",
  sanastoPrev: "previous", sanastoNext: "next", menuFeedback: "Feedback", menuSupport: "Support", menuAbout: "About and licences", historyAll: (n) => `Show all (${n})`, sanastoCount: (n, w) => `${n} topics · ${w} words`,
  recentHead: "Recent searches", expTools: "New tools", expMore: "More translations",
  favourites: "★ Favourites", history: "History", searchingForms: "Searching forms…", wildSearching: (q) => `Wildcard search ${q}…`, wildHint: "wildcard search: press Enter or tap", wildShort: (n) => `Wildcard search needs at least ${n} letters`, clearHistory: "Clear history", clearHistoryTitle: "Clear history?",
  clearHistoryBody: "All search history will be removed. Favourites are kept.", clearHistoryOk: "Clear", historyMore: "More…",
  supportStory: `<p><strong>Buorre beaivi! I'm Juha Somby.</strong></p>
    <p>UNESCO classifies all Sámi languages as endangered, and there are fewer than 30,000 speakers in total. For small
       language communities and Indigenous peoples, accessible digital tools such as spell checkers, morphological
       analysers (FST), dictionaries and learning tools are important for keeping a language alive in everyday life today.</p>
    <p>I make free and open-source apps and tools for North Sámi and the other Sámi languages.</p>`,
  supportHelpTitle: "How you can help",
  supportCoffeeTitle: "Why support?",
  supportCoffee: `<p>Developing and maintaining open language technology takes time and needs constant care of data and code.
       By buying a coffee you support this work directly:</p>
    <ul class="support-ways">
      <li>the tools stay free and open for learners, native speakers and researchers</li>
      <li>modern digital infrastructure is built for endangered languages</li>
      <li>new tools, analysers and interactive apps are made for the community</li>
    </ul>`,
  supportNote: `Support is voluntary and does not unlock any extra features: the app and the dictionary stay free for everyone.
    Support goes to the developer of the app, not to the authors of the dictionaries. The dictionary data is the work of
    GiellaLT, Divvun, Giellatekno and other authors.`,
  supportThanks: "Giitu olu! Thank you for supporting Sámi language technology!",
  supportWays: `<li><strong>Fix translations and words:</strong> tell me about a wrong translation or a missing word.</li>
    <li><strong>Report errors:</strong> tell me if something doesn't work or looks odd.</li>
    <li><strong>Suggest ideas:</strong> new features, themes or changes to the user interface.</li>
    <li><strong>Accessibility:</strong> tell me what would make the app easier to use, for example with a visual or motor impairment or dyslexia.</li>
    <li><strong>Take part in development:</strong> the source code is open, and fixes are welcome.</li>`,
  importMain: "Import favourites and history from the Play version", importMainDesc: "Adds the Play version's words after this BETA version's own. Nothing is deleted, and nothing is written to the Play version.",
  importMainDone: (f, h) => `Imported ${f} ${f === 1 ? "favourite" : "favourites"} and ${h} ${h === 1 ? "search" : "searches"}`, importMainNone: "No data from the Play version. Update the Play version and open it once.",
  betaOnTitle: "This is a test version (BETA)", betaOnOk: "Got it",
  betaOnBody: `<p>In this BETA version the new features are already on, so you can test them:</p>
    <ul><li>English and Spanish machine translations (English and Spanish as translation languages)</li><li>Finnish suggestions</li>
    <li>Skolt Sámi on word cards and in search</li><li>German (machine translation, BETA)</li></ul>
    <p>They are machine translations and may be wrong. You can turn them off under Settings → Translation languages to see
    the app as a regular user does. Feedback helps!</p>`,
  expDeuMt: "German", expDeuMtDesc: "Machine translation for about 5,700 words, when at least 3 sources agree. No dictionary.",
  expDeuMtInfo: `<p>There is no comprehensive open dictionary between North Sámi and German, so the German words are machine translations.
    A word is shown only when at least three of six independent sources give the same German word: translation models from
    Sámi, from the word's Finnish and Norwegian translations and from the dictionary's English, Wiktionary, and Apertium's small
    Sámi–German word list. About 5,700
    words, mostly common ones.</p>
    <p>In a test against Wiktionary's Sámi–German words, about 80 % of the words with three sources and about 94 % with four
    or more were the same or a synonym. The test had only about 800 words, so the figure is approximate. The word card shows
    German (≈) and the number of sources, and you can search with the German word.</p>`,
  noFavourites: "No favourites yet", noHistory: "No searches",
  addFavourite: "Add to favourites", removeFavourite: "Remove from favourites",
  loadingTitle: "Loading the dictionary…",
  loadingText: "The first time, about 47 MB is downloaded. After that, the dictionary also works offline.",
  loadingLocal: "The dictionary is included in the app, so nothing is downloaded. Opening takes a few seconds.",
  unpacking: "Unpacking…", mtTag: "machine", moreHits: (n) => `+${n} other ${n === 1 ? "result" : "results"}`, tabGrade: "Grade", tabFamilyShort: "Family", tabRawShort: "All", loadRetrying: "Loading stopped, trying again…", loadStalled: "Opening the dictionary stopped. Close the app completely and open it again.",
  loadFailed: (status) => `Loading the dictionary failed (${status})`,
  loadFailedLong: (msg) => `Loading the dictionary failed: ${msg}`,
  welcomeTitle: "Bures boahtin! – Welcome",
  welcomeLead: "A North Sámi dictionary with the full inflection of every word. English translations for about 10,000 words " +
    "(and machine translations for more as an experimental option), Finnish and Norwegian for almost all words.",
  welcomeTips: `<dt>Search</dt><dd>with a Sámi word (dahkat), an English word (do) or an inflected form (dagan).</dd>
    <dt>Inflection</dt><dd>all moods for verbs, cases for nominals (sg. and pl.).</dd>
    <dt>Gradation</dt><dd>strong grade <b class="gd">GD</b> and weak grade <b class="hd">HD</b> in their own colours (selectable in the settings).</dd>
    <dt>Pronunciation</dt><dd>🔈 next to the word, or tap a form in the table: listen or copy.</dd>
    <dt>Favourites</dt><dd>★ saves the word to your own list.</dd>
    <dt>Word lists</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.6 4 9 4 12 6c3-2 6.4-2 9-.5V19c-2.6-1.5-6-1.5-9 .5-3-2-6.4-2-9-.5z"/><path d="M12 6v13.5"/><path d="M15.5 5.2v5.3l1.5-1.2 1.5 1.2V4.9"/></svg> in the bottom bar: word lists by topic with pronunciation (numbers, months, family, colours…).</dd>
    <dt>Mini game</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.6a2.3 2.3 0 0 1-4 .9L15 15.5H9l-1.6 1.9a2.3 2.3 0 0 1-4-.9l-.8-3.6A4 4 0 0 1 6.5 8z"/><path d="M8 10.5v3M6.5 12h3"/></svg> word game: choose the right one of four or write the word in Sámi (hints cost points). Beginner, advanced or a topic. The game is in the bottom bar; hide it under More → Tools.</dd>
    <dt>Photo</dt><dd><svg class="tip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg> finds and translates the words in a photo (in the Android app). Experimental: turn it on under More → Tools, and the button appears in the bottom bar.</dd>
    <dt>More</dt><dd>☰ in the bottom bar (at the top on a wide screen): language, settings, tools, favourites and history, other languages and experimental features.</dd>`,
  menuTip: "Language and settings are in the menu.",
  tryThese: "Try:", randomWord: "Random word",
  listen: "Listen", fetching: "Fetching…", listenTo: (text) => `Listen: ${text}`,
  copy: "Copy", copied: (text) => `Copied: ${text}`,
  noMailTitle: "No email app found", noMailBody: "No email app was found on this phone. You can copy the message and send it another way to satni@somby.fi.", noMailCopy: "Copy message", noMailCopied: "Message copied", noMailTo: "To", noMailSubject: "Subject",
  tabTable: "Inflection", tabRaw: "All forms",
  tabMeanings: "Meanings",
  tabFamily: "Word family", famBase: "Base word", famParts: "Parts", famDerived: "Derived words", famCompounds: "Compounds",
  famSiblings: (b) => `Other words derived from ${b}`, famShowAll: (n) => `Show all (${n})`, derFrom: "from", famPartsLine: "compound:",
  famSum: (d, c) => "Word family: " + [d ? `${d} derived ${d === 1 ? "word" : "words"}` : "", c ? `${c} ${c === 1 ? "compound" : "compounds"}` : ""].filter(Boolean).join(", "),
  famNote: "Only dictionary words that the GiellaLT analyser links as a derivation or compound.",
  noHits: (q) => `No results for “${q}”`,
  noHitsHint: "Try another spelling, the base form or a translation. Use ? for an unclear letter and * for several letters: á?bmogis, *ortnega.",
  noTranslation: "(no translation)",
  noTranslationIn: { fin: "(no Finnish translation)", nob: "(no Norwegian translation)", eng: "(no English translation)",
                     smn: "(no Inari Sámi translation)", smj: "(no Lule Sámi translation)",
                     sma: "(no South Sámi translation)" },
  morePrefix: (n, q) => `+${n} more words starting with “${q}”`, fewerPrefix: "Show fewer",
  moreMeanings: (n) => `+${n} meanings`, otherLangs: "other languages",
  searchedForm: (q, tags) => `Searched form ${q}: ${tags}`,
  helpBtn: "Help for this page", helpClose: "Tap anywhere or press Back to close.", helpNext: "Next", helpPrev: "Back", helpDone: "Done", helpCloseBtn: "Close guide", helpTapTip: "You can also tap a part of the page. Tap elsewhere to close.",
  help: { word: { title: "Word card", items: {
    speak: "Listen to the word. The voice comes from Divvun's Sámi speech synthesis; you can change the voice (Biret, Máhtte or Sunná) in Settings. Some words are stored in the app and play offline.",
    fav: "Add the word to your favourites. Favourites and search history are in the More menu.",
    report: "Report a mistake or a missing translation. The app prepares an email; nothing is sent without you.",
    forms: "Principal forms: nouns show the base form and genitive, adjectives also the attributive form, verbs the infinitive and 1st person singular. Gradation consonants: strong grade in green, weak in orange. The link explains the gradation.",
    trans: "Translation. If you searched an inflected form, its grammar is shown in the same box.",
    more: "Other meanings: opens all meanings and examples.",
    extra: "Other languages you chose in Settings. \"machine\" means machine translation; tap it to see the sources.",
    fam: "Word family: words derived from this word and compounds that contain it.",
    tabs: "Tabs: Inflection (all forms in a table, tap a form to hear it), Grade (the gradation explained), Meanings, Family and All forms." } } },
  searchedFormShort: "the form you searched", otherMeanings: "Other meanings",
  tagWords: { Sg: "singular", Du: "dual", Pl: "plural", Nom: "nominative", Gen: "genitive", Acc: "accusative", Ill: "illative", Loc: "locative",
    Com: "comitative", Ess: "essive", Attr: "attributive form", Inf: "infinitive", Prs: "present", Prt: "past", Cond: "conditional",
    Pot: "potential", Imprt: "imperative", ConNeg: "negative form", PrfPrc: "past participle", PrsPrc: "present participle", Ger: "gerund",
    Actio: "action noun", VGen: "verb genitive", VAbess: "verb abessive", Sup: "supine", Comp: "comparative", Superl: "superlative", Pss: "passive",
    person: (n, p) => `${p}${{ 1: "st", 2: "nd", 3: "rd" }[p]} person ${{ Sg: "singular", Du: "dual", Pl: "plural" }[n]}` },
  cliticInfo: (q, stem, parts) => `${q} = ${stem} + ${parts}`,
  finCliticInfo: (q, stem, c, sme) => `${q} = ${stem} + -${c} (in Sámi ${sme})`,
  didYouMean: "Did you mean:",
  cliticMeaning: { go: "question: -ko, -kö (Finnish)", ge: "also; in negative sentences: either", nai: "also", son: "in questions: I wonder", han: "after all, you know" },
  formIn: (q, forms, lang) => `<b>${q}</b> ≈ ${forms} <span class="muted small">(${lang === "fin" ? "in Finnish" : lang === "nob" ? "in Norwegian" : "in English"}, approximately)</span>`,
  viaForm: (q, base, sme, tag) => `<b>${q}</b> = ${base}` + (sme ? ` ≈ <b>${sme}</b> <span class="muted small">(${tag}, approximately)</span>` : ` <span class="muted small">(base form)</span>`),
  gradation: "Gradation", noGradation: "no visible gradation",
  gradForms: "Strong → weak grade", gradClusters: "Consonants", gradGrades: "Grades", gradGroup: "Gradation group",
  nomClass: "Nominal class", verbClass: "Verb class",
  verbClassNames: { I: "I · even-syllable", II: "II · odd-syllable", III: "III · contracted verb" },
  nomClassNames: { I: "I · even-syllable", II: "II · odd-syllable", III: "III · contracted nominal" },
  nomClassRules: { I: "<b class=\"gd\">Strong:</b> nominative sg., illative sg., essive · <b class=\"hd\">Weak:</b> other forms",
                   II: "<b class=\"hd\">Weak:</b> nominative sg., essive · <b class=\"gd\">Strong:</b> other forms",
                   III: "<b class=\"hd\">Weak:</b> nominative sg., essive · <b class=\"gd\">Strong:</b> other forms" },
  gradeLegend: `Grade: <b class="gd">GD</b> strong grade &nbsp;&nbsp; <b class="hd">HD</b> weak grade`,
  noForms: "The FST generator produced no inflected forms for this word.",
  tapHint: "Tap a form: listen or copy.",
  noMeanings: "No meaning information.", noExampleTranslation: "(no translation in the source)",
  usedIn: (place, code) => `used in ${place} (${code})`,
  dialEast: "east", dialWest: "west", dialCompare: "cf.", dialLegend: "east = eastern, west = western",
  geo: { N: "Norway", S: "Finland", R: "Sweden" },
  ttsFailed: (msg) => `Could not get the pronunciation: ${msg}.`,
  ttsTapAgain: "The sound is ready – tap again to listen.",
  ttsOffline: "could not connect to the speech service. The first listening needs a network connection",
  ttsStatus: (status) => `the speech service answered ${status}`,
  indicative: "Indicative", present: "present", preterite: "preterite", conditional: "Conditional",
  potential: "Potential", imperative: "Imperative", nonFinite: "Non-finite forms",
  affirmative: "Affirmative", negative: "Negative", baseForm: "Base form", uninflected: "Uninflected",
  caseCol: "Case", formCol: "Form", singular: "sg. (singular)", plural: "pl. (plural)",
  comparison: "Comparison", predicative: "predicative", attributive: "attributive",
  comparative: "Comparative", superlative: "Superlative",
  nonFiniteRows: ["Infinitive", "Perfect participle", "Present participle", "Gerund", "Verb genitive",
                  "Verb abessive", "Supine", "Action (Nom)", "Action (Loc)", "Action (Com)", "Action (Ess)"],
  pos: {
    V: "Verb", N: "Noun", A: "Adjective", ADV: "Adverb", PRON: "Pronoun", NUM: "Numeral",
    CC: "Coordinating conjunction", CS: "Subordinating conjunction", PCLE: "Particle", INTERJ: "Interjection",
    PO: "Postposition", PR: "Preposition", CMP: "First part of a compound", MWE: "Multi-word expression",
    PHRASE: "Phrase", ABBR: "Abbreviation",
  },
  subtype: {
    Prop: "Proper noun", NomAg: "Agent noun", Pers: "Personal pronoun", Dem: "Demonstrative pronoun",
    Indef: "Indefinite pronoun", Interr: "Interrogative pronoun", Refl: "Reflexive pronoun",
    Rel: "Relative pronoun", Ord: "Ordinal number", Coll: "Collective",
  },
  elsewhere: "The word elsewhere",
  gtTitle: "The word in Giellatekno's Neahttadigisánit dictionary (translations, word history, examples from texts)", satniTitle: "The word in the sátni.org dictionaries",
  langName: { deu: "German", fin: "Finnish", nob: "Norwegian", eng: "English", smn: "Inari Sámi", smj: "Lule Sámi", sma: "South Sámi", sms: "Skolt Sámi", spa: "Spanish" },
  smeDef: "Explanation in Sámi", smeDefSyn: "same as",
  relatedSami: "Related words in other Sámi languages", relatedNote: "Same origin, the meaning may differ. Source: Álgu (Kotus, Institute for the Languages of Finland).",
  placeName: "Place name", placeSource: "© Kartverket",
  placeTypes: { by: "town", tettsted: "built-up area", tettbebyggelse: "built-up area", bygdelagBygd: "village", grend: "hamlet", kommune: "municipality",
    fjell: "mountain", vann: "lake", tjern: "pond", elv: "river", bekk: "stream", fjord: "fjord", "øy": "island", "øyISjø": "island",
    dal: "valley", nesISjø: "headland", nes: "headland", vikISjø: "bay", vik: "bay", "ås": "ridge", gard: "farm", bruk: "farm",
    haug: "hill", myr: "bog", li: "slope", foss: "waterfall", sund: "strait", sundISjø: "strait", "halvøy": "peninsula", fylke: "county" },
  alsoFin: "Also:", alsoFinSource: "Headwords of the Finnish–Sámi dictionary that this word translates",
  langIn: { deu: "In German", fin: "In Finnish", nob: "In Norwegian", eng: "In English", smn: "In Inari Sámi", sms: "In Skolt Sámi", smj: "In Lule Sámi", sma: "In South Sámi", spa: "In Spanish" },
  // Tietoa-ikkuna. Ääntämisen kuvaus on sovittu Divvunin kanssa (2026-10-29), älä muuta sisältöä.
  aboutWeb: (v) => (v ? `Version ${v} (web)` : "Web version"), aboutDesktop: (v) => `Version ${v} (desktop)`,
  aboutAndroid: (v) => `Version ${v} (Android)`,
  home: "To the start page", madeBy: "Made by:", sendFeedback: "Send feedback", feedbackIntro: "Errors, missing words, translation fixes and ideas are welcome.", feedbackOpenMail: "Open email", feedbackGithub: "Report on GitHub", feedbackSubject: "Sátni FST feedback", support: "Take part and support",
  aboutBody: `<p class="about-tagline">A North Sámi inflector and dictionary based on open-source software.</p>
    <h3>Author</h3>
    <p><strong>Juha Somby</strong><br>
       <a href="mailto:satni@somby.fi">satni@somby.fi</a> ·
       <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">GitHub</a></p>
    <h3>Language data and language technology</h3>
    <p>The dictionaries are open dictionaries of the GiellaLT community (CC BY 4.0), maintained by Giellatekno and Divvun
       (UiT The Arctic University of Norway). Their authors include Nils Jernsletten (North Sámi–Norwegian and part of
       North Sámi–Finnish), the Institute for the Languages of Finland (Finnish–North Sámi and North Sámi–Finnish),
       Marja-Liisa Olthuis and Taarna Valtonen (Inari Sámi–Finnish), Ángel Díaz de Rada and Kjell Kemi (North Sámi–Spanish),
       AKU and the Kone Foundation (Skolt Sámi) and members of the language communities.</p>
    <p>The inflected forms are made with GiellaLT's open language models (North Sámi lang-sme, Finnish lang-fin,
       Inari Sámi lang-smn and Skolt Sámi lang-sms), Norwegian inflection with Norsk ordbank (Språkbanken).</p>
    <p>Pronunciation: speech synthesis by Divvun and Giellatekno (UiT The Arctic University of Norway), the voices Biret,
       Máhtte and Sunná. The sound is fetched from the service api-giellalt.uit.no in the same way as on the sátni.org website.
       The Finnish voice of the word lists and the listening practice: Chatterbox Finnish (Finnish-NLP, MIT), with the voice
       of Harri Tapani Ylilammi's LibriVox reading (public domain).</p>
    <h3>Feedback</h3>
    <p>If you notice a problem, contact <a href="mailto:satni@somby.fi">satni@somby.fi</a>
       or report it on GitHub: <a href="https://github.com/sombyduodji/satni-fst/issues" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst/issues</a>.
       Feedback and suggestions are welcome by email.</p>
    <details><summary>Sources, licences and privacy</summary>
    <p>Licences: dictionaries © GiellaLT (CC BY 4.0, combined and extended with inflected forms),
       inflection GiellaLT lang-sme (GPL-3.0), inflection of the translations GiellaLT lang-fin (GPL-3.0) and Norsk ordbank
       (Språkbanken / National Library of Norway, CC BY 4.0), Skolt Sámi (experimental) GiellaLT dict-sms-mul, dict-fin-sms and
       dict-nob-sms (CC BY 4.0 / 3.0), Norwegian translations (experimental) Apertium apertium-sme-nob (GPL-2.0-or-later), Finnish suggestions (experimental) GiellaLT dict-smn-sme, dict-smn-fin and dict-fin-smn (CC BY 4.0), Spanish translations GiellaLT dict-sme-spa and dict-spa-sme (Ángel, CC BY 4.0), some of the English translations Wiktionary (CC BY-SA 4.0, kaikki.org),
       machine translations and suggestions (experimental; English, Finnish, Spanish, German): smi-mt with the TartuNLP Smugri model (CC BY 4.0; base model NLLB-200, CC BY-NC 4.0), Helsinki-NLP opus-mt (Apache-2.0; opus-mt-en-de CC BY 4.0), FinnWordNet (CC BY 3.0), the Spanish wordnet MCR 3.0 (CC BY 3.0), the German wordnet OdeNet (CC BY-SA 4.0) and CILI (CC BY 4.0), Wiktionary and WikDict (CC BY-SA), GiellaLT dictionaries (CC BY) and Apertium apertium-fin-eng (GPL-3.0),
       sql.js (MIT). Experimental text recognition
       in the Android app: Google ML Kit (Google's terms). The photo is processed on the phone and never leaves the device,
       and ML Kit's sending of usage statistics to Google is turned off. Second reading of unknown Sámi words:
       Tesseract (Apache-2.0) and the National Library of Norway's Sámi model (Nasjonalbiblioteket, CC BY 4.0; Enstad et al. 2025). Inari and Skolt Sámi
       inflected forms in photos: GiellaLT lang-smn and lang-sms (GPL-3.0). Finnish and Norwegian word pairs in the sentence view
       for photos: Leipzig Corpora Collection (Wortschatz Leipzig, CC BY; only counts of word pairs and words, no sentences). Related words in other Sámi languages: Álgu (Kotus, Institute for the Languages of Finland, CC BY 4.0). Place names: Kartverket Stedsnavn (© Kartverket, CC BY 4.0). Corpus frequencies: SIKOR (UiT, CC BY 3.0). Sátni FST is free software (GPL-3.0).
       Gradation groups: Oahpa (Giellatekno). All sources, licences and changes: the Licences button below.
       Source code: <a href="https://github.com/sombyduodji/satni-fst" target="_blank" rel="noopener">github.com/sombyduodji/satni-fst</a>.</p>
    </details>`,
  close: "Close", licenses: "Licences", licensesTitle: "Licences and copyright",
};

// Liput SVG:nä (emoji-liput eivät näy Windowsissa)
const FLAGS = {
  fi: `<svg viewBox="0 0 18 11" aria-hidden="true"><rect width="18" height="11" fill="#fff"/>` +
      `<rect x="5" width="3" height="11" fill="#002f6c"/><rect y="4" width="18" height="3" fill="#002f6c"/></svg>`,
  nb: `<svg viewBox="0 0 22 16" aria-hidden="true"><rect width="22" height="16" fill="#ba0c2f"/>` +
      `<rect x="6" width="4" height="16" fill="#fff"/><rect y="6" width="22" height="4" fill="#fff"/>` +
      `<rect x="7" width="2" height="16" fill="#00205b"/><rect y="7" width="22" height="2" fill="#00205b"/></svg>`,
  en: `<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="ukc"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath>` +
      `<path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/>` +
      `<path d="M0,0 60,30M60,0 0,30" clip-path="url(#ukc)" stroke="#C8102E" stroke-width="4"/>` +
      `<path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg>`,
};
