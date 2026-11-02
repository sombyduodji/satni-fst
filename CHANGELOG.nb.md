# Endringer

Alle versjoner av Sátni FST. Nedlastinger: [GitHub-utgivelser](https://github.com/sombyduodji/satni-fst/releases).
[English](CHANGELOG.md) · [Suomi](CHANGELOG.fi.md)

## 0.9.1 — 2026-11-02

- **Finsk søk finner bøyde personlige pronomen.** *minulle*, *minulla*, *minut*, *sinulle*, *hänelle*, *meille* og de
  andre kasusformene finner *mun*, *don*, *son* og de andre pronomenene, og viser den samiske formen: *minulle = minä ≈
  munnje*. Klitika virker også: *minulleko* → *munnjego*. Alle finske pronomenformer er kontrollert med GiellaLTs finske
  analysator.
- **Pronomenformer på ordkortet:** søk på *munnje* viser *til meg*. Dualis merkes med tallet 2: *munnuide* viser
  *til oss (2)*, og *vi (2)* i stedet for *vi to*.
- **Tall i finsk søk:** *kolmelle*, *kuuden* og *sadalle* finner *golbma*, *guhtta* og *čuođi* med tilsvarende samisk form.
- **Søkeforslagene viser bøyde former.** Listen under søkefeltet viser grunnformen i fet skrift og den samiske formen i
  kursiv, både for *mus* og finsk *minulla*: **mun** *mus*. Vanlige forslag kommer med en gang, og formene etter en kort
  skrivepause, slik at skrivingen går jevnt. Testet med omtrent 2 500 søk.
- **Tabellene for personlige pronomen viser oversettelser:** *munnje* har *til meg* under seg, og dualis merkes med
  tallet 2.
- **Eksperimentelt: maskinoversettelser i bøyingstabellen.** Slå dem på under *Eksperimentelle funksjoner* i ☰-menyen, så
  får formene av andre ord også en oversettelse under seg: *mun lean – jeg er*, *moai letne – vi (2) er*. De lages
  automatisk fra ordets første oversettelse, så de er ikke alltid riktige, og en form uten pålitelig oversettelse viser
  ingenting.
- **Meny:** *Om* og *Buy me a coffee* er flyttet nederst i ☰-menyen. Historikken viser de 10 siste søkene og en
  *Flere…*-knapp, og går tilbake til 10 når menyen åpnes igjen. Tømming av historikken må nå bekreftes, og knappen står
  lenger fra *Flere…*.
- **Rettelser:** finsk potensialis av *olla* (*lienen, en liene*) og norsk imperativ i tredje person entall
  (*la ham/henne*).
- Oppslag av finske former går raskere når du trykker Enter.

## 0.9 — 2026-10-31

Inneholder testversjonene 0.8.2-dev–0.8.5-dev.

- **Søk finner ord med klitika.** *boađátgo*, *viesusge*, *mungo*, *dathan* og *sonnai* finner *boahtit*, *viessu*, *mun*,
  *dat* og *son*, også med to klitika (*buorregohan*) eller bindestrek (*dalle-ge*). Ordkortet forklarer klitikumet:
  *boađátgo = boađát + -go (spørrepartikkel)*. Betydningen vises for -go, -ge, -nai, -son og -han (kontrollert mot
  ordbøkene og en nordsamisk lærebok); de andre klitikaene analysatoren kjenner (-gen, -ges, -gis, -hal, -ba, -bai, -bat,
  -be) gjenkjennes uten betydning. Testet med 2 000 ord kontrollert av den nordsamiske analysatoren: riktig ord ble funnet
  for 1 998.
- **Klitika også på finsk.** Den finske formlinjen får det tilsvarende finske klitikumet (*boađátgo ≈ tuletko*,
  *viesusge ≈ talossakin / talossakaan*), og finsk søk med klitikum virker: *tuletko*, *talossakin* og *teetkö* finner
  *boahtit*, *viessu* og *bargat* og viser den samiske formen med klitikum (*tuletko = tulla ≈ boađátgo*). Med nektingsverb
  havner det finske klitikumet på riktig sted: *(eikö) tuleskele*, *(ei) tulekaan*. Vokalharmonien følger ordets endelse
  eller siste del av et sammensatt ord (*lainausmerkissäkö*). Kontrollert begge veier med 1 000 ord og med GiellaLTs
  analysatorer for finsk og nordsamisk.
- **«Mente du»:** når et søk ikke finner noe, eller bare et mye sjeldnere ord, foreslår appen samme ord med samiske
  bokstaver: *boadatgo* → *boađátgo* (boahtit), *cahci* → *čáhci*, *Danmarkun* → *Dánmárkun*. Testet med 2 000 ord uten
  samiske bokstaver: riktig ord ble funnet for 96–97 %.
- **Eksperimentelt: skoltesamisk.** Slå det på under *Eksperimentelle funksjoner* i ☰-menyen, så viser ordkortet
  skoltesamiske ord fra GiellaLTs skoltesamiske ordbøker: for et finsk eller norsk søkeord direkte fra ordboka
  (*talo* → *tääll, põrtt*), og for et nordsamisk ord via den finske oversettelsen, merket «via finsk». Ikke kontrollert av
  en som kan skoltesamisk ennå.
- **Meny:** *Andre språk* er brytere, og hver eksperimentelle funksjon har sin egen bryter og en kort beskrivelse; når du
  slår en på, forklares først hva den gjør. Hadde du bildesøket på, forblir det på.
- **Neahttadigisánit** i stedet for Giellateknos bøyingsside: knappen åpner ordet i Giellateknos ordbok (sanit.oahpa.no)
  med oversettelser, ordhistorie og søk i tekster (Korp).
- **Rettelser:** et søkeforslag åpner ordet du valgte (*vuostá* = ost / mot åpnet før det første); uttalen feiler ikke
  lenger med «not allowed by the user agent» når det tar litt tid å hente lyden; et tomt søk viser ikke lenger linjer fra
  forrige ord.

## 0.8.1 — 2026-10-31

- **Lastering i bildesøket** (Android, eksperimentelt): en ring snurrer over bildet mens teksten gjenkjennes og ordene slås
  opp, også når du bytter retning (samisk ⇄ finsk eller norsk) med et bilde åpent. Oppslag i den andre retningen kan ta
  noen sekunder på telefon, og appen ser ikke lenger ut til å henge i mellomtiden.
- **Buy me a coffee**-lenke nederst i Om-vinduet, for dem som vil støtte Sátni FST.
- Bildet vises med en gang mens ordene slås opp, og retningsknappen endres så snart du trykker.

## 0.8 — 2026-10-31

- **Lytt til og kopier enhver form:** trykk på en form i bøyingstabellen eller fanen *Alle former* for å åpne en liten boble
  med 🔈 og en kopieringsknapp. Kopiering virker på Android, Windows, Linux og i nettversjonen.
- **Ny lytteknapp:** en rund 🔈-knapp ved siden av ordet erstatter *Lytt*-knappen; en ring snurrer mens lyden hentes.
- **Ryddigere ordkort:** stadievekslingen vises i navngitte celler (sterk → svak form, konsonanter, stadier, Oahpa-gruppe)
  som ikke lenger brytes midt på linjen; på telefon danner de et rutenett på 2 × 2.
- **Lenker til andre sider som knapper:** Giellatekno og sátni.org er nå runde knapper under *Ordet andre steder*, i egen
  boks til høyre for ordet på brede skjermer og nederst på kortet på telefon. ChatGPT-knappen er fjernet.
- **Ordmerkene i bildesøket i fargene fra det samiske flagget:** rødt, gult, blått eller grønt. Gule merker har en mørkere
  kant, slik at de synes på lyst papir.
- **Lisenser i appen:** Om-vinduet har en *Lisenser*-knapp som viser alle opphavsretts- og lisensmerknader og de fullstendige
  lisenstekstene, også for bibliotekene i skrivebordsappene. Om-vinduet nevner nå også Oahpa og lenker til kildekoden.

## 0.7.6.1 — 2026-10-30

- **Eksperimentelt, Android: slå opp ord fra et bilde.** Ta et bilde av tekst eller velg et bilde, så merkes ordene fra
  ordboka i bildet. Trykk på et ord for å se en boble med oversettelse og 🔈-knapp, og trykk på boblen for å åpne ordet i
  ordboka; Tilbake går tilbake til bildet.
  - Virker fra nordsamisk til finsk eller norsk (språket i brukergrensesnittet) og tilbake, også med bøyde ord
    (*dagan* → *dahkat*, *talossa* → *viessu*). Manglende samiske tegn rettes med ordboka (*cahci* → *čáhci*).
  - Velg hvordan ord merkes: en lys ramme eller understreking, i en av seks farger.
  - Zoom med to fingre eller dobbelttrykk.
  - Teksten gjenkjennes på telefonen med Google ML Kit; bildet forlater aldri enheten. ML Kit kan sende anonym
    bruksstatistikk til Google når funksjonen brukes.
  - Av som standard: slå på under *Eksperimentelle funksjoner* nederst i ☰-menyen.
- **Lasteanimasjon** på 🔈 Lytt-knappen mens lyden hentes.
- **Lisens:** en tilleggstillatelse etter GPL-3.0 punkt 7 gjør at Android-appen kan inneholde Google ML Kit
  (se [CREDITS.md](CREDITS.md)).
- Android-appen er større (omtrent 57 MB) på grunn av tekstgjenkjenningsmodellen. Skrivebordsappene og nettversjonen er
  uendret bortsett fra versjonsnummeret.

## 0.7.5 — 2026-10-30

- Søk med bøyde finske og norske ord: *juon* finner *juhkat*, *taloon* finner *viessu*, *husene* finner *dállu*. For finske
  ord viser kortet også det samiske ordet i samme form.
- Første stabile versjon; kontakt for problemer og tilbakemeldinger i Om-vinduet og README.

## 0.7.4 — 2026-10-30

- Oversettelsen følger den søkte formen (*viesus* ≈ *i huset / fra huset*, *dagan* ≈ *jeg gjør*).
- Bedre søk med bøyde ord: vanlige ord først, søket begrenset til nordsamisk og språket i brukergrensesnittet.
- Ryddigere ordbok: doble oppslag slått sammen, grammatikkmerknader vises ikke lenger som ord.
- Ny ☰-meny på alle plattformer; oversettelsene følger språket i brukergrensesnittet; andre språk kan slås på.
- Stemmeprøver (Biret, Máhtte, Sunná) i appen; første oppstart spør om språk.

## 0.7.3 — 2026-10-30

- Android: del et ord fra hvilken som helst app direkte til Sátni FST.
- Søk etter ordet på sátni.org eller spør ChatGPT fra ordkortet.
- Omtrent 1 300 flere finske oversettelser fra den finsk–samiske ordboka.

## 0.7.2 — 2026-10-29

- Rettelser.

## 0.7.1 — 2026-10-29

- Rettelser av telefonoppsett og rulling.

## 0.7 — 2026-10-29

- Rettelser av telefonoppsett.

## 0.6 — 2026-10-29

- Tydeligere søkeresultater; oversettelser bare på valgt språk.

## 0.5 — 2026-10-29

- Kontaktadresse satni@somby.fi; signeringsnøkkel for Android-utgivelser (oppdateringer installeres over 0.5 og nyere).

## 0.4 — 2026-10-29

- Android-app, ny logo, GPL-3.0-lisens og krediteringer.

## 0.3 — 2026-10-29

- Brukergrensesnitt på finsk og norsk, oversettelser på seks språk, omvendte ordbøker for søk, 80 417 ord.

## 0.2 — 2026-10-28

- Stadieveksling, samisk kasustabell, betydninger og eksempler, Giellatekno-knapp.

## 0.1 — 2026-10-28

- Første versjon.
