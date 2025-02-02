package com.congyan.app

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.os.Bundle
import android.view.View
import android.webkit.WebView

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    window.decorView.systemUiVisibility =
      window.decorView.systemUiVisibility or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR

    updateStatusBarColor()
    updateBackgroundColor()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    updateStatusBarColor()
    updateBackgroundColor()
  }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    val nightModeFlags = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    val color = when (nightModeFlags) {
      Configuration.UI_MODE_NIGHT_YES -> 0xFF1a1c1e.toInt()
      Configuration.UI_MODE_NIGHT_NO -> 0xFFFCFCFF.toInt()
      else -> 0xFFFCFCFF.toInt()
    }
    webView.setBackgroundColor(color)
    webView.settings.javaScriptEnabled = true
    webView.addJavascriptInterface(WebAppInterface(this), "Android")
  }

  private fun updateStatusBarColor() {
    val nightModeFlags = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    val color = when (nightModeFlags) {
      Configuration.UI_MODE_NIGHT_YES -> 0xFF1a1c1e.toInt()
      Configuration.UI_MODE_NIGHT_NO -> 0xFFFCFCFF.toInt()
      else -> 0xFFFCFCFF.toInt()
    }
    window.statusBarColor = color
  }

  private fun updateBackgroundColor() {
    val nightModeFlags = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    val color = when (nightModeFlags) {
      Configuration.UI_MODE_NIGHT_YES -> 0xFF1a1c1e.toInt()
      Configuration.UI_MODE_NIGHT_NO -> 0xFFFCFCFF.toInt()
      else -> 0xFFFCFCFF.toInt()
    }
    window.decorView.setBackgroundColor(color)
  }
}