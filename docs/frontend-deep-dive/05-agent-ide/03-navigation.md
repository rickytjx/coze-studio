# Agent IDE 导航系统

## 概览

Agent IDE 的导航系统主要由 **应用级路由** 和 **组件级导航** 两部分组成。IDE 深度集成了 `react-router-dom` v6，并利用代码分割（Code Splitting）优化加载性能。

## 路由配置

### 主路由表
Agent IDE 的路由定义在主应用的路由配置中，采用嵌套路由结构。

**源码路径**: `frontend/apps/coze-studio/src/routes/index.tsx`

```tsx
// 路由定义摘要
{
  path: 'space',
  Component: SpaceLayout,
  children: [
    {
      path: ':space_id',
      Component: SpaceIdLayout,
      children: [
        // Agent IDE 路由
        {
          path: 'bot/:bot_id',
          Component: AgentIDELayout, // 包装了 BotEditorInitLayout
          loader: () => ({
            hasSider: false, // IDE 模式下隐藏全局侧边栏
            requireBotEditorInit: true,
            pageName: 'bot',
          }),
          children: [
            {
              index: true,
              Component: AgentIDE, // 主编辑器界面
            },
            {
              path: 'publish',
              Component: AgentPublishPage, // 发布页
            },
          ],
        },
      ]
    }
  ]
}
```

### 异步组件加载
为了提升首屏性能，所有页面组件都通过 `async-components.tsx` 进行懒加载。

**源码路径**: `frontend/apps/coze-studio/src/routes/async-components.tsx`

```tsx
export const AgentIDE = lazy(() => import('@coze-agent-ide/entry-adapter').then(m => ({ default: m.AgentIDE })));
```

## 导航包 (@coze-agent-ide/navigate)

虽然路由定义在 App 层，但 IDE 内部的跳转逻辑被封装在 `@coze-agent-ide/navigate` 包中，以解耦业务逻辑和底层路由实现。

**源码路径**: `frontend/packages/agent-ide/navigate/src/`

### 核心 Hooks

#### `useNavigateWorkflowEditPage`
用于跳转到工作流编辑页面的专用 Hook。

```typescript
// 源码路径: frontend/packages/agent-ide/navigate/src/hooks/navigate-tools-page.ts:30-60 (摘录)
export function useNavigateWorkflowEditPage(
  param?: WorkFlowModalModeProps & { newWindow?: boolean; spaceID?: string },
  scene?: SceneType,
) {
  const { jump } = usePageJumpService();
  const { space_id: spaceIDFromURL, bot_id: botIDFromURL } = useParams<DynamicParams>();
  const agentID = useCurrentNodeId();
  const { setWorkflowState } = useBotPageStore(state => ({
    setWorkflowState: state.setWorkflowState,
  }));

  const spaceID = spaceIDFromURL ?? param?.spaceID;
  const botID = botIDFromURL ?? '';

  return (workflowID: string, workflowModalState?: WorkflowModalState) => {
    if (!workflowID || !spaceID) return;
    // 单智能体模式下设置工作流弹窗状态
    if (useBotInfoStore.getState().mode === BotMode.SingleMode) {
      setWorkflowState({ showModalDefault: !!workflowModalState });
    }
    jump(scene || SceneType.BOT__VIEW__WORKFLOW, {
      workflowID, spaceID, botID, workflowModalState,
      agentID, newWindow: param?.newWindow,
    });
  };
}
```

## 顶部导航栏 (Header)

IDE 的顶部导航栏不仅仅是面包屑，它还是重要的操作区域。

**源码路径**: `frontend/packages/agent-ide/layout/src/components/header/`

主要包含：
1.  **返回按钮**: 调用 `goBackToBotList` 返回开发列表。
2.  **Bot 信息卡片 (`bot-info-card`)**: 显示 Bot 图标、名称、描述。
3.  **状态指示器 (`bot-status`)**: 显示当前 Bot 是 Draft、Published 还是 Modifying 状态。
4.  **发布按钮 (`deploy-button`)**: 触发 Agent 发布流程。
5.  **更多菜单 (`more-menu-button`)**: 提供发布历史、日志分析等跳转链接。

## 侧边栏导航 (Side Sheet)

在移动端或特定模式下，IDE 支持通过侧边栏进行导航。

**源码路径**: `frontend/packages/foundation/layout/src/components/global-layout/component/sub-menu.tsx`

-   支持宽度拖拽调整 (200px - 380px)。
-   使用 `localStorage` 持久化用户偏好的侧边栏宽度。
-   `SubMenu` 组件根据路由配置自动生成菜单项 (`MenuItem`)。

## 关键导航路径

| 页面 | 路径模式 | 说明 |
|------|----------|------|
| **开发列表** | `/space/:space_id/develop` | 项目与 Agent 列表 |
| **Agent 编辑** | `/space/:space_id/bot/:bot_id` | IDE 主界面 |
| **Agent 发布** | `/space/:space_id/bot/:bot_id/publish` | 发布配置页 |
| **插件详情** | `/space/:space_id/plugin/:plugin_id` | 插件配置页 |
| **发布管理** | `/space/:space_id/publish/agent/:bot_id` | 包含分析、日志、触发器 Tab |
