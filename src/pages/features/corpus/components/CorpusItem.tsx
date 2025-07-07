import React from "react";
import { Card, Tag, Button, Popconfirm } from "antd";
import Icon from "../../../../components/Icon";
import { CorpusInfo } from "../../../../api/text";
import { formatDate } from "../../../../utils/formatters";

interface CorpusItemProps {
  item: CorpusInfo;
  onClick: () => void;
  onDelete: () => void;
  deleting: boolean;
}

// 康复训练语料分类映射
const categoryMap: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  prose: { label: "散文", color: "blue", icon: "text" },
  "ancient-poem": { label: "古代诗词", color: "purple", icon: "book" },
  "modern-poetry": { label: "现代诗词", color: "cyan", icon: "book" },
  other: { label: "其他", color: "default", icon: "folder" },
};

const CorpusItem: React.FC<CorpusItemProps> = ({
  item,
  onClick,
  onDelete,
  deleting,
}) => {
  // 获取分类信息
  const categoryInfo =
    categoryMap[item.category || "other"] || categoryMap.other;

  // 格式化文本预览
  const getTextPreview = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // 计算文本统计信息
  const textStats = {
    chars: item.text.length,
    lines: item.text.split("\n").length,
  };

  return (
    <Card
      className="corpus-item mb-2 shadow-sm hover:shadow-md transition-all duration-200 border-0 rounded-lg"
      bodyStyle={{ padding: "12px" }}
    >
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon name={categoryInfo.icon as any} size={16} color="#3b82f6" />
            <h3 className="text-base font-semibold text-gray-800 m-0 line-clamp-1">
              {item.title || "无标题"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Tag color={categoryInfo.color} className="text-xs">
              {categoryInfo.label}
            </Tag>
            <span className="text-xs text-gray-500">
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 文本内容预览 */}
      <div className="mb-2">
        <div className="text-gray-700 text-sm leading-relaxed line-clamp-2">
          {getTextPreview(item.text)}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Icon name="text" size={12} />
          <span>{textStats.chars}字</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="list" size={12} />
          <span>{textStats.lines}行</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button
          onClick={onClick}
          size="middle"
          className="flex-1 h-9 flex items-center justify-center gap-1"
          style={{ fontSize: "13px" }}
        >
          <Icon name="eye" size={14} />
          <span>查看详情</span>
        </Button>

        <Popconfirm
          title="删除训练语料"
          description="确定要删除这条训练语料吗？删除后无法恢复。"
          onConfirm={onDelete}
          okText="确定删除"
          cancelText="取消"
          okButtonProps={{
            danger: true,
            size: "middle",
            style: { fontSize: "13px" },
          }}
          cancelButtonProps={{
            size: "middle",
            style: { fontSize: "13px" },
          }}
        >
          <Button
            size="middle"
            danger
            className="h-9 flex items-center justify-center"
            loading={deleting}
            style={{ fontSize: "13px", minWidth: "48px" }}
          >
            <Icon name="delete" size={14} />
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );
};

export default CorpusItem;
