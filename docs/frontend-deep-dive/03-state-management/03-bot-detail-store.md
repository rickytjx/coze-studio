# Bot Detail Store (Bot 详情核心状态)

这是 Coze Studio 中最复杂、最重要的状态管理模块，负责处理 Bot 编辑器（IDE）中的所有业务逻辑和数据流。

## 1. 架构设计：Store Set 模式

为了避免单一 Store 过于庞大（God Object），Bot Detail Store 采用了 **Store Set** 模式，将不同功能模块拆分为独立的 Store，再通过统一的入口进行管理。

**源码路径**: `frontend/packages/studio/stores/bot-detail/src/store/index.ts`

### 1.1 组合结构
```typescript
export interface BotDetailStoreSet {
  useBotInfoStore: typeof useBotInfoStore;       // 基础信息
  useModelStore: typeof useModelStore;           // 模型配置
  useBotSkillStore: typeof useBotSkillStore;     // 技能编排 (核心)
  usePersonaStore: typeof usePersonaStore;       // 人设与提示词
  useMultiAgentStore: typeof useMultiAgentStore; // 多智能体模式
  useCollaborationStore: typeof useCollaborationStore; // 协作信息
  // ... 其他辅助 store
}
```

### 1.2 生命周期管理
`useBotDetailStoreSet` 对象提供了统一的生命周期方法：

- **`getStore()`**: 获取所有子 Store 的钩子函数引用
- **`clear()`**: 级联调用所有子 Store 的 `clear()` 方法，实现完全重置

## 2. 核心子 Store 详解

### 2.1 BotSkillStore (技能与编排)
这是业务逻辑最集中的 Store，管理 Bot 的所有"能力"。

**文件**: `src/store/bot-skill/store.ts`

#### 状态概览
```typescript
interface BotSkillStore {
  // 核心能力
  pluginApis: EnabledPluginApi[];     // 插件
  workflows: WorkFlowItemType[];      // 工作流
  knowledge: KnowledgeConfig;         // 知识库
  database: DatabaseInfo;             // 数据库
  variables: VariableItem[];          // 变量
  
  // 交互配置
  onboardingContent: ExtendOnboardingContent; // 开场白
  suggestionConfig: BotSuggestionConfig;      // 推荐问题
  shortcut: ShortCutStruct;                   // 快捷指令
  
  // 语音/多媒体
  tts: TTSInfo;                       // 语音合成配置
  voicesInfo: VoicesInfo;             // 音色配置
  backgroundImageInfoList: BackgroundImageInfo[]; // 背景图
}
```

#### 关键 Action
- `setBotSkillByImmer`: 使用 Immer 进行深层状态更新
- `updateSkillPluginApis`: 更新插件列表
- `initStore`: 将后端 DTO 转换为前端 VO 结构

### 2.2 BotInfoStore (元数据)
**文件**: `src/store/bot-info.ts`

管理 Bot 的基本属性：
- `botId`, `version`: 标识信息
- `name`, `description`, `icon_uri`: 展示信息
- `mode`: 单 Agent / 多 Agent 模式
- `publish_time`, `botMarketStatus`: 发布状态

### 2.3 ModelStore (模型)
**文件**: `src/store/model.ts`

管理 LLM 模型参数：
- `model`: 模型 ID (如 gpt-4)
- `temperature`, `top_p`: 生成参数
- `context_mode`: 上下文记忆模式

## 3. 数据流转与转换 (DTO <-> VO)

为了解耦后端 API 数据结构 (DTO) 与前端 UI 组件所需结构 (VO)，Store 内部实现了转换层。

### 3.1 `transformDto2Vo`
在 `initStore` 时调用。将嵌套的后端 JSON 结构扁平化或重组为前端易用的对象。

**示例 (ModelStore)**:
```typescript
transformDto2Vo: botData => {
  const modelInfo = botData.bot_info.model_info;
  return {
    model: modelInfo?.model_id,
    temperature: modelInfo?.temperature,
    // 将后端复杂的 short_memory_policy 转换为前端简单的配置对象
    ShortMemPolicy: {
      ContextContentType: modelInfo?.short_memory_policy?.context_mode,
      HistoryRound: modelInfo?.short_memory_policy?.history_round,
    }
  };
}
```

### 3.2 `transformVo2Dto`
在保存 (`Save`) 或发布 (`Publish`) 时调用。将前端状态还原为后端所需的 API 负载。

## 4. 开发指南

### 4.1 如何新增状态？
1. 确定状态归属（是技能？是模型参数？还是 UI 状态？）
2. 在对应的子 Store (`src/store/xxx.ts`) 中添加字段
3. 更新 `transformDto2Vo` 和 `transformVo2Dto` 确保前后端数据同步
4. 在 `BotSkillAction` 中添加对应的更新方法（如果是 BotSkill）

### 4.2 使用 Immer 更新复杂状态
对于嵌套层级深的对象（如 `knowledge.dataSetInfo.params`），**必须**使用 `setBotSkillByImmer`，避免手动浅拷贝导致的 bug。

```typescript
const setBotSkillByImmer = useBotSkillStore(s => s.setBotSkillByImmer);

// ✅ 正确做法
setBotSkillByImmer(draft => {
  draft.knowledge.dataSetInfo.params.enabled = true;
});

// ❌ 错误做法 (繁琐且易错)
setBotSkill(s => ({
  ...s,
  knowledge: {
    ...s.knowledge,
    dataSetInfo: {
      ...s.knowledge.dataSetInfo,
      params: {
        ...s.knowledge.dataSetInfo.params,
        enabled: true
      }
    }
  }
}));
```

### 4.3 调试
所有 Store 都集成了 `devtools` 中间件。在 Chrome Redux DevTools 中，可以过滤 `botStudio.botDetail.*` 来查看特定 Store 的状态变化历史。
