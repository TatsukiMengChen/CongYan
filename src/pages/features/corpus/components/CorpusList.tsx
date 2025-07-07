import React from "react";
import { List, Empty, Spin } from "antd";
import { CorpusInfo } from "../../../../api/text";
import CorpusItem from "./CorpusItem";
import Icon from "../../../../components/Icon";

interface CorpusListProps {
  loading: boolean;
  corpusList: CorpusInfo[];
  error: string | null;
  onItemClick: (item: CorpusInfo) => void;
  onItemDelete: (uuid: string) => void;
  deleting: boolean;
}

const CorpusList: React.FC<CorpusListProps> = ({
  loading,
  corpusList,
  error,
  onItemClick,
  onItemDelete,
  deleting,
}) => {
  // 加载状态
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
        <Spin size="large" />
        <div className="mt-3 text-sm text-gray-600">正在加载训练语料...</div>
      </div>
    );
  }

  // 错误状态
  if (error && corpusList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
        <Icon name="error" size={40} color="#ef4444" />
        <div className="mt-3 text-sm text-gray-700 font-medium">加载失败</div>
        <div className="mt-1 text-xs text-gray-500 text-center max-w-xs">
          {error}
        </div>
      </div>
    );
  }

  // 空状态
  if (corpusList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
        <Icon name="book" size={48} color="#94a3b8" />
        <div className="mt-3 text-sm text-gray-700 font-medium">
          暂无训练语料
        </div>
        <div className="mt-1 text-xs text-gray-500 text-center max-w-xs">
          您可以通过手动输入、OCR识别或AI生成来创建专业康复训练语料
        </div>
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Icon name="edit" size={10} />
            <span>手动输入</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Icon name="scan" size={10} />
            <span>OCR识别</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Icon name="ai" size={10} />
            <span>AI生成</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="px-3 py-2">
        <List
          itemLayout="vertical"
          size="small"
          dataSource={corpusList}
          renderItem={(item) => (
            <CorpusItem
              key={item.uuid}
              item={item}
              onClick={() => onItemClick(item)}
              onDelete={() => onItemDelete(item.uuid)}
              deleting={deleting}
            />
          )}
          className="corpus-list"
        />
      </div>

      {/* 紧凑的底部统计 */}
      <div className="px-4 py-3 text-center border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-1 text-gray-500">
          <Icon name="stats" size={12} />
          <span className="text-xs">
            共{" "}
            <span className="font-semibold text-blue-600">
              {corpusList.length}
            </span>{" "}
            条语料
          </span>
        </div>
      </div>
    </div>
  );
};

export default CorpusList;
