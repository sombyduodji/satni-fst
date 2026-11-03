# Google Play

The Play version comes from the same code as the GitHub APK. The `play` build flavor removes the support link and its texts.

- Build: `./build_apk.sh --play` writes `dist/satni-fst-play.aab`.
- Test: `./build_apk.sh --play-testi`, then `./emulaattori.sh kaynnista play` and `./emulaattori.sh asenna play` (Android 16).
- Package name: `fi.somby.satnifst`. It cannot change after publishing.
- Privacy policy: https://sombyduodji.github.io/satni-fst/privacy.html (publish the site first).
- Before any tester gets a build, the source of that build must be public on GitHub (GPL).

## First upload

1. Create the app with the default language Finnish, as an app, free, and accept the declarations.
2. **App signing: choose to use your own key** (`~/.config/satni-fst-signing/satni-fst-release.jks`, follow Play Console's upload steps). Do this before the first upload: it is what lets people with the GitHub APK update from Play without losing favourites. Google's generated key would prevent that.
3. Upload `dist/satni-fst-play.aab` to a closed test and add at least 12 testers.
4. If the account needs it, testers must stay opted in for 14 days in a row, then apply for production.

## Store listing drafts

Limits: title 30 characters, short description 80, full description 4,000. Category: Books & Reference.

### Suomi

**Nimi:** Sátni FST – saamen sanakirja

**Lyhyt kuvaus:** Pohjoissaamen sanakirja ja taivutin, joka toimii ilman verkkoyhteyttä.

**Kuvaus:**

Sátni FST on maksuton pohjoissaamen sanakirja, jossa on sanojen koko taivutus. Se toimii ilman verkkoyhteyttä, eikä siinä ole mainoksia eikä tiliä.

• Noin 80 000 sanaa, joista noin 74 000:lle täydet taivutustaulukot
• Käännökset suomeksi ja norjaksi, osalle sanoista englanniksi sekä inarin-, luulajan- ja eteläsaameksi
• Hae saamen sanalla, taivutetulla muodolla (dagan → dahkat) tai suomen tai norjan sanalla
• Astevaihtelu näkyy väreillä: vahva aste vihreänä, heikko oranssina
• Ääntäminen Divvunin puhesynteesillä (vaatii verkkoyhteyden)
• Jaa sana mistä tahansa sovelluksesta suoraan Sátni FST:lle
• Suosikit, hakuhistoria, vaalea ja tumma teema
• Kokeellisina: kuvasta haku, koltansaamen sanat ja konekäännökset

Kielitieto on saamen kieliteknologiayhteisön työtä, ennen kaikkea GiellaLT, Divvun ja Giellatekno (UiT). Sovellus on avointa lähdekoodia (GPL-3.0): https://github.com/sombyduodji/satni-fst

Palaute: satni@somby.fi

### Norsk

**Navn:** Sátni FST – samisk ordbok

**Kort beskrivelse:** Nordsamisk ordbok og bøyingsverktøy som virker uten nett.

**Beskrivelse:**

Sátni FST er en gratis nordsamisk ordbok med full bøying av ordene. Den virker uten nett og har verken reklame eller konto.

• Omtrent 80 000 ord, omtrent 74 000 med fullstendige bøyingstabeller
• Oversettelser til norsk og finsk, for en del av ordene også til engelsk, enaresamisk, lulesamisk og sørsamisk
• Søk med et samisk ord, en bøyd form (dagan → dahkat) eller et norsk eller finsk ord
• Stadieveksling vises i farger: sterkt stadium i grønt, svakt i oransje
• Uttale med Divvuns talesyntese (krever nett)
• Del et ord fra hvilken som helst app rett til Sátni FST
• Favoritter, søkehistorikk, lyst og mørkt tema
• Eksperimentelt: bildesøk, skoltesamiske ord og maskinoversettelser

Språkdataene er arbeidet til det samiske språkteknologimiljøet, framfor alt GiellaLT, Divvun og Giellatekno (UiT). Appen har åpen kildekode (GPL-3.0): https://github.com/sombyduodji/satni-fst

Tilbakemelding: satni@somby.fi

### English

**Name:** Sátni FST – Sámi dictionary

**Short description:** An offline North Sámi dictionary with full inflection.

**Description:**

Sátni FST is a free North Sámi dictionary with full inflection. It works offline and has no ads and no account. The user interface is in Finnish or Norwegian.

• About 80,000 words, about 74,000 with full inflection tables
• Translations into Finnish and Norwegian, and for some words English, Inari, Lule and Southern Sámi
• Search with a Sámi word, an inflected form (dagan → dahkat) or a Finnish or Norwegian word
• Consonant gradation shown in colour
• Pronunciation with Divvun's speech synthesis (needs a network connection)
• Share a word from any app straight to Sátni FST
• Favourites, search history, light and dark theme
• Experimental: search from a photo, Skolt Sámi words and machine translations

The language data is the work of the Sámi language technology community, above all GiellaLT, Divvun and Giellatekno (UiT). Open source (GPL-3.0): https://github.com/sombyduodji/satni-fst

Feedback: satni@somby.fi

## Graphics

In `docs/google-play/graphics/`: `icon-512.png`, `feature-1024x500.png` and `phone-*.png`.

## Other forms: suggested answers

Check these yourself: you are responsible for what you declare.

| Form | Suggested answer |
|---|---|
| Ads | No ads |
| App access | All functionality available without special access |
| Target audience | 13 and older, not directed at children |
| Content rating | Reference app, no objectionable content. Answer the questionnaire |
| News, health, financial, government | No |
| Data deletion | No account. Data is on the device, removed with the app. Contact satni@somby.fi for feedback emails |

### Data safety

| Question | Suggested answer |
|---|---|
| Collects or shares user data | Yes, because of the two items below |
| Encrypted in transit | Yes |
| Users can request deletion | The app has no account; see the privacy policy |

| Data | Destination | Purpose | Notes |
|---|---|---|---|
| Word sent for pronunciation (App activity, other user-generated content) | Divvun and Giellatekno speech service | App functionality | Optional. Only when the user taps listen. Check whether Play treats this as collected or shared |
| App info and performance, device or other IDs | Google, through ML Kit | Analytics, diagnostics | Optional. Only with photo search on. Google says ML Kit does not transfer this to third parties |

Google's data disclosure for ML Kit: https://developers.google.com/ml-kit/android-data-disclosure
It doesn't name the bundled text recognition model or say whether the data can be deleted, so check that when filling in the form.
