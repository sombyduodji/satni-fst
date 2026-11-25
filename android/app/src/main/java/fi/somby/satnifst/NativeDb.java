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
    private volatile SQLiteDatabase db;
    private volatile String state = "idle";  // idle, copying, ready, error: ...
    private volatile long copied = 0;
    /** Kokeilu: kyselyn tulosikkunan koko tavuina (0 = Androidin oletus 2 Mt). */
    static volatile long WINDOW = 0;

    @JavascriptInterface
    public void setWindow(long bytes) { WINDOW = bytes; }

    NativeDb(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

    /** Käynnistää kopioinnin ja avauksen taustasäikeessä; tila luetaan state()-kutsulla. */
    @JavascriptInterface
    public synchronized void open() {
        if (!"idle".equals(state) && !state.startsWith("error")) return;
        state = "copying";
        new Thread(() -> {
            try {
                File f = new File(ctx.getFilesDir(), "satni-web-" + BuildConfig.VERSION_CODE + ".db");
                long t0 = System.nanoTime();
                if (!f.exists()) {
                    File tmp = new File(f.getPath() + ".tmp");
                    try (InputStream in = ctx.getAssets().open("data/satni-web.db");
                         OutputStream out = new FileOutputStream(tmp)) {
                        byte[] buf = new byte[1 << 16];
                        for (int n; (n = in.read(buf)) > 0; ) { out.write(buf, 0, n); copied += n; }
                    }
                    if (!tmp.renameTo(f)) throw new IllegalStateException("rename failed");
                    File[] old = ctx.getFilesDir().listFiles((d, n) -> n.startsWith("satni-web-") && !n.equals(f.getName()));
                    if (old != null) for (File o : old) o.delete();
                }
                long t1 = System.nanoTime();
                db = SQLiteDatabase.openDatabase(f.getPath(), null,
                        SQLiteDatabase.OPEN_READONLY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
                Log.i(TAG, "copy " + (t1 - t0) / 1000000 + " ms, open " + (System.nanoTime() - t1) / 1000000 + " ms, " + f.length() + " bytes");
                state = "ready";
            } catch (Throwable e) {
                Log.e(TAG, "open failed", e);
                state = "error: " + e;
            }
        }, "satni-nativedb-open").start();
    }

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
                SQLiteCursor cur = new SQLiteCursor(driver, editTable, q);
                // Oletusikkuna on 2 Mt (ashmem) joka kyselylle; pieni ikkuna riittää useimpiin ja täyttyy tarvittaessa uudelleen
                if (android.os.Build.VERSION.SDK_INT >= 28 && WINDOW > 0) cur.setWindow(new android.database.CursorWindow("q", WINDOW));
                return cur;
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
