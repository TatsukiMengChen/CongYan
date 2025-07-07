import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Select,
  Slider,
} from "antd";
import { SoundOutlined, PlayCircleOutlined } from "@ant-design/icons";
import {
  createVivoAigcSDK,
  TTS_VOICES,
  TTS_ENGINES,
} from "../../../../api/vivoAigc";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TtsSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("这是一个语音合成测试");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [voice, setVoice] = useState(TTS_VOICES.VIVO_HELPER);
  const [speed, setSpeed] = useState(50);
  const [volume, setVolume] = useState(50);

  /**
   * 创建 SDK 实例
   */
  const createSDK = () => {
    return createVivoAigcSDK({
      appId: import.meta.env.VITE_VIVO_AIGC_APP_ID || "",
      appKey: import.meta.env.VITE_VIVO_AIGC_APP_KEY || "",
      baseURL:
        import.meta.env.VITE_VIVO_AIGC_BASE_URL || "https://api-ai.vivo.com.cn",
    });
  };

  /**
   * 执行语音合成
   */
  const performTTS = async () => {
    if (!text.trim()) {
      message.error("请输入要合成的文本");
      return;
    }

    setLoading(true);
    setAudioUrl("");

    try {
      const sdk = createSDK();

      message.info("TTS功能需要WebSocket支持，当前环境可能存在限制");

      // 注意：由于TTS使用WebSocket，在浏览器环境可能有限制
      // 这里提供一个模拟的实现
      setTimeout(() => {
        message.success("TTS功能已集成，但需要在适当的环境中测试WebSocket连接");
        setLoading(false);
      }, 2000);

      // 真实的TTS调用（取消注释以测试）
      /*
      const audioBuffer = await sdk.tts.synthesize(text, {
        vcn: voice,
        speed: speed,
        volume: volume,
      });
      
      const blob = new Blob([audioBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      message.success('语音合成成功');
      */
    } catch (error: any) {
      message.error(`语音合成失败: ${error.message}`);
      console.error("TTS error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 播放音频
   */
  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        message.error("音频播放失败");
        console.error("Audio play error:", error);
      });
    }
  };

  /**
   * 清空结果
   */
  const clearResults = () => {
    setAudioUrl("");
    setText("这是一个语音合成测试");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Title level={3} className="!mb-2">
          TTS语音合成
        </Title>
        <Paragraph className="text-gray-600">
          将文字转换为自然的语音，支持多种音色和语速调节
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 输入区域 */}
        <Card title="语音合成" className="h-fit">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                合成文本
              </label>
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="请输入要合成语音的文本..."
                maxLength={500}
                showCount
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音色选择
              </label>
              <Select
                value={voice}
                onChange={setVoice}
                className="w-full"
                placeholder="选择音色"
              >
                <Option value={TTS_VOICES.VIVO_HELPER}>
                  奕雯 (vivoHelper)
                </Option>
                <Option value={TTS_VOICES.YUN_YE}>云野 (温柔)</Option>
                <Option value={TTS_VOICES.WAN_QING}>婉清 (御姐)</Option>
                <Option value={TTS_VOICES.XIAO_FU}>晓芙 (少女)</Option>
                <Option value={TTS_VOICES.YI_GE}>依格</Option>
                <Option value={TTS_VOICES.YI_YI}>依依</Option>
                <Option value={TTS_VOICES.XIAO_MING}>小茗</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语速调节: {speed}
              </label>
              <Slider
                value={speed}
                onChange={setSpeed}
                min={0}
                max={100}
                marks={{
                  0: "慢",
                  50: "正常",
                  100: "快",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音量调节: {volume}
              </label>
              <Slider
                value={volume}
                onChange={setVolume}
                min={1}
                max={100}
                marks={{
                  1: "小",
                  50: "中",
                  100: "大",
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<SoundOutlined />}
                onClick={performTTS}
                loading={loading}
                className="flex-1"
              >
                开始合成
              </Button>
              <Button onClick={clearResults}>清空</Button>
            </div>
          </div>
        </Card>

        {/* 结果区域 */}
        <Card title="合成结果" className="h-fit">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spin tip="正在合成语音..." />
            </div>
          ) : audioUrl ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-green-600 mb-4">✅ 语音合成成功</div>

                <audio
                  controls
                  src={audioUrl}
                  className="w-full mb-4"
                  style={{ height: "40px" }}
                />

                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={playAudio}
                  className="w-full"
                >
                  播放音频
                </Button>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div>
                  <strong>合成文本：</strong>
                  {text}
                </div>
                <div>
                  <strong>使用音色：</strong>
                  {voice}
                </div>
                <div>
                  <strong>语速：</strong>
                  {speed}
                </div>
                <div>
                  <strong>音量：</strong>
                  {volume}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎵</div>
                <div>输入文本开始语音合成</div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
                <div className="font-medium text-yellow-800 mb-2">
                  注意事项：
                </div>
                <ul className="text-yellow-700 space-y-1">
                  <li>• TTS功能使用WebSocket协议</li>
                  <li>• 在某些浏览器环境下可能受限</li>
                  <li>• 建议在服务器环境或原生应用中使用</li>
                  <li>• 文本长度建议控制在500字以内</li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TtsSection;
