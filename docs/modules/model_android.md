好的，明白了。您已经完成了 `MainActivity` 的基础设置，现在需要一份“万无一失”的指南，专注于**模型部署、接口实现、JS调用**这三个核心环节，并包含所有必要的参数说明和细节。

遵照您的要求，这份文档将提供一个完整的、可直接上手的生产级别方案。

---

### **安卓端语音可懂度模型 WebView 集成部署指南 (终极版)**

#### **前言**

本指南旨在提供一个完整、详细且可靠的方案，用于将一个基于 PyTorch Lite (`.ptl`) 的语音可懂度模型部署到安卓应用中，并通过 WebView 实现 JavaScript 的无缝调用。方案的核心是利用 **Base64** 编码传输音频数据，并采用**异步回调**机制确保应用性能和用户体验。

---

### **第一章：模型部署与环境准备**

在编写任何代码之前，必须先将所需的“物料”正确地放置到项目中。

#### **1.1. 添加 Gradle 依赖**

这是告诉您的安卓项目“我们将要使用 PyTorch”的必要步骤。

1.  打开您项目 `app` 模块下的 `build.gradle` 或 `build.gradle.kts` 文件。

2.  在 `dependencies { ... }` 代码块中，确保以下两行依赖存在：

    ```groovy
    // build.gradle (Groovy)
    implementation 'org.pytorch:pytorch_android_lite:2.1.0'
    implementation 'org.pytorch:pytorch_android_torchvision_lite:2.1.0'
    ```

    或者

    ```kotlin
    // build.gradle.kts (Kotlin)
    implementation("org.pytorch:pytorch_android_lite:2.1.0")
    implementation("org.pytorch:pytorch_android_torchvision_lite:2.1.0")
    ```

3.  点击 Android Studio 顶部提示的 `Sync Now` 按钮，等待依赖下载完成。

#### **1.2. 放置模型文件**

模型文件是推理的核心，必须放置在应用可以访问的 `assets` 目录中。

1.  在 Android Studio 的项目视图中，导航到 `app/src/main/`。
2.  右键点击 `main` 目录 -\> `New` -\> `Directory`，创建一个名为 `assets` 的文件夹（如果尚不存在）。
3.  将您训练好的 `.ptl` 模型文件（例如 `best_model_audio_only_12345.ptl`）复制并粘贴到 `app/src/main/assets/` 目录中。

#### **1.3. 添加安卓权限**

应用需要访问网络（用于 WebView）和麦克风（用于录音）。

1.  打开 `app/src/main/AndroidManifest.xml` 文件。

2.  在 `<manifest>` 标签内，确保添加以下权限：

    ```xml
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    ```

---

### **第二章：安卓原生接口实现**

这是连接前端 WebView 和底层 PyTorch 模型的桥梁。我们将采用分层设计，以保证代码的清晰和可维护性。

#### **2.1. 推理服务层 (`InferenceService.kt`)**

这个类专门负责模型的加载和推理，将 PyTorch 的复杂逻辑与业务逻辑解耦。

1.  在您的项目中创建一个新的 Kotlin 类，命名为 `InferenceService.kt`。

2.  将以下代码复制进去：

    ```kotlin
    package com.congyan.app // 替换成您自己的包名

    import android.content.Context
    import org.pytorch.IValue
    import org.pytorch.LiteModuleLoader
    import org.pytorch.Module
    import org.pytorch.Tensor
    import java.io.File
    import java.io.FileOutputStream

    class InferenceService(context: Context, modelAssetName: String) {

        private val module: Module

        init {
            // 加载位于 assets 目录中的模型
            val modelPath = assetFilePath(context, modelAssetName)
            module = LiteModuleLoader.load(modelPath)
        }

        /**
         * 核心推理方法，接收一个音频文件路径，返回预测分数。
         * @param audioFilePath 设备上音频文件的绝对路径。
         * @return 浮点型的可懂度分数。
         */
        fun predict(audioFilePath: String): Float {
            // 步骤 1: 音频预处理 (这是整个流程中最关键、最复杂的部分)
            val preprocessedData: FloatArray = yourAudioPreprocessingFunction(audioFilePath)
            val shape = longArrayOf(1, 128, 500) // 形状: [Batch, Mels, Time]
            val inputTensor = Tensor.fromBlob(preprocessedData, shape)

            // 步骤 2: 执行模型的前向传播
            val outputTensor = module.forward(IValue.from(inputTensor)).toTensor()

            // 步骤 3: 从输出张量中提取结果
            // 模型的输出形状为 [1, 1]，所以我们直接取第一个元素
            return outputTensor.dataAsFloatArray[0]
        }

        /**
         * TODO: 实现此函数！这是您需要根据模型训练脚本来完成的核心任务。
         * @param audioFilePath 音频文件路径。
         * @return 一个一维浮点数组，代表处理好的频谱图数据。
         */
        private fun yourAudioPreprocessingFunction(audioFilePath: String): FloatArray {
            // 在此实现与 Python 脚本完全一致的预处理逻辑：
            // 1. 加载音频文件 -> 转换为单声道。
            // 2. 计算梅尔频谱图 (使用 n_fft=400, hop_length=160, n_mels=128)。
            // 3. 幅度转分贝。
            // 4. 实例归一化 (X - mean) / (std + 1e-6)。
            // 5. 填充或截断到 500 帧。
            // 6. 将最终的 [128, 500] 二维数组展平为一维数组返回。
            // 强烈建议使用 TarsosDSP 等第三方库来辅助完成第2步。

            // 这是一个占位符，您必须替换它
            return FloatArray(128 * 500)
        }

        // 辅助函数，用于获取 asset 文件的绝对路径 (无需修改)
        private fun assetFilePath(context: Context, assetName: String): String {
            val file = File(context.filesDir, assetName)
            if (file.exists() && file.length() > 0) return file.absolutePath
            context.assets.open(assetName).use { inputStream ->
                FileOutputStream(file).use { outputStream ->
                    val buffer = ByteArray(4 * 1024)
                    var read: Int
                    while (inputStream.read(buffer).also { read = it } != -1) {
                        outputStream.write(buffer, 0, read)
                    }
                    outputStream.flush()
                }
            }
            return file.absolutePath
        }
    }
    ```

    **【核心警告】**：`yourAudioPreprocessingFunction` 的正确实现是项目成败的关键。您必须确保其逻辑与 `main.py` 中的音频处理代码（包括所有参数）完全一致。

#### **2.2. WebView 桥接层 (`WebAppInterface.kt`)**

这个类的方法将被直接暴露给 JavaScript 调用。它负责接收前端数据，并使用协程在后台调用 `InferenceService`。

1.  打开您已有的 `WebAppInterface.kt` 文件。

2.  用以下代码替换或补充其内容：

    ```kotlin
    package com.congyan.app // 替换成您自己的包名

    import android.util.Base64
    import android.webkit.JavascriptInterface
    import android.widget.Toast
    import androidx.lifecycle.lifecycleScope // 需要 'androidx.lifecycle:lifecycle-runtime-ktx' 依赖
    import kotlinx.coroutines.Dispatchers
    import kotlinx.coroutines.launch
    import kotlinx.coroutines.withContext
    import java.io.File

    class WebAppInterface(private val activity: MainActivity) {

        private val inferenceService: InferenceService by lazy {
            // 在此指定您的模型文件名
            InferenceService(activity.applicationContext, "best_model_audio_only_12345.ptl")
        }

        /**
         * 供 JavaScript 调用的核心接口。
         * 接收 Base64 编码的音频数据，异步执行预测，并通过回调返回结果。
         * @param audioDataAsBase64 前端通过 FileReader 读取并编码的纯 Base64 字符串。
         * @param callbackFuncName JS 全局作用域下的回调函数名称，例如 'handleInferenceResult'。
         */
        @JavascriptInterface
        fun predictIntelligibilityFromBase64(audioDataAsBase64: String, callbackFuncName: String) {
            // 使用协程将耗时任务切换到后台IO线程，避免UI卡顿
            activity.lifecycleScope.launch(Dispatchers.IO) {
                var tempAudioFile: File? = null
                try {
                    // 步骤 1: 解码 Base64 并写入临时文件
                    val decodedBytes = Base64.decode(audioDataAsBase64, Base64.DEFAULT)
                    tempAudioFile = File.createTempFile("webaudio_", ".wav", activity.cacheDir)
                    tempAudioFile.writeBytes(decodedBytes)

                    // 步骤 2: 在后台线程调用推理服务
                    val score = inferenceService.predict(tempAudioFile.absolutePath)

                    // 步骤 3: 任务完成，切换回主线程以安全地调用 WebView
                    withContext(Dispatchers.Main) {
                        activity.onInferenceResult(callbackFuncName, score)
                    }
                } catch (e: Exception) {
                    // 异常处理
                    withContext(Dispatchers.Main) {
                        val errorMessage = "Inference Error: ${e.message}"
                        Toast.makeText(activity, errorMessage, Toast.LENGTH_LONG).show()
                        activity.onInferenceResult(callbackFuncName, -1.0f) // -1.0f 作为错误码
                    }
                } finally {
                    // 步骤 4: 确保临时文件总能被删除，释放空间
                    tempAudioFile?.delete()
                }
            }
        }
    }
    ```

---

### **第三章：WebView 与前端实现**

最后，我们需要一个前端页面来调用我们刚刚创建的原生接口。

#### **3.1. `MainActivity.kt` 确认与配置**

请确保您的 `MainActivity` 包含以下配置，特别是 `WebChromeClient` 用于处理权限请求。

```kotlin
// MainActivity.kt
package com.congyan.app // 替换成您自己的包名

import android.Manifest
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.my_webview) // 确保布局文件中有这个ID

        // 基础配置
        webView.settings.javaScriptEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false // 允许JS自动播放/录制

        // 添加 JS 接口，"Android" 是 JS 中调用的对象名
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        // **关键**：设置 WebChromeClient 以处理网页的权限请求（如麦克风）
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                // 请求安卓系统的权限
                requestPermissions(request.resources, 101)
                // 假设用户会同意，直接授予权限给网页
                // 在生产应用中，您应该在 onRequestPermissionsResult 中更精细地处理
                request.grant(request.resources)
            }
        }

        // 加载网页
        webView.loadUrl("file:///android_asset/index.html")
    }

    /**
     * 由 WebAppInterface 回调，负责将结果传递给 WebView
     * @param callbackName JS 回调函数名
     * @param score 预测的分数
     */
    fun onInferenceResult(callbackName: String, score: Float) {
        val safeCallbackName = callbackName.takeWhile { it.isLetterOrDigit() }
        if (safeCallbackName.isNotEmpty()) {
            val jsCode = "javascript:window.${safeCallbackName}($score)"
            webView.loadUrl(jsCode)
        }
    }
}
```

#### **3.2. 前端页面 `index.html`**

这是最终用户交互的界面。它负责录音、编码、调用原生代码并展示结果。

1.  在 `app/src/main/assets/` 目录下创建一个 `index.html` 文件。

2.  将以下代码复制进去：

    ```html
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>语音可懂度预测</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, sans-serif;
            padding: 1em;
            text-align: center;
          }
          button {
            font-size: 1.1em;
            padding: 0.8em 1.2em;
            margin: 0.5em;
            border-radius: 8px;
            border: 1px solid #ccc;
            cursor: pointer;
          }
          #startButton {
            background-color: #4caf50;
            color: white;
          }
          #stopButton {
            background-color: #f44336;
            color: white;
          }
          button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
          #status {
            margin-top: 1.5em;
            font-size: 1.2em;
            color: #555;
            min-height: 1.5em;
          }
          #result {
            margin-top: 0.5em;
            font-size: 1.5em;
            font-weight: bold;
            color: #007bff;
          }
          audio {
            margin-top: 1.5em;
            width: 100%;
            max-width: 400px;
          }
        </style>
      </head>
      <body>
        <h1>语音可懂度预测</h1>
        <button id="startButton" onclick="startRecording()">开始录音</button>
        <button id="stopButton" onclick="stopRecording()" disabled>
          停止录音
        </button>
        <div id="status">请点击“开始录音”</div>
        <div id="result"></div>
        <audio id="audioPreview" controls></audio>
        <script>
          let mediaRecorder,
            audioChunks = [];
          const startBtn = document.getElementById("startButton"),
            stopBtn = document.getElementById("stopButton");
          const statusDiv = document.getElementById("status"),
            resultDiv = document.getElementById("result");
          const audioPreview = document.getElementById("audioPreview");

          async function startRecording() {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
              mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm",
              }); // 使用 webm, 安卓端能正常处理
              mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
              mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, {
                  type: mediaRecorder.mimeType,
                });
                audioPreview.src = URL.createObjectURL(audioBlob);
                audioChunks = [];
                sendToAndroid(audioBlob);
              };
              mediaRecorder.start();
              uiSetRecording(true);
            } catch (err) {
              statusDiv.innerText = `错误: 无法开始录音 (${err.name})。请确保已授予麦克风权限。`;
            }
          }

          function stopRecording() {
            if (mediaRecorder) mediaRecorder.stop();
            uiSetRecording(false);
          }

          function sendToAndroid(blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              // 【万无一失的关键点】
              // reader.result 是一个数据URL，格式为 "data:[<mime-type>];base64,[<data>]"
              // 我们必须移除 "data:[<mime-type>];base64," 这部分前缀，只传递纯粹的 Base64 字符串。
              const base64Data = reader.result.split(",")[1];

              if (
                window.Android &&
                typeof window.Android.predictIntelligibilityFromBase64 ===
                  "function"
              ) {
                statusDiv.innerText = "已发送至原生代码，正在预测...";
                window.Android.predictIntelligibilityFromBase64(
                  base64Data,
                  "handleInferenceResult",
                );
              } else {
                statusDiv.innerText =
                  '错误: 安卓接口 "Android.predictIntelligibilityFromBase64" 未找到。';
              }
            };
            reader.readAsDataURL(blob);
          }

          // 安卓原生代码会回调这个全局函数
          function handleInferenceResult(score) {
            if (score < 0) {
              statusDiv.innerText = "预测失败，请重试。";
              resultDiv.innerText = "";
            } else {
              statusDiv.innerText = "预测完成！";
              resultDiv.innerText = `可懂度分数: ${score.toFixed(4)}`;
            }
          }

          function uiSetRecording(isRecording) {
            startBtn.disabled = isRecording;
            stopBtn.disabled = !isRecording;
            statusDiv.innerText = isRecording
              ? "🔴 正在录音..."
              : "请点击“开始录音”";
            if (!isRecording) resultDiv.innerText = "";
          }
        </script>
      </body>
    </html>
    ```

---

### **第四章：参数详解**

#### **4.1. 模型结构参数**

这些参数在 `InferenceService.kt` 的 `yourAudioPreprocessingFunction` 中使用，必须与训练时一致。

| 参数         | 值    | 说明                                                 |
| :----------- | :---- | :--------------------------------------------------- |
| `n_mels`     | `128` | 梅尔滤波器组的数量，决定了频谱图在频率轴上的分辨率。 |
| `n_fft`      | `400` | 快速傅里叶变换的窗口大小，影响频率分辨率。           |
| `hop_length` | `160` | 帧移，相邻帧的距离，影响时间分辨率。                 |
| `audio_len`  | `500` | 频谱图在时间轴上的最终固定长度（帧数）。             |

#### **4.2. 接口调用参数**

这是 JavaScript 调用 `WebAppInterface.kt` 方法时传递的参数。

| 参数名              | 类型     | 说明                                                        |
| :------------------ | :------- | :---------------------------------------------------------- |
| `audioDataAsBase64` | `String` | **纯净的** Base64 编码字符串，不含数据URL前缀。             |
| `callbackFuncName`  | `String` | JavaScript 全局作用域下的函数名，原生代码将通过它返回结果。 |

---

这份文档涵盖了从部署、实现到调用的每一个细节，并特别指出了最容易出错的关键点。遵循此指南，您将能够成功地将模型集成到您的应用中。
