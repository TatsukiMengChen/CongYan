import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import {
  Typography,
  useTheme
} from "@mui/material";
import { Card } from "antd";
import { RadarChart } from "echarts/charts";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  GetSummaryAnalysisAPI,
  GetUserTrainHistoryAPI,
  UserTrainData,
} from "../../../api/train";
import Navbar from "../../../components/Navbar";
import styles from "./index.module.scss";

echarts.use([RadarChart, CanvasRenderer]);

type dataType = {
  method_score: number;
  part_score: number;
  struct_score: number;
  shape_score: number;
  sd_score: number;
  total_score: number;
};

const HistoryItem = ({ data }: { data: UserTrainData }) => {
  const getColor = (score: number) => {
    if (score >= 90) {
      return "success";
    } else if (score >= 80) {
      return "primary";
    } else if (score >= 60) {
      return "warning";
    } else if (score == -1) {
      return "inherit";
    } else {
      return "error";
    }
  };

  return (
    // <ListItem className="!p-0">
    //   <ListItemButton>
    //     <ListItemText
    //       primary={
    //         <Typography
    //           style={{ color: getColor(data.userTrainData!.total_score!) }}
    //         >
    //           <strong>{data.userTrainData!.total_score}</strong>
    //         </Typography>
    //       }
    //       secondary={data.time}
    //     />
    //   </ListItemButton>
    // </ListItem>
    <TimelineItem>
      <TimelineOppositeContent color="text.secondary">
        {data.time}
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot color={getColor(data.userTrainData!.total_score!)} />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent color={getColor(data.userTrainData!.total_score!)}>
        <strong>{data.userTrainData!.total_score}</strong>
      </TimelineContent>
    </TimelineItem>
  );
};

const AnalysisPage = () => {
  const navigator = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState<dataType>({
    method_score: 0,
    part_score: 0,
    struct_score: 0,
    shape_score: 0,
    sd_score: 0,
    total_score: -1,
  });
  const chartRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<UserTrainData[]>([]);

  const getColor = (score: number) => {
    if (score >= 90) {
      return theme.palette.success.main;
    } else if (score >= 80) {
      return theme.palette.primary.main;
    } else if (score >= 60) {
      return theme.palette.warning.main;
    } else if (score == -1) {
      return theme.palette.text.primary;
    } else {
      return theme.palette.error.main;
    }
  };

  useEffect(() => {
    GetSummaryAnalysisAPI().then((res) => {
      if (res.code === 200) {
        for (const key in data) {
          res.data![key] = parseFloat((res.data![key] * 100).toFixed(2));
        }
        setData(res.data as dataType);
      }
    });
    GetUserTrainHistoryAPI().then((res) => {
      if (res.code === 200) {
        setHistory(res.data!);
      }
    });
  }, []);

  useEffect(() => {
    const chartInstance = echarts.init(chartRef.current!);
    const option = {
      radar: {
        indicator: [
          { name: "方法", max: 100 },
          { name: "部位", max: 100 },
          { name: "结构", max: 100 },
          { name: "口型", max: 100 },
          { name: "声调", max: 100 },
        ],
        center: ["50%", "55%"],
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: [
                data.method_score,
                data.part_score,
                data.struct_score,
                data.shape_score,
                data.sd_score,
              ],
              name: "得分",
              itemStyle: {
                color: theme.palette.primary.main,
              },
              areaStyle: {},
            },
          ],
        },
      ],
    };
    chartInstance.setOption(option);
  }, [data]);

  return (
    <div className="h-100vh flex flex-col">
      <Navbar onBack={() => navigator(-1)}>
        <div>统计分析</div>
      </Navbar>
      <div className="h-full overflow-y-auto p-4">
        <Card className={styles.card} title="总体分析">
          <div className="h-full flex-around">
            <div className="w-25% pl-4">
              <Typography variant="h4" color={getColor(data.total_score)}>
                {data.total_score != -1 && data.total_score}
              </Typography>
            </div>
            <div className="h-full min-h-240px w-75%" ref={chartRef}></div>
          </div>
        </Card>
        <Card className={styles.card} title="历史记录">
          <Timeline position="alternate">
            {history
              .slice(0)
              .reverse()
              .map((item, index) => (
                <HistoryItem key={index} data={item} />
              ))}
          </Timeline>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisPage;
