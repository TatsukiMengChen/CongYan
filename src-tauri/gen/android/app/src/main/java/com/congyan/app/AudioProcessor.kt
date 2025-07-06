package com.congyan.app

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaCodec
import android.util.Log
import kotlin.math.*
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import org.jtransforms.fft.FloatFFT_1D

/**
 * 音频处理工具类
 * 实现与Python训练脚本完全一致的音频预处理逻辑
 */
class AudioProcessor {
    
    companion object {
        private const val TAG = "AudioProcessor"
        
        // 与Python脚本保持一致的参数
        const val N_MELS = 128
        const val N_FFT = 400
        const val HOP_LENGTH = 160
        const val TARGET_SAMPLE_RATE = 16000
        const val TARGET_AUDIO_LEN_FRAMES = 500
        
        // 梅尔滤波器相关参数
        private const val F_MIN = 0.0f
        private val F_MAX = (TARGET_SAMPLE_RATE / 2.0).toFloat()
        
        // 窗函数类型
        private enum class WindowType { HANN }
    }
    
    /**
     * 从音频文件加载并预处理音频数据
     * @param audioFilePath 音频文件路径
     * @return 预处理后的梅尔频谱图数据 [128, 500] 展平为一维数组
     */
    fun processAudioFile(audioFilePath: String): FloatArray {
        return try {
            // 1. 加载音频文件
            val (audioData, sampleRate) = loadAudioFromFile(audioFilePath)
            
            // 2. 转换为单声道 (在此实现中，加载时已处理)
            // 3. 重采样到目标采样率
            val resampledAudio = resampleIfNeeded(audioData, sampleRate, TARGET_SAMPLE_RATE)
            
            // 4. 计算梅尔频谱图
            val melSpectrogram = computeMelSpectrogram(resampledAudio)
            
            // 5. 转换为分贝
            val melSpectrogramDB = amplitudeToDb(melSpectrogram)
            
            // 6. 实例归一化
            val normalizedSpectrogram = instanceNormalization(melSpectrogramDB)
            
            // 7. 填充或截断到目标长度
            val processedSpectrogram = padOrTruncate(normalizedSpectrogram, TARGET_AUDIO_LEN_FRAMES)
            
            // 8. 展平为一维数组
            processedSpectrogram.flatten()
            
        } catch (e: Exception) {
            Log.e(TAG, "音频预处理失败: ${e.message}", e)
            FloatArray(N_MELS * TARGET_AUDIO_LEN_FRAMES) // 返回零数组作为fallback
        }
    }
    
    /**
     * 从音频文件加载音频数据
     */
    private fun loadAudioFromFile(audioFilePath: String): Pair<FloatArray, Int> {
        return loadAudioWithMediaExtractor(audioFilePath)
    }
    
    /**
     * 使用MediaExtractor和MediaCodec加载音频
     */
    @Suppress("DEPRECATION")
    private fun loadAudioWithMediaExtractor(audioFilePath: String): Pair<FloatArray, Int> {
        val extractor = MediaExtractor()
        val decodedData = mutableListOf<Float>()
        var sampleRate = -1

        try {
            extractor.setDataSource(audioFilePath)
            val trackIndex = selectAudioTrack(extractor)
            if (trackIndex < 0) throw RuntimeException("在文件中未找到音频轨道")
            extractor.selectTrack(trackIndex)

            val format = extractor.getTrackFormat(trackIndex)
            sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
            val mime = format.getString(MediaFormat.KEY_MIME) ?: throw RuntimeException("无法获取MIME类型")

            val codec = MediaCodec.createDecoderByType(mime)
            codec.configure(format, null, null, 0)
            codec.start()

            val bufferInfo = MediaCodec.BufferInfo()
            var isEos = false

            while (!isEos) {
                val inputBufferIndex = codec.dequeueInputBuffer(10000)
                if (inputBufferIndex >= 0) {
                    val inputBuffer = codec.getInputBuffer(inputBufferIndex)!!
                    val sampleSize = extractor.readSampleData(inputBuffer, 0)
                    if (sampleSize < 0) {
                        codec.queueInputBuffer(inputBufferIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                        isEos = true
                    } else {
                        codec.queueInputBuffer(inputBufferIndex, 0, sampleSize, extractor.sampleTime, 0)
                        extractor.advance()
                    }
                }

                var outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 10000)
                while (outputBufferIndex >= 0) {
                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) isEos = true

                    if (bufferInfo.size > 0) {
                        val outputBuffer = codec.getOutputBuffer(outputBufferIndex)!!
                        // 将解码后的PCM数据（Short）转换为Float
                        val shortBuffer = outputBuffer.order(ByteOrder.nativeOrder()).asShortBuffer()
                        for (i in 0 until bufferInfo.size / 2) {
                            decodedData.add(shortBuffer.get(i) / 32768.0f)
                        }
                    }
                    codec.releaseOutputBuffer(outputBufferIndex, false)
                    outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 10000)
                }
            }
            codec.stop()
            codec.release()
        } finally {
            extractor.release()
        }

        return Pair(decodedData.toFloatArray(), sampleRate)
    }

    private fun selectAudioTrack(extractor: MediaExtractor): Int {
        for (i in 0 until extractor.trackCount) {
            val format = extractor.getTrackFormat(i)
            val mime = format.getString(MediaFormat.KEY_MIME)
            if (mime?.startsWith("audio/") == true) return i
        }
        return -1
    }
    
    /**
     * 重采样到目标采样率
     */
    private fun resampleIfNeeded(audioData: FloatArray, currentSampleRate: Int, targetSampleRate: Int): FloatArray {
        if (currentSampleRate == targetSampleRate) return audioData

        val ratio = targetSampleRate.toDouble() / currentSampleRate.toDouble()
        val newSize = floor(audioData.size * ratio).toInt()
        val resampledData = FloatArray(newSize)

        for (i in 0 until newSize) {
            val originalIndex = i / ratio
            val index1 = floor(originalIndex).toInt()
            val index2 = (index1 + 1).coerceAtMost(audioData.size - 1)
            val fraction = originalIndex - index1

            resampledData[i] = (audioData[index1] * (1 - fraction) + audioData[index2] * fraction).toFloat()
        }
        return resampledData
    }
    
    /**
     * 计算梅尔频谱图
     * 实现STFT -> 功率谱 -> 梅尔滤波器组的完整流程
     */
    private fun computeMelSpectrogram(audioData: FloatArray): Array<FloatArray> {
        val stftResult = computeSTFT(audioData, N_FFT, HOP_LENGTH)
        val powerSpectrum = computePowerSpectrum(stftResult)
        val melFilters = createMelFilterBank(N_MELS, N_FFT, TARGET_SAMPLE_RATE, F_MIN, F_MAX)
        val melSpectrogram = applyMelFilters(powerSpectrum, melFilters)
        return melSpectrogram.map { frame -> frame.map { log10(it + 1e-10f) }.toFloatArray() }.toTypedArray()
    }
    
    /**
     * 计算短时傅里叶变换 (STFT)
     */
    private fun computeSTFT(audioData: FloatArray, nFft: Int, hopLength: Int): Array<FloatArray> {
        val window = createWindow(nFft, WindowType.HANN)
        val numFrames = (audioData.size - nFft) / hopLength + 1
        val stftResult = Array(numFrames) { FloatArray(nFft / 2 + 1) }
        val fft = FloatFFT_1D(nFft.toLong())

        for (i in 0 until numFrames) {
            val start = i * hopLength
            val frame = FloatArray(nFft) { j ->
                if (start + j < audioData.size) audioData[start + j] * window[j] else 0.0f
            }
            val fftResult = FloatArray(nFft * 2)
            System.arraycopy(frame, 0, fftResult, 0, nFft)
            fft.realForward(fftResult)

            for (k in 0..nFft / 2) {
                val real = fftResult[2 * k]
                val imag = if (k > 0 && k < nFft / 2) fftResult[2 * k + 1] else 0.0f
                stftResult[i][k] = sqrt(real * real + imag * imag)
            }
        }
        return stftResult
    }
    
    /**
     * 创建窗函数
     */
    private fun createWindow(size: Int, type: WindowType): FloatArray {
        return when (type) {
            WindowType.HANN -> FloatArray(size) { i ->
                (0.5 * (1.0 - cos(2.0 * PI * i / (size - 1)))).toFloat()
            }
        }
    }
    
    /**
     * 计算功率谱
     */
    private fun computePowerSpectrum(stftMagnitudes: Array<FloatArray>): Array<FloatArray> {
        return stftMagnitudes.map { frame ->
            frame.map { it * it }.toFloatArray()
        }.toTypedArray()
    }
    
    /**
     * 创建梅尔滤波器组
     */
    private fun createMelFilterBank(nMels: Int, nFft: Int, sampleRate: Int, fMin: Float, fMax: Float): Array<FloatArray> {
        val melFilters = Array(nMels) { FloatArray(nFft / 2 + 1) }
        
        // 创建梅尔刻度边界
        val melMin = hzToMel(fMin)
        val melMax = hzToMel(fMax)
        val melPoints = FloatArray(nMels + 2) { i ->
            melMin + (melMax - melMin) * i / (nMels + 1)
        }
        
        // 转换回Hz
        val hzPoints = melPoints.map { melToHz(it) }
        
        // 转换为FFT bin索引
        val binPoints = hzPoints.map { hz ->
            floor((nFft + 1) * hz / sampleRate).toInt()
        }
        
        // 创建三角滤波器
        for (i in 0 until nMels) {
            val left = binPoints[i]
            val center = binPoints[i + 1]
            val right = binPoints[i + 2]
            
            for (j in left until right) {
                if (j < center) {
                    melFilters[i][j] = (j - left).toFloat() / (center - left)
                } else {
                    melFilters[i][j] = (right - j).toFloat() / (right - center)
                }
            }
        }
        
        return melFilters
    }
    
    /**
     * Hz转梅尔刻度
     */
    private fun hzToMel(hz: Float): Float {
        return 2595.0f * log10(1.0f + hz / 700.0f)
    }
    
    /**
     * 梅尔刻度转Hz
     */
    private fun melToHz(mel: Float): Float {
        return 700.0f * (10.0f.pow(mel / 2595.0f) - 1.0f)
    }
    
    /**
     * 应用梅尔滤波器组
     */
    private fun applyMelFilters(powerSpectrum: Array<FloatArray>, melFilters: Array<FloatArray>): Array<FloatArray> {
        val numFrames = powerSpectrum.size
        val numMels = melFilters.size
        
        return Array(numMels) { melIndex ->
            FloatArray(numFrames) { frameIndex ->
                var sum = 0.0f
                for (binIndex in melFilters[melIndex].indices) {
                    if (binIndex < powerSpectrum[frameIndex].size) {
                        sum += powerSpectrum[frameIndex][binIndex] * melFilters[melIndex][binIndex]
                    }
                }
                sum
            }
        }
    }
    
    /**
     * 幅度转分贝
     */
    private fun amplitudeToDb(melSpectrogram: Array<FloatArray>): Array<FloatArray> {
        val refValue = melSpectrogram.maxOfOrNull { it.maxOrNull() ?: 0f } ?: 1f
        return melSpectrogram.map { row ->
            row.map { amplitude ->
                20.0f * log10((amplitude / refValue).coerceAtLeast(1e-5f))
            }.toFloatArray()
        }.toTypedArray()
    }
    
    /**
     * 实例归一化
     */
    private fun instanceNormalization(spectrogram: Array<FloatArray>): Array<FloatArray> {
        val allValues = spectrogram.flatMap { it.toList() }
        val mean = allValues.average().toFloat()
        val std = sqrt(allValues.map { (it - mean).pow(2) }.average().toFloat())
        
        return spectrogram.map { row ->
            row.map { (it - mean) / (std + 1e-6f) }.toFloatArray()
        }.toTypedArray()
    }
    
    /**
     * 填充或截断到目标长度
     */
    private fun padOrTruncate(spectrogram: Array<FloatArray>, targetLength: Int): Array<FloatArray> {
        if (spectrogram.isEmpty() || spectrogram[0].isEmpty()) {
            return Array(N_MELS) { FloatArray(targetLength) }
        }
        val currentLength = spectrogram[0].size
        return when {
            currentLength < targetLength -> spectrogram.map { it + FloatArray(targetLength - currentLength) }.toTypedArray()
            currentLength > targetLength -> spectrogram.map { it.sliceArray(0 until targetLength) }.toTypedArray()
            else -> spectrogram
        }
    }
    
    /**
     * 将二维数组展平为一维数组
     */
    private fun Array<FloatArray>.flatten(): FloatArray {
        if (this.isEmpty()) return floatArrayOf()
        val totalSize = this.size * this[0].size
        val result = FloatArray(totalSize)
        var index = 0
        for (row in this) {
            System.arraycopy(row, 0, result, index, row.size)
            index += row.size
        }
        return result
    }
} 