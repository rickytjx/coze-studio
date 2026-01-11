# Agent IDE 深度分析

## 概览

Agent IDE 是 Coze Studio 的核心模块，用于构建、调试和发布 AI Agent。它采用 **Monorepo** 架构，将功能模块拆分为 45+ 个独立的子包，通过 Rush + PNPM 进行统一管理。

这种架构设计遵循了 **适配器模式 (Adapter Pattern)** 和 **分层架构**，实现了高内聚、低耦合的代码组织。

## 核心架构设计

Agent IDE 的代码组织主要分为以下四层：

### 1. Entry Layer (入口层)
负责组装各个功能模块，对外暴露统一的 IDE 界面和 API。
- `agent-ide/entry`: 主入口包，导出 IDE 核心组件。
- `agent-ide/entry-adapter`: 提供 IDE 与宿主环境的集成适配。

### 2. Adapter Layer (适配器层)
连接业务逻辑与 UI 组件，或者将通用组件适配到具体的业务场景中。业务模块通过对应的 `*-adapter` 包提供适配实现。
- `agent-ide/bot-config-area-adapter`
- `agent-ide/plugin-setting-adapter`
- `agent-ide/layout-adapter`

### 3. Domain Layer (领域层)
实现具体的业务逻辑，如 Bot 编辑、提示词管理、工具配置等。
- **Bot 核心**: `bot-editor-context-store`, `bot-audit-base`, `bot-config-area`
- **Prompt**: `prompt`, `prompt-adapter`
- **Workflow**: `workflow`, `workflow-modal`
- **Plugin**: `plugin-shared`, `plugin-content`

### 4. Base Layer (基础层)
提供通用的工具函数、UI 组件和上下文管理。
- `agent-ide/commons`: 通用工具库。
- `agent-ide/context`: 全局上下文定义。
- `agent-ide/navigate`: 导航与路由管理。

## 模块清单

以下是 Agent IDE 的主要功能模块及其对应的源码路径：

| 模块 | 描述 | 关键包路径 |
|------|------|------------|
| **Bot Creator** | Bot 创建与配置向导 | `agent-ide/bot-config-area`, `agent-ide/bot-editor-context-store` |
| **Layout System** | 灵活的可拖拽布局系统 | `agent-ide/layout`, `agent-ide/layout-adapter` |
| **Navigation** | 侧边栏与路由导航 | `agent-ide/navigate` |
| **Prompt Editor** | 提示词编写与优化 | `agent-ide/prompt`, `agent-ide/prompt-adapter` |
| **Tool Config** | 插件与工具配置 | `agent-ide/tool`, `agent-ide/tool-config` |
| **Chat Debug** | 实时对话调试区域 | `agent-ide/chat-debug-area`, `agent-ide/chat-area-provider` |

## 技术栈

- **框架**: React 18, TypeScript
- **构建工具**: Rush, PNPM, Vite (部分)
- **状态管理**: Zustand（使用于 `bot-editor-context-store`）
- **UI 组件**: Semi Design
- **测试**: Vitest

## 文档导航

1. [Bot 创建流程](./01-bot-creator.md) - 深入了解 Bot 的初始化与配置流程。
2. [布局系统](./02-layout-system.md) - 解析 IDE 的多面板响应式布局实现。
3. [导航系统](./03-navigation.md) - 探索侧边栏与路由管理机制。
4. [工具配置](./04-tool-configuration.md) - 学习插件与工具的集成方式。
