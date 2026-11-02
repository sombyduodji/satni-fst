# Compiled FST models (GiellaLT lang-sme)

`analyser-gt-norm.hfst` and `generator-gt-norm.hfst` are the North Sámi morphological analyser and
generator, **compiled from [giellalt/lang-sme](https://github.com/giellalt/lang-sme)**
(GiellaLT / Divvun / Giellatekno, UiT The Arctic University of Norway).

- Licence: **GPL-3.0** (see [LICENSE](../../LICENSE)). The corresponding source code is listed below.
  [`rakenna_fst.sh`](../../rakenna_fst.sh) rebuilds the files from exactly these versions.
- Built on 2026-11-02 with HFST 3.17.3, OpenFST 1.8.4 and foma 0.10.0 from these GiellaLT commits:

  | Repository | Commit |
  |---|---|
  | [lang-sme](https://github.com/giellalt/lang-sme) | `6b1ae1cb406d7668799e53e2f8e798d680120a87` |
  | [giella-core](https://github.com/giellalt/giella-core) | `498955290e169eae2d15d2c41af03df58cad1442` |
  | [shared-mul](https://github.com/giellalt/shared-mul) | `d45f082f9e8cb5db034e7ee4ad8759bf54a516ea` |
  | [shared-smi](https://github.com/giellalt/shared-smi) | `6a0960fe69ba688210a6af9c88c3b8f5b24879db` |
  | [lang-sma](https://github.com/giellalt/lang-sma) | `a80760f16bd6d2f3ee7f071db232d80cfc6210cf` |
  | [lang-smj](https://github.com/giellalt/lang-smj) | `3839e095aaa2a5e47a3c06bca3bd7437ffb6de36` |

- SHA-256: `analyser-gt-norm.hfst` a0febeee8982b00a002429f819a94f7223e3acd76366995ba436285ff7a5ba2b, `generator-gt-norm.hfst` c67b4aac819bdbd4af617b0a706812e84940f73f246d77eafe336afcf3c13985.
- Releases up to 0.9.2.1 were built with earlier models from the lang-sme main branch (exact commit not
  recorded, before `aa897d2f4d`). Compared with them, these models lost no forms or analyses: the generator
  adds 4 forms, which `import_full_dict.py` leaves out, and the analyser adds 60 analyses, mostly of acronyms.
- Authors (lang-sme CITATION.cff): Linda Wiechetek, Katri Hiovain-Asikainen, Inga Lill Sigga Mikkelsen,
  Sjur N. Moshagen, Flammie A Pirinen, Trond Trosterud, Børre Gaup, and the contributors listed in
  the lang-sme repository.
- Used by `import_full_dict.py` to analyse base forms and generate the inflection tables. The
  generated forms in the app's database come from these models.
