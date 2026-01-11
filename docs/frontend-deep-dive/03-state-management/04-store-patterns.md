# Store 模式与最佳实践

在 Coze Studio 的前端开发中，我们遵循一套严格的状态管理模式，以确保代码的可维护性、可测试性和性能。

## 1. Setter Factory 模式

为了减少 Redux/Zustand 中常见的样板代码（Boilerplate），我们实现了一个通用的 Setter 工厂函数。

**源码位置**: `frontend/packages/studio/stores/bot-detail/src/utils/setter-factory.ts`

### 1.1 定义
```typescript
export type SetterAction<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean,
  actionName?: string
) => void;

export const setterActionFactory = <T extends object>(
  set: SetState<T>
): SetterAction<T> => {
  return (partial, replace, actionName) => {
    set(
      (state) => {
        const update = typeof partial === 'function' 
          ? (partial as Function)(state) 
          : partial;
        return update;
      },
      replace,
      actionName
    );
  };
};
```

### 1.2 优势
- **统一 API**: 所有 Store 都有一个标准的 `setState` 风格方法
- **类型安全**: 自动推导 Partial 类型
- **DevTools 集成**: 支持传入 `actionName`，方便调试追踪

## 2. 状态分层策略

我们严格区分三种类型的状态，并分别存放：

| 状态类型 | 存放位置 | 示例 |
| --- | --- | --- |
| **Server State** | React Query / SWR (部分) | 用户列表、模型列表 |
| **Global Client State** | Zustand | 用户偏好、全局配置、Bot 编辑数据 |
| **Local UI State** | React `useState` / `useReducer` | 模态框开关、表单输入临时态 |

> **注意**: 在 Bot 编辑器中，由于数据极其复杂且需要跨组件频繁交互，我们将大量本应属于 Server State 的数据（如 Bot 详情）也放入了 Zustand Store 中管理，并通过 `initStore` 和 `save` 动作手动同步。

## 3. 性能优化模式

### 3.1 Selector 优化
使用 Zustand 时，**严禁**直接获取整个 State 对象，必须使用 Selector 选择所需的最细粒度属性。

```typescript
// ❌ 错误：导致所有状态变更都会触发重渲染
const { pluginApis } = useBotSkillStore();

// ✅ 正确：仅当 pluginApis 变化时才渲染
const pluginApis = useBotSkillStore(s => s.pluginApis);
```

### 3.2 浅比较 (Shallow Compare)
当需要从 Store 获取多个属性时，使用 `useShallow` 或自定义 equalityFn。

```typescript
import { useShallow } from 'zustand/react/shallow';

const { mode, name } = useBotInfoStore(
  useShallow(state => ({ 
    mode: state.mode, 
    name: state.name 
  }))
);
```

### 3.3 瞬时更新 (Transient Updates)
对于高频更新（如拖拽、滚动），不要触发 React 渲染，而是直接操作 DOM 或使用 `subscribe` 监听。

```typescript
// 在组件外部或 useEffect 中监听
useBotSkillStore.subscribe(
  state => state.layoutInfo,
  (layout) => {
    // 直接更新 Canvas 位置，不触发 React Render
    canvasRef.current.updateLayout(layout);
  }
);
```

## 4. 持久化与副作用

### 4.1 中间件链
Store 的创建遵循以下中间件链顺序（参考仓库内各 Store 实现）：

1. `devtools`: 调试支持
2. `subscribeWithSelector`: 支持细粒度订阅
3. `persist` (可选): 本地持久化 (localStorage/IndexedDB)
4. `immer` (可选): 不可变更新

```typescript
export const useStore = create()(
  devtools(
    subscribeWithSelector(
      persist(
        (set) => ({ ... }),
        { name: 'store-name' }
      )
    )
  )
);
```

### 4.2 初始化与重置
每个 Store 都必须实现 `reset` 或 `clear` 方法，并在组件卸载 (`useEffect return`) 或上下文切换时调用，防止状态污染。

```typescript
// 在 BotDetailStoreSet 中统一管理
clear() {
  usePersonaStore.getState().clear();
  useBotSkillStore.getState().clear();
  // ...
}
```

## 5. 目录结构规范

每个复杂的 Store 模块应遵循以下结构：

```
src/store/my-feature/
├── index.ts        # 导出入口
├── store.ts        # Zustand Store 定义
├── type.ts         # 类型定义
├── constant.ts     # 常量与默认值
└── helper.ts       # 纯函数工具（转换逻辑等）
```

这种结构有助于保持 `store.ts` 的整洁，将庞大的类型定义和辅助逻辑剥离。
