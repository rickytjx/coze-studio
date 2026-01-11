# 插件架构

Chat Core 提供了一个轻量级的插件系统，用于处理文件上传等特定业务逻辑。当前实现主要对 `upload-plugin` 做了显式支持。

## 核心服务：PluginsService

`PluginsService` 负责插件的注册和检索。

### 源码路径
`frontend/packages/common/chat-area/chat-core/src/chat-sdk/services/plugins-service.ts`

```typescript
export class PluginsService {
  UploadPlugin: UploadPluginConstructor<any> | null = null;
  // ...

  registerPlugin<T extends PluginKey, P extends Record<string, unknown>>(
    key: T,
    plugin: PluginValue<T, P>,
    constructorOptions?: P,
  ) {
    if (key === 'upload-plugin') {
      this.UploadPlugin = plugin;
      this.uploadPluginConstructorOptions = constructorOptions || {};
    }
  }

  getRegisteredPlugin(key: PluginKey) {
    // ...
  }
}
```

目前系统主要对 `upload-plugin` 做了显式支持，这表明插件系统主要是为了解决核心 SDK 与具体业务场景（如文件上传实现）解耦的问题。

## 相关插件包：ResumePlugin (断点续聊)

`plugin-resume` 包提供了断点续聊功能的实现。注意：该插件使用了不同于 `PluginsService` 的扩展机制（基于 `WriteableChatAreaPlugin` 基类）。

### 源码路径
`frontend/packages/common/chat-area/plugin-resume/src/plugin.ts`

```typescript
import {
  PluginMode,
  PluginName,
  WriteableChatAreaPlugin,
} from '@coze-common/chat-area';

export class ResumePlugin extends WriteableChatAreaPlugin<unknown> {
  public pluginMode: PluginMode = PluginMode.Writeable;
  public pluginName: PluginName = PluginName.Resume;

  public lifeCycleServices = {
    messageLifeCycleService: new ResumeMessageLifeCycleService(this),
    renderLifeCycleService: new ResumeRenderLifeCycleService(this),
  };
}
```

### 生命周期钩子

插件通过 `LifeCycleService` 介入聊天的各个阶段。从 `ResumePlugin` 的结构可以看出，插件可以包含：

1.  **MessageLifeCycleService**: 处理消息数据的生命周期（发送前、接收后等）。
2.  **RenderLifeCycleService**: 处理 UI 渲染相关的逻辑，与 Chat UI Kit 配合使用。

## 插件注册 (PluginsService)

`PluginsService` 当前仅对 `upload-plugin` 做了特殊处理（见 `:22-25`）。注册其他类型插件需要扩展 `PluginKey` 类型定义并更新 `PluginsService` 实现。

```typescript
// frontend/packages/common/chat-area/chat-core/src/chat-sdk/services/plugins-service.ts (摘录)
// 当前仅支持 'upload-plugin' 的注册
chatCore.registerPlugin('upload-plugin', UploadPlugin, {
  // 插件配置
});
```
