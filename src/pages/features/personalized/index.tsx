import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Input as AntdInput, Modal as AntdModal, message } from 'antd'; // 保留 antd message
import { Button, ErrorBlock, FloatingBubble, PullToRefresh, SpinLoading } from 'antd-mobile'; // 导入 FloatingBubble, 移除 List
import { pinyin } from 'pinyin-pro';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AssignPracticeTaskAPI } from '../../../api/patients';
import { GetPersonalizedPracticeTextAPI, GetPracticeHistoriesAPI, PracticeHistory } from '../../../api/train';
import Navbar from '../../../components/Navbar';
import useAuthStore from '../../../store/auth'; // 导入 auth store
import useTasksStore from '../../../store/tasks';
import styles from './index.module.scss';

// 汉字及其分数信息
interface CharScoreInfo {
  char: string;
  scores: number[];
  avgScore: number;
}

// 更新：分析结果状态类型
interface AnalysisResult {
  weakCharsForDisplay: CharScoreInfo[]; // 用于显示的薄弱汉字列表 (最多 100)
  pinyinStringForGeneration: string; // 用于生成任务的拼音字符串 (基于前 20)
  totalUniqueChars: number; // 存储总汉字数用于后续检查
}

const PersonalizedTrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuthStore(); // 使用 auth store 获取用户信息
  const [loading, setLoading] = useState(true); // 初始加载状态设为 true
  const [error, setError] = useState<string | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false); // antd Modal 的可见状态
  const [assignModalLoading, setAssignModalLoading] = useState(false); // antd Modal 的确认按钮加载状态
  const [taskTitle, setTaskTitle] = useState('');
  const [taskRemark, setTaskRemark] = useState('');
  const [generatedTextUuid, setGeneratedTextUuid] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // 存储分析结果

  // 处理历史记录并计算字符分数
  const processHistories = (histories: PracticeHistory[]): CharScoreInfo[] => {
    const charScoreMap = new Map<string, number[]>();
    const chineseCharRegex = /[\u4e00-\u9fa5]/; // 匹配中文字符

    histories.forEach(history => {
      if (history.target_text && history.char_scores) {
        const textChars = history.target_text.split('');
        const scores = history.char_scores;

        // 遍历原始文本的每个字符及其索引
        textChars.forEach((char, index) => {
          // 检查是否是汉字
          if (chineseCharRegex.test(char)) {
            // 检查索引是否在分数数组范围内，并且分数数据有效
            if (index < scores.length && scores[index] && typeof scores[index].score === 'number') {
              const scoreData = scores[index];
              const existingScores = charScoreMap.get(char) || [];
              existingScores.push(scores[index].score); // Use the narrowed type
              charScoreMap.set(char, existingScores);
            } else {
              // 如果是汉字但没有对应的有效分数，可以选择记录或忽略
              console.warn(`汉字 '${char}' 在索引 ${index} 处缺少有效分数数据，文本: "${history.target_text}"`);
            }
          }
          // 非汉字字符直接忽略
        });
      }
    });

    // 计算平均分并排序 (保持不变)
    const charScoreInfos: CharScoreInfo[] = [];
    charScoreMap.forEach((scores, char) => {
      const sum = scores.reduce((acc, score) => acc + score, 0);
      const avgScore = scores.length > 0 ? sum / scores.length : 0;
      charScoreInfos.push({ char, scores, avgScore });
    });

    // 按平均分升序排序 (分数越低越靠前)
    charScoreInfos.sort((a, b) => a.avgScore - b.avgScore);

    return charScoreInfos;
  };

  // 步骤 1: 分析薄弱点
  const analyzeWeakPoints = useCallback(async (isRefresh = false) => { // 添加 isRefresh 参数
    if (!userInfo?.id) {
      setError('无法获取用户信息');
      setLoading(false);
      if (!isRefresh) message.error('无法获取用户信息'); // 初始加载时提示
      return;
    }
    setLoading(true); // 开始加载
    setError(null);
    // setAnalysisResult(null); // 下拉刷新时不立即清空旧数据，体验更好
    setGeneratedTextUuid(null);
    // const hideLoading = !isRefresh ? message.loading('正在分析历史记录...', 0) : null; // 初始加载时显示 message loading

    try {
      // 1. 获取练习历史
      const historyRes = await GetPracticeHistoriesAPI({ patient_id: String(userInfo.id) });
      if (historyRes.status !== 0 || !historyRes.histories || historyRes.histories.length === 0) {
        setError('没有足够的练习历史来生成个性化任务');
        // message.error('练习历史不足'); // 在 ErrorBlock 显示更清晰
        setLoading(false);
        // hideLoading();
        return;
      }

      // 2. 处理历史记录并获取排序后的字符分数
      const sortedCharScores = processHistories(historyRes.histories);

      // 提取最多 100 个用于显示
      const topWeakCharsForDisplay = sortedCharScores.slice(0, 100);
      // 提取前 20 个用于生成拼音
      const topWeakCharsForGeneration = sortedCharScores.slice(0, 20);

      if (topWeakCharsForGeneration.length === 0) {
        setError('未能识别出需要练习的汉字');
        setLoading(false);
        return;
      }

      // 获取前 20 个的拼音
      const charsToGetPinyin = topWeakCharsForGeneration.map(info => info.char).join('');
      const pinyinList = pinyin(charsToGetPinyin, { toneType: 'num', v: true }).split(' ');
      const practicePinyinForGeneration = pinyinList.join(',');
      console.log("用于生成的拼音 (前20):", practicePinyinForGeneration);

      setAnalysisResult({
        weakCharsForDisplay: topWeakCharsForDisplay, // 最多 100 个
        pinyinStringForGeneration: practicePinyinForGeneration, // 前 20 个的拼音
        totalUniqueChars: sortedCharScores.length,
      });
      if (isRefresh) message.success('刷新成功'); // 刷新成功提示

    } catch (err: any) {
      console.error("分析薄弱点失败:", err);
      const errorMsg = err.message || '分析时发生未知错误';
      setError(errorMsg);
      if (!isRefresh) message.error('分析失败: ' + errorMsg); // 初始加载失败提示
    } finally {
      // if (hideLoading) hideLoading();
      setLoading(false); // 分析结束，停止加载
    }
  }, [userInfo?.id]);

  // 使用 useEffect 在组件挂载时执行分析
  useEffect(() => {
    analyzeWeakPoints();
  }, [analyzeWeakPoints]);

  // 下拉刷新处理函数
  const handleRefresh = async () => {
    console.log("个性化训练页下拉刷新触发");
    await analyzeWeakPoints(true); // 调用分析函数并标记为刷新操作
    console.log("个性化训练页数据刷新完成");
  };

  // 步骤 2: 根据分析结果生成任务 (由确认框调用)
  const generateTaskFromAnalysis = useCallback(async () => {
    if (!analysisResult) return; // 防御性检查

    // setLoading(true); // Loading 状态由 AntdModal.confirm 控制
    setError(null);
    const hideLoading = message.loading('正在生成个性化任务文本...', 0);

    try {
      // 使用前 20 个字符的拼音
      const personalizeRes = await GetPersonalizedPracticeTextAPI({ practice_pinyin: analysisResult.pinyinStringForGeneration });
      hideLoading(); // 成功获取 API 结果后立即关闭 loading message

      if (personalizeRes.status !== 0 || !personalizeRes.uuid) {
        const errorMsg = personalizeRes.message || '生成个性化练习文本失败';
        setError(errorMsg);
        message.error(errorMsg);
        // setLoading(false); // 由 confirm modal 控制
        throw new Error(errorMsg); // 抛出错误以便 confirm modal 停止 loading
      }

      setGeneratedTextUuid(personalizeRes.uuid);
      setTaskTitle(`个性化训练任务 - ${new Date().toLocaleDateString()}`);
      setTaskRemark('');
      setAssignModalVisible(true); // 打开 antd Modal
      message.success('任务文本已生成，请设置任务信息');

    } catch (err: any) {
      hideLoading(); // 确保在 catch 块中也关闭 loading message
      console.error("生成个性化任务失败:", err);
      // 错误消息已在 try 块中处理或由调用者处理
      // setLoading(false); // 由 confirm modal 控制
      throw err; // 重新抛出错误，让 confirm modal 知道失败了
    }
    // finally 块不再需要，因为 hideLoading 在 try 和 catch 中都处理了
  }, [analysisResult]);

  // 显示生成确认对话框
  const showGenerateConfirm = () => {
    if (!analysisResult) return;

    // 检查汉字数量
    if (analysisResult.totalUniqueChars < 30) {
      const currentCount = analysisResult.totalUniqueChars;
      const errorMsg = `汉字样本量不足 (至少需要 ${30} 个不同汉字的历史记录，当前 ${currentCount} 个)`;
      message.error(errorMsg);
      // setError(errorMsg); // 可以选择是否在页面上显示错误
      return;
    }

    AntdModal.confirm({
      title: '确认生成个性化任务',
      content: '系统将根据分析结果中最薄弱的 20 个发音生成练习任务，确定要继续吗？',
      okText: '确认生成',
      cancelText: '取消',
      // confirmLoading is handled automatically by the modal when onOk returns a promise
      async onOk() {
        try {
          // setLoading(true); // 开始加载
          await generateTaskFromAnalysis();
          // setLoading(false); // 成功后停止加载
        } catch (error) {
          // setLoading(false); // 失败后停止加载
          message.error('生成任务过程中断'); // 提示用户
          // 错误已在 generateTaskFromAnalysis 中处理
          return Promise.reject(error); // 阻止 Modal 关闭
        }
      },
      onCancel() {
        console.log('用户取消生成');
      },
    });
  };


  // 处理分配任务 (Antd Modal 确认后调用)
  const handleAssignTask = async () => {
    if (!userInfo?.id || !generatedTextUuid || !taskTitle) {
      message.error('任务标题不能为空');
      return;
    }
    setAssignModalLoading(true); // 开始 antd Modal 的确认按钮加载

    try {
      const payload = {
        patient_id: userInfo.id,
        text_uuid: generatedTextUuid,
        title: taskTitle,
        remark: taskRemark,
      };
      const assignRes = await AssignPracticeTaskAPI(payload);

      if (assignRes.status === 0) {
        message.success('个性化任务分配成功！');
        setAssignModalVisible(false); // 关闭 Modal
        // setAnalysisResult(null); // 不再清空分析结果，保持列表显示
        // 清理本次任务相关状态即可
        setGeneratedTextUuid(null);
        setTaskTitle('');
        setTaskRemark('');
        useTasksStore.getState().fetchTasks(userInfo.id); // 刷新任务列表
      } else {
        const errorMsg = assignRes.message || '分配任务失败';
        message.error(errorMsg);
        // setError(errorMsg); // 可以选择是否在页面显示错误
      }
    } catch (err: any) {
      console.error("分配任务失败:", err);
      const errorMsg = err.message || '分配任务时发生错误';
      message.error('分配任务时发生错误: ' + errorMsg);
      // setError(errorMsg);
    } finally {
      setAssignModalLoading(false); // 结束 antd Modal 的确认按钮加载
      // setLoading(false); // 页面加载状态不需要在这里改变
      setGeneratedTextUuid(null); // 清理状态
    }
  };

  // 渲染主内容区域
  const renderMainContent = () => {
    // 初始加载状态由 SpinLoading 处理，下拉刷新由 PullToRefresh 处理
    if (loading && !analysisResult && !error) { // 仅在首次加载时显示 SpinLoading
      return (
        <div className="flex flex-col items-center">
          <SpinLoading style={{ '--size': '48px' }} />
          <span className="mt-2 text-gray-500">正在分析历史记录...</span>
        </div>
      );
    }
    if (error && !analysisResult) { // 如果分析出错且没有旧数据可显示
      return (
        <div>
          <ErrorBlock status="default" title="无法生成建议" description={error} className="mb-4" />
          {/* 可以添加重试按钮 */}
          <div className="text-center">
            <Button
              color='primary'
              onClick={() => analyzeWeakPoints()} // 手动重试
              disabled={loading}
            >
              重试分析
            </Button>
          </div>
        </div>
      );
    }
    if (analysisResult) { // 分析成功或刷新后有数据显示
      return (
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2 text-center">发音薄弱点分析结果</h3>
          <p className="text-sm text-gray-600 mb-4 text-center"> {/* 增加 mb */}
            根据您的练习历史 (共分析 {analysisResult.totalUniqueChars} 个不同汉字)，以下汉字得分较低 (最多显示 100 个)：
          </p>
          {/* 使用自定义网格布局替代 List */}
          <div className={styles.charGrid}>
            {analysisResult.weakCharsForDisplay.map((item, index) => {
              // 获取带音标的拼音
              const charPinyin = pinyin(item.char, { toneType: 'symbol', v: true });
              // 分数转为 0-100 的整数
              const score100 = Math.round(item.avgScore * 100);
              return (
                <div key={index} className={styles.charGridItem}>
                  <div className={styles.charRankBadge}>{index + 1}</div>
                  <div className={styles.pinyinDisplay}>{charPinyin}</div>
                  <div className={styles.charItself}>{item.char}</div>
                  <div className={styles.charScore100}>{score100}</div> {/* 显示 0-100 分数 */}
                </div>
              );
            })}
          </div>
          {analysisResult.totalUniqueChars < 30 && (
            <p className="text-xs text-orange-500 mt-4 text-center">
              提示：当前汉字样本量 ({analysisResult.totalUniqueChars}) 少于 30 个，无法生成个性化任务。
            </p>
          )}
        </div>
      );
    }
    // 如果非 loading, 非 error, 且 analysisResult 为 null (理论上不应发生，除非 analyzeWeakPoints 逻辑问题)
    return <ErrorBlock status="empty" title="未能获取分析结果" />;
  };

  return (
    <div className="page-container flex flex-col h-full">
      <Navbar onBack={() => navigate(-1)}>个性化训练</Navbar>
      {/* 将 PullToRefresh 包裹内容区域 */}
      <div className={`page-content flex-1 overflow-y-auto ${styles.pullToRefreshContainer}`}>
        <PullToRefresh
          onRefresh={handleRefresh}
          renderText={status => { // 自定义下拉刷新文字
            return {
              pulling: '下拉刷新分析结果',
              canRelease: '释放立即刷新',
              refreshing: '正在分析...',
              complete: '刷新成功',
            }[status];
          }}
        >
          {/* 渲染主要内容 */}
          <div className="flex flex-col items-center justify-start p-4 min-h-[200px]"> {/* 改为 justify-start */}
            {renderMainContent()}
          </div>
        </PullToRefresh>
      </div>

      {/* 使用 antd-mobile 的 FloatingBubble */}
      {analysisResult && !loading && !error && (
        <FloatingBubble
          style={{
            '--initial-position-bottom': '100px',
            '--initial-position-right': '24px',
            '--edge-distance': '24px',
            '--background': 'var(--adm-color-primary)', // 使用 CSS 变量
            '--color': '#fff',
            '--size': '48px', // 调整气泡大小
          } as React.CSSProperties}
          onClick={showGenerateConfirm}
        >
          <AutoAwesomeIcon fontSize='medium' /> {/* 调整图标大小 */}
        </FloatingBubble>
      )}

      {/* 使用 antd Modal */}
      <AntdModal
        title="设置训练任务信息"
        open={assignModalVisible} // 使用 open 替代 visible
        onOk={handleAssignTask} // 点击确认按钮时调用
        onCancel={() => { // 点击取消或关闭按钮
          setAssignModalVisible(false);
          // setLoading(false); // 不需要设置页面 loading
          setGeneratedTextUuid(null);
          message.info('操作已取消');
        }}
        confirmLoading={assignModalLoading} // 控制确认按钮的加载状态
        okText="确认分配"
        cancelText="取消"
        maskClosable={false} // 点击蒙层不可关闭
      >
        {/* 使用 antd Input */}
        <AntdInput
          placeholder="请输入任务标题"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          style={{ marginBottom: '12px' }} // 使用 style 替换 className
        />
        <AntdInput.TextArea
          placeholder="请输入任务备注（可选）"
          value={taskRemark}
          onChange={(e) => setTaskRemark(e.target.value)}
          rows={3}
        />
      </AntdModal>
    </div>
  );
};

export default PersonalizedTrainingPage;
