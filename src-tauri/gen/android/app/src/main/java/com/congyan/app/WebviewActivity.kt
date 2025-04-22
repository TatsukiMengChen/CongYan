package com.congyan.app

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.content.res.Configuration // Import Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.MenuItem
import android.view.View // Import View
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.PopupMenu
import androidx.appcompat.widget.Toolbar
import android.view.Menu // Import Menu for setOptionalIconsVisible

class WebviewActivity : AppCompatActivity() {

  private lateinit var webView: WebView
  private lateinit var toolbar: Toolbar
  private lateinit var moreOptionsButton: ImageButton
  private var currentUrl: String? = null

  @SuppressLint("SetJavaScriptEnabled") // Added SuppressLint for JavaScript setting
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_webview)

    // Set light status bar flag if needed (before setting content view might be better, but here is fine too)
    val nightModeFlags = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    if (nightModeFlags == Configuration.UI_MODE_NIGHT_NO) {
      window.decorView.systemUiVisibility =
        window.decorView.systemUiVisibility or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
    }

    toolbar = findViewById(R.id.toolbar_webview)
    webView = findViewById(R.id.webview)
    moreOptionsButton = findViewById(R.id.button_more_options)

    // 设置 Toolbar
    setSupportActionBar(toolbar)
    supportActionBar?.setDisplayHomeAsUpEnabled(true) // 显示返回按钮
    supportActionBar?.setDisplayShowTitleEnabled(true) // 启用标题显示

    // Update status bar and toolbar color initially
    updateStatusBarColor()

    // 获取 URL
    currentUrl = intent.getStringExtra("url")

    if (currentUrl == null) {
      Toast.makeText(this, "无效的 URL", Toast.LENGTH_SHORT).show()
      finish() // 如果没有 URL，关闭 Activity
      return
    }

    // 配置 WebView
    val settings: WebSettings = webView.settings
    settings.javaScriptEnabled = true // 启用 JavaScript (如果需要)

    // --- Modify User Agent ---
    try {
      val packageInfo: PackageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION") packageManager.getPackageInfo(packageName, 0)
      }
      val appVersion = packageInfo.versionName
      val defaultUserAgent = settings.userAgentString
      val customUserAgent = "$defaultUserAgent CongYan/$appVersion"
      settings.userAgentString = customUserAgent
      Log.d("WebviewActivity", "User Agent set to: $customUserAgent") // Optional logging
    } catch (e: PackageManager.NameNotFoundException) {
      Log.e("WebviewActivity", "Failed to get package info for User Agent", e)
      // Fallback or just use default if needed
      val defaultUserAgent = settings.userAgentString
      val customUserAgent = "$defaultUserAgent CongYan/unknown" // Fallback version
      settings.userAgentString = customUserAgent
    }
    // --- End Modify User Agent ---

    webView.webViewClient = object : WebViewClient() {
      override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        // 更新 Toolbar 标题为网页标题 (Toolbar handles ellipsizing)
        supportActionBar?.title = view?.title
        currentUrl = url // 更新当前 URL (可能发生重定向)
        // Optionally update status bar color again if page background changes significantly
        // updateStatusBarColor() // Consider if needed based on web content
      }
      // 可以添加其他 WebViewClient 回调，例如处理错误
    }

    // 加载 URL
    // Set an initial title or leave it blank until page loads
    supportActionBar?.title = "加载中..." // Optional: Set initial title
    webView.loadUrl(currentUrl!!)

    // 设置更多选项按钮点击监听器
    moreOptionsButton.setOnClickListener { view ->
      showPopupMenu(view)
    }

    // 处理 Toolbar 返回按钮点击事件
    toolbar.setNavigationOnClickListener {
      onBackPressedDispatcher.onBackPressed()
    }
  }

  // Add onConfigurationChanged to handle theme changes
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    // Update status bar and toolbar color on config change
    updateStatusBarColor()
    // Update light status bar flag based on new config
    val nightModeFlags = newConfig.uiMode and Configuration.UI_MODE_NIGHT_MASK
    if (nightModeFlags == Configuration.UI_MODE_NIGHT_NO) {
      window.decorView.systemUiVisibility =
        window.decorView.systemUiVisibility or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
    } else {
      window.decorView.systemUiVisibility =
        window.decorView.systemUiVisibility and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
    }
    // You might also need to update the Toolbar background color if it depends on the theme
    // toolbar.setBackgroundColor(...)
  }

  // Copied from MainActivity and modified
  private fun updateStatusBarColor() {
    val nightModeFlags = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    val color = when (nightModeFlags) {
      Configuration.UI_MODE_NIGHT_YES -> 0xFF1a1c1e.toInt() // Dark theme color (e.g., dark grey/black)
      Configuration.UI_MODE_NIGHT_NO -> 0xFFFCFCFF.toInt() // Light theme color (e.g., white or light grey)
      else -> 0xFFFCFCFF.toInt() // Default to light
    }
    window.statusBarColor = color
    // Set Toolbar background to match the status bar color
    toolbar.setBackgroundColor(color)
    // Set WebView background color to match the theme
    webView.setBackgroundColor(color) // Add this line
  }

  private fun showPopupMenu(anchor: android.view.View) {
    val popup = PopupMenu(this, anchor) // Use 'this' (Activity context)
    // Optionally, apply the custom style via the theme attribute if needed,
    // but let's test without it first. If the default looks okay, the issue is in the style.
    // If you *need* the custom style, ensure R.style.CustomPopupMenu is correct
    // and consider applying it via the activity theme's popupMenuStyle attribute.

    popup.menuInflater.inflate(R.menu.webview_menu, popup.menu)

    // Force icons to show (optional, but often needed for PopupMenu)
    try {
      val fieldMPopup = PopupMenu::class.java.getDeclaredField("mPopup")
      fieldMPopup.isAccessible = true
      val mPopup = fieldMPopup.get(popup)
      mPopup.javaClass
        .getDeclaredMethod("setForceShowIcon", Boolean::class.java)
        .invoke(mPopup, true)
    } catch (e: Exception) {
      Log.e("WebviewActivity", "Error showing menu icons.", e)
    }


    popup.setOnMenuItemClickListener { item: MenuItem ->
      when (item.itemId) {
        R.id.menu_refresh -> { // Handle refresh
          webView.reload()
          true
        }

        R.id.menu_copy_link -> {
          copyLinkToClipboard()
          true
        }

        R.id.menu_open_in_browser -> {
          openInBrowser()
          true
        }

        R.id.menu_share -> {
          shareLink()
          true
        }

        else -> false
      }
    }
    popup.show()
  }

  private fun copyLinkToClipboard() {
    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText("Copied URL", currentUrl)
    clipboard.setPrimaryClip(clip)
    Toast.makeText(this, "链接已复制", Toast.LENGTH_SHORT).show()
  }

  private fun openInBrowser() {
    currentUrl?.let {
      try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(it))
        startActivity(intent)
      } catch (e: Exception) {
        Toast.makeText(this, "无法打开浏览器", Toast.LENGTH_SHORT).show()
      }
    }
  }

  private fun shareLink() {
    currentUrl?.let {
      try {
        val intent = Intent(Intent.ACTION_SEND)
        intent.type = "text/plain"
        intent.putExtra(Intent.EXTRA_TEXT, it)
        startActivity(Intent.createChooser(intent, "分享链接"))
      } catch (e: Exception) {
        Toast.makeText(this, "无法分享链接", Toast.LENGTH_SHORT).show()
      }
    }
  }

  // 处理 WebView 的返回逻辑
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    if (webView.canGoBack()) {
      webView.goBack()
    } else {
      super.onBackPressed()
    }
  }

  // 确保在 Activity 销毁时清理 WebView
  override fun onDestroy() {
    webView.destroy()
    super.onDestroy()
  }

  // 伴生对象，用于提供启动此 Activity 的便捷方法
  companion object {
    fun start(context: Context, url: String) {
      val intent = Intent(context, WebviewActivity::class.java)
      intent.putExtra("url", url)
      context.startActivity(intent)
    }
  }
}

// 注意：您还需要创建 res/menu/webview_menu.xml 文件来定义弹出菜单项
// 例如:
/*
<?xml version="1.0" encoding="utf-8"?>
<menu xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:id="@+id/menu_copy_link"
        android:title="复制链接" />
    <item
        android:id="@+id/menu_open_in_browser"
        android:title="在浏览器打开" />
    <item
        android:id="@+id/menu_share"
        android:title="分享" />
    <item
        android:id="@+id/menu_refresh"
        android:title="刷新" /> <!-- Add this item for refresh -->
</menu>
*/

// 还需要在 res/values/strings.xml 中添加字符串资源:
/*
<resources>
    <string name="title_activity_webview">WebView</string>
    <string name="more_options">更多选项</string>
    <!-- 其他字符串... -->
</resources>
*/