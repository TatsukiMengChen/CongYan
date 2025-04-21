import {
  // Typography, // 可以移除，如果只在子组件中使用
  useTheme // 保留 useTheme 如果子组件没用到
} from "@mui/material";
// import { Card, Empty } from "antd"; // 移除，已移到子组件
// import { RadarChart, LineChart } from "echarts/charts"; // 移除
// import * as echarts from "echarts/core"; // 移除
// import {
//   TooltipComponent,
//   LegendComponent,
//   GridComponent,
//   DataZoomComponent,
// } from "echarts/components"; // 移除
// import { CanvasRenderer } from "echarts/renderers"; // 移除
import { useEffect, useMemo, useState } from "react"; // 移除 useRef
import { useNavigate } from "react-router";
import {
  GetPracticeHistoriesAPI,
  PracticeHistory,
  CharScore,
} from "../../../api/train";
import Navbar from "../../../components/Navbar";
import styles from "./index.module.scss";
import useAuthStore from "../../../store/auth";
// 引入新组件
import { RadarChartCard } from "./components/RadarChartCard";
import { LineChartCard } from "./components/LineChartCard";
import { HistoryTimelineCard } from "./components/HistoryTimelineCard";

// 移除 ECharts 注册
// echarts.use([...]);

// SummaryDataType 定义可以保留，因为它用于 state 和计算
type SummaryDataType = {
  sa_score: number;
  ya_score: number;
  sd_score: number;
};

// 移除 HistoryItem 组件定义，已移到 HistoryTimelineCard.tsx

const AnalysisPage = () => {
  const navigator = useNavigate();
  // const theme = useTheme(); // 如果子组件都用了自己的 useTheme，这里可以移除
  const { userInfo } = useAuthStore();
  const [data, setData] = useState<SummaryDataType>({
    sa_score: 0,
    ya_score: 0,
    sd_score: 0,
  });
  // 移除 chart refs
  // const radarChartRef = useRef<HTMLDivElement>(null);
  // const lineChartRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 移除 getColor，已移到 HistoryItem

  // --- 计算加权平均分 (保持不变) ---
  const calculatedScores = useMemo(() => {
    // ...existing calculation logic...
    let totalWeight = 0;
    let weightedSaSum = 0;
    let weightedYaSum = 0;
    let weightedSdSum = 0;
    let validCharCount = 0;

    const reversedHistory = [...history].reverse();

    reversedHistory.forEach((record, index) => {
      if (!record.char_scores || record.char_scores.length === 0) return;
      const weight = index + 1;
      record.char_scores.forEach((charScore: CharScore) => {
        if (charScore.score !== undefined && charScore.score > 0) {
          validCharCount++;
          totalWeight += weight;
          if (typeof charScore.sim_sa === 'number') weightedSaSum += charScore.sim_sa * weight;
          if (typeof charScore.sim_ya === 'number') weightedYaSum += charScore.sim_ya * weight;
          if (typeof charScore.sim_sd === 'number') weightedSdSum += charScore.sim_sd * weight;
        }
      });
    });

    const avgSa = totalWeight > 0 ? (weightedSaSum / totalWeight) * 100 : 0;
    const avgYa = totalWeight > 0 ? (weightedYaSum / totalWeight) * 100 : 0;
    const avgSd = totalWeight > 0 ? (weightedSdSum / totalWeight) * 100 : 0;

    return {
      sa_score: parseFloat(avgSa.toFixed(1)),
      ya_score: parseFloat(avgYa.toFixed(1)),
      sd_score: parseFloat(avgSd.toFixed(1)),
    };
  }, [history]);

  // --- 获取历史记录 (保持不变) ---
  useEffect(() => {
    // ...existing data fetching logic...
    setIsLoadingHistory(true);
    const params: { patient_id?: string } = {};
    GetPracticeHistoriesAPI(params).then((res) => {
      if (res.status === 0 && res.histories) {
        const sortedHistories = res.histories.sort((a, b) =>
          new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
        );
        setHistory(sortedHistories);
      } else {
        console.error("Failed to fetch practice histories:", res.message);
        setHistory([]);
      }
      setIsLoadingHistory(false);
    }).catch(() => {
      setIsLoadingHistory(false);
      setHistory([]);
    });
  }, [userInfo]);

  // --- 更新 data state (保持不变) ---
  useEffect(() => {
    setData(calculatedScores);
  }, [calculatedScores]);

  // --- 移除渲染雷达图的 useEffect ---
  // useEffect(() => { ... radar chart logic ... }, [...]);

  // --- 移除渲染折线图的 useEffect ---
  // useEffect(() => { ... line chart logic ... }, [...]);

  return (
    <div className="h-100vh flex flex-col">
      <Navbar onBack={() => navigator(-1)}>
        <div>统计分析</div>
      </Navbar>
      <div className="h-full overflow-y-auto p-4">
        {/* 使用 RadarChartCard 组件 */}
        <RadarChartCard
          data={data}
          isLoading={isLoadingHistory}
          hasHistory={history.length > 0}
        />

        {/* 使用 LineChartCard 组件 */}
        <LineChartCard
          history={history}
          isLoading={isLoadingHistory}
        />

        {/* 使用 HistoryTimelineCard 组件 */}
        <HistoryTimelineCard
          history={history}
          isLoading={isLoadingHistory}
        />
      </div>
    </div>
  );
};

export default AnalysisPage;
