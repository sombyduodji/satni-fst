#!/usr/bin/env python3
"""Julkaisun numero (tiedosto RELEASE_VERSION) ja sen kasvattaminen (käyttäjän sääntö 2026-11-13).

Kaksi julkaisutyyppiä:
- uutta sisältöä (iso päivitys): kolmas numero kasvaa 0.9.3 -> 0.9.4 ... 0.9.9 -> 1.0.0 (aina yhdeksään asti,
  sitten seuraava ylempi numero); mahdollinen korjausnumero putoaa pois (0.9.3.2 -> 0.9.4)
- korjaukset ja käännökset: neljäs numero 0.9.3 -> 0.9.3.1 ... 0.9.3.9; yhdeksännen jälkeen seuraava korjaus on
  seuraava sisältöjulkaisu (0.9.3.9 -> 0.9.4)

Kehitysversio (debug-APK, DEV-AppImage) näyttää seuraavan korjausjulkaisun numeron ja -DEV:
0.9.3 -> 0.9.3.1-DEV, 0.9.3.4 -> 0.9.3.5-DEV, 0.9.3.9 -> 0.9.4-DEV.

Käyttö:
  python3 release.py            nykyinen julkaisu
  python3 release.py dev        kehitysversion nimi
  python3 release.py sisalto    kasvattaa: uutta sisältöä (myös: feature)
  python3 release.py korjaus    kasvattaa: korjaukset ja käännökset (myös: fix)
  lisää --kokeile (tai --dry-run), niin RELEASE_VERSION ei muutu
"""
import os
import sys

RELEASE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "RELEASE_VERSION")


def parse(version):
    parts = [int(p) for p in version.strip().split(".")]
    if not 3 <= len(parts) <= 4 or any(p < 0 for p in parts) or any(p > 9 for p in parts[1:]):
        raise ValueError(f"julkaisun numero ei ole muotoa X.Y.Z tai X.Y.Z.W (0–9): {version!r}")
    return parts


def fmt(parts):
    return ".".join(str(p) for p in parts)


def next_feature(version):
    major, minor, patch = parse(version)[:3]
    patch += 1
    if patch > 9:
        patch, minor = 0, minor + 1
    if minor > 9:
        minor, major = 0, major + 1
    return fmt([major, minor, patch])


def next_fix(version):
    parts = parse(version)
    fix = (parts[3] if len(parts) == 4 else 0) + 1
    if fix > 9:
        return next_feature(version)
    return fmt(parts[:3] + [fix])


def dev_version(version):
    return next_fix(version) + "-DEV"


def current():
    with open(RELEASE_FILE, encoding="utf-8") as f:
        return f.read().strip()


def main(argv):
    dry = any(a in ("--kokeile", "--dry-run") for a in argv)
    args = [a for a in argv if not a.startswith("--")]
    cmd = args[0] if args else ""
    version = current()
    if cmd == "":
        print(version)
    elif cmd == "dev":
        print(dev_version(version))
    elif cmd in ("sisalto", "sisältö", "feature", "korjaus", "fix"):
        new = next_feature(version) if cmd in ("sisalto", "sisältö", "feature") else next_fix(version)
        if not dry:
            with open(RELEASE_FILE, "w", encoding="utf-8") as f:
                f.write(new + "\n")
        print(f"{version} -> {new}" + (" (kokeilu, ei tallennettu)" if dry else ""))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
