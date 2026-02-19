package com.coparenting.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize Firebase before any Capacitor plugins can use it
        try {
            FirebaseApp.initializeApp(this);
        } catch (IllegalStateException e) {
            // Firebase already initialized, ignore
        }
    }
}
