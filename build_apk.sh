#!/bin/sh
# Rakentaa Android-sovelluksen (android/) APK:n Docker-kontissa (packaging/android/Dockerfile).
# Tulos: dist/satni-fst.apk. Versio ja versionCode tulevat bump_version.py:ltä gitin tiedoista, joten
# sama commit saa saman version kuin työpöytäversioissa: 0.7.3.20261030.6 -> 2026103006 (kasvaa
# commit commitilta, joten päivitys asentuu vanhan päälle).
# APK allekirjoitetaan julkaisuavaimella ($SATNI_SIGNING_DIR, oletus ~/.config/satni-fst-signing; luodaan
# kerran: packaging/android/luo_allekirjoitusavain.sh). Saman avaimen päivitykset asentuvat vanhan päälle.
# --debug: kehitysversio julkaisuavaimella (WebView-vianetsintä päällä) emulaattorin dev-laitteelle ja omaan puhelimeen
#          (x86_64 ja arm64). Oma sovellustunnus fi.somby.satnifst.dev ja nimi "Sátni FST DEV", joten se asentuu
#          julkaistun version rinnalle. Versio: seuraava sisältöjulkaisu + -dev.N (release.py dev: 1.0.0 -> 1.1.0-dev.42).
# --beta: testiversio GitHubin pre-releaseen: julkaisuavain, oma tunnus fi.somby.satnifst.beta ja nimi "Sátni FST BETA",
#         joten se asentuu Playn ja julkaistun version rinnalle. Versio: release.py beta (1.1.0-beta.3) tai BETA_VERSION (dist/satni-fst-beta.apk).
# --testi: julkaisuavaimella allekirjoitettu testiversio välimuistikansioon (ei dist-kansioon, jossa on julkaistu
#          versio): emulaattorin main-laitteella voi kokeilla päivitystä käyttäjien version päälle.
# --play: Google Play -versio, App Bundle julkaisuavaimella: dist/satni-fst-play.aab (ei tukilinkkiä).
# --play-testi: Play-versio APK:na välimuistikansioon, emulaattorin play-laitteelle (Android 16) kokeiltavaksi.
cd "$(dirname "$0")" || exit 1

SIGNING_DIR="${SATNI_SIGNING_DIR:-$HOME/.config/satni-fst-signing}"
mkdir -p "$SIGNING_DIR" && chmod 700 "$SIGNING_DIR" || exit 1  # muuten Docker loisi sen root-käyttäjänä
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/satni-fst-build/android"
[ -f "$SIGNING_DIR/keystore.properties" ] && [ -f "$SIGNING_DIR/satni-fst-release.jks" ] || {
    echo "Julkaisuavainta ei löydy kansiosta $SIGNING_DIR (luo: packaging/android/luo_allekirjoitusavain.sh)"; exit 1; }
if [ "$1" = "--debug" ]; then
    TASK=assembleGithubDebug; APK=apk/github/debug/app-github-debug.apk; OUT=dist/satni-fst-debug.apk
    ABIS=x86_64,arm64-v8a  # emulaattori ja 64-bittinen puhelin (tekstintunnistuksen natiivikirjasto)
else
    TASK=assembleGithubRelease; APK=apk/github/release/app-github-release.apk; OUT=dist/satni-fst.apk
    case "$1" in
        --testi) OUT="$CACHE_DIR/satni-fst-testi.apk" ;;
        # --beta: GitHubin pre-release (oma tunnus fi.somby.satnifst.beta, julkaisuavain), ks. android/app/build.gradle
        --beta)  TASK=assembleGithubBeta; APK=apk/github/beta/app-github-beta.apk; OUT=dist/satni-fst-beta.apk ;;
        --play)  # Play jakaa paketin suoritintyypeittäin, joten x86_64 ei kasvata puhelimien latausta
            TASK=bundlePlayRelease; APK=bundle/playRelease/app-play-release.aab; OUT=dist/satni-fst-play.aab
            ABIS=arm64-v8a,armeabi-v7a,x86_64 ;;
        --play-testi)
            TASK=assemblePlayRelease; APK=apk/play/release/app-play-release.apk; OUT="$CACHE_DIR/satni-fst-play-testi.apk"
            ABIS=arm64-v8a,x86_64 ;;
    esac
fi

[ -f web/data/satni-web.db.gz ] || python3 export_web_data.py || exit 1
[ -n "$SKIP_VERSION_BUMP" ] || python3 bump_version.py || exit 1
VERSION=$(python3 -c "import version; print(version.VERSION)") || exit 1
VERSION_CODE=$(python3 -c "import version; print(version.VERSION_CODE)") || exit 1
[ "$1" = "--debug" ] && VERSION="$(python3 release.py dev)"
# BETA_VERSION=1.1.0-beta.1 ./build_apk.sh --beta: GitHubin pre-releasen nimi (sama kuin tagi ilman v:tä)
[ "$1" = "--beta" ] && VERSION="${BETA_VERSION:-$(python3 release.py beta)}"

# Väliaikaiset tiedostot (Gradle, käännös, debug-avain) välimuistikansioon, ei projektikansioon. Debug-avain on
# $CACHE_DIR/home/.android/debug.keystore: ANDROID_USER_HOME osoittaa siihen, koska root-käyttäjänä (WSL)
# Android-työkalut käyttäisivät muuten /root/.android-kansiota ja loisivat uuden avaimen (eri allekirjoitus, päivitys
# ei asennu vanhan DEV-version päälle; 2026-11-13)
mkdir -p "$CACHE_DIR/home" "$CACHE_DIR/build" || exit 1

docker build -q -t satni-fst-android-build packaging/android >/dev/null || exit 1
docker run --rm \
    --user "$(id -u):$(id -g)" \
    -e HOME=/work/home \
    -e ANDROID_USER_HOME=/work/home/.android \
    -e GRADLE_USER_HOME=/work/home/gradle \
    -e SATNI_BUILD_DIR=/work/build \
    -v "$PWD":/src:ro \
    -v "$CACHE_DIR":/work \
    -v "$SIGNING_DIR":/signing:ro -e SATNI_SIGNING_DIR=/signing \
    -w /src/android \
    satni-fst-android-build \
    gradle --quiet --no-daemon --project-cache-dir /work/project-cache \
        -PsatniVersionName="$VERSION" -PsatniVersionCode="$VERSION_CODE" ${ABIS:+-PsatniAbis=$ABIS} "$TASK" || exit 1

# Kaikki APK:t allekirjoitetaan julkaisuavaimella (DEV ja BETA 2026-11-22). Koventaminen (yötesti 23.11.): tarkistetaan
# allekirjoitus (apksigner verify, varmenteen SHA-256 = julkaisuavain) ja ettei APK ole debuggable; muuten koonti
# keskeytyy eikä APK:ta kopioida dist/:iin.
RELEASE_CERT_SHA256=727296764281e20146f999a54636265a799ef4c4a21f3f23f7320c4620b1587d
BUILT="$CACHE_DIR/build/app/outputs/$APK"
if [ "${OUT%.aab}" != "$OUT" ]; then
    # App Bundle: jar-allekirjoitus (apksigner ei lue .aab-tiedostoa); release-koontityyppi ei ole debuggable
    GOT=$(docker run --rm -v "$(dirname "$BUILT")":/apk:ro satni-fst-android-build sh -c "keytool -printcert -jarfile /apk/$(basename "$BUILT")" 2>&1 | sed -n "s/.*SHA256: //p" | head -1 | tr -d ":" | tr A-F a-f)
    [ "$GOT" = "$RELEASE_CERT_SHA256" ] || { echo "VIRHE: App Bundle ei ole allekirjoitettu julkaisuavaimella ($GOT)"; exit 1; }
    CHECK="certificate SHA-256 digest: $RELEASE_CERT_SHA256
0"
else
    CHECK=$(docker run --rm -v "$(dirname "$BUILT")":/apk:ro satni-fst-android-build sh -c \
    "BT=/opt/android-sdk/build-tools/35.0.0; \$BT/apksigner verify --print-certs /apk/$(basename "$BUILT") && \$BT/aapt dump badging /apk/$(basename "$BUILT") | grep -c application-debuggable" 2>&1)
fi
if ! echo "$CHECK" | grep -qi "certificate SHA-256 digest: $RELEASE_CERT_SHA256"; then
    echo "VIRHE: APK ei ole allekirjoitettu julkaisuavaimella:"; echo "$CHECK" | head -5; exit 1
fi
if [ "$(echo "$CHECK" | tail -1)" != "0" ]; then
    echo "VIRHE: APK on debuggable (application-debuggable)"; exit 1
fi
echo "allekirjoitus: julkaisuavain OK, ei debuggable"
mkdir -p "$(dirname "$OUT")"
cp "$BUILT" "$OUT" || exit 1
echo "$OUT: versio $VERSION ($VERSION_CODE)"
ls -la "$OUT"
