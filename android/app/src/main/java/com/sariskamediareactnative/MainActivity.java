package com.sariskamediareactnative;

import com.facebook.react.ReactActivity;

import io.wazo.callkeep.RNCallKeepModule; // Add these import lines

import androidx.annotation.NonNull;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "SariskaMediaReactNative";
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == RNCallKeepModule.REQUEST_READ_PHONE_STATE) {
            RNCallKeepModule.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

}
