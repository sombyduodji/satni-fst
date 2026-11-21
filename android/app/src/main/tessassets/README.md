# Tesseract model for the photo search's second pass

`tessdata/smi.traineddata` is the National Library of Norway's (Nasjonalbiblioteket, Språkbanken) Sámi Tesseract
model `synth_base` (Norwegian base model fine-tuned on synthetic Sámi data), converted to Tesseract's integer
format with `combine_tessdata -c` (12.9 MB → 1.7 MB, same accuracy on Sátni FST's OCR test bench). Ocr.java uses it
to read again the North and Inari Sámi words that ML Kit read but that aren't found in the dictionary.

- Source: https://www.nb.no/sbfil/samisk_ocr/ (README_eng, 2025-01-22), original file
  `synth_base.traineddata`, SHA-256 74881ea5d0c1bc761a821d6c11bc1a7d6f025c725b414c6ad37c6d8eb5a7ed54.
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changed: converted to integer format.
- Cite: Enstad T, Trosterud T, Røsok MI, Beyer Y, Roald M. Comparative analysis of optical character recognition
  methods for Sámi texts from the National Library of Norway. Proceedings of the 25th Nordic Conference on
  Computational Linguistics (NoDaLiDa) 2025. https://arxiv.org/abs/2501.07300
