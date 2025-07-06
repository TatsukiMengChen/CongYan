package com.congyan.app

import android.content.Context
import android.util.Log
import org.pytorch.IValue
import org.pytorch.LiteModuleLoader
import org.pytorch.Module
import org.pytorch.Tensor
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlin.random.Random

class InferenceService(private val context: Context, private val modelAssetName: String) {

    private var module: Module? = null
    private val TAG = "InferenceService"

    init {
        loadModel()
    }

    /**
     * 加载PyTorch模型
     */
    private fun loadModel() {
        try {
            val modelPath = assetFilePath(context, modelAssetName)
            module = LiteModuleLoader.load(modelPath)
            Log.i(TAG, "Model loaded successfully: $modelAssetName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load model: $modelAssetName", e)
        }
    }

    /**
     * 核心推理方法，接收音频文件路径，返回预测分数
     * @param audioFilePath 设备上音频文件的绝对路径
     * @return 浮点型的可懂度分数
     */
    fun predict(audioFilePath: String): Float {
        return try {
            val module = this.module ?: throw IllegalStateException("Model not loaded")
            
            // 步骤1: 音频预处理
            val preprocessedData = audioPreprocessing(audioFilePath)
            
            // 步骤2: 创建输入张量
            val shape = longArrayOf(1, 128, 500) // [Batch, Mels, Time]
            val inputTensor = Tensor.fromBlob(preprocessedData, shape)
            
            // 步骤3: 执行模型推理
            val outputTensor = module.forward(IValue.from(inputTensor)).toTensor()
            
            // 步骤4: 提取结果
            val result = outputTensor.dataAsFloatArray[0]
            Log.i(TAG, "Inference completed. Score: $result")
            
            result
        } catch (e: Exception) {
            Log.e(TAG, "Inference failed", e)
            -1.0f // 返回错误码
        }
    }

    /**
     * 音频预处理函数
     * 注意：这是一个简化的实现，实际项目中需要根据训练时的预处理步骤来实现
     * @param audioFilePath 音频文件路径
     * @return 预处理后的音频特征数组
     */
    private fun audioPreprocessing(audioFilePath: String): FloatArray {
        // TODO: 实现真正的音频预处理逻辑
        // 这里需要实现与Python训练脚本完全一致的预处理步骤：
        // 1. 加载音频文件
        // 2. 计算梅尔频谱图 (n_fft=400, hop_length=160, n_mels=128)
        // 3. 幅度转分贝
        // 4. 实例归一化
        // 5. 填充或截断到500帧
        
        Log.w(TAG, "Using placeholder audio preprocessing. Please implement actual preprocessing logic.")
        
        // 暂时返回随机数据作为占位符
        val size = 128 * 500
        val data = FloatArray(size)
        val random = Random.Default
        for (i in data.indices) {
            data[i] = random.nextFloat() * 2 - 1 // -1 to 1
        }
        return data
    }

    /**
     * 获取assets文件的绝对路径
     * @param context Android上下文
     * @param assetName 资产文件名
     * @return 文件的绝对路径
     */
    private fun assetFilePath(context: Context, assetName: String): String {
        val file = File(context.filesDir, assetName)
        
        // 如果文件已存在且不为空，直接返回路径
        if (file.exists() && file.length() > 0) {
            return file.absolutePath
        }
        
        // 从assets目录复制文件到内部存储
        try {
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
        } catch (e: IOException) {
            Log.e(TAG, "Failed to copy asset file: $assetName", e)
            throw e
        }
    }

    /**
     * 检查模型是否已加载
     */
    fun isModelLoaded(): Boolean {
        return module != null
    }

    /**
     * 释放模型资源
     */
    fun release() {
        module = null
        Log.i(TAG, "Model resources released")
    }
} 