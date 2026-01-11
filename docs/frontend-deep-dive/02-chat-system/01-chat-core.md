# Chat Core SDK 详解

`@coze-common/chat-core` 是聊天系统的核心逻辑层，负责管理对话状态、网络请求和事件分发。

## 核心类：ChatSDK (ChatCore)

`ChatSDK` (导出为 `ChatCore`) 是 SDK 的入口点，采用单例模式管理（基于 `bot_id` 或 `preset_bot`）。

### 源码路径
`frontend/packages/common/chat-area/chat-core/src/chat-sdk/index.ts`

### 初始化

```typescript
// 实例化 ChatSDK
const chatCore = new ChatCore({
  bot_id: 'bot_123',
  conversation_id: 'conv_456',
  user: 'user_789',
  tokenManager: new TokenManager({ ... }),
  // ...其他配置
});
```

### 关键属性与服务

`ChatSDK` 内部聚合了多个专门的服务来处理不同领域的逻辑：

| 服务/属性 | 类型 | 描述 |
|-----------|------|------|
| `sendMessageService` | `SendMessageService` | 负责消息发送，包括预发送处理。 |
| `messageManagerService` | `MessageManagerService` | 负责历史消息获取、清除、删除等。 |
| `httpChunkService` | `HttpChunkService` | 处理流式响应事件监听。 |
| `createMessageService` | `CreateMessageService` | 工厂方法，用于创建不同类型的消息对象。 |
| `pluginsService` | `PluginsService` | 管理插件注册与获取。 |

### 核心 API

#### 发送消息
```typescript
sendMessage(
  message: Message<ContentType>,
  options?: SendMessageOptions,
): Promise<Message<ContentType>>
```
调用 `sendMessageService` 发送消息，支持流式响应。

#### 创建消息
```typescript
createTextMessage(text: string): Message<ContentType.Text>
createImageMessage(props: ImageMessageProps): Message<ContentType.Image>
createFileMessage(props: FileMessageProps): Message<ContentType.File>
```
使用 `createMessageService` 创建标准化的消息对象。

## Token 管理

`TokenManager` 负责管理 API 请求的认证凭据。

### 源码路径
`frontend/packages/common/chat-area/chat-core/src/credential/token-manager.ts`

```typescript
export class TokenManager {
  constructor(props: TokenManagerProps) {
    // ...
  }

  getApiKeyAuthorizationValue() {
    return `Bearer ${this?.getApiKey()}`;
  }
  
  // 支持动态刷新 Token
  updateToken(token: string) { ... }
}
```

## 消息管理 (MessageManager)

`MessageManager` 处理与消息持久化相关的操作，如获取历史记录、删除消息等。

### 源码路径
`frontend/packages/common/chat-area/chat-core/src/message/message-manager.ts`

### 功能列表

- `getHistoryMessage`: 获取历史消息列表，并自动进行数据转换（JSON 解析等）。
- `clearMessageContext`: 清除上下文（不仅是 UI 上的清除，也通知服务端）。
- `deleteMessage`: 删除指定消息。
- `reportMessage`: 消息反馈（点赞/点踩）。
- `chatASR`: 语音转文字。

```typescript
// 获取历史消息示例
async getHistoryMessage(props: GetHistoryMessageProps) {
  const res = await this.request.post(url, props);
  // 数据转换
  data.message_list = MessageManager.convertMessageList(data.message_list);
  return data;
}
```

## 事件系统

Chat Core 使用 `EventEmitter` 进行事件通信，支持强类型的事件定义。

### 源码路径
`frontend/packages/common/chat-area/chat-core/src/chat-sdk/index.ts` (事件方法 `on()` 定义于此文件)

```typescript
// 监听事件
chatCore.on(ChatCore.EVENTS.MESSAGE_RECEIVED, (data) => {
  console.log('收到消息:', data);
});
```
