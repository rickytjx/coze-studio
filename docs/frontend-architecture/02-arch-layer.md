# 架构基础设施层 (packages/arch)

`packages/arch` 是 Coze Studio 前端架构的核心基础设施层，提供了构建整个应用所需的底层能力。该层包含约 **37 个 Rush 项目**（以 `rush.json` 中 `frontend/packages/arch/*` 前缀统计），涵盖 API 通信、状态管理、国际化、日志监控、工具函数等关键领域。

## 1. 层级定位

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (apps/coze-studio)                  │
├─────────────────────────────────────────────────────────────┤
│                    业务层 (packages/studio)                   │
├─────────────────────────────────────────────────────────────┤
│                    工作流层 (packages/workflow)               │
├─────────────────────────────────────────────────────────────┤
│                    通用层 (packages/common)                   │
├─────────────────────────────────────────────────────────────┤
│  ★ 架构基础设施层 (packages/arch) ★                          │
│  API | 状态 | 国际化 | 日志 | 工具 | Hooks | 环境配置          │
└─────────────────────────────────────────────────────────────┘
```

架构层位于最底层，为上层所有模块提供基础能力支撑，具有以下特点：

- **零业务逻辑**：仅提供通用技术能力，不包含任何业务代码
- **高度复用**：被整个 monorepo 中的所有包广泛依赖
- **稳定性优先**：API 变更需要谨慎评估，避免破坏性更新

## 2. 核心包分类

### 2.1 API 与网络通信

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-api` | RPC 封装层 | 统一的 API 客户端，支持 30+ 服务接口 |
| `@coze-arch/bot-http` | HTTP 客户端 | Axios 封装，请求拦截器，错误处理 |
| `@coze-arch/fetch-stream` | 流式请求 | SSE 流式响应处理，用于 AI 对话等场景 |
| `@coze-arch/idl` | 接口定义 | 自动生成的 TypeScript 类型定义 |
| `@coze-studio/api-schema` | API Schema | API 请求/响应的类型定义 |

#### `@coze-arch/bot-api` 详解

这是最核心的 API 包，封装了与后端所有服务的通信：

```typescript
// 导入方式
import { DeveloperApi, PlaygroundApi, KnowledgeApi } from '@coze-arch/bot-api';

// 也支持按需导入特定 API 模块
import { BotInfo } from '@coze-arch/bot-api/developer_api';
import { ChatMessage } from '@coze-arch/bot-api/playground_api';
```

**支持的 API 模块：**

- `developer_api` - 开发者 API（Bot 管理、发布等）
- `playground_api` - 调试 Playground API
- `workflow_api` - 工作流 API
- `knowledge` - 知识库 API
- `memory` - 记忆系统 API
- `plugin_develop` - 插件开发 API
- `connector_api` - 连接器 API
- `permission_authz` / `permission_oauth2` - 权限认证 API
- 更多 30+ 服务接口...

### 2.2 状态管理

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-studio-store` | 全局状态 | 基于 Zustand 的全局状态管理 |
| `@coze-arch/web-context` | Web 上下文 | 全局变量代理、事件总线、导航工具 |
| `@coze-arch/bot-flags` | Feature Flags | 功能开关、灰度发布控制 |

#### `@coze-arch/web-context` 详解

提供了三个核心能力：

```typescript
import { globalVars, GlobalEventBus, redirect } from '@coze-arch/web-context';

// 1. 全局变量存储（替代 window.xxx）
globalVars.LAST_EXECUTE_ID = 'abc123';

// 2. 事件总线
const eventBus = GlobalEventBus.create<MyEvents>('app');
eventBus.on('userLogin', (userId) => console.log(`User ${userId} logged in`));
eventBus.emit('userLogin', 'user123');

// 3. 安全导航
redirect('/dashboard');
```

### 2.3 国际化 (i18n)

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/i18n` | 国际化核心 | 基于 i18next 的多语言支持 |

**主要特性：**

- 支持中文简体 (`zh-CN`) 和英文 (`en`)
- ICU 消息格式支持
- React Context 集成
- 类型安全的翻译 Key

```typescript
import { I18n } from '@coze-arch/i18n';

// 基础翻译
I18n.t('common.save');

// 带插值
I18n.t('user.greeting', { name: 'John' });

// 切换语言
await I18n.setLangWithPromise('zh-CN');
```

### 2.4 日志与监控

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/logger` | 日志系统 | 统一日志接口、错误上报、性能追踪 |
| `@coze-arch/report-events` | 事件上报 | 埋点事件上报 |
| `@coze-arch/report-tti` | TTI 上报 | 首屏性能指标上报 |
| `@coze-studio/slardar-adapter` | Slardar 适配器 | 字节跳动监控平台集成 |
| `@coze-studio/slardar-interface` | Slardar 接口 | Slardar SDK 类型定义 |
| `@coze-arch/default-slardar` | 默认 Slardar | Slardar 默认配置 |

#### `@coze-arch/logger` 详解

```typescript
import { logger, reporter, ErrorBoundary } from '@coze-arch/logger';

// 控制台日志
logger.info('Operation completed');
logger.error({ message: 'Failed', error: new Error('Details') });

// 远程上报
reporter.event({ eventName: 'user_action', meta: { action: 'click' } });

// 性能追踪
const { trace } = reporter.tracer({ eventName: 'api_request' });
trace('start');
// ... operation
trace('success');

// React 错误边界
<ErrorBoundary errorBoundaryName="main-app" FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### 2.5 React Hooks

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-hooks` | 业务 Hooks | Bot Studio 专用 Hooks |
| `@coze-arch/bot-hooks-base` | 基础 Hooks | 通用 React Hooks |
| `@coze-arch/bot-hooks-adapter` | Hooks 适配器 | Hooks 的适配层 |
| `@coze-arch/hooks` | 通用 Hooks | 轻量级通用 Hooks |

### 2.6 工具函数

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-utils` | Bot 工具集 | 文件上传、URL 处理、数组工具等 |
| `@coze-arch/utils` | 通用工具 | URL 解析等通用工具函数 |
| `@coze-arch/responsive-kit` | 响应式工具 | 响应式布局辅助工具 |

### 2.7 环境与配置

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-env` | 环境配置 | 运行时环境变量管理 |
| `@coze-arch/bot-env-adapter` | 环境适配器 | 环境配置的适配层 |
| `@coze-arch/bot-typings` | 类型定义 | 全局 TypeScript 类型 |

### 2.8 埋点与数据采集 (TEA)

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/tea` | TEA 核心 | 数据埋点统一入口 |
| `@coze-studio/tea-adapter` | TEA 适配器 | TEA SDK 初始化 |
| `@coze-studio/tea-interface` | TEA 接口 | TEA SDK 类型定义 |
| `@coze-arch/bot-tea` | Bot TEA | Bot 专用埋点扩展 |

### 2.9 SDK 与集成

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/foundation-sdk` | Foundation SDK | 基础设施与业务层的桥接 SDK |
| `@coze-arch/bot-space-api` | Space API | 工作空间 API 封装 |

#### `@coze-arch/foundation-sdk` 详解

提供了业务层与基础设施层之间的标准化接口：

```typescript
import {
  useCurrentTheme,
  getLoginStatus,
  getUserInfo,
  refreshUserInfo,
  uploadAvatar
} from '@coze-arch/foundation-sdk';

// 主题
const theme = useCurrentTheme(); // 'light' | 'dark'

// 用户状态
const loginStatus = getLoginStatus();
const userInfo = getUserInfo();

// 用户操作
await refreshUserInfo();
await uploadAvatar(file);
```

### 2.10 编辑器与特殊组件

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-monaco-editor` | Monaco 编辑器 | 代码编辑器封装 |
| `@coze-arch/bot-md-box-adapter` | Markdown 适配器 | Markdown 渲染适配 |
| `@coze-arch/pdfjs-shadow` | PDF.js Shadow | PDF 渲染 Shadow DOM 封装 |
| `@coze-arch/load-remote-worker` | 远程 Worker 加载 | Web Worker 动态加载 |

### 2.11 UI 与错误处理

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@coze-arch/bot-semi` | Semi 适配 | Semi Design 组件扩展 |
| `@coze-arch/bot-error` | 错误处理 | 统一错误类型定义与处理 |

## 3. 包间依赖关系

架构层内部形成了清晰的依赖层次：

```
┌─────────────────────────────────────────────────────────────┐
│                    业务 Hooks & Utils                        │
│  bot-hooks, bot-utils, bot-studio-store                     │
├─────────────────────────────────────────────────────────────┤
│                    核心服务层                                 │
│  bot-api, i18n, logger, foundation-sdk                      │
├─────────────────────────────────────────────────────────────┤
│                    基础设施层                                 │
│  bot-http, fetch-stream, web-context, bot-env               │
├─────────────────────────────────────────────────────────────┤
│                    类型与配置层                               │
│  bot-typings, idl, api-schema                               │
└─────────────────────────────────────────────────────────────┘
```

## 4. 命名规范

架构层的包命名遵循以下规则：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `bot-*` | Bot Studio 专用功能 | `bot-api`, `bot-hooks`, `bot-utils` |
| `tea-*` | 埋点相关 | `tea`, `tea-adapter`, `tea-interface` |
| `slardar-*` | 监控相关 | `slardar-adapter`, `slardar-interface` |
| 无前缀 | 通用功能 | `i18n`, `logger`, `hooks`, `utils` |

## 5. 使用最佳实践

### 5.1 API 调用

```typescript
// 推荐：使用统一的 API 入口
import { DeveloperApi } from '@coze-arch/bot-api';

const bots = await DeveloperApi.getBotList({ page: 1, page_size: 20 });

// 禁用错误 Toast（特殊场景）
const result = await DeveloperApi.getBotInfo(
  { bot_id: 'xxx' },
  { __disableErrorToast: true }
);
```

### 5.2 日志记录

```typescript
import { logger, reporter } from '@coze-arch/logger';

// 开发阶段：控制台日志
logger.info({ message: 'Debug info', namespace: 'my-module' });

// 生产环境：远程上报
reporter.error({
  message: 'API failed',
  error: new Error('Network error'),
  namespace: 'api',
  scope: 'user-service'
});
```

### 5.3 全局状态

```typescript
import { globalVars, GlobalEventBus } from '@coze-arch/web-context';

// 优先使用 web-context 而非直接访问 window
globalVars.MY_STATE = { data: 'value' };

// 使用事件总线进行模块间通信
const bus = GlobalEventBus.create('app');
bus.emit('stateChanged', { key: 'value' });
```

### 5.4 Feature Flags

```typescript
import { getFlags, useFlags } from '@coze-arch/bot-flags';

// 函数式调用
if (getFlags('new_feature_enabled')) {
  // 新功能代码
}

// React Hook
function MyComponent() {
  const flags = useFlags();
  return flags.new_feature_enabled ? <NewFeature /> : <OldFeature />;
}
```

## 6. 开发指南

### 6.1 添加新包

1. 在 `packages/arch/` 下创建新目录
2. 初始化 `package.json`，遵循命名规范
3. 配置 `tsconfig.json` 继承自 `@coze-arch/ts-config`
4. 配置 ESLint 使用 `@coze-arch/eslint-config`
5. 在 `rush.json` 中注册新包

### 6.2 测试要求

所有架构层的包都应有完善的单元测试：

```bash
# 运行测试
rushx test

# 运行带覆盖率的测试
rushx test:cov
```

### 6.3 发布注意事项

- 架构层的变更影响范围广，需要充分测试
- 破坏性变更需要提供迁移指南
- 建议使用语义化版本控制

## 7. 完整包列表

> **注意**: 以下列表基于 `rush.json` 中 `frontend/packages/arch/*` 前缀的项目。包名以实际 `package.json` 中的 `name` 字段为准。

| # | 包名 | 描述 |
|---|------|------|
| 1 | `@coze-arch/api-schema` | API Schema 类型定义 |
| 2 | `@coze-arch/bot-api` | RPC 封装层 |
| 3 | `@coze-arch/bot-env` | 环境配置 |
| 4 | `@coze-arch/bot-env-adapter` | 环境适配器 |
| 5 | `@coze-arch/bot-error` | 错误处理 |
| 6 | `@coze-arch/bot-flags` | Feature Flags |
| 7 | `@coze-arch/bot-hooks` | 业务 Hooks |
| 8 | `@coze-arch/bot-hooks-adapter` | Hooks 适配器 |
| 9 | `@coze-arch/bot-hooks-base` | 基础 Hooks |
| 10 | `@coze-arch/bot-http` | HTTP 客户端 |
| 11 | `@coze-arch/bot-md-box-adapter` | Markdown 适配器 |
| 12 | `@coze-arch/bot-monaco-editor` | Monaco 编辑器 |
| 13 | `@coze-arch/bot-semi` | Semi 适配 |
| 14 | `@coze-arch/bot-space-api` | Space API |
| 15 | `@coze-arch/bot-store` | (已废弃，迁移至 bot-studio-store) |
| 16 | `@coze-arch/bot-studio-store` | 全局状态管理 |
| 17 | `@coze-arch/bot-tea` | Bot TEA 埋点 |
| 18 | `@coze-arch/bot-typings` | TypeScript 类型定义 |
| 19 | `@coze-arch/bot-utils` | Bot 工具集 |
| 20 | `@coze-arch/default-slardar` | 默认 Slardar 配置 |
| 21 | `@coze-arch/fetch-stream` | 流式请求 |
| 22 | `@coze-arch/foundation-sdk` | Foundation SDK |
| 23 | `@coze-arch/hooks` | 通用 Hooks |
| 24 | `@coze-arch/i18n` | 国际化 |
| 25 | `@coze-arch/idl` | 接口定义 |
| 26 | `@coze-arch/load-remote-worker` | 远程 Worker 加载 |
| 27 | `@coze-arch/logger` | 日志系统 |
| 28 | `@coze-arch/pdfjs-shadow` | PDF.js Shadow |
| 29 | `@coze-arch/report-events` | 事件上报 |
| 30 | `@coze-arch/report-tti` | TTI 上报 |
| 31 | `@coze-arch/responsive-kit` | 响应式工具 |
| 32 | `@coze-studio/slardar-adapter` | Slardar 适配器 |
| 33 | `@coze-studio/slardar-interface` | Slardar 接口 |
| 34 | `@coze-arch/tea` | TEA 核心 |
| 35 | `@coze-studio/tea-adapter` | TEA 适配器 |
| 36 | `@coze-studio/tea-interface` | TEA 接口 |
| 37 | `@coze-arch/utils` | 通用工具 |
| 38 | `@coze-arch/web-context` | Web 上下文 |

---

> **维护提示**：架构层是整个前端应用的基石，任何变更都需要经过充分的评审和测试。建议在修改前先阅读相关包的 README 文档，了解其设计意图和使用约定。
