package com.yujie.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;

/**
 * 语界 LinguaVerse · WebView 外壳
 * 通过 https://localhost/ 虚拟域名从 assets/www 提供页面,
 * 保证 localStorage / Service Worker / speechSynthesis 正常工作。
 */
public class MainActivity extends Activity {

  private static final String VIRTUAL_HOST = "https://localhost/";
  private WebView wv;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    wv = new WebView(this);
    WebSettings s = wv.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);

    wv.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
        String url = req.getUrl().toString();
        if (!url.startsWith(VIRTUAL_HOST)) return null;
        String path = url.substring(VIRTUAL_HOST.length());
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);
        if (path.isEmpty() || path.endsWith("/")) path += "index.html";
        try {
          InputStream in = getAssets().open("www/" + path);
          return new WebResourceResponse(mime(path), "utf-8", in);
        } catch (Exception e) {
          return null; // 交由 WebView 报 404
        }
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
        // 只允许虚拟域名内跳转,外部链接交由系统
        return !"localhost".equals(req.getUrl().getHost());
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
  protected void onDestroy() {
    if (wv != null) wv.destroy();
    super.onDestroy();
  }
}
