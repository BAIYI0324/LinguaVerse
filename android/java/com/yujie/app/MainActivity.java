package com.yujie.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;

/**
 * 语界 LinguaVerse v5.1 · WebView 外壳 (多级TTS)
 * TTS 链路 (音质优先, 逐级降级):
 *   ① 设备本地 TTS (Android TextToSpeech, 本文件桥接) — 音质最好, 完全本地
 *   ② JS 层 speechSynthesis (桌面/部分设备)
 *   ③ meSpeak.js 纯 JS 离线合成 — 零依赖兜底, 永不缺席
 *   ④ (可选) 网络公共 TTS API — 用户可在设置中开启
 */
public class MainActivity extends Activity {

  private static final String VIRTUAL_HOST = "https://localhost/";
  private WebView wv;
  private TextToSpeech tts;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    getWindow().setStatusBarColor(Color.parseColor("#FAF7F5"));
    getWindow().setNavigationBarColor(Color.parseColor("#FFFFFF"));
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      getWindow().getDecorView().setSystemUiVisibility(
          android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
              | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    }

    initTTS();

    wv = new WebView(this);
    WebSettings s = wv.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(true);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    s.setAllowContentAccess(true);
    s.setAllowFileAccess(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    s.setUserAgentString(s.getUserAgentString() + " LinguaVerse/5.1");

    // TTS 桥: JS 可调用 window.AndroidTTS.* 使用设备本地语音
    wv.addJavascriptInterface(new Object() {
      @JavascriptInterface
      public boolean isReady() { return tts != null; }

      @JavascriptInterface
      public void speak(String text, String lang, float rate, String callbackId) {
        if (tts == null) { done(callbackId); return; }
        try {
          tts.stop();
          HashMap<String, String> params = new HashMap<>();
          params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, callbackId);
          Locale loc = localeFor(lang);
          tts.setLanguage(loc);
          tts.setSpeechRate(Math.max(0.5f, Math.min(2.5f, rate)));
          int r = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
          if (r == TextToSpeech.ERROR) done(callbackId);
        } catch (Exception e) { done(callbackId); }
      }

      @JavascriptInterface
      public void stop() {
        try { if (tts != null) tts.stop(); } catch (Exception ignore) {}
      }
    }, "AndroidTTS");

    wv.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
        String url = req.getUrl().toString();
        if (url.startsWith(VIRTUAL_HOST)) {
          String path = url.substring(VIRTUAL_HOST.length());
          int q = path.indexOf('?');
          if (q >= 0) path = path.substring(0, q);
          if (path.isEmpty() || path.endsWith("/")) path += "index.html";
          try {
            InputStream in = getAssets().open("www/" + path);
            return new WebResourceResponse(mime(path), "utf-8", in);
          } catch (Exception e) {
            return null;
          }
        }
        return null;
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
        String host = req.getUrl().getHost() == null ? "" : req.getUrl().getHost();
        return !host.equals("localhost") && !host.isEmpty();
      }
    });
    wv.setWebChromeClient(new WebChromeClient());
    setContentView(wv);
    if (savedInstanceState == null) {
      wv.loadUrl(VIRTUAL_HOST + "index.html");
    } else {
      wv.restoreState(savedInstanceState);
    }
  }

  /* ---------- 设备本地 TTS 初始化 ---------- */
  private void initTTS() {
    try {
      tts = new TextToSpeech(this, status -> {
        if (status == TextToSpeech.SUCCESS && wv != null) {
          try { tts.setLanguage(Locale.US); } catch (Exception ignore) {}
          runJs("window.__ttsReady && window.__ttsReady()");
        }
      });
      tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
        @Override public void onStart(String id) {}
        @Override public void onDone(String id) { done(id); }
        @Override public void onError(String id) { done(id); }
      });
    } catch (Exception e) { tts = null; }
  }

  private Locale localeFor(String lang) {
    if ("zh".equals(lang)) return Locale.CHINA;
    if ("ja".equals(lang)) return Locale.JAPAN;
    if ("ko".equals(lang)) return Locale.KOREA;
    return Locale.US;
  }

  private void done(String callbackId) {
    runJs("window.__ttsDone && window.__ttsDone('" + (callbackId == null ? "" : callbackId) + "')");
  }

  private void runJs(String js) {
    try {
      if (wv != null) wv.post(() -> { try { wv.evaluateJavascript(js, null); } catch (Exception ignore) {} });
    } catch (Exception ignore) {}
  }

  private String mime(String p) {
    if (p.endsWith(".html")) return "text/html";
    if (p.endsWith(".js"))    return "application/javascript";
    if (p.endsWith(".css"))   return "text/css";
    if (p.endsWith(".json"))  return "application/json";
    if (p.endsWith(".png"))   return "image/png";
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
    if (p.endsWith(".svg"))   return "image/svg+xml";
    if (p.endsWith(".woff2")) return "font/woff2";
    if (p.endsWith(".mp3"))   return "audio/mpeg";
    if (p.endsWith(".wav"))   return "audio/wav";
    return "application/octet-stream";
  }

  @Override
  protected void onSaveInstanceState(Bundle out) {
    super.onSaveInstanceState(out);
    if (wv != null) wv.saveState(out);
  }

  @Override
  public void onBackPressed() {
    if (wv != null && wv.canGoBack()) wv.goBack();
    else super.onBackPressed();
  }

  @Override
  protected void onDestroy() {
    try { if (tts != null) { tts.stop(); tts.shutdown(); tts = null; } } catch (Exception ignore) {}
    try { if (wv != null) { wv.destroy(); wv = null; } } catch (Exception ignore) {}
    super.onDestroy();
  }
}