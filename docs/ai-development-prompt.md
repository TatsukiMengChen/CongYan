# AI开发规范Prompt - 聪言康复训练应用

## 项目定位

**聪言**是专为发音障碍用户（脑瘫患者、声带受损者、听力障碍康复者等）设计的医学AI辅助应用，用于普通话发音检测、评分和康复训练指导。

## 用户群体

- **主要用户**：发音障碍患者（成人为主）
- **专业用户**：言语康复医生、治疗师
- **辅助用户**：患者家属
- **使用场景**：医院、康复中心、家庭训练

## 技术栈要求

- React 18 + TypeScript，严格类型检查
- 必须使用pnpm包管理器
- 使用Iconify图标，禁用Antd图标
- UnoCSS + Tailwind CSS优先
- 移动端优先设计

## 语料管理功能定位

- **发音训练语料**：标准普通话训练材料
- **康复导向**：专业医学康复训练内容
- **训练分类**：pronunciation(发音)、rhythm(节奏)、articulation(构音)、comprehensive(综合)
- **难度分级**：basic、intermediate、advanced

## AI功能开发规范

- 使用vivoAigcSDK统一实例
- AI提示词面向**康复训练**，非儿童教育
- 内容要求：专业性、标准性、康复指导性
- 语料生成：适合发音障碍康复训练使用

## 移动端适配

- 堆叠布局，避免横向滚动
- 按钮最小高度48px，适合患者操作
- 大字体、高对比度，考虑视听障碍用户
- 语音反馈支持

## 图标使用

- 统一使用`<Icon name="iconName" size={16} />`
- 常用图标：mic, volume, ai, edit, delete, search
- 禁用antd图标：`import { XxxOutlined } from '@ant-design/icons'`

## 组件开发规范

- 组件命名：PascalCase（UserProfile.tsx）
- Hook命名：useXxx（useUserAuth.ts）
- 职责单一，高度可复用
- Props类型完整定义，避免any类型

## 布局模式

```tsx
// 移动端康复训练布局
<div className="p-4">
  <div className="space-y-3">
    <Input.Search size="large" placeholder="搜索训练语料" />
    <Button type="primary" size="large" block>
      开始康复训练
    </Button>
  </div>
</div>
```

## 关键开发原则

1. **医学专业性** - 内容符合康复医学标准
2. **无障碍设计** - 考虑发音障碍用户特殊需求
3. **移动端优先** - 便携康复训练设备
4. **AI智能辅助** - 精准发音分析和个性化训练
5. **科研导向** - 支持康复数据收集和分析

## 开发禁忌

- ❌ 避免儿童化设计和用词
- ❌ 避免娱乐化内容生成
- ❌ 避免非专业医学建议
- ❌ 避免复杂的操作流程
