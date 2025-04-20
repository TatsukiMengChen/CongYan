import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
// 引入 Select, Tag
import { Empty, FloatButton, Input, List, message, Modal, Spin, Typography, Button, Popconfirm, Select, Tag } from "antd";
// 引入 DeleteOutlined
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import Navbar from "../../../components/Navbar";
import {
  CorpusInfo,
  CreateCorpusAPI,
  GetCorpusAPI,
  DeleteCorpusAPI, // 引入删除 API
} from "../../../api/text";

const { TextArea } = Input;
const { Paragraph, Text } = Typography; // 引入 Text

// 定义语料分类选项
const corpusCategories = [
  { value: 'prose', label: '散文' },
  { value: 'ancient-poem', label: '古代诗词' },
  { value: 'modern-poetry', label: '现代诗词' },
  { value: 'other', label: '其他' }, // 添加一个“其他”选项
];

// 辅助函数：根据 value 获取 label
const getCategoryLabel = (value: string): string => {
    return corpusCategories.find(cat => cat.value === value)?.label || value;
};


const CorpusPage: React.FC = () => {
  const navigate = useNavigate();
  const [corpusList, setCorpusList] = useState<CorpusInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 创建模态框状态
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<string>(corpusCategories[0].value); // 默认选中第一个分类
  const [creating, setCreating] = useState(false);
  // 详情模态框状态
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedCorpus, setSelectedCorpus] = useState<CorpusInfo | null>(null);
  const [deleting, setDeleting] = useState(false); // 添加删除加载状态

  const fetchCorpus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GetCorpusAPI();
      if (res.status === 0 && res.texts) {
        setCorpusList(res.texts);
      } else {
        const errorMsg = res.message || "加载语料列表失败";
        setError(errorMsg);
        // 避免重复显示错误信息
        if (!error) {
          message.error(errorMsg);
        }
      }
    } catch (e) {
      const errorMsg = "网络错误，请稍后重试";
      setError(errorMsg);
      if (!error) {
        message.error(errorMsg);
      }
      console.error("Fetch corpus error:", e);
    } finally {
      setLoading(false);
    }
  }, [error]); // 依赖 error 状态

  useEffect(() => {
    fetchCorpus();
  }, [fetchCorpus]);

  const handleBack = () => {
    navigate(-1); // 返回上一页
  };

  // --- 创建模态框相关函数 ---
  const showCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleCreateOk = async () => {
    if (!newText.trim()) {
      message.warning("请输入语料内容");
      return;
    }
    if (!newCategory) {
        message.warning("请选择语料分类");
        return;
    }
    setCreating(true);
    try {
      const res = await CreateCorpusAPI({
        title: newTitle.trim(),
        text: newText.trim(),
        category: newCategory, // 添加 category
      });
      if (res.status === 0) {
        message.success("创建成功");
        setIsCreateModalVisible(false);
        setNewTitle(""); // 清空输入
        setNewText(""); // 清空输入
        setNewCategory(corpusCategories[0].value); // 重置分类
        await fetchCorpus(); // 刷新列表
      } else {
        message.error(res.message || "创建失败");
      }
    } catch (e) {
      message.error("创建失败，请检查网络连接");
      console.error("Create corpus error:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
    setNewTitle(""); // 清空输入
    setNewText(""); // 清空输入
    setNewCategory(corpusCategories[0].value); // 重置分类
  };
  // --- 结束创建模态框相关函数 ---

  // --- 详情模态框相关函数 ---
  const showDetailModal = (item: CorpusInfo) => {
    setSelectedCorpus(item);
    setIsDetailModalVisible(true);
  };

  const handleDetailCancel = () => {
    setIsDetailModalVisible(false);
    setSelectedCorpus(null); // 关闭时清空选中项
  };
  // --- 结束详情模态框相关函数 ---

  // --- 更新：删除语料相关函数 ---
  const handleDeleteCorpus = async (textUuid: string) => {
    setDeleting(true);
    try {
      const res = await DeleteCorpusAPI(textUuid);
      if (res.status === 0) {
        message.success(res.message || "删除成功");
        // 刷新列表，移除已删除项
        setCorpusList(prevList => prevList.filter(item => item.uuid !== textUuid));
        // 如果列表为空了，可以重新 fetch 一次以显示 Empty 状态
        if (corpusList.length === 1) {
            fetchCorpus();
        }
      } else {
        // 特别处理：如果是因为有关联任务导致的失败 (status: 1, code: "dbError")
        if (res.status === 1 && res.code === 'dbError') {
           message.error("无法删除：该语料已被分配任务，请先删除相关任务。");
        } else {
           message.error(res.message || "删除失败");
        }
      }
    } catch (e) {
      message.error("删除语料时发生错误");
      console.error("Delete corpus error:", e);
    } finally {
      setDeleting(false);
    }
  };
  // --- 结束：删除语料相关函数 ---

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-center p-5">
          <Spin size="large" />
        </div>
      );
    }
    if (error && corpusList.length === 0) {
      return <Empty description={error} />;
    }
    if (corpusList.length === 0) {
      return <Empty description="暂无语料，快去添加吧！" />;
    }
    return (
      <List
        itemLayout="horizontal"
        dataSource={corpusList}
        renderItem={(item) => (
          <List.Item
            key={item.uuid}
            // 添加 actions 用于放置删除按钮
            actions={[
              <Popconfirm
                title="确定删除此语料吗？"
                description="如果该语料已被分配任务，将无法删除。"
                onConfirm={(e) => {
                  e?.stopPropagation(); // 阻止事件冒泡
                  handleDeleteCorpus(item.uuid);
                }}
                onCancel={(e) => e?.stopPropagation()}
                okText="确认删除"
                cancelText="取消"
                disabled={deleting} // 删除进行中时禁用
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
                  loading={deleting} // 显示加载状态
                />
              </Popconfirm>
            ]}
          >
            {/* Meta 部分仍然可点击查看详情 */}
            <div onClick={() => showDetailModal(item)} style={{ flexGrow: 1, cursor: 'pointer' }}>
              <List.Item.Meta
                title={
                    <>
                        {item.title || "无标题"}
                        {/* 显示分类 Tag */}
                        <Tag style={{ marginLeft: 8 }}>{getCategoryLabel(item.category)}</Tag>
                    </>
                }
                description={
                  // 使用 Typography.Paragraph 实现单行截断
                  <Typography.Paragraph ellipsis={{ rows: 1, tooltip: item.text }}>
                    {item.text}
                  </Typography.Paragraph>
                }
              />
            </div>
          </List.Item>
        )}
      />
    );
  };

  return (
    <div className="h-100vh flex flex-col">
      <Navbar onBack={handleBack}>我的语料</Navbar>
      <div className={`flex-1 p-4 overflow-auto pb-20 ${loading || deleting ? 'blur-sm' : ''}`}>
        {renderContent()}
      </div>
      {(loading || deleting) && (
         <div className="absolute inset-0 flex-center bg-white bg-opacity-50 z-10">
           <Spin size="large" />
         </div>
       )}

      {/* 创建语料模态框 */}
      <Modal
        title="创建新语料"
        visible={isCreateModalVisible}
        onOk={handleCreateOk}
        onCancel={handleCreateCancel}
        confirmLoading={creating}
        okText="确认创建"
        cancelText="取消"
        destroyOnClose // 关闭时销毁内部组件状态
      >
        <Input
          placeholder="请输入语料标题（可选）"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        {/* --- 新增：分类选择 --- */}
        <Select
            placeholder="请选择语料分类 *"
            value={newCategory}
            onChange={(value) => setNewCategory(value)}
            style={{ width: '100%', marginBottom: '1rem' }}
            options={corpusCategories}
        />
        {/* --- 结束：分类选择 --- */}
        <TextArea
          rows={4}
          placeholder="请输入语料内容 *"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
      </Modal>

      {/* 语料详情模态框 */}
      <Modal
        title={selectedCorpus?.title || "语料详情"}
        visible={isDetailModalVisible}
        onCancel={handleDetailCancel}
        footer={null} // 不需要底部按钮
        destroyOnClose
      >
        {selectedCorpus && (
          // 使用 Paragraph 并允许复制
          <Paragraph copyable={{ tooltips: ['复制', '已复制'] }} style={{ whiteSpace: 'pre-wrap' }}>
            {selectedCorpus.text}
          </Paragraph>
        )}
      </Modal>

      {/* 添加语料浮动按钮 */}
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={showCreateModal}
        tooltip="添加新语料"
      />
    </div>
  );
};

export default CorpusPage;
