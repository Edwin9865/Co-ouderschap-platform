package com.coparenting.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static boolean isRecovering = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            new Handler(Looper.getMainLooper()).post(() -> {
                setupWebViewCrashHandler();
            });
        }
    }

    private void setupWebViewCrashHandler() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                            if (isRecovering) {
                                return true;
                            }

                            Log.e(TAG, "WebView render process gone. Did crash: " + detail.didCrash());

                            if (detail.didCrash()) {
                                Log.e(TAG, "WebView renderer crashed. Attempting recovery...");
                                isRecovering = true;

                                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                                    try {
                                        if (!isFinishing() && !isDestroyed()) {
                                            Log.i(TAG, "Recreating activity after WebView crash");
                                            recreate();
                                        }
                                    } catch (Exception e) {
                                        Log.e(TAG, "Error during WebView recovery", e);
                                    } finally {
                                        isRecovering = false;
                                    }
                                }, 100);

                                return true;
                            }

                            return false;
                        }

                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                            if (isRecovering) {
                                Log.i(TAG, "WebView recovery completed successfully");
                                isRecovering = false;
                            }
                        }
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Error setting up WebView crash handler", e);
            }
        }
    }

    @Override
    protected void onDestroy() {
        isRecovering = false;
        super.onDestroy();
    }
}
