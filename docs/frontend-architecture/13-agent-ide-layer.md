# Agent IDE 层 (Agent IDE Layer)

Agent IDE 层是 Coze Studio 的 AI Agent 集成开发环境，提供智能体的编辑、配置、调试和发布功能。该层采用模块化的适配器架构，基于 React 18 + TypeScript 构建，使用 Zustand 进行状态管理。

## 1. 概览

| 属性 | 值 |
|------|-----|
| 包数量 | 48 个包（统计口径：`frontend/packages/agent-ide/*/package.json` 文件数量） |
| 命名空间 | `@coze-agent-ide/*` |
| 核心技术 | React 18, TypeScript, Zustand |
| 入口包 | `@coze-agent-ide/bot-creator` (entry 目录) |

### 1.1 包分类

Agent IDE 层的 48 个包按功能可分为以下类别：

| 类别 | 包数量 | 主要职责 |
|------|--------|----------|
| 入口与布局 | 4 | 应用入口、页面布局、导航 |
| Bot 编辑器 | 7 | Bot 配置区域、编辑上下文、审核 |
| 插件系统 | 7 | 插件配置、插件面板、插件区域 |
| 工作流集成 | 5 | 工作流模态框、工作流卡片、工作流配置 |
| 聊天调试 | 9 | 聊天区域、调试工具、消息组件 |
| 工具配置 | 4 | 工具面板、技能配置、模型管理 |
| 通用组件 | 5 | 提示词编辑、引导页、发布管理 |
| 适配器 | 7 | 各模块的适配器实现 |

## 2. 核心包详解

### 2.1 入口包：`@coze-agent-ide/bot-creator`

**路径**: `frontend/packages/agent-ide/entry/`

入口包是 Agent IDE 的主入口，负责组装各个模块并提供统一的对外接口。

**导出内容** (摘录自 `frontend/packages/agent-ide/entry/src/index.tsx:17-24`):
```typescript
export { useInitToast } from './hooks/use-init-toast';
export {
  SingleMode,
  WorkflowMode,
  type SingleModeProps,
  type WorkflowModeProps,
} from './modes';
export { SkillsModal } from './components/shortcut-skills-modal';
```

**核心依赖** (来源：`frontend/packages/agent-ide/entry/package.json:15-66`):
- 内部依赖：`@coze-agent-ide/bot-config-area-adapter`, `@coze-agent-ide/bot-editor-context-store`, `@coze-agent-ide/chat-debug-area` 等 16 个 agent-ide 包
- 架构层依赖：`@coze-arch/bot-api`, `@coze-arch/bot-hooks`, `@coze-arch/i18n` 等
- 通用层依赖：`@coze-common/chat-area`, `@coze-common/prompt-kit` 等
- 外部依赖：`zustand@^4.4.7`, `immer@^10.0.3`, `ahooks@^3.7.8`

### 2.2 布局包：`@coze-agent-ide/layout`

**路径**: `frontend/packages/agent-ide/layout/`

布局包提供 Bot 编辑页的整体布局框架，包括头部、侧边栏和主内容区域。

**导出内容** (摘录自 `frontend/packages/agent-ide/layout/src/index.tsx:17-46`):
```typescript
import {
  BotEditorInitLayout,
  type BotEditorLayoutSlot,
  type BotEditorLayoutProps,
  type CustomProviderProps,
} from './layout';

export { BotHeader, type BotHeaderProps } from './components/header';

export { MoreMenuButton } from './components/header/more-menu-button';

export {
  DeployButtonUI,
  DeployButton,
  type DeployButtonProps,
  type DeployButtonUIProps,
} from './components/header/deploy-button';

export {
  renderWarningContent,
  OriginStatus,
} from './components/header/bot-status';

export {
  type BotEditorLayoutSlot,
  type BotEditorLayoutProps,
  type CustomProviderProps,
};

export default BotEditorInitLayout;
```

**组件结构**:
- `BotHeader` - 编辑器头部组件
- `DeployButton` - 部署按钮
- `MoreMenuButton` - 更多操作菜单
- `BotEditorInitLayout` - 编辑器主布局

### 2.3 编辑器上下文存储：`@coze-agent-ide/bot-editor-context-store`

**路径**: `frontend/packages/agent-ide/bot-editor-context-store/`

提供 Bot 编辑器页面级的上下文状态管理，通过 React Context 下发。

**导出内容** (摘录自 `frontend/packages/agent-ide/bot-editor-context-store/src/index.ts:17-45`):
```typescript
export { useBotEditor } from './context/bot-editor-context/index';
export { BotEditorContextProvider } from './context/bot-editor-context/context';
export {
  convertModelValueType,
  type ConvertedModelValueTypeMap,
} from './utils/model/convert-model-value-type';
export { getModelById } from './utils/model/get-model-by-id';
export {
  type BotEditorOnboardingSuggestion,
  type ModelPresetValues,
  type NLPromptModalPosition,
} from './store/type';
export { ModelState, ModelAction } from './store/model';
export type {
  NLPromptModalStore,
  NLPromptModalAction,
  NLPromptModalState,
} from './store/nl-prompt-modal';
export {
  FreeGrabModalHierarchyAction,
  FreeGrabModalHierarchyState,
  FreeGrabModalHierarchyStore,
} from './store/free-grab-modal-hierarchy';
export { useModelCapabilityConfig } from './hooks/model-capability';
export { mergeModelFuncConfigStatus } from './utils/model-capability';
export {
  createOnboardingDirtyLogicCompatibilityStore,
  type OnboardingDirtyLogicCompatibilityStore,
} from './store/onboarding-dirty-logic-compatibility';
```

**Store 模块** (位于 `frontend/packages/agent-ide/bot-editor-context-store/src/store/`):
| Store 文件 | 职责 |
|------------|------|
| `model.ts` | 模型列表与配置管理 |
| `nl-prompt-modal.ts` | 自然语言提示词弹窗状态 |
| `free-grab-modal-hierarchy.ts` | 模态框层级管理 |
| `bot-plugins.ts` | Bot 插件状态 |
| `dataset.ts` | 数据集状态 |
| `onboarding-dirty-logic-compatibility.ts` | 引导页兼容逻辑 |

### 2.4 导航包：`@coze-agent-ide/navigate`

**路径**: `frontend/packages/agent-ide/navigate/`

提供 Bot 编辑页面内的导航逻辑。

**核心 Hook** (摘录自 `frontend/packages/agent-ide/navigate/src/hooks/navigate-tools-page.ts:30-67`):
```typescript
export function useNavigateWorkflowEditPage(
  param?: WorkFlowModalModeProps & { newWindow?: boolean; spaceID?: string },
  scene?: SceneType,
) {
  const { jump } = usePageJumpService();
  const { space_id: spaceIDFromURL, bot_id: botIDFromURL } =
    useParams<DynamicParams>();

  const agentID = useCurrentNodeId();

  const { setWorkflowState } = useBotPageStore(state => ({
    setWorkflowState: state.setWorkflowState,
  }));

  // In order to be compatible with the old logic, the URL parameter is preferred
  const spaceID = spaceIDFromURL ?? param?.spaceID;
  const botID = botIDFromURL ?? '';

  return (workflowID: string, workflowModalState?: WorkflowModalState) => {
    if (!workflowID || !spaceID) {
      return;
    }
    // Only in single mode will the keep workflow pop-up be set
    if (useBotInfoStore.getState().mode === BotMode.SingleMode) {
      setWorkflowState({ showModalDefault: !!workflowModalState });
    }
    jump(scene || SceneType.BOT__VIEW__WORKFLOW, {
      workflowID,
      spaceID,
      botID,
      workflowModalState,
      agentID,
      workflowOpenMode: undefined,
      flowMode: param?.flowMode,
      newWindow: param?.newWindow,
    });
  };
}
```

### 2.5 Space Bot 存储：`@coze-agent-ide/space-bot`

**路径**: `frontend/packages/agent-ide/space-bot/`

提供 Bot 页面级的状态管理，包括 Bot 列表、页面状态、调试面板等。

**导出的 Store** (摘录自 `frontend/packages/agent-ide/space-bot/src/store/index.ts:17-23`):
```typescript
export { useBotListFilterStore } from './bot-list-filter';
export { useRiskWarningStore } from './risk-warning/store';
export { useBotPageStore } from './bot-page/store';
export { useDebugStore } from './debug-panel';
export { useBotModeStore } from './bot-mode';
export { useEvaluationPanelStore } from './evaluation-panel';
```

## 3. 状态管理模式

### 3.1 Zustand Store 工厂模式

Agent IDE 层使用 Zustand 的工厂模式创建 Store，支持 DevTools 和选择性订阅。

**(示例代码)**:
```typescript
export const createModelStore = () => {
  const store = create<ModelState & ModelAction>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        onlineModelList: [],
        offlineModelMap: {},
        modelPresetValuesMap: {},
        setOnlineModelList: onlineModelList =>
          set({ onlineModelList }, false, 'setOnlineModelList'),
        // ...
        getModelById: id => {
          const { onlineModelList, offlineModelMap } = get();
          return getModelById({ onlineModelList, offlineModelMap, id });
        },
      })),
      { enabled: IS_DEV_MODE, name: 'botStudio.botEditor.model' },
    ),
  );
  // 订阅状态变化，自动计算派生状态
  const unSubscribe = store.subscribe(
    state => ({ onlineModelList: state.onlineModelList, offlineModelMap: state.offlineModelMap }),
    ({ onlineModelList, offlineModelMap }) => {
      // 计算 modelPresetValuesMap
    },
    { equalityFn: shallow },
  );
  return { useModelStore: store, unSubscribe };
};
```

**模式特点**:
- 使用 `devtools` 中间件支持 Redux DevTools
- 使用 `subscribeWithSelector` 支持选择性订阅
- 返回 `unSubscribe` 函数用于清理订阅

### 3.2 Context + Store 组合模式

编辑器上下文通过 React Context 下发 Store 实例，实现页面级隔离。

```
BotEditorContextProvider
  └── 提供 useBotEditor hook
      ├── ModelStore
      ├── NLPromptModalStore
      ├── FreeGrabModalHierarchyStore
      └── ...其他 Store
```

## 4. 适配器模式

Agent IDE 层采用适配器模式解耦核心逻辑与具体实现。

### 4.1 适配器命名规范

| 核心包 | 适配器包 | 职责分离 |
|--------|----------|----------|
| `layout` | `layout-adapter` | 布局核心 vs 布局适配 |
| `plugin-content` | `plugin-content-adapter` | 插件内容 vs 插件适配 |
| `bot-config-area` | `bot-config-area-adapter` | 配置区域 vs 配置适配 |
| `chat-area-provider` | `chat-area-provider-adapter` | 聊天区域 vs 聊天适配 |

### 4.2 适配器结构

以 `frontend/packages/agent-ide/entry-adapter/src/index.ts:17` 为例，适配器包通过入口文件将核心逻辑与外部依赖连接：

```typescript
export { BotEditorWithContext as BotEditor } from './editor/agent-editor';
```

该适配器导出 `BotEditor` 组件，封装了完整的 Agent 编辑器上下文。

## 5. 组件架构

### 5.1 组件分层

```
frontend/packages/agent-ide/
├── entry/                    # 顶层入口
│   └── src/
│       ├── modes/           # 模式组件 (SingleMode, WorkflowMode)
│       └── components/      # 入口级组件
├── layout/                   # 布局层
│   └── src/
│       ├── layout/          # 布局容器
│       └── components/      # 布局组件 (header, sidebar)
├── tool/                     # 工具配置
│   └── src/
│       ├── store/           # 工具状态
│       └── components/      # 工具组件
├── prompt/                   # 提示词编辑
│   └── src/
│       └── components/      # 提示词组件
└── chat-debug-area/          # 调试区域
    └── src/
        └── components/      # 调试组件
```

### 5.2 组件统计

Agent IDE 层包含丰富的组件库（统计口径：各包 `frontend/packages/agent-ide/{pkg}/src/components/**/index.tsx` 文件数量）：

| 包名 | 组件数量 | 主要组件类型 |
|------|----------|--------------|
| `tool` | 24 | 工具视图、工具菜单、技能配置 |
| `model-manager` | 16 | 模型选择、模型表单、预设配置 |
| `onboarding` | 9 | 引导建议、Markdown 编辑器 |
| `layout` | 5 | 头部、部署按钮、信息卡片 |
| `chat-debug-area` | 2 | 调试面板、消息组件 |

## 6. 依赖关系

### 6.1 层级依赖

```
Agent IDE Layer (@coze-agent-ide/*)
    │
    ├──► 架构基础设施层 (@coze-arch/*)
    │    ├── bot-api          # API 接口
    │    ├── bot-hooks        # 通用 Hooks
    │    ├── bot-semi         # Semi Design 封装
    │    ├── coze-design      # Coze 设计系统
    │    └── i18n             # 国际化
    │
    ├──► 通用组件层 (@coze-common/*)
    │    ├── chat-area        # 聊天区域
    │    ├── prompt-kit       # 提示词工具
    │    └── biz-components   # 业务组件
    │
    ├──► 基础服务层 (@coze-foundation/*)
    │    ├── global-store     # 全局状态
    │    ├── space-store      # 空间状态
    │    └── layout           # 基础布局
    │
    ├──► Studio核心业务层 (@coze-studio/*)
    │    ├── bot-detail-store # Bot 详情存储
    │    └── components       # Studio 组件
    │
    └──► 工作流引擎层 (@coze-workflow/*)
         └── components       # 工作流组件
```

### 6.2 关键外部依赖

| 依赖 | 版本 | 用途 | 来源 |
|------|------|------|------|
| `zustand` | ^4.4.7 | 状态管理 | `frontend/packages/agent-ide/entry/package.json:66` |
| `immer` | ^10.0.3 | 不可变数据 | `frontend/packages/agent-ide/entry/package.json:64` |
| `ahooks` | ^3.7.8 | React Hooks 库 | `frontend/packages/agent-ide/entry/package.json:62` |
| `react-router-dom` | ^6.22.0 | 路由管理 | `frontend/packages/agent-ide/navigate/package.json:37` |
| `classnames` | ^2.3.2 | CSS 类名处理 | `frontend/packages/agent-ide/entry/package.json:63` |
| `lodash-es` | ^4.17.21 | 工具函数 | `frontend/packages/agent-ide/layout/package.json:55` |

## 7. 开发指南

### 7.1 添加新的编辑器功能

**(示例代码)**

1. **创建功能包**:
   ```bash
   cd frontend/packages/agent-ide
   mkdir my-feature && cd my-feature
   # 初始化 package.json，命名为 @coze-agent-ide/my-feature
   ```

2. **创建 Store** (如需状态管理):
   ```typescript
   // src/store/index.ts
   import { create } from 'zustand';
   import { devtools } from 'zustand/middleware';
   
   export const useMyFeatureStore = create(
     devtools((set) => ({
       // state & actions
     }), { name: 'agentIde.myFeature' })
   );
   ```

3. **创建组件**:
   ```typescript
   // src/components/my-component/index.tsx
   export const MyComponent: React.FC = () => {
     // 使用 Store
     const state = useMyFeatureStore();
     return <div>...</div>;
   };
   ```

4. **注册到入口** (如需对外暴露):
   ```typescript
   // 更新 entry/src/index.tsx
   export { MyComponent } from '@coze-agent-ide/my-feature';
   ```

### 7.2 命名规范

- **包名**: `@coze-agent-ide/{feature-name}`
- **适配器包**: `@coze-agent-ide/{feature-name}-adapter`
- **Store 命名**: `use{Feature}Store`
- **组件命名**: PascalCase，如 `ToolContainer`
- **Hook 命名**: `use{Action/State}`，如 `useNavigateWorkflowEditPage`

---

> **注意**: 本文档中的摘录代码均标注了源文件路径与行号；示例代码除外。若代码结构发生变更，请同步更新相关引用。
