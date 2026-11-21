# Compiled FST models (GiellaLT lang-sme)

`analyser-gt-norm.hfst` and `generator-gt-norm.hfst` are the North Sámi morphological analyser and
generator, **compiled from [giellalt/lang-sme](https://github.com/giellalt/lang-sme)**
(GiellaLT / Divvun / Giellatekno, UiT The Arctic University of Norway).

- Licence: **GPL-3.0** (see [LICENSE](../../LICENSE)). The corresponding source code is listed below.
  [`rakenna_fst.sh`](../../rakenna_fst.sh) rebuilds the files from exactly these versions.
- Built on 2026-11-11 with HFST 3.17.3, OpenFST 1.8.4 and foma 0.10.0 from these GiellaLT commits:

  | Repository | Commit |
  |---|---|
  | [lang-sme](https://github.com/giellalt/lang-sme) | `f573df7814c9906102eef8de11895b11b2c75f35` |
  | [giella-core](https://github.com/giellalt/giella-core) | `3bb22cc56fc9c921429d3aff8786172ed0c127a3` |
  | [shared-mul](https://github.com/giellalt/shared-mul) | `d45f082f9e8cb5db034e7ee4ad8759bf54a516ea` |
  | [shared-smi](https://github.com/giellalt/shared-smi) | `27e330060eb324b4433f2632db162dcfddeff2ea` |
  | [lang-sma](https://github.com/giellalt/lang-sma) | `22b3eddaa3e0d1e312c2f26c6d516d9b23a20dd4` |
  | [lang-smj](https://github.com/giellalt/lang-smj) | `41e93e7f5879ab538520dd46e64b30edd882680c` |

- SHA-256: `analyser-gt-norm.hfst` 17fd14930b0a019347b45bac03767924a109ca19014252942580ad438aaa98fd, `generator-gt-norm.hfst` 76f0de3fe4340a2b143e9c1f77f1328ebd1df3773b79f5755218bb3508d5b626.
- Compared with the previous models (lang-sme `6b1ae1cb`, built 2026-11-02), a full import gives the same
  inflection tables for every word except the illative of *Barentsregiovdna* (now *Barentsregiovdnii*).
- Releases up to 0.9.2.1 were built with earlier models from the lang-sme main branch (exact commit not
  recorded, before `aa897d2f4d`). Compared with them, these models lost no forms or analyses: the generator
  adds 4 forms, which `import_full_dict.py` leaves out, and the analyser adds 60 analyses, mostly of acronyms.
- Authors (lang-sme CITATION.cff): Linda Wiechetek, Katri Hiovain-Asikainen, Inga Lill Sigga Mikkelsen,
  Sjur N. Moshagen, Flammie A Pirinen, Trond Trosterud, Børre Gaup, and the contributors listed in
  the lang-sme repository.
- Used by `import_full_dict.py` to analyse base forms and generate the inflection tables. The
  generated forms in the app's database come from these models.
