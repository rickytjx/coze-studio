# 工具配置系统 (Tool Configuration)

## 概览

Coze Agent 的强大之处在于其丰富的工具生态（插件、工作流、知识库等）。Agent IDE 提供了一个高度模块化、可配置的工具管理系统，允许开发者通过拖拽或点击轻松集成这些能力。

## 核心架构：工具状态管理

工具系统的状态管理基于 **Zustand** 和 **Context**，实现了工具的注册、激活和数据流转。

### 1. Store (状态存储)

**源码路径**: `frontend/packages/agent-ide/tool/src/store/tool-area.ts`

`useToolStore` 负责管理工具区域的核心状态：
-   `registeredTools`: 已注册的工具列表。
-   `validData`: 标记工具数据是否校验通过。
-   `init`: 工具区域的初始化状态。

### 2. Context (上下文)

**源码路径**: `frontend/packages/agent-ide/tool/src/context/ability-area-context.tsx`

`AbilityAreaContextProvider` 向下提供全局能力，包括：
-   `eventBus`: 处理工具间的通信（如点击添加按钮触发插件选择弹窗）。
-   `mode`: 当前 Bot 模式（Single/Workflow）。

## 核心实现：ToolArea

`ToolArea` 是所有工具配置的入口组件，它负责渲染不同类别的工具组，并管理它们的添加、配置和移除交互。

**源码路径**: `frontend/packages/agent-ide/entry/src/modes/single-mode/section-area/agent-config-area/tool-area.tsx`

```tsx
export const ToolArea: React.FC<ToolAreaProps> = props => {
  return (
    <LayoutContext value={{ placement: PlacementEnum.CENTER }}>
      <div className={s['setting-area']}>
        <ToolView>
          {/* 技能组：插件 & 工作流 */}
          <GroupingContainer toolGroupKey={ToolGroupKey.SKILL} title={I18n.t('bot_edit_type_skills')}>
            <PluginApisArea toolKey={ToolKey.PLUGIN} ... />
            <WorkflowCard toolKey={ToolKey.WORKFLOW} ... />
          </GroupingContainer>

          {/* 知识库组 */}
          <GroupingContainer toolGroupKey={ToolGroupKey.KNOWLEDGE} ...>
            <DataSetArea toolKey={ToolKey.DOCUMENT} formatType={FormatType.Text} ... />
          </GroupingContainer>

          {/* 记忆组 */}
          <GroupingContainer toolGroupKey={ToolGroupKey.MEMORY} ...>
            <DataMemory toolKey={ToolKey.VARIABLE} ... />
          </GroupingContainer>

          {/* 对话配置组 */}
          <GroupingContainer toolGroupKey={ToolGroupKey.DIALOG} ...>
            <OnboardingMessage ... />
            <SuggestionBlock ... />
          </GroupingContainer>
        </ToolView>
      </div>
    </LayoutContext>
  );
};
```

## 工具分类与配置

工具配置定义在 `@coze-agent-ide/tool-config` 包中，实现了配置与实现的解耦。

**源码路径**: `frontend/packages/agent-ide/tool-config/src/constants.ts`

### 关键映射表
1.  **`TOOL_GROUP_CONFIG`**: 定义工具在 UI 上的分组（Skill, Knowledge, Memory, Dialog）。
2.  **`TOOL_KEY_STORE_MAP`**: 定义工具 Key 到后端 API 字段的映射。
    -   `ToolKey.PLUGIN` -> `pluginApis`
    -   `ToolKey.WORKFLOW` -> `workflows`
3.  **`TOOL_KEY_TO_API_STATUS_KEY_MAP`**: 定义工具开关状态的 API 字段。

## 适配器模式在工具中的应用

为了保持 IDE 的核心轻量，具体的工具实现通过 **Adapter** 包引入：

-   **插件**: `@coze-agent-ide/plugin-area-adapter` (列表), `@coze-agent-ide/plugin-content-adapter` (内容)
-   **工作流**: `@coze-agent-ide/workflow-card-adapter` (卡片), `@coze-agent-ide/workflow-as-agent-adapter` (作为 Agent)
-   **知识库**: `@coze-data/knowledge-modal-adapter` (选择弹窗)

## 插件集成流程

1.  **展示**: `PluginApisArea` 使用 `useBotSkillStore` 获取当前 Bot 已添加的插件。
2.  **添加**: 点击添加按钮 -> 触发 `AbilityAreaContext` 事件 -> 打开 `PluginSelectModal` (适配器层)。
3.  **数据**: 选择插件后，更新 `bot-detail-store` 中的 `pluginApis` 数组。
4.  **持久化**: 通过 `useAgentPersistence` 或自动保存机制同步到服务端。
