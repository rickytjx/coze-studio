# 测试基础设施

本文档详细介绍了 Coze Studio 前端项目的测试基础设施架构、配置规范及最佳实践。

## 概述

前端项目采用 [Vitest 3.0.5](https://vitest.dev/) 作为核心测试框架。为了在 Monorepo 架构下保持配置的一致性与可维护性，我们通过 `@coze-arch/vitest-config` 提供了三种标准化的预设配置，分别适用于不同的测试场景。

## 测试框架

核心技术栈版本如下：

- **测试运行器**: `Vitest 3.0.5`
- **React 组件测试**: `@testing-library/react 14.1.2`
- **DOM 断言**: `@testing-library/jest-dom 6.1.5`
- **代码覆盖率**: `@vitest/coverage-v8 3.0.5`
- **DOM 环境**: `happy-dom 12.10.3`

## 测试配置架构

所有包的测试配置均统一继承自 `@coze-arch/vitest-config`。

### 三种预设 (Presets)

1.  **default**: 基础配置
    - 适用于纯 JS/TS 库
    - 采用 Fork 模式执行测试
2.  **node**: Node.js 环境优化
    - 继承自 default
    - 针对后端逻辑或工具库优化
3.  **web**: Web 前端环境
    - 继承自 default
    - 预置 `happy-dom` 模拟浏览器环境
    - 集成 React 插件，支持 JSX/TSX

### 关键配置特性

- **执行池 (Pool)**: 使用 `forks` 模式 (1-32 workers) 运行测试，确保隔离性与性能。
- **覆盖率 (Coverage)**: 使用 V8 provider，支持 `cobertura`, `text`, `html`, `clover`, `json` 等多种输出格式。
- **TypeScript 支持**: 内置 `vite-tsconfig-paths`，自动解析 `tsconfig.json` 中的路径别名。
- **Semi Design 兼容**: 提供 `fixSemi` 选项，解决组件库在测试环境下的兼容性问题。

### 配置示例

在项目的 `vitest.config.ts` 中引用：

```typescript
import { defineConfig } from '@coze-arch/vitest-config';

export default defineConfig(
  {
    dirname: __dirname,
    preset: 'web', // 'default' | 'node' | 'web'
    test: {
      setupFiles: ['./__tests__/setup.ts'],
      // 其他自定义配置
    },
  },
  {
    fixSemi: true, // 开启 Semi Design 兼容修复
  },
);
```

## 测试文件组织

为了保持项目结构清晰，测试文件遵循统一的命名与目录规范：

- **文件命名**: `*.test.ts`, `*.test.tsx`, `*.spec.ts`
- **测试目录**: `__tests__/` (建议位于模块根目录或功能子目录下)
- **快照目录**: `__snapshots__/` (自动生成)

### 典型目录结构

```
packages/workflow/variable/
├── src/
│   └── ...
├── __tests__/
│   ├── setup.ts                    # 全局测试设置
│   ├── create-container.ts         # DI 容器工厂
│   ├── workflow.mock.ts            # Mock 数据
│   ├── services/                   # 服务层测试
│   │   ├── variable-service.test.ts
│   │   └── __snapshots__/
│   └── components/                 # 组件层测试
│       └── variable-node.test.tsx
└── vitest.config.ts
```

## 全局测试设置 (setup.ts)

每个包应包含一个 `setup.ts` 文件，用于初始化全局环境、Mock 全局依赖等。

主要职责包括：
- **i18n Mock**: 模拟国际化翻译函数。
- **Feature Flags Mock**: 模拟功能开关配置。
- **UI 组件库 Mock**: 解决第三方组件库在测试环境中的渲染问题。
- **全局变量 Stub**: 设置 `IS_DEV_MODE`, `REGION` 等全局常量。

```typescript
// __tests__/setup.ts 示例
import 'reflect-metadata';

// Mock 国际化
vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: vi.fn((key) => key),
  },
}));

// Mock 功能开关
vi.mock('@coze-arch/bot-flags', () => ({
  getFlags: () => ({
    'bot.automation.encapsulate': true,
  }),
}));

// 设置全局变量
vi.stubGlobal('IS_DEV_MODE', true);
vi.stubGlobal('REGION', 'cn');
```

## 测试模式

### 1. 单元测试 (Utility Functions)

针对纯函数或工具类的测试。

```typescript
import { parseExpression } from '../expression-parser';

describe('expression-parser', () => {
  it('should parse string literal correctly', () => {
    const result = parseExpression('"hello"');
    expect(result).toEqual({ type: 'Literal', value: 'hello' });
  });
});
```

### 2. React Hook 测试

使用 `@testing-library/react` 的 `renderHook` 进行测试。

```typescript
import { renderHook } from '@testing-library/react';
import { useWorkflowNode } from '../useWorkflowNode';

it('should return node data', () => {
  const wrapper = ({ children }) => <MockProvider>{children}</MockProvider>;
  const { result } = renderHook(() => useWorkflowNode(), { wrapper });
  
  expect(result.current.id).toBe('node-1');
});
```

### 3. React 组件测试

测试组件渲染、交互及状态更新。

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldItem } from '../FieldItem';

test('renders field title', () => {
  render(<FieldItem title="Variable Name" />);
  expect(screen.getByText('Variable Name')).toBeInTheDocument();
});
```

### 4. Zustand Store 测试

测试状态管理逻辑。

```typescript
import { useUserStore } from '../store';

describe('UserStore', () => {
  beforeEach(() => {
    useUserStore.setState({ isSettled: false }, true); // 重置状态
  });

  it('should have correct default state', () => {
    expect(useUserStore.getState().isSettled).toBe(false);
  });
});
```

### 5. 快照测试

用于确保 UI 或复杂数据结构未发生意外变更。

```typescript
it('should match snapshot', () => {
  const { container } = render(<ComplexComponent />);
  expect(container).toMatchSnapshot();
});
```

### 6. API/Service 测试

Mock 外部 API 依赖，测试业务逻辑层的处理。

```typescript
import { workflowApi } from '@coze-arch/bot-api';

vi.mock('@coze-arch/bot-api', () => ({
  workflowApi: {
    GetHistorySchema: vi.fn(),
  },
}));

it('should fetch history schema', async () => {
  vi.mocked(workflowApi.GetHistorySchema).mockResolvedValue({ data: [] });
  await service.fetchHistory();
  expect(workflowApi.GetHistorySchema).toHaveBeenCalled();
});
```

## Mock 策略

Vitest 提供了强大的 Mock 能力：

- **vi.mock**: 模拟整个模块。
- **vi.fn**: 模拟单个函数，可用于断言调用情况。
- **vi.spyOn**: 监听对象方法调用。
- **vi.stubGlobal**: 模拟全局变量。

对于 `localStorage` 等浏览器 API，建议在 `beforeEach` 中进行清理或 Mock。

```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

## 依赖注入测试

工作流引擎（`@coze-workflow/*`）使用 InversifyJS 进行依赖注入。测试时通过 `createContainer` 工厂函数创建独立的容器实例，绑定 Mock 服务。

```typescript
// __tests__/create-container.ts
import { Container } from 'inversify';
import { VariableService } from '../services/variable.service';

export function createContainer() {
  const container = new Container();
  container.bind(VariableService).toSelf();
  return container;
}

// 在测试中使用
const container = createContainer();
const service = container.get(VariableService);
```

## 测试数据与 Fixtures

避免在测试用例中硬编码大量数据。应建立专门的 Mock 数据文件：

- `workflow.mock.ts`
- `variable.mock.ts`
- `node.mock.tsx`

```typescript
// __tests__/workflow.mock.ts
export const mockNodeData = {
  id: '123',
  data: {
    type: 'variable',
    inputs: [],
  },
};
```

## 代码覆盖率

覆盖率配置已在预设中定义，主要关注 `src` 目录下的 TS/TSX 文件。

- **Include**: `src/**/*.ts(x)`
- **Provider**: `v8`
- **Reporters**: `cobertura` (CI), `text` (CLI), `html` (本地查看)

## 测试脚本

在包根目录下运行：

```bash
# 运行所有测试
rushx test

# 运行测试并生成覆盖率报告
rushx test:cov

# 监听模式运行测试
rushx test --watch
```

## 高级特性

- **清理机制**: 善用 `beforeEach` 和 `afterEach` 清理 DOM、Mock 状态及 Timer。
- **异步测试**: 使用 `async/await` 测试异步逻辑，必要时使用 `vi.useFakeTimers()` 控制时间。
- **中文描述**: 测试描述支持中文，便于理解业务场景。

## 最佳实践

1.  **使用预设**: 始终优先使用 `@coze-arch/vitest-config` 提供的预设，避免自行编写冗余配置。
2.  **集中管理 Setup**: 将通用的 Mock 逻辑放入 `setup.ts`，保持测试文件简洁。
3.  **Mock 工厂模式**: 对于复杂的 Mock 对象，使用工厂函数生成，避免状态污染。
4.  **快照慎用**: 快照测试适用于组件结构对比，但避免滥用，以免生成难以维护的大型快照文件。
5.  **资源清理**: 确保每个测试用例执行后不遗留副作用（如全局变量修改、未清除的 Timer）。
