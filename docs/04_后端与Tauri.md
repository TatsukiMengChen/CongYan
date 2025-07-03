# 04. 后端与 Tauri

本文档旨在阐述聪言项目 Tauri 后端的配置、原生能力以及与前端的通信机制。

## 1. 架构概述

聪言项目的后端架构可以分为两个部分：

1.  **Tauri 后端 (`src-tauri/`)**: 使用 Rust 编写，作为应用的"外壳"。它负责创建原生窗口、提供一些基础的原生能力，并将前端（React SPA）渲染在 WebView 中。
2.  **核心业务后端**: 一个独立的、基于 HTTP 和 WebSocket 的远程服务器。所有核心业务逻辑，如用户认证、数据存储、AI 聊天和语音评估，都在这个远程后端上处理。前端通过 `src/api` 和 `src/utils` 中的模块直接与其通信。

这种架构使得 Tauri 后端非常"轻量"，其主要职责是作为 Web 前端的容器，并按需提供原生功能。

## 2. Tauri 配置 (`tauri.conf.json`)

配置文件位于 `src-tauri/tauri.conf.json`，定义了应用的基本属性：

- `build`: 配置了开发 (`pnpm dev`) 和构建 (`pnpm build`) 前端的相关命令。
- `windows`: 定义了主窗口的默认标题 (`聪言`) 和尺寸 (`360x800`)。
- `bundle`: 配置了应用打包的相关信息，如应用标识符 (`com.congyan.app`) 和图标。

## 3. 原生能力与权限 (`capabilities/`)

在 Tauri v2 中，前端访问原生 API 的权限由 `capabilities` 文件管理。本项目的权限定义在 `src-tauri/capabilities/default.json` 中。

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default", "opener:default"]
}
```

- `"core:default"`: 授予了一组被认为是安全的核心 API 权限。
- `"opener:default"`: **核心权限**。这授予了前端使用 `tauri-plugin-opener` 插件的权限。该插件允许前端请求在用户的系统默认浏览器中打开一个外部 URL。

在前端，可以通过 `@tauri-apps/api/shell` 或 `@tauri-apps/plugin-opener` 模块来调用此功能，例如打开轮播图中的外部链接。

```typescript
// 前端调用示例
import { open } from "@tauri-apps/plugin-opener";

await open("https://example.com");
```

## 4. Rust 后端与 Commands (`src/lib.rs`)

Rust 后端的入口逻辑位于 `src-tauri/src/lib.rs`。

### 4.1. Command 定义

项目中只定义了一个示例性的 Command：

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
```

- `#[tauri::command]` 宏将一个普通的 Rust 函数标记为可被前端调用的 Command。
- 这个 `greet` 函数接收一个字符串参数 `name`，并返回一个新的字符串。

### 4.2. 应用构建与初始化

在 `run()` 函数中，通过 `tauri::Builder` 构建应用实例：

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init()) // 1. 初始化 Opener 插件
        .invoke_handler(tauri::generate_handler![greet]) // 2. 注册 greet Command
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

1.  **插件初始化**: `tauri_plugin_opener::init()` 显式地初始化了 Opener 插件，使其可用。
2.  **Command 注册**: `invoke_handler` 和 `generate_handler!` 宏将 `greet` 函数注册到 Tauri 的运行时中。**只有在这里注册的 Command 才能被前端调用**。

从目前的代码来看，`greet` Command 似乎并未在前端业务逻辑中被实际使用。这进一步表明，当前项目主要依赖 HTTP/WebSocket 与远程后端通信，而非通过 Tauri Command 执行本地 Rust 逻辑。
