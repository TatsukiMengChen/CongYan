import { Card, Empty, Typography } from "antd";
import { LineChart } from "echarts/charts";
import * as echarts from "echarts/core";
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef } from "react"; // 引入 useMemo
import { useTheme } from "@mui/material";
import { PracticeHistory } from "../../../../api/train";
import styles from "../index.module.scss"; // 复用样式

echarts.use([
  LineChart,
  CanvasRenderer,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

interface LineChartCardProps {
  history: PracticeHistory[];
  isLoading: boolean;
  // 更新 context 属性类型
  context: {
    patientId: string | null;
    patientName: string | null; // 添加 patientName
    textUuid: string | null;
    taskTitle: string | null; // 添加 taskTitle
  };
}

export const LineChartCard = ({ history, isLoading, context }: LineChartCardProps) => {
  const theme = useTheme();
  const lineChartRef = useRef<HTMLDivElement>(null);

  // 更新 cardTitle 逻辑以使用 name 和 title
  const cardTitle = useMemo(() => {
    if (context.patientName && context.taskTitle) {
      // 同时有病人和任务信息
      return `任务 "${context.taskTitle}" 得分趋势`;
    } else if (context.patientName) {
       // 只有病人信息
      return `病人 ${context.patientName} 得分趋势`;
    } else if (context.taskTitle) {
        // 只有任务信息
        return `任务 "${context.taskTitle}" 得分趋势`;
    }
    // 默认标题
    return "得分趋势";
  }, [context]);

  useEffect(() => {
    if (!lineChartRef.current || history.length === 0 || isLoading) return; // 仅在有数据且加载完成时渲染

    let chartInstance: echarts.ECharts | undefined = echarts.getInstanceByDom(lineChartRef.current);
    if (!chartInstance) {
      chartInstance = echarts.init(lineChartRef.current);
    }

    // 准备折线图数据
    const dates = history.map(item => new Date(item.created_at!).toLocaleDateString());
    const saScores: (number | null)[] = [];
    const yaScores: (number | null)[] = [];
    const sdScores: (number | null)[] = [];

    history.forEach(record => {
      let saSum = 0, yaSum = 0, sdSum = 0;
      let validCount = 0;
      if (record.char_scores) {
        record.char_scores.forEach(cs => {
          if (cs.score !== undefined && cs.score > 0) {
            validCount++;
            if (typeof cs.sim_sa === 'number') saSum += cs.sim_sa;
            if (typeof cs.sim_ya === 'number') yaSum += cs.sim_ya;
            if (typeof cs.sim_sd === 'number') sdSum += cs.sim_sd;
          }
        });
      }
      saScores.push(validCount > 0 ? parseFloat(((saSum / validCount) * 100).toFixed(1)) : null);
      yaScores.push(validCount > 0 ? parseFloat(((yaSum / validCount) * 100).toFixed(1)) : null);
      sdScores.push(validCount > 0 ? parseFloat(((sdSum / validCount) * 100).toFixed(1)) : null);
    });

    // 更新颜色方案，使用更明亮的蓝色
    const colors = {
      sa: '#f1c40f', // 黄色
      ya: '#2ecc71', // 绿色
      sd: '#1890ff'  // 更明亮的蓝色 (Ant Design Blue)
    };

    // 是否为移动设备 (可以稍微放宽判断标准)
    const isMobile = window.innerWidth < 768; // 使用 768px 作为阈值

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line', // 改为直线更清晰
          lineStyle: {
            color: colors.sd, // 新蓝色
            width: 2
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(24, 144, 255, 0.5)', // 新蓝色边框
        textStyle: {
          color: '#333',
          fontSize: isMobile ? 12 : 14 // 移动端字体稍小
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15); border-radius: 8px; padding: 10px;' // 新蓝色阴影
      },
      legend: {
        data: ['声母得分', '韵母得分', '声调得分'],
        top: 10,
        itemGap: isMobile ? 10 : 20, // 移动端缩小间距
        textStyle: { 
          color: theme.palette.text.primary,
          fontSize: isMobile ? 12 : 14 // 移动端字体稍小
        },
        itemWidth: 12,
        itemHeight: 12,
        icon: 'circle',
        // 移动端时调整为横向排列以节省空间
        orient: isMobile ? 'horizontal' : 'horizontal',
        padding: isMobile ? [0, 0, 0, 0] : [5, 10, 5, 10]
      },
      grid: {
        left: isMobile ? '5%' : '3%',
        right: isMobile ? '5%' : '4%',
        bottom: isMobile ? '18%' : '12%', // 稍微调整移动端底部边距
        top: isMobile ? '60px' : '50px', // 移动端增大顶部空间给legend
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { 
          lineStyle: { 
            color: colors.sd, // 新蓝色
            width: 2
          } 
        },
        axisLabel: {
          color: theme.palette.text.primary,
          fontSize: isMobile ? 10 : 12, // 移动端字体更小
          interval: isMobile ? 'auto' : Math.floor(dates.length / 7), // 移动端自动调整间隔
          hideOverlap: true,
          rotate: isMobile ? 30 : 0, // 移动端旋转标签以防重叠
          padding: [8, 0, 0, 0]
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { 
          color: theme.palette.text.primary,
          fontSize: isMobile ? 10 : 12 // 移动端字体更小
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(24, 144, 255, 0.2)', // 新蓝色系分割线
            type: 'dashed',
            width: 1
          }
        }
      },
      dataZoom: [
        { 
          type: 'inside', 
          start: 0, 
          end: 100,
          filterMode: 'none',
          zoomOnMouseWheel: true, // 允许滚轮缩放
          moveOnMouseMove: !isMobile, // 移动端禁用鼠标移动触发平移，防止与滚动冲突
          moveOnMouseWheel: true, // 允许滚轮平移
          preventDefaultMouseMove: false // 允许默认的触摸滚动行为
        },
        {
          type: 'slider', 
          start: 0, 
          end: 100, 
          bottom: 10, // 调整位置
          height: isMobile ? 22 : 20, // 调整移动端滑块高度
          borderColor: 'rgba(24, 144, 255, 0.5)', // 新蓝色边框
          fillerColor: 'rgba(24, 144, 255, 0.2)', // 新蓝色填充
          handleIcon: 'path://M-9.5,0a9.5,9.5,0,1,0,19,0a9.5,9.5,0,1,0,-19,0z', // 保持圆形手柄
          handleSize: isMobile ? '110%' : '100%', // 减小移动端手柄大小
          handleStyle: { 
            color: '#fff', 
            borderColor: colors.sd, // 新蓝色手柄边框
            borderWidth: 2,
            shadowBlur: 4, // 增加阴影
            shadowColor: 'rgba(0, 0, 0, 0.3)', 
            shadowOffsetX: 1, 
            shadowOffsetY: 1 
          },
          textStyle: { 
            color: theme.palette.text.primary,
            fontSize: isMobile ? 10 : 12 // 移动端字体更小
          },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          dataBackground: {
            lineStyle: {
              color: 'rgba(24, 144, 255, 0.5)' // 新蓝色背景线
            },
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.2)' // 新蓝色背景区域
            }
          },
          selectedDataBackground: {
            lineStyle: {
              color: 'rgba(24, 144, 255, 0.8)' // 选中时更深的新蓝色线
            },
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.4)' // 选中时更深的新蓝色区域
            }
          },
          brushSelect: false, // 禁用刷选功能，避免触摸冲突
          emphasis: { // 高亮手柄样式，使其更明显
              handleStyle: {
                  borderColor: colors.sd, // 新蓝色高亮边框
                  borderWidth: 3,
                  shadowBlur: 6,
                  shadowColor: 'rgba(24, 144, 255, 0.5)' // 新蓝色高亮阴影
              }
          }
        }
      ],
      series: [
        { 
          name: '声母得分', 
          type: 'line', 
          smooth: true, 
          symbol: 'emptyCircle', 
          symbolSize: isMobile ? 6 : 8, // 移动端稍小的标记
          data: saScores, 
          itemStyle: { 
            color: colors.sa, // 黄色
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 3
          }, 
          lineStyle: { 
            width: isMobile ? 2 : 3, // 移动端稍细的线条
            color: colors.sa, // 黄色
            shadowColor: 'rgba(241, 196, 15, 0.3)', // 黄色阴影
            shadowBlur: 5
          }, 
          areaStyle: { // 降低透明度
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: 'rgba(241, 196, 15, 0.3)'}, // 降低起始透明度
              {offset: 0.7, color: 'rgba(241, 196, 15, 0.1)'},
              {offset: 1, color: 'rgba(241, 196, 15, 0.02)'} // 降低结束透明度
            ])
          },
          connectNulls: true, 
          emphasis: { 
            focus: 'series', 
            lineStyle: { width: isMobile ? 3 : 4 } 
          } 
        },
        { 
          name: '韵母得分', 
          type: 'line', 
          smooth: true, 
          symbol: 'emptyCircle', 
          symbolSize: isMobile ? 6 : 8, 
          data: yaScores, 
          itemStyle: { 
            color: colors.ya, // 绿色
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 3
          }, 
          lineStyle: { 
            width: isMobile ? 2 : 3,
            color: colors.ya, // 绿色
            shadowColor: 'rgba(46, 204, 113, 0.3)', // 绿色阴影
            shadowBlur: 5
          }, 
          areaStyle: { // 降低透明度
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: 'rgba(46, 204, 113, 0.3)'}, // 降低起始透明度
              {offset: 0.7, color: 'rgba(46, 204, 113, 0.1)'},
              {offset: 1, color: 'rgba(46, 204, 113, 0.02)'} // 降低结束透明度
            ])
          },
          connectNulls: true, 
          emphasis: { 
            focus: 'series', 
            lineStyle: { width: isMobile ? 3 : 4 } 
          } 
        },
        { 
          name: '声调得分', 
          type: 'line', 
          smooth: true, 
          symbol: 'emptyCircle', 
          symbolSize: isMobile ? 6 : 8, 
          data: sdScores, 
          itemStyle: { 
            color: colors.sd, // 新蓝色
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 3
          }, 
          lineStyle: { 
            width: isMobile ? 2 : 3,
            color: colors.sd, // 新蓝色
            shadowColor: 'rgba(24, 144, 255, 0.3)', // 新蓝色阴影
            shadowBlur: 5
          }, 
          areaStyle: { // 降低透明度
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: 'rgba(24, 144, 255, 0.3)'}, // 降低起始透明度
              {offset: 0.7, color: 'rgba(24, 144, 255, 0.1)'},
              {offset: 1, color: 'rgba(24, 144, 255, 0.02)'} // 降低结束透明度
            ])
          },
          connectNulls: true, 
          emphasis: { 
            focus: 'series', 
            lineStyle: { width: isMobile ? 3 : 4 } 
          } 
        }
      ]
    };

    chartInstance.setOption(option);

    // 移动端适配的resize处理函数
    const resizeHandler = () => {
      if (chartInstance) {
        const container = lineChartRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const isMobileView = containerWidth < 768; // 保持一致的判断
          
          // 动态调整选项以适应移动设备
          chartInstance.setOption({
            legend: {
              itemGap: isMobileView ? 10 : 20,
              textStyle: { fontSize: isMobileView ? 12 : 14 },
              orient: isMobileView ? 'horizontal' : 'horizontal',
              padding: isMobileView ? [0, 0, 0, 0] : [5, 10, 5, 10]
            },
            grid: {
              left: isMobileView ? '5%' : '3%',
              right: isMobileView ? '5%' : '4%',
              bottom: isMobileView ? '18%' : '12%', // 同步调整
              top: isMobileView ? '60px' : '50px'
            },
            xAxis: {
              axisLabel: {
                fontSize: isMobileView ? 10 : 12,
                rotate: isMobileView ? 30 : 0
              }
            },
            yAxis: {
              axisLabel: { fontSize: isMobileView ? 10 : 12 },
              splitLine: { // 确保 resize 时也使用新蓝色分割线
                lineStyle: {
                  color: 'rgba(24, 144, 255, 0.2)'
                }
              }
            },
            dataZoom: [
              { // inside dataZoom 调整
                moveOnMouseMove: !isMobileView // 确保移动端禁用鼠标移动
              },
              { // slider dataZoom 调整
                height: isMobileView ? 22 : 20, // 同步调整
                handleSize: isMobileView ? '110%' : '100%', // 同步调整
                textStyle: { fontSize: isMobileView ? 10 : 12 },
                // 确保 resize 时 dataZoom 颜色也正确
                borderColor: 'rgba(24, 144, 255, 0.5)',
                fillerColor: 'rgba(24, 144, 255, 0.2)',
                handleStyle: { borderColor: colors.sd },
                dataBackground: {
                  lineStyle: { color: 'rgba(24, 144, 255, 0.5)' },
                  areaStyle: { color: 'rgba(24, 144, 255, 0.2)' }
                },
                selectedDataBackground: {
                  lineStyle: { color: 'rgba(24, 144, 255, 0.8)' },
                  areaStyle: { color: 'rgba(24, 144, 255, 0.4)' }
                },
                emphasis: { handleStyle: { borderColor: colors.sd } }
              }
            ],
            series: [0, 1, 2].map(idx => ({
              symbolSize: isMobileView ? 6 : 8,
              lineStyle: { width: isMobileView ? 2 : 3 },
              emphasis: { lineStyle: { width: isMobileView ? 3 : 4 } }
            }))
          });
        }
        chartInstance.resize();
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    // 初始调用一次以适应当前屏幕
    resizeHandler();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      chartInstance?.dispose(); // 组件卸载时销毁实例
    };
  }, [history, theme, isLoading, context]); // 将 context 加入依赖项

  return (
    // 使用动态标题
    <Card className={styles.card} title={cardTitle}>
      {isLoading ? (
        <Typography color="text.secondary" style={{ textAlign: 'center', padding: '16px' }}>加载中...</Typography>
      ) : history.length > 0 ? (
        <div className="h-full min-h-300px w-full" ref={lineChartRef}></div>
      ) : (
        <Empty description="暂无数据绘制趋势图" />
      )}
    </Card>
  );
};
