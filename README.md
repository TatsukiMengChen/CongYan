# 聪言（CongYan）

聪言是一款专为发音障碍用户（如脑瘫患者、声带受损患者、听力障碍康复者等）设计的医学 AI 辅助应用。项目致力于通过前沿智能技术，为用户提供普通话发音检测与评分、个性化康复训练、语音合成辅助交流等功能，助力提升发音能力和交流效率。

## 项目定位

- **目标用户**：发音障碍患者、康复医生、患者家属
- **应用场景**：医院、康复中心、家庭训练
- **核心价值**：科学、智能、个性化的发音康复辅助工具

## 功能模块

- **普通话检测评分**：实时检测用户普通话发音并专业评分
- **深度发音分析**：支持汉字声母韵母的详细分析与报告
- **历史记录追踪**：长期分析用户发音习惯和进步情况
- **个性化发音训练**：基于评估结果智能生成训练计划
- **语音合成（TTS）**：内置强大的文字转语音功能，辅助日常交流
- **医学康复指导**：结合医学知识库，提供初步诊断建议和康复方向
- **多角色支持**：医生、患者、家属多端协作

## 技术架构

- **前端**：Tauri + React 18 + TypeScript + Zustand + UnoCSS + Ant Design + MUI
- **后端**：Rust（Tauri Shell）+ 独立业务后端（[congyan_backend](https://github.com/jcmz19/congyan_backend/)）
- **API 通信**：Axios 封装，支持 JWT 鉴权
- **状态管理**：Zustand 按业务模块拆分 Store
- **样式方案**：UnoCSS 原子化 + MUI/Antd 主题，支持暗黑/明亮模式
- **开发规范**：详见 `docs/development-standards.md`，涵盖命名、组件、AI 接入等

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- Rust 及 Tauri 依赖
- Git

### 安装与运行

```bash
git clone <repository-url>
cd cong-yan
pnpm install
pnpm tauri dev
```

更多开发与部署细节请参考 `docs/01_入门指南.md` 和 `docs/05_部署与构建.md`。

## 目录结构

- `src/` 前端源代码（React + TS）
- `src-tauri/` 后端与 Tauri 配置（Rust）
- `public/` 静态资源
- `docs/` 开发与功能文档

## 贡献与规范

- 遵循统一的代码风格和组件开发规范
- AI 功能开发请参考 `docs/ai-development-prompt.md`
- 详细开发标准见 `docs/development-standards.md`

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/)
  - [Tauri 插件](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [UnoCSS](https://marketplace.visualstudio.com/items?itemName=unocss.unocss)

---

如需更详细的功能说明、API 设计、UI 规范等，请查阅 `docs/` 目录下的相关文档。
