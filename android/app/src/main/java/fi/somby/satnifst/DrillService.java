package fi.somby.satnifst;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Sanastojen kuunteluharjoitus (web/harjoitus.js) näytön ollessa pois päältä: kysymys (esim. Harri: "maanantai"),
 * miettimisaika, vastaus (Biret: "vuossárga"), tauko, seuraava sana; pakan lopussa uusi kierros. Soitto jatkuu, kunnes
 * käyttäjä pysäyttää sen (sivulta, ilmoituksesta tai lukitusnäytöltä) tai sulkee sovelluksen.
 * Etualan palvelu (mediaPlayback), mediaistunto ja ilmoitus; osittainen herätyslukko pitää ajastimet käynnissä
 * miettimistaukojen aikana, kun mikään ei soi. Äänet APK:n assets-kansiosta (web/audio/w/). Tila sivulle
 * Listener-kutsuina (MainActivity: window.satniDrill.event).
 */
public final class DrillService extends Service {
    interface Listener { void onDrillEvent(String json); }

    static final String ACTION_START = "start", ACTION_PAUSE = "pause", ACTION_PLAY = "play", ACTION_NEXT = "next",
            ACTION_STOP = "stop";
    private static final String CHANNEL = "harjoitus";
    private static final int NOTIFICATION = 7;

    static volatile Listener listener;
    static volatile String pendingConfig;   // harjoitus.js -> MainActivity.drillStart -> tähän ennen käynnistystä
    private static DrillService running;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final List<String[]> items = new ArrayList<>();  // [kysymys.ogg, vastaus.ogg, kysymys, vastaus, lista]
    private final List<Integer> order = new ArrayList<>();
    private int pos, round = 1, think = 3, gap = 1500, count;
    private boolean shuffle, paused;
    private String phase = "ask";
    private int generation;           // vanhentuneet ajastimet ja soiton loput ohitetaan
    private String title = "Sátni FST", tPause = "Pause", tPlay = "Play", tNext = "Next", tStop = "Stop";
    private MediaPlayer player;
    private MediaSession session;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audio;
    private AudioFocusRequest focusRequest;

    /** Käynnistys sivulta (JavaScript-säie). */
    static void start(Context ctx, String config) {
        pendingConfig = config;
        Intent i = new Intent(ctx, DrillService.class).setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i); else ctx.startService(i);
    }

    /** Ohjaus sivulta: pause, play, next, stop. Ei käynnistä palvelua, jos se ei ole käynnissä. */
    static void control(Context ctx, String cmd) {
        new Handler(Looper.getMainLooper()).post(() -> {
            if (running != null) running.handle(cmd);
        });
    }

    /** Sivu palasi näkyviin tai latautui uudelleen: koko tila uudelleen. */
    static void resend() {
        new Handler(Looper.getMainLooper()).post(() -> {
            if (running != null) running.emit("state", true);
        });
    }

    @Override
    public void onCreate() {
        super.onCreate();
        running = this;
        audio = getSystemService(AudioManager.class);
        PowerManager pm = getSystemService(PowerManager.class);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "satnifst:harjoitus");
        wakeLock.setReferenceCounted(false);
        session = new MediaSession(this, "SatniHarjoitus");
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { handle(ACTION_PLAY); }
            @Override public void onPause() { handle(ACTION_PAUSE); }
            @Override public void onSkipToNext() { handle(ACTION_NEXT); }
            @Override public void onStop() { handle(ACTION_STOP); }
        });
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Harjoitus", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            ch.setSound(null, null);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_START.equals(action)) {
            halt();  // uusi harjoitus vanhan päälle
            if (!configure(pendingConfig)) {
                stopSelf();
                return START_NOT_STICKY;
            }
            pendingConfig = null;
            goForeground();
            if (!requestFocus()) paused = true;
            session.setActive(true);
            wakeLock.acquire(4 * 60 * 60 * 1000L);  // yläraja: unohtunut harjoitus ei pidä laitetta hereillä loputtomiin
            emit("state", true);
            if (!paused) step();
            else refresh();
        } else if (action != null) {
            handle(action);
        }
        return START_NOT_STICKY;
    }

    private boolean configure(String json) {
        if (json == null) return false;
        try {
            JSONObject c = new JSONObject(json);
            JSONArray a = c.getJSONArray("items");
            items.clear();
            order.clear();
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.getJSONObject(i);
                items.add(new String[] { o.getString("q"), o.getString("a"), o.optString("qt"), o.optString("at"), o.optString("list") });
                order.add(i);
            }
            if (items.isEmpty()) return false;
            think = Math.max(1, Math.min(15, c.optInt("think", 3)));
            gap = Math.max(300, Math.min(5000, c.optInt("gap", 1500)));
            shuffle = c.optBoolean("shuffle", true);  // pakka tulee sivulta valmiiksi sekoitettuna; kierroksen jälkeen uudelleen
            title = c.optString("title", title);
            tPause = c.optString("pause", tPause);
            tPlay = c.optString("play", tPlay);
            tNext = c.optString("next", tNext);
            tStop = c.optString("stop", tStop);
            pos = 0;
            round = 1;
            paused = false;
            generation++;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void handle(String cmd) {
        switch (cmd) {
            case ACTION_PAUSE:
                if (paused) return;
                paused = true;
                halt();
                emit("state", false);
                refresh();
                break;
            case ACTION_PLAY:
                if (!paused) return;
                if (!requestFocus()) return;
                paused = false;
                emit("state", false);
                step();  // kesken jäänyt sana alusta
                break;
            case ACTION_NEXT:
                halt();
                paused = false;
                advance();
                break;
            case ACTION_STOP:
                stopDrill();
                break;
            default:
                break;
        }
    }

    private String[] current() { return items.get(order.get(pos % order.size())); }

    private void step() {
        if (paused) return;
        int gen = ++generation;
        phase = "ask";
        emit("phase", false);
        refresh();
        play(current()[0], gen, () -> {
            phase = "think";
            count = think;
            emit("phase", false);
            tick(gen);
        });
    }

    private void tick(int gen) {
        handler.postDelayed(() -> {
            if (gen != generation || paused) return;
            count--;
            if (count > 0) {
                emit("count", false);
                tick(gen);
                return;
            }
            phase = "show";
            emit("phase", false);
            refresh();
            play(current()[1], gen, () -> handler.postDelayed(() -> {
                if (gen == generation && !paused) advance();
            }, gap));
        }, 1000);
    }

    private void advance() {
        pos++;
        boolean wrapped = pos % order.size() == 0;
        if (wrapped) {
            round++;
            if (shuffle) Collections.shuffle(order);
        }
        if (wrapped) emit("state", true);
        step();
    }

    /** Yksi ääni assets-kansiosta; done ajetaan soiton jälkeen (myös virheessä, ettei harjoitus jää jumiin). */
    private void play(String path, int gen, Runnable done) {
        releasePlayer();
        Runnable finish = () -> { if (gen == generation && !paused) done.run(); };
        try (AssetFileDescriptor fd = getAssets().openFd(path)) {
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            mp.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
            mp.setOnCompletionListener(m -> finish.run());
            mp.setOnErrorListener((m, w, e) -> { handler.postDelayed(finish, 800); return true; });
            mp.prepare();
            mp.start();
            player = mp;
        } catch (Exception e) {
            handler.postDelayed(finish, 800);
        }
    }

    private void releasePlayer() {
        if (player == null) return;
        try { player.stop(); } catch (IllegalStateException ignored) { }
        player.release();
        player = null;
    }

    private void halt() {
        generation++;
        handler.removeCallbacksAndMessages(null);
        releasePlayer();
    }

    private void stopDrill() {
        halt();
        emit("stop", false);
        stopForeground(true);
        stopSelf();
    }

    // --- Äänen kohdistus: puhelu tai toinen soitin keskeyttää harjoituksen ---
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) handle(ACTION_PAUSE);
    };

    private boolean requestFocus() {
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusRequest == null) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                        .setOnAudioFocusChangeListener(focusListener, handler).build();
            }
            return audio.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        }
        return audio.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
                == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    @SuppressWarnings("deprecation")
    private void abandonFocus() {
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusRequest != null) audio.abandonAudioFocusRequest(focusRequest);
        } else {
            audio.abandonAudioFocus(focusListener);
        }
    }

    // --- Ilmoitus ja mediaistunto ---
    private void goForeground() {
        Notification n = buildNotification();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTIFICATION, n);
    }

    private void refresh() {
        PlaybackState.Builder st = new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_STOP)
                .setState(paused ? PlaybackState.STATE_PAUSED : PlaybackState.STATE_PLAYING, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f);
        session.setPlaybackState(st.build());
        session.setMetadata(new android.media.MediaMetadata.Builder()
                .putString(android.media.MediaMetadata.METADATA_KEY_TITLE, line())
                .putString(android.media.MediaMetadata.METADATA_KEY_ARTIST, title).build());
        getSystemService(NotificationManager.class).notify(NOTIFICATION, buildNotification());
    }

    private String line() {
        String[] it = current();
        return "show".equals(phase) ? it[2] + " → " + it[3] : it[2] + " → …";
    }

    private PendingIntent action(String a, int code) {
        Intent i = new Intent(this, DrillService.class).setAction(a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @SuppressWarnings("deprecation")
    private Notification buildNotification() {
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String[] it = items.isEmpty() ? null : current();
        b.setSmallIcon(R.drawable.ic_harjoitus)
                .setContentTitle(title)
                .setContentText(it == null ? "" : line() + "  ·  " + ((pos % order.size()) + 1) + " / " + order.size())
                .setSubText(it == null ? null : it[4])
                .setContentIntent(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE))
                .setDeleteIntent(action(ACTION_STOP, 4))
                .setOngoing(!paused)
                .setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(new Notification.Action.Builder(null, tStop, action(ACTION_STOP, 1)).build())
                .addAction(new Notification.Action.Builder(null, paused ? tPlay : tPause, action(paused ? ACTION_PLAY : ACTION_PAUSE, 2)).build())
                .addAction(new Notification.Action.Builder(null, tNext, action(ACTION_NEXT, 3)).build())
                .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_LOW).setSound(null);
        return b.build();
    }

    // --- Tapahtumat sivulle ---
    private void emit(String type, boolean full) {
        Listener l = listener;
        if (l == null || order.isEmpty()) return;
        try {
            JSONObject e = new JSONObject().put("type", type).put("pos", pos).put("round", round).put("paused", paused)
                    .put("phase", type.equals("stop") ? JSONObject.NULL : phase).put("count", count);
            if (full) e.put("order", new JSONArray(order));
            l.onDrillEvent(e.toString());
        } catch (Exception ignored) {
            // JSON ei epäonnistu näillä arvoilla
        }
    }

    /** Sovellus pyyhkäistiin pois viimeisimmistä: harjoitus loppuu. */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopDrill();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        halt();
        abandonFocus();
        session.setActive(false);
        session.release();
        if (wakeLock.isHeld()) wakeLock.release();
        if (running == this) running = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
