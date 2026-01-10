# Monorepo 架构与构建系统

本文档详细说明 Coze Studio 前端项目的 Monorepo 架构设计、构建系统配置及开发工作流。

## 1. 项目概览

Coze Studio 前端采用基于 Rush.js 和 PNPM 的大规模 Monorepo 架构，支持数百个包的依赖管理和构建编排。

| 核心组件 | 版本/配置 | 说明 |
| --- | --- | --- |
| **架构模式** | Rush.js + PNPM | 微软 Rush 方案，适合大规模 Monorepo |
| **包管理器** | PNPM 8.15.8 | 高效的磁盘空间利用和依赖安装 |
| **构建工具** | Rsbuild 1.1.0 | 基于 Rspack 的高性能构建工具 |
| **前端框架** | React 18.2.0 | 核心 UI 库 |
| **语言** | TypeScript 5.8.2 | 全面启用严格模式 |
| **Monorepo 工具** | Rush 5.147.1 | 依赖分析、增量构建、并行执行 |
| **Runtime** | Node.js >= 21 | 开发环境要求 |
| **包规模** | ~260 个 Projects | 包含应用、库、工具、配置等 |

## 2. Rush.js 配置体系

Rush 是整个 Monorepo 的指挥中心，核心配置位于 `rush.json` 和 `common/config/rush` 目录。

### 核心配置 (`rush.json`)
- **Rush Version**: `5.147.1`
- **PNPM Version**: `8.15.8`
- **Node Version**: `>=21`
- **项目深度**: `3` 到 `6` 层，确保结构规范

### 项目标签系统 (Tags)
Rush 使用标签来对项目进行分类和筛选构建：
- **团队标签**: `team-arch` (架构), `team-studio` (Studio业务), `team-automation` (自动化), `team-data` (数据)
- **层级标签**: `level-1` (底层库) 到 `level-4` (应用层)
- **功能标签**: `rush-tools`, `core`, `phase-prebuild`

### 事件钩子 (Event Hooks)
- **postRushInstall**: 执行 `scripts/hooks/post-rush-install.sh`，用于安装后的环境准备。

## 3. PNPM 配置

PNPM 负责底层的依赖管理，配置位于 `common/config/rush/pnpm-config.json`。

- **Workspace 模式**: 启用 (`useWorkspaces: true`)
- **Peer Dependencies**: 自动安装 (`autoInstallPeers: true`)
- **环境变量**: 注入 `NODE_OPTIONS: --max-old-space-size=4096` 防止内存溢出
- **全局依赖覆盖 (Overrides)**:
  ```json
  "globalOverrides": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.8.2",
    "@coze-arch/coze-design": "0.0.7-alpha.985c0d"
  }
  ```
- **构建黑名单**: `canvas`, `better-sqlite3` (在全局层面禁止构建，可能使用预编译二进制)

## 4. Rush 实验性功能

在 `common/config/rush/experiments.json` 中开启了多项优化特性：

1. **冻结锁文件**: `usePnpmFrozenLockfileForRushInstall` 和 `usePnpmPreferFrozenLockfileForRushUpdate` 设为 `true`，确保 CI/CD 环境依赖一致性。
2. **构建缓存**: `buildCacheWithAllowWarningsInSuccessfulBuild: true`，即使有警告也允许缓存构建结果。
3. **幽灵依赖防护**: `forbidPhantomResolvableNodeModulesFolders: true`，禁止访问未声明的依赖，增强安全性。

## 5. Rush 插件生态

通过 `common/config/rush/rush-plugins.json` 注册了多个自定义插件，扩展 Rush 能力：

- **`rush-init-project-plugin`**: 快速初始化新项目脚手架
- **`@coze-arch/rush-run-tsc-plugin`**: 优化的 TypeScript 类型检查插件
- **`@coze-arch/rush-publish-plugin`**: 发布流程管理
- **`@coze-arch/rush-fix-ts-refers-plugin`**: 自动修复 TS 项目引用
- **`@coze-arch/rush-increment-run-plugin`**: 增量运行优化
- **@coze-arch/rush-dep-level-check-plugin**: 依赖层级检查，防止架构腐化
- **@coze-arch/rush-clear-build-cache-plugin**: 清理构建缓存工具

## 6. Rsbuild 构建系统

主应用 (`apps/coze-studio`) 使用 Rsbuild (基于 Rspack) 进行构建，配置文件为 `rsbuild.config.ts`。

### 核心特性
- **开发服务器**:
  - 代理 `/api` 和 `/v1` 到 `localhost:8888`
  - 端口严格模式 (`strictPort: true`)
- **HTML 配置**: 注入 Title "扣子 Studio" 和 Favicon
- **插件集成**:
  - **Tailwind CSS**: 通过 `postcss` 工具链注入
  - **Import Watch**: 使用 `@coze-arch/import-watch-loader` 优化热更新
- **代码分割 (Split Chunks)**:
  - 策略: `split-by-size`
  - 范围: 3MB - 6MB (针对大型应用优化)
- **编译配置**:
  - Target: Web
  - 别名: 映射 `react-router-dom` 和 SDK
  - Defines: `IS_REACT18`, `TARO_ENV: 'h5'` (兼容层)

## 7. TypeScript 配置策略

TypeScript 配置采用分层继承结构，位于 `frontend/config/ts-config`：

1.  **`tsconfig.base.json`**:
    - 基础配置，启用 `composite` (项目引用) 和 `incremental` (增量编译)
    - 目标: `ES2018`
    - 严格模式: `strict: true`

2.  **`tsconfig.web.json`**:
    - 适用于 React 应用和组件库
    - 继承 base
    - `jsx: preserve` (留给构建工具处理)
    - `lib`: DOM, ESNext

3.  **`tsconfig.node.json`**:
    - 适用于 Node.js 工具和脚本
    - 继承 base
    - `module: NodeNext`

**Project References**: 项目间通过 `tsconfig.json` 的 `references` 字段建立关联，Rush 能够分析拓扑顺序进行构建。

## 8. 代码质量与规范工具

配置位于 `frontend/config` 目录，统一管理所有规范。

### ESLint (`frontend/config/eslint-config`)
- **Presets**:
  - `web`: React, Hooks, XSS 防护 (`eslint-plugin-risxss`)
  - `node`: Node.js 安全与最佳实践
  - `base`: 基础 TS/JS 规则
- **Restricted Imports**:
  - 禁止直接使用 `@douyinfe/semi-ui` (需使用封装后的 `@coze-arch/bot-semi`)
  - 禁止使用 `@edenx/*` 系列 (需迁移到新架构包)

### 样式规范
- **Stylelint**: `stylelint-config` (配置 BEM 命名规范等)
- **Prettier**: 全局统一格式化配置

### 测试
- **Vitest**: `vitest-config`
  - 单元测试框架，兼容 Jest API
  - 提供 `default`, `node`, `web` 三种预设

## 9. 样式系统

### Tailwind CSS
- **配置**: `frontend/apps/coze-studio/tailwind.config.ts`
- **Design Tokens**: 集成 `@coze-arch/semi-theme-hand01` 设计变量
- **响应式**: 使用 `@coze-arch/responsive-kit` 定义的断点
- **Preflight**: 关闭 (`preflight: false`) 以避免与现有组件库冲突

## 10. 构建命令 (Commands)

在 `common/config/rush/command-line.json` 中定义了标准化的工作流命令：

| 命令 | 类型 | 说明 |
| --- | --- | --- |
| `rush build` | bulk | 并行构建所有项目 |
| `rush test` | bulk | 并行运行测试 |
| `rush test:cov` | bulk | 运行测试并收集覆盖率 (增量) |
| `rush lint` | bulk | 并行 Lint 检查 (增量缓存) |
| `rush lint-staged` | global | 提交前检查 (Git Hook 调用) |
| `rush commit` | global | 使用 Commitizen 规范化提交 |
| `rush pre-build` | bulk | 仅构建 `phase-prebuild` 阶段的包 |

## 11. Git Hooks

位于 `common/git-hooks`：
- **pre-commit**: 触发 `lint-staged`，确保提交代码符合规范
- **commit-msg**: 触发 `commitlint`，确保 Commit Message 符合 Conventional Commits 规范

## 12. 开发工作流指南

1.  **环境准备**:
    ```bash
    npm install -g @microsoft/rush pnpm
    rush install  # 安装所有依赖
    rush build    # 执行全量构建
    ```

2.  **启动开发**:
    ```bash
    cd frontend/apps/coze-studio
    rushx dev     # 启动 Rsbuild 开发服务器
    # 或
    npm run dev
    ```

3.  **提交代码**:
    ```bash
    git add .
    rush commit   # 交互式填写提交信息
    ```

4.  **添加依赖**:
    ```bash
    # 在当前目录对应的项目中添加依赖
    rush add -p lodash
    # 添加 workspace 内的其他包作为依赖
    rush add -p @coze-arch/utils
    ```
