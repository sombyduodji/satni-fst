// Copyright (C) 2026 Juha Somby <satni@somby.fi>
// Lisenssi: GNU GPL, versio 3 (LICENSE) ja lisälupa Google ML Kitille. Ks. CREDITS.md.
package fi.somby.satnifst;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import com.googlecode.tesseract.android.TessBaseAPI;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Tekstintunnistus valokuvasta (ML Kit, laitteella; kuva ei lähde laitteelta). Web-käyttöliittymä kutsuu
 * SatniOcr.scan("camera" | "gallery"), ja tulos palaa funktiolle ocrResult (web/app.js):
 * {width, height, image: JPEG data-URL, words: [{t, cx, cy, w, h, a}]} (sanan keskipiste, leveys ja korkeus
 * tekstin suunnassa sekä kulma asteina), peruttaessa null, virheessä {error}.
 *
 * Kuvan voi kääntää 90 astetta (SatniOcr.rotate(±90), web-näkymän kääntöpainikkeet), ja sivuttain olevan tekstin
 * kuva käännetään automaattisesti oikein päin: jos useimmat sanat ovat noin 90 tai 180 asteen kulmassa, kuva käännetään
 * ja tunnistetaan uudelleen (kuva kirjasta sivuttain ilman EXIF-tietoa).
 *
 * Toinen luku (2026-11-20): sanat, joita web-näkymä ei löytänyt sanakirjasta (pohjois- ja inarinsaame), luetaan
 * uudelleen Tesseractilla (SatniOcr.second): sana rajataan kuvasta, käännetään vaakasuoraan ja muutetaan mustavalkoiseksi,
 * ja tulos palaa funktiolle ocrSecondResult. Malli: Norjan kansalliskirjaston saamen Tesseract-malli synth_base
 * (CC BY 4.0, Enstad ym. 2025) kokonaislukumuotoon pakattuna (assets/tessdata/smi.traineddata, 1,7 Mt). Testipenkki:
 * oikein luettuja sanoja 95,0 -> 98,6 % (pohjoissaame) ja 89,7 -> 95,9 % (inari), 972 korjattua, 7 huononnettua sanaa.
 *
 * Lupia ei tarvita: kuvan ottaa järjestelmän kamerasovellus (tallentaa sen FileProviderin kautta
 * välimuistiin), ja kuvan valinta tehdään järjestelmän kuvanvalitsimella (Android 13+) tai tiedostovalitsimella.
 */
final class Ocr {
    static final int REQUEST_CAMERA = 41;
    static final int REQUEST_GALLERY = 42;
    /** Kuvan pidempi sivu: riittää tekstille, ja web-näkymälle lähetettävä kuva pysyy pienenä. */
    private static final int MAX_SIDE = 2048;

    private final Activity activity;
    private final WebView web;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    /** Tesseract omissa säikeissään: ML Kitin uusi tunnistus ei odota toista lukua. tessWorker jakaa sanat kahdelle
     *  lukijalle (lanes), joilla kummallakin oma TessBaseAPI (ei säieturvallinen); vähintään 4 ytimen puhelimessa kaksi
     *  rinnakkain (OnePlus N10: 80 sanaa 6,6 -> noin 3,5 s). */
    private final ExecutorService tessWorker = Executors.newSingleThreadExecutor();
    private static final int LANES = Runtime.getRuntime().availableProcessors() >= 4 ? 2 : 1;
    private final ExecutorService[] lanes = new ExecutorService[LANES];
    private final TessBaseAPI[] apis = new TessBaseAPI[LANES];
    private TextRecognizer recognizer;
    /** Viimeisin tunnistettu kuva kääntöpainikkeita ja toista lukua varten. */
    private volatile Bitmap last;
    /** Kuvan järjestysnumero: toisen luvun pyyntö ja tulos koskevat aina tiettyä kuvaa (vanha tulos hylätään). */
    private volatile int serial;
    private volatile boolean tessFailed;
    /** Lukijat vapautetaan, kun toista lukua ei ole tarvittu 30 sekuntiin (kaksi lukijaa vie natiivimuistia noin
     *  20-40 Mt; uudelleenlataus vie alle sekunnin, malli on jo kopioitu). */
    private static final long IDLE_MS = 30_000;
    private volatile long lastUse;
    private final android.os.Handler main = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable idleRelease = this::releaseIfIdle;
    /** Enintään näin monta sanaa kuvaa kohden (noin 0,1–0,3 s sanaa kohden puhelimessa). */
    private static final int SECOND_MAX = 80;

    Ocr(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        for (int i = 0; i < LANES; i++) {
            lanes[i] = Executors.newSingleThreadExecutor();
        }
    }

    @JavascriptInterface
    public void scan(String source) {
        activity.runOnUiThread(() -> start("camera".equals(source)));
    }

    private File photoFile() {
        File dir = new File(activity.getCacheDir(), "ocr");
        dir.mkdirs();
        return new File(dir, "photo.jpg");
    }

    private void start(boolean camera) {
        Intent intent;
        if (camera) {
            Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".files", photoFile());
            intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                    .putExtra(MediaStore.EXTRA_OUTPUT, uri)
                    .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else if (Build.VERSION.SDK_INT >= 33) {
            intent = new Intent(MediaStore.ACTION_PICK_IMAGES).setType("image/*");
        } else {
            intent = new Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("image/*");
        }
        try {
            activity.startActivityForResult(intent, camera ? REQUEST_CAMERA : REQUEST_GALLERY);
        } catch (ActivityNotFoundException e) {
            sendError("noApp");
        }
    }

    /** MainActivity.onActivityResult: true, jos pyyntö oli tekstintunnistuksen. */
    boolean onResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_CAMERA && requestCode != REQUEST_GALLERY) {
            return false;
        }
        Uri uri = requestCode == REQUEST_CAMERA ? Uri.fromFile(photoFile()) : data == null ? null : data.getData();
        if (resultCode != Activity.RESULT_OK || uri == null) {
            send("null");
            return true;
        }
        worker.execute(() -> {
            Bitmap bitmap;
            try {
                bitmap = load(uri);
            } catch (IOException | RuntimeException e) {
                sendError("image");
                return;
            }
            recognize(bitmap, true);
        });
        return true;
    }

    /** Vain kehitysversiossa (debuggable): kuvatiedosto sovelluksen omasta kansiosta (Android/data/…/files/ocrbench)
     *  tunnistetaan ilman kuvanvalitsinta. Tunnistuksen testipenkki ajaa näin satoja kuvia (docs, ocrbench). */
    @JavascriptInterface
    public void scanPath(String name) {
        if ((activity.getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) == 0
                || name == null || name.contains("/") || name.contains("..")) {
            sendError("image");
            return;
        }
        File dir = activity.getExternalFilesDir("ocrbench");
        File file = dir == null ? null : new File(dir, name);
        worker.execute(() -> {
            Bitmap bitmap;
            try {
                bitmap = load(Uri.fromFile(file));
            } catch (IOException | RuntimeException e) {
                sendError("image");
                return;
            }
            recognize(bitmap, false);
        });
    }

    /** Web-näkymän kääntöpainikkeet: viimeisin kuva käännettynä (90 = myötäpäivään) ja uusi tunnistus. */
    @JavascriptInterface
    public void rotate(int degrees) {
        worker.execute(() -> {
            if (last == null) {
                sendError("image");
                return;
            }
            recognize(rotated(last, degrees), false);
        });
    }

    /** Tunnistus; autoRotate: sivuttain tai ylösalaisin oleva teksti käännetään kerran oikein päin. */
    private void recognize(Bitmap bitmap, boolean autoRotate) {
        if (recognizer == null) {
            recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        }
        recognizer.process(InputImage.fromBitmap(bitmap, 0))
                .addOnSuccessListener(worker, text -> {
                    int turn = autoRotate ? uprightTurn(text) : 0;
                    if (turn != 0) {
                        recognize(rotated(bitmap, turn), false);
                        return;
                    }
                    last = bitmap;
                    send(toJson(bitmap, text, ++serial));
                })
                .addOnFailureListener(worker, e -> sendError("ocr"));
    }

    /** Kääntö, jolla teksti on vaakasuorassa: sanojen kulmat pyöristettyinä 90 asteeseen, yleisin kulma (vähintään
     *  kolmen merkin sanat ja yli puolet niistä), jottei yksittäinen vino sana käännä kuvaa. 0 = kuva on jo oikein. */
    private static int uprightTurn(Text text) {
        int[] counts = new int[4];
        int total = 0;
        for (Text.TextBlock block : text.getTextBlocks()) {
            for (Text.Line line : block.getLines()) {
                for (Text.Element element : line.getElements()) {
                    Point[] p = element.getCornerPoints();
                    if (p == null || p.length != 4 || element.getText().length() < 3) {
                        continue;
                    }
                    double a = Math.toDegrees(Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x));
                    counts[(int) (Math.round(((a % 360) + 360) % 360 / 90.0) % 4)]++;
                    total++;
                }
            }
        }
        int best = 0;
        for (int i = 1; i < 4; i++) {
            if (counts[i] > counts[best]) {
                best = i;
            }
        }
        // Teksti kulmassa best * 90 astetta: kuvaa käännetään saman verran vastapäivään
        return best != 0 && total >= 3 && counts[best] * 2 > total ? -best * 90 : 0;
    }

    private static Bitmap rotated(Bitmap bitmap, int degrees) {
        Matrix matrix = new Matrix();
        matrix.postRotate(degrees);
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    }

    /** Kuva pienennettynä (pidempi sivu enintään MAX_SIDE) ja EXIF-tiedon mukaan oikein päin käännettynä. */
    private Bitmap load(Uri uri) throws IOException {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream in = open(uri)) {
            BitmapFactory.decodeStream(in, null, bounds);
        }
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inSampleSize = 1;
        while (Math.max(bounds.outWidth, bounds.outHeight) / (options.inSampleSize * 2) >= MAX_SIDE) {
            options.inSampleSize *= 2;
        }
        Bitmap bitmap;
        try (InputStream in = open(uri)) {
            bitmap = BitmapFactory.decodeStream(in, null, options);
        }
        if (bitmap == null) {
            throw new IOException("decode");
        }
        int rotation = 0;
        try (InputStream in = open(uri)) {
            switch (new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                case ExifInterface.ORIENTATION_ROTATE_90: rotation = 90; break;
                case ExifInterface.ORIENTATION_ROTATE_180: rotation = 180; break;
                case ExifInterface.ORIENTATION_ROTATE_270: rotation = 270; break;
                default: break;
            }
        } catch (IOException e) {
            // Ei EXIF-tietoa: kuva sellaisenaan
        }
        float scale = Math.min(1f, (float) MAX_SIDE / Math.max(bitmap.getWidth(), bitmap.getHeight()));
        if (rotation == 0 && scale == 1f) {
            return bitmap;
        }
        Matrix matrix = new Matrix();
        matrix.postScale(scale, scale);
        matrix.postRotate(rotation);
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    }

    private InputStream open(Uri uri) throws IOException {
        InputStream in = activity.getContentResolver().openInputStream(uri);
        if (in == null) {
            throw new IOException("open");
        }
        return in;
    }

    /** Sanat lukujärjestyksessä (tekstilohko, rivi, sana) sijainteineen kuvan pikseleinä. Vino teksti: kulmapisteistä
     *  (vasen ylä, oikea ylä, oikea ala, vasen ala) sanan oma leveys, korkeus ja kulma, jotta sanan päälle piirretty
     *  teksti kääntyy samaan asentoon. */
    private static String toJson(Bitmap bitmap, Text text, int serial) {
        try {
            JSONArray words = new JSONArray();
            for (Text.TextBlock block : text.getTextBlocks()) {
                for (Text.Line line : block.getLines()) {
                    for (Text.Element element : line.getElements()) {
                        JSONObject word = new JSONObject().put("t", element.getText());
                        Point[] p = element.getCornerPoints();
                        Rect r = element.getBoundingBox();
                        if (p != null && p.length == 4) {
                            word.put("cx", (p[0].x + p[1].x + p[2].x + p[3].x) / 4.0)
                                    .put("cy", (p[0].y + p[1].y + p[2].y + p[3].y) / 4.0)
                                    .put("w", Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y))
                                    .put("h", Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y))
                                    .put("a", Math.toDegrees(Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x)));
                        } else if (r != null) {
                            word.put("cx", r.exactCenterX()).put("cy", r.exactCenterY())
                                    .put("w", r.width()).put("h", r.height()).put("a", 0);
                        } else {
                            continue;
                        }
                        words.put(word);
                    }
                }
            }
            ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, jpeg);
            return new JSONObject()
                    .put("width", bitmap.getWidth()).put("height", bitmap.getHeight()).put("serial", serial)
                    .put("image", "data:image/jpeg;base64," + Base64.encodeToString(jpeg.toByteArray(), Base64.NO_WRAP))
                    .put("words", words).toString();
        } catch (JSONException e) {
            return "{\"error\":\"ocr\"}";
        }
    }

    /** Toinen luku: {serial, lang, words: [{i, cx, cy, w, h, a}]} (kuvan pikseleinä kuten ocrResultissa). Tulos
     *  ocrSecondResult({serial, lang, words: [{i, t}]}); jos kuva on jo vaihtunut, mitään ei lähetetä. */
    @JavascriptInterface
    public void second(String json) {
        final JSONObject req;
        try {
            req = new JSONObject(json);
        } catch (JSONException e) {
            return;
        }
        if (tessWorker.isShutdown()) {
            return;  // sovellus suljettu
        }
        tessWorker.execute(() -> {
            int id = req.optInt("serial", -1);
            Bitmap image = last;
            JSONArray words = req.optJSONArray("words");
            if (id != serial || image == null || words == null || tessFailed || !modelReady()) {
                return;
            }
            int n = Math.min(words.length(), SECOND_MAX);
            String[] texts = new String[n];
            java.util.concurrent.CountDownLatch done = new java.util.concurrent.CountDownLatch(LANES);
            for (int lane = 0; lane < LANES; lane++) {
                final int ln = lane;
                lanes[ln].execute(() -> {
                    try {
                        TessBaseAPI api = api(ln);
                        for (int k = ln; api != null && k < n && id == serial; k += LANES) {
                            JSONObject w = words.optJSONObject(k);
                            Bitmap crop = w == null ? null : crop(image, w.optDouble("cx"), w.optDouble("cy"), w.optDouble("w"), w.optDouble("h"), w.optDouble("a", 0));
                            if (crop == null) {
                                continue;
                            }
                            api.setImage(crop);
                            String text = api.getUTF8Text();
                            api.clear();
                            crop.recycle();
                            texts[k] = text == null ? "" : text.trim();
                        }
                    } finally {
                        done.countDown();
                    }
                });
            }
            try {
                done.await();
            } catch (InterruptedException e) {
                return;
            } finally {
                lastUse = System.currentTimeMillis();
                main.removeCallbacks(idleRelease);
                main.postDelayed(idleRelease, IDLE_MS);
            }
            if (id != serial) {
                return;
            }
            JSONArray out = new JSONArray();
            try {
                for (int k = 0; k < n; k++) {
                    if (texts[k] != null) {
                        out.put(new JSONObject().put("i", words.optJSONObject(k).optInt("i")).put("t", texts[k]));
                    }
                }
                send(new JSONObject().put("serial", id).put("lang", req.optString("lang")).put("words", out).toString(),
                        "ocrSecondResult");
            } catch (JSONException e) {
                // ei tulosta
            }
        });
    }

    /** Malli kopioidaan APK:sta sovelluksen kansioon ensimmäisellä kerralla (Tesseract lukee tiedostosta); vain
     *  tessWorker-säikeessä. Epäonnistuminen muistetaan, eikä toista lukua sen jälkeen yritetä. */
    private boolean modelReady() {
        try {
            File dir = new File(activity.getFilesDir(), "tesseract/tessdata");
            File model = new File(dir, "smi.traineddata");
            long size;
            try (android.content.res.AssetFileDescriptor fd = activity.getAssets().openFd("tessdata/smi.traineddata")) {
                size = fd.getLength();
            } catch (IOException e) {
                size = -1;
            }
            if (!model.exists() || (size > 0 && model.length() != size)) {
                dir.mkdirs();
                File tmp = new File(dir, "smi.traineddata.tmp");
                try (InputStream in = activity.getAssets().open("tessdata/smi.traineddata");
                     OutputStream o = new FileOutputStream(tmp)) {
                    byte[] buf = new byte[65536];
                    for (int n; (n = in.read(buf)) > 0; ) {
                        o.write(buf, 0, n);
                    }
                }
                if (!tmp.renameTo(model)) {
                    throw new IOException("rename");
                }
            }
            return true;
        } catch (IOException | RuntimeException e) {
            tessFailed = true;
            return false;
        }
    }

    /** Pääsäikeestä: vapautus jonotetaan tessWorkerin kautta, joten se ei koskaan osu kesken lukua (lukijan jono). */
    private void releaseIfIdle() {
        if (tessWorker.isShutdown()) {
            return;
        }
        tessWorker.execute(() -> {
            if (System.currentTimeMillis() - lastUse < IDLE_MS - 500) {
                return;
            }
            for (int i = 0; i < LANES; i++) {
                final int ln = i;
                lanes[ln].execute(() -> {
                    if (apis[ln] != null) {
                        apis[ln].recycle();
                        apis[ln] = null;
                    }
                });
            }
        });
    }

    /** Lukijan oma Tesseract (luodaan ensimmäisellä käytöllä, vain lukijan omassa säikeessä). */
    private TessBaseAPI api(int lane) {
        if (apis[lane] != null || tessFailed) {
            return apis[lane];
        }
        try {
            TessBaseAPI api = new TessBaseAPI();
            if (!api.init(new File(activity.getFilesDir(), "tesseract").getAbsolutePath(), "smi", TessBaseAPI.OEM_LSTM_ONLY)) {
                api.recycle();
                tessFailed = true;
                return null;
            }
            api.setPageSegMode(TessBaseAPI.PageSegMode.PSM_SINGLE_LINE);
            apis[lane] = api;
        } catch (RuntimeException e) {
            tessFailed = true;
        }
        return apis[lane];
    }

    /** Sana kuvasta Tesseractille: kierretty vaakasuoraan sanan keskipisteen ympäri, marginaalit (0,35 × korkeus
     *  sivuille, 0,3 ylös ja alas), korkeus 64 px, harmaa -> mustavalkoinen (kynnys 2. ja 98. prosenttipisteen
     *  puolivälissä; tumma tausta käännetään), 12 px valkoinen reuna. Sama käsittely kuin testipenkissä. */
    static Bitmap crop(Bitmap src, double cx, double cy, double w, double h, double angle) {
        if (!(w > 1 && h > 1) || Double.isNaN(cx) || Double.isNaN(cy)) {
            return null;
        }
        double cw = w + h * 0.7, ch = h * 1.6, k = 64 / ch;
        int ow = (int) Math.max(8, Math.min(2000, Math.round(cw * k))), oh = 64;
        Bitmap c = Bitmap.createBitmap(ow, oh, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(c);
        canvas.drawColor(Color.WHITE);
        Matrix m = new Matrix();
        m.postTranslate((float) -cx, (float) -cy);
        m.postRotate((float) -angle);
        m.postScale((float) k, (float) k);
        m.postTranslate(ow / 2f, oh / 2f);
        canvas.drawBitmap(src, m, new Paint(Paint.FILTER_BITMAP_FLAG));
        int[] px = new int[ow * oh];
        c.getPixels(px, 0, ow, 0, 0, ow, oh);
        int[] hist = new int[256];
        long sum = 0;
        for (int i = 0; i < px.length; i++) {
            int p = px[i];
            int g = (299 * ((p >> 16) & 255) + 587 * ((p >> 8) & 255) + 114 * (p & 255)) / 1000;
            px[i] = g;
            hist[g]++;
            sum += g;
        }
        boolean invert = sum / px.length < 110;
        int lo = percentile(hist, px.length, invert ? 0.98 : 0.02), hi = percentile(hist, px.length, invert ? 0.02 : 0.98);
        if (invert) {
            lo = 255 - lo;
            hi = 255 - hi;
        }
        double t = (lo + hi) / 2.0;
        int bw = ow + 24, bh = oh + 24;
        int[] out = new int[bw * bh];
        java.util.Arrays.fill(out, Color.WHITE);
        for (int y = 0; y < oh; y++) {
            for (int x = 0; x < ow; x++) {
                int g = px[y * ow + x];
                if (invert) {
                    g = 255 - g;
                }
                out[(y + 12) * bw + x + 12] = g > t ? Color.WHITE : Color.BLACK;
            }
        }
        c.recycle();
        return Bitmap.createBitmap(out, bw, bh, Bitmap.Config.ARGB_8888);
    }

    private static int percentile(int[] hist, int n, double q) {
        long target = Math.round(q * (n - 1)), seen = 0;
        for (int g = 0; g < 256; g++) {
            seen += hist[g];
            if (seen > target) {
                return g;
            }
        }
        return 255;
    }

    private void sendError(String code) {
        send("{\"error\":" + JSONObject.quote(code) + "}");
    }

    private void send(String json) {
        send(json, "ocrResult");
    }

    private void send(String json, String fn) {
        web.post(() -> web.evaluateJavascript("window." + fn + " && " + fn + "(" + json + ")", null));
    }

    void close() {
        if (recognizer != null) {
            recognizer.close();
        }
        worker.shutdown();
        serial++;  // keskeneräinen toinen luku lopettaa
        main.removeCallbacks(idleRelease);
        tessWorker.shutdown();
        for (int i = 0; i < LANES; i++) {
            final int ln = i;
            lanes[ln].execute(() -> {
                if (apis[ln] != null) {
                    apis[ln].recycle();
                    apis[ln] = null;
                }
            });
            lanes[ln].shutdown();
        }
    }
}
