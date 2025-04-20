import { create } from 'zustand';
import { GetPracticeTasksAPI, PracticeTaskInfo, GetPracticeTasksResponse } from '../api/patients';

interface TasksState {
  tasks: PracticeTaskInfo[];
  loading: boolean;
  error: string | null;
  fetchAttempted: boolean; // 新增：标记是否已尝试获取
  fetchTasks: (patientId: number) => Promise<void>;
  clearTasks: () => void;
}

const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchAttempted: false, // 初始为 false

  fetchTasks: async (patientId: number) => {
    // 修改检查逻辑：如果正在加载，或者已经尝试过获取，则跳过
    // 这意味着即使上次获取结果为空，也不会再次请求，除非 clearTasks 被调用
    if (get().loading || get().fetchAttempted) {
      console.log(`跳过任务获取：loading=${get().loading}, fetchAttempted=${get().fetchAttempted}`);
      return;
    }

    // 重置错误状态并开始加载
    set({ loading: true, error: null });
    try {
      console.log(`请求 patient_id 为 ${patientId} 的任务列表 (首次尝试或状态已重置)`);
      const res: GetPracticeTasksResponse = await GetPracticeTasksAPI(patientId);
      if (res.status === 0 && res.tasks) {
        set({ tasks: res.tasks });
      } else {
        console.error("获取任务失败:", res.message);
        // 即使失败，也设置 tasks 为空数组，并记录错误
        set({ error: res.message || '获取任务列表失败', tasks: [] });
      }
    } catch (err: any) {
      console.error("获取任务异常:", err);
      // 即使异常，也设置 tasks 为空数组，并记录错误
      set({ error: err.message || '获取任务列表时发生错误', tasks: [] });
    } finally {
      // 标记已尝试获取，并结束加载状态
      set({ loading: false, fetchAttempted: true });
      console.log("任务获取尝试完成，设置 fetchAttempted = true");
    }
  },

  clearTasks: () => {
    console.log("清空任务状态并重置 fetchAttempted");
    // 清空任务、错误，并重置 fetchAttempted 状态
    set({ tasks: [], error: null, loading: false, fetchAttempted: false });
  },
}));

export default useTasksStore;
