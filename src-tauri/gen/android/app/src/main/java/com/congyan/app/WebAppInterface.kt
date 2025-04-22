package com.congyan.app

import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val activity: MainActivity) {
  @JavascriptInterface
  fun showToast(message: String) {
    Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
  }

  /**
   * Opens the given URL in a new WebviewActivity.
   * @param url The URL to open.
   */
  @JavascriptInterface
  fun openUrlInNewActivity(url: String) {
    // 在主线程上启动 Activity
    activity.runOnUiThread {
      WebviewActivity.start(activity, url)
    }
  }
}