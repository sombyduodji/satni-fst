package fi.somby.satnifst;

import android.content.Context;
import android.database.Cursor;
import android.database.CursorWindow;
import android.os.Build;
import android.database.sqlite.SQLiteCursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteDoneException;
import android.database.sqlite.SQLiteProgram;
import android.database.sqlite.SQLiteQuery;
import android.database.sqlite.SQLiteStatement;
import android.util.Log;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
    // Pienemmät tiedostot nimellä (vaihe 4): inari (smn), koltta (sms) ja sanaparit (fin-ngram, nob-ngram). Avataan vasta,
    // kun ominaisuus niitä tarvitsee, ja suljetaan, kun sovellus vapauttaa ne; kopio jää levylle seuraavaa kertaa varten.
    private static final Map<String, SQLiteDatabase> extra = new ConcurrentHashMap<>();
    private static final Map<String, String> extraState = new ConcurrentHashMap<>();
    private static final java.util.Set<String> EXTRA_NAMES = new java.util.HashSet<>(java.util.Arrays.asList("smn", "sms", "fin-ngram", "nob-ngram"));

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
                long t0 = System.nanoTime();
                db = copyAndOpen("web", true);
                Log.i(TAG, "copy+open " + (System.nanoTime() - t0) / 1000000 + " ms, " + total + " bytes");
                state = "ready";
            } catch (Throwable e) {
                Log.e(TAG, "open failed", e);
                state = "error: " + e;
            }
        }, "satni-nativedb-open").start();
      }
    }

    /** APK:n data/satni-{name}.db sovelluksen kansioon (kerran asennusta kohden) ja avaus vain luku -tilassa. */
    private SQLiteDatabase copyAndOpen(String name, boolean progress) throws Exception {
        File dir = ctx.getFilesDir();
        long installed = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).lastUpdateTime;
        String prefix = "satni-" + name + "-";
        File f = new File(dir, prefix + BuildConfig.VERSION_CODE + "-" + installed + ".db");
        if (!f.exists()) {
            File tmp = new File(f.getPath() + ".tmp");
            try (InputStream in = ctx.getAssets().open("data/satni-" + name + ".db")) {
                long size = in.available();
                if (progress) total = size;
                // Tilaa tarvitaan tiedoston verran ja vähän päälle; muuten sovellus käyttää sql.js:ää
                if (dir.getUsableSpace() < size + (32L << 20)) throw new IllegalStateException("no space");
                try (OutputStream out = new FileOutputStream(tmp)) {
                    byte[] buf = new byte[1 << 16];
                    for (int n; (n = in.read(buf)) > 0; ) { out.write(buf, 0, n); if (progress) copied += n; }
                }
            }
            if (!tmp.renameTo(f)) throw new IllegalStateException("rename failed");
        }
        // Saman tiedoston vanhat versiot ja keskeytyneet kopiot pois ("satni-fin-" ei osu "satni-fin-ngram-"-tiedostoihin
        // eikä päinvastoin, koska nimen jälkeen tulee versionumero)
        File[] old = dir.listFiles((d, n) -> n.startsWith(prefix) && !n.equals(f.getName())
                && n.length() > prefix.length() && Character.isDigit(n.charAt(prefix.length())));
        if (old != null) for (File o : old) o.delete();
        try {
            SQLiteDatabase d = SQLiteDatabase.openDatabase(f.getPath(), null,
                    SQLiteDatabase.OPEN_READONLY | SQLiteDatabase.NO_LOCALIZED_COLLATORS);
            d.rawQuery("SELECT count(*) FROM sqlite_master", null).close();
            return d;
        } catch (RuntimeException e) {
            f.delete();  // vioittunut tiedosto: seuraavalla kerralla kopioidaan uudelleen
            throw e;
        }
    }

    /** Pienempi tiedosto nimellä (smn, sms, fin-ngram, nob-ngram) taustasäikeessä; tila: extraStatus(name). */
    @JavascriptInterface
    public void openExtra(String name) {
        if (!EXTRA_NAMES.contains(name)) { extraState.put(String.valueOf(name), "error: unknown"); return; }
        synchronized (extraState) {
            String st = extraState.get(name);
            if (st != null && !st.startsWith("error") && !"closed".equals(st)) return;
            extraState.put(name, "copying");
        }
        new Thread(() -> {
            try {
                long t0 = System.nanoTime();
                SQLiteDatabase d = copyAndOpen(name, false);
                extra.put(name, d);
                Log.i(TAG, name + ": " + (System.nanoTime() - t0) / 1000000 + " ms");
                extraState.put(name, "ready");
            } catch (Throwable e) {
                Log.e(TAG, "openExtra " + name, e);
                extraState.put(name, "error: " + e);
            }
        }, "satni-nativedb-" + name).start();
    }

    /** idle, copying, ready, closed tai "error: …". */
    @JavascriptInterface
    public String extraStatus(String name) {
        String st = extraState.get(String.valueOf(name));
        return st == null ? "idle" : st;
    }

    // Yhden arvon kyselyt (scalarIn): käännetty lause tallessa, jolloin toistuvat pienet haut (inarin muodot, sanaparit)
    // eivät luo joka kerta kursoria ja tulosikkunaa. Kaikki sillan kutsut tulevat samasta säikeestä.
    private static final Map<String, SQLiteStatement> scalarStmts = new ConcurrentHashMap<>();

    /** Sulkee tiedoston (muisti vapaaksi); kopio jää levylle. */
    @JavascriptInterface
    public void closeExtra(String name) {
        String pre = String.valueOf(name) + "\u0000";
        for (Map.Entry<String, SQLiteStatement> e : scalarStmts.entrySet()) {
            if (e.getKey().startsWith(pre)) { e.getValue().close(); scalarStmts.remove(e.getKey()); }
        }
        SQLiteDatabase d = extra.remove(String.valueOf(name));
        if (d != null) d.close();
        if (extraState.containsKey(String.valueOf(name))) extraState.put(name, "closed");
    }

    @JavascriptInterface
    public String checkIn(String name, String sql) {
        SQLiteDatabase d = extra.get(String.valueOf(name));
        if (d == null) return "not ready";
        try { d.compileStatement(sql).close(); return ""; } catch (Throwable e) { return String.valueOf(e.getMessage()); }
    }

    /** Ensimmäisen rivin ensimmäinen arvo tekstinä JSONissa {"v":"…"}, {"v":null} (NULL) tai {"none":true} (ei riviä). */
    @JavascriptInterface
    public String scalarIn(String name, String sql, String paramsJson) {
        SQLiteDatabase d = extra.get(String.valueOf(name));
        if (d == null) return "{\"error\":\"not ready\"}";
        try {
            String key = name + "\u0000" + sql;
            SQLiteStatement st = scalarStmts.get(key);
            if (st == null) { st = d.compileStatement(sql); scalarStmts.put(key, st); }
            st.clearBindings();
            bind(st, paramsJson == null || paramsJson.isEmpty() ? new JSONArray() : new JSONArray(paramsJson));
            String v;
            try { v = st.simpleQueryForString(); } catch (SQLiteDoneException e) { return "{\"none\":true}"; }
            if (v == null) return "{\"v\":null}";
            StringBuilder sb = new StringBuilder("{\"v\":");
            str(sb, v);
            return sb.append('}').toString();
        } catch (Throwable e) {
            StringBuilder sb = new StringBuilder("{\"error\":");
            str(sb, String.valueOf(e.getMessage()));
            return sb.append('}').toString();
        }
    }

    @JavascriptInterface
    public String queryIn(String name, String sql, String paramsJson) {
        SQLiteDatabase d = extra.get(String.valueOf(name));
        return d == null ? "{\"error\":\"not ready\"}" : run(d, sql, paramsJson, true);
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
        return d == null ? "{\"error\":\"not ready\"}" : run(d, sql, paramsJson, false);
    }

    // Pienempien tiedostojen haut palauttavat muutaman rivin: Androidin oletusikkuna (2 Mt) varattiin joka haulla, ja se
    // teki toistuvista pienistä hauista 2-3 kertaa hitaampia kuin sql.js:llä (OnePlus Nord, vaihe 4). Isommat tulokset
    // jatkuvat seuraavaan ikkunaan automaattisesti.
    private static final int SMALL_WINDOW = 64 * 1024;

    private static String run(SQLiteDatabase d, String sql, String paramsJson, boolean small) {
        try {
            final JSONArray params = paramsJson == null || paramsJson.isEmpty() ? new JSONArray() : new JSONArray(paramsJson);
            SQLiteDatabase.CursorFactory factory = (sdb, driver, editTable, q) -> {
                bind(q, params);
                // Pienempi tulosikkuna kuin Androidin 2 Mt hidasti isoja tuloksia moninkertaisesti (vaihe 0)
                return new SQLiteCursor(driver, editTable, q);
            };
            try (Cursor c = d.rawQueryWithFactory(factory, sql, null, null)) {
                if (small && Build.VERSION.SDK_INT >= 28 && c instanceof SQLiteCursor)
                    ((SQLiteCursor) c).setWindow(new CursorWindow("satni-small", SMALL_WINDOW));
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

    private static void bind(SQLiteProgram q, JSONArray params) {
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
