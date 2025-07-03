# 核心功能: 03. 主页模块 (Home)

本文档详细解析聪言应用的"主页"模块。主页是用户登录后看到的核心界面，它集成了训练进度概览、任务通知和各项核心功能的入口。

## 1. 模块概述

主页 (`src/pages/home`) 是一个高度信息聚合的仪表盘 (Dashboard)。它为用户提供了个性化的概览和便捷的功能导航。

- **核心组件**:
  - `SearchBar.tsx`: 顶部搜索栏。
  - `SwiperArea.tsx`: 用于展示公告或推荐内容的轮播图。
  - `ProgressArea.tsx`: 展示用户训练任务进度的核心区域。
  - `PersonalizedTrainingArea.tsx`: 个性化训练入口。
  - `PracticeArea.tsx`: 自主练习入口。
- **核心交互**:
  - **下拉刷新**: 支持下拉刷新整个页面的数据。
  - **角色视图**: 根据用户角色（如患者、家属）显示不同的功能入口。

## 2. 页面布局与结构

主页 (`index.tsx`) 的布局清晰地划分了不同的功能区域：

1.  **顶部搜索栏 (`SearchBar`)**: 固定在页面顶部，提供快速搜索功能。
2.  **可滚动内容区**:
    - 该区域被 `antd-mobile` 的 `<PullToRefresh>` 组件包裹，实现了下拉刷新功能。
    - **公告 (`Alert`)**: 显示重要的系统公告。
    - **轮播图 (`SwiperArea`)**: 用于展示图片Banner和链接。
    - **训练进度区 (`ProgressArea`)**: **核心区域**，展示当前用户的任务完成情况。
    - **个性化训练区 (`PersonalizedTrainingArea`)**: **条件渲染**，仅对非"家属"角色的用户显示。
    - **自主练习区 (`PracticeArea`)**: **条件渲染**，同样仅对非"家属"角色的用户显示。

## 3. 核心功能区详解

### 3.1. 训练进度区 (`ProgressArea`)

这个组件是主页的数据展示核心，它提供了一个动态、信息丰富的训练进度概览。

- **数据来源**:
  - 该组件不直接请求数据，而是通过 `useEffect` 触发 `useTasksStore` 的 `fetchTasks` action 来获取任务列表。
  - 它完全依赖 `useTasksStore` 提供的 `tasks`, `loading`, `error` 状态来驱动UI。
- **状态展示**:
  - **加载中**: 显示优雅的骨架屏 (`Skeleton`)，避免界面空白。
  - **加载失败**: 显示具体的错误信息。
  - **加载成功**:
    - 计算并展示任务完成百分比。
    - `CustomProgressBar` 进度条会根据百分比变换颜色。
    - `getMotivationalQuote` 函数会根据进度提供不同的激励性话语。
    - 清晰地列出"已完成"、"未完成"、"总计"的任务数量。
- **交互**:
  - 点击整个卡片区域，用户将被导航至 `/tasks` 页面，查看详细的任务列表。

### 3.2. 自主练习区 (`PracticeArea`)

该组件是通往不同类型发音练习的入口。

- **练习类型**: 提供了"散文"、"古代诗词"、"现代诗词"三个入口。
- **导航逻辑**:
  - 每个入口是一个 `TextCard` 组件。
  - 点击后，会通过 `navigate('/train', { state: { title, type } })` 跳转到训练文本列表页面。
  - `title` 和 `type` (如 'prose') 会通过 `location.state` 传递，告知目标页面需要加载哪种类型的训练材料。
  - 在跳转前会清理 `sessionStorage` 中的 `textList`，以确保每次都加载最新的列表。

### 3.3. 下拉刷新与角色视图

- **下拉刷新**: 当用户在可滚动区域执行下拉手势时，会触发 `handleRefresh` 函数。该函数调用 `useTasksStore` 的 `clearTasks` 和 `fetchTasks` action，从而刷新 `ProgressArea` 中显示的任务数据。
- **角色视图**: 通过检查 `useAuthStore` 中的 `userInfo.user_role`，主页实现了对"家属"(`relative`) 角色的特殊处理，向他们隐藏了"个性化训练"和"自主练习"的入口，提供了更符合其身份的视图。
