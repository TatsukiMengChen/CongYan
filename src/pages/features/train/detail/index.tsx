import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { TextProvider } from "./context/TextContext";
import { NavArea } from "./components/NavArea";
import { TextArea } from "./components/TextArea";
import { FunctionalArea } from "./components/FunctionalArea";
import { GetCorpusAPI, CorpusInfo } from "../../../../api/text";
import { Skeleton } from "antd-mobile";

type TextInfoType = {
  title: string;
  author: string;
  text: string;
};

const TrainDetailPage = () => {
  const location = useLocation();
  const locationState = location.state as { text?: TextInfoType; text_uuid?: string; task_uuid?: string } | undefined;
  const [textData, setTextData] = useState<string[]>([]);
  const [textInfo, setTextInfo] = useState<TextInfoType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTextData = async (uuid: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await GetCorpusAPI(uuid);
        if (res.status === 0 && res.texts && res.texts.length > 0) {
          const corpus = res.texts[0];
          console.log(corpus)
          const info: TextInfoType = {
            title: corpus.title,
            author: `由 ${corpus.add_by === "doctor" ? "医生" : corpus.add_by} 添加`,
            text: corpus.text,
          };
          setTextInfo(info);
          setTextData(info.text.split("\n").filter(line => line.trim() !== ''));
        } else {
          setError(res.message || "未能加载文本内容");
          console.error("Failed to fetch text data:", res.message);
        }
      } catch (err: any) {
        setError(err.message || "加载文本时出错");
        console.error("Error fetching text data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (locationState?.text) {
      setTextInfo(locationState.text);
      setTextData(locationState.text.text.split("\n").filter(line => line.trim() !== ''));
      setIsLoading(false);
    } else if (locationState?.text_uuid) {
      fetchTextData(locationState.text_uuid);
    } else {
      setError("无效的页面状态，缺少文本信息");
      setIsLoading(false);
      console.error("Invalid location state:", locationState);
    }
  }, [locationState]);

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

  if (!textInfo) {
    return <div className="p-4">未能加载文本信息。</div>;
  }

  return (
    <TextProvider>
      <div className="h-100vh flex flex-col">
        <NavArea title={textInfo.title} author={textInfo.author} />
        <div className="relative h-full flex flex-col overflow-hidden">
          <TextArea textData={textData} />
          <FunctionalArea text={textInfo.text} />
        </div>
      </div>
    </TextProvider>
  );
};

export default TrainDetailPage;
