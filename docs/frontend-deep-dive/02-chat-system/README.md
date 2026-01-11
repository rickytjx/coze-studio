# Coze Studio 聊天系统深度分析

## 概览

Coze Studio 的聊天系统是一个高度模块化、分层的架构，旨在支持复杂的 AI 对话场景。核心逻辑与 UI 表现层分离，通过明确定义的接口和事件机制进行通信。

系统主要由两个核心包组成：

| 包名 | 路径 | 职责 |
|------|------|------|
| `@coze-common/chat-core` | `frontend/packages/common/chat-area/chat-core` | 负责聊天核心逻辑、状态管理、流式数据处理、插件系统。不包含任何 UI 代码。 |
| `@coze-common/chat-uikit` | `frontend/packages/common/chat-area/chat-uikit` | 提供基于 React 的聊天 UI 组件库，消费 `chat-core` 提供的能力。 |

## 架构概览

```mermaid
graph TD
    App[Coze Studio App] --> UIKit[Chat UI Kit]
    UIKit --> Core[Chat Core SDK]
    
    subgraph "Chat Core SDK (@coze-common/chat-core)"
        SDK[ChatSDK (ChatCore)]
        MsgMgr[Message Manager]
        ReqMgr[Request Manager]
        Stream[Stream Processor]
        Plugin[Plugin System]
        
        SDK --> MsgMgr
        SDK --> ReqMgr
        SDK --> Stream
        SDK --> Plugin
    end
    
    subgraph "Chat UI Kit (@coze-common/chat-uikit)"
        ChatArea[Chat Area]
        MsgBox[Message Box]
        Input[Chat Input]
        
        ChatArea --> MsgBox
        ChatArea --> Input
    end
```

## 核心模块

### 1. Chat Core SDK
位于 `frontend/packages/common/chat-area/chat-core/`。
这是聊天系统的"大脑"，处理所有非 UI 逻辑：
- **会话管理**：创建、销毁、恢复会话。
- **消息管理**：发送、接收、历史记录、删除、撤回。
- **流式处理**：处理基于 SSE 协议的事件流（由 `@coze-arch/fetch-stream` 解析），增量更新消息内容。
- **插件系统**：支持上传、断点续聊等扩展功能。

### 2. Chat UI Kit
位于 `frontend/packages/common/chat-area/chat-uikit/`。
提供了一套完整的聊天界面组件：
- **消息渲染**：支持 Markdown、代码块、图片、文件等多种消息类型。
- **交互组件**：输入框、语音录制、文件上传。
- **状态管理**：基于 Context 的状态共享。

## 文档导航

1. [Chat Core SDK 详解](./01-chat-core.md) - 深入了解 SDK 核心类与 API。
2. [插件架构](./02-plugin-architecture.md) - 学习如何扩展聊天系统功能。
3. [流式数据处理](./03-streaming.md) - 基于 SSE 协议的事件流处理机制。
4. [UI 组件](./04-ui-components.md) - 探索 UI 组件的实现与复用。
5. [事件流映射表](./05-event-flow-mapping.md) - SDK 事件体系和状态机。
