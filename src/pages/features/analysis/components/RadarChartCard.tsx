import { Card, Empty, Typography } from "antd";
import { RadarChart } from "echarts/charts";
import * as echarts from "echarts/core";
import { TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, useMemo } from "react";
import { useTheme } from "@mui/material";
// import { LabelLayout } from 'echarts/features/LabelLayout'; // LabelLayout might be included or handled differently
import styles from "../index.module.scss"; // 复用样式

// Register necessary ECharts components
echarts.use([RadarChart, CanvasRenderer, TooltipComponent]);

type SummaryDataType = {
  sa_score: number;
  ya_score: number;
  sd_score: number;
};

interface RadarChartCardProps {
  data: SummaryDataType;
  isLoading: boolean;
  hasHistory: boolean; // 是否有历史数据
  // 更新 context 属性类型
  context: {
    patientId: string | null;
    patientName: string | null; // 添加 patientName
    textUuid: string | null;
    taskTitle: string | null; // 添加 taskTitle
  };
}

export const RadarChartCard = ({ data, isLoading, hasHistory, context }: RadarChartCardProps) => {
  const theme = useTheme();
  const radarChartRef = useRef<HTMLDivElement>(null);

  // 更新 cardTitle 逻辑以使用 name 和 title
  const cardTitle = useMemo(() => {
    if (context.patientName && context.taskTitle) {
      // 同时有病人和任务信息
      return `任务 "${context.taskTitle}" 总体分析`;
    } else if (context.patientName) {
       // 只有病人信息
      return `病人 ${context.patientName} 总体分析`;
    } else if (context.taskTitle) {
        // 只有任务信息 (例如病人自己查看特定任务)
        return `任务 "${context.taskTitle}" 总体分析`;
    }
    // 默认标题
    return "总体分析 (加权平均)";
  }, [context]);

  useEffect(() => {
    if (!radarChartRef.current || !hasHistory || isLoading) return; // 仅在有数据且加载完成时渲染

    let chartInstance: echarts.ECharts | undefined = echarts.getInstanceByDom(radarChartRef.current);
    if (!chartInstance) {
      chartInstance = echarts.init(radarChartRef.current);
    }

    // 更新颜色方案，使用更明亮的蓝色
    const colors = {
      sa: '#f1c40f', // 黄色 (保持不变)
      ya: '#2ecc71', // 绿色 (保持不变)
      sd: '#69c0ff',  // 更明亮的蓝色 (Ant Design Blue) - 注意：这里使用了 #69c0ff，如果需要与折线图的 #1890ff 完全一致，请修改此处
      background: theme.palette.mode === 'dark' ? '#2D3748' : '#F7FAFC'
    };

    // 是否为移动设备 (用于可能的字体大小调整)
    const isMobile = window.innerWidth < 768; // 与折线图保持一致

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent', // 透明背景
      radar: {
        indicator: [
          { name: "声母", max: 100 },
          { name: "韵母", max: 100 },
          { name: "声调", max: 100 },
        ],
        center: ["50%", "55%"],
        radius: '65%', // 略微增大雷达图区域
        shape: 'circle', // 使用圆形雷达图
        axisName: {
          color: theme.palette.text.primary,
          fontSize: 15,
          fontWeight: 'bold',
          padding: [3, 5],
          formatter: (name: string) => {
            let score = 0;
            if (name === "声母") {
              score = data.sa_score;
            } else if (name === "韵母") {
              score = data.ya_score;
            } else if (name === "声调") {
              score = data.sd_score;
            }
            return `${name}: ${score.toFixed(1)}`;
          }
        },
        splitArea: {
          areaStyle: {
            color: [ // 使用更淡雅的蓝色系背景
              'rgba(230, 247, 255, 0.1)',
              'rgba(204, 232, 255, 0.15)',
              'rgba(179, 218, 255, 0.2)',
              'rgba(153, 204, 255, 0.25)',
              'rgba(128, 191, 255, 0.3)'
            ],
            shadowBlur: 5, // 减小阴影
            shadowColor: 'rgba(24, 144, 255, 0.05)' // 对应新蓝色的阴影
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(24, 144, 255, 0.5)', // 新蓝色
            width: 1.5,
            cap: 'round'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(24, 144, 255, 0.3)', // 新蓝色
            width: 1.5,
            type: 'dashed'
          }
        }
      },
      tooltip: {
        trigger: 'item', // 雷达图通常使用 item 触发
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // 与折线图一致
        borderColor: 'rgba(24, 144, 255, 0.5)', // 与折线图一致 (使用 #1890ff 对应的 rgba)
        borderWidth: 1, // 调整为 1px，更接近折线图效果
        formatter: (params: any) => {
          let value = params.value;

          // 定义评分等级及其对应的颜色
            const ratingColors: { [key: string]: string } = {
            "卓越": "#52c41a", // Green (Best)
            "极佳": "#a0d911", // Lime
            "优秀": "#fadb14", // Yellow
            "良好": "#faad14", // Orange
            "一般": "#ff4d4f", // Red
            "较差": "#cf1322", // Dark Red (Worst)
            };

          // 定义评分逻辑，返回评分文字和颜色
          let getRating = (score: number): { text: string; color: string } => {
            let ratingText = "";
            if (score >= 95) {
              ratingText = "卓越";
            } else if (score >= 90) {
              ratingText = "极佳";
            } else if (score >= 80) {
              ratingText = "优秀";
            } else if (score >= 60) {
              ratingText = "良好";
            } else if (score >= 40) {
              ratingText = "一般";
            } else {
              ratingText = "较差";
            }
            return { text: ratingText, color: ratingColors[ratingText] || '#333' }; // 默认黑色
          };

          const saRating = getRating(value[0]);
          const yaRating = getRating(value[1]);
          const sdRating = getRating(value[2]);

          // 使用评分对应的颜色
          return `<div style="font-weight:bold;margin-bottom:5px">总体表现分析</div>` +
            `声母: ${value[0].toFixed(1)} <span style="color:${saRating.color}; font-weight: bold;">（${saRating.text}）</span><br/>` +
            `韵母: ${value[1].toFixed(1)} <span style="color:${yaRating.color}; font-weight: bold;">（${yaRating.text}）</span><br/>` +
            `声调: ${value[2].toFixed(1)} <span style="color:${sdRating.color}; font-weight: bold;">（${sdRating.text}）</span>`;
        },
        textStyle: {
          color: '#333', // 与折线图一致
          fontSize: isMobile ? 12 : 14 // 与折线图一致
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15); border-radius: 8px; padding: 10px;' // 与折线图一致
      },
      series: [
        {
          name: '加权平均得分',
          type: "radar",
          data: [
            {
              value: [
                data.sa_score,
                data.ya_score,
                data.sd_score,
              ],
              name: "加权平均得分",
              symbol: 'emptyCircle', // 和折线图一致使用空心圆
              symbolSize: 8,
              itemStyle: {
                color: colors.sd, // 数据点保持为蓝色
                borderColor: '#fff',
                borderWidth: 2,
                shadowBlur: 3,
                shadowColor: 'rgba(24, 144, 255, 0.4)' // 新蓝色阴影
              },
              lineStyle: {
                width: 3,
                color: colors.sd, // *** 修改：线条颜色改为纯蓝色 ***
                shadowColor: 'rgba(24, 144, 255, 0.3)', // 新蓝色阴影
                shadowBlur: 5
              },
              areaStyle: {
                // 调整渐变色和透明度，全部使用蓝色系
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.15)' },   // 外围：浅蓝色
                  { offset: 0.5, color: 'rgba(24, 144, 255, 0.4)' },  // 中心：中蓝色
                  { offset: 1, color: 'rgba(24, 144, 255, 0.25)' }, // 中间：较浅蓝色
                ]),
                opacity: 0.85, // 略微提高整体不透明度
                shadowColor: 'rgba(24, 144, 255, 0.1)', // 新蓝色阴影
                shadowBlur: 10
              },
              label: {
                show: false
              },
              emphasis: { // 调整强调效果颜色
                itemStyle: {
                  color: colors.sd, // 新蓝色
                  borderColor: '#fff',
                  borderWidth: 3,
                  shadowBlur: 10,
                  shadowColor: 'rgba(24, 144, 255, 0.5)' // 新蓝色阴影
                },
                lineStyle: {
                  width: 4,
                  shadowBlur: 10,
                  shadowColor: 'rgba(24, 144, 255, 0.5)' // 新蓝色阴影
                },
                areaStyle: {
                  opacity: 0.9,
                  shadowBlur: 15,
                  shadowColor: 'rgba(24, 144, 255, 0.2)' // 新蓝色阴影
                }
              }
            },
          ],
        },
      ],
      animation: true,
      animationDuration: 1000,
      // 修复类型错误：使用 ECharts 支持的动画缓动类型
      animationEasing: 'cubicOut' as const,
    };
    chartInstance.setOption(option);

    // 增加移动端适配性的resize逻辑
    const resizeHandler = () => {
      if (chartInstance) {
        const container = radarChartRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const isMobileView = containerWidth < 400; // 雷达图原有的移动端判断
          const isMobileTooltip = containerWidth < 768; // Tooltip 的移动端判断
          chartInstance.setOption({
            radar: {
              radius: isMobileView ? '55%' : '65%',
              axisName: {
                fontSize: isMobileView ? 12 : 15
              }
            },
            tooltip: { // 在 resize 时也更新 tooltip 字体大小
              textStyle: {
                fontSize: isMobileTooltip ? 12 : 14
              }
            }
          });
        }
        chartInstance.resize();
      }
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      chartInstance?.dispose();
    };
  }, [data, theme, hasHistory, isLoading, context]); // 将 context 加入依赖项

  return (
    // 使用动态标题
    <Card className={styles.card} title={cardTitle} hoverable>
      {isLoading ? (
        <Typography color="text.secondary" style={{ textAlign: 'center', padding: '24px' }}>
          <div className={styles.loadingIndicator}>加载中...</div>
        </Typography>
      ) : hasHistory ? (
        <div className="h-full min-h-280px w-full" ref={radarChartRef}></div>
      ) : (
        <Empty description="暂无数据进行分析" className={styles.emptyState} />
      )}
    </Card>
  );
};
