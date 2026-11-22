package fi.somby.satnifst;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;

/**
 * Suosikit ja historia Play-versiosta BETA-versioon (käyttäjä 2026-11-22): vain yhteen suuntaan, vain luku.
 *
 * Julkaistu sovellus (fi.somby.satnifst) tallentaa suosikit ja historian JSONina (MainActivity.AppBridge.shareSave) ja
 * tarjoaa ne tästä. Vain BETA (fi.somby.satnifst.beta) saa lukea: lisäksi lupa on signature-tasoinen, joten muut
 * sovellukset eivät pääse siihen. BETA:n ja DEV:n omat kopiot tästä luokasta eivät palauta mitään (DEV pysyy erillään,
 * eikä mitään kulje BETA:sta takaisin). Ei kirjoitusta, ei verkkoa.
 */
public class ShareProvider extends ContentProvider {
    static final String STABLE = "fi.somby.satnifst";
    static final String BETA = "fi.somby.satnifst.beta";
    static final String PREFS = "satni-share";
    static final String KEY = "data";

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        Context ctx = getContext();
        if (ctx == null || !STABLE.equals(ctx.getPackageName()) || !BETA.equals(getCallingPackage())) return null;
        MatrixCursor c = new MatrixCursor(new String[] {"json"});
        c.addRow(new Object[] {ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "")});
        return c;
    }

    @Override
    public String getType(Uri uri) {
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        throw new UnsupportedOperationException("vain luku");
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        throw new UnsupportedOperationException("vain luku");
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        throw new UnsupportedOperationException("vain luku");
    }
}
