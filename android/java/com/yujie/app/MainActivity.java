package com.yujie.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;

/**
 * 语界 LinguaVerse v4.0 · WebView 外壳 (纯内置离线版)
 * 特性:
 *   · 不依赖任何外部服务 / 系统已安装 TTS 软件 (朗读由前端 meSpeak.js 纯JS合成)
 *   · https://localhost/ 虚拟域名 → assets/www/ (保证 localStorage / ServiceWorker / IndexedDB 正常)
 *   · 沉浸式状态栏 (HyperOS 视觉)
 *   · 纯离线可用: 所有资源打包在 assets, 不强制要求 INTERNET 权限即可运行
 */
public class MainActivity extends Activity {

  private static final String VIRTUAL_HOST = "https://localhost/";
  private WebView wv;

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
    s.setUserAgentString(s.getUserAgentString() + " LinguaVerse/4.0");

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
        // 其余 URL 放行 (用户可选联网功能正常走系统网络, 纯离线场景不会触发)
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
    try { if (wv != null) { wv.destroy(); wv = null; } } catch (Exception ignore){}
    super.onDestroy();
  }
}
