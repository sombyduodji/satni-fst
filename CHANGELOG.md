# Changelog

All releases of Sátni FST. Downloads: [GitHub releases](https://github.com/sombyduodji/satni-fst/releases).
[Suomi](CHANGELOG.fi.md) · [Norsk](CHANGELOG.nb.md)

## 1.1.0 — 2026-11-26

Much less memory and a faster start on Android, an English user interface, a redesigned word card, and new word lists and games.

- **Much less memory, faster start (Android).** The dictionary is now read with the phone's own SQLite database engine instead of being loaded into the app's memory. The app uses about 70–80 MB instead of about 400 MB, is ready to search in 0.4–0.8 s instead of 1.2–3.3 s, and wildcard searches are up to 4 times faster. The first start after the update copies the dictionary to the phone's storage (about 165 MB, under a second); if that fails, for example when storage is full, the app uses the old way. 330 test searches gave identical results with both engines.
- **English user interface.** The app, the word lists and the game can be used in English as well as Finnish and Norwegian (choose in the menu). Search works with English words and their inflected forms (*dogs*, *went*).
- **Redesigned word card.**
  - Principal forms under the word, as in printed dictionaries: *áhčči, áhči*; *vielgat, vielgada, attr. vilges*; *dahkat, dagan*. The consonants that change in gradation are coloured, with a link to the full explanation.
  - The translation has its own box. For an inflected form it also says the grammar in plain words (*manai ≈ meni, kulki · preteriti, yks. 3. persoona*).
  - Listen, favourite and report are icons side by side; other meanings and other languages are tidier; other search results collapse into one line; tabs with nothing to show are hidden; on phones the verb tenses are shown one below the other.
- **Word family.** A new tab shows words derived from the word and compounds that contain it, where the GiellaLT analyser links them and both words are in the dictionary.
- **Guide.** The **?** button at the end of the search row explains the parts of the word card one at a time; you can also tap any part of the card.
- **Smarter search for inflected words.** A form like *lohkamin* or *guliid* now shows the word it belongs to first (*lohkat*, *guolli*).
- **No dead ends.** A word with no translation in your language shows the translation in another language (marked as such) or, for a derived word, the word it comes from, with a link to report the missing translation. *No results* has *Report a missing word*.
- **Clock times.** A game with an analog clock (*Ollugo diibmu lea?*): choose or write the time, or listen to Biret and pick the right clock; full hours, halves and quarters, or every five minutes. *Times of day → Clock times* shows all times as clocks. Sámi counts minutes 20–40 from the half hour (*logi badjel beal vihtta* = 4:40), and the Finnish now does the same. The time expressions come from GiellaLT's clock generator.
- **New word lists.** *Animals*; *Berries, fruit and vegetables*; *Near and far* (*dát* near me, *diet* near you, *duot* over there, *dot* further away, with their where and where-to words) with its own game; and helper words: *This and that*, *Here and there*, *Before and after* and *Linking and little words*, with example sentences. *Times of day* has eight more words, and question words, pronouns and demonstratives show more case forms (*gii · gean · geasa · geas*, *muinna*). Lists that have a game have a *Play* button.
- **Better audio.** All word audio was remade so short words no longer lose sounds, and every clip in all four voices was listened through by ear; 145 words now use a better recording.
- **Photo search: choose words yourself** right away, by painting or circling them, next to *Pick sentence*.
- **Experimental translation languages** (off by default, *Settings → Translation languages*): machine-translated English for about 17,000 more words, Spanish for about 6,300 and German for about 5,750 (there is no open North Sámi–German dictionary), and Finnish suggestions for about 2,200 words without Finnish. Each is shown only when several independent sources agree, marked as a machine translation with the number of sources. Skolt Sámi words can be searched too (*põrtt*, also without special letters).
- **Inari Sámi:** more words that are certain; uncertain ones were removed. *Play* is shown only on lists whose game has Inari words.
- **Fixes:** if Android froze the app while the dictionary was loading, it could stay on "Loading the dictionary…" – loading now restarts by itself; reporting an error on a phone without an email app offers to copy the message; Back from a word list returns to the card you came from; switching dark mode no longer reloads the app; the notice about an outdated system WebView appears in the phone's language; the experimental sentence builder handles plural and dual subjects, participles and passive negation better.

## 1.0.0 — 2026-11-21

The first full release. Besides the dictionary, the app now has word lists with pronunciation, a listening practice, a word game and a much better photo search.

- **New look on phones.** A bottom bar with Search, Word lists, Game and More; the tools you switch on (Photo, Sentence) get their own buttons there. Settings are grouped into pages: Look, Word card, Translation languages, History, Tools and Experimental.
- **Word lists.** Topic lists with pronunciation by Biret, Máhtte and Sunná: numbers and ordinals, days, months and seasons, family, colours, question words, reindeer, weather and more. Tap a word to hear it, copy it or open its word card. The greetings can be heard as a conversation.
- **Listening practice** (Finnish menu language). Harri says a word in Finnish, you get a moment to think, and the Sámi answer is spoken and shown. Choose topics, number ranges, direction, thinking time and voice; it keeps playing with the screen off and can be stopped from the notification.
- **Word game.** Pick the right translation from four, or write the word in Sámi (hints cost a point, missing special letters too). Beginner and advanced levels and short topic games (ordinals, time words, colours, question words, animals); in the time and question games Biret says the right answer. Best results on a podium. Double taps cannot answer twice or skip the result.
- **Photo search** (Android, switch on under *Tools*). Full-screen photo with the words marked; tap a word for its translation in the right form (*beavddis* = pöydässä). *Pick sentence* translates the whole sentence word by word in context, and *Choose words yourself* lets you paint or circle the words with a finger. Sideways photos are turned automatically. Photos can also be read as Finnish or Norwegian text and translated into Sámi.
- **Better photo reading.** Words the phone reads wrongly are corrected more often: missing special letters, a double letter read as one, *I*/*l* mix-ups and words broken at the end of a line. Unknown Sámi words get a second reading with the National Library of Norway's Sámi text recognition model, on the phone. Compounds are split into their parts when the whole word is not in the dictionary.
- **Inari and Skolt Sámi in photos** (experimental, off by default). The app recognises the language by itself and translates through the Inari or Skolt dictionaries.
- **Inari Sámi in the game and word lists** (experimental, *Tools*).
- **Sentence translator** (experimental, Finnish menu language). A short Finnish sentence becomes a North Sámi sentence built from the dictionary's words and forms; tap a word to change its reading or form.
- **Related words in other Sámi languages.** The word card shows the same word in Inari, Skolt, Lule and South Sámi where Álgu, the etymological database of the Sámi languages, links them (*boazu*: puásui, puäʒʒ, boatsoj, bovtse). About 13,000 words.
- **Place names.** Sámi place names in Norway with their Norwegian names (*Guovdageaidnu* – Kautokeino) from Kartverket, and Finnish names for about 400 places such as Utsjoki and Ivalo.
- **Better Finnish.** About 145 wrong or misleading Finnish translations corrected after a check against independent references, such as *ektui* (suhteen, verrattuna), *gáhttet* (suojella) and *hárjeheaddji* (valmentaja). About 1,300 compounds that had no Finnish get a checked translation, and words ending in *-vuohta* get a Finnish *-uus/-yys* suggestion (*mánnávuohta* ≈ lapsuus).
- **Wildcard search.** `?` stands for one letter and `*` for any letters: `á?bmogis`, `bo*`. Patterns starting with a wildcard need three letters.
- **Faster search.** Searching is 20–40 times faster and the dictionary is smaller to download.
- **Report a mistake everywhere.** Word card, inflection forms, word lists, the game, photo search and the sentence views all have a report button that prepares an email.
- **Stored pronunciations.** Words you have listened to are kept on the device for offline use; choose the maximum size or clear them under *Word card*.
- **Gradation colours.** Choose the colours of the strong and weak grade, or underlining, including a colour-blind friendly preset.
- **Skolt Sámi translations** (unchecked, off by default) through the Finnish translations, with a warning that they may be wrong.
- **Privacy.** The app sends no usage statistics; Google ML Kit's statistics are switched off. Photos never leave the phone. The only network use is the Divvun pronunciation service when you press the speaker.
- **Accessibility and fixes.** Better contrast, keyboard use and screen reader labels; Back and Esc close one layer at a time; a too-old Android WebView shows a clear message instead of loading forever; changing the phone's font size no longer reloads the app.
- **Inflection class.** The word card shows the class of nouns and verbs (I even-syllable, II odd-syllable, III contracted) when the source and the word's forms agree. Nouns also show their grades. No class is guessed for other words.
- **East and west.** Words and translations that differ by area are marked (it)/(lä) in Finnish and (ø)/(v) in Norwegian. Two spellings of the same word, such as *girku* and *kirku*, share one card that either spelling finds. Different words get a link to each other, such as *gánda* and *lunta*.
- **Search.** Translations with an area mark, such as *patja*, are now found.
- **Pronunciation.** A new tap stops the sound that is playing and cancels any request still on its way, so sounds no longer overlap or play one after another.
- **More Sámi translations.** About 40 words get a missing Inari, Lule or Southern Sámi translation from GiellaLT's Inari, Lule and Southern Sámi to North Sámi dictionaries.
- **Finnish suggestions (experimental).** For words with no Finnish translation, the word card can show a suggestion made through Inari Sámi or Norwegian, marked as unchecked. About 2,150 words get one. Switch it on under *Experimental features*.
- **Spanish.** Spanish translations for about 7,600 words, including about two thirds of the most common ones, with meanings and example sentences from GiellaLT's Spanish dictionaries by Ángel. Switch them on under *Other languages*.
- **Search in other languages.** Languages switched on under *Other languages* can also be used to search, after North Sámi and Finnish or Norwegian matches: *perro* finds *beana*. The result list shows which language matched. Only base forms are found.
- **Search finds translations with a note in brackets.** *naida* now finds words translated "naida (kerran)", and *immoral* finds "immoral (of women)": about 3,400 words that could only be found by typing the note too.
- **"Did you mean" in the search box and for other languages.** While typing, the search box suggests the word with its missing special letters (*cahci* → *čáhci*), also in the languages switched on under *Other languages* (*arbol* → *árbol*, *tjielte* → *tjïelte*). The suggestion only adds letters, never swaps them.
- **More English.** About 3,100 words get English from Wiktionary, and about 1,800 more show an unchecked English suggestion. English search also ignores a leading *to* or *a* (*read* finds "to read").
- **Finnish forms in the inflection table corrected.** The Finnish translation next to each Sámi form now uses standard Finnish: *haluan*, not *haluun*; *kauniista*, not *kaunista*; *kiipijöihin*, not *kiipijiin*; *pelastusliiveiltä*, not *pelastusliiveilta*. About 1,900 words changed. Every Finnish form is checked against the Voikko spell checker and the GiellaLT analyser. Where no correct form could be confirmed, the table cell shows no Finnish instead of a wrong one.
- **Style labels.** Translations that are vulgar, derogatory or offensive now carry a label on the word card, in the meanings and in the result list, such as *perse* (vulgar), *muija* (derogatory) and *tater* (offensive). The labels come from Wiktionary's own markings and were reviewed by hand: 37 translation words are marked.
- **Cleaner English.** About 1,100 English "translations" that were really grammar notes from Konrad Nielsen's dictionary ("continuative of njuol’got", "caus. of rok’čit"), Sámi words in the old spelling, or German left over from the Sámi–German original ("den Schlucken haben") are removed, and about 370 more lose such a note but keep their English ("middlemost (= gâs’kâlâmŏs)" → "middlemost"). Wiktionary English that Wiktionary marks as offensive is only used when the Sámi word itself is marked so, and then with the label.
- **Spelling fixes.** About 60 Finnish typos and outdated spellings in the translations are corrected, such as *kaivosyitys* → *kaivosyritys*, *taitelija* → *taiteilija* and *tietokonenohjelma* → *tietokoneohjelma*; each was confirmed with two spell checkers and by hand. Spanish typos such as *latimarse* → *lastimarse* and *reluctacia* → *reluctancia* are corrected, and work notes ("XXX") left in the source dictionaries are removed.

## 0.9.3 — 2026-11-03

- **Gradation corrected.** Strong and weak grade were the wrong way round on about 340 words, including common ones such as *dilli*, *gilli*, *sivva*, *nisu* and *biras*. The word card and the colours in the inflection table are now right. The group name was also corrected on about 450 words, such as *listu*.
- **Clearer gradation row.** When grades III and II are spelled alike, the row now marks the grade the word really uses: *mannat* shows *nn* II, and contracted words such as *suolu* show *ll* III.
- **More labelled forms.** Grade III forms of some verbs, such as *viehkki* from *viehkat*, are now marked as strong grade.
- **Experimental: Apertium translations.** A new switch, off by default, shows a Norwegian translation for about 4,600 words that have none in the dictionaries. They come from the apertium-sme-nob machine translation dictionary, are marked as unchecked and do not affect search.
- **Finding the menu.** A one-time tip on the ☰ button says that language and settings are in the menu, and the welcome page has a new Menu row.
- **Search suggestions.** The list now also appears when the word you typed is the only match, so it no longer looks as if nothing was found before you press Enter.
- **Web version.** Installed browser versions download the updated dictionary once, about 45 MB.

## 0.9.2.3 — 2026-11-03

- **Gradation boxes on phones.** Words no longer run out of their box on narrow screens. This corrects 0.9.2.2. The word pair
  and the gradation group now have their own rows.

## 0.9.2.2 — 2026-11-03

A small update: a tidier menu and more precise licence information.

- **Tidier menu.** The app name and developer are at the top, favourites and history come next, and settings, other
  languages and experimental features are in one Settings section that opens when needed.
- **The logo goes home.** The logo and app name return to the welcome page.
- **Clearer About window.** The developer, language data and feedback come first; sources, licences and privacy are in
  a section that opens.
- **New windows for feedback and support.** Feedback shows the address with a copy button, and has email and GitHub
  links. *Contribute and support* lists ways to help, such as correcting translations, ideas and accessibility.
- **Label renamed.** The word card's *Oahpa group* is now *Gradation group*. Oahpa stays credited as the source of the table.
- **Licence information.** The additional permission for Google ML Kit now says that the Corresponding Source must
  include the covered work but not ML Kit's own source code. The North Sámi language models are now built from recorded GiellaLT
  commits with `rakenna_fst.sh`.
- **Dictionary rebuilt with those models.** The words, translations and examples are unchanged. One word changed: *unnajuovllat*
  no longer shows gradation or the variant *unajuovllat*.

## 0.9.2.1 — 2026-11-02

A small corrections update.

- **Dual pronouns:** *moai*, *doai* and *soai* now read *me (2)*, *te (2)* and *he (2)*.
- **Reviewed Finnish translations:** *nubbi*, *galle*, *ihtin*, *eisseváldi*, *earenomáš*, *maiddai*, *máid* and *ovtta oaivilis*.
- **Experimental Skolt Sámi:** common words come first when words have the same score.

## 0.9.2 — 2026-11-02

- **Finnish search finds more forms.** Other common pronouns (*kenelle*, *tälle*, *niille*, *jolle*) and the endings *-lla*,
  *-lta* and *-ksi* of nouns, adjectives and numerals (*talolla*, *pöydältä*, *taloksi*) now find the word.
- **No uncertain Sámi forms.** Finnish *-lla*, *-lta*, *-lle* and *-ksi* don't match a single Sámi form: *pöydällä* is
  *beavddi alde*, not *beavddis*. For these the app finds the word but no longer suggests a form. This corrects 0.9.1, which
  showed for example *kolmelle ≈ golbmii*. Forms about people stay: *minulla = mus*, *kenelle = geasa*.
- **Position words on the word card:** *päällä: beavddi alde · alla: beavddi vuolde*, for 10 nouns checked against dictionary
  examples. Only checked phrases are shown, because these words don't fit every noun.
- **The base word of 37 dictionary words with a clitic:** *ollugo = ollu + -go*, with a link to *ollu*.
- **Main genitive form first:** *talon ≈ viesu*, not *vieso*. The other form stays searchable.
- **Search suggestions:** a *Searching for forms…* row while forms are looked up, direct matches first, and suggestions from
  two letters.
- **Settings:** the gradation setting is a switch and also hides the gradation box. The photo search setting has a shorter name.

## 0.9.1 — 2026-11-02

- **Finnish search finds inflected personal pronouns.** *minulle*, *minulla*, *minut*, *sinulle*, *hänelle*, *meille*
  and the other case forms find *mun*, *don*, *son* and the other pronouns, and show the Sámi form: *minulle = minä ≈
  munnje*. Clitics work too: *minulleko* → *munnjego*. All Finnish pronoun forms were checked with the GiellaLT Finnish
  analyser.
- **Pronoun forms on the word card:** searching *munnje* shows *minulle / minuun*. The dual is marked with the number 2:
  *munnuide* shows *meille (2) / meihin (2)*, and in Norwegian *vi (2)* instead of *vi to*.
- **Numerals in Finnish search:** *kolmelle*, *kuuden* and *sadalle* find *golbma*, *guhtta* and *čuođi* with the
  matching Sámi form.
- **Search suggestions include inflected forms.** The list under the search box shows the base word in bold and the
  Sámi form in italics, for both *mus* and *minulla*: **mun** *mus*. Ordinary suggestions appear at once, and the forms
  after a short pause in typing, so typing stays smooth. Tested with about 2 500 searches.
- **Personal pronoun tables show translations:** *munnje* has *minulle / minuun* below it, and the dual is marked with
  the number 2.
- **Experimental: machine translations in the inflection table.** Switch them on under *Experimental features* in the
  ☰ menu, and the forms of other words get a translation below them too: *mun lean – minä olen*, *moai letne – me (2)
  olemme*. They are generated automatically from the word's first translation, so they aren't always right, and a form
  with no reliable translation shows nothing.
- **Menu:** *About* and *Buy me a coffee* moved to the bottom of the ☰ menu. History shows the 10 latest searches, with
  a *More…* button for the rest, and returns to 10 when the menu is opened again. Clearing the history now asks for
  confirmation, and its button is further from *More…*.
- **Corrections:** Finnish potential of *olla* (*lienen, en liene*), and the Norwegian third person singular imperative
  (*la ham/henne*).
- Finnish form lookup is faster when you press Enter.

## 0.9 — 2026-10-31

Includes the test versions 0.8.2-dev–0.8.5-dev.

- **Search finds words with clitics.** *boađátgo*, *viesusge*, *mungo*, *dathan* and *sonnai* find *boahtit*,
  *viessu*, *mun*, *dat* and *son*, also with two clitics (*buorregohan*) or a hyphen (*dalle-ge*). The word card
  explains the clitic: *boađátgo = boađát + -go (kysymys: -ko, -kö)*. Meanings are shown for -go, -ge, -nai, -son and
  -han (checked against the dictionaries and a North Sámi textbook); the other clitics the analyser knows (-gen,
  -ges, -gis, -hal, -ba, -bai, -bat, -be) are recognised without a meaning. Tested with 2 000 words checked by the
  North Sámi analyser: the right word was found for 1 998.
- **Clitics in Finnish too.** The Finnish form line gets the matching Finnish clitic (*boađátgo ≈ tuletko*,
  *viesusge ≈ talossakin / talossakaan*), and searching in Finnish with a clitic works: *tuletko*, *talossakin* and
  *teetkö* find *boahtit*, *viessu* and *bargat* and show the Sámi form with its clitic (*tuletko = tulla ≈
  boađátgo*). With negative verbs the Finnish clitic goes where it belongs: *(eikö) tuleskele*, *(ei) tulekaan*.
  Vowel harmony follows the word's ending or the last part of a compound (*lainausmerkissäkö*). Checked both ways
  with 1 000 words and with the GiellaLT analysers for Finnish and North Sámi.
- **"Did you mean":** when a search finds nothing, or only a much rarer word, the app suggests the same word with
  the Sámi letters added: *boadatgo* → *boađátgo* (boahtit), *cahci* → *čáhci*, *Danmarkun* → *Dánmárkun*. Tested
  with 2 000 typed words without Sámi letters: the right word was found for 96–97 %.
- **Experimental: Skolt Sámi.** Switch it on under *Experimental features* in the ☰ menu, and the word card shows
  Skolt Sámi words from GiellaLT's Skolt Sámi dictionaries: for a Finnish or Norwegian search word directly from the
  dictionary (*talo* → *tääll, põrtt*), and for a North Sámi word through its Finnish translation, marked "via
  Finnish". Not yet checked by a Skolt Sámi speaker.
- **Menu:** *Other languages* are switches, and each experimental feature has its own switch with a short
  description; switching one on first explains what it does. If you had the photo search on, it stays on.
- **Neahttadigisánit** instead of the Giellatekno paradigm page: the button opens the word in Giellatekno's
  dictionary (sanit.oahpa.no) with translations, word history and a search in texts (Korp).
- **Fixes:** search box suggestions open the word you picked (*vuostá* = juusto / vastaan used to open the first
  one); pronunciation no longer fails with "not allowed by the user agent" when fetching the voice takes a moment;
  an empty search no longer shows lines left over from the previous word.

## 0.8.1 — 2026-10-31

- **Loading ring in the photo search** (Android, experimental): a spinning ring over the photo while the text is
  recognised and while dictionary words are looked up, also when switching the direction (Sámi ⇄ Finnish or
  Norwegian) with a photo open. Looking up words in the other direction can take a few seconds on a phone, and the
  app no longer looks frozen meanwhile.
- **Buy me a coffee** link at the end of the About window, for those who want to support Sátni FST.
- The photo appears right away while its words are looked up, and the direction button changes as soon as it is
  tapped.

## 0.8 — 2026-10-31

- **Listen and copy any form:** tap a form in the inflection table or the *All forms* tab to open a small bubble
  with 🔈 and a copy button. Copying works on Android, Windows, Linux and the web version.
- **New listen button:** a round 🔈 button next to the word replaces the *Listen* button; a spinning ring shows
  while the sound is fetched.
- **Tidier word card:** consonant gradation is shown in labelled cells (strong → weak form, consonants, grades,
  Oahpa group) that no longer break in the middle of a line; on phones they form a 2 × 2 grid.
- **Links to other sites as pills:** Giellatekno and sátni.org are now round buttons under *Word elsewhere*, in their
  own box to the right of the word on wide screens and at the bottom of the card on phones. The ChatGPT button was
  removed.
- **Photo word marks in the Sámi flag colours:** red, yellow, blue or green. Yellow marks get a darker edge so they
  stand out on light paper.
- **Licences in the app:** the About window has a *Licences* button that shows all copyright and licence notices
  and the full licence texts, including those of the libraries bundled in the desktop apps. The About window now
  also credits Oahpa and links to the source code.

## 0.7.6.1 — 2026-10-30

- **Experimental, Android: look up words from a photo.** Take a photo of text or pick one, and the words found in
  the dictionary are marked in the photo. Tap a word to see a bubble with its translation and a 🔈 button, and tap the
  bubble to open the word in the dictionary; Back returns to the photo.
  - Works from North Sámi to Finnish or Norwegian (the user interface language) and back, also with inflected words
    (*dagan* → *dahkat*, *talossa* → *viessu*). Missing Sámi diacritics are fixed with the dictionary (*cahci* → *čáhci*).
  - Choose how words are marked: a light frame or an underline, in one of six colours.
  - Zoom with two fingers or a double tap.
  - Text is recognised on the phone with Google ML Kit; the photo never leaves the device. ML Kit may send anonymous
    usage statistics to Google when the feature is used.
  - Off by default: switch it on under *Experimental features* at the bottom of the ☰ menu.
- **Loading animation** on the 🔈 Listen button while the sound is fetched.
- **Licence:** an additional permission under GPL-3.0 section 7 allows the Android app to include Google ML Kit
  (see [CREDITS.md](CREDITS.md)).
- The Android app is larger (about 57 MB) because of the text recognition model. The desktop apps and the web version
  are unchanged apart from the version number.

## 0.7.5 — 2026-10-30

- Search with inflected Finnish and Norwegian words: *juon* finds *juhkat*, *taloon* finds *viessu*, *husene* finds
  *dállu*. For Finnish words the card also shows the Sámi word in the same form.
- First stable release; contact for problems and feedback in the About window and README.

## 0.7.4 — 2026-10-30

- The translation follows the searched form (*viesus* ≈ *talossa / talosta*, *dagan* ≈ *teen*).
- Better search for inflected words: common words first, search limited to North Sámi and the user interface language.
- Cleaner dictionary: duplicate entries merged, grammar notes no longer shown as words.
- New ☰ menu on all platforms; translations follow the user interface language; other languages can be switched on.
- Voice samples (Biret, Máhtte, Sunná) included in the app; the first start asks for the language.

## 0.7.3 — 2026-10-30

- Android: share a word from any app straight to Sátni FST.
- Search the word on sátni.org or ask ChatGPT from the word card.
- About 1 300 more Finnish translations from the Finnish–Sámi dictionary.

## 0.7.2 — 2026-10-29

- Fixes.

## 0.7.1 — 2026-10-29

- Phone layout and scrolling fixes.

## 0.7 — 2026-10-29

- Phone layout fixes.

## 0.6 — 2026-10-29

- Clearer search results; translations only in the selected language.

## 0.5 — 2026-10-29

- Contact address satni@somby.fi; Android release signing key (updates install over 0.5 and newer).

## 0.4 — 2026-10-29

- Android app, new logo, GPL-3.0 licence and credits.

## 0.3 — 2026-10-29

- User interface in Finnish and Norwegian, translations in six languages, reverse dictionaries for searching,
  80 417 words.

## 0.2 — 2026-10-28

- Consonant gradation, Sámi case table, meanings and examples, Giellatekno button.

## 0.1 — 2026-10-28

- First version.
