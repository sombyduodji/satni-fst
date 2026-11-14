# R8 julkaisuversiolle (build.gradle: release { minifyEnabled true }), yötestin 2026-11-14 ehdotus.
# ML Kitin ja androidx:n omat säännöt tulevat kirjastojen mukana (consumer rules).

# WebViewin JS-silta (MainActivity: addJavascriptInterface(ocr, "SatniOcr")): JavaScript kutsuu metodeja nimellä,
# joten niitä ei saa poistaa eikä nimetä uudelleen
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Kaatumisraporttien rivinumerot (Play Console purkaa nimet mapping.txt:llä)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
