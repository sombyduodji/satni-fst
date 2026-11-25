# Credits and licences

Sátni FST is built almost entirely on the open work of others. **The dictionaries, the morphology
and the pronunciation all come from the Sámi language technology community** — above all
[GiellaLT](https://giellalt.github.io/), [Divvun](https://divvun.no/) and
[Giellatekno](https://giellatekno.uit.no/) at UiT The Arctic University of Norway. Sátni FST only
combines their work into one offline app.

## Dictionaries — GiellaLT, CC BY 4.0

| Dictionary | Used for | Source |
|---|---|---|
| North Sámi (monolingual) | North Sámi definitions on the word card and in Meanings | [giellalt/dict-sme](https://github.com/giellalt/dict-sme) |
| North Sámi → Finnish | Finnish translations, meanings and examples | [giellalt/dict-sme-fin](https://github.com/giellalt/dict-sme-fin) |
| North Sámi → Norwegian | Norwegian translations, meanings and examples | [giellalt/dict-sme-nob](https://github.com/giellalt/dict-sme-nob) |
| North Sámi → English | English translations (partly based on Konrad Nielsen's *Lappisk ordbok*) | [giellalt/dict-sme-eng](https://github.com/giellalt/dict-sme-eng) |
| North Sámi → Inari Sámi | Inari Sámi translations | [giellalt/dict-sme-smn](https://github.com/giellalt/dict-sme-smn) |
| North Sámi → Lule Sámi | Lule Sámi translations | [giellalt/dict-sme-smj](https://github.com/giellalt/dict-sme-smj) |
| North Sámi → Southern Sámi | Southern Sámi translations | [giellalt/dict-sme-sma](https://github.com/giellalt/dict-sme-sma) |
| Finnish → North Sámi | Searching with Finnish words | [giellalt/dict-fin-sme](https://github.com/giellalt/dict-fin-sme) |
| Norwegian → North Sámi | Searching with Norwegian words | [giellalt/dict-nob-sme](https://github.com/giellalt/dict-nob-sme) |
| Inari Sámi → North Sámi | Missing Inari Sámi translations; Finnish suggestions (experimental) | [giellalt/dict-smn-sme](https://github.com/giellalt/dict-smn-sme) |
| Lule Sámi → North Sámi | Missing Lule Sámi translations | [giellalt/dict-smj-sme](https://github.com/giellalt/dict-smj-sme) |
| Southern Sámi → North Sámi | Missing Southern Sámi translations | [giellalt/dict-sma-sme](https://github.com/giellalt/dict-sma-sme) |
| Inari Sámi → Finnish | Finnish suggestions (experimental); Inari Sámi mini game words, checked against dict-sme-smn (experimental) | [giellalt/dict-smn-fin](https://github.com/giellalt/dict-smn-fin) |
| Finnish → Inari Sámi | Finnish suggestions (experimental); Inari Sámi mini game words (experimental) | [giellalt/dict-fin-smn](https://github.com/giellalt/dict-fin-smn) |
| North Sámi → Spanish | Spanish translations, meanings and examples (by Ángel Díaz de Rada and Kjell Kemi) | [giellalt/dict-sme-spa](https://github.com/giellalt/dict-sme-spa) |
| Spanish → North Sámi | Missing Spanish translations (by Ángel Díaz de Rada and Kjell Kemi) | [giellalt/dict-spa-sme](https://github.com/giellalt/dict-spa-sme) |
| Skolt Sámi → Finnish, Norwegian … | Skolt Sámi words (experimental) | [giellalt/dict-sms-mul](https://github.com/giellalt/dict-sms-mul) |
| Finnish → Skolt Sámi | Skolt Sámi words (experimental) | [giellalt/dict-fin-sms](https://github.com/giellalt/dict-fin-sms) (CC BY 3.0) |
| Norwegian → Skolt Sámi | Skolt Sámi words (experimental) | [giellalt/dict-nob-sms](https://github.com/giellalt/dict-nob-sms) |

All are © GiellaLT / Divvun / Giellatekno and their contributors, licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/), except
`dict-fin-sms`, which is under [CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).
As the dictionaries' own attribution texts specify, they are also the work of **Nils Jernsletten** (North Sámi ↔
Norwegian, and part of North Sámi → Finnish), **Kotus – Institute for the Languages of Finland** (Finnish ↔ North Sámi),
**Marja-Liisa Olthuis and Taarna Valtonen** (Finnish ↔ Inari Sámi), **AKU and the Kone Foundation** (Finnish and
Norwegian → Skolt Sámi), and of members of the language communities.

**Skolt Sámi word frequencies** (`sms_frekvenssit.tsv`): counts of dictionary words in the texts marked free in GiellaLT's [corpus-sms](https://github.com/giellalt/corpus-sms), used only to order words. No corpus text is included.

**Finnish suggestions (experimental):** for words with no Finnish translation, [`pivot_fin.py`](pivot_fin.py) suggests
one through Inari Sámi (the word's Inari Sámi translation and its Finnish translation in `dict-smn-fin` or
`dict-fin-smn`) or, failing that, the Finnish translation other words have for the same Norwegian word. Finnish words
are checked with the GiellaLT lang-fin analyser. The suggestions are marked as unchecked in the app.

**Apertium Norwegian translations (experimental):** the bilingual dictionary of [apertium/apertium-sme-nob](https://github.com/apertium/apertium-sme-nob) (GPL-2.0-or-later, © Francis M. Tyers, Kevin Brubeck Unhammer, Trond Trosterud and the Apertium contributors; most of the bilingual dictionary comes from Giellatekno), used for words with no Norwegian translation in GiellaLT and marked as unchecked (`apertium_data.py`).

**English from Wiktionary:** for words with no English in GiellaLT's dictionary, [`wiktionary_eng.py`](wiktionary_eng.py)
uses English Wiktionary (© Wiktionary contributors, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)),
read from the machine-readable extract at [kaikki.org](https://kaikki.org) (wiktextract by Tatu Ylönen). Only two
direct sources become translations: Wiktionary's own North Sámi entries, and English entries whose translation table
lists the North Sámi word. When the Wiktionary explanations of a word's first Finnish and first Norwegian translation
give the same English, it is shown as an unchecked suggestion. The adapted data is licensed under GPL-3.0 with the rest of
the app, which CC BY-SA 4.0 allows as a compatible licence.

**English machine translations (experimental):** for words with no English in the dictionaries, [`eng_mt.py`](eng_mt.py)
translates each word by three routes (from Sámi with smi-mt, the TartuNLP Smugri model, CC BY 4.0, base model NLLB-200
CC BY-NC 4.0; from the word's Finnish and Norwegian translations with Helsinki-NLP opus-mt-fi-en and opus-mt-gmq-en,
Apache-2.0, FinnWordNet 2.0, CC BY 3.0 with Princeton WordNet 3.0, Wiktionary, CC BY-SA 4.0, and Apertium
apertium-fin-eng, GPL-3.0). A word is kept only when at least two routes agree ([`eng_mt.tsv`](eng_mt.tsv)); the app
shows it only when the setting is on, marked as a machine translation. The test is in
[docs/englanti-testi-2026-11-21.md](docs/englanti-testi-2026-11-21.md).

**Finnish machine-translated suggestions (experimental):** [`fin_mt.py`](fin_mt.py) uses the same rule for words with no
Finnish: at least two independent routes must agree, and Voikko must confirm a Finnish base form. Routes: smi-mt from
Sámi; from the word's Norwegian with Helsinki-NLP opus-mt-no-fi (Apache-2.0), Wiktionary (CC BY-SA 4.0) and GiellaLT
dict-nob-fin and dict-fin-nob (Trond Trosterud and Kirsti Kuosa, UiT, CC BY); via Inari Sámi and South Sámi with
GiellaLT's dictionaries (dict-smn-fin, dict-sma-fin, CC BY 4.0); from English with opus-mt-en-fi (Apache-2.0) and
FinnWordNet (CC BY 3.0). Result: [`fin_mt.tsv`](fin_mt.tsv).

**Spanish machine translations (experimental):** [`spa_mt.py`](spa_mt.py) adds Spanish for words without it in Ángel Díaz de
Rada and Kjell Kemi's dictionary, only when at least three of six sources agree: Helsinki-NLP opus-mt-fi-es, opus-mt-no-es
and opus-mt-en-es (Apache-2.0) from the word's Finnish, Norwegian and English translations; smi-mt from Sámi; Wiktionary and
WikDict (CC BY-SA, one source); and the Spanish wordnet of the Multilingual Central Repository 3.0 (CC BY 3.0) through
FinnWordNet. The dictionary itself is not changed. Result: [`spa_mt.tsv`](spa_mt.tsv).

**German machine translations (BETA):** there is no North Sámi–German dictionary, so [`deu_mt.py`](deu_mt.py) keeps a
German word only when at least three of six independent sources agree: smi-mt from Sámi; Helsinki-NLP opus-mt-fi-de and
opus-mt-no-de (Apache-2.0) from the word's Finnish and Norwegian translations; opus-mt-en-de (CC BY 4.0) from the
dictionary's own English; FinnWordNet (CC BY 3.0) and Princeton WordNet 3.0 linked to OdeNet (CC BY-SA 4.0) through the
Collaborative Interlingual Index (CC BY 4.0); Wiktionary (CC BY-SA 4.0) counted as one source; and the bilingual dictionary
of [apertium/apertium-sme-deu](https://github.com/apertium/apertium-sme-deu) (GPL-3.0, © Flammie A Pirinen, Francis
Tyers, lynnda-hill and the Apertium contributors; about 2,400 word pairs, a German word counts only if OdeNet or
Wiktionary knows it). Álgu's German was
used only to check the result, not in the app. Result: [`deu_mt.tsv`](deu_mt.tsv).

`dict-sme-fin` is included in this repository as an unmodified copy ([dict-sme-fin/SOURCE.md](dict-sme-fin/SOURCE.md));
the others are downloaded from GiellaLT by [`hae_sanakirjat.sh`](hae_sanakirjat.sh) and are not part
of this repository.

### Changes made to the dictionary data

CC BY 4.0 requires saying what was changed. When building the app's database,
[`import_full_dict.py`](import_full_dict.py):

- merges all the dictionaries above into one database, joining translations of the same word;
- adds words that appear only in the other-language dictionaries, if the North Sámi FST recognises them;
- adds inflection tables and consonant gradation generated with the lang-sme FST (below);
- fills missing Inari, Lule and Southern Sámi translations from the Inari, Lule and Southern Sámi → North Sámi
  dictionaries, only for words that already exist and only when the word and word class point to one word;
- reads the Spanish dictionaries from their Excel source files ([`spa_data.py`](spa_data.py)), merges rows that are
  only synonyms into one meaning, keeps grammar notes (such as *IV* or *Dem, Nom, Sg*) and cross-references apart from
  the translations, and adds Spanish only to words that already exist;
- applies hand-made corrections from [`korjaukset.tsv`](korjaukset.tsv);
- replaces Norwegian letters in Finnish translations (æ → ä, ø → ö) and drops empty placeholders such as `_FIN_`.

The Skolt Sámi dictionaries are not merged into the North Sámi data. [`skolt_data.py`](skolt_data.py) keeps, for
each Finnish and Norwegian word, at most three Skolt Sámi words that the dictionaries give most strongly (same word
class, main meaning, both sources agreeing). There is no North Sámi–Skolt Sámi dictionary: the app shows Skolt Sámi
words for a Finnish or Norwegian search word, or for a North Sámi word through its Finnish translation, marked
"via Finnish". This is an experimental feature.

## Morphology — GiellaLT lang-sme, GPL-3.0

The inflection tables are generated with the North Sámi analyser and generator from
[giellalt/lang-sme](https://github.com/giellalt/lang-sme), licensed under the
[GNU General Public License v3.0](LICENSE). Authors: Linda Wiechetek, Katri Hiovain-Asikainen,
Inga Lill Sigga Mikkelsen, Sjur N. Moshagen, Flammie A Pirinen, Trond Trosterud, Børre Gaup and the
lang-sme contributors. The compiled models are in [`src/fst/`](src/fst/SOURCE.md).

## Inari Sámi in photos — GiellaLT lang-smn, GPL-3.0 (experimental)

Inari Sámi words in photos (Inari Sámi → Finnish, North Sámi or Norwegian, and North Sámi → Inari Sámi) use the
Inari Sámi dictionaries above (`dict-smn-fin`, `dict-fin-smn`, `dict-smn-sme`; Marja-Liisa Olthuis, Taarna Valtonen and
Giellatekno, CC BY) and inflected forms generated with the Inari Sámi analyser and generator from
[giellalt/lang-smn](https://github.com/giellalt/lang-smn) (GiellaLT / Giellatekno, UiT; Debian package `giella-smn`),
licensed under the [GNU General Public License v3.0](LICENSE). Compound-word start forms are checked with the Inari Sámi
speller (`giella-smn-speller`, through Voikko). [`smn_data.py`](smn_data.py) builds the tables; the analyser,
generator and speller are build tools only. Norwegian is reached through the North Sámi translation and is approximate.

Skolt Sámi in photos (Skolt Sámi → Finnish, Norwegian or North Sámi) works the same way: the Skolt dictionaries above
(`dict-sms-mul`, `dict-fin-sms`, `dict-nob-sms`) and inflected forms and compound start forms from the Skolt Sámi
analyser and generator of [giellalt/lang-sms](https://github.com/giellalt/lang-sms) (Debian package `giella-sms`, GPL-3.0),
see [`sms_data.py`](sms_data.py). North Sámi is direct for about 400 words and otherwise goes through the Finnish
translation (approximate).

North Sámi compound start forms (*geaidno-* for *geaidnu*) are checked in the same way with the North Sámi speller
(`giella-sme-speller`), see [`sme_compound.py`](sme_compound.py). Finnish compound start forms (*viranomais-*) are
checked with Voikko, see [`fin_compound.py`](fin_compound.py).

## Finnish inflection — GiellaLT lang-fin, GPL-3.0

The inflected forms of the Finnish translations (*talo – talossa – taloon*, *tehdä – teen – tekisin*)
are generated with the Finnish analyser and generator from [giellalt/lang-fin](https://github.com/giellalt/lang-fin)
(GiellaLT / Giellatekno, UiT The Arctic University of Norway; based on the Omorfi lexicon by Tommi A. Pirinen,
Inari Listenmaa, Ryan Johnson, Francis M. Tyers and others), licensed under the
[GNU General Public License v3.0](LICENSE). The compiled models come from GiellaLT's nightly
package `giella-fin` (currently `0.2.20120821+g2929~0e76a788-1~sid1`, lang-fin commit `0e76a788`) and are downloaded by
[`hae_sanakirjat.sh`](hae_sanakirjat.sh); they are not part of this repository. [`fin_forms.py`](fin_forms.py) keeps only the forms of words used as translations and drops
archaic and dialectal variants (*vaattehien*, *taloin*, *kirkko-laissa*).

The forms are checked when the database is built with [Voikko](https://voikko.puimula.org/) (libvoikko and voikko-fi,
GPL-2.0-or-later; Harri Pitkänen and the Voikko contributors, based on the Kotus word list). It runs offline. It drops
spoken and dialect variants (*haluun*, *kauns*) and corrects forms that lang-fin gets wrong (*pelastusliiveilta* →
*pelastusliiveiltä*). A change is made only when Voikko analyses the new form as the same word and the same grammatical form.
Voikko is a build tool only. None of its data is distributed with the app.

## Finnish and Norwegian word pairs — Leipzig Corpora Collection, CC BY

In the photo search's sentence view (experimental), the order of the Finnish translation options uses counts of Finnish word
pairs (*ennen joulua* rather than *ennen jouluja*). The counts come from the Finnish text corpora of the
[Leipzig Corpora Collection](https://wortschatz.uni-leipzig.de/en/download/fin) (news 2020 and 2022, Wikipedia 2021,
1 million sentences each) and its Norwegian corpora (bokmål newscrawl 2019, Norwegian Wikipedia 2021), Wortschatz Leipzig,
Universität Leipzig. Downloadable text corpora are licensed under
[CC BY](https://wortschatz.uni-leipzig.de/en/usage) (checked 2026-11-18). Changes: [`fin_ngrams.py`](fin_ngrams.py) keeps
only counts of word pairs that occur at least three times and whose words the app can produce as translations, and how
often single words occur (at least five times; used to choose compound translations). No sentences are included. The corpora are not part of this repository.
Goldhahn, D., Eckart, T. & Quasthoff, U. (2012): Building Large Monolingual Dictionaries at the Leipzig Corpora Collection:
From 100 to 200 Languages. LREC 2012.

## Open sources added 2026-11-21

Downloaded by [`hae_lahteet.sh`](hae_lahteet.sh) from the publishers' own addresses; not part of this repository.

- **Corpus frequencies:** [SIKOR North Saami lemma frequency list 2015-10-10](http://hdl.handle.net/11509/106),
  © UiT The Arctic University of Norway (Giellatekno and Divvun), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
  [`sikor_freq.py`](sikor_freq.py) fills the frequency only for words that have none; letters and abbreviations are left out.
- **Related words in other Sámi languages:** [Álgu](https://kaino.kotus.fi/algu), the Etymological Database of the Saami
  Languages (XML 16.3.2023), © Kotimaisten kielten keskus, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  [`algu_related.py`](algu_related.py) uses only the links between related words and shows a word only when it is in the
  current Inari, Skolt, Lule or South Sámi dictionary. Álgu's Finnish and German meanings are not used.
- **Sámi place names in Norway:** [Stedsnavn](https://kartkatalog.geonorge.no/metadata/30caed2f-454e-44be-b5cc-26bb5c0110ca),
  © Kartverket, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [`kartverket_names.py`](kartverket_names.py) keeps
  places with both a North Sámi and a Norwegian name (main and side names), with Lule and South Sámi names.

## Norwegian inflection — Norsk ordbank, CC BY

The inflected forms of the Norwegian translations (*hus – huset – husene*, *gjøre – gjorde – gjort*)
come from [Norsk ordbank – bokmål 2005](https://www.nb.no/sprakbanken/ressurskatalog/oai-nb-no-sbr-5/)
(dump of 2022-02-01), © Språkbanken / Nasjonalbiblioteket, licensed under
[CC BY](https://creativecommons.org/licenses/by/4.0/). It is downloaded by
[`hae_sanakirjat.sh`](hae_sanakirjat.sh) and is not part of this repository.
Changes: [`nob_forms.py`](nob_forms.py) keeps only the forms of words used as translations, and
inflects compounds missing from the word bank by their last part (*arealgrense* like *grense*).

## Consonant gradation table — Oahpa

The gradation groups and series shown in the app (`gradation.py`) follow the
[consonant gradation table of Oahpa](https://oahpa.no/sme/gramm/tabell_stadieveksling.html)
(Giellatekno, UiT).

## Pronunciation — Divvun speech synthesis

Pronunciation uses the speech synthesis of Divvun and Giellatekno (UiT The Arctic University of
Norway), voices **Biret, Máhtte and Sunná**, through the service `api-giellalt.uit.no`, in the same
way as [sátni.org](https://satni.org). The synthesis runs as a network service; the voices themselves are not included in the app.
Divvun has confirmed (2026-10-29) that the app may use the API this way.
The voice menu's sample sentence (*Bures boahtin Sápmái*, one per voice) is included in the app as small
audio files ([`web/voices/`](web/voices/), made with [`hae_aaninaytteet.sh`](hae_aaninaytteet.sh) from the
same service) so that it plays without a network connection. Divvun (UiT The Arctic University of Norway)
has given permission (2026-10-30) to keep generated samples in the app.

## Spoken word lists — Chatterbox Finnish and Divvun

The word lists' audio ([`web/audio/`](web/audio/)) says the Finnish word and then the North Sámi word (the Norwegian
interface plays the North Sámi only). The Finnish was synthesised offline with
[Chatterbox Finnish](https://huggingface.co/Finnish-NLP/Chatterbox-Finnish) (Finnish-NLP, MIT; fine-tuned from Resemble
AI's Chatterbox, MIT; its training data and attribution are listed in the model card). The voice is modelled on a
[LibriVox recording](https://archive.org/details/salmelan_heinatalkoot_1509_librivox) read by **Harri Tapani Ylilammi**
(public domain). The generated audio carries Resemble AI's inaudible Perth watermark. The North Sámi is Divvun's and
Giellatekno's speech synthesis, voices Biret and Máhtte, with Divvun's permission (see Pronunciation).

## Mini game

The mini game's everyday word list ([`minipeli_sanat.tsv`](minipeli_sanat.tsv), [`minipeli.py`](minipeli.py)) was
chosen from the dictionary by ranking words that are common both in the North Sámi corpus and in Finnish film and TV
subtitles. The ranking used [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (Hermit Dave,
OpenSubtitles 2018 frequency lists, content CC BY-SA 4.0); the lists themselves are not included. The animal words
are the same as in the Máhtte learning game. The spoken feedback for weekdays, seasons, months and question words is
Divvun's speech synthesis, voice Biret, with Divvun's permission.

The clock game and the clock times in listening practice ([`kello.py`](kello.py), `web/data/kello.json`) use the North
Sámi time expressions of GiellaLT's clock transducer in lang-sme (`transcriptor-clock-digit2text`, GPL-3.0): *beal
njeallje*, *kvárta váile njeallje*, *logi váile beal njeallje*. The question *Ollugo diibmu lea?* is from GiellaLT's
dict-spa-sme. The Finnish times are made by rules in `kello.py` and checked with Voikko. The North Sámi audio is Divvun's
speech synthesis, voice Biret, and the Finnish is Chatterbox Finnish (Harri), as above; each clip was checked with
speech recognition (Aalto wav2vec2 XLS-R North Sámi, Apache-2.0; Whisper large v3 Finnish, Apache-2.0).

## Other links

The "Neahttadigisánit" button opens the word in Giellatekno's online dictionary
[Neahttadigisánit](https://sanit.oahpa.no/) (link only): translations, analyses, word history and a search in texts
(Korp).

## Software

The apps include all copyright and licence notices and the full licence texts in
[`web/licenses/`](web/licenses/NOTICES.txt) (About → Licences). The desktop builds add Python's licence and, in the
Linux app, the Debian copyright files of the bundled system libraries.

| Component | Where | Licence |
|---|---|---|
| [sql.js](https://github.com/sql-js/sql.js) 1.10.3 (SQLite compiled to WebAssembly; one-line change: the database buffer is not copied when opened) | `web/vendor/` | MIT ([LICENSE-sql.js.txt](web/vendor/LICENSE-sql.js.txt)); SQLite itself is public domain |
| [Qt for Python / PySide6](https://doc.qt.io/qtforpython/) 6.9.3 (incl. Qt WebEngine) | desktop builds only, not in this repository | LGPL-3.0 |
| [PyInstaller](https://pyinstaller.org/) | builds the desktop apps | GPL-2.0 with bootloader exception |
| [Python](https://www.python.org/) 3.12 | desktop builds only (bundled runtime) | PSF License Agreement |
| [certifi](https://github.com/certifi/python-certifi) | desktop builds only | MPL-2.0 |
| [ICU](https://icu.unicode.org/) (inside Qt) | desktop builds only | Unicode License |
| [HFST](https://hfst.github.io/) (`hfst-lookup`) | used when building the database, not distributed | see HFST |
| [Google ML Kit Text Recognition v2](https://developers.google.com/ml-kit/vision/text-recognition/v2) 16.0.1 (bundled model) | Android app only (experimental photo search), downloaded by Gradle, not in this repository | [ML Kit Terms of Service](https://developers.google.com/ml-kit/terms); closed source, free to use. Runs on the phone: photos are not sent anywhere. ML Kit's upload of usage statistics to Google (its datatransport CCT backend) is removed from the app's manifest, so no statistics are sent |
| [AndroidX Core](https://developer.android.com/jetpack/androidx/releases/core) 1.13.1 (FileProvider) | Android app only, downloaded by Gradle | Apache-2.0 |
| [Tesseract4Android](https://github.com/adaptech-cz/Tesseract4Android) 4.9.0 with [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) 5.5.1, [Leptonica](https://github.com/DanBloomberg/leptonica) 1.85.0, libpng 1.6.48, libjpeg 9f | Android app only (photo search: second reading of Sámi words not found in the dictionary), downloaded by Gradle from JitPack (only this group), not in this repository | Tesseract4Android and Tesseract: Apache-2.0; Leptonica: BSD-2-Clause style; libpng: PNG Reference Library License v2; libjpeg: IJG licence. Full notices in `web/licenses/NOTICES.txt` |
| Sámi Tesseract model `synth_base` ([National Library of Norway](https://www.nb.no/sbfil/samisk_ocr/), Språkbanken), converted to integer format | `android/app/src/main/tessassets/tessdata/smi.traineddata` (1.7 MB), Android app only | CC BY 4.0. Cite: Enstad T, Trosterud T, Røsok MI, Beyer Y, Roald M. *Comparative analysis of optical character recognition methods for Sámi texts from the National Library of Norway.* NoDaLiDa 2025. [arXiv:2501.07300](https://arxiv.org/abs/2501.07300) |
| Libraries that ML Kit depends on (AndroidX, Kotlin standard library, Google Play services base libraries) | Android app only, downloaded by Gradle | AndroidX and Kotlin: Apache-2.0; Google Play services libraries: [Android Software Development Kit License](https://developer.android.com/studio/terms) |

## Logo

The logo is the [Sámi flag](https://en.wikipedia.org/wiki/Sámi_flag) (designed by Astrid Båhl, 1986)
drawn as a drop ([`packaging/icon/satni-icon.svg`](packaging/icon/satni-icon.svg)).

## Sátni FST

© 2026 Juha Somby. Licensed under the [GNU General Public License v3.0](LICENSE), with the additional
permission below.

### Additional permission under GNU GPL version 3 section 7

If you modify this Program, or any covered work, by linking or combining it with Google ML Kit
(including ML Kit Text Recognition and the libraries it depends on, or a modified version of them),
containing parts covered by the terms of the ML Kit Terms of Service, the licensor of this Program
grants you additional permission to convey the resulting work. Corresponding Source for a non-source
form of such a combination shall include the source code of the covered work, but need not include
the source code for the parts of Google ML Kit used.

This permission is given by Juha Somby for the parts of Sátni FST he holds the copyright to. It does
not change the licences of the third-party parts listed above. The Android app uses ML Kit only for
the experimental photo search; the desktop apps and the web version do not contain it.
