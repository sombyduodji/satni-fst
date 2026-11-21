"""Ääntäminen Divvunin/Giellateknon puhesynteesillä (sama palvelu, jota satni.org käyttää).

LÄHDE: Divvun ja Giellatekno, UiT Norjan arktinen yliopisto, äänet Biret, Máhtte ja Sunná.
Divvun on vahvistanut (2026-10-29), että palvelua saa käyttää näin. Ks. CREDITS.md.

Äänitiedostot haetaan osoitteesta https://api-giellalt.uit.no/tts/se/<ääni> ja tallennetaan
välimuistiin, joten sama sana soi seuraavalla kerralla heti ja ilman verkkoyhteyttä.
"""
import hashlib
import json
import os
import shutil
import ssl
import subprocess
import sys
import urllib.request

TTS_URL = "https://api-giellalt.uit.no/tts/se/{voice}"
VOICES = {"Biret": "biret", "Máhtte": "mahtte", "Sunná": "sunna"}
DEFAULT_VOICE = "Biret"
TIMEOUT = 30

# Linuxin soittimet järjestyksessä; jokin näistä löytyy käytännössä jokaisesta työpöytäjakelusta
LINUX_PLAYERS = [
    ["pw-play"],
    ["paplay"],
    ["aplay", "-q"],
    ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet"],
]


# Linuxin varmennetiedostot eri jakeluissa. Paketoitu Python (AppImage on käännetty Debian 11:ssä)
# etsii varmenteita vain Debianin polusta /usr/lib/ssl, jota esim. Arch/CachyOS:ssa ei ole.
SYSTEM_CA_FILES = [
    "/etc/ssl/certs/ca-certificates.crt",                 # Debian, Ubuntu, Arch, Gentoo
    "/etc/pki/tls/certs/ca-bundle.crt",                   # Fedora, RHEL
    "/etc/ssl/ca-bundle.pem",                             # openSUSE
    "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem",  # CentOS, RHEL
    "/etc/ssl/cert.pem",                                  # Alpine, macOS
]


def ssl_context():
    """HTTPS-yhteyden varmenteet: ensisijaisesti ohjelman mukana tuleva certifi, sitten järjestelmän tiedosto."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except (ImportError, OSError):
        pass
    context = ssl.create_default_context()
    if sys.platform != "win32":  # Windows käyttää omaa varmennevarastoaan
        for path in SYSTEM_CA_FILES:
            if os.path.exists(path):
                context.load_verify_locations(cafile=path)
                break
    return context


def cache_dir():
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    else:
        base = os.environ.get("XDG_CACHE_HOME") or os.path.join(os.path.expanduser("~"), ".cache")
    return os.path.join(base, "satni-fst", "tts")


def cached_path(text, voice):
    voice_id = VOICES.get(voice, voice)
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()
    return os.path.join(cache_dir(), voice_id, f"{digest}.wav")


DEFAULT_LIMIT_MB = 1024  # välimuistin enimmäiskoko; täyttyessä pisimpään kuuntelematta olleet poistetaan


def cache_files():
    """[(polku, viimeksi kuunneltu, koko)] välimuistin äänitiedostoista."""
    out = []
    for root, _dirs, files in os.walk(cache_dir()):
        for name in files:
            if name.endswith(".wav"):
                p = os.path.join(root, name)
                try:
                    st = os.stat(p)
                except OSError:
                    continue
                out.append((p, st.st_mtime, st.st_size))
    return out


def stats():
    files = cache_files()
    return {"n": len(files), "bytes": sum(f[2] for f in files)}


def prune(limit_mb=DEFAULT_LIMIT_MB):
    """Poistaa pisimpään kuuntelematta olleet, kunnes välimuisti mahtuu rajaan (kuuntelu päivittää muutosajan)."""
    limit = max(1, int(limit_mb)) * 1024 * 1024
    files = sorted(cache_files(), key=lambda f: f[1])
    total = sum(f[2] for f in files)
    for p, _t, size in files:
        if total <= limit:
            break
        try:
            os.remove(p)
            total -= size
        except OSError:
            pass


def clear():
    shutil.rmtree(cache_dir(), ignore_errors=True)


def fetch(text, voice=DEFAULT_VOICE, limit_mb=None):
    """Palauttaa polun äänitiedostoon; hakee sen palvelusta, jos sitä ei ole välimuistissa.
    limit_mb: uuden tiedoston jälkeen välimuisti karsitaan tähän kokoon (None = ei karsintaa)."""
    path = cached_path(text, voice)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        try:
            os.utime(path)  # viimeksi kuunneltu: karsinta poistaa vanhimmat ensin
        except OSError:
            pass
        return path

    request = urllib.request.Request(
        TTS_URL.format(voice=VOICES.get(voice, voice)),
        data=json.dumps({"text": text}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT, context=ssl_context()) as response:
        audio = response.read()
    if not audio.startswith(b"RIFF"):
        raise RuntimeError("palvelu ei palauttanut äänitiedostoa")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "wb") as f:
        f.write(audio)
    os.replace(tmp, path)
    if limit_mb:
        prune(limit_mb)
    return path


def play(path):
    """Soittaa WAV-tiedoston taustalla."""
    if sys.platform == "win32":
        import winsound
        winsound.PlaySound(path, winsound.SND_FILENAME | winsound.SND_ASYNC)
        return
    for player in LINUX_PLAYERS:
        if shutil.which(player[0]):
            subprocess.Popen(player + [path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return
    raise RuntimeError("äänisoitinta ei löytynyt (pw-play, paplay, aplay tai ffplay)")
