# Muutokset

Sátni FST:n kaikki versiot. Lataukset: [GitHub-julkaisut](https://github.com/sombyduodji/satni-fst/releases).
[English](CHANGELOG.md) · [Norsk](CHANGELOG.nb.md)

## 0.9.2 — 2026-11-02

- **Suomenkielinen haku löytää enemmän muotoja.** Muut yleiset pronominit (*kenelle*, *tälle*, *niille*, *jolle*) sekä
  substantiivien, adjektiivien ja numeraalien päätteet *-lla*, *-lta* ja *-ksi* (*talolla*, *pöydältä*, *taloksi*) löytävät nyt sanan.
- **Ei epävarmoja saamen muotoja.** Suomen *-lla*, *-lta*, *-lle* ja *-ksi* eivät vastaa yhtä saamen muotoa: *pöydällä* on
  *beavddi alde*, ei *beavddis*. Näille sovellus löytää sanan, mutta ei enää ehdota muotoa. Tämä korjaa version 0.9.1, joka
  näytti esimerkiksi *kolmelle ≈ golbmii*. Ihmisiä koskevat muodot säilyvät: *minulla = mus*, *kenelle = geasa*.
- **Asemasanat sanakortissa:** *päällä: beavddi alde · alla: beavddi vuolde*, 10 substantiiville, jotka on tarkistettu
  sanakirjojen esimerkeistä. Vain tarkistetut ilmaukset näytetään, koska nämä sanat eivät sovi kaikkiin substantiiveihin.
- **37 liitepartikkelillisen hakusanan perussana:** *ollugo = ollu + -go*, ja linkki sanaan *ollu*.
- **Genetiivin päämuoto ensin:** *talon ≈ viesu*, ei *vieso*. Toinen muoto löytyy edelleen haulla.
- **Hakuehdotukset:** rivi *Haetaan muotoja…* muotohaun ajaksi, suorat osumat ensin ja ehdotukset kahdesta kirjaimesta.
- **Asetukset:** astevaihtelun asetus on kytkin, ja se piilottaa myös Astevaihtelu-laatikon. Kuvahaun asetus on *Valokuvahaku*.

## 0.9.1 — 2026-11-02

- **Suomenkielinen haku löytää taivutetut persoonapronominit.** *minulle*, *minulla*, *minut*, *sinulle*, *hänelle*,
  *meille* ja muut sijamuodot löytävät sanat *mun*, *don*, *son* ja muut pronominit ja näyttävät saamen muodon:
  *minulle = minä ≈ munnje*. Myös liitepartikkelit toimivat: *minulleko* → *munnjego*. Kaikki suomen pronominimuodot
  tarkistettiin GiellaLT:n suomen analysaattorilla.
- **Pronominien muodot sanakortissa:** haku *munnje* näyttää *minulle / minuun*. Duaali merkitään numerolla 2:
  *munnuide* näyttää *meille (2) / meihin (2)*, ja norjaksi *vi (2)* sanojen *vi to* sijaan.
- **Numeraalit suomenkielisessä haussa:** *kolmelle*, *kuuden* ja *sadalle* löytävät sanat *golbma*, *guhtta* ja
  *čuođi* ja näyttävät vastaavan saamen muodon.
- **Hakuehdotuksissa on taivutusmuodot.** Hakukentän alla näkyy perusmuoto lihavoituna ja saamen muoto kursiivilla sekä
  haulla *mus* että *minulla*: **mun** *mus*. Tavalliset ehdotukset tulevat heti ja muodot lyhyen kirjoitustauon
  jälkeen, jotta kirjoittaminen ei pätki. Testattu noin 2 500 haulla.
- **Persoonapronominien taulukoissa on käännökset:** muodon *munnje* alla lukee *minulle / minuun*, ja duaali merkitään
  numerolla 2.
- **Kokeellinen: konekäännökset taivutustaulukossa.** Kun ne kytkee päälle ☰-valikon kohdasta *Kokeelliset
  ominaisuudet*, myös muiden sanojen muotojen alle tulee käännös: *mun lean – minä olen*, *moai letne – me (2) olemme*.
  Ne muodostetaan automaattisesti sanan ensimmäisestä käännöksestä, joten ne eivät ole aina oikein. Muodolle, jolle ei
  saada luotettavaa käännöstä, ei näytetä mitään.
- **Valikko:** *Tietoa* ja *Buy me a coffee* siirtyivät ☰-valikon loppuun. Historiasta näkyy 10 viimeisintä hakua ja
  *Lisää…*-painike, ja näkymä palaa kymmeneen, kun valikko avataan uudelleen. Historian tyhjennys kysyy nyt vahvistuksen,
  ja sen painike on kauempana *Lisää…*-painikkeesta.
- **Korjaukset:** *olla*-verbin potentiaali suomeksi (*lienen, en liene*) ja norjan yksikön 3. persoonan imperatiivi
  (*la ham/henne*).
- Suomen muotojen haku on nopeampi, kun painat Enteriä.

## 0.9 — 2026-10-31

Sisältää testiversiot 0.8.2-dev–0.8.5-dev.

- **Haku löytää sanat liitepartikkelien kanssa.** *boađátgo*, *viesusge*, *mungo*, *dathan* ja *sonnai* löytävät sanat
  *boahtit*, *viessu*, *mun*, *dat* ja *son*, myös kahden liitepartikkelin (*buorregohan*) tai yhdysmerkin (*dalle-ge*)
  kanssa. Sanakortti selittää liitteen: *boađátgo = boađát + -go (kysymys: -ko, -kö)*. Merkitys näytetään liitteille -go,
  -ge, -nai, -son ja -han (tarkistettu sanakirjoista ja pohjoissaamen oppikirjasta); analysaattorin muut liitteet
  (-gen, -ges, -gis, -hal, -ba, -bai, -bat, -be) tunnistetaan ilman merkitystä. Testattu 2 000 sanalla, jotka
  pohjoissaamen analysaattori tarkisti: oikea sana löytyi 1 998:lle.
- **Liitepartikkelit myös suomeksi.** Suomenkieliseen muotoriviin tulee vastaava suomen liite (*boađátgo ≈ tuletko*,
  *viesusge ≈ talossakin / talossakaan*), ja suomeksi voi hakea liitteen kanssa: *tuletko*, *talossakin* ja *teetkö*
  löytävät sanat *boahtit*, *viessu* ja *bargat* ja näyttävät saamen muodon liitteineen (*tuletko = tulla ≈ boađátgo*).
  Kieltoverbin kanssa suomen liite menee oikeaan paikkaan: *(eikö) tuleskele*, *(ei) tulekaan*. Vokaalisointu määräytyy
  sanan päätteen tai yhdyssanan viimeisen osan mukaan (*lainausmerkissäkö*). Tarkistettu molempiin suuntiin 1 000 sanalla
  sekä GiellaLT:n suomen ja pohjoissaamen analysaattoreilla.
- **Tarkoititko:** kun haku ei löydä mitään tai löytää vain paljon harvinaisemman sanan, sovellus ehdottaa samaa sanaa
  saamen kirjaimin: *boadatgo* → *boađátgo* (boahtit), *cahci* → *čáhci*, *Danmarkun* → *Dánmárkun*. Testattu 2 000
  sanalla ilman saamen kirjaimia: oikea sana löytyi 96–97 %:lle.
- **Kokeellinen: koltansaame.** Kun sen kytkee päälle ☰-valikon kohdasta *Kokeelliset ominaisuudet*, sanakortti näyttää
  koltansaamen sanoja GiellaLT:n koltansaamen sanakirjoista: suomen- tai norjankieliselle hakusanalle suoraan sanakirjasta
  (*talo* → *tääll, põrtt*) ja pohjoissaamen sanalle sen suomennoksen kautta, merkintänä "suomen kautta". Koltansaamen
  osaaja ei ole vielä tarkistanut aineistoa.
- **Valikko:** *Muut kielet* ovat kytkimiä, ja jokaisella kokeellisella ominaisuudella on oma kytkin ja lyhyt kuvaus;
  päälle kytkettäessä kerrotaan ensin, mitä se tekee. Jos kuvasta haku oli päällä, se pysyy päällä.
- **Neahttadigisánit** Giellateknon taivutussivun sijaan: painike avaa sanan Giellateknon sanakirjassa (sanit.oahpa.no),
  jossa on käännökset, sanahistoria ja haku teksteistä (Korp).
- **Korjaukset:** hakuehdotus avaa valitun sanan (*vuostá* = juusto / vastaan avasi ennen ensimmäisen); ääntäminen ei enää
  epäonnistu virheeseen "not allowed by the user agent", kun äänen haku kestää hetken; tyhjä haku ei enää näytä edellisen
  sanan rivejä.

## 0.8.1 — 2026-10-31

- **Latauskehä kuvasta haussa** (Android, kokeellinen): kuvan päällä pyörii kehä, kun tekstiä tunnistetaan ja sanoja
  haetaan, myös kun suuntaa vaihdetaan (saame ⇄ suomi tai norja) kuvan ollessa auki. Sanojen haku toiseen suuntaan voi
  kestää puhelimella muutaman sekunnin, eikä sovellus enää näytä sillä välin jumittuneelta.
- **Buy me a coffee** -linkki Tietoa-ikkunan lopussa niille, jotka haluavat tukea Sátni FST:tä.
- Kuva näkyy heti, kun sen sanoja haetaan, ja suuntapainike vaihtuu heti napautuksesta.

## 0.8 — 2026-10-31

- **Kuuntele ja kopioi mikä tahansa muoto:** taivutustaulukon tai *Kaikki muodot* -välilehden muodon napautus avaa pienen
  kuplan, jossa on 🔈 ja kopiointipainike. Kopiointi toimii Androidilla, Windowsilla, Linuxilla ja selainversiossa.
- **Uusi kuuntelupainike:** sanan vieressä oleva pyöreä 🔈-painike korvaa *Kuuntele*-painikkeen; pyörivä kehä näkyy, kun
  ääntä haetaan.
- **Siistimpi sanakortti:** astevaihtelu näkyy nimetyissä soluissa (vahva → heikko muoto, konsonantit, asteet,
  Oahpa-ryhmä), jotka eivät enää katkea keskeltä riviä; puhelimessa ne muodostavat 2 × 2 -ruudukon.
- **Linkit muille sivuille painikkeina:** Giellatekno ja sátni.org ovat nyt pyöreitä painikkeita kohdassa *Sanasta muualla*,
  omassa laatikossaan sanan oikealla puolella leveällä näytöllä ja kortin lopussa puhelimessa. ChatGPT-painike poistettiin.
- **Kuvasta haun merkinnät Saamen lipun väreissä:** punainen, keltainen, sininen tai vihreä. Keltaisilla merkinnöillä on
  tummempi reuna, jotta ne erottuvat vaaleasta paperista.
- **Lisenssit sovelluksessa:** Tietoa-ikkunan *Lisenssit*-painike näyttää kaikki tekijänoikeus- ja lisenssitiedot ja
  lisenssien kokonaiset tekstit, myös työpöytäsovellusten mukana tulevien kirjastojen osalta. Tietoa-ikkuna mainitsee nyt
  myös Oahpan ja linkittää lähdekoodiin.

## 0.7.6.1 — 2026-10-30

- **Kokeellinen, Android: hae sanoja valokuvasta.** Ota kuva tekstistä tai valitse kuva, niin sanakirjasta löytyvät sanat
  merkitään kuvaan. Sanan napautus näyttää kuplan, jossa on käännös ja 🔈-painike, ja kuplan napautus avaa sanan
  sanakirjassa; Takaisin palaa kuvaan.
  - Toimii pohjoissaamesta suomeen tai norjaan (käyttöliittymän kieli) ja takaisin, myös taivutetuilla sanoilla
    (*dagan* → *dahkat*, *talossa* → *viessu*). Puuttuvat saamen kirjaimet korjataan sanakirjan avulla (*cahci* → *čáhci*).
  - Merkintätavaksi voi valita vaalean kehyksen tai alleviivauksen kuudessa värissä.
  - Lähennys kahdella sormella tai kaksoisnapautuksella.
  - Teksti tunnistetaan puhelimessa Google ML Kitillä; kuva ei lähde laitteesta. ML Kit voi lähettää Googlelle nimettömiä
    käyttötilastoja, kun ominaisuutta käytetään.
  - Oletuksena pois päältä: kytke päälle ☰-valikon lopun kohdasta *Kokeelliset ominaisuudet*.
- **Latausanimaatio** 🔈 Kuuntele -painikkeessa, kun ääntä haetaan.
- **Lisenssi:** GPL-3.0:n kohdan 7 mukainen lisälupa sallii Android-sovelluksen sisältää Google ML Kitin
  (ks. [CREDITS.md](CREDITS.md)).
- Android-sovellus on suurempi (noin 57 Mt) tekstintunnistusmallin vuoksi. Työpöytäsovellukset ja selainversio ovat
  ennallaan versionumeroa lukuun ottamatta.

## 0.7.5 — 2026-10-30

- Haku taivutetuilla suomen- ja norjankielisillä sanoilla: *juon* löytää sanan *juhkat*, *taloon* sanan *viessu*, *husene*
  sanan *dállu*. Suomenkielisille sanoille kortti näyttää myös saamen sanan samassa muodossa.
- Ensimmäinen vakaa versio; yhteystiedot ongelmia ja palautetta varten Tietoa-ikkunassa ja README-tiedostossa.

## 0.7.4 — 2026-10-30

- Käännös seuraa haettua muotoa (*viesus* ≈ *talossa / talosta*, *dagan* ≈ *teen*).
- Parempi haku taivutetuilla sanoilla: yleiset sanat ensin, haku rajattu pohjoissaameen ja käyttöliittymän kieleen.
- Siistimpi sanakirja: päällekkäiset hakusanat yhdistetty, kielioppihuomautuksia ei enää näytetä sanoina.
- Uusi ☰-valikko kaikilla alustoilla; käännökset seuraavat käyttöliittymän kieltä; muut kielet voi kytkeä päälle.
- Ääninäytteet (Biret, Máhtte, Sunná) sovelluksessa; ensimmäinen käynnistys kysyy kielen.

## 0.7.3 — 2026-10-30

- Android: jaa sana mistä tahansa sovelluksesta suoraan Sátni FST:hen.
- Hae sanaa sátni.orgista tai kysy ChatGPT:ltä sanakortista.
- Noin 1 300 suomennosta lisää suomi–saame-sanakirjasta.

## 0.7.2 — 2026-10-29

- Korjauksia.

## 0.7.1 — 2026-10-29

- Puhelinasettelun ja vierityksen korjauksia.

## 0.7 — 2026-10-29

- Puhelinasettelun korjauksia.

## 0.6 — 2026-10-29

- Selkeämmät hakutulokset; käännökset vain valitulla kielellä.

## 0.5 — 2026-10-29

- Yhteysosoite satni@somby.fi; Android-sovelluksen julkaisuavain (päivitykset asentuvat versioiden 0.5 ja uudempien päälle).

## 0.4 — 2026-10-29

- Android-sovellus, uusi logo, GPL-3.0-lisenssi ja tekijätiedot.

## 0.3 — 2026-10-29

- Käyttöliittymä suomeksi ja norjaksi, käännökset kuudella kielellä, käänteiset sanakirjat hakuun, 80 417 sanaa.

## 0.2 — 2026-10-28

- Astevaihtelu, saamen sijataulukko, merkitykset ja esimerkit, Giellatekno-painike.

## 0.1 — 2026-10-28

- Ensimmäinen versio.
