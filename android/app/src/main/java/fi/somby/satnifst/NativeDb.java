package fi.somby.satnifst;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteCursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteQuery;
import android.util.Log;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * sql-test, vaihe 0: sanakirja laitteen omalla SQLitellä (window.SatniNativeDb). Tiedosto kopioidaan APK:n
 * assets-kansiosta (data/satni-web.db) sovelluksen omaan kansioon kerran versiota kohden, ja kyselyt ajetaan
 * vain luku -tilassa. query() palauttaa koko tuloksen kerralla JSONina: {"cols":[..],"rows":[[..],..]}.
 * Parametrit sidotaan tyypin mukaan (kokonaisluku, liukuluku, teksti, NULL) kuten sql.js:ssä.
 */
public class NativeDb {
    private static final String TAG = "SatniNativeDb";
    private final Context ctx;
    // Yhteiset kaikille aktiviteetin instansseille: uudelleenluotu aktiviteetti ei avaa tiedostoa uudelleen
    private static volatile SQLiteDatabase db;
    private static volatile String state = "idle";  // idle, copying, ready, error: ...
    private static volatile long copied = 0;
    private static volatile long total = 0;

    NativeDb(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

    /** Käynnistää kopioinnin ja avauksen taustasäikeessä; tila luetaan status()-kutsulla. */
    @JavascriptInterface
    public void open() {
      synchronized (NativeDb.class) {
        if (!"idle".equals(state) && !state.startsWith("error")) return;
        state = "copying";
        new Thread(() -> {
            try {
                File dir = ctx.getFilesDir();
                // Asennus- tai päivitysaika muuttuu jokaisessa asennuksessa (myös DEV-käännöksissä, joissa versionCode voi
                // pysyä samana mutta sanakirja muuttua), joten uusi APK kopioi aina oman tiedostonsa
                long installed = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).lastUpdateTime;
                File f = new File(dir, "satni-web-" + BuildConfig.VERSION_CODE + "-" + installed + ".db");
                long t0 = System.nanoTime();
                if (!f.exists()) {
                    File tmp = new File(f.getPath() + ".tmp");
                    try (InputStream in = ctx.getAssets().open("data/satni-web.db")) {
                        total = in.available();
                        // Tilaa tarvitaan tiedoston verran ja vähän päälle; muuten sovellus käyttää sql.js:ää
                        if (dir.getUsableSpace() < total + (32L << 20)) throw new IllegalStateException("no space");
                        try (OutputStream out = new FileOutputStream(tmp)) {
                            byte[] buf = new byte[1 << 16];
                            for (int n; (n = in.read(buf)) > 0; ) { out.write(buf, 0, n); copied += n; }
                        }
                    }
                    if (!tmp.renameTo(f)) throw new IllegalStateException("rename failed");
                }
                // Vanhat versiot ja keskeytyneet kopiot pois
                File[] old = dir.listFiles((d, n) -> n.startsWith("satni-web-") && !n.equals(f.getName()));
                if (old != null) for (File o : old) o.delete();
                long t1 = System.nanoTime();
                try {
                    db = SQLiteDatabase.openDatabase(f.getPath(), null,
                            SQLiteDatabase.OPEN_READONLY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
                    db.rawQuery("SELECT count(*) FROM sqlite_master", null).close();
                } catch (RuntimeException e) {
                    f.delete();  // vioittunut tiedosto: seuraavalla käynnistyksellä kopioidaan uudelleen
                    throw e;
                }
                Log.i(TAG, "copy " + (t1 - t0) / 1000000 + " ms, open " + (System.nanoTime() - t1) / 1000000 + " ms, " + f.length() + " bytes");
                state = "ready";
            } catch (Throwable e) {
                Log.e(TAG, "open failed", e);
                state = "error: " + e;
            }
        }, "satni-nativedb-open").start();
      }
    }

    /** idle, copying, ready tai "error: …". */
    @JavascriptInterface
    public String status() { return state; }

    @JavascriptInterface
    public long copied() { return copied; }

    /** Kopioitavan tiedoston koko (tiedossa kopioinnin alettua; 0 ennen sitä). */
    @JavascriptInterface
    public long size() {
        if (total > 0) return total;
        try (InputStream in = ctx.getAssets().open("data/satni-web.db")) { return in.available(); } catch (Exception e) { return 0; }
    }

    /** Tarkistaa kyselyn kuten sql.js:n prepare: tyhjä merkkijono = kunnossa, muuten virheilmoitus. */
    @JavascriptInterface
    public String check(String sql) {
        SQLiteDatabase d = db;
        if (d == null) return "not ready";
        try { d.compileStatement(sql).close(); return ""; } catch (Throwable e) { return String.valueOf(e.getMessage()); }
    }

    /** Vaiheen 0 mittauksia varten: tila ja kopioidut tavut. */
    @JavascriptInterface
    public String state() { return state + " " + copied; }

    /** Tyhjä kutsu: sillan oma hinta. */
    @JavascriptInterface
    public String ping() { return ""; }

    @JavascriptInterface
    public String version() {
        SQLiteDatabase d = db;
        if (d == null) return "";
        try (Cursor c = d.rawQuery("select sqlite_version()", null)) { return c.moveToFirst() ? c.getString(0) : ""; }
    }

    @JavascriptInterface
    public String query(String sql, String paramsJson) {
        SQLiteDatabase d = db;
        if (d == null) return "{\"error\":\"not ready\"}";
        try {
            final JSONArray params = paramsJson == null || paramsJson.isEmpty() ? new JSONArray() : new JSONArray(paramsJson);
            SQLiteDatabase.CursorFactory factory = (sdb, driver, editTable, q) -> {
                bind(q, params);
                // Pienempi tulosikkuna kuin Androidin 2 Mt hidasti isoja tuloksia moninkertaisesti (vaihe 0)
                return new SQLiteCursor(driver, editTable, q);
            };
            try (Cursor c = d.rawQueryWithFactory(factory, sql, null, null)) {
                StringBuilder sb = new StringBuilder(256);
                String[] cols = c.getColumnNames();
                sb.append("{\"cols\":[");
                for (int i = 0; i < cols.length; i++) { if (i > 0) sb.append(','); str(sb, cols[i]); }
                sb.append("],\"rows\":[");
                boolean first = true;
                while (c.moveToNext()) {
                    if (!first) sb.append(',');
                    first = false;
                    sb.append('[');
                    for (int i = 0; i < cols.length; i++) {
                        if (i > 0) sb.append(',');
                        switch (c.getType(i)) {
                            case Cursor.FIELD_TYPE_NULL: sb.append("null"); break;
                            case Cursor.FIELD_TYPE_INTEGER: sb.append(c.getLong(i)); break;
                            case Cursor.FIELD_TYPE_FLOAT: {
                                double v = c.getDouble(i);
                                if (v == Math.rint(v) && Math.abs(v) < 1e15) sb.append((long) v); else sb.append(v);
                                break;
                            }
                            default: str(sb, c.getString(i));
                        }
                    }
                    sb.append(']');
                }
                return sb.append("]}").toString();
            }
        } catch (Throwable e) {
            StringBuilder sb = new StringBuilder("{\"error\":");
            str(sb, String.valueOf(e.getMessage()));
            return sb.append('}').toString();
        }
    }

    private static void bind(SQLiteQuery q, JSONArray params) {
        for (int i = 0; i < params.length(); i++) {
            Object v = params.opt(i);
            int idx = i + 1;
            if (v == null || v == JSONObjectNull.NULL) q.bindNull(idx);
            else if (v instanceof Integer || v instanceof Long) q.bindLong(idx, ((Number) v).longValue());
            else if (v instanceof Number) {
                double dv = ((Number) v).doubleValue();
                if (dv == Math.rint(dv) && Math.abs(dv) < 9e15) q.bindLong(idx, (long) dv); else q.bindDouble(idx, dv);
            } else if (v instanceof Boolean) q.bindLong(idx, (Boolean) v ? 1 : 0);
            else q.bindString(idx, v.toString());
        }
    }

    /** org.json:n NULL-arvo (JSONObject.NULL) ilman koko JSONObject-tuontia vertailuun. */
    private static final class JSONObjectNull { static final Object NULL = org.json.JSONObject.NULL; }

    private static void str(StringBuilder sb, String s) {
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < 0x20 || ch == 0x2028 || ch == 0x2029) sb.append(String.format("\\u%04x", (int) ch));
                    else sb.append(ch);
            }
        }
        sb.append('"');
    }
}
