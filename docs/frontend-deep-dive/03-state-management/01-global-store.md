# 全局 Store (Global Store)

Global Store 负责管理应用级别的通用配置和状态，这些状态在整个应用程序生命周期内保持一致，不随页面切换而销毁。

## 1. 架构位置
- **包名**: `@coze-foundation/global-store`
- **源码路径**: `frontend/packages/foundation/global-store/`
- **依赖关系**: 被 `apps/coze-studio` 和其他业务包广泛引用

## 2. CommonConfigStore (通用配置)

这是最核心的全局 Store，用于存储从服务端下发的全局配置信息。

### 2.1 状态定义
**文件**: `src/stores/common-config-store.ts`

```typescript
interface ICommonConfig {
  botIdeGuideVideoUrl: string;          // IDE 引导视频地址
  bannerConfig?: CozeBanner;            // 顶部横幅配置
  homeBannerTask?: HomeBannerDisplay[]; // 首页任务横幅
  quickStart?: QuickStartConfig[];      // 快速开始模板配置
  oceanProjectSpaces?: string[];        // Ocean 项目空间 ID 列表
  douyinAvatarSpaces?: string[];        // 抖音分身空间列表
}

export interface ICommonConfigStoreState {
  initialized: boolean;                 // 是否已初始化
  commonConfigs: ICommonConfig;         // 配置数据
}
```

### 2.2 核心 Action

```typescript
export interface ICommonConfigStoreAction {
  // 设置初始化完成状态
  setInitialized: () => void;
  // 更新通用配置（全量或增量）
  updateCommonConfigs: (commonConfigs: ICommonConfig) => void;
}
```

### 2.3 实现细节

Store 使用 `zustand` 创建，并集成了 `devtools` 中间件用于调试。

```typescript
export const useCommonConfigStore = create<
  ICommonConfigStoreState & ICommonConfigStoreAction
>()(
  devtools(set => ({
    ...DEFAULT_COMMON_CONFIG_STATE,
    updateCommonConfigs(commonConfigs: ICommonConfig) {
      set(state => ({ ...state, commonConfigs }));
    },
    setInitialized: () => {
      set({
        initialized: true,
      });
    },
  })),
);
```

## 3. 使用场景

### 3.1 首页渲染
首页组件通过此 Store 获取 `quickStart` 配置，渲染"快速开始"区域的模板卡片。

```typescript
const { quickStart } = useCommonConfigStore(state => state.commonConfigs);

return (
  <div className="quick-start-list">
    {quickStart?.map(template => <TemplateCard data={template} />)}
  </div>
);
```

### 3.2 引导与帮助
在 Bot 编辑器中，通过 `botIdeGuideVideoUrl` 获取教学视频链接，在用户首次进入或点击帮助时播放。

### 3.3 权限与特性开关
通过 `oceanProjectSpaces` 判断当前空间是否支持特定功能（如 Ocean 项目集成）。

## 4. 扩展指南

如果需要添加新的全局配置：

1. **定义类型**: 在 `ICommonConfig` 接口中添加新字段
2. **更新默认值**: 在 `DEFAULT_COMMON_CONFIG_STATE` 中设置初始值
3. **后端对接**: 确保后端 API (`/api/common_config`) 返回对应字段
4. **初始化调用**: 在应用入口处（如 `App.tsx` 或布局组件）调用 `updateCommonConfigs` 注入数据
