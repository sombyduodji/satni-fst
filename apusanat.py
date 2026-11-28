"""Apusanat (käyttäjä 2026-11-22): neljä sanastolistaa usein käytetyistä lauseen apusanoista.

Luonnos ja perustelut: muistiinpanot/apusanat-ehdotus-2026-11-22.md. Sanat ja merkitykset sanakirjasta (GiellaLT dict-sme-fin,
dict-sme-nob); dat- ja dát-muodot GiellaLT lang-sme -generaattorilla. Esimerkkilauseet ovat sanakirjojen omia
esimerkkejä (dict-sme-nob, dict-sme-fin, dict-sme-spa); käännöksen lähde kentässä src:
  "nob", "fin", "spa" = sanakirjan oma käännös; "own" = kirjoitettu sanakirjan käännöksen pohjalta (Claude 2026-11-22,
  suomi Voikko-tarkistettu), tarkistettavana käyttäjällä.
Sanoille, joilla sanakirjassa ei ole sopivaa esimerkkiä, ei keksitä esimerkkiä.

Rivi: (saame, sanaluokka, muodot tai None, suomi, norja, englanti, esimerkki tai None)
Esimerkki: (saame, suomi, norja, englanti, lähteet {"fi": .., "nb": ..})
"""

N, F, S, O = "nob", "fin", "spa", "own"

LISTS = [
    {"id": "tamajase", "icon": "pointer", "group": "perus",
     "title": ("Tämä ja se", "Dette og det", "This and that"),
     "hint": ("dát = tämä (lähellä minua) · diet = se (lähellä sinua) · dat = se · duot = tuo · dot = tuo (kauempana)",
              "dát = denne (nær meg) · diet = den (nær deg) · dat = den · duot = den der borte · dot = den lengst borte",
              "dát = this (near me) · diet = that (near you) · dat = it, that · duot = that over there · dot = that one further away"),
     "sections": [
         (("Tämä ja se", "Denne og den", "This and that"), [
             # Komitatiivi ja monikko (käyttäjä 2026-11-23; lang-sme-generaattori: dát+Pron+Dem+Sg+Com = dáinna,
             # Pl+Gen dáid, Pl+Ill dáidda, Pl+Loc dáin, Pl+Com dáiguin; dat samoin). Monikkorivin avain "dát (pl.)"
             # (sanastot.py: r["key"]), ensimmäinen muoto dát kuten yksikössä.
             ("dát", "Pron", ["dát", "dán", "dása", "dás", "dáinna"], "tämä · tämän · tähän · tässä, tästä · tämän kanssa, tällä",
              "denne · dennes · hit, til denne · her, av denne · med denne", "this · of this · to this · here, of this · with this",
              ("Dovddat go dán bártni?", "Tunnetko tämän pojan?", "Kjenner du denne gutten?", "Do you know this boy?", {"fi": O, "nb": N})),
             ("dát (pl.)", "Pron", ["dát", "dáid", "dáidda", "dáin", "dáiguin"], "nämä · näiden · näihin · näissä, näistä · näiden kanssa, näillä",
              "disse · disses · til disse · i disse, av disse · med disse", "these · of these · to these · in these, of these · with these",
              ("Dáid beivviid lea leamaš hui balvái.", "Viime päivinä on ollut hyvin pilvistä.", "De siste dagene har det vært veldig overskyet.",
               "It has been very cloudy these last few days.", {"fi": F, "nb": O})),
             ("dat", "Pron", ["dat", "dan", "dasa", "das", "dainna"], "se · sen · siihen · siinä, siitä · sen kanssa, sillä",
              "den, det · dens · til det · i det, av det · med det", "it, that · its · to it · in it, of it · with it",
              ("Dat ii geasut mu.", "Se ei houkuttele minua.", "Det frister meg ikke.", "That doesn't tempt me.", {"fi": O, "nb": O})),
             # Esimerkki dict-sme-spa:sta (daiguin: "Siempre trabajamos con esos renos."), suomi ja norja sen pohjalta
             ("dat (pl.)", "Pron", ["dat", "daid", "daidda", "dain", "daiguin"], "ne · niiden · niihin · niissä, niistä · niiden kanssa, niillä",
              "de · deres · til dem · i dem, av dem · med dem", "they, those · their · to them · in them, of them · with them",
              ("Mii bargat álo daiguin bohccuiguin.", "Me teemme aina töitä niiden porojen kanssa.", "Vi arbeider alltid med de reinene.",
               "We always work with those reindeer.", {"fi": O, "nb": O})),
             ("diet", "Pron", None, "se (lähellä sinua)", "den (nær deg)", "that (near you)",
              ("Mii diet lea?", "Mikä se on?", "Hva er det der?", "What's that?", {"fi": O, "nb": N})),
             ("duot", "Pron", None, "tuo", "den der borte", "that over there",
              ("Mii duot lea?", "Mikä tuo on?", "Hva er det der?", "What's that over there?", {"fi": O, "nb": N})),
             # dot (käyttäjä 2026-11-25): sanakirja dot = tuo / "det lengst borte" / "that one far over there"
             ("dot", "Pron", None, "tuo (kauempana)", "den lengst borte", "that one further away", None)]),
         (("Tällainen ja sellainen", "Slik og sånn", "Like this and like that"), [
             ("dákkár", "Pron", None, "tällainen", "sånn her", "like this, such",
              ("Biret lea dákkár.", "Biret on tällainen.", "Biret er sånn.", "Biret is like this.", {"fi": O, "nb": N})),
             ("dakkár", "Pron", None, "sellainen", "slik", "like that, such",
              ("Váldde dakkára go áiggut.", "Ota sellainen kuin haluat.", "Ta en slik som du vil ha.", "Take one like you want.", {"fi": O, "nb": N}))])]},

    # Lähellä ja kaukana (käyttäjä 2026-11-25): neljä etäisyyttä taulukkona kuten opetusmateriaalissa. Sarakkeet: mikä
    # (nominatiivi ja genetiivi), missä (-ppe), mihin (-hko/-ike). Muodot GiellaLT lang-sme -analysaattorilla
    # (dien, duon, don = Sg+Gen/Acc), merkitykset sanakirjasta (dict-sme-fin/-nob/-eng). Etäisyyksien järjestys sanakirjasta:
    # dot "det lengst borte", doppe "far away over there" (do- kauimpana), duot "det der borte" (duo- tuolla).
    # layout "dist": sanastot.js piirtää taulukon; rivin paikka osiosta (etäisyys) ja sanan järjestyksestä osiossa (sarake).
    {"id": "lahellajakaukana", "icon": "pointer", "group": "perus", "layout": "dist",
     "title": ("Lähellä ja kaukana", "Nær og fjern", "Near and far"),
     "cols": (["Mikä?", "Missä?", "Mihin?"], ["Hva?", "Hvor?", "Hvor hen?"], ["What?", "Where?", "Where to?"]),
     "hint": ("dá- = lähellä minua · die- = lähellä sinua · duo- = tuolla · do- = kauempana",
              "dá- = nær meg · die- = nær deg · duo- = der borte · do- = lenger borte",
              "dá- = near me · die- = near you · duo- = over there · do- = further away"),
     "sections": [
         (("Lähellä minua", "Nær meg", "Near me"), [
             ("dát", "Pron", ["dát", "dán"], "tämä · tämän", "denne · dennes", "this · of this", None),
             ("dáppe", "Adv", None, "täällä", "her", "here", None),
             ("deike", "Adv", None, "tänne", "hit", "(to) here", None)]),
         (("Lähellä sinua", "Nær deg", "Near you"), [
             ("diet", "Pron", ["diet", "dien"], "se (luonasi) · sen", "den (hos deg) · dens", "that (near you) · of that", None),
             ("dieppe", "Adv", None, "siellä (luonasi)", "der (hos deg)", "there (where you are)", None),
             ("diehko", "Adv", None, "sinne (luoksesi)", "dit (til deg)", "(to) there, to you", None)]),
         (("Tuolla", "Der borte", "Over there"), [
             ("duot", "Pron", ["duot", "duon"], "tuo · tuon", "den der borte · dens", "that over there · of that", None),
             ("duoppe", "Adv", None, "tuolla", "der borte", "over there", None),
             ("duohko", "Adv", None, "tuonne", "dit bort", "(to) over there", None)]),
         (("Kauempana", "Lenger borte", "Further away"), [
             ("dot", "Pron", ["dot", "don"], "tuo (kauempana) · tuon", "den lengst borte · dens", "that one further away · of that", None),
             ("doppe", "Adv", None, "tuolla kauempana", "lenger borte", "far over there", None),
             ("dohko", "Adv", None, "sinne (kauemmas)", "dit (lenger bort)", "(to) further over there", None)]),
         (("Se", "Den, det", "It, that"), [
             ("dat", "Pron", ["dat", "dan"], "se · sen", "den, det · dens", "it, that · of it", None)])]},

    {"id": "taallajatuolla", "icon": "place", "group": "luonto",
     "title": ("Täällä ja tuolla", "Her og der", "Here and there"),
     # Missä/minne-sanat (dáppe, dieppe, duoppe, doppe, deike, diehko, duohko, dohko) ovat 2026-11-25 alkaen
     # Lähellä ja kaukana -listassa. Vanha ohje oli väärin päin (do- on kauimpana: sanakirjan dot "det lengst borte").
     "hint": ("dás = tässä (lähellä minua) · diekko = siinä (lähellä sinua) · duos = tuossa",
              "dás = akkurat her (nær meg) · diekko = der (nær deg) · duos = akkurat der",
              "dás = right here (near me) · diekko = there (near you) · duos = right there"),
     "sections": [
         (("Tässä ja tuossa", "Akkurat her og der", "Right here and there"), [
             ("dás", "Adv", None, "tässä, tästä", "akkurat her", "right here",
              ("Elle orru dás.", "Elle asuu tässä.", "Elle bor akkurat her.", "Elle lives right here.", {"fi": O, "nb": N})),
             ("diekko", "Adv", None, "siinä", "der", "there (by you)",
              ("Mun bohten diekko dien luoddaráigge.", "Tulin siitä sitä tietä pitkin.", "Jeg kom der langs den veien.", "I came that way, along that road.", {"fi": O, "nb": N})),
             ("duos", "Adv", None, "tuossa, tuosta", "akkurat der", "right there",
              ("Elle orru duos.", "Elle asuu tuossa.", "Elle bor akkurat der.", "Elle lives right there.", {"fi": O, "nb": N}))]),
         (("Suunnat ja paikat", "Retninger og steder", "Directions and places"), [
             ("sisa", "Adv", None, "sisään", "inn", "in",
              ("Boađe sisa gáfe juhkat!", "Tule sisään juomaan kahvia!", "Kom inn og drikk kaffe!", "Come in and have coffee!", {"fi": O, "nb": N})),
             ("olggos", "Adv", None, "ulos", "ut", "out",
              ("Sárá manná olggos.", "Sárá menee ulos.", "Sárá går ut.", "Sárá goes out.", {"fi": O, "nb": N})),
             ("olgun", "Adv", None, "ulkona", "ute", "outside",
              ("Sárá lea olgun.", "Sárá on ulkona.", "Sárá er ute.", "Sárá is outside.", {"fi": O, "nb": N})),
             ("bajás", "Adv", None, "ylös", "opp", "up",
              ("Mánát vihke bajás.", "Lapset ryntäsivät ylös.", "Barna sprang opp.", "The children rushed up.", {"fi": O, "nb": N})),
             ("vulos", "Adv", None, "alas", "ned", "down",
              ("Ivvár manná vulos.", "Ivvár menee alas.", "Ivvár går ned.", "Ivvár goes down.", {"fi": O, "nb": N})),
             ("ruoktot", "Adv", None, "kotiin, takaisin", "hjem, tilbake", "home, back",
              ("Ihttin mii vuoddját ruoktot.", "Huomenna ajamme kotiin.", "I morgen kjører vi hjem.", "Tomorrow we drive home.", {"fi": O, "nb": N})),
             ("ruovttus", "Adv", None, "kotona", "hjemme", "at home", None),
             ("guhkkin", "Adv", None, "kaukana", "langt borte", "far away",
              ("Don leat nu guhkkin, muhto liikká nu lahka.", "Olet niin kaukana, mutta silti niin lähellä.", "Du er så langt borte, men likevel så nær.", "You are so far away, yet so near.", {"fi": O, "nb": N})),
             ("lahka", "Po", None, "lähellä", "nær", "near",
              ("In beassan lahka ge uvssa.", "En päässyt edes oven lähelle.", "Jeg kom meg ikke i nærheten av døra engang.", "I couldn't even get near the door.", {"fi": O, "nb": N})),
             ("eret", "Adv", None, "pois", "bort, vekk", "away",
              ("Mana eret!", "Mene pois!", "Gå vekk!", "Go away!", {"fi": O, "nb": N})),
             ("ovdan", "Adv", None, "eteen, esiin", "fram", "forward", None)]),
         (("Näin ja niin", "Slik og sånn", "Like this"), [
             ("ná", "Adv", None, "näin", "slik, sånn her", "like this",
              ("Mun čálán ná.", "Minä kirjoitan näin.", "Jeg skriver slik.", "I write like this.", {"fi": O, "nb": N})),
             ("nie", "Adv", None, "niin, siten", "slik, sånn der", "like that", None),
             ("nu", "Adv", None, "niin, näin", "slik, sånn", "so, like this",
              ("aiddo nu", "juuri niin", "akkurat slik", "exactly so", {"fi": F, "nb": O}))])]},

    {"id": "aikasanat", "icon": "hourglass", "group": "aika",
     "title": ("Ennen ja jälkeen", "Før og etter", "Before and after"),
     "hint": None,
     "sections": [
         (("Silloin ja sitten", "Da og så", "Then and after"), [
             ("dalle", "Adv", None, "silloin, sitten", "da", "then",
              ("Dalle go áddjá elii, láviimet juoŋastit.", "Silloin kun isoisä eli, meillä oli tapana kalastaa jään alta.", "Da bestefar levde, pleide vi å fiske med garn under isen.", "When grandfather was alive, we used to fish under the ice.", {"fi": O, "nb": N})),
             ("dasto", "Adv", None, "sen jälkeen, sitten", "deretter, så", "after that, then",
              ("Mun fitnen álggos rámbuvrris ja dasto mannen báŋkui.", "Kävin ensin kaupassa ja sitten menin pankkiin.", "Jeg var først innom butikken og deretter dro jeg til banken.", "First I went to the shop and then to the bank.", {"fi": O, "nb": N})),
             ("ovdal", "Adv", None, "ennen, aiemmin", "før", "before, earlier",
              ("Manne it leat ovdal boahtán?", "Miksi et ole tullut aiemmin?", "Hvorfor har du ikke kommet før?", "Why haven't you come before?", {"fi": O, "nb": N})),
             ("maŋŋá", "Po", None, "jälkeen, myöhemmin", "etter, seinere", "after, later",
              ("Eadni bođii maŋŋá.", "Äiti tuli myöhemmin.", "Mor kom seinere.", "Mother came later.", {"fi": O, "nb": N}))]),
         (("Jo ja vielä", "Allerede og ennå", "Already and still"), [
             ("juo", "Adv", None, "jo", "allerede", "already",
              ("Mun lean juo geargan.", "Olen jo valmis.", "Jeg er allerede ferdig.", "I'm already done.", {"fi": O, "nb": N})),
             ("vel", "Adv", None, "vielä", "enda", "yet, still",
              ("Eadni ii leat vel boahtán.", "Äiti ei ole vielä tullut.", "Mor har ikke kommet enda.", "Mother hasn't come yet.", {"fi": O, "nb": N})),
             ("ain", "Adv", None, "yhä, vielä", "ennå", "still",
              ("Son lea ain dáppe.", "Hän on yhä täällä.", "Hun er ennå der.", "She is still here.", {"fi": F, "nb": N})),
             ("vuos", "Adv", None, "ensin, vielä", "først, ennå", "first, yet", None),
             ("fas", "Adv", None, "taas", "igjen", "again",
              ("Goas don fas boađát?", "Milloin tulet taas?", "Når kommer du igjen?", "When will you come again?", {"fi": O, "nb": N}))]),
         (("Kuinka usein", "Hvor ofte", "How often"), [
             ("álo", "Adv", None, "aina", "alltid", "always",
              ("Don leat álo heajos mielas.", "Olet aina huonolla tuulella.", "Du er alltid i dårlig humør.", "You're always in a bad mood.", {"fi": O, "nb": N})),
             ("dávjá", "Adv", None, "usein", "ofte", "often",
              ("Mii fitnat dávjá Romssas.", "Käymme usein Tromssassa.", "Vi er ofte i Tromsø.", "We often visit Tromsø.", {"fi": O, "nb": N})),
             ("goassege", "Adv", None, "koskaan", "noensinne, aldri", "ever, never",
              ("Leat go goassege leamaš doppe?", "Oletko koskaan ollut siellä?", "Har du noen gang vært der?", "Have you ever been there?", {"fi": O, "nb": N}))])]},

    {"id": "sidesanat", "icon": "link", "group": "perus",
     "title": ("Sidesanat ja pikkusanat", "Bindeord og småord", "Linking and little words"),
     "hint": None,
     "sections": [
         (("Ja, mutta, tai", "Og, men, eller", "And, but, or"), [
             ("ja", "CC", None, "ja", "og", "and",
              ("Dat lea sihke buorre ja heittot.", "Se on sekä hyvä että huono.", "Det er både bra og dårlig.", "It's both good and bad.", {"fi": O, "nb": N})),
             ("muhto", "CC", None, "mutta", "men", "but",
              ("Mun sáhtán áinnas veahkehit du, muhto odne in astta.", "Autan sinua mielelläni, mutta tänään minulla ei ole aikaa.", "Jeg kan godt hjelpe deg, men i dag har jeg ikke tid.", "I'd gladly help you, but today I don't have time.", {"fi": O, "nb": N})),
             ("dahje", "CC", None, "tai, taikka", "eller", "or", None),
             ("vai", "CC", None, "vai", "eller (i spørsmål)", "or (in questions)",
              ("Siđat go gáfe vai deaja?", "Haluatko kahvia vai teetä?", "Vil du ha kaffe eller te?", "Do you want coffee or tea?", {"fi": O, "nb": N})),
             ("juogo", "Adv", None, "joko", "enten", "either",
              ("juogo ... dahje", "joko ... tai", "enten ... eller", "either ... or", {"fi": O, "nb": N})),
             ("sihke", "CC", None, "sekä", "både", "both",
              ("sihke - ja", "sekä - että", "både - og", "both - and", {"fi": F, "nb": O}))]),
         (("Että, kun, jos", "At, når, hvis", "That, when, if"), [
             ("ahte", "CS", None, "että", "at", "that",
              ("Lea hui mávssolaš ahte sin dárbbut váldojit vuhtii.", "On hyvin tärkeää, että heidän tarpeensa otetaan huomioon.", "Det er svært viktig at deres behov blir ivaretatt.", "It's very important that their needs are taken into account.", {"fi": O, "nb": N})),
             ("go", "CS", None, "kun, kuin", "når, enn, som", "when, than",
              ("Ánte lea gievrrat go Elle.", "Ánte on vahvempi kuin Elle.", "Ánte er sterkere enn Elle.", "Ánte is stronger than Elle.", {"fi": O, "nb": N})),
             ("jus", "CS", None, "jos", "hvis", "if",
              ("Jus ihttin lea buolaš, de eat vuolgge čuoigat.", "Jos huomenna on pakkasta, emme lähde hiihtämään.", "Hvis det er kaldt i morgen, går vi ikke på ski.", "If it's freezing tomorrow, we won't go skiing.", {"fi": O, "nb": N})),
             ("vaikko", "CS", None, "vaikka", "selv om", "although, even if",
              ("Mun veahkehan du, vaikko it dárbbaš ge veahki.", "Autan sinua, vaikka et tarvitsisikaan apua.", "Jeg hjelper deg, selv om du ikke trenger hjelp.", "I'll help you, even if you don't need help.", {"fi": O, "nb": N})),
             ("nugo", "CS", None, "niin kuin, kuten", "slik som", "as, like",
              ("Daga nugo mun.", "Tee niin kuin minä.", "Gjør som jeg.", "Do as I do.", {"fi": O, "nb": N})),
             ("dego", "CS", None, "kuin, kuten", "som, liksom", "like",
              ("Don borat dego spiidni.", "Syöt kuin sika.", "Du spiser som en gris.", "You eat like a pig.", {"fi": O, "nb": N})),
             ("ovdalgo", "CS", None, "ennen kuin", "før", "before",
              ("Don boađát ovdalgo mun vuolggán.", "Tulet ennen kuin minä lähden.", "Du kommer før jeg drar.", "You come before I leave.", {"fi": O, "nb": O})),
             ("danne", "Adv", None, "siksi", "derfor", "that's why",
              ("Danne mii leat maŋŋonan.", "Siksi olemme myöhässä.", "Derfor er vi forsinket.", "That's why we're late.", {"fi": O, "nb": N})),
             ("danin", "Adv", None, "sen takia, siksi", "på grunn av det, derfor", "because of that", None),
             ("nappo", "Adv", None, "siis", "altså", "so, thus", None)]),
         (("Pikkusanat", "Småord", "Little words"), [
             ("maiddái", "Adv", None, "myös", "også", "also, too",
              ("Oidnen maiddái Niillasa.", "Näin myös Niillasin.", "Jeg så Nils også.", "I saw Niillas too.", {"fi": O, "nb": N})),
             ("gal", "Adv", None, "kyllä", "riktignok, virkelig", "indeed, really",
              ("Dan gal lean vajálduhttán.", "Sen olen kyllä unohtanut.", "Det har jeg (virkelig) glemt.", "That I've really forgotten.", {"fi": O, "nb": N})),
             ("hui", "Adv", None, "hyvin, erittäin", "veldig", "very",
              ("Eadni lea hui váibbas.", "Äiti on hyvin väsynyt.", "Mor er veldig trøtt.", "Mother is very tired.", {"fi": O, "nb": N})),
             ("dušše", "Adv", None, "vain", "bare", "only",
              ("Mus leat dušše guokte máná.", "Minulla on vain kaksi lasta.", "Jeg har bare to barn.", "I have only two children.", {"fi": O, "nb": N})),
             ("áibbas", "Adv", None, "aivan, ihan", "helt, aldeles", "quite, completely", None),
             ("sullii", "Adv", None, "suunnilleen, noin", "omtrent", "about, roughly", None),
             ("eanet", "A", None, "enemmän, useampi", "mer, flere", "more",
              ("Dan birra gávnnat eanet dieđuid 10. siiddus.", "Siitä löydät lisää tietoa sivulta 10.", "Du finner mer informasjon om det på side 10.", "You'll find more information about it on page 10.", {"fi": O, "nb": N})),
             ("šat", "Adv", None, "enää", "mer", "any more",
              ("Ii leat šat.", "Ei ole enää.", "Det er ikke mer.", "There's no more.", {"fi": O, "nb": N})),
             ("juste", "Adv", None, "juuri", "akkurat", "exactly, just",
              ("Muital juste movt dat lei!", "Kerro juuri niin kuin se oli!", "Fortell akkurat hvordan det var!", "Tell exactly how it was!", {"fi": O, "nb": N})),
             ("muđui", "Adv", None, "muuten", "ellers", "otherwise", None),
             ("goit", "Pcle", None, "ainakin, kuitenkin", "i alle fall", "at least",
              ("Máret goit boahtá.", "Máret ainakin tulee.", "Marit kommer i alle fall.", "Máret is coming at least.", {"fi": O, "nb": N})),
             ("liikká", "Adv", None, "silti, kuitenkin", "likevel", "still, anyway",
              ("Don manat liikká meahccái, vaikko mun bázán ruoktot.", "Sinä menet silti metsään, vaikka minä jään kotiin.", "Du drar likevel ut, selv om jeg blir hjemme.", "You'll go out anyway, even if I stay at home.", {"fi": O, "nb": O})),
             ("baicce", "Adv", None, "sen sijaan, pikemminkin", "heller", "instead, rather",
              ("Ii leat vilges, baicce ruksesivnnat.", "Se ei ole valkoinen vaan pikemminkin punertava.", "Den er ikke hvit, men heller rødlig.", "It's not white but rather reddish.", {"fi": O, "nb": O})),
             ("bures", "Adv", None, "hyvin", "godt, bra", "well",
              ("Don leat bargan bures.", "Olet tehnyt työtä hyvin.", "Du har jobbet godt.", "You have worked well.", {"fi": O, "nb": N})),
             ("ovttas", "Adv", None, "yhdessä", "sammen", "together",
              ("ovttas bargat", "tehdä työtä yhdessä", "arbeide sammen", "work together", {"fi": O, "nb": N}))]),
         (("Apuverbit", "Hjelpeverb", "Helper verbs"), [
             ("leat", "V", None, "olla", "være", "be",
              ("Don leat čeahppi.", "Sinä olet taitava.", "Du er flink.", "You are skilful.", {"fi": O, "nb": N})),
             ("ii", "V", None, "ei (kieltoverbi)", "ikke (nektingsverb)", "not (negative verb)",
              ("Eadni ii boahtán ikte.", "Äiti ei tullut eilen.", "Mor kom ikke i går.", "Mother didn't come yesterday.", {"fi": O, "nb": N})),
             ("sáhttit", "V", None, "voida, saattaa", "kunne", "can, may",
              ("Son dagai maid sáhtii.", "Hän teki sen, minkä saattoi.", "Hun gjorde det hun kunne.", "She did what she could.", {"fi": F, "nb": O})),
             ("galgat", "V", None, "pitää, tulla tekemään", "skulle", "shall, should",
              ("Sis galget leat doarvái resurssat.", "Heillä pitäisi olla tarpeeksi resursseja.", "De skal ha nok ressurser.", "They should have enough resources.", {"fi": F, "nb": N})),
             ("fertet", "V", None, "täytyä", "måtte", "must, have to",
              ("Mun ferten vuolgit dál.", "Minun täytyy lähteä nyt.", "Jeg må dra nå.", "I have to go now.", {"fi": F, "nb": N})),
             ("berret", "V", None, "pitäisi", "burde", "should, ought to",
              ("Mun berren dan dahkat.", "Minun pitäisi tehdä se.", "Jeg bør gjøre det.", "I should do it.", {"fi": O, "nb": O})),
             ("lávet", "V", None, "olla tapana", "pleie", "usually do",
              ("Mii lávet vuolgit mearragáddái juohke geasi.", "Meillä on tapana lähteä merenrantaan joka kesä.", "Vi bruker å dra til kysten hver sommer.", "We usually go to the coast every summer.", {"fi": F, "nb": N}))])]},
]
