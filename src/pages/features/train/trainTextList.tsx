import { ListItemButton, Typography, Tabs, Tab, Box } from "@mui/material";
import { useEffect, useState, SyntheticEvent, useCallback } from "react"; // Added useCallback
import { useLocation, useNavigate } from "react-router";
import { GetCorpusAPI, CorpusInfo } from "../../../api/text";
import Navbar from "../../../components/Navbar";
import { PullToRefresh } from "antd-mobile"; // Import PullToRefresh

// Updated TrainTextCard to use CorpusInfo
const TrainTextCard = (props: CorpusInfo & { onClick: () => void }) => {
  // Removed getColor and getGrade functions

  // 计算中文字符的长度
  const getChineseCharacterLength = (text: string) => {
    const chineseCharacters = text.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseCharacters.length;
  };

  const getAuthorText = (add_by: string) => {
    switch (add_by) {
      case "doctor":
        return "医生添加";
      case "patient":
        return "患者添加"; // Or adjust as needed
      default:
        return `由 ${add_by} 添加`;
    }
  };

  // Function to format date string (basic example)
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "未知日期";
    try {
      const date = new Date(dateString);
      // Example format: YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // Return original string if formatting fails
    }
  };

  return (
    <div
      className="relative mx-4 my-4 overflow-hidden rounded-md p-4"
      style={{ boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px" }}
    >
      {/* Removed Chips for record status and grade */}

      <Typography variant="subtitle1">
        {props.title}
      </Typography>
      <Typography variant="caption" color="textSecondary" display="block"> {/* Removed gutterBottom */}
        {getAuthorText(props.add_by)}
      </Typography>
      {/* Add Created Date */}
      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
        添加日期：{formatDate(props.createdAt)}
      </Typography>
      <Typography variant="subtitle2">
        文本长度：{getChineseCharacterLength(props.text || "")} 字
      </Typography>
      {/* Removed suggestedDuration */}
      <div className="absolute left-0 top-0 h-full w-full">
        <ListItemButton className="h-full" onClick={props.onClick} />
      </div>
    </div>
  );
};

const categories = [
  { key: "prose", label: "散文" },
  { key: "ancient-poem", label: "古诗词" },
  { key: "modern-poetry", label: "现代诗歌" },
];

const TrainTextListPage = () => {
  const location = useLocation();
  const initialType = location.state?.type || categories[0].key;
  const [selectedCategory, setSelectedCategory] = useState<string>(initialType);
  // Find the initial title based on the initialType
  const initialTitle = categories.find(cat => cat.key === initialType)?.label || categories[0].label;

  // State for text list, loading, and error remains similar, but keying off selectedCategory
  const [textList, setTextList] = useState<CorpusInfo[]>([]); // Initialize empty, load in effect/refresh
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);
  const navigator = useNavigate();

  // Function to fetch data for the current category
  const fetchData = useCallback(async (category: string, isRefresh = false) => {
    // Don't use session storage if refreshing
    const currentStorageKey = `textList_${category}`;
    if (!isRefresh) {
      const savedList = sessionStorage.getItem(currentStorageKey);
      if (savedList) {
        setTextList(JSON.parse(savedList));
        setIsLoading(false);
        setError(null);
        return; // Data loaded from session storage
      }
    }

    // Fetch from API if no session data or if refreshing
    setIsLoading(true); // Show loading indicator during fetch/refresh
    setError(null);
    try {
      const res = await GetCorpusAPI(); // Fetch all texts
      if (res.status === 0 && res.texts) {
        const filteredList = res.texts.filter(text => text.category === category);
        setTextList(filteredList);
        // Update session storage only if not refreshing (or decide if refresh should update it too)
        if (!isRefresh) {
            sessionStorage.setItem(currentStorageKey, JSON.stringify(filteredList));
        }
      } else {
        console.error("Failed to fetch texts:", res.message);
        setError(res.message || "获取文本列表失败");
        setTextList([]); // Clear list on error
      }
    } catch (err: any) {
      console.error("Error fetching texts:", err);
      setError(err.message || "加载文本时出错");
      setTextList([]); // Clear list on error
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback with empty dependency array as it doesn't depend on component state directly

  // Function to handle tab change
  const handleTabChange = (event: SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
    // Fetch data for the new category immediately
    fetchData(newValue);
  };

  // Initial data load effect
  useEffect(() => {
    fetchData(selectedCategory);
  }, [selectedCategory, fetchData]); // Depend on selectedCategory and fetchData

  // Pull to refresh handler
  const onRefresh = async () => {
    await fetchData(selectedCategory, true); // Pass true to indicate refresh
  };

  // Get the current title for the Navbar
  const currentTitle = categories.find(cat => cat.key === selectedCategory)?.label || "练习";

  return (
    <div className="h-100vh flex flex-col">
      {/* Update Navbar title dynamically */}
      <Navbar onBack={() => navigator(-1)}>
        <div>
          <div className="text-14px">练习</div>
          <div className="text-3">{currentTitle}</div>
        </div>
      </Navbar>

      {/* Add Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedCategory}
          onChange={handleTabChange}
          variant="fullWidth" // Or "scrollable" if many categories
          aria-label="text categories tabs"
        >
          {categories.map((category) => (
            <Tab key={category.key} label={category.label} value={category.key} />
          ))}
        </Tabs>
      </Box>

      {/* Content Area with PullToRefresh */}
      <div className="flex-grow overflow-y-auto"> {/* Use flex-grow */}
        <PullToRefresh onRefresh={onRefresh}>
          {isLoading && textList.length === 0 && <div className="p-4 text-center">加载中...</div>} {/* Show loading only if list is empty */}
          {error && <div className="p-4 text-center text-red-500">错误：{error}</div>}
          {!isLoading && !error && textList.length === 0 && (
            <div className="p-4 text-center text-gray-500">该分类下暂无文本</div>
          )}
          {!error && textList.map((text) => ( // Render list even if loading (for refresh indicator)
            <TrainTextCard
              key={text.uuid}
              {...text}
              onClick={() => {
                navigator("detail", {
                  state: {
                    text_uuid: text.uuid,
                    // category: selectedCategory
                  },
                });
              }}
            />
          ))}
        </PullToRefresh>
      </div>
    </div>
  );
};

export default TrainTextListPage;
