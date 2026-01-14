package com.coparenting.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            setupWebViewCrashHandler();
        }
    }

    private void setupWebViewCrashHandler() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                        Log.e(TAG, "WebView render process gone. Did crash: " + detail.didCrash());

                        if (detail.didCrash()) {
                            Log.e(TAG, "WebView renderer crashed. Attempting recovery...");

                            runOnUiThread(() -> {
                                try {
                                    if (view != null && view.getParent() != null) {
                                        ((android.view.ViewGroup) view.getParent()).removeView(view);
                                    }
                                    view.destroy();

                                    recreate();
                                } catch (Exception e) {
                                    Log.e(TAG, "Error during WebView recovery", e);
                                    finish();
                                    System.exit(0);
                                }
                            });

                            return true;
                        }

                        return false;
                    }
                });
            }
        }
    }
}
