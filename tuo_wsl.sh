#!/bin/sh
# Rakentaa satni.db:n (import_full_dict.py) lähiverkon Windows-PC:n WSL:ssä, jossa on enemmän muistia: jokainen
# hfst-lookup-prosessi vie noin 1 Gt, ja tuonti ajaa niitä rinnakkain (16 Gt:n koneelta loppui muisti 2026-11-06).
# Koneen tiedot tulevat samasta build_qt_exe.local-tiedostosta kuin Windows-käännöksessä (ks. build_qt_exe.sh):
# SATNI_WIN_PC_HOST, SATNI_WIN_PC_MAC, SATNI_WIN_PC_BROADCAST, SATNI_WIN_PC_USER, SATNI_WIN_PC_KEY.
# Lisäksi valinnaisesti:
#   SATNI_WSL_DISTRO=satni   WSL-jakelu, jossa on python3, sqlite3 ja hfst (oletus satni)
#   SATNI_WSL_WORKERS=12     rinnakkaisia hfst-lookup-prosesseja PC:llä
#   SATNI_WIN_PC_LOG=komento kutsutaan tekstillä "START/DONE/FAILED: ..." (esim. oma toimintaloki)
#   SATNI_SALLI_VAJAA=1      hyväksy tulos, vaikka taulukoita olisi yli 1 % vähemmän kuin nykyisessä satni.db:ssä
# Tulos tarkistetaan ja vaihdetaan satni.db:n tilalle; vanha jää tiedostoon ~/.cache/satni-fst-build/satni.db.edellinen.
cd "$(dirname "$0")" || exit 1
[ -f ./build_qt_exe.local ] && . ./build_qt_exe.local
[ -n "$SATNI_WIN_PC_HOST" ] || { echo "SATNI_WIN_PC_HOST puuttuu (build_qt_exe.local)"; exit 1; }
IP="$SATNI_WIN_PC_HOST"
WIN_USER="${SATNI_WIN_PC_USER:-builder}"
SSH_KEY="${SATNI_WIN_PC_KEY:-$HOME/.ssh/id_ed25519}"
DISTRO="${SATNI_WSL_DISTRO:-satni}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/satni-fst-build"
mkdir -p "$CACHE/winvm" || exit 1
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=10 -o LogLevel=ERROR -o UserKnownHostsFile=$CACHE/winvm/known_hosts -o StrictHostKeyChecking=accept-new"
log() { [ -n "$SATNI_WIN_PC_LOG" ] && $SATNI_WIN_PC_LOG "$1" >/dev/null 2>&1; echo "$1"; }

# PC hereille tarvittaessa, kuten build_qt_exe.sh:ssä
if ! ssh $SSH_OPTS "$WIN_USER@$IP" "exit" 2>/dev/null; then
    [ -n "$SATNI_WIN_PC_MAC" ] && [ -n "$SATNI_WIN_PC_BROADCAST" ] || { echo "SATNI_WIN_PC_MAC tai SATNI_WIN_PC_BROADCAST puuttuu"; exit 1; }
    MAC_HEX=$(echo "$SATNI_WIN_PC_MAC" | tr -d ':-')
    python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1); s.sendto(b'\xff' * 6 + bytes.fromhex('$MAC_HEX') * 16, ('$SATNI_WIN_PC_BROADCAST', 9))" || exit 1
    echo "Taikapaketti lähetetty, odotetaan PC:tä $IP"
    DEADLINE=$(($(date +%s) + 300))
    until ssh $SSH_OPTS "$WIN_USER@$IP" "exit" 2>/dev/null; do
        [ "$(date +%s)" -ge "$DEADLINE" ] && { echo "PC:hen $IP ei saatu SSH-yhteyttä 5 minuutissa"; exit 2; }
        sleep 5
    done
fi

# Tuonnin lähteet (ei versionhistoriaa eikä sovelluksen omia tiedostoja). Lähetetään vain, jos ne ovat muuttuneet.
INPUTS="$CACHE/wsl-inputs.tar.gz"
find dict-* -path '*/.git' -prune -o -type f -path '*/src/*' -print > "$CACHE/wsl-inputs.list"
ls *.py korjaukset.tsv src/fst/*.hfst giella-fin/*.hfstol ordbank-nob/lemma.txt ordbank-nob/fullformsliste.txt \
    lang-sme/src/fst/morphology/affixes/*.lexc lang-sme/src/fst/morphology/stems/*.lexc \
    dict-sme-spa/inc/A_V_Saami_Spanish.xlsx dict-spa-sme/inc/newest_orig/A_Z_Spanish_Saami.xlsx >> "$CACHE/wsl-inputs.list" || exit 1
tar -czf "$INPUTS" -T "$CACHE/wsl-inputs.list" || exit 1
sha256sum "$INPUTS" | cut -d' ' -f1 > "$CACHE/wsl-inputs.sha256"
ssh $SSH_OPTS "$WIN_USER@$IP" "New-Item -ItemType Directory -Force C:\satni-wsl, C:\tools\busy | Out-Null; Set-Content C:\tools\busy\satni-fst 'satni-fst: satni.db import in WSL'" || exit 1
if ! ssh $SSH_OPTS "$WIN_USER@$IP" "Get-Content C:\satni-wsl\inputs.sha256 -ErrorAction SilentlyContinue" | grep -qF "$(cat "$CACHE/wsl-inputs.sha256")"; then
    echo "Lähetetään lähteet ($(du -h "$INPUTS" | cut -f1))..."
    scp -q $SSH_OPTS "$INPUTS" "$WIN_USER@$IP:C:/satni-wsl/inputs.tar.gz" || exit 1
fi
scp -q $SSH_OPTS "$CACHE/wsl-inputs.sha256" "$WIN_USER@$IP:C:/satni-wsl/inputs.sha256" || exit 1
scp -q $SSH_OPTS packaging/wsl/import_inside.sh "$WIN_USER@$IP:C:/satni-wsl/import_inside.sh" || exit 1

log "START: satni-fst import_full_dict.py in WSL ($DISTRO), ${SATNI_WSL_WORKERS:-12} hfst-lookup workers, ~1 GB each"
START=$(date +%s)
ssh $SSH_OPTS "$WIN_USER@$IP" "Remove-Item C:\satni-wsl\satni.db.uusi -ErrorAction SilentlyContinue; \$env:WSL_UTF8=1; wsl -d $DISTRO -u root -- env SATNI_WORKERS=${SATNI_WSL_WORKERS:-12} sh /mnt/c/satni-wsl/import_inside.sh"
STATUS=$?
if [ $STATUS -eq 0 ]; then
    scp -q $SSH_OPTS "$WIN_USER@$IP:C:/satni-wsl/satni.db.uusi" satni.db.uusi || STATUS=1
fi
ssh $SSH_OPTS "$WIN_USER@$IP" "Remove-Item C:\tools\busy\satni-fst -ErrorAction SilentlyContinue" 2>/dev/null
if [ $STATUS -ne 0 ] || [ "$(sqlite3 satni.db.uusi 'PRAGMA integrity_check;' 2>/dev/null)" != "ok" ]; then
    log "FAILED: satni-fst import in WSL after $(( $(date +%s) - START )) s"
    exit 1
fi
chmod 644 satni.db.uusi
# Taulukkoja ei saa kadota: kaatunut hfst-lookup-erä jätti 2026-11-06 sanoilta 15 800 taulukkoa pois
if [ -f satni.db ] && [ -z "$SATNI_SALLI_VAJAA" ]; then
    OLD=$(sqlite3 satni.db 'SELECT COUNT(DISTINCT word_id) FROM paradigms')
    NEW=$(sqlite3 satni.db.uusi 'SELECT COUNT(DISTINCT word_id) FROM paradigms')
    if [ "$NEW" -lt $((OLD * 99 / 100)) ]; then
        log "FAILED: satni-fst import in WSL: words with inflection tables fell from $OLD to $NEW, kept old satni.db"
        echo "Uusi tietokanta jäi tiedostoon satni.db.uusi (hyväksy silti: SATNI_SALLI_VAJAA=1)"
        exit 1
    fi
fi
[ -f satni.db ] && cp -p satni.db "$CACHE/satni.db.edellinen"
mv satni.db.uusi satni.db
log "DONE: satni-fst import in WSL, $(( $(date +%s) - START )) s, $(sqlite3 satni.db 'SELECT COUNT(*) FROM dictionary') words"
