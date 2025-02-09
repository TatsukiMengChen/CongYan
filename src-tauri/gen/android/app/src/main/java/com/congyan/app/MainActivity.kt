package com.congyan.app

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.webkit.WebView
import android.widget.Toast

class MainActivity : TauriActivity() {
  private var doubleBackToExitPressedOnce = false
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var mWebView: WebView

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
    mWebView = webView
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

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      if (mWebView.canGoBack()) {
        mWebView.goBack()
        return true
      }

      if (doubleBackToExitPressedOnce) {
        finishAffinity()
        System.exit(0)
        return true
      }

      this.doubleBackToExitPressedOnce = true
      Toast.makeText(this, "再按一次退出", Toast.LENGTH_SHORT).show()

      handler.postDelayed({ doubleBackToExitPressedOnce = false }, 2000)
      return true
    }
    return super.onKeyDown(keyCode, event)
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