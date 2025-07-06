package com.congyan.app

import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class WebAppInterface(private val activity: MainActivity) {
  private val TAG = "WebAppInterface"
  
  // 懒加载推理服务
  private val inferenceService: InferenceService by lazy {
    InferenceService(activity.applicationContext, "model_android.ptl")
  }

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

  /**
   * 供 JavaScript 调用的核心接口
   * 接收 Base64 编码的音频数据，异步执行预测，并通过回调返回结果
   * @param audioDataAsBase64 前端通过 FileReader 读取并编码的纯 Base64 字符串
   * @param callbackFuncName JS 全局作用域下的回调函数名称
   */
  @JavascriptInterface
  fun predictIntelligibilityFromBase64(audioDataAsBase64: String, callbackFuncName: String) {
    Log.i(TAG, "Received inference request, callback: $callbackFuncName")
    
    // 使用协程将耗时任务切换到后台IO线程，避免UI卡顿
    activity.lifecycleScope.launch(Dispatchers.IO) {
      var tempAudioFile: File? = null
      try {
        // 步骤1: 解码 Base64 并写入临时文件
        val decodedBytes = Base64.decode(audioDataAsBase64, Base64.DEFAULT)
        tempAudioFile = File.createTempFile("webaudio_", ".wav", activity.cacheDir)
        tempAudioFile.writeBytes(decodedBytes)
        
        Log.i(TAG, "Audio file saved: ${tempAudioFile.absolutePath}, size: ${decodedBytes.size} bytes")
        
        // 步骤2: 在后台线程调用推理服务
        val score = inferenceService.predict(tempAudioFile.absolutePath)
        
        // 步骤3: 任务完成，切换回主线程以安全地调用 WebView
        withContext(Dispatchers.Main) {
          activity.onInferenceResult(callbackFuncName, score)
        }
      } catch (e: Exception) {
        Log.e(TAG, "Inference error", e)
        // 异常处理
        withContext(Dispatchers.Main) {
          val errorMessage = "Inference Error: ${e.message}"
          Toast.makeText(activity, errorMessage, Toast.LENGTH_LONG).show()
          activity.onInferenceResult(callbackFuncName, -1.0f) // -1.0f 作为错误码
        }
      } finally {
        // 步骤4: 确保临时文件总能被删除，释放空间
        tempAudioFile?.delete()
      }
    }
  }

  /**
   * 检查模型是否已加载
   */
  @JavascriptInterface
  fun isModelLoaded(): Boolean {
    return inferenceService.isModelLoaded()
  }

  /**
   * 获取模型状态信息
   */
  @JavascriptInterface
  fun getModelStatus(): String {
    return if (inferenceService.isModelLoaded()) {
      "Model loaded successfully"
    } else {
      "Model not loaded"
    }
  }
}