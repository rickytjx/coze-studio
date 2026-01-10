# Studio Layer 架构文档

Studio Layer 是 Coze Studio 前端的**核心业务层**，负责承载具体的业务逻辑实现。该层通过组合各个基础设施层（Foundation, Arch）的能力，提供完整的工作空间管理、状态管理、插件系统、Mock 数据编辑以及开放平台集成等功能。

## 1. 概述

Studio Layer 包含约 29 个 Rush 项目（以 `rush.json` 中 `frontend/packages/studio/*` 前缀统计），是业务逻辑最密集的区域。它向下依赖 `arch` 和 `foundation` 层，向上支撑 `frontend/apps/coze-studio` 应用层。

**核心职责：**
*   **工作空间管理**：提供 IDE 的整体布局、菜单、项目管理。
*   **状态管理**：复杂的 Bot 编辑状态管理（Zustand + Immer）。
*   **插件系统**：插件配置、表单适配、工具列管理。
*   **Mock 数据**：提供 Mock 数据的编辑器和管理功能。
*   **开放平台**：集成 Chat SDK、OAuth 认证、环境适配。

## 2. 包分类结构

Studio Layer 的包主要分布在 `frontend/packages/studio/` 目录下，按功能领域划分：

### 2.1 Workspace (工作空间)
负责 IDE 的整体框架和项目管理流程。
*   `workspace/entry-base`: 核心业务入口，包含布局 (Layout)、头部 (Header)、工具栏 (Tool) 等核心 UI 框架。
*   `workspace/entry-adapter`: 菜单和路由的适配层。
*   `workspace/project-entity-base`: 项目实体的基础 CRUD 逻辑。
*   `workspace/project-entity-adapter`: 项目实体的适配器。
*   `workspace/project-publish`: 发布流程管理。

### 2.2 Stores (状态管理)
负责复杂的业务状态管理，特别是 Bot 编辑器状态。
*   `stores/bot-detail`: Bot 详情页的核心 Store，聚合了 Persona, Skill, Model 等 11 个子 Store。
*   `stores/bot-plugin`: 插件相关的状态管理。
*   `user-store`: 用户信息管理。

### 2.3 Plugin (插件系统)
负责插件的配置与展示。
*   `plugin-shared`: 插件系统的共享类型定义。
*   `plugin-form-adapter`: 插件配置表单的适配器。
*   `plugin-tool-columns`: 工具列配置管理。
*   `plugin-tool-columns-adapter`: 工具列适配器。
*   `plugin-publish-ui-adapter`: 发布 UI 的插件适配。

### 2.4 Mockset (Mock 数据)
负责 Mock 数据的编辑功能。
*   `mockset-shared`: 共享模块 (如 json-schema 定义)。
*   `mockset-editor`: 基于 Monaco Editor 的 Mock 数据编辑器。
*   `mockset-editor-adapter`: 编辑器适配器。
*   `mockset-edit-modal-adapter`: 编辑弹窗适配器。

### 2.5 Open Platform (开放平台)
负责对外能力开放和 SDK 集成。
*   `open-auth`: OAuth 认证流程与 Token 管理。
*   `open-chat`: Coze Web ChatApp SDK (包含 BuilderChat, Layout)。
*   `open-env-adapter`: 运行时环境适配。
*   `chat-app-sdk`: 独立发布的 SDK 包 (使用 Rspack 构建，支持多区域)。

### 2.6 其他核心模块
*   `autosave`: 自动保存管理器。
*   `bot-utils`: Bot 相关的通用工具函数。
*   `components`: Studio 层专用的 UI 组件库。
*   `premium/`: 付费/高级功能相关的适配器 (store-adapter, components-adapter)。

## 3. 核心模块深度分析

### 3.1 Workspace 工作空间管理
`workspace-base` 是整个 Studio 的心脏。它不仅组织了页面的基本结构（Layout, Header），还负责初始化核心上下文。
*   **Layout**: 定义了左侧侧边栏、顶部导航和主内容区域的布局。
*   **MocksetDetail**: 集成了 Mock 数据的详情展示。
*   **Plugin & Tool**: 动态加载和渲染插件及工具栏。

### 3.2 Stores 状态管理 (BotDetailStore)
`bot-detail-store` 采用了**分片 (Slicing) + 聚合**的模式，以应对 Bot 编辑器极高的状态复杂度。

*   **架构模式**:
    *   **Root Store**: `useBotDetailStoreSet` 作为入口，聚合了所有子 Store。
    *   **Sub-Stores**: 拆分为 `Persona`, `Model`, `BotSkill`, `BotInfo`, `Collaboration` 等 11 个独立的 Slice。
    *   **中间件**: 使用 `subscribeWithSelector` 实现细粒度的状态订阅，优化渲染性能。
    *   **Immer**: 集成 Immer 实现不可变数据的简便更新。
    *   **Setter Factory**: 封装统一的 Setter 逻辑，减少样板代码。

*   **BotPluginStore**:
    *   结合了 Context 和 Global Store 的混合模式。
    *   `BotPluginStoreProvider` 提供局部状态隔离。
    *   `usePluginStore` 支持 shallow 比较，防止不必要的重渲染。

### 3.3 Plugin 插件系统
插件系统设计为高度可扩展的适配器模式。
*   **配置化**: `plugin-tool-columns` 通过配置定义工具列的展示项。
*   **适配器**: `form-adapter` 允许不同的表单实现（如不同 UI 库）接入统一的插件配置协议。

### 3.4 Mockset 数据编辑器
*   **核心**: 基于 `monaco-editor` 实现，提供代码高亮、格式化和 JSON Schema 校验。
*   **共享**: `mockset-shared` 定义了数据模型和 Schema 标准，确保前后端校验一致性。

### 3.5 Open Platform & Chat SDK
*   **SDK 构建**: `chat-app-sdk` 是一个特殊的包，它不直接作为应用的一部分运行，而是被构建为独立的 SDK 产物。
    *   使用 **Rspack** 进行高性能构建。
    *   支持多区域配置。
*   **Auth**: `open-auth` 处理复杂的 OAuth2 流程，维护 Token 生命周期。

### 3.6 Autosave 自动保存
自动保存是编辑器的关键特性，保证用户数据不丢失。
*   **AutosaveManager**: 核心类，实现了 Observer 模式。
*   **机制**:
    *   **Deep Diff**: 实时计算状态差异。
    *   **Debounce**: 防抖处理，减少 API 请求频率。
    *   **队列管理**: 确保保存请求按序执行，处理失败重试。

## 4. 架构模式总结

1.  **分层架构 (Layered Architecture)**:
    *   遵循 `Base` (核心逻辑) -> `Adapter` (适配层) -> `Application` (应用组装) 的依赖方向。
    *   Base 包不依赖具体的 UI 库实现细节，只定义核心逻辑和接口。

2.  **Context Provider 模式**:
    *   广泛使用 React Context 将 Store 注入组件树，实现模块间的解耦。

3.  **适配器模式 (Adapter Pattern)**:
    *   大量的 `*-adapter` 包表明架构设计上极度重视可替换性和扩展性。例如，项目实体、编辑器、发布流程都通过适配器接入。

## 5. 技术栈概览

*   **框架**: React 18.2.0
*   **状态管理**: Zustand 4.4.7 (配合 Immer 10.0.3)
*   **构建工具**: Rspack (用于 SDK), Rush (Monorepo 管理)
*   **编辑器**: Monaco Editor
*   **拖拽**: react-dnd 16.0.1
*   **工具库**: deep-diff (差异计算), reselect (选择器缓存), dayjs (时间处理)
