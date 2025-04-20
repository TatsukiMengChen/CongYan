import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { TextProvider } from "./context/TextContext";
import { NavArea } from "./components/NavArea";
import { TextArea } from "./components/TextArea";
import { FunctionalArea } from "./components/FunctionalArea";
import { GetCorpusAPI } from "../../../../api/text"; // 假设 CorpusInfo 包含 uuid
import { Skeleton } from "antd-mobile";

type TextInfoType = {
  title: string;
  author: string;
  text: string;
  uuid?: string; // 如果需要，在此添加 uuid，或从 locationState 获取
};

const TrainDetailPage = () => {
  const location = useLocation();
  // 确保 locationState 类型包含 text_uuid
  const locationState = location.state as { text?: TextInfoType; text_uuid?: string; task_uuid?: string } | undefined;
  const [textData, setTextData] = useState<string[]>([]);
  const [textInfo, setTextInfo] = useState<TextInfoType | null>(null);
  const [currentTextUuid, setCurrentTextUuid] = useState<string | null>(locationState?.text_uuid || null); // 存储 UUID
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTextData = async (uuid: string) => {
      setIsLoading(true);
      setError(null);
      setCurrentTextUuid(uuid); // 存储正在获取的 UUID
      try {
        const res = await GetCorpusAPI(uuid);
        if (res.status === 0 && res.texts && res.texts.length > 0) {
          const corpus = res.texts[0];
          const info: TextInfoType = {
            title: corpus.title,
            author: `由 ${corpus.add_by === "doctor" ? "医生" : corpus.add_by} 添加`,
            text: corpus.text,
            uuid: corpus.uuid, // 假设 API 返回文本的 uuid
          };
          setTextInfo(info);
          setTextData(info.text.split("\n").filter(line => line.trim() !== ''));
          // 确保即使是获取的 UUID 也被设置
          if (!currentTextUuid) {
              setCurrentTextUuid(corpus.uuid);
          }
        } else {
          setError(res.message || "未能加载文本内容");
          console.error("Failed to fetch text data:", res.message); // 保留错误日志
        }
      } catch (err: any) {
        setError(err.message || "加载文本时出错");
        console.error("Error fetching text data:", err); // 保留错误日志
      } finally {
        setIsLoading(false);
      }
    };

    // 优先使用 location state 中的 text_uuid
    const initialUuid = locationState?.text_uuid;

    if (initialUuid) {
        fetchTextData(initialUuid);
    } else if (locationState?.text) {
        // 如果直接传递了 text 对象，尝试从中获取 UUID 或处理缺少 UUID 的情况
        setTextInfo(locationState.text);
        setTextData(locationState.text.text.split("\n").filter(line => line.trim() !== ''));
        const textUuidFromState = locationState.text.uuid || null;
        setCurrentTextUuid(textUuidFromState);
        if (!locationState.text.uuid) {
            console.warn("Text object provided in location state is missing UUID."); // 保留警告
        }
        setIsLoading(false);
    } else {
      setError("无效的页面状态，缺少文本信息或ID");
      setIsLoading(false);
      console.error("Invalid location state:", locationState); // 保留错误日志
    }
  }, [locationState, currentTextUuid]); // 添加 currentTextUuid 到依赖项以避免潜在问题

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton.Title animated />
        <Skeleton.Paragraph lineCount={5} animated />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">错误：{error}</div>;
  }

  if (!textInfo || !currentTextUuid) { // Also check if currentTextUuid is available
    return <div className="p-4">未能加载文本信息或其ID。</div>;
  }

  return (
    <TextProvider>
      <div className="h-100vh flex flex-col">
        <NavArea title={textInfo.title} author={textInfo.author} />
        <div className="relative h-full flex flex-col overflow-hidden">
          <TextArea textData={textData} />
          {/* 将存储的 currentTextUuid 传递给 FunctionalArea */}
          <FunctionalArea text={textInfo.text} textUuid={currentTextUuid} />
        </div>
      </div>
    </TextProvider>
  );
};

export default TrainDetailPage;
