#!/bin/sh
# Ajetaan tuo_wsl.sh:n käynnistämänä Windows-PC:n WSL:ssä (root). Älä aja suoraan.
# Purkaa lähteet hakemistoon /root/satni-fst, ajaa import_full_dict.py:n ja kopioi tuloksen Windowsin puolelle.
set -e
WIN=/mnt/c/satni-wsl
WORK=/root/satni-fst
mkdir -p "$WORK"
if ! cmp -s "$WIN/inputs.sha256" "$WORK/inputs.sha256" 2>/dev/null; then
    echo "Puretaan lähteet..."
    rm -rf "$WORK"
    mkdir -p "$WORK"
    tar -xzf "$WIN/inputs.tar.gz" -C "$WORK"
    cp "$WIN/inputs.sha256" "$WORK/inputs.sha256"
fi
cd "$WORK"
command -v hfst-lookup >/dev/null || { echo "hfst-lookup puuttuu WSL:stä"; exit 1; }
SATNI_WORKERS="${SATNI_WORKERS:-12}" python3 import_full_dict.py
sqlite3 satni.db "PRAGMA integrity_check;" | grep -qx ok
cp satni.db "$WIN/satni.db.uusi"
echo "Valmis: $WIN/satni.db.uusi"
