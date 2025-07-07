# Vivo AIGC SDK 使用指南

更新时间：2024-12-27

## 概述

基于 Vivo AIGC 官方 API 文档实现的完整 TypeScript SDK，支持大模型对话、AI绘画、OCR识别和TTS语音合成等功能。

## 模块结构

```
src/api/vivoAigc/
├── index.ts          # 统一入口文件
├── types.ts          # TypeScript 类型定义
├── client.ts         # HTTP 客户端和鉴权
├── chat.ts           # 大模型对话服务
├── draw.ts           # AI绘画服务
├── ocr.ts            # OCR识别服务
└── tts.ts            # TTS语音合成服务
```

## 快速开始

### 1. 安装依赖

```bash
pnpm add crypto-js uuid @types/uuid
```

### 2. 环境配置

在 `.env` 文件中配置你的 API 凭证：

```env
VITE_VIVO_AIGC_APP_ID=你的应用ID
VITE_VIVO_AIGC_APP_KEY=你的应用密钥
VITE_VIVO_AIGC_BASE_URL=https://api-ai.vivo.com.cn
```

### 3. 基础使用

#### 创建 SDK 实例

```typescript
import { createVivoAigcSDK } from "@/api/vivoAigc";

const sdk = createVivoAigcSDK({
  appId: "your_app_id",
  appKey: "your_app_key",
  baseURL: "https://api-ai.vivo.com.cn",
});
```

#### 大模型对话

```typescript
// 单轮对话
const response = await sdk.chat.chat("你好，请介绍一下你自己", {
  model: "vivo-BlueLM-TB-Pro",
  temperature: 0.9,
});

// 多轮对话
const messages = [
  { role: "user", content: "你好" },
  { role: "assistant", content: "你好！我是AI助手。" },
  { role: "user", content: "请帮我写一首诗" },
];

const response = await sdk.chat.chatWithMessages(messages, {
  model: "vivo-BlueLM-TB-Pro",
});
```

#### AI绘画

```typescript
// 文生图
const taskId = await sdk.draw.textToImage("一只可爱的小猫", {
  width: 512,
  height: 512,
  styleConfig: "4cbc9165bc615ea0815301116e7925a3", // 通用v6.0
});

// 等待任务完成
const result = await sdk.draw.waitForTask(taskId);
const imageUrls = result.result?.images || [];

// 一键生成（自动等待完成）
const images = await sdk.draw.generateImageFromText("美丽的风景", {
  width: 1024,
  height: 768,
});
```

#### OCR识别

```typescript
// 从base64识别
const response = await sdk.ocr.recognizeText(imageBase64, {
  pos: 2, // 返回文字和相对坐标
});

const texts = sdk.ocr.extractTextFromResponse(response);

// 从文件识别
const file = document.querySelector("input[type=file]").files[0];
const result = await sdk.ocr.recognizeFromFile(file);
```

#### TTS语音合成

```typescript
// 注意：TTS 使用 WebSocket，在浏览器环境可能有限制
const audioBuffer = await sdk.tts.synthesize("这是测试文本", {
  vcn: "vivoHelper", // 音色
  speed: 50, // 语速
  volume: 50, // 音量
});

// 转换为可播放的音频
const blob = new Blob([audioBuffer], { type: "audio/wav" });
const audioUrl = URL.createObjectURL(blob);
```

## 便捷API

SDK 也提供了一套便捷的 API 函数：

```typescript
import { vivoAigc } from "@/api/vivoAigc";

// 快速对话
const answer = await vivoAigc.chat("你好世界");

// 快速生图
const images = await vivoAigc.textToImage("美丽的夕阳");

// 快速OCR
const texts = await vivoAigc.recognizeText(imageBase64);
```

## 常量和配置

### 大模型

```typescript
import { VIVO_MODELS, SYSTEM_PROMPTS } from "@/api/vivoAigc";

// 模型列表
VIVO_MODELS.BLUELM_TB_PRO; // 'vivo-BlueLM-TB-Pro'

// 系统提示词
SYSTEM_PROMPTS.ASSISTANT; // 通用助手
SYSTEM_PROMPTS.CREATIVE; // 创意写作
SYSTEM_PROMPTS.PROFESSIONAL; // 专业回答
```

### AI绘画风格

```typescript
import { DRAW_STYLES, IMAGE_SIZES } from "@/api/vivoAigc";

// 绘画风格
DRAW_STYLES.GENERAL_V6; // 通用v6.0
DRAW_STYLES.FANTASY_ANIME; // 梦幻动漫
DRAW_STYLES.REALISTIC; // 唯美写实

// 图片尺寸
IMAGE_SIZES.SQUARE_1024; // { width: 1024, height: 1024 }
IMAGE_SIZES.PORTRAIT_768; // { width: 768, height: 1024 }
```

### TTS音色

```typescript
import { TTS_VOICES, TTS_ENGINES } from "@/api/vivoAigc";

// 音色选择
TTS_VOICES.VIVO_HELPER; // 奕雯
TTS_VOICES.YUN_YE; // 云野-温柔
TTS_VOICES.WAN_QING; // 婉清-御姐

// 合成引擎
TTS_ENGINES.SHORT_AUDIO; // 短音频合成
TTS_ENGINES.LONG_AUDIO; // 长音频合成
TTS_ENGINES.HUMANOID; // 超拟人音色
```

### OCR配置

```typescript
import { POS_OPTIONS, BUSINESS_IDS } from "@/api/vivoAigc";

// 位置信息选项
POS_OPTIONS.TEXT_ONLY; // 0: 只返回文字
POS_OPTIONS.TEXT_WITH_ABS_POS; // 1: 文字+绝对坐标
POS_OPTIONS.TEXT_WITH_REL_POS; // 2: 文字+相对坐标（推荐）

// 业务ID配置
BUSINESS_IDS.ADVANCED; // 支持旋转图像识别
BUSINESS_IDS.BASIC; // 只支持正向文字识别
```

## 错误处理

所有 API 调用都会抛出标准的错误对象：

```typescript
try {
  const result = await sdk.chat.chat("hello");
} catch (error) {
  if (error.code) {
    // Vivo AIGC API 错误
    console.log("API错误:", error.code, error.message);
  } else {
    // 网络或其他错误
    console.log("请求失败:", error.message);
  }
}
```

## 签名算法

SDK 基于官方文档实现了完整的 HMAC-SHA256 签名算法：

1. 生成 8 位随机字符串作为 nonce
2. 使用当前时间戳（秒）
3. 构建 canonical_query_string（URL参数排序+编码）
4. 构建 signed_headers_string
5. 生成 signing_string 并计算 HMAC-SHA256
6. Base64 编码得到最终签名

## 注意事项

1. **环境变量**：确保正确配置了 APP_ID 和 APP_KEY
2. **网络环境**：API 服务器地址为 `https://api-ai.vivo.com.cn`
3. **TTS限制**：WebSocket 功能在某些浏览器环境下可能受限
4. **绘画任务**：图像生成是异步任务，需要轮询或等待完成
5. **错误码**：参考官方文档了解具体的错误码含义
6. **频率限制**：注意 API 调用频率限制，避免触发限流

## 示例组件

参考 `src/components/VivoAigcDemo.tsx` 查看完整的使用示例。

## 更新日志

- **v1.0.0**: 基于官方文档实现完整的模块化 SDK
- 支持大模型对话（单轮/多轮）
- 支持AI绘画（文生图/图生图）
- 支持OCR文字识别
- 支持TTS语音合成
- 完整的TypeScript类型支持
- 标准的错误处理机制
