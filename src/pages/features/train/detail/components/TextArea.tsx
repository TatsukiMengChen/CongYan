import { useEffect } from "react";
import { useTextContext } from "../context/TextContext";
import { Text } from "./Text";

export const TextArea = ({ textData }: { textData: string[] }) => {
  const { setSelectedText, setSelectedTextIndex } = useTextContext();

  useEffect(() => {
    if (textData.length > 0) {
      setSelectedText(textData[0]);
      setSelectedTextIndex(0);
    }
  }, [textData, setSelectedText, setSelectedTextIndex]);

  return (
    <div className="h-full overflow-y-auto p-4">
      {textData.map((text, index) => (
        <Text key={index} text={text} index={index} />
      ))}
    </div>
  );
};
