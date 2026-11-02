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
giella-core 498955290e169eae2d15d2c41af03df58cad1442
shared-mul d45f082f9e8cb5db034e7ee4ad8759bf54a516ea
shared-smi 6a0960fe69ba688210a6af9c88c3b8f5b24879db
lang-sma a80760f16bd6d2f3ee7f071db232d80cfc6210cf
lang-smj 3839e095aaa2a5e47a3c06bca3bd7437ffb6de36
lang-sme 6b1ae1cb406d7668799e53e2f8e798d680120a87
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
