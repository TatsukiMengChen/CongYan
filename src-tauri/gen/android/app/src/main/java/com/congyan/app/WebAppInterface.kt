package com.congyan.app

import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val activity: MainActivity) {
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
    }
}