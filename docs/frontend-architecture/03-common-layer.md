# Frontend Architecture - Common Layer

## 概述
Common Layer (位于 `frontend/packages/common`) 是 Coze Studio 前端架构的核心支撑层，包含约 30 个 Rush 项目（以 `rush.json` 中 `frontend/packages/common/*` 前缀统计）。它向下封装基础库和适配层，向上为业务层提供可复用的核心模块和功能组件。

该层级的设计目标是高内聚、低耦合，通过清晰的模块划分和严格的依赖控制，确保核心功能的稳定性与扩展性。

## 核心模块

Common Layer 主要由以下六大核心系统组成：

### 1. Chat Area 生态系统 (14个包)
Chat Area 是 Coze Studio 中最核心的交互区域，负责处理所有的对话交互、消息流转和插件渲染。

*   **chat-core**: 核心 SDK。
    *   **核心功能**: 消息管理、通信通道抽象、插件系统内核、凭证管理。
    *   **关键技术**: `eventsource-parser` (处理 SSE 流), `web-streams-polyfill`。
    *   **主要导出**: `ChatCore`, `TokenManager`, `Message`, `ContentType`。
*   **chat-uikit**: UI 组件库。
    *   **基础**: 基于 `@douyinfe/semi-ui` 定制。
    *   **核心组件**: `MessageBox` (消息容器), `LazyCozeMdBox` (Markdown 渲染), `CozeImage` (图片处理)。
*   **chat-area**: 主容器。
    *   **功能**: 集成 chat-core 和 chat-uikit，提供完整的插件化聊天界面。
    *   **扩展性**: 提供 `ReadonlyChatAreaPlugin` 和 `WriteableChatAreaPlugin` 接口。
    *   **生命周期服务**: `App` (应用级), `Message` (消息级), `Command` (指令级), `Render` (渲染级)。
*   **插件生态 (8个)**:
    *   `plugin-chat-shortcuts`: 快捷指令支持 (`/` 唤起)。
    *   `plugin-chat-background`: 聊天背景定制。
    *   `plugin-message-grab`: 消息抓取/选择功能。
    *   `plugin-resume`: 会话状态恢复。
    *   `chat-answer-action`: 回答后的操作栏 (点赞、复制等)。
    *   `chat-area-plugin-reasoning`: 推理过程的可视化展示。
    *   `chat-workflow-render`: 工作流执行过程的渲染。
    *   `text-grab`: 文本选择与抓取。

### 2. FlowGram Adapter (3个包)
适配并封装 `@flowgram.ai` 引擎，支持工作流的画布编辑能力。

*   **common**: 通用适配层。
    *   **版本**: 基于 `@flowgram.ai` 0.1.28。
    *   **职责**: 抹平底层引擎差异，提供统一的 Event 和 Model 接口。
*   **fixed-layout-editor**: 固定布局编辑器。
    *   适用于结构化强、自动布局的场景。
*   **free-layout-editor**: 自由布局编辑器。
    *   适用于高自由度的画布编排。
    *   **表单系统**: 内置 `FormModelV2`, `Field`, `Form`，支持节点配置。
    *   **插件集成**: `auto-layout` (自动布局), `container` (容器节点), `lines` (连线), `snap` (吸附), `minimap` (小地图)。

### 3. Prompt Kit (3个包)
提供强大的 Prompt 编写与调试体验。

*   **base**: 基础层。
    *   基于 `@coze-editor/editor` 和 `@codemirror`。
    *   提供基础的文本编辑能力。
*   **adapter**: 适配层。
    *   处理不同业务场景下的 Prompt 格式转换。
*   **main**: 主包。
    *   **功能**: 提供完整的 Prompt 编辑器组件。
    *   **组件**: `PromptEditor` (编辑器), `PromptRecommend` (推荐提示), `NLPrompt` (自然语言优化)。

### 4. 认证与权限 (2个包)
*   **auth**: 权限核心逻辑。
    *   管理 Space (空间) 和 Project (项目) 维度的权限。
    *   定义角色类型 (Admin, Member, Viewer 等)。
*   **auth-adapter**: 权限适配层。
    *   连接后端鉴权接口与前端权限控制组件。

### 5. 上传系统 (2个包)
*   **uploader-interface**: 接口定义。
    *   定义统一的上传参数、进度回调和返回结构。
*   **uploader-adapter**: 上传适配。
    *   实现具体的上传策略 (S3, TOS 等) 和分片上传逻辑。

### 6. 其他核心包
*   **websocket-manager-adapter**: WebSocket 连接管理，支持心跳保活与断线重连。
*   **md-editor-adapter**: Markdown 编辑器适配，统一预览与编辑体验。
*   **editor-plugins**: 通用编辑器插件库。
*   **biz-components**: 高频业务组件。
    *   `Banner`: 顶部横幅。
    *   `PictureUpload`: 图片上传控件。
    *   `Parameters`: 参数配置面板。
*   **coze-mitt**: 全局事件总线。
    *   基于 `mitt` 库封装，提供类型安全的事件发布/订阅。
*   **assets**: 静态资源管理 (图标、图片、默认配置)。

## 依赖关系图

```mermaid
graph TD
    subgraph App Layer
        Studio[Studio App]
        IDE[Agent IDE]
    end

    subgraph Common Layer
        direction TB
        
        subgraph Chat_Ecosystem [Chat Area Ecosystem]
            ChatArea[chat-area]
            ChatCore[chat-core]
            ChatUI[chat-uikit]
            ChatPlugins[Plugins (x8)]
            
            ChatArea --> ChatCore
            ChatArea --> ChatUI
            ChatArea --> ChatPlugins
        end

        subgraph FlowGram_System [FlowGram Adapter]
            FlowCommon[common]
            FixedEd[fixed-layout-editor]
            FreeEd[free-layout-editor]
            
            FixedEd --> FlowCommon
            FreeEd --> FlowCommon
        end

        subgraph Prompt_System [Prompt Kit]
            PromptMain[main]
            PromptAdapter[adapter]
            PromptBase[base]
            
            PromptMain --> PromptAdapter
            PromptAdapter --> PromptBase
        end

        subgraph Infra_Utils
            Auth[Auth System]
            Upload[Upload System]
            WS[WebSocket Manager]
            Bus[Coze Mitt]
        end
    end

    Studio --> ChatArea
    Studio --> FlowGram_System
    Studio --> Prompt_System
    Studio --> Infra_Utils
    
    IDE --> ChatArea
    IDE --> Prompt_System
```

## 设计模式

Common Layer 的架构设计遵循以下主要模式：

1.  **Adapter Pattern (适配器模式)**
    *   大量使用 `*-adapter` 包 (如 `flowgram-adapter`, `auth-adapter`, `uploader-adapter`)。
    *   **目的**: 将第三方库 (FlowGram, CodeMirror) 或底层服务 (S3, WebSocket) 的接口转换为符合 Coze Studio 业务需求的统一接口，隔离底层变化。

2.  **Plugin Architecture (插件化架构)**
    *   主要应用于 `Chat Area` 和 `FlowGram Editor`。
    *   **实现**: 定义核心生命周期钩子，允许通过插件注入功能 (如快捷指令、背景定制、推理展示)。
    *   **优势**: 核心逻辑轻量化，业务功能解耦，易于扩展和维护。

3.  **Layered Architecture (分层架构)**
    *   典型体现于 `Prompt Kit`: `base` (基础能力) -> `adapter` (业务适配) -> `main` (完整功能)。
    *   确保每一层关注点分离，底层只关注技术实现，上层关注业务逻辑。

## 技术栈

*   **Core Framework**: React 18
*   **State Management**: Zustand 4.4.7 (轻量级状态管理)
*   **UI Library**: Semi Design 2.72.3 (基于字节跳动设计系统的组件库)
*   **Workflow Engine**: FlowGram 0.1.28 (流程编排引擎)
*   **Code Editor**: CodeMirror 6 (用于 Prompt 和代码编辑)
*   **Communication**: EventSource (SSE), WebSocket, Mitt (Event Bus)
