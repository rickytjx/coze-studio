# 数据层 (Data Layer)

数据层是 Coze Studio 的数据管理核心，负责知识库、数据库和变量系统的管理。该层采用模块化架构，基于 React 18 + TypeScript 构建，使用 Zustand 进行状态管理，并深度集成 Tiptap 富文本编辑器。

## 1. 概览

| 属性 | 值 |
|------|-----|
| 包数量 | 23 个包（统计口径：`frontend/packages/data/**/package.json` 文件数量） |
| 命名空间 | `@coze-data/*` |
| 核心技术 | React 18, TypeScript, Zustand, Tiptap |
| 目录结构 | 按领域划分：`common/`, `knowledge/`, `memory/` |

### 1.1 目录结构

```
frontend/packages/data/
├── common/                 # 通用工具和服务 (4 个包)
│   ├── utils/             # 数据工具库
│   ├── feature-register/  # 特性注册器
│   ├── reporter/          # 错误报告服务
│   └── e2e/               # 端到端测试工具
├── knowledge/             # 知识库系统 (12 个包)
│   ├── common/            # 知识库通用模块
│   │   ├── components/    # UI 组件
│   │   ├── hooks/         # React Hooks
│   │   ├── services/      # 业务服务
│   │   └── stores/        # 状态管理
│   ├── knowledge-ide-base/           # IDE 基础组件
│   ├── knowledge-ide-adapter/        # IDE 适配器
│   ├── knowledge-modal-base/         # 模态框基础
│   ├── knowledge-modal-adapter/      # 模态框适配器
│   ├── knowledge-resource-processor-core/   # 资源处理核心
│   ├── knowledge-resource-processor-base/   # 资源处理基础
│   ├── knowledge-resource-processor-adapter/ # 资源处理适配器
│   └── knowledge-data-set-for-agent/ # Agent 数据集
└── memory/                # 内存数据系统 (7 个包)
    ├── database/          # 数据库调试 (v1)
    ├── database-creator/  # 数据库创建器
    ├── database-v2-base/  # 数据库 v2 基础
    ├── database-v2-main/  # 数据库 v2 主实现
    ├── database-v2-adapter/ # 数据库 v2 适配器
    ├── variables/         # 变量管理
    └── llm-plugins/       # LLM 插件
```

## 2. 通用数据包 (Common)

### 2.1 @coze-data/utils

**路径**: `frontend/packages/data/common/utils/`

核心数据工具库，提供数据类型选择、表单组件和模态框 hooks。

**主要依赖** (来源：`frontend/packages/data/common/utils/package.json:22-36`):
- `@coze-arch/bot-api` - API 接口
- `@coze-arch/bot-error` - 错误处理
- `@coze-arch/i18n` - 国际化
- `@douyinfe/semi-ui` - Semi UI 组件
- `zustand@^4.4.7` - 状态管理

### 2.2 @coze-data/feature-register

**路径**: `frontend/packages/data/common/feature-register/`

动态特性注册管理器，支持运行时特性注册和扩展。

### 2.3 @coze-data/reporter

**路径**: `frontend/packages/data/common/reporter/`

错误报告和数据监控服务，提供错误边界和数据上报功能。

## 3. 知识库系统 (Knowledge)

### 3.1 知识库通用层

#### 3.1.1 @coze-data/knowledge-common-components

**路径**: `frontend/packages/data/knowledge/common/components/`

知识库 UI 组件库，包含：
- `FilePicker` - 文件选择器
- `TextKnowledgeEditor` - 文本知识编辑器（基于 Tiptap）
- `SegmentMenu` - 段落菜单
- 文档预览组件

#### 3.1.2 @coze-data/knowledge-common-hooks

**路径**: `frontend/packages/data/knowledge/common/hooks/`

知识库专用 React Hooks：
- `useKnowledgeNavigate` - 知识库导航
- `useGetKnowledgeListInfo` - 获取知识库列表信息
- `useTosContent` - TOS 内容获取

#### 3.1.3 @coze-data/knowledge-common-services

**路径**: `frontend/packages/data/knowledge/common/services/`

业务服务层：
- `getKnowledgeIDEQuery` - IDE 查询服务
- `getKnowledgeIsFullModeByBiz` - 全模式检测

#### 3.1.4 @coze-data/knowledge-stores

**路径**: `frontend/packages/data/knowledge/common/stores/`

Zustand 状态管理，采用 Slice 模式。

**导出内容** (摘录自 `frontend/packages/data/knowledge/common/stores/src/index.ts:17-50`):
```typescript
export {
  useDataCallbacks,
  useDataNavigate,
  useKnowledgeParams,
  useKnowledgeParamsStore,
  useKnowledgeStore,
  useProcessingStore,
} from './hooks';

export {
  KnowledgeParamsStoreContext,
  KnowledgeParamsStoreProvider,
  type WidgetUIState,
  type PluginNavType,
} from './context';

export { type IParams as IKnowledgeParams } from './params-store';
export { FilterPhotoType } from './knowledge-preview';

export {
  getDefaultLevelSegmentsState,
  createLevelSegmentsSlice,
  ILevelSegmentsSlice,
  ILevelSegment,
  IImageDetail,
  ITableDetail,
} from './level-segments-slice';

export {
  getDefaultStorageStrategyState,
  createStorageStrategySlice,
  IStorageStrategySlice,
} from './storage-strategy-slice';
```

**Slice 模式示例**:
- `createLevelSegmentsSlice` - 知识库段落状态切片
- `createStorageStrategySlice` - 存储策略状态切片

### 3.2 知识库 IDE

#### 3.2.1 @coze-data/knowledge-ide-base

**路径**: `frontend/packages/data/knowledge/knowledge-ide-base/`

知识库 IDE 基础组件，是知识库编辑的核心入口。

**导出内容** (摘录自 `frontend/packages/data/knowledge/knowledge-ide-base/src/index.tsx:17-19`):
```typescript
export { ActionType } from './types';
export { useGetKnowledgeType } from './hooks/use-case/use-get-knowledge-type';
export { useReloadKnowledgeIDE } from './hooks/use-case/use-reload-knowledge-ide';
```

**模块导出** (摘录自 `frontend/packages/data/knowledge/knowledge-ide-base/package.json:8-17`):
```json
{
  "exports": {
    ".": "./src/index.tsx",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts",
    "./components/*": "./src/components/*/index.tsx",
    "./features/*": "./src/features/*/index.tsx",
    "./hooks/*": "./src/hooks/*/index.ts",
    "./layout": "./src/layout/index.tsx",
    "./layout/*": "./src/layout/*/index.tsx",
    "./context/*": "./src/context/*/index.tsx"
  }
}
```

**核心功能**:
- 工作区：文本/表格/图片知识库工作区
- 导航栏：支持 Agent IDE/Library/Project/Workflow 等业务场景
- 导入源菜单：多种数据导入方式
- 配置菜单：知识库配置

**主要依赖** (来源：`frontend/packages/data/knowledge/knowledge-ide-base/package.json:54-98`):
- 知识库内部依赖：`@coze-data/knowledge-common-*`, `@coze-data/knowledge-modal-*`, `@coze-data/knowledge-resource-processor-*`
- 架构层依赖：`@coze-arch/bot-api`, `@coze-arch/bot-hooks`, `@coze-arch/i18n`
- 外部依赖：`zustand@^4.4.7`, `immer@^10.0.3`, `dompurify@3.0.8`

#### 3.2.2 @coze-data/knowledge-ide-adapter

**路径**: `frontend/packages/data/knowledge/knowledge-ide-adapter/`

知识库 IDE 适配器，支持不同业务场景的 IDE 适配：
- Agent IDE 场景
- Library 场景
- Project 场景
- Workflow 场景

### 3.3 知识库模态框

#### @coze-data/knowledge-modal-base & @coze-data/knowledge-modal-adapter

提供知识库创建/编辑模态框的基础实现和场景适配。

### 3.4 知识库资源处理器

资源处理器采用三层架构：

| 层级 | 包名 | 职责 |
|------|------|------|
| Core | `knowledge-resource-processor-core` | 核心框架：上传状态管理、配置协议、进度跟踪 |
| Base | `knowledge-resource-processor-base` | 基础实现：资源处理基类 |
| Adapter | `knowledge-resource-processor-adapter` | 适配器：不同资源类型的处理器 |

## 4. 内存数据系统 (Memory)

### 4.1 数据库模块

#### 4.1.1 @coze-data/database (v1)

**路径**: `frontend/packages/data/memory/database/`

数据库调试组件，提供数据库和变量的调试功能。

**导出内容** (摘录自 `frontend/packages/data/memory/database/src/index.ts:17-30`):
```typescript
export { useMemoryDebugModal } from './components/memory-debug-modal';
export { VariableDebug } from './components/variable-debug';
export { DatabaseDebug } from './components/database-debug';
export { MemoryDebugDropdown } from './components/memory-debug-dropdown';
export { MemoryModule, MemoryDebugDropdownMenuItem } from './types';
export { useSendTeaEventForMemoryDebug } from './hooks/use-send-tea-event-for-memory-debug';
export { default as MultiDataTable } from './components/database-debug/multi-table';
export { type DataTableRef } from './components/database-debug/table';
export { type UseBotStore } from './components/filebox-list/types';
```

**模块导出** (摘录自 `frontend/packages/data/memory/database/package.json:8-12`):
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./filebox-list": "./src/components/filebox-list/index.tsx",
    "./multi-table": "./src/components/database-debug/multi-table.tsx",
    "./table": "./src/components/database-debug/table/index.tsx"
  }
}
```

#### 4.1.2 @coze-data/database-creator

**路径**: `frontend/packages/data/memory/database-creator/`

数据库创建向导，支持从 Excel 导入创建数据库，包含多步骤向导和表结构配置。

#### 4.1.3 数据库 v2 (database-v2-*)

数据库 v2 采用三层架构：

| 层级 | 包名 | 职责 |
|------|------|------|
| Base | `database-v2-base` | 基础组件：模态框、表结构、字段类型定义 |
| Main | `database-v2-main` | 主实现：数据库详情、表数据视图、批量导入 |
| Adapter | `database-v2-adapter` | 适配器：不同上下文的数据库适配 |

### 4.2 变量管理

#### @coze-data/variables

**路径**: `frontend/packages/data/memory/variables/`

变量管理系统，提供变量树编辑、JSON 导入/导出、配置和测试数据管理。

**核心功能**:
- 变量树编辑器
- JSON 导入/导出
- 变量配置
- 测试数据管理

### 4.3 LLM 插件

#### @coze-data/llm-plugins

**路径**: `frontend/packages/data/memory/llm-plugins/`

LLM 插件模块，提供知识库切片召回等 LLM 相关插件功能。

## 5. 数据模式

### 5.1 DTO 定义模式

数据层的 DTO 定义位于各包的 `src/types/` 或 `src/*/types.ts` 目录。以下为已验证的示例：
- `frontend/packages/data/knowledge/common/stores/src/level-segments-slice.ts` - 知识库段落 DTO
- `frontend/packages/data/memory/database-v2-main/src/components/database-table-data/type.ts` - 表数据 DTO
- `frontend/packages/data/memory/variables/src/types/view-variable-tree.ts` - 变量树 DTO

### 5.2 API 服务模式

数据层的 API 服务位于各包的 `src/service/` 或 `src/*/service/` 目录，使用 `@coze-arch/bot-api` 进行 API 调用。以下为已验证的示例：
- `frontend/packages/data/knowledge/knowledge-ide-base/src/service/` - 数据集/文档/切片服务
- `frontend/packages/data/memory/database-v2-main/src/hooks/use-get-table-data.ts` - 表数据获取

### 5.3 数据转换工具模式

数据层的数据转换工具位于各包的 `src/utils/` 目录，提供 VO ↔ DTO 映射的纯函数转换。以下为已验证的示例：
- `frontend/packages/data/memory/variables/src/store/variable-groups/transform/` - VO/DTO 转换
- `frontend/packages/data/knowledge/common/components/src/text-knowledge-editor/utils/` - HTML 转义、上传工具

### 5.4 状态管理模式 (Zustand Slice)

数据层采用 Zustand 的 Slice 模式进行状态管理，支持状态切片组合。

**(示例代码)**
```typescript
// 示例：创建状态切片
export const createLevelSegmentsSlice = (set, get) => ({
  segments: [],
  addSegment: (segment) => set((state) => ({
    segments: [...state.segments, segment]
  })),
  // ...
});

// 组合多个切片
const useKnowledgeStore = create(
  (...a) => ({
    ...createLevelSegmentsSlice(...a),
    ...createStorageStrategySlice(...a),
  })
);
```

### 5.5 React Hooks 模式

Hooks 按职责分类：

| 目录 | 职责 |
|------|------|
| `hooks/use-case/` | 业务逻辑 hooks |
| `hooks/life-cycle/` | 初始化/销毁 hooks |
| `hooks/inner/` | 内部辅助 hooks |

### 5.6 特性注册模式

支持动态注册和扩展的特性系统。

**已验证的示例**:
- `frontend/packages/data/knowledge/knowledge-ide-base/src/features/import-knowledge-sources/menu/` - 菜单项注册
- `frontend/packages/data/knowledge/common/components/src/text-knowledge-editor/features/editor-actions/` - 编辑器动作注册

## 6. 依赖关系

### 6.1 层级依赖图

```
数据层 (@coze-data/*)
    │
    ├──► 架构基础设施层 (@coze-arch/*)
    │    ├── bot-api          # API 接口
    │    ├── bot-error        # 错误处理
    │    ├── bot-hooks        # 通用 Hooks
    │    ├── bot-semi         # Semi Design 封装
    │    ├── coze-design      # Coze 设计系统
    │    ├── i18n             # 国际化
    │    └── report-events    # 事件上报
    │
    ├──► 通用组件层 (@coze-common/*)
    │    ├── virtual-list     # 虚拟列表 (frontend/packages/data/knowledge/common/components/package.json:42)
    │    ├── chat-area-utils  # 聊天区域工具 (frontend/packages/data/knowledge/knowledge-ide-base/package.json:70)
    │    └── table-view       # 表格视图 (frontend/packages/data/memory/database-v2-main/package.json:27)
    │
    ├──► 基础服务层 (@coze-foundation/*)
    │    └── local-storage    # 本地存储 (frontend/packages/data/knowledge/knowledge-ide-base/package.json:84)
    │
    └──► Studio核心业务层 (@coze-studio/*)
         ├── components       # Studio 组件
         ├── bot-detail-store # Bot 详情存储
         └── user-store       # 用户存储
```

### 6.2 内部依赖关系

```
底层 (Base Layer)
├── @coze-data/utils
├── @coze-data/feature-register
├── @coze-data/reporter
└── @coze-data/knowledge-resource-processor-core

中层 (Middle Layer)
├── @coze-data/knowledge-common-* (components/hooks/services/stores)
├── @coze-data/knowledge-resource-processor-base
├── @coze-data/database-v2-base
└── @coze-data/database

上层 (Top Layer)
├── @coze-data/knowledge-ide-base
├── @coze-data/knowledge-ide-adapter
├── @coze-data/knowledge-modal-base
├── @coze-data/knowledge-modal-adapter
├── @coze-data/database-v2-main
├── @coze-data/database-v2-adapter
├── @coze-data/variables
└── @coze-data/llm-plugins
```

### 6.3 关键外部依赖

| 依赖 | 版本 | 用途 | 来源 |
|------|------|------|------|
| `zustand` | ^4.4.7 | 状态管理 | `frontend/packages/data/knowledge/knowledge-ide-base/package.json:98` |
| `immer` | ^10.0.3 | 不可变数据 | `frontend/packages/data/knowledge/knowledge-ide-base/package.json:93` |
| `@tiptap/core` | ^2.12.0 | 富文本编辑器 | `frontend/packages/data/knowledge/common/components/package.json:47` |
| `react-pdf` | 9.1.1 | PDF 预览 | `frontend/packages/data/knowledge/common/components/package.json:64` |
| `react-arborist` | ^3.4.0 | 树形组件 | `frontend/packages/data/knowledge/common/components/package.json:63` |
| `@dnd-kit/core` | ^6.0.8 | 拖拽排序 | `frontend/packages/data/memory/database-v2-main/package.json:39` |
| `dompurify` | 3.0.8 | HTML 清洗 | `frontend/packages/data/knowledge/common/components/package.json:59` |
| `dayjs` | ^1.11.7 | 日期处理 | `frontend/packages/data/memory/database-v2-main/package.json:49` |

## 7. 数据流

### 7.1 知识库编辑流程

```
用户操作
    │
    ▼
knowledge-ide-base 组件
    │
    ▼
knowledge-common-hooks (业务逻辑)
    │
    ▼
knowledge-stores (Zustand 状态)
    │
    ▼
@coze-data/knowledge-ide-base 服务层 (API 调用)
    │
    ▼
knowledge-resource-processor-* (资源处理)
    │
    ▼
更新 UI
```

### 7.2 数据库操作流程

```
用户交互
    │
    ▼
database-v2-main 组件
    │
    ▼
本地 hooks 或 database-v2-base 状态
    │
    ▼
@coze-data/database-v2-base 工具层 (数据验证)
    │
    ▼
@coze-arch/bot-api (API 调用)
    │
    ▼
表格/模态框组件 (结果展示)
```

## 8. 开发指南

### 8.1 添加新的知识库功能

**(示例代码)**

1. **在 knowledge-common-components 添加 UI 组件**:
   ```typescript
   // src/components/my-component/index.tsx
   export const MyComponent: React.FC<Props> = (props) => {
     return <div>...</div>;
   };
   ```

2. **在 knowledge-common-hooks 添加业务逻辑**:
   ```typescript
   // src/hooks/use-my-feature.ts
   export const useMyFeature = () => {
     const store = useKnowledgeStore();
     // 业务逻辑
     return { ... };
   };
   ```

3. **在 knowledge-stores 添加状态切片** (如需):
   ```typescript
   // src/my-feature-slice.ts
   export const createMyFeatureSlice = (set, get) => ({
     myState: initialState,
     myAction: (payload) => set({ ... }),
   });
   ```

4. **在 knowledge-ide-base 集成功能**:
   ```typescript
   // 更新 features/ 目录
   ```

### 8.2 添加新的数据库功能

1. **在 database-v2-base 定义类型和基础组件**
2. **在 database-v2-main 实现主要功能**
3. **在 database-v2-adapter 添加场景适配**

### 8.3 命名规范

- **包名**: `@coze-data/{domain}-{feature}`
- **适配器包**: `@coze-data/{domain}-{feature}-adapter`
- **基础包**: `@coze-data/{domain}-{feature}-base`
- **Store 命名**: `use{Feature}Store`
- **Hook 命名**: `use{Action/State}`
- **Slice 命名**: `create{Feature}Slice`

---

> **注意**: 本文档中的摘录代码均标注了源文件路径与行号；示例代码除外。若代码结构发生变更，请同步更新相关引用。
