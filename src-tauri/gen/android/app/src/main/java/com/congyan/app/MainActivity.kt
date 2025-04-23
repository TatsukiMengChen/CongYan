package com.congyan.app

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast

class MainActivity : TauriActivity() {
  private var doubleBackToExitPressedOnce = false
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var mWebView: WebView

  // --- Debug Mode Sequence ---
  private val targetSequence = "++--+-+-"
  private val currentSequence = StringBuilder()
  private val DEBUG_MODE_TAG = " DebugMode"
  // --- End Debug Mode Sequence ---

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
    val settings: WebSettings = webView.settings // Get settings
    settings.javaScriptEnabled = true

    // --- Modify User Agent ---
    setCustomUserAgent(settings) // Extracted UA setting logic to a function
    // --- End Modify User Agent ---

    webView.addJavascriptInterface(WebAppInterface(this), "Android")
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    when (keyCode) {
      KeyEvent.KEYCODE_VOLUME_UP -> {
        appendSequence('+')
        return true // Consume the event
      }
      KeyEvent.KEYCODE_VOLUME_DOWN -> {
        appendSequence('-')
        return true // Consume the event
      }
      KeyEvent.KEYCODE_BACK -> {
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

  // --- Helper function to set User Agent ---
  private fun setCustomUserAgent(settings: WebSettings, addDebugMode: Boolean = false) {
    try {
      val packageInfo: PackageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION") packageManager.getPackageInfo(packageName, 0)
      }
      val appVersion = packageInfo.versionName
      // Start with default and app version
      var customUserAgent = "${settings.userAgentString} CongYan/$appVersion"

      // Check if debug mode needs to be added or is already there (from previous activation)
      val currentUa = settings.userAgentString
      if (addDebugMode || currentUa.contains(DEBUG_MODE_TAG)) {
         // Ensure DebugMode tag isn't added multiple times if already present
         if (!currentUa.contains(DEBUG_MODE_TAG)) {
            customUserAgent += DEBUG_MODE_TAG
         } else {
            // If debug mode is already active, reconstruct UA to include it
             val baseUa = currentUa.substringBefore(" CongYan/") // Get original default UA part
             customUserAgent = "$baseUa CongYan/$appVersion$DEBUG_MODE_TAG"
         }
      }

      settings.userAgentString = customUserAgent
      Log.d("MainActivity", "User Agent set to: $customUserAgent")
    } catch (e: PackageManager.NameNotFoundException) {
      Log.e("MainActivity", "Failed to get package info for User Agent", e)
      val defaultUserAgent = settings.userAgentString
      var customUserAgent = "$defaultUserAgent CongYan/unknown" // Fallback version
      if (addDebugMode || defaultUserAgent.contains(DEBUG_MODE_TAG)) {
         if (!defaultUserAgent.contains(DEBUG_MODE_TAG)) {
            customUserAgent += DEBUG_MODE_TAG
         } else {
             val baseUa = defaultUserAgent.substringBefore(" CongYan/")
             customUserAgent = "$baseUa CongYan/unknown$DEBUG_MODE_TAG"
         }
      }
      settings.userAgentString = customUserAgent
    }
  }
  // --- End Helper function ---

  // --- Debug Mode Activation Logic ---
  private fun appendSequence(char: Char) {
    currentSequence.append(char)
    // Keep the sequence length manageable, matching the target length
    if (currentSequence.length > targetSequence.length) {
      currentSequence.deleteCharAt(0)
    }
    checkForDebugSequence()
  }

  private fun checkForDebugSequence() {
    if (currentSequence.toString() == targetSequence) {
      activateDebugMode()
      currentSequence.clear() // Reset sequence after activation
    }
  }

  private fun activateDebugMode() {
    val settings = mWebView.settings
    val currentUa = settings.userAgentString
    if (!currentUa.contains(DEBUG_MODE_TAG)) {
        setCustomUserAgent(settings, true) // Update UA with DebugMode
        mWebView.reload() // Reload the page to apply the new UA
        Toast.makeText(this, "Debug Mode Activated", Toast.LENGTH_SHORT).show()
        Log.i("MainActivity", "Debug Mode Activated. UA: ${settings.userAgentString}")
    } else {
        Log.i("MainActivity", "Debug Mode already active.")
        // Optional: Show a toast that it's already active
        // Toast.makeText(this, "Debug Mode Already Active", Toast.LENGTH_SHORT).show()
    }
  }
  // --- End Debug Mode Activation Logic ---
}