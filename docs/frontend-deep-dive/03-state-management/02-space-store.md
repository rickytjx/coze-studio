# Space Store (空间管理)

Space Store 负责管理用户的工作空间（Workspaces），这是多租户架构的核心部分。它处理团队空间、个人空间的切换、列表获取以及权限校验。

## 1. 架构概览

Space Store 采用了 **分层架构**，分为 Adapter 层和 Public 层：

- **Adapter 层 (`@coze-foundation/space-store-adapter`)**: 包含核心 Zustand Store 实现、API 调用和数据处理逻辑。
- **Public 层 (`@coze-foundation/space-store`)**: 提供面向组件的高级 Hooks，封装了 Store 的直接调用，提供更友好的 API。

## 2. 核心 Store 实现

**文件**: `frontend/packages/foundation/space-store-adapter/src/space/index.ts`

### 2.1 状态模型

```typescript
interface SpaceStoreState {
  spaceList: BotSpace[];              // 完整的空间列表
  recentlyUsedSpaceList: BotSpace[];  // 最近使用的空间（用于快速切换）
  loading: false | Promise<SpaceInfo>;// 加载状态（支持 Promise 状态追踪）
  inited?: boolean;                   // 是否已完成首次加载
  createdTeamSpaceNum: number;        // 当前用户创建的团队空间数量
  maxTeamSpaceNum: number;            // 允许创建的最大团队空间数量
  
  // 已废弃字段（为了兼容性保留）
  space: BotSpace;
  spaces: { ... };
}
```

### 2.2 关键 Action 逻辑

#### 2.2.1 `fetchSpaces(force?: boolean)`
这是最核心的方法，负责获取空间列表。

1. **防抖与缓存**: 检查 `loading` 状态，如果已有正在进行的请求且非强制刷新，直接返回现有 Promise。
2. **API 调用**: 调用 `PlaygroundApi.GetSpaceListV2`。
3. **自动初始化个人空间**:
   - 如果返回列表显示没有个人空间 (`!has_personal_space`)
   - 自动调用 `createSpace` 创建一个名为 "Personal" 的空间
   - 启动轮询 (`polling`) 等待创建完成
4. **状态更新**: 更新 store 中的列表、计数器和初始化标志。

#### 2.2.2 `createSpace(request)`
创建新空间，直接调用后端 API。

#### 2.2.3 `getSpaceId()` / `checkSpaceID(id)`
辅助方法，用于验证空间 ID 的有效性。

### 2.3 轮询机制
**文件**: `frontend/packages/foundation/space-store-adapter/src/space/utils.ts`

当自动创建个人空间时，系统会进入轮询模式，每隔 800ms 检查一次，最多重试 4 次，直到空间创建成功。

```typescript
export const polling = <T>({ request, isValid, ... }) => {
  // 递归 setTimeout 实现轮询
  // 直到 isValid 返回 true 或达到 maxRetry
}
```

## 3. 高级 Hooks (`@coze-foundation/space-store`)

在业务组件中，**不建议**直接使用 `useSpaceStore`，而是使用以下 Hooks：

### 3.1 `useSpaceList(refresh?)`
获取所有可用空间列表。

```typescript
export const useSpaceList = (refresh?: boolean) => {
  const spaces = useSpaceStore(s => s.spaceList);
  const loading = useRefreshSpaces(refresh);
  return { spaces, loading };
};
```

### 3.2 `useSpace(spaceId, refresh?)`
获取特定空间的详细信息。

```typescript
export const useSpace = (spaceId: string, refresh?: boolean) => {
  const space = useSpaceStore(s =>
    s.spaceList.find(spaceItem => spaceItem.id === spaceId)
  );
  // ...
  return { space, loading };
};
```

### 3.3 `useRefreshSpaces(refresh?)`
控制刷新逻辑的 Hook。它监听 `enterpriseInfo` 变化或 `refresh` 标志，触发 Store 的 `fetchSpaces` 方法。

## 4. 最佳实践

1. **获取当前空间**: 优先从 URL 路由参数获取 `space_id`，然后传给 `useSpace`。
2. **切换空间**: 不要直接修改 Store，而是使用 `history.push` 跳转 URL，让路由驱动组件更新。
3. **权限控制**: 通过检查 `space.role` 或 `space.permissions` 来控制 UI 元素的显示/隐藏。
4. **性能优化**: `spaceList` 在应用启动或空间管理页加载时获取，普通页面不需要频繁刷新。
