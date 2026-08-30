package com.yujie.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;

/**
 * 语界 LinguaVerse v2.1 · WebView 外壳
 * 特性:
 *   · https://localhost/ 虚拟域名 → assets/www/ (保证 localStorage/SW/TTS 正常)
 *   · NativeTTS JSBridge: 接入安卓系统 TextToSpeech,解决 WebView speechSynthesis 在部分
 *     国产 ROM 上不可用的问题 (提供 cancel/speak/stop/setLanguage)
 *   · 沉浸式状态栏 (HyperOS 视觉)
 *   · 联网权限: 通过 shouldInterceptRequest 放行网络音频 CDN 让浏览器 fetch 正常工作
 *     (非 localhost 的 GET 请求走系统网络,APK 增加 INTERNET 权限)
 */
public class MainActivity extends Activity implements TextToSpeech.OnInitListener {

  private static final String VIRTUAL_HOST = "https://localhost/";
  private WebView wv;
  private TextToSpeech tts;
  private boolean ttsReady = false;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // 沉浸式状态栏 / 深色文字适配
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      getWindow().setStatusBarColor(Color.parseColor("#FAF7F5"));
      getWindow().setNavigationBarColor(Color.parseColor("#FFFFFF"));
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      getWindow().getDecorView().setSystemUiVisibility(
          android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
              | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    }

    wv = new WebView(this);
    WebSettings s = wv.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    s.setAllowContentAccess(true);
    s.setAllowFileAccess(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    s.setUserAgentString(s.getUserAgentString() + " LinguaVerse/2.1");

    // 系统 TTS 初始化 (异步)
    tts = new TextToSpeech(this.getApplicationContext(), this);

    // JSBridge: window.NativeTTS.speak / stop / isAvailable
    wv.addJavascriptInterface(new Object() {
      @android.webkit.JavascriptInterface
      public String isAvailable() { return "{\"ok\":" + ttsReady + "}"; }

      @android.webkit.JavascriptInterface
      public void speak(final String text, final String lang, final float rate) {
        if (!ttsReady || tts == null) return;
        final Locale loc = localeFor(lang);
        runOnUiThread(new Runnable() {
          @Override public void run() {
            try {
              tts.setLanguage(loc);
              tts.setSpeechRate(rate);
              HashMap<String, String> p = new HashMap<>();
              p.put(TextToSpeech.Engine.KEY_PARAM_VOLUME, "1.0");
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "yujie_" + System.nanoTime());
              } else {
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, p);
              }
            } catch (Exception ignore) { }
          }
        });
      }

      @android.webkit.JavascriptInterface
      public void stop() {
        try { if (tts != null) tts.stop(); } catch (Exception ignore) {}
      }
    }, "NativeTTS");

    wv.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
        String url = req.getUrl().toString();
        // localhost 虚拟域 → 从 assets 注入
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
        // 其他 URL 一律放行,走系统网络 (允许 CDN 音频)
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

  // TextToSpeech 初始化回调
  @Override
  public void onInit(int status) {
    if (status == TextToSpeech.SUCCESS) {
      ttsReady = true;
      // 注入可用标志
      if (wv != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
        wv.evaluateJavascript("(typeof window.__ttsReady==='function')&&window.__ttsReady(true);", null);
      }
    } else {
      ttsReady = false;
      try { Toast.makeText(this, "请安装系统 TTS 引擎(如小米/Google文字转语音)", Toast.LENGTH_LONG).show(); } catch (Exception ignore){}
    }
  }

  private Locale localeFor(String langTag) {
    if (langTag == null) return Locale.SIMPLIFIED_CHINESE;
    String l = langTag.toLowerCase();
    if (l.startsWith("en")) return Locale.US;
    if (l.startsWith("ja")) return Locale.JAPAN;
    if (l.startsWith("ko")) return Locale.KOREA;
    if (l.startsWith("zh")) return Locale.SIMPLIFIED_CHINESE;
    return new Locale(langTag.replace('-', '_'));
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
    wv.saveState(out);
  }

  @Override
  public void onBackPressed() {
    if (wv != null && wv.canGoBack()) wv.goBack();
    else super.onBackPressed();
  }

  @Override
  protected void onStop() {
    try { if (tts != null) tts.stop(); } catch (Exception ignore){}
    super.onStop();
  }

  @Override
  protected void onDestroy() {
    try { if (tts != null) { tts.stop(); tts.shutdown(); tts = null; } } catch (Exception ignore){}
    try { if (wv != null) wv.destroy(); wv = null; } catch (Exception ignore){}
    super.onDestroy();
  }
}
