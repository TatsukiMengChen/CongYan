import { useEffect } from "react";
import { useTextContext } from "../context/TextContext";
import { Text } from "./Text";

export const TextArea = ({ textData }: { textData: string[] }) => {
  const {
    setSelectedText,
    setSelectedTextIndex,
    backgroundImage,
    imageLoadingState,
    setImageLoadingState,
  } = useTextContext();

  useEffect(() => {
    if (textData.length > 0) {
      setSelectedText(textData[0]);
      setSelectedTextIndex(0);
    }
  }, [textData, setSelectedText, setSelectedTextIndex]);

  return (
    <div className="h-full overflow-y-auto relative">
      {/* 背景图片容器 - 固定定位，不随内容滚动 */}
      {backgroundImage && (
        <div className="fixed inset-0 w-full h-full z-0">
          <img
            src={backgroundImage}
            alt="背景图片"
            className="w-full h-full object-cover"
            onLoad={() => setImageLoadingState("loaded")}
            onError={() => setImageLoadingState("error")}
          />

          {/* 多层渐变遮罩 - 营造深度感 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-white/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
          <div className="absolute inset-0 bg-black/15" />
        </div>
      )}

      {/* 文字内容层 */}
      <div className="relative z-10 p-4">
        {/* 文本内容 */}
        <div className={backgroundImage ? "space-y-3" : "space-y-2"}>
          {textData.map((text, index) => (
            <div
              key={index}
              className={`transition-all duration-300 ${
                backgroundImage
                  ? "rounded-2xl p-4 bg-white/90 backdrop-blur-lg shadow-xl border border-white/30 hover:bg-white/95 hover:shadow-2xl hover:scale-[1.02]"
                  : "rounded-lg p-2 bg-transparent hover:bg-gray-50/50"
              }`}
              style={
                backgroundImage
                  ? {
                      backdropFilter: "blur(16px)",
                      boxShadow:
                        "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)",
                    }
                  : {}
              }
            >
              <Text text={text} index={index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
