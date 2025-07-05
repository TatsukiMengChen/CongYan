import React, { useState } from "react";
import { Popover, Button, Input, Select, Modal } from "antd";
import Icon from "../../../../components/Icon";
import AiCorpusGenerator from "./AiCorpusGenerator";
import { message } from "antd";

interface CorpusToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onManualAdd: () => void;
  onOcrAdd: () => void;
  onRefresh: () => void;
}

const CorpusToolbar: React.FC<CorpusToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  onManualAdd,
  onOcrAdd,
  onRefresh,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);

  const handleCreateSuccess = () => {
    setIsAiGenerateModalOpen(false);
    onRefresh();
    message.success("语料生成成功！");
  };

  // 处理AI生成的语料
  const handleAiGenerate = (
    text: string,
    title?: string,
    category?: string,
  ) => {
    // 这里应该调用实际的添加语料逻辑
    console.log("Generated corpus:", { text, title, category });
    handleCreateSuccess();
  };

  const createMenuItems = [
    {
      key: "manual",
      label: "手动创建",
      icon: <Icon name="edit" size={14} />,
      onClick: () => {
        setIsCreating(false);
        onManualAdd();
      },
    },
    {
      key: "ai",
      label: "AI生成",
      icon: <Icon name="robot" size={14} />,
      onClick: () => {
        setIsCreating(false);
        setIsAiGenerateModalOpen(true);
      },
    },
    {
      key: "ocr",
      label: "图片识别",
      icon: <Icon name="camera" size={14} />,
      onClick: () => {
        setIsCreating(false);
        onOcrAdd();
      },
    },
  ];

  const createMenuContent = (
    <div className="p-2 min-w-32">
      {createMenuItems.map((item) => (
        <div
          key={item.key}
          onClick={item.onClick}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {item.icon}
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="bg-white border-b border-gray-100 p-4 space-y-3">
        {/* 搜索框 + 创建按钮 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="搜索语料内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<Icon name="search" size={16} color="#9ca3af" />}
              className="h-10"
              allowClear
            />
          </div>

          <Popover
            content={createMenuContent}
            placement="bottomRight"
            trigger="click"
            open={isCreating}
            onOpenChange={setIsCreating}
          >
            <Button
              type="primary"
              className="flex items-center gap-1 h-10 px-4"
              onClick={() => setIsCreating(!isCreating)}
            >
              <Icon name="plus" size={16} />
              <span className="text-sm font-medium">创建</span>
            </Button>
          </Popover>
        </div>

        {/* 分类筛选 + 排序 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              size="small"
              placeholder="分类"
              variant="borderless"
              className="!h-8 !leading-8 flex items-center"
              style={{ color: "#6b7280", minWidth: "60px" }}
              popupMatchSelectWidth={false}
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="散文">散文</Select.Option>
              <Select.Option value="古代诗词">古诗</Select.Option>
              <Select.Option value="现代诗词">现代</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>

            <Select
              value={sortBy}
              onChange={setSortBy}
              size="small"
              placeholder="排序"
              variant="borderless"
              className="!h-8 !leading-8 flex items-center"
              style={{ color: "#6b7280", minWidth: "60px" }}
              popupMatchSelectWidth={false}
            >
              <Select.Option value="newest">最新</Select.Option>
              <Select.Option value="oldest">最早</Select.Option>
              <Select.Option value="name">名称</Select.Option>
              <Select.Option value="length">长度</Select.Option>
            </Select>
          </div>

          <div className="flex items-center">
            <Button
              type="text"
              size="small"
              icon={<Icon name="refresh" size={14} />}
              onClick={onRefresh}
              className="!h-8 !w-8 !p-0 text-gray-500 hover:text-blue-500 flex items-center justify-center"
            />
          </div>
        </div>
      </div>

      {/* AI生成模态框 */}
      <Modal
        title="AI智能生成语料"
        open={isAiGenerateModalOpen}
        onCancel={() => setIsAiGenerateModalOpen(false)}
        footer={null}
        width={800}
        className="top-4"
      >
        <AiCorpusGenerator onGenerate={handleAiGenerate} />
      </Modal>
    </>
  );
};

export default CorpusToolbar;
