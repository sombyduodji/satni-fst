#!/bin/bash
# Rakentaa src/fst/:n FST-mallit (analyser-gt-norm.hfst, generator-gt-norm.hfst) GiellaLT:n lähteistä täsmälleen
# näistä versioista, ks. src/fst/SOURCE.md. Tiedostot kopioidaan src/fst/:iin vain, jos anna --asenna.
# Vaatii: HFST 3.17.3 (hfst-lexc ym. PATHissa), foma, vislcg3, autotools, gawk, uconv.
# Väliaikaiset tiedostot: ~/.cache/satni-fst-build/fst
set -e
cd "$(dirname "$0")"
OUT="$PWD/src/fst"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/satni-fst-build/fst"

COMMITS="
giella-core 3bb22cc56fc9c921429d3aff8786172ed0c127a3
shared-mul d45f082f9e8cb5db034e7ee4ad8759bf54a516ea
shared-smi 27e330060eb324b4433f2632db162dcfddeff2ea
lang-sma 22b3eddaa3e0d1e312c2f26c6d516d9b23a20dd4
lang-smj 41e93e7f5879ab538520dd46e64b30edd882680c
lang-sme f573df7814c9906102eef8de11895b11b2c75f35
"

rm -rf "$CACHE_DIR"
mkdir -p "$CACHE_DIR"
cd "$CACHE_DIR"
echo "$COMMITS" | while read -r repo commit; do
    [ -n "$repo" ] || continue
    echo "Haetaan $repo ${commit:0:10}..."
    git init -q "$repo"
    git -C "$repo" fetch -q --depth 1 "https://github.com/giellalt/$repo.git" "$commit"
    git -C "$repo" checkout -q FETCH_HEAD
done

export GIELLA_CORE="$CACHE_DIR/giella-core"
(cd giella-core && ./autogen.sh && ./configure && make -j8) >giella-core.log 2>&1
for repo in shared-mul shared-smi; do
    (cd "$repo" && ./autogen.sh && ./configure --with-giella-core="$GIELLA_CORE" && make -j8) >"$repo.log" 2>&1
done
cd lang-sme
./autogen.sh >../lang-sme.log 2>&1
./configure --with-giella-core="$GIELLA_CORE" --with-shared-mul="$CACHE_DIR/shared-mul" \
    --with-shared-smi="$CACHE_DIR/shared-smi" --with-shared-sma="$CACHE_DIR/lang-sma" \
    --with-shared-smj="$CACHE_DIR/lang-smj" >>../lang-sme.log 2>&1
make -j8 -C src/fst >>../lang-sme.log 2>&1

sha256sum src/fst/analyser-gt-norm.hfst src/fst/generator-gt-norm.hfst
if [ "$1" = "--asenna" ]; then
    cp src/fst/analyser-gt-norm.hfst src/fst/generator-gt-norm.hfst "$OUT/"
    echo "Kopioitu: $OUT"
fi
