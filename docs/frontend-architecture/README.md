# Coze Studio 前端架构文档

本文档旨在提供 Coze Studio 前端架构的全面概览，帮助开发者理解系统的整体设计、核心技术栈以及各模块之间的关系。

## 1. 项目概览

Coze Studio 是一个专业的 AI Agent 开发平台，其前端应用构建于现代 Web 技术栈之上，旨在提供高性能、可扩展且用户体验卓越的开发环境。

- **核心定位**: AI Agent 集成开发环境 (IDE)
- **技术基础**: React 18 + TypeScript 5.8.2
- **架构模式**: 基于 Rush.js + PNPM 的 Monorepo 架构 (包含 259+ 个包)
- **构建系统**: Rsbuild 1.1.0 (基于 Rspack 的高性能构建工具)
- **主应用入口**: `frontend/apps/coze-studio`

### 快速启动命令

```bash
# 1. 安装依赖 (在仓库根目录)
rush install

# 2. 启动开发服务器
cd frontend/apps/coze-studio
rushx dev
```

## 2. 关键技术栈

我们选用了业界成熟且高性能的技术组合来支撑复杂的业务场景：

| 领域 | 技术方案 | 说明 |
|------|----------|------|
| **UI 框架** | React 18, Semi Design, Custom Coze Design | 结合 Semi Design 基础组件与 Coze 定制设计系统 |
| **语言** | TypeScript 5.8.2 | 全面使用 TypeScript 保证代码类型安全 |
| **状态管理** | Zustand 4.4.7, Immer | 轻量级、高性能的全局状态管理方案 |
| **样式方案** | Tailwind CSS, Less, CSS Modules | 原子化 CSS 与模块化 CSS 结合，兼顾开发效率与样式隔离 |
| **构建工具** | Rsbuild (Rspack) | 极速的开发与构建体验 |
| **测试框架** | Vitest 3.0.5 | 兼容 Jest API 的高性能单元测试框架 |
| **国际化** | i18next | 完善的多语言支持体系 |

## 3. 包结构分类

项目采用分层架构，主要包分类如下（统计口径：各目录下 `package.json` 文件数量）：

- **packages/arch/** (37 个包): 架构基础设施层，提供底层核心能力。
- **packages/common/** (30 个包): 通用组件层，包含业务无关的基础 UI 和逻辑组件。
- **packages/foundation/** (16 个包): 基础服务层，提供应用级的基础服务。
- **packages/studio/** (29 个包): Studio核心业务层，实现编辑器、插件等核心功能。
- **packages/workflow/** (21 个包): 工作流引擎层，负责流程编排与执行。
- **packages/agent-ide/** (48 个包): Agent IDE 层，AI Agent 集成开发环境。
- **packages/data/** (23 个包): 数据层，知识库、数据库与变量管理系统。

## 4. 文档目录导航

以下文档详细阐述了架构的各个方面：

| 序号 | 文档名称 | 说明 |
|:----:|----------|------|
| 01 | [Monorepo架构与构建系统](./01-monorepo-structure.md) | 详解 Rush.js 配置、依赖管理及 Rsbuild 构建流程 |
| 02 | [架构基础设施层](./02-arch-layer.md) | `packages/arch` 核心模块设计与底层能力解析 |
| 03 | [通用组件层](./03-common-layer.md) | `packages/common` 组件库设计与使用规范 |
| 04 | [基础服务层](./04-foundation-layer.md) | `packages/foundation` 基础服务与工具库介绍 |
| 05 | [Studio核心业务层](./05-studio-layer.md) | `packages/studio` 核心业务逻辑与模块划分 |
| 06 | [工作流引擎层](./06-workflow-layer.md) | `packages/workflow` 编排引擎与节点实现机制 |
| 07 | [主应用架构](./07-main-app.md) | `apps/coze-studio` 应用入口、路由与启动流程 |
| 08 | [状态管理模式](./08-state-management.md) | 基于 Zustand 的全局状态设计与最佳实践 |
| 09 | [UI组件系统](./09-ui-components.md) | Design System 实现、主题定制与样式管理 |
| 10 | [API与数据获取](./10-api-data-fetching.md) | 网络请求封装、接口管理与数据缓存策略 |
| 11 | [测试基础设施](./11-testing.md) | 单元测试、集成测试配置与编写指南 |
| 12 | [依赖关系图谱](./12-dependency-graph.md) | 模块间依赖关系可视化与分层原则 |
| 13 | [Agent IDE层](./13-agent-ide-layer.md) | `packages/agent-ide` AI Agent 集成开发环境模块 |
| 14 | [数据层](./14-data-layer.md) | `packages/data` 知识库、数据库与变量管理系统 |

---

> **注意**: 本文档体系旨在保持架构的透明性与可维护性。在进行重大架构变更时，请同步更新相关文档。
