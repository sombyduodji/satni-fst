# Changelog

All releases of Sátni FST. Downloads: [GitHub releases](https://github.com/sombyduodji/satni-fst/releases).
[Suomi](CHANGELOG.fi.md) · [Norsk](CHANGELOG.nb.md)

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
