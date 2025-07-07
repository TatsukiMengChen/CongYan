import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { message } from "antd";
import {
  CorpusInfo,
  CreateCorpusAPI,
  GetCorpusAPI,
  DeleteCorpusAPI,
  EditCorpusAPI,
} from "../../../api/text";
import CorpusHeader from "./components/CorpusHeader";
import CorpusToolbar from "./components/CorpusToolbar";
import CorpusList from "./components/CorpusList";
import CreateCorpusModal from "./components/CreateCorpusModal";
import CorpusDetailModal from "./components/CorpusDetailModal";

const CorpusPage: React.FC = () => {
  const navigate = useNavigate();
  const [corpusList, setCorpusList] = useState<CorpusInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 搜索和筛选状态
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // 模态框状态
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createMode, setCreateMode] = useState<"manual" | "ocr" | "ai">(
    "manual",
  );
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedCorpus, setSelectedCorpus] = useState<CorpusInfo | null>(null);

  // 获取语料列表
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
  }, [error]);

  useEffect(() => {
    fetchCorpus();
  }, [fetchCorpus]);

  // 过滤和排序语料列表
  const filteredCorpusList = corpusList
    .filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.text.toLowerCase().includes(searchValue.toLowerCase());

      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        case "name":
          return (a.title || "").localeCompare(b.title || "");
        case "length":
          return b.text.length - a.text.length;
        default:
          return 0;
      }
    });

  // 处理返回
  const handleBack = () => {
    navigate(-1);
  };

  // 处理创建语料
  const handleCreateManual = () => {
    setCreateMode("manual");
    setIsCreateModalVisible(true);
  };

  const handleCreateWithOCR = () => {
    setCreateMode("ocr");
    setIsCreateModalVisible(true);
  };

  const handleCreateWithAI = () => {
    setCreateMode("ai");
    setIsCreateModalVisible(true);
  };

  // 处理语料创建成功
  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false);
    fetchCorpus();
  };

  // 处理语料项点击
  const handleItemClick = (item: CorpusInfo) => {
    setSelectedCorpus(item);
    setIsDetailModalVisible(true);
  };

  // 处理语料删除
  const handleItemDelete = async (uuid: string) => {
    setDeleting(true);
    try {
      const res = await DeleteCorpusAPI(uuid);
      if (res.status === 0) {
        message.success(res.message || "删除成功");
        setCorpusList((prevList) =>
          prevList.filter((item) => item.uuid !== uuid),
        );
        if (corpusList.length === 1) {
          fetchCorpus();
        }
      } else {
        if (res.status === 1 && res.code === "dbError") {
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

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 头部 */}
      <CorpusHeader
        onBack={handleBack}
        corpusCount={filteredCorpusList.length}
      />

      {/* 工具栏 */}
      <CorpusToolbar
        searchTerm={searchValue}
        setSearchTerm={setSearchValue}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onManualAdd={handleCreateManual}
        onOcrAdd={handleCreateWithOCR}
        onAiAdd={handleCreateWithAI}
        onRefresh={fetchCorpus}
      />

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto">
        <CorpusList
          loading={loading}
          corpusList={filteredCorpusList}
          error={error}
          onItemClick={handleItemClick}
          onItemDelete={handleItemDelete}
          deleting={deleting}
        />
      </div>

      {/* 创建语料模态框 */}
      <CreateCorpusModal
        visible={isCreateModalVisible}
        mode={createMode}
        onCancel={() => setIsCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 语料详情模态框 */}
      <CorpusDetailModal
        visible={isDetailModalVisible}
        corpus={selectedCorpus}
        onCancel={() => setIsDetailModalVisible(false)}
        onUpdate={fetchCorpus}
      />
    </div>
  );
};

export default CorpusPage;
