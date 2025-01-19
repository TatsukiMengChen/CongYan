package com.congyan.app.utils

import android.app.Activity
import android.os.Build
import android.view.WindowInsets

object SafeAreaUtils {
  fun getSafeAreaHeight(activity: Activity): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val insets = activity.window.decorView.rootWindowInsets
      insets?.displayCutout?.safeInsetTop ?: 0
    } else {
      0
    }
  }
}