#!/bin/sh
# Hakee test-lahteet-haaran uudet avoimet lähteet kansioon lahteet/ (ei repossa, .gitignore). Kaikki ladataan
# julkaisijan virallisesta osoitteesta; lisenssit tarkistettu 2026-11-20 (ks. CREDITS.md ja lahteet/LISENSSIT.md):
# - SIKOR North Saami lemma frequency list 2015-10-10 (UiT Giellatekno & Divvun, CLARINO), CC BY 3.0
# - Álgu, saamelaiskielten etymologinen tietokanta (Kotimaisten kielten keskus), CC BY 4.0. Käytetään vain
#   sanojen yhteyksiä saamenkielten välillä; suomen- ja saksankielisiä merkityksiä (Sammallahti) EI käytetä.
# - Stedsnavn, Norjan paikannimet (Kartverket, Geonorge), CC BY 4.0 ("åpne data")
cd "$(dirname "$0")" || exit 1
mkdir -p lahteet && cd lahteet || exit 1
get() {  # get URL TIEDOSTO
    if [ -s "$2" ]; then echo "  $2 on jo"; return; fi
    echo "Haetaan $2..."; curl -sSfL -o "$2.part" "$1" && mv "$2.part" "$2" || echo "  $2: haku epäonnistui"
}
get "https://repo.clarino.uib.no/xmlui/bitstream/handle/11509/106/SIKOR_sme_20151010_lemma_freq.txt.zip?sequence=1&isAllowed=y" SIKOR_sme_20151010_lemma_freq.txt.zip
get "https://kaino.kotus.fi/lataa/algu-16.3.2023.zip" algu-16.3.2023.zip
get "https://nedlasting.geonorge.no/geonorge/Basisdata/Stedsnavn/GML/Basisdata_0000_Norge_4258_Stedsnavn_GML.zip" kartverket_stedsnavn_4258.zip
ls -la
