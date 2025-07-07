import React from "react";
import { Card, Typography, Tag, message } from "antd";
import Icon from "../../../../components/Icon";

const { Text } = Typography;

interface TopicPresetsProps {
  onTopicSelect: (topic: string) => void;
}

// 预设主题
const presetTopics = [
  {
    category: "发音训练",
    icon: "mic",
    color: "blue",
    topics: ["唇音练习", "舌音练习", "鼻音练习", "声调练习"],
  },
  {
    category: "语调节奏",
    icon: "volume",
    color: "green",
    topics: ["语气变化", "停顿练习", "重音练习", "语速控制"],
  },
  {
    category: "构音练习",
    icon: "format",
    color: "purple",
    topics: ["清晰发音", "音节连读", "语音纠正", "发音准确性"],
  },
  {
    category: "综合训练",
    icon: "magic",
    color: "orange",
    topics: ["日常对话", "朗读训练", "语音表达", "沟通技巧"],
  },
  {
    category: "康复励志",
    icon: "star",
    color: "red",
    topics: ["坚持练习", "克服困难", "自信表达", "积极态度"],
  },
];

const TopicPresets: React.FC<TopicPresetsProps> = ({ onTopicSelect }) => {
  const handleTopicClick = (topic: string) => {
    onTopicSelect(topic);
    // 添加点击反馈
    message.success(`已选择主题：${topic}`);
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="star" size={16} />
          <span>主题预设</span>
        </div>
      }
      size="small"
      className="mb-4"
    >
      <div className="space-y-4">
        {presetTopics.map((category) => (
          <div key={category.category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon
                name={category.icon as any}
                size={16}
                color={`var(--ant-color-${category.color})`}
              />
              <Text strong className="text-sm">
                {category.category}
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.topics.map((topic) => (
                <Tag
                  key={topic}
                  color={category.color}
                  className="cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95 transition-all duration-150 text-xs"
                  onClick={() => handleTopicClick(topic)}
                  style={{
                    userSelect: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                  }}
                >
                  {topic}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <Icon name="info" size={14} color="#1890ff" />
          <Text className="text-xs text-blue-600">
            点击任意主题标签，将自动填入生成配置中
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default TopicPresets;
