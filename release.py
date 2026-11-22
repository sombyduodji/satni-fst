#!/usr/bin/env python3
"""Julkaisun numero (tiedosto RELEASE_VERSION), sen kasvattaminen ja kanavien versiot.

Versiot ja kanavat (käyttäjä 2026-11-22, korvaa 2026-11-13 säännön):
- main (Play ja GitHubin vakaa): julkaistu versio X.Y.Z
- uutta sisältöä: toinen numero kasvaa 1.0.0 -> 1.1.0 ... 1.9.x -> 2.0.0 (yhdeksään asti, sitten seuraava ylempi)
- korjaukset ja käännökset: kolmas numero 1.0.0 -> 1.0.1 ... 1.0.9; yhdeksännen jälkeen seuraava korjaus on
  seuraava sisältöjulkaisu (1.0.9 -> 1.1.0)
- DEV (dev-haara, debug-APK, DEV-AppImage): seuraava sisältöjulkaisu + -dev.N, N = commitit edellisestä
  julkaisutagista (1.0.0 -> 1.1.0-dev.42)
- BETA (GitHubin pre-release, tagi dev-haarassa): seuraava sisältöjulkaisu + -beta.N, N = seuraava vapaa numero
  (v1.1.0-beta.2 on jo -> 1.1.0-beta.3)
Järjestys: 1.0.1 < 1.1.0-beta.N < 1.1.0-dev.N < 1.1.0. Korjaus vakaaseen tehdään mainiin ja main yhdistetään deviin.
Vanhat nelinumeroiset (0.9.3.2) luetaan edelleen; neljäs numero jää pois kasvatettaessa.

Käyttö:
  python3 release.py            nykyinen julkaisu
  python3 release.py dev        DEV-version nimi
  python3 release.py beta       seuraavan BETA-version nimi
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
    major, minor = parse(version)[:2]
    minor += 1
    if minor > 9:
        minor, major = 0, major + 1
    return fmt([major, minor, 0])


def next_fix(version):
    major, minor, patch = parse(version)[:3]
    if patch + 1 > 9:
        return next_feature(version)
    return fmt([major, minor, patch + 1])


def _git(*args):
    import subprocess
    r = subprocess.run(["git", "-C", os.path.dirname(RELEASE_FILE), *args], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def dev_version(version):
    n = _git("rev-list", "--count", f"v{version}..HEAD") or "0"
    return f"{next_feature(version)}-dev.{n}"


def beta_version(version):
    nxt = next_feature(version)
    used = [t.rsplit(".", 1)[-1] for t in _git("tag", "--list", f"v{nxt}-beta.*").split()]
    return f"{nxt}-beta.{max([int(u) for u in used if u.isdigit()] + [0]) + 1}"


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
    elif cmd == "beta":
        print(beta_version(version))
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
