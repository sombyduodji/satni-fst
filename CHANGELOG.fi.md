# Muutokset

Sátni FST:n kaikki versiot. Lataukset: [GitHub-julkaisut](https://github.com/sombyduodji/satni-fst/releases).
[English](CHANGELOG.md) · [Norsk](CHANGELOG.nb.md)

## 1.1.0 — 2026-11-26

Paljon vähemmän muistia ja nopeampi käynnistys Androidilla, englanninkielinen käyttöliittymä, uudistettu sanakortti sekä uusia sanastoja ja pelejä.

- **Paljon vähemmän muistia, nopeampi käynnistys (Android).** Sanakirja luetaan nyt puhelimen omalla SQLite-tietokantamoottorilla sen sijaan, että se ladattaisiin sovelluksen muistiin. Sovellus käyttää noin 70–80 Mt noin 400 Mt:n sijaan, on hakuvalmis 0,4–0,8 sekunnissa (ennen 1,2–3,3 s), ja jokerihaut ovat jopa neljä kertaa nopeampia. Ensimmäinen käynnistys päivityksen jälkeen kopioi sanakirjan puhelimen tallennustilaan (noin 165 Mt, alle sekunti); jos se ei onnistu, esimerkiksi tila on täynnä, sovellus toimii vanhalla tavalla. 330 testihakua antoi molemmilla moottoreilla täsmälleen samat tulokset.
- **Englanninkielinen käyttöliittymä.** Sovellusta, sanastoja ja peliä voi käyttää suomen ja norjan lisäksi englanniksi (valinta valikosta). Haku toimii englannin sanoilla ja niiden taivutusmuodoilla (*dogs*, *went*).
- **Uudistettu sanakortti.**
  - Pääsanamuodot sanan alla kuten painetuissa sanakirjoissa: *áhčči, áhči*; *vielgat, vielgada, attr. vilges*; *dahkat, dagan*. Astevaihtelussa vaihtuvat konsonantit on väritetty, ja linkki vie koko selitykseen.
  - Käännös omassa laatikossaan. Taivutetusta muodosta kerrotaan myös kielioppi selkokielellä (*manai ≈ meni, kulki · preteriti, yks. 3. persoona*).
  - Kuuntele, suosikki ja ilmoita virheestä ovat kuvakkeina vierekkäin; muut merkitykset ja muut kielet ovat siistimmin; muut hakutulokset tiivistyvät yhdelle riville; tyhjät välilehdet piilotetaan; puhelimessa verbin aikamuodot näkyvät allekkain.
- **Sanaperhe.** Uusi välilehti näyttää sanasta johdetut sanat ja yhdyssanat, joissa se on, kun GiellaLT:n jäsennin yhdistää ne ja molemmat sanat ovat sanakirjassa.
- **Opas.** Hakurivin lopussa oleva **?** selittää sanakortin osat yksi kerrallaan; myös mitä tahansa kortin osaa voi napauttaa.
- **Fiksumpi haku taivutetuilla sanoilla.** Esimerkiksi *lohkamin* tai *guliid* näyttää nyt ensin sanan, johon muoto kuuluu (*lohkat*, *guolli*).
- **Ei umpikujia.** Jos sanalla ei ole käännöstä valitulla kielellä, kortti näyttää käännöksen toisella kielellä (merkittynä) tai johdoksen kantasanan sekä linkin puuttuvan käännöksen ilmoittamiseen. *Ei tuloksia* -näkymässä on *Ilmoita puuttuvasta sanasta*.
- **Kellonajat.** Peli analogisella kellolla (*Ollugo diibmu lea?*): valitse tai kirjoita aika, tai kuuntele Biretiä ja valitse oikea kello; tasatunnit, puolet ja vartit tai viiden minuutin välein. *Vuorokausi → Kellonajat* näyttää kaikki ajat kelloina. Saamessa minuutit 20–40 lasketaan puolesta tunnista (*logi badjel beal vihtta* = 4.40), ja suomennos tekee nyt samoin. Ajanilmaukset ovat GiellaLT:n kellogeneraattorista.
- **Uusia sanastoja.** *Eläimet*; *Marjat, hedelmät ja kasvikset*; *Lähellä ja kaukana* (*dát* lähellä minua, *diet* lähellä sinua, *duot* tuolla, *dot* kauempana sekä niiden missä- ja mihin-sanat) omalla pelillään; sekä apusanat: *Tämä ja se*, *Täällä ja tuolla*, *Ennen ja jälkeen* ja *Sidesanat ja pikkusanat* esimerkkilauseineen. *Vuorokaudessa* on kahdeksan sanaa lisää, ja kysymyssanat, pronominit ja demonstratiivit näyttävät useampia sijamuotoja (*gii · gean · geasa · geas*, *muinna*). Sanastoissa, joilla on peli, on *Pelaa*-painike.
- **Parempi ääni.** Kaikki sanojen äänet tehtiin uudelleen, jotta lyhyistä sanoista ei katoa äänteitä, ja jokainen neljän äänen tallenne kuunneltiin korvakuulolta; 145 sanaa käyttää nyt parempaa tallennetta.
- **Valokuvahaku: valitse sanat itse** suoraan maalaamalla tai ympyröimällä, *Poimi lause* -painikkeen vieressä.
- **Kokeelliset käännöskielet** (oletuksena pois, *Asetukset → Käännöskielet*): konekäännetty englanti noin 17 000 sanalle lisää, espanja noin 6 300:lle ja saksa noin 5 750:lle (avointa pohjoissaame–saksa-sanakirjaa ei ole) sekä suomennosehdotukset noin 2 200 sanalle, joilla suomennosta ei ole. Käännös näytetään vain, kun useampi riippumaton lähde on samaa mieltä, ja se merkitään konekäännökseksi lähteiden määrän kanssa. Myös koltansaamen sanoilla voi hakea (*põrtt*, myös ilman erikoismerkkejä).
- **Inarinsaame:** lisää varmoja sanoja; epävarmat poistettiin. *Pelaa* näkyy vain sanastoissa, joiden pelissä on inarinsaamen sanoja.
- **Korjauksia:** jos Android jäädytti sovelluksen sanakirjan latautuessa, se saattoi jäädä tilaan "Ladataan sanakirjaa…" – lataus käynnistyy nyt itsestään uudelleen; virheilmoitus puhelimessa, jossa ei ole sähköpostisovellusta, tarjoaa viestin kopiointia; Takaisin sanastosta palaa korttiin, josta lähdit; tumman tilan vaihto ei enää lataa sovellusta uudelleen; ilmoitus vanhentuneesta järjestelmän WebViewistä näkyy puhelimen kielellä; kokeellinen lauseenrakentaja käsittelee paremmin monikko- ja duaalisubjektit, partisiipit ja passiivin kiellon.

## 1.0.0 — 2026-11-21

Ensimmäinen täysi versio. Sanakirjan lisäksi sovelluksessa on nyt sanastot ääntämyksineen, kuunteluharjoitus, sanapeli ja paljon parempi valokuvahaku.

- **Uusi ilme puhelimessa.** Alapalkissa Haku, Sanastot, Peli ja Lisää; käyttöön otetut työkalut (Kuva, Lause) saavat sinne omat painikkeensa. Asetukset on jaettu sivuiksi: Ulkoasu, Sanakortti, Käännöskielet, Historia, Työkalut ja Kokeelliset.
- **Sanastot.** Aihekohtaiset sanalistat Biretin, Máhtten ja Sunnán ääntäminä: luvut ja järjestysluvut, viikonpäivät, kuukaudet ja vuodenajat, suku, värit, kysymyssanat, porot, sää ja muuta. Napauta sanaa: kuuntele, kopioi tai avaa sanakortti. Tervehdykset voi kuunnella keskusteluna.
- **Kuunteluharjoitus.** Harri sanoo sanan suomeksi, saat hetken miettimisaikaa, ja saamenkielinen vastaus kuuluu ja näkyy. Valitse aiheet, lukualueet, suunta, miettimisaika ja ääni; harjoitus jatkuu näytön sammuttua, ja sen voi pysäyttää ilmoituksesta.
- **Sanapeli.** Valitse oikea käännös neljästä tai kirjoita sana saameksi (vihje maksaa pisteen, samoin puuttuvat erikoiskirjaimet). Aloittelija- ja edistynyt-taso sekä lyhyitä aihepelejä (järjestysluvut, ajat, värit, kysymyssanat, eläimet); aika- ja kysymyspeleissä Biret sanoo oikean vastauksen. Parhaat tulokset palkintokorokkeella. Tuplanapautus ei vastaa kahdesti eikä ohita tulosta.
- **Valokuvahaku** (Android, kytke päälle kohdasta *Työkalut*). Kuva koko näytöllä ja sanat merkittyinä; napauta sanaa, niin näet käännöksen oikeassa muodossa (*beavddis* = pöydässä). *Poimi lause* kääntää koko lauseen sana sanalta lauseyhteyden mukaan, ja *Valitse sanat itse* -toiminnolla voit maalata tai ympyröidä sanat sormella. Sivuttain oleva kuva käännetään itsestään. Kuvan voi lukea myös suomen- tai norjankielisenä tekstinä ja kääntää saameksi.
- **Parempi kuvan luku.** Väärin luetut sanat korjautuvat useammin: puuttuvat erikoiskirjaimet, yhdeksi luettu kaksoiskirjain, *I*/*l*-sekaannukset ja rivin lopussa katkenneet sanat. Tuntemattomat saamen sanat luetaan toiseen kertaan Norjan kansalliskirjaston saamen tekstintunnistusmallilla puhelimessa. Yhdyssana jaetaan osiin, jos koko sanaa ei ole sanakirjassa.
- **Inarin- ja koltansaame kuvissa** (kokeellinen, oletuksena pois). Sovellus tunnistaa kielen itse ja kääntää inarin tai koltan sanakirjojen kautta.
- **Inarinsaame pelissä ja sanastoissa** (kokeellinen, *Työkalut*).
- **Lausekääntäjä** (kokeellinen). Lyhyt suomenkielinen lause pohjoissaameksi sanakirjan sanoista ja muodoista; napauttamalla voi vaihtaa sanan tulkinnan tai muodon.
- **Sukulaissanat muissa saamen kielissä.** Sanakortti näyttää saman sanan inarin-, koltan-, luulajan- ja eteläsaamessa, kun saamelaiskielten etymologinen tietokanta Álgu yhdistää ne (*boazu*: puásui, puäʒʒ, boatsoj, bovtse). Noin 13 000 sanaa.
- **Paikannimet.** Norjan saamenkieliset paikannimet norjankielisine niminen (*Guovdageaidnu* – Kautokeino) Kartverketiltä ja suomenkieliset nimet noin 400 paikalle, kuten Utsjoki ja Ivalo.
- **Parempi suomi.** Noin 145 väärää tai harhaanjohtavaa suomennosta korjattu riippumattomia lähteitä vasten tarkistettuina, esimerkiksi *ektui* (suhteen, verrattuna), *gáhttet* (suojella) ja *hárjeheaddji* (valmentaja). Noin 1 300 yhdyssanaa, joilta suomennos puuttui, sai tarkistetun suomennoksen, ja *-vuohta*-loppuiset sanat saavat *-uus/-yys*-ehdotuksen (*mánnávuohta* ≈ lapsuus).
- **Jokerihaku.** `?` on yksi kirjain ja `*` mitä tahansa kirjaimia: `á?bmogis`, `bo*`. Jokerimerkillä alkava haku tarvitsee kolme kirjainta.
- **Nopeampi haku.** Haku on 20–40 kertaa nopeampi, ja sanakirja on pienempi ladata.
- **Ilmoita virheestä kaikkialta.** Sanakortti, taivutusmuodot, sanastot, peli, valokuvahaku ja lausenäkymät: virheilmoitus valmistelee sähköpostin.
- **Tallennetut ääntämiset.** Kuunnellut sanat säilyvät laitteella käytettäviksi ilman verkkoa; enimmäiskoon voi valita ja ne voi tyhjentää kohdassa *Sanakortti*.
- **Astevaihtelun värit.** Valitse vahvan ja heikon asteen värit tai alleviivaus, myös värisokeille sopiva valmis vaihtoehto.
- **Koltansaamen käännökset** (tarkistamaton, oletuksena pois) suomennosten kautta, varoituksen kanssa.
- **Tietosuoja.** Sovellus ei lähetä käyttötilastoja; Googlen ML Kitin tilastot on poistettu käytöstä. Kuva ei koskaan lähde puhelimesta. Verkkoa käytetään vain Divvunin ääntämispalveluun, kun painat kaiutinta.
- **Saavutettavuus ja korjaukset.** Parempi kontrasti, näppäimistökäyttö ja ruudunlukijan nimet; Takaisin ja Esc sulkevat yhden kerroksen kerrallaan; liian vanha Androidin WebView näyttää selvän ilmoituksen ikuisen latauksen sijaan; puhelimen fonttikoon muutos ei enää lataa sovellusta uudelleen.
- **Taivutusluokka.** Sanakortti näyttää substantiivin ja verbin luokan (I parillistavuinen, II paritontavuinen, III supistuma), kun lähde ja sanan muodot ovat samaa mieltä. Substantiiveille näytetään myös asteet. Muille sanoille luokkaa ei arvata.
- **Itä ja länsi.** Alueittain vaihtelevat sanat ja käännökset on merkitty (it) ja (lä). Saman sanan kaksi kirjoitusasua, kuten *girku* ja *kirku*, ovat samalla kortilla, jonka löytää kummallakin. Eri sanoista, kuten *gánda* ja *lunta*, on linkki toiseen.
- **Haku.** Aluemerkityt käännökset, kuten *patja*, löytyvät nyt.
- **Ääntäminen.** Uusi napautus pysäyttää soivan äänen ja peruu kesken olevan haun, joten äänet eivät enää soi päällekkäin tai peräkkäin.
- **Lisää saamenkielten käännöksiä.** Noin 40 sanaa saa puuttuvan inarin-, luulajan- tai eteläsaamen käännöksen GiellaLT:n inarin-, luulajan- ja eteläsaamen ja pohjoissaamen sanakirjoista.
- **Suomennosehdotukset (kokeellinen).** Sanalle, jolla ei ole suomennosta, sanakortti voi näyttää inarinsaamen tai norjan kautta muodostetun ehdotuksen, joka on merkitty tarkistamattomaksi. Ehdotus on noin 2 150 sanalla. Kytke päälle kohdasta *Kokeelliset ominaisuudet*.
- **Espanja.** Espanjankieliset käännökset noin 7 600 sanalle, myös noin kahdelle kolmasosalle yleisimmistä, merkityksineen ja esimerkkilauseineen GiellaLT:n espanjan sanakirjoista, jotka on tehnyt Ángel. Kytke päälle kohdasta *Muut kielet*.
- **Haku muilla kielillä.** Muut kielet -asetuksessa valituilla kielillä voi myös hakea, pohjoissaamen ja suomen osumien jälkeen: *perro* löytää sanan *beana*. Tuloslista kertoo, millä kielellä sana löytyi. Vain perusmuodot löytyvät.
- **Haku löytää käännökset, joissa on tarkenne sulkeissa.** *naida* löytää nyt sanat, joiden käännös on "naida (kerran)", ja *immoral* käännöksen "immoral (of women)": noin 3 400 sanaa, jotka löytyivät aiemmin vain kirjoittamalla tarkennekin.
- **"Tarkoititko" hakukentässä ja muilla kielillä.** Hakukenttä ehdottaa jo kirjoittaessa sanaa, josta puuttuvat erikoiskirjaimet on lisätty (*cahci* → *čáhci*), myös Muut kielet -asetuksessa valituilla kielillä (*arbol* → *árbol*, *tjielte* → *tjïelte*). Ehdotus vain lisää kirjaimia eikä vaihda niitä.
- **Lisää englantia.** Noin 3 100 sanaa saa englannin käännöksen Wiktionarysta, ja noin 1 800 sanalle näytetään tarkistamaton englannin ehdotus. Englanninkielinen haku ei välitä alun sanoista *to* ja *a* (*read* löytää "to read").
- **Taivutustaulukon suomennokset korjattu.** Saamen muodon vieressä oleva suomennos on nyt yleiskieltä: *haluan* eikä *haluun*, *kauniista* eikä *kaunista*, *kiipijöihin* eikä *kiipijiin*, *pelastusliiveiltä* eikä *pelastusliiveilta*. Noin 1 900 sanaa muuttui. Jokainen suomen muoto on tarkistettu Voikko-oikolukimella ja GiellaLT:n analysaattorilla. Jos oikeaa muotoa ei voitu varmistaa, solussa ei näytetä suomennosta väärän sijaan.
- **Tyylimerkinnät.** Alatyyliset, halventavat ja loukkaavat käännökset on merkitty sanakorttiin, merkityksiin ja tuloslistaan, esimerkiksi *perse* (alatyylinen), *muija* (halventava) ja *tater* (loukkaava). Merkinnät tulevat Wiktionaryn omista merkinnöistä, ja ne on käyty käsin läpi: merkittyjä käännössanoja on 37.
- **Siistimpi englanti.** Noin 1 100 englannin "käännöstä", jotka olivat oikeasti Konrad Nielsenin sanakirjan kielioppimerkintöjä ("continuative of njuol’got", "caus. of rok’čit"), vanhalla kirjoitusasulla kirjoitettuja saamen sanoja tai saksaa saame–saksa-alkuteoksesta ("den Schlucken haben"), on poistettu, ja noin 370 käännöksestä on poistettu tällainen merkintä niin, että englanti säilyy ("middlemost (= gâs’kâlâmŏs)" → "middlemost"). Wiktionaryn loukkaavaksi merkitsemää englantia käytetään vain, jos saamen sanakin on merkitty sellaiseksi, ja silloin merkinnän kanssa.
- **Kirjoitusvirheitä korjattu.** Noin 60 suomennosten kirjoitusvirhettä ja vanhentunutta kirjoitusasua on korjattu, esimerkiksi *kaivosyitys* → *kaivosyritys*, *taitelija* → *taiteilija* ja *tietokonenohjelma* → *tietokoneohjelma*; jokainen on varmistettu kahdella oikolukimella ja käsin. Espanjan kirjoitusvirheet kuten *latimarse* → *lastimarse* ja *reluctacia* → *reluctancia* on korjattu, ja lähdesanakirjoihin jääneet työmerkinnät ("XXX") on poistettu.

## 0.9.3 — 2026-11-03

- **Astevaihtelu korjattu.** Vahva ja heikko aste olivat väärin päin noin 340 sanalla, joukossa yleisiä sanoja kuten *dilli*, *gilli*, *sivva*, *nisu* ja *biras*. Sanakortti ja taivutustaulukon värit ovat nyt oikein. Myös ryhmän nimi korjattiin noin 450 sanalta, esimerkiksi *listu*.
- **Selkeämpi asterivi.** Kun asteet III ja II kirjoitetaan samoin, rivi merkitsee nyt asteen, jota sana todella käyttää: *mannat* näyttää *nn* II, ja kontrahoituvat sanat kuten *suolu* näyttävät *ll* III.
- **Lisää merkittyjä muotoja.** Joidenkin verbien asteen III muodot, kuten *viehkki* verbistä *viehkat*, on nyt merkitty vahvaksi asteeksi.
- **Kokeellinen: Apertium-käännökset.** Uusi kytkin, oletuksena pois päältä, näyttää norjan käännöksen noin 4 600 sanalle, joilla sitä ei ole sanakirjoissa. Käännökset ovat apertium-sme-nob-konekääntimen sanastosta, ne on merkitty tarkistamattomiksi eivätkä ne vaikuta hakuun.
- **Valikon löytäminen.** Kertavihje ☰-painikkeella kertoo, että kieli ja asetukset löytyvät valikosta, ja aloitussivulla on uusi Valikko-rivi.
- **Hakuehdotukset.** Lista näkyy nyt myös, kun kirjoitettu sana on ainoa osuma, joten ei enää näytä siltä, ettei mitään löytynyt ennen Enteriä.
- **Selainversio.** Asennettu selainversio lataa päivitetyn sanakirjan kerran, noin 45 Mt.

## 0.9.2.3 — 2026-11-03

- **Astevaihtelulaatikot puhelimessa.** Sanat eivät enää mene laatikon yli kapealla näytöllä. Tämä korjaa version 0.9.2.2. Sanaparilla
  ja astevaihteluryhmällä on nyt omat rivinsä.

## 0.9.2.2 — 2026-11-03

Pieni päivitys: siistimpi valikko ja tarkemmat lisenssitiedot.

- **Siistimpi valikko.** Ylimpänä ovat sovelluksen nimi ja tekijä, sitten suosikit ja historia. Asetukset, muut kielet
  ja kokeelliset ominaisuudet ovat yhdessä Asetukset-osiossa, joka avataan tarvittaessa.
- **Logo vie alkuun.** Logo ja sovelluksen nimi vievät takaisin aloitussivulle.
- **Selkeämpi Tietoa-ikkuna.** Ensin kerrotaan tekijä, kielidata ja palaute; lähteet, lisenssit ja tietosuoja ovat
  avattavassa osiossa.
- **Uudet palaute- ja tukikkunat.** Palauteikkunassa osoitteen voi kopioida, ja siinä on sähköposti- ja GitHub-linkit.
  *Osallistu ja tue* kertoo, miten voi auttaa: esimerkiksi käännösten korjaukset, ideat ja saavutettavuus.
- **Nimike vaihtui.** Sanakortin *Oahpa-ryhmä* on nyt *Astevaihteluryhmä*. Oahpa mainitaan edelleen taulukon lähteenä.
- **Lisenssitiedot.** Google ML Kitin lisäluvassa sanotaan nyt, että lähdekoodiin kuuluu kattava teos mutta ei ML Kitin
  omaa lähdekoodia. Pohjoissaamen kielimallit rakennetaan nyt kirjatuista GiellaLT-commiteista skriptillä `rakenna_fst.sh`.
- **Sanakirja rakennettu uudelleen näillä malleilla.** Sanat, käännökset ja esimerkit eivät muuttuneet. Yksi sana muuttui:
  *unnajuovllat* ei enää näytä astevaihtelua eikä muotoa *unajuovllat*.

## 0.9.2.1 — 2026-11-02

Pieni korjauspäivitys.

- **Duaalipronominit:** *moai*, *doai* ja *soai* ovat nyt *me (2)*, *te (2)* ja *he (2)*.
- **Tarkistetut suomennokset:** *nubbi*, *galle*, *ihtin*, *eisseváldi*, *earenomáš*, *maiddai*, *máid* ja *ovtta oaivilis*.
- **Kokeellinen koltansaame:** yleiset sanat tulevat ensin, kun sanoilla on sama pistemäärä.

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
