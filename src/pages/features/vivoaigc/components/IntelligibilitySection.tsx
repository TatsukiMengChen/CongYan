import React, { useState, useRef, useCallback } from "react";
import { Button, Space, Typography, Card, message, Progress, Spin } from "antd";
import {
  AudioOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface IntelligibilityResult {
  score: number;
  timestamp: number;
  audioUrl?: string;
}

const IntelligibilitySection: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [results, setResults] = useState<IntelligibilityResult[]>([]);
  const [modelStatus, setModelStatus] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 检查模型状态
  const checkModelStatus = useCallback(async () => {
    try {
      if (window.Android && window.Android.getModelStatus) {
        const status = window.Android.getModelStatus();
        setModelStatus(status);
        return status.includes("loaded");
      }
      return false;
    } catch (error) {
      console.error("检查模型状态失败:", error);
      return false;
    }
  }, []);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 检查模型状态
      const isModelReady = await checkModelStatus();
      if (!isModelReady) {
        message.error("模型未加载，请稍后重试");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // 停止所有音频轨道
        stream.getTracks().forEach((track) => track.stop());

        // 自动进行推理
        await performInference(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      message.success("开始录音...");
    } catch (error) {
      console.error("录音失败:", error);
      message.error("录音失败，请检查麦克风权限");
    }
  }, [checkModelStatus]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.info("录音已停止，正在处理...");
    }
  }, []);

  // 执行推理
  const performInference = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);

      try {
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(",")[1];

          // 定义全局回调函数
          (window as any).handleIntelligibilityResult = (score: number) => {
            setIsProcessing(false);

            if (score < 0) {
              message.error("推理失败，请重试");
            } else {
              const result: IntelligibilityResult = {
                score,
                timestamp: Date.now(),
                audioUrl,
              };

              setResults((prev) => [result, ...prev]);
              message.success(`可懂度分数：${score.toFixed(4)}`);
            }
          };

          // 调用安卓端接口
          if (
            window.Android &&
            window.Android.predictIntelligibilityFromBase64
          ) {
            window.Android.predictIntelligibilityFromBase64(
              base64Data,
              "handleIntelligibilityResult",
            );
          } else {
            setIsProcessing(false);
            message.error("安卓接口不可用");
          }
        };

        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error("推理失败:", error);
        setIsProcessing(false);
        message.error("推理失败：" + error);
      }
    },
    [audioUrl],
  );

  // 播放音频
  const playAudio = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error("播放失败:", error);
      message.error("播放失败");
    });
  }, []);

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "#52c41a";
    if (score >= 0.6) return "#faad14";
    return "#ff4d4f";
  };

  // 获取分数等级
  const getScoreLevel = (score: number) => {
    if (score >= 0.8) return "优秀";
    if (score >= 0.6) return "良好";
    if (score >= 0.4) return "一般";
    return "较差";
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={3}>语音可懂度测试</Title>

      <Card style={{ marginBottom: "20px" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>模型状态：</Text>
            <Text type={modelStatus.includes("loaded") ? "success" : "danger"}>
              {modelStatus || "未知"}
            </Text>
            <Button
              size="small"
              onClick={checkModelStatus}
              style={{ marginLeft: "10px" }}
            >
              刷新状态
            </Button>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<AudioOutlined />}
              onClick={startRecording}
              disabled={isRecording || isProcessing}
              loading={isProcessing}
            >
              {isRecording ? "录音中..." : "开始录音"}
            </Button>

            <Button
              danger
              icon={<StopOutlined />}
              onClick={stopRecording}
              disabled={!isRecording}
            >
              停止录音
            </Button>
          </Space>

          {isProcessing && (
            <div>
              <Spin size="small" />
              <Text style={{ marginLeft: "10px" }}>正在分析音频...</Text>
            </div>
          )}

          {audioUrl && (
            <div>
              <Text strong>录音预览：</Text>
              <Button
                type="link"
                icon={<PlayCircleOutlined />}
                onClick={() => playAudio(audioUrl)}
              >
                播放录音
              </Button>
            </div>
          )}
        </Space>
      </Card>

      {results.length > 0 && (
        <Card title="测试结果">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {results.map((result, index) => (
              <Card
                key={index}
                size="small"
                style={{ border: "1px solid #f0f0f0" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text strong style={{ color: getScoreColor(result.score) }}>
                      分数：{result.score.toFixed(4)}
                    </Text>
                    <Text style={{ marginLeft: "10px" }}>
                      等级：{getScoreLevel(result.score)}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      {new Date(result.timestamp).toLocaleString()}
                    </Text>
                    {result.audioUrl && (
                      <Button
                        type="link"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => playAudio(result.audioUrl!)}
                      >
                        播放
                      </Button>
                    )}
                  </div>
                </div>
                <Progress
                  percent={result.score * 100}
                  strokeColor={getScoreColor(result.score)}
                  showInfo={false}
                  style={{ marginTop: "10px" }}
                />
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default IntelligibilitySection;
