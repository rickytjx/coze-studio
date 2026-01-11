# Agent IDE 布局系统

## 概览

Agent IDE 采用了一套高度定制的响应式布局系统，旨在提供类似桌面 IDE 的操作体验。布局系统的核心是 **AbilityAreaContainer** 和 **SingleSheet** 组件，支持面板的折叠、展开以及多区域协同工作。

## 布局架构

### 1. 基础布局 Shell
整个编辑器的外壳由 `BotEditorInitLayout` 管理，它负责处理加载状态 (`Spin`) 和全局上下文注入 (`BotDebugChatAreaProviderAdapter`)。

**源码路径**: `frontend/packages/agent-ide/layout/src/layout.tsx`

```tsx
export const BotEditorInitLayoutImpl: FC<...> = ({ children, hasHeader = true, ... }) => {
  // 处理首次加载 Loading
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  return (
    <div className={s.wrapper}>
      {isFirstLoad && !init ? (
        <Spin spinning wrapperClassName="h-full w-full" />
      ) : (
        <CustomProvider botId={botId}>
          <BotDebugChatAreaProviderAdapter ...>
             {/* 顶部导航栏 */}
             {hasHeader ? header : null}
             {/* 主内容区域 */}
             {children}
          </BotDebugChatAreaProviderAdapter>
        </CustomProvider>
      )}
    </div>
  );
};
```

### 2. 双栏布局 (Split Pane)
在 `SingleMode` 中，布局被分为左右两部分：
- **Config Area (左侧)**: 宽度固定或自适应，用于配置。
- **Preview Area (右侧)**: 占据剩余空间，用于对话调试。

这种布局通过 Flexbox 实现，配合 `ContentView` 组件进行管理。

### 3. 可调整大小的面板 (Resizable Layout)
在 `WorkflowMode` 中，IDE 使用了支持拖拽调整的面板布局，核心由 `ResizableLayout` 组件实现。

**源码路径**: `frontend/packages/studio/components/src/resizable-layout/`

```tsx
// 示例：工作流模式布局
<ResizableLayout className="h-full">
  <div className="w-1/2 min-w-[610px]">{leftSheet}</div>
  <div className="w-1/2 min-w-[480px]">{rightSheet}</div>
</ResizableLayout>
```

### 4. 面板系统 (Sheet System)

**SheetView** 组件提供了面板的基础封装，支持两种模式：
- **SingleSheet**: 简单的单面板结构，用于单 Agent 模式。
- **MultipleSheet**: 支持左右折叠的多面板结构，用于复杂模式。

**源码路径**: `frontend/packages/agent-ide/space-bot/src/component/sheet-view/`

## 布局状态持久化

IDE 的布局状态（如面板是否展开、侧边栏宽度）通过 Zustand Store 进行管理，并利用 `localStorage` 进行持久化，确保用户刷新页面后能恢复之前的布局偏好。

**Store 位置**: `frontend/packages/studio/stores/bot-detail/src/store/multi-agent/store.ts`

```typescript
interface MultiSheetViewOpenState {
  left: boolean;   // 左面板是否展开
  right: boolean;  // 右面板是否展开
}

// 状态会自动同步到 common_storage.multiSheetViewOpen
```

## 响应式设计
布局系统通过 CSS Modules (`index.module.less`) 定义了不同屏幕尺寸下的表现。同时，`usePageRuntimeStore` 中维护了布局相关的运行时状态，确保在不同设备上都能保持良好的可用性。
