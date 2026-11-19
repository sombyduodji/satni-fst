package fi.somby.satnifst;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Sátni FST Androidille: sama web-käyttöliittymä kuin PWA:ssa ja työpöytäversiossa (web/).
 *
 * Tiedostot luetaan APK:n assets-kansiosta osoitteella https://appassets.androidplatform.net/,
 * koska file://-osoitteista selain ei salli sanakirjan lataamista eikä välimuistia (sama syy kuin
 * työpöytäversion satni://-osoitteessa). Ulkoiset linkit (Giellatekno, sähköposti) avataan muissa
 * sovelluksissa, ja takaisin-painike kulkee sovelluksen omassa historiassa (#/sana/...).
 * Muista sovelluksista jaettu teksti (Jaa -> Sátni FST) avataan suoraan hakuna (openShared, web/app.js).
 * Valokuvan tekstistä voi hakea sanoja (tekstintunnistus, ks. Ocr).
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";

    private static final Map<String, String> MIME_TYPES = new HashMap<>();
    static {
        MIME_TYPES.put("html", "text/html");
        MIME_TYPES.put("js", "text/javascript");
        MIME_TYPES.put("css", "text/css");
        MIME_TYPES.put("json", "application/json");
        MIME_TYPES.put("webmanifest", "application/manifest+json");
        MIME_TYPES.put("wasm", "application/wasm");
        MIME_TYPES.put("png", "image/png");
        MIME_TYPES.put("svg", "image/svg+xml");
        MIME_TYPES.put("gz", "application/octet-stream");  // sanakirja, ks. openAsset
    }

    private WebView web;
    private Ocr ocr;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        // Android 15 piirtää sovelluksen tilarivin ja navigointipalkin alle: sisältö niiden väliin.
        // Reunus asetetaan ympäröivälle kehykselle, koska WebView ei huomioi omaa reunustaan.
        FrameLayout root = new FrameLayout(this);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        // Tilarivin alue yläpalkin värillä, jottei se näy erillisenä harmaana raitana
        View statusBar = new View(this);
        statusBar.setBackgroundColor(getColor(R.color.topbar));
        root.addView(statusBar, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, 0, Gravity.TOP));
        root.setClipToPadding(false);  // tilarivin väri piirretään reunuksen alueelle
        setContentView(root);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            lastInsets = insets;
            view.post(() -> applyInsets(view, statusBar));  // sijainti tiedetään vasta asettelun jälkeen
            return insets;
        });

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);  // asetukset, historia ja suosikit (localStorage)
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        // Ääntäminen soitetaan vasta, kun ääni on haettu verkosta (napautuksen jälkeen)
        settings.setMediaPlaybackRequiresUserGesture(false);
        // Tekstin koko (Asetukset → Kieli ja ulkoasu, app.js: applyTextSize): tallennettu valinta heti, ennen sivun
        // latautumista, ettei teksti hyppää; -1 = laitteen fonttikoko (Asetukset → Näyttö → Fonttikoko)
        applyTextZoom(getPreferences(MODE_PRIVATE).getInt(PREF_TEXT_ZOOM, -1));

        // Ei venytystä reunojen yli vierittäessä (sovellus ei ole verkkosivu)
        web.setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new Client());
        // Vain sovelluksen omat sivut latautuvat WebViewiin (ulkoiset linkit avataan muissa sovelluksissa)
        ocr = new Ocr(this, web);
        web.addJavascriptInterface(ocr, "SatniOcr");
        web.addJavascriptInterface(new AppBridge(), "SatniApp");
        // Kuunteluharjoituksen tila sivulle (DrillService soittaa myös näytön ollessa pois päältä)
        DrillService.listener = json -> web.post(() ->
                web.evaluateJavascript("window.satniDrill && satniDrill.event(" + json + ")", null));
        // Android 13+: takaisin-ele tulee tätä kautta (onBackPressed ei aina tule kutsutuksi)
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBackOrFinish);
        }
        String shared = sharedText(getIntent());
        if (shared != null) {
            web.loadUrl(START_URL + "?text=" + Uri.encode(shared));
        } else if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(START_URL);
        }
    }

    /** Sovellus on jo auki (launchMode singleTask): uusi jaettu teksti haetaan samassa ikkunassa. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String shared = sharedText(intent);
        if (shared == null) {
            return;
        }
        String text = JSONObject.quote(shared);
        web.evaluateJavascript("window.openShared ? openShared(" + text + ")"
                + " : location.replace('index.html?text=' + encodeURIComponent(" + text + "))", null);
    }

    /** Jaa-toiminnon (SEND) teksti, muuten null. */
    private static String sharedText(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return null;
        }
        CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        return text == null || text.toString().trim().isEmpty() ? null : text.toString();
    }

    private WindowInsets lastInsets;

    /**
     * Reunus vain sen verran kuin tilarivi, navigointipalkki ja näppäimistö oikeasti peittävät sovellusta.
     * Android 15 piirtää sovelluksen palkkien alle (tarvitaan reunus). Vanhemmissa ja osassa puhelimia
     * Android sijoittaa sovelluksen jo valmiiksi palkkien ja kameran reiän alapuolelle, vaikka ilmoittaa
     * palkit silti: silloin reunus olisi ylimääräinen tyhjä alue. Peitto = palkki miinus se, kuinka
     * paljon sisältö on jo valmiiksi siirretty ikkunan reunasta.
     */
    private void applyInsets(View view, View statusBar) {
        if (lastInsets == null) {
            return;
        }
        int top, bottom, left, right;
        if (Build.VERSION.SDK_INT >= 30) {
            android.graphics.Insets bars = lastInsets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
            top = bars.top; bottom = bars.bottom; left = bars.left; right = bars.right;
        } else {
            top = lastInsets.getSystemWindowInsetTop(); bottom = lastInsets.getSystemWindowInsetBottom();
            left = lastInsets.getSystemWindowInsetLeft(); right = lastInsets.getSystemWindowInsetRight();
        }
        View window = view.getRootView();
        int[] v = new int[2], w = new int[2];
        view.getLocationInWindow(v);
        window.getLocationInWindow(w);
        int offsetTop = v[1] - w[1];
        int offsetBottom = (w[1] + window.getHeight()) - (v[1] + view.getHeight());
        top = Math.max(0, top - offsetTop);
        bottom = Math.max(0, bottom - offsetBottom);
        if (view.getPaddingTop() != top || view.getPaddingBottom() != bottom
                || view.getPaddingLeft() != left || view.getPaddingRight() != right) {
            view.setPadding(left, top, right, bottom);
        }
        statusBar.getLayoutParams().height = top;
        statusBar.setTranslationY(-top);  // reunuksen alueelle, WebViewin yläpuolelle
        statusBar.requestLayout();
    }

    /** Tietoa-ikkunaan sovelluksen versionumero (teksti käyttöliittymän kielellä, ks. web/i18n.js). */
    private void showVersion(WebView view) {
        String version;
        try {
            version = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (android.content.pm.PackageManager.NameNotFoundException e) {
            return;
        }
        view.evaluateJavascript("window.SATNI_VERSION = '" + version + "'; window.SATNI_PLATFORM = 'android';"
                + " if (window.applyStaticTexts) applyStaticTexts();", null);
    }

    // Näppäimistö takaisin, kun ikkuna saa kohdistuksen takaisin (OnePlus OxygenOS 16: Gboardin näppäimistön vaihto
    // välilyönnin pitkällä painalluksella sulki näppäimistön; Android 15 ja 16 -emulaattoreissa sitä ei tapahdu).
    // Vain jos näppäimistö oli auki ikkunan menettäessä kohdistuksen, sovellus ei käynyt taustalla välillä ja keskeytys
    // oli lyhyt (kuten kielen valinta Gboardin ikkunasta): pidemmän keskeytyksen (keskustelukupla, jaettu näyttö)
    // jälkeen näppäimistö ei avaudu itsestään.
    private static final long RESTORE_MAX_MS = 15000;
    private boolean imeOpenWhenFocusLost;
    private boolean pausedSinceFocusLost;
    private long focusLostAt;

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) {
            imeOpenWhenFocusLost = imeVisible();
            pausedSinceFocusLost = false;
            focusLostAt = android.os.SystemClock.uptimeMillis();
            if (imeOpenWhenFocusLost) {
                web.evaluateJavascript("window.__satniImeField = document.activeElement"
                        + " && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) ? document.activeElement : null", null);
            }
            return;
        }
        if (imeOpenWhenFocusLost && !pausedSinceFocusLost
                && android.os.SystemClock.uptimeMillis() - focusLostAt < RESTORE_MAX_MS) {
            web.postDelayed(this::restoreKeyboard, 300);  // näppäimistö ehtii palata itsestään, jos se palaa
        }
        imeOpenWhenFocusLost = false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        DrillService.resend();  // näyttö takaisin päälle: harjoituskortti vastaamaan soittoa
    }

    @Override
    protected void onPause() {
        super.onPause();
        pausedSinceFocusLost = true;
    }

    private void restoreKeyboard() {
        if (imeVisible()) {
            return;
        }
        // Sama kenttä uudelleen valituksi vain, jos kohdistus ei ole siirtynyt muualle (esim. käyttäjän napautus)
        web.evaluateJavascript("(function () { var f = window.__satniImeField, a = document.activeElement;"
                + " window.__satniImeField = null;"
                + " if (!f || !f.isConnected || f.disabled || f.offsetParent === null) return false;"
                + " if (a !== f && a && a !== document.body) return false;"
                + " if (a !== f) f.focus({ preventScroll: true });"
                + " return document.activeElement === f; })()", result -> {
            if ("true".equals(result)) {
                web.requestFocus();
                android.view.inputmethod.InputMethodManager imm = getSystemService(android.view.inputmethod.InputMethodManager.class);
                if (imm != null) {
                    imm.showSoftInput(web, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
                }
            }
        });
    }

    /** Onko näppäimistö näkyvissä. Android 11+: ikkunan reunusten tieto; vanhemmat: näkyvä alue on yli 15 %
     *  ikkunaa matalampi (näppäimistö peittää alaosan, windowSoftInputMode = adjustResize). */
    private boolean imeVisible() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsets insets = web.getRootWindowInsets();
            return insets != null && insets.isVisible(WindowInsets.Type.ime());
        }
        View root = web.getRootView();
        android.graphics.Rect visible = new android.graphics.Rect();
        root.getWindowVisibleDisplayFrame(visible);
        int height = root.getHeight();
        return height > 0 && height - visible.bottom > height * 0.15;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (!ocr.onResult(requestCode, resultCode, data)) {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    /** Takaisin: ensin suljetaan avoin tekstintunnistusnäkymä tai valikko (☰); kuvasta avatusta sanasta palataan
     *  kuvaan; sitten edellinen haku (#/sana/...) tai aloitussivu;
     *  vasta sen jälkeen sovellus suljetaan. */
    private void goBackOrFinish() {
        web.evaluateJavascript("(window.closeFormPop && closeFormPop()) || (window.closeOcr && closeOcr())"
                + " || (window.backToOcr && backToOcr())"
                + " || (window.closeDrawer ? closeDrawer() : false)", result -> {
            if ("true".equals(result)) {
                return;
            }
            if (web.canGoBack()) {
                web.goBack();
            } else {
                finish();
            }
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        goBackOrFinish();  // Android 12 ja vanhemmat
    }

    @Override
    protected void onDestroy() {
        DrillService.listener = null;
        // Sovellus suljettiin (takaisin viimeisestä näkymästä): harjoitus loppuu
        if (isFinishing()) DrillService.control(this, DrillService.ACTION_STOP);
        ocr.close();
        web.destroy();
        super.onDestroy();
    }

    /**
     * Android-käännös purkaa .gz-päätteiset assetit ja tallentaa ne ilman päätettä: data/satni-web.db.gz
     * on APK:ssa data/satni-web.db. Web-käyttöliittymä purkaa tiedoston vain, jos se on yhä pakattu.
     */
    private InputStream openAsset(String path) throws IOException {
        try {
            return getAssets().open(path);
        } catch (IOException e) {
            if (!path.endsWith(".gz")) {
                throw e;
            }
            return getAssets().open(path.substring(0, path.length() - 3));
        }
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (HOST.equals(url.getHost())) {
                return false;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url));
            } catch (ActivityNotFoundException e) {
                // Ei sovellusta, joka osaisi avata linkin
            }
            return true;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            showVersion(view);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (!HOST.equals(url.getHost())) {
                return null;  // Ääntäminen: api-giellalt.uit.no verkosta
            }
            String path = url.getPath() == null || url.getPath().equals("/") ? "index.html" : url.getPath().substring(1);
            String ext = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : "";
            String mime = MIME_TYPES.containsKey(ext) ? MIME_TYPES.get(ext) : "application/octet-stream";
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            try {
                InputStream stream = openAsset(path);
                // Koko, jotta sanakirjan latauspalkki liikkuu (assetin available() = koko avattaessa)
                headers.put("Content-Length", String.valueOf(stream.available()));
                return new WebResourceResponse(mime, mime.startsWith("text/") ? "utf-8" : null, 200, "OK", headers, stream);
            } catch (IOException e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers, null);
            }
        }
    }

    private static final String PREF_TEXT_ZOOM = "textZoom";

    /** Tekstin zoomaus prosentteina; -1 = laitteen fonttikoko (fontScale), rajattu 50–300 %. */
    private void applyTextZoom(int percent) {
        int zoom = percent < 0 ? Math.round(getResources().getConfiguration().fontScale * 100) : percent;
        web.getSettings().setTextZoom(Math.max(50, Math.min(300, zoom)));
    }

    /** Sivulle näkyvä silta (window.SatniApp): vain tekstin koko. Tallennetaan, jotta se on käytössä heti seuraavalla
     *  käynnistyksellä ennen sivun latautumista. */
    private class AppBridge {
        /** Kuunteluharjoitus (web/harjoitus.js): soittolista, miettimisaika ja ilmoituksen tekstit JSONina. */
        @android.webkit.JavascriptInterface
        public void drillStart(String config) {
            DrillService.start(MainActivity.this, config);
        }

        /** Natiivi soitin vain Android 10+:lla: MediaPlayer soittaa Ogg Opus -tiedostoja vasta siitä alkaen. Vanhemmilla
         *  harjoitus soi sivun omalla soittimella (WebView soittaa Opusta kaikilla versioilla), ilman näytönsammutusta. */
        @android.webkit.JavascriptInterface
        public boolean drillSupported() {
            return Build.VERSION.SDK_INT >= 29;
        }

        /** pause, play, next, stop */
        @android.webkit.JavascriptInterface
        public void drillControl(String cmd) {
            DrillService.control(MainActivity.this, cmd);
        }

        @android.webkit.JavascriptInterface
        public void setTextZoom(int percent) {
            int value = percent < 0 ? -1 : Math.max(50, Math.min(300, percent));
            getPreferences(MODE_PRIVATE).edit().putInt(PREF_TEXT_ZOOM, value).apply();
            runOnUiThread(() -> applyTextZoom(value));
        }
    }
}
