# UI 组件

`@coze-common/chat-uikit` 提供了构建聊天界面所需的所有 UI 组件。它与 SDK 解耦，通过 Context 和 Props 接收数据。

## 目录结构

```
frontend/packages/common/chat-area/chat-uikit/src/
├── components/
│   ├── chat/           # 业务相关组件 (Input, Upload等)
│   ├── common/         # 通用基础组件
│   ├── contents/       # 消息内容渲染器 (Text, Image, File)
│   └── md-box-slots/   # Markdown 渲染插槽
├── context/            # 状态管理
└── utils/              # 工具函数
```

## 关键组件

### 1. TextContent (文本消息)

负责渲染 Markdown 格式的文本消息。

**源码路径**: `frontend/packages/common/chat-area/chat-uikit/src/components/contents/text-content/index.tsx`

**特点**:
- 使用 `LazyCozeMdBox` 进行 Markdown 渲染（懒加载优化）。
- 支持流式输出效果（`showIndicator`, `smooth` 属性）。
- 自定义渲染插槽（Image, Link）。
- 支持文本截断（`broken_pos`）。

```typescript
export const TextContent: FC<IMessageContentProps> = props => {
  // ...
  const isStreaming = !message.is_finish;
  
  return (
    <div className="chat-uikit-text-content">
      <MdBoxLazy
        markDown={text}
        autoFixSyntax={{ autoFixEnding: isStreaming }} // 自动修复流式传输中未闭合的 Markdown 标签
        showIndicator={isStreaming} // 显示光标
        // ...
      />
    </div>
  );
};
```

### 2. MessageBox (消息框)

**源码路径**: `frontend/packages/common/chat-area/chat-uikit/src/components/common/message-box/index.tsx`

它是聊天气泡的容器，负责：
- 区分发送者（User/Bot）的布局。
- 展示头像、名称、时间戳。
- 渲染操作栏（复制、删除、反馈）。
- 容纳具体的 Content 组件（TextContent, ImageContent 等）。

### 3. Context 管理

**UIKitMessageBoxContext**
**源码路径**: `frontend/packages/common/chat-area/chat-uikit/src/context/message-box/index.tsx`

用于在消息组件树中共享配置和回调：
- `layout`: 布局模式。
- `eventCallbacks`: 点击图片、链接等交互的回调。
- `enableImageAutoSize`: 图片自适应配置。

```typescript
export const UIKitMessageBoxContext = createContext<UIKitMessageBoxContextProps>({});
```

## 渲染机制

UI Kit 采用"组件插槽"和"配置驱动"的模式。

1.  **Markdown 渲染**: 使用 `@coze-arch/bot-md-box-adapter`，并通过 `LazyCozeMdBox` 封装，支持自定义组件替换 Markdown 标准元素（如将 `<img>` 替换为 `CozeImage`）。
2.  **资源引用**: 自定义的 `CozeImage` 和 `CozeLink` 组件处理了资源加载、预览和安全检查（如 `forceHttps`）。

## 扩展性

通过 `UIKitCustomComponentsProvider`，宿主应用可以注入自定义组件来覆盖默认实现，从而实现高度定制化的聊天界面。
