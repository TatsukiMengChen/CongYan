# 聪言 - 儿童语音康复训练APP 开发规范

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [开发环境](#开发环境)
4. [项目结构](#项目结构)
5. [代码规范](#代码规范)
6. [组件开发规范](#组件开发规范)
7. [移动端适配规范](#移动端适配规范)
8. [图标使用规范](#图标使用规范)
9. [AI功能开发规范](#ai功能开发规范)
10. [文件命名规范](#文件命名规范)
11. [最佳实践](#最佳实践)

---

## 🎯 项目概述

**聪言**是一款专为儿童语音康复训练设计的移动应用程序，旨在帮助有语言障碍的儿童通过科学的训练方法提高语言能力。

### 核心功能模块

- **👤 用户认证系统**：支持医生、患者、家属三种角色
- **🏠 首页仪表板**：展示训练进度和个性化推荐
- **📚 语料管理**：支持手动录入、OCR识别、AI生成三种创建方式
- **🎯 训练模块**：个性化语音训练和发音矫正
- **📊 进度分析**：详细的训练数据分析和报告
- **💬 智能对话**：基于vivo AIGC的智能交互
- **👥 联系人管理**：医患沟通和家属协作

### 项目特色

- **🤖 AI智能化**：深度集成vivo AIGC服务
- **📱 移动端优先**：专为手机用户优化的界面设计
- **🎨 儿童友好**：符合儿童认知特点的UI/UX设计
- **🔒 隐私保护**：端侧处理，保护用户隐私
- **🌐 跨平台**：基于Tauri的桌面和移动端支持

---

## 🛠 技术栈

### 前端框架

- **React 18.3.1** - 现代React特性，支持并发模式
- **TypeScript 5.6.3** - 类型安全和代码智能提示
- **Vite 6.0.7** - 快速构建工具和开发服务器

### UI框架与样式

- **Ant Design 5.23.2** - 企业级UI组件库
- **Ant Design Mobile 5.38.1** - 移动端组件库
- **@iconify/react 6.0.0** - 统一图标解决方案（替代antd图标）
- **UnoCSS 65.4.2** - 原子化CSS框架
- **Sass 1.83.4** - CSS预处理器

### 状态管理与数据流

- **Zustand 5.0.3** - 轻量级状态管理
- **React Router 7.1.5** - 路由管理
- **Axios 1.7.9** - HTTP客户端

### 移动端与跨平台

- **Tauri 2.2.4** - 跨平台应用框架
- **Android Support** - 原生Android集成

### AI与多媒体

- **vivo AIGC SDK** - 70B大模型、OCR、TTS服务
- **WebRTC** - 实时音视频通信
- **Web Audio API** - 音频处理

### 开发工具

- **ESLint 9.18.0** - 代码质量检查
- **Prettier 3.4.2** - 代码格式化
- **pnpm** - 包管理器（必须使用）

---

## 💻 开发环境

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Rust** >= 1.70.0（Tauri依赖）
- **Android SDK**（移动端开发）

### 环境变量配置

```bash
# .env.local
VITE_VIVO_AIGC_API_KEY=your_api_key
VITE_VIVO_AIGC_BASE_URL=https://api.vivo.com/aigc
VITE_APP_ENV=development
```

### 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行Tauri桌面应用
pnpm tauri dev

# 构建Android应用
pnpm tauri android build
```

---

## 📁 项目结构

```
cong-yan/
├── src/
│   ├── api/                    # API服务层
│   │   ├── vivoAigc/          # vivo AIGC服务
│   │   ├── auth.ts            # 认证服务
│   │   ├── patients.ts        # 患者管理
│   │   └── ...
│   ├── components/            # 通用组件
│   │   ├── Icon.tsx           # 统一图标组件
│   │   ├── Navbar.tsx         # 导航栏
│   │   └── ...
│   ├── pages/                 # 页面组件
│   │   ├── auth/              # 认证页面
│   │   ├── home/              # 首页
│   │   ├── features/          # 功能页面
│   │   │   ├── corpus/        # 语料管理
│   │   │   ├── training/      # 训练模块
│   │   │   └── ...
│   │   └── ...
│   ├── hooks/                 # 自定义Hook
│   ├── store/                 # 状态管理
│   ├── utils/                 # 工具函数
│   ├── types/                 # TypeScript类型定义
│   └── ...
├── src-tauri/                 # Tauri后端
├── docs/                      # 文档
├── public/                    # 静态资源
└── ...
```

### 目录说明

- **api/**: 所有API调用封装，按功能模块分类
- **components/**: 可复用的通用组件
- **pages/**: 页面级组件，按路由结构组织
- **hooks/**: 自定义React Hook，封装业务逻辑
- **store/**: 全局状态管理
- **utils/**: 纯函数工具类
- **types/**: TypeScript类型定义文件

---

## 📝 代码规范

### TypeScript规范

#### 1. 类型定义

```typescript
// ✅ 正确：使用interface定义对象类型
interface User {
  id: string;
  name: string;
  role: "doctor" | "patient" | "relative";
  createdAt: Date;
}

// ✅ 正确：使用type定义联合类型
type UserRole = "doctor" | "patient" | "relative";

// ❌ 错误：使用any类型
const userData: any = {};
```

#### 2. 函数类型

```typescript
// ✅ 正确：明确的函数类型定义
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const fetchUserData = async (userId: string): Promise<ApiResponse<User>> => {
  // implementation
};

// ✅ 正确：使用泛型约束
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

#### 3. 组件Props类型

```typescript
// ✅ 正确：完整的Props类型定义
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  className = "",
}) => {
  // implementation
};
```

### 命名规范

#### 1. 变量和函数命名

```typescript
// ✅ 正确：使用驼峰命名法
const userProfile = {};
const handleUserLogin = () => {};

// ✅ 正确：布尔值使用is/has/can前缀
const isLoggedIn = true;
const hasPermission = false;
const canEdit = true;

// ✅ 正确：常量使用大写加下划线
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "https://api.example.com";
```

#### 2. 组件命名

```typescript
// ✅ 正确：组件使用PascalCase
const UserProfile = () => {};
const CorpusListItem = () => {};

// ✅ 正确：Hook使用use前缀
const useUserAuth = () => {};
const useCorpusData = () => {};
```

### 文件结构规范

#### 1. 导入顺序

```typescript
// 1. React相关
import React, { useState, useEffect } from "react";

// 2. 第三方库
import { Button, message } from "antd";
import axios from "axios";

// 3. 内部组件
import Icon from "../../../components/Icon";
import UserCard from "./UserCard";

// 4. 工具函数和类型
import { formatDate } from "../../../utils/formatters";
import { User } from "../../../types/user";

// 5. 样式文件
import "./index.scss";
```

#### 2. 组件内部结构

```typescript
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. 状态定义
  const [state, setState] = useState<StateType>({});

  // 2. 自定义Hook
  const { data, loading } = useCustomHook();

  // 3. 副作用
  useEffect(() => {
    // effect logic
  }, []);

  // 4. 事件处理函数
  const handleClick = useCallback(() => {
    // handler logic
  }, []);

  // 5. 渲染逻辑
  const renderContent = () => {
    // render logic
  };

  // 6. 主渲染
  return (
    <div>
      {renderContent()}
    </div>
  );
};
```

---

## 🧩 组件开发规范

### 组件分类

#### 1. 通用组件 (src/components/)

- **用途**: 项目内可复用的基础组件
- **特点**: 无业务逻辑，高度可配置
- **示例**: Icon, Button, Modal, Input

```typescript
// 示例：通用Icon组件
interface IconProps {
  name: keyof typeof ICON_MAP;
  size?: number | string;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  className,
  onClick,
}) => {
  // implementation
};
```

#### 2. 页面组件 (src/pages/)

- **用途**: 路由对应的页面级组件
- **特点**: 包含完整的页面逻辑和状态管理
- **命名**: 以页面功能命名，如 `CorpusManagement.tsx`

#### 3. 功能组件 (src/pages/features/)

- **用途**: 特定功能模块的组件
- **特点**: 包含业务逻辑，可能调用API
- **示例**: `AiCorpusGenerator.tsx`, `OcrInputSection.tsx`

### 组件设计原则

#### 1. 单一职责原则

```typescript
// ✅ 正确：组件职责单一
const SearchInput: React.FC<SearchInputProps> = ({ onSearch, placeholder }) => {
  return (
    <Input
      placeholder={placeholder}
      onChange={(e) => onSearch(e.target.value)}
      prefix={<Icon name="search" />}
    />
  );
};

// ❌ 错误：组件职责过多
const SearchAndFilterPanel = () => {
  // 包含搜索、筛选、排序、分页等多个功能
};
```

#### 2. 组件组合优于继承

```typescript
// ✅ 正确：使用组合
const CorpusCard: React.FC<CorpusCardProps> = ({ corpus, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader title={corpus.title} />
      <CardContent content={corpus.content} />
      <CardActions>
        <Button onClick={() => onEdit(corpus.id)}>编辑</Button>
        <Button onClick={() => onDelete(corpus.id)}>删除</Button>
      </CardActions>
    </Card>
  );
};
```

#### 3. Props设计规范

```typescript
// ✅ 正确：Props设计清晰
interface CorpusListProps {
  // 数据
  corpusList: Corpus[];
  loading?: boolean;
  error?: string;

  // 行为
  onItemClick?: (corpus: Corpus) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;

  // 配置
  showActions?: boolean;
  pageSize?: number;

  // 样式
  className?: string;
  style?: React.CSSProperties;
}
```

### 状态管理规范

#### 1. 本地状态 vs 全局状态

```typescript
// ✅ 本地状态：组件内部UI状态
const [isModalOpen, setIsModalOpen] = useState(false);
const [formData, setFormData] = useState<FormData>({});

// ✅ 全局状态：跨组件共享的业务状态
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

#### 2. 自定义Hook抽取业务逻辑

```typescript
// ✅ 正确：将复杂逻辑抽取为Hook
const useCorpusManagement = () => {
  const [corpusList, setCorpusList] = useState<Corpus[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCorpusList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await corpusApi.getList();
      setCorpusList(response.data);
    } catch (error) {
      message.error("获取语料列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    corpusList,
    loading,
    fetchCorpusList,
  };
};
```

---

## 📱 移动端适配规范

### 响应式设计原则

#### 1. 移动端优先策略

```scss
// ✅ 正确：移动端优先的CSS
.toolbar {
  // 移动端基础样式
  padding: 12px;
  flex-direction: column;
  gap: 12px;

  // 平板和桌面端适配
  @media (min-width: 768px) {
    padding: 16px;
    flex-direction: row;
    gap: 16px;
  }
}
```

#### 2. 断点设计

```scss
// 断点定义
$breakpoints: (
  xs: 0,
  // 手机竖屏
  sm: 576px,
  // 手机横屏
  md: 768px,
  // 平板
  lg: 992px,
  // 桌面
  xl: 1200px,
  // 大屏桌面
  xxl: 1600px, // 超大屏
);

// 使用示例
.container {
  width: 100%;

  @media (min-width: 576px) {
    max-width: 540px;
  }

  @media (min-width: 768px) {
    max-width: 720px;
  }
}
```

### 移动端UI组件规范

#### 1. 触摸友好设计

```typescript
// ✅ 正确：适合触摸的按钮设计
const MobileButton: React.FC<MobileButtonProps> = ({ children, onClick, size = 'medium' }) => {
  const sizeMap = {
    small: 'min-h-10 px-3 text-sm',
    medium: 'min-h-12 px-4 text-base',
    large: 'min-h-14 px-6 text-lg'
  };

  return (
    <button
      className={`${sizeMap[size]} rounded-lg active:scale-95 transition-transform`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### 2. 移动端表单优化

```typescript
// ✅ 正确：移动端友好的表单
const MobileForm: React.FC = () => {
  return (
    <form className="space-y-4 p-4">
      {/* 大标签，易于点击 */}
      <div className="space-y-2">
        <label className="block text-base font-medium text-gray-700">
          用户名
        </label>
        <Input
          size="large"
          placeholder="请输入用户名"
          className="h-12"
        />
      </div>

      {/* 堆叠布局，避免水平滚动 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button type="primary" size="large" block>
          登录
        </Button>
        <Button size="large" block>
          注册
        </Button>
      </div>
    </form>
  );
};
```

#### 3. 列表和卡片优化

```typescript
// ✅ 正确：移动端优化的列表项
const MobileListItem: React.FC<ListItemProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm mb-3">
      {/* 移动端垂直布局 */}
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 flex-1">
            {item.title}
          </h3>
          <Dropdown
            menu={{
              items: [
                { key: 'edit', label: '编辑', icon: <Icon name="edit" /> },
                { key: 'delete', label: '删除', icon: <Icon name="delete" /> }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<Icon name="more" />} />
          </Dropdown>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {item.content}
        </p>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{item.category}</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
```

### 移动端布局策略

#### 1. 堆叠布局优先

```tsx
// ✅ 正确：移动端堆叠布局
const MobileLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 固定头部 */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">语料管理</h1>
          <Button type="primary" size="middle">
            创建
          </Button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="p-4 pb-20">
        {/* 搜索和筛选 */}
        <div className="space-y-3 mb-4">
          <Input.Search
            placeholder="搜索语料"
            size="large"
            className="w-full"
          />
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.key}
                size="small"
                type={selectedCategory === category.key ? "primary" : "default"}
                className="whitespace-nowrap"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 内容列表 */}
        <div className="space-y-3">{/* 列表项 */}</div>
      </main>

      {/* 底部安全区 */}
      <div className="h-16 sm:h-0" />
    </div>
  );
};
```

#### 2. 安全区域适配

```scss
// 安全区域适配
.safe-area-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

// 底部导航栏适配
.bottom-nav {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
```

---

## 🎨 图标使用规范

### 图标选择原则

#### 1. 使用统一的Icon组件

```typescript
// ✅ 正确：使用统一的Icon组件
import Icon from '../../../components/Icon';

const MyComponent = () => {
  return (
    <div>
      <Icon name="plus" size={20} color="#1890ff" />
      <Icon name="edit" size={16} />
      <Icon name="delete" size={16} color="#ff4d4f" />
    </div>
  );
};

// ❌ 错误：直接使用Antd图标
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
```

#### 2. 图标大小规范

```typescript
// 图标大小标准
const ICON_SIZES = {
  xs: 12,    // 小标签、状态指示
  sm: 16,    // 按钮、表单元素
  md: 20,    // 导航、菜单
  lg: 24,    // 标题、重要按钮
  xl: 32,    // 大图标、插画
  xxl: 48    // 占位符、空状态
};

// 使用示例
<Icon name="search" size={ICON_SIZES.sm} />
<Icon name="user" size={ICON_SIZES.md} />
```

#### 3. 图标色彩规范

```typescript
// 图标颜色规范
const ICON_COLORS = {
  primary: '#1890ff',     // 主要操作
  success: '#52c41a',     // 成功状态
  warning: '#faad14',     // 警告状态
  error: '#ff4d4f',       // 错误状态
  info: '#1890ff',        // 信息提示
  disabled: '#d9d9d9',    // 禁用状态
  text: '#262626',        // 文本色
  textSecondary: '#8c8c8c' // 次要文本
};

// 使用示例
<Icon name="check" color={ICON_COLORS.success} />
<Icon name="warning" color={ICON_COLORS.warning} />
<Icon name="close" color={ICON_COLORS.error} />
```

### 图标映射表

#### 1. 基础操作图标

```typescript
const BASIC_ICONS = {
  plus: "material-symbols:add-rounded", // 添加
  edit: "material-symbols:edit-rounded", // 编辑
  delete: "material-symbols:delete-rounded", // 删除
  save: "material-symbols:save-rounded", // 保存
  close: "material-symbols:close-rounded", // 关闭
  check: "material-symbols:check-rounded", // 确认
  copy: "material-symbols:content-copy-rounded", // 复制
};
```

#### 2. 导航图标

```typescript
const NAVIGATION_ICONS = {
  "arrow-left": "material-symbols:arrow-back-ios-rounded",
  "arrow-right": "material-symbols:arrow-forward-ios-rounded",
  "arrow-up": "material-symbols:keyboard-arrow-up-rounded",
  "arrow-down": "material-symbols:keyboard-arrow-down-rounded",
  back: "material-symbols:arrow-back-rounded",
  more: "material-symbols:more-horiz-rounded",
  menu: "material-symbols:menu-rounded",
};
```

#### 3. 功能图标

```typescript
const FUNCTION_ICONS = {
  search: "material-symbols:search-rounded",
  filter: "material-symbols:filter-list-rounded",
  upload: "material-symbols:cloud-upload-rounded",
  download: "material-symbols:cloud-download-rounded",
  scan: "material-symbols:qr-code-scanner-rounded",
  camera: "material-symbols:photo-camera-rounded",
  eye: "material-symbols:visibility-rounded",
  "eye-off": "material-symbols:visibility-off-rounded",
};
```

#### 4. AI相关图标

```typescript
const AI_ICONS = {
  robot: "material-symbols:smart-toy-rounded",
  ai: "material-symbols:psychology-rounded",
  "auto-fix": "material-symbols:auto-fix-high-rounded",
  magic: "material-symbols:auto-awesome-rounded",
  format: "material-symbols:format-align-left-rounded",
};
```

### 图标使用最佳实践

#### 1. 语义化使用

```typescript
// ✅ 正确：图标语义明确
<Button icon={<Icon name="plus" />}>添加语料</Button>
<Button icon={<Icon name="edit" />}>编辑</Button>
<Button icon={<Icon name="delete" />} danger>删除</Button>

// ❌ 错误：图标语义不明确
<Button icon={<Icon name="star" />}>删除</Button>
```

#### 2. 一致性原则

```typescript
// ✅ 正确：同类操作使用相同图标
const ActionButtons = () => {
  return (
    <div className="flex gap-2">
      <Button icon={<Icon name="edit" size={16} />} />
      <Button icon={<Icon name="delete" size={16} />} />
      <Button icon={<Icon name="copy" size={16} />} />
    </div>
  );
};
```

#### 3. 辅助功能支持

```typescript
// ✅ 正确：提供辅助功能支持
const IconButton: React.FC<IconButtonProps> = ({
  iconName,
  ariaLabel,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="p-2 rounded-lg hover:bg-gray-100"
    >
      <Icon name={iconName} size={20} />
    </button>
  );
};

// 使用示例
<IconButton iconName="edit" ariaLabel="编辑语料" onClick={handleEdit} />
```

---

## 🤖 AI功能开发规范

### vivo AIGC服务集成

#### 1. 统一SDK使用

```typescript
// 使用统一的SDK实例
import { vivoAigcSDK } from "../../../api/vivoAigc";

// ✅ 正确：通过Hook封装AI服务
const useAiServices = () => {
  const formatText = async (text: string, options: FormatOptions) => {
    return await vivoAigcSDK.chat.completions({
      model: "vivo-70b",
      messages: [{ role: "user", content: `请格式化以下文本：${text}` }],
    });
  };

  return { formatText };
};
```

#### 2. 错误处理规范

```typescript
// ✅ 统一的错误处理
const handleAiError = (error: any) => {
  const errorMessages = {
    rate_limit: "请求过于频繁，请稍后再试",
    quota_exceeded: "AI服务配额不足",
    network_error: "网络连接异常",
    default: "AI服务暂时不可用",
  };

  const message = errorMessages[error.code] || errorMessages.default;
  notification.error({ message });
};
```

### AI功能设计原则

#### 1. 渐进式增强

- 提供非AI的基础功能作为fallback
- AI功能作为增强体验的辅助工具
- 用户可以选择是否使用AI功能

#### 2. 用户控制

- 提供AI结果的编辑能力
- 支持重新生成和调整参数
- 明确标识AI生成的内容

---

## 📋 文件命名规范

### 组件文件命名

```
✅ 正确：
- UserProfile.tsx
- CorpusListItem.tsx
- AiCorpusGenerator.tsx

❌ 错误：
- userProfile.tsx
- corpus-list-item.tsx
- ai_corpus_generator.tsx
```

### Hook文件命名

```
✅ 正确：
- useUserAuth.ts
- useCorpusData.ts
- useAiServices.ts

❌ 错误：
- UserAuth.ts
- corpus-data.ts
- ai_services.ts
```

### 样式文件命名

```
✅ 正确：
- index.module.scss
- UserProfile.module.scss
- corpus-list.scss

❌ 错误：
- Index.scss
- userProfile.scss
- CORPUS_LIST.scss
```

---

## 💡 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用React.memo避免不必要的重渲染
const CorpusItem = React.memo<CorpusItemProps>(({ corpus, onEdit }) => {
  return <div>{corpus.title}</div>;
});

// ✅ 使用useCallback稳定回调函数
const handleEdit = useCallback((id: string) => {
  // edit logic
}, []);
```

### 2. 错误边界

```typescript
// ✅ 为AI功能添加错误边界
const AiFeatureWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<div>AI功能暂不可用</div>}>
      {children}
    </ErrorBoundary>
  );
};
```

### 3. 用户体验

```typescript
// ✅ 提供合适的加载状态
const AiGenerateButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      loading={loading}
      onClick={handleGenerate}
      icon={<Icon name="ai" />}
    >
      {loading ? '生成中...' : 'AI生成'}
    </Button>
  );
};
```

### 4. 移动端优化

```typescript
// ✅ 移动端友好的布局
const MobileOptimizedComponent: React.FC = () => {
  return (
    <div className="p-4">
      {/* 垂直堆叠布局 */}
      <div className="space-y-3">
        <Input.Search size="large" placeholder="搜索" />
        <Button type="primary" size="large" block>
          创建语料
        </Button>
      </div>
    </div>
  );
};
```

---

## 🚀 开发流程

### 1. 开发前准备

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
```

### 2. 开发规范检查

```bash
# 代码格式化
pnpm format

# 代码质量检查
pnpm lint

# 类型检查
pnpm type-check
```

### 3. 提交规范

```bash
# 提交格式
git commit -m "feat: 添加AI语料生成功能"
git commit -m "fix: 修复移动端布局问题"
git commit -m "docs: 更新开发规范文档"
```

---

## 📚 核心原则总结

### 🎯 开发原则

1. **移动端优先** - 所有功能都要考虑移动端体验
2. **AI智能增强** - 用AI提升用户体验，但不依赖AI
3. **类型安全** - 严格的TypeScript类型检查
4. **组件化** - 职责单一，高度可复用
5. **用户友好** - 简洁直观的界面设计

### 🔧 技术标准

- **包管理**: 必须使用pnpm
- **图标**: 统一使用Iconify替代Antd图标
- **状态管理**: 使用Zustand进行全局状态管理
- **样式**: UnoCSS + Tailwind CSS优先
- **AI服务**: 统一通过vivo AIGC SDK

### 📱 移动端要求

- 响应式设计，移动端优先
- 触摸友好的交互设计
- 合适的字体和按钮大小
- 堆叠布局避免横向滚动

---

_遵循本规范，确保代码质量和用户体验的一致性。_
