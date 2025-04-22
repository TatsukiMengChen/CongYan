import {
  // Typography,
  useTheme
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
import { useEffect, useMemo, useState } from "react";
// 引入 useSearchParams
import { useNavigate, useSearchParams } from "react-router";
import {
  GetPracticeHistoriesAPI,
  PracticeHistory,
  CharScore,
  // 引入 GetPracticeHistoriesReqType 以便在 useEffect 中使用
  GetPracticeHistoriesReqType,
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
  // 使用 useSearchParams 获取 URL 查询参数
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const patientName = searchParams.get('patientName'); // 获取病人名称
  const textUuid = searchParams.get('textUuid');
  const taskTitle = searchParams.get('taskTitle'); // 获取任务标题

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

  // --- 获取历史记录 (修改：使用 URL 参数过滤) ---
  useEffect(() => {
    setIsLoadingHistory(true);
    // 构建 API 请求参数
    const params: GetPracticeHistoriesReqType = {};
    if (patientId) {
      params.patient_id = patientId; // API 需要 string 类型
    }
    if (textUuid) {
      params.text_uuid = textUuid;
    }

    // 如果没有 patientId，则默认获取当前登录用户的历史 (如果 API 支持)
    // 否则，如果 userInfo.role 是医生且没有 patientId，可能需要提示选择病人或显示空状态
    // 当前逻辑：如果 patientId 存在，则获取该病人的；否则获取当前用户的（可能是医生自己或病人自己）
    // 注意：如果医生访问此页面但未指定 patientId，API 可能需要特殊处理或返回错误/空数据

    GetPracticeHistoriesAPI(params).then((res) => {
      if (res.status === 0 && res.histories) {
        const sortedHistories = res.histories.sort((a, b) =>
          new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
        );
        setHistory(sortedHistories);
      } else {
        console.error("Failed to fetch practice histories:", res.message);
        setHistory([]); // 清空历史记录
      }
      setIsLoadingHistory(false);
    }).catch(() => {
      setIsLoadingHistory(false);
      setHistory([]); // 清空历史记录
    });
    // 依赖项中加入 patientId 和 textUuid
  }, [patientId, textUuid, userInfo]); // 确保 userInfo 也在依赖项中，以防需要根据角色判断

  // --- 更新 data state (保持不变) ---
  useEffect(() => {
    setData(calculatedScores);
  }, [calculatedScores]);

  // --- 移除渲染雷达图的 useEffect ---
  // useEffect(() => { ... radar chart logic ... }, [...]);

  // --- 移除渲染折线图的 useEffect ---
  // useEffect(() => { ... line chart logic ... }, [...]);

  // --- 动态生成页面标题和副标题 ---
  const pageTitle = "统计分析"; // 主标题固定
  const pageSubtitle = useMemo(() => {
    if (patientName && taskTitle) {
      // 同时有病人和任务信息
      return `病人: ${patientName} - 任务: ${taskTitle}`;
    } else if (patientName && patientId) {
      // 只有病人信息
      return `病人: ${patientName} (ID: ${patientId})`;
    } else if (patientId && taskTitle) {
      // 理论上不应发生，但作为回退
      return `病人ID: ${patientId} - 任务: ${taskTitle}`;
    } else if (patientId) {
      // 只有病人 ID
      return `病人ID: ${patientId}`;
    } else if (userInfo?.user_role === 'patient') {
      // 病人自己查看
      return "我的分析报告";
    }
    // 默认或医生未指定病人时
    return "整体数据概览";
  }, [patientId, patientName, textUuid, taskTitle, userInfo]);

  return (
    <div className="h-100vh flex flex-col">
      {/* 使用动态标题和副标题 */}
      <Navbar onBack={() => navigator(-1)}>
        {/* 按照要求的结构渲染标题和副标题 */}
        <div>
          <div className="text-base font-semibold">{pageTitle}</div> {/* 使用稍大字体和加粗 */}
          {pageSubtitle && <div className="text-xs text-gray-500 mt-0.5">{pageSubtitle}</div>} {/* 使用小字体和灰色 */}
        </div>
      </Navbar>
      <div className="h-full overflow-y-auto p-4">
        {/* 使用 RadarChartCard 组件 */}
        <RadarChartCard
          data={data}
          isLoading={isLoadingHistory}
          // 根据是否有 patientId 或 textUuid 调整提示信息可能更好
          hasHistory={history.length > 0}
          // 可以传递 patientId 和 textUuid 给子组件，以便它们显示更具体的标题或信息
          context={{ patientId, patientName, textUuid, taskTitle }}
        />

        {/* 使用 LineChartCard 组件 */}
        <LineChartCard
          history={history}
          isLoading={isLoadingHistory}
          // 可以传递 context
          context={{ patientId, patientName, textUuid, taskTitle }}
        />

        {/* 使用 HistoryTimelineCard 组件 */}
        <HistoryTimelineCard
          history={history}
          isLoading={isLoadingHistory}
          // 可以传递 context
          context={{ patientId, patientName, textUuid, taskTitle }}
        />
      </div>
    </div>
  );
};

export default AnalysisPage;
