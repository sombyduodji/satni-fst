#!/bin/sh
# Rakentaa Android-sovelluksen (android/) APK:n Docker-kontissa (packaging/android/Dockerfile).
# Tulos: dist/satni-fst.apk. Versio ja versionCode tulevat bump_version.py:ltä gitin tiedoista, joten
# sama commit saa saman version kuin työpöytäversioissa: 0.7.3.20261030.6 -> 2026103006 (kasvaa
# commit commitilta, joten päivitys asentuu vanhan päälle).
# APK allekirjoitetaan julkaisuavaimella ($SATNI_SIGNING_DIR, oletus ~/.config/satni-fst-signing; luodaan
# kerran: packaging/android/luo_allekirjoitusavain.sh). Saman avaimen päivitykset asentuvat vanhan päälle.
# --debug: kehitysversio debug-avaimella (WebView-vianetsintä päällä) emulaattorin dev-laitteelle ja omaan puhelimeen
#          (x86_64 ja arm64). Oma sovellustunnus fi.somby.satnifst.dev ja nimi "Sátni FST DEV", joten se asentuu
#          julkaistun version rinnalle. Versio: seuraavan korjausjulkaisun numero + -DEV (release.py dev: 0.9.3 -> 0.9.3.1-DEV).
# --beta: testiversio GitHubin pre-releaseen: julkaisuavain, oma tunnus fi.somby.satnifst.beta ja nimi "Sátni FST BETA",
#         joten se asentuu Playn ja julkaistun version rinnalle. Versio: release.py dev + -BETA (dist/satni-fst-beta.apk).
# --testi: julkaisuavaimella allekirjoitettu testiversio välimuistikansioon (ei dist-kansioon, jossa on julkaistu
#          versio): emulaattorin main-laitteella voi kokeilla päivitystä käyttäjien version päälle.
cd "$(dirname "$0")" || exit 1

SIGNING_DIR="${SATNI_SIGNING_DIR:-$HOME/.config/satni-fst-signing}"
mkdir -p "$SIGNING_DIR" && chmod 700 "$SIGNING_DIR" || exit 1  # muuten Docker loisi sen root-käyttäjänä
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/satni-fst-build/android"
if [ "$1" = "--debug" ]; then
    TASK=assembleDebug; APK=debug/app-debug.apk; OUT=dist/satni-fst-debug.apk
    ABIS=x86_64,arm64-v8a  # emulaattori ja 64-bittinen puhelin (tekstintunnistuksen natiivikirjasto)
else
    [ -f "$SIGNING_DIR/keystore.properties" ] && [ -f "$SIGNING_DIR/satni-fst-release.jks" ] || {
        echo "Julkaisuavainta ei löydy kansiosta $SIGNING_DIR (luo: packaging/android/luo_allekirjoitusavain.sh)"; exit 1; }
    TASK=assembleRelease; APK=release/app-release.apk; OUT=dist/satni-fst.apk
    [ "$1" = "--testi" ] && OUT="$CACHE_DIR/satni-fst-testi.apk"
    # --beta: GitHubin pre-release (oma tunnus fi.somby.satnifst.beta, julkaisuavain), ks. android/app/build.gradle
    [ "$1" = "--beta" ] && { TASK=assembleBeta; APK=beta/app-beta.apk; OUT=dist/satni-fst-beta.apk; }
fi

[ -f web/data/satni-web.db.gz ] || python3 export_web_data.py || exit 1
[ -n "$SKIP_VERSION_BUMP" ] || python3 bump_version.py || exit 1
VERSION=$(python3 -c "import version; print(version.VERSION)") || exit 1
VERSION_CODE=$(python3 -c "import version; print(version.VERSION_CODE)") || exit 1
[ "$1" = "--debug" ] && VERSION="$(python3 release.py dev)"
[ "$1" = "--beta" ] && VERSION="$(python3 release.py dev | sed 's/-DEV$/-BETA/')"

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

# DEV-version allekirjoitus tarkistetaan tallennettua debug-avainta vastaan: eri avaimella allekirjoitettu päivitys ei
# asennu puhelimeen vanhan DEV-version päälle (näin kävi Windows-koneen buildeille 2026-11-13)
if [ "$1" = "--debug" ]; then
    docker run --rm -v "$CACHE_DIR":/work satni-fst-android-build sh -c '
        want=$(keytool -list -v -keystore /work/home/.android/debug.keystore -storepass android 2>/dev/null | sed -n "s/.*SHA256: //p" | head -1 | tr -d ":" | tr A-F a-f)
        got=$(/opt/android-sdk/build-tools/*/apksigner verify --print-certs /work/build/app/outputs/apk/debug/app-debug.apk 2>/dev/null | sed -n "s/.*certificate SHA-256 digest: //p" | head -1)
        echo "debug-avain $want, APK $got"; [ -n "$want" ] && [ "$want" = "$got" ]' || {
        echo "VIRHE: DEV-APK on allekirjoitettu eri avaimella kuin $CACHE_DIR/home/.android/debug.keystore"; exit 1; }
fi

mkdir -p "$(dirname "$OUT")"
cp "$CACHE_DIR/build/app/outputs/apk/$APK" "$OUT" || exit 1
echo "$OUT: versio $VERSION ($VERSION_CODE)"
ls -la "$OUT"
