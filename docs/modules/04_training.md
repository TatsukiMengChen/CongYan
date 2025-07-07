# 核心功能: 04. 发音训练模块 (Training)

本文档详细解析聪言应用最核心的功能——**发音训练模块**。该模块位于 `src/pages/features/train`，为用户提供了从选择文本到录音、实时评估、查看结果的完整闭环体验。

## 1. 模块概述

发音训练模块是应用的核心价值所在，它融合了媒体处理、实时 WebSocket 通信和复杂的状态管理。

- **页面流程**:
  - `trainTextList.tsx`: 训练文本列表页，支持分类和下拉刷新。
  - `detail/index.tsx`: 训练详情页，集成了录音、播放、实时评估等功能。
- **核心技术**:
  - **媒体录制**: `useMediaRecorder` Hook (封装 `MediaRecorder` API)。
  - **实时评估**: `useWebSocketASR` Hook (封装 WebSocket ASR 通信)。
  - **状态共享**: `TextContext` (React Context API)，用于在训练详情页的众多组件间共享文本和评估结果状态。

## 2. 整体数据流与流程

```mermaid
graph TD
    subgraph 主页
        A[自主练习区] -->|携带类型 'prose'| B(导航到 /train)
    end

    subgraph 文本列表页 (trainTextList.tsx)
        B --> C{加载/过滤文本}
        C -->|API: GetCorpusAPI| D[获取文本语料库]
        C --> E[渲染文本卡片列表]
        E -->|点击, 携带 'text_uuid'| F(导航到 /train/detail)
    end

    subgraph 训练详情页 (detail/index.tsx)
        F --> G{获取文本详情}
        G -->|API: GetCorpusAPI(uuid)| H[获取单个文本内容]
        H --> I[通过 TextProvider<br/>将文本数据注入上下文]
        I --> J[渲染 FunctionalArea 等子组件]
    end

    subgraph "功能区 (FunctionalArea.tsx)"
        J --> K{启动 Hooks}
        K --> L(useMediaRecorder)
        K --> M(useWebSocketASR)
        L --> N[麦克风录音]
        N -->|音频数据流| M
        M -->|音频流| O(WebSocket ASR 服务器)
        O -->|评估/识别结果| M
        M -->|更新评估结果| I
    end
```

## 3. 关键实现细节

### 3.1. 训练详情页 (`detail/index.tsx`)

该页面是整个模块的"指挥中心"，负责数据的初始化和组件的组装。

1.  **数据加载**: 通过 `useLocation` 获取 `text_uuid`，然后调用 `GetCorpusAPI` 获取文本详情。
2.  **上下文提供**: 页面被 `<TextProvider>` 包裹，所有子组件都可以通过 `useContext(TextContext)` 访问到核心的文本数据和后续的评估结果。
3.  **任务状态集成**: 该页面会从 `useTasksStore` 获取任务列表，并判断当前训练是否是一个已完成的任务。`isTaskFinished` 标志位会被传递给功能区，用于禁用某些操作（如重新录音）。

### 3.2. 核心 Hooks

训练页面的核心逻辑被抽象为两个自定义 Hook，实现了高度的内聚和复用。

- **`useMediaRecorder.ts`**:

  - 封装了 `MediaRecorder` Web API。
  - 负责**请求麦克风权限、开始录音、处理音频数据 (`ondataavailable`)、停止录音**。
  - 它很可能会将录制的音频切片 (Blob) 通过回调函数暴露给使用它的组件。

- **`useWebSocketASR.ts`**:
  - 负责与后端 ASR (自动语音识别) 服务器进行 **WebSocket** 通信。
  - **建立连接**: 初始化 WebSocket 连接。
  - **发送数据**: 接收 `useMediaRecorder` 提供的音频数据，并将其通过 WebSocket 发送到服务器。
  - **接收结果**: 监听 `onmessage` 事件，接收从服务器实时返回的识别或评估结果。
  - **状态管理**: 内部管理着连接状态、识别结果等，并通过返回值提供给组件。

### 3.3. 核心组件 (`detail/components/`)

- **`FunctionalArea.tsx`**:

  - 训练页面的功能核心，它负责**启动和协调** `useMediaRecorder` 和 `useWebSocketASR` 这两个 Hook。
  - 它内部集成了 `RecordingControls` 和 `PlaybackControls`，并将其 UI 事件（如点击"开始录音"）与 Hook 提供的函数（如 `startRecording()`）绑定。

- **`AsrDisplay.tsx` 和 `CharacterDetailPopup.tsx`**:
  - 这两个组件负责**展示**评估结果。
  - 它们通过 `useContext(TextContext)` 从上下文中获取由 `useWebSocketASR` Hook 更新的评估数据。
  - `AsrDisplay` 可能用于显示整句的识别文本。
  - `CharacterDetailPopup` 则用于在用户点击某个汉字时，弹出浮层显示该字的详细评分信息（如声母、韵母、声调的得分）。
