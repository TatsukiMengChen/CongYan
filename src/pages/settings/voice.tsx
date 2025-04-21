import { Divider } from "@mui/material";
import { Radio, Space, Spin, Button } from "antd";
import { Popup, Toast } from "antd-mobile";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../../components/Navbar";
import { OptionButton } from "../../components/OptionButton";
import { ScrollView } from "../../components/ScrollView";

interface VoiceModel {
  name: string; // 音色
  model: string;
  voice: string; // voice 参数
  useCase: string; // 适用场景
  language: string; // 语言
  sampleRate: number; // 默认采样率
  format: string; // 默认音频格式
  audioPreviewUrl: string; // 音频预览 URL
}

const VoiceSettingsPage: React.FC = () => {
  const navigator = useNavigate();
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]); // State for models
  const [loading, setLoading] = useState(true); // Loading state
  const [sentenceVoice, setSentenceVoice] = useState<string | null>(null);
  const [charVoice, setCharVoice] = useState<string | null>(null);
  const [selectedSentenceVoiceName, setSelectedSentenceVoiceName] = useState<string>("加载中...");
  const [selectedCharVoiceName, setSelectedCharVoiceName] = useState<string>("加载中...");
  const [popupVisible, setPopupVisible] = useState(false);
  const [editingType, setEditingType] = useState<'sentence' | 'char' | null>(null);
  const [tempSelectedVoice, setTempSelectedVoice] = useState<string | null>(null);

  // Fetch voice models from JSON
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/voice/models.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: VoiceModel[] = await response.json();
        setVoiceModels(data);
      } catch (error) {
        console.error("Failed to fetch voice models:", error);
        Toast.show({ content: "加载语音模型失败", position: "bottom" });
        // Optionally set empty array or handle error state
        setVoiceModels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  // Helper function to find model name by voice parameter, using useCallback
  const findModelNameByVoice = useCallback((voice: string | null): string => {
    if (loading) return "加载中..."; // Return loading if models not yet loaded
    if (!voice) return "未选择";
    const model = voiceModels.find(m => m.voice === voice);
    return model ? model.name : "未知";
  }, [voiceModels, loading]);

  // Initialize selections after models are loaded
  useEffect(() => {
    if (!loading && voiceModels.length > 0) { // Only run when models are loaded
      const storedSentenceVoice = localStorage.getItem("sentenceTTSVoice");
      const storedCharVoice = localStorage.getItem("characterTTSVoice");

      let initialSentenceVoice = storedSentenceVoice;
      let initialCharVoice = storedCharVoice;

      // Set default if nothing stored or stored value is invalid
      const defaultVoice = voiceModels[0]?.voice;
      const isValidSentenceVoice = voiceModels.some(m => m.voice === initialSentenceVoice);
      const isValidCharVoice = voiceModels.some(m => m.voice === initialCharVoice);

      if (!initialSentenceVoice || !isValidSentenceVoice) {
        if (defaultVoice) {
          initialSentenceVoice = defaultVoice;
          localStorage.setItem("sentenceTTSVoice", defaultVoice);
        } else {
          initialSentenceVoice = null; // Handle case where default doesn't exist
        }
      }
      if (!initialCharVoice || !isValidCharVoice) {
        if (defaultVoice) {
          initialCharVoice = defaultVoice;
          localStorage.setItem("characterTTSVoice", defaultVoice);
        } else {
          initialCharVoice = null; // Handle case where default doesn't exist
        }
      }

      setSentenceVoice(initialSentenceVoice);
      setCharVoice(initialCharVoice);
      // Update names based on potentially new defaults or loaded data
      setSelectedSentenceVoiceName(findModelNameByVoice(initialSentenceVoice));
      setSelectedCharVoiceName(findModelNameByVoice(initialCharVoice));
    }
  }, [loading, voiceModels, findModelNameByVoice]);

  const openPopup = (type: 'sentence' | 'char') => {
    if (loading) {
      Toast.show({ content: "模型数据加载中...", position: "bottom" });
      return;
    }
    setEditingType(type);
    setTempSelectedVoice(type === 'sentence' ? sentenceVoice : charVoice);
    setPopupVisible(true);
  };

  const handleConfirmSelection = () => {
    if (editingType && tempSelectedVoice) {
      const selectedModelName = findModelNameByVoice(tempSelectedVoice);
      if (editingType === 'sentence') {
        setSentenceVoice(tempSelectedVoice);
        setSelectedSentenceVoiceName(selectedModelName);
        localStorage.setItem("sentenceTTSVoice", tempSelectedVoice);
        Toast.show({ content: "句子 TTS 音色已更新", position: "bottom" });
      } else {
        setCharVoice(tempSelectedVoice);
        setSelectedCharVoiceName(selectedModelName);
        localStorage.setItem("characterTTSVoice", tempSelectedVoice);
        Toast.show({ content: "单字 TTS 音色已更新", position: "bottom" });
      }
    }
    setPopupVisible(false);
    setEditingType(null);
  };

  return (
    <div className="h-full flex flex-col">
      <Navbar onBack={() => navigator(-1)}>语音模型选择</Navbar>
      <ScrollView>
        {loading ? (
          <div className="flex-center p-10">
            <Spin size="large" />
          </div>
        ) : voiceModels.length === 0 ? (
          <div className="p-5 text-center color-gray">无法加载语音模型列表。</div>
        ) : (
          <>
            <div className="px-5 py-2 color-gray">语音模型设置</div>
            <OptionButton 
              title="句子 TTS 模型" 
              onClick={() => openPopup('sentence')}
              description={selectedSentenceVoiceName}
            />
            <Divider />
            <OptionButton 
              title="单字 TTS 模型" 
              onClick={() => openPopup('char')}
              description={selectedCharVoiceName}
            />
            
            <div className="px-5 py-4 text-sm color-gray">
              选择合适的语音模型将提升您的阅读体验。句子 TTS 模型用于朗读整句内容，单字 TTS 模型用于朗读单个汉字。
            </div>
          </>
        )}
      </ScrollView>

      <Popup
        visible={popupVisible}
        onMaskClick={() => {
          setPopupVisible(false);
          setEditingType(null);
        }}
        position="bottom"
        bodyStyle={{
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          maxHeight: '85vh',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden' // 禁止左右滑动
        }}
      >
        {loading ? (
          <div className="flex-center p-10">
            <Spin size="large" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 text-lg font-bold text-center border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              {editingType === 'sentence' ? '选择句子 TTS 模型' : '选择单字 TTS 模型'}
            </div>
            
            <div 
              className="flex-grow overflow-auto" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overflowX: 'hidden' // 禁止左右滑动
              }}
            >
              <Radio.Group
                onChange={(e) => setTempSelectedVoice(e.target.value)}
                value={tempSelectedVoice}
                className="w-full"
              >
                <Space direction="vertical" className="w-full box-border p-3">
                  {voiceModels.map((model) => (
                    <Radio key={model.voice} value={model.voice} className="w-full !mb-4">
                      <div className="ml-2 w-full">
                        <div className="font-bold">{model.name}</div>
                        <div className="text-sm text-gray-500 mt-1">适用场景: {model.useCase}</div>
                        <div className="mt-2 w-full">
                          <audio 
                            controls 
                            controlsList="nodownload" 
                            style={{ 
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: '200px'
                            }}
                            src={model.audioPreviewUrl} 
                          >
                            Your browser does not support audio.
                          </audio>
                        </div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900 z-10">
              <Button 
                type="primary" 
                block 
                size="large" 
                onClick={handleConfirmSelection}
                style={{
                  borderRadius: '8px',
                  height: '44px'
                }}
              >
                确定
              </Button>
            </div>
          </div>
        )}
      </Popup>
    </div>
  );
};

export default VoiceSettingsPage;
