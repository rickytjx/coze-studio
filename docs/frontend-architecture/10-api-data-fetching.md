# API 与数据获取架构

Coze Studio 采用基于 **Axios** 和 **Thrift IDL** 的分层 API 架构，通过 TypeScript 强类型定义、统一的错误处理机制和适配器模式，为上层业务提供稳定可靠的数据交互能力。

## 核心架构概览

整体架构分为四层，从底层的 HTTP 客户端到上层的具体业务服务：

```mermaid
graph TD
    App[React 应用层] --> Service[业务 API 层 (@coze-arch/bot-api)]
    Service --> HTTP[HTTP 客户端层 (@coze-arch/bot-http)]
    Service -.-> IDL[IDL 类型定义 (@coze-arch/idl)]
    HTTP --> Axios[Axios Instance]
    App --> WebSocket[WebSocket (@coze-common/websocket-manager-adapter)]
    App --> Uploader[文件上传 (@coze-studio/uploader-adapter)]
```

## 1. 基础 HTTP 层 (@coze-arch/bot-http)

基础层负责处理所有 HTTP 请求的通用逻辑，包括拦截器、错误标准化和事件分发。

### 核心特性

- **预配置 Axios 实例**：统一的超时、Header 配置
- **CSRF 防护**：自动注入 `x-requested-with` 和 `content-type`
- **错误标准化**：将 HTTP 错误转换为 `ApiError` 对象
- **事件总线**：基于事件的全局错误处理（如 401 跳转）

### 错误处理机制

系统定义了统一的 `ApiError` 类和错误码枚举：

```typescript
// 错误码定义
export enum ErrorCodes {
  NOT_LOGIN = 700012006,
  COUNTRY_RESTRICTED = 700012015,
  COZE_TOKEN_INSUFFICIENT = 702082020,
}

// ApiError 类
export class ApiError extends AxiosError {
  code: string;
  msg: string;
  hasShowedError: boolean;
  type: string;
}
```

全局拦截器会自动处理特定的业务错误代码：

```typescript
// 响应拦截器示例
axiosInstance.interceptors.response.use(
  response => {
    const { code, msg } = response.data;
    if (code !== 0) {
      // 抛出标准化错误
      const apiError = new ApiError(String(code), msg, response);
      
      // 分发特定错误事件
      if (code === ErrorCodes.NOT_LOGIN) {
        emitAPIErrorEvent(APIErrorEvent.UNAUTHORIZED, apiError);
      }
      
      return Promise.reject(apiError);
    }
    return response;
  }
);
```

## 2. 业务 API 层 (@coze-arch/bot-api)

业务层封装了具体的后端服务调用，提供了自动化的错误提示和类型安全。

### 服务实例化

所有服务基于生成的 IDL 定义进行实例化，并注入底层的 `axiosInstance`：

```typescript
import DeveloperApiService from './idl/developer_api';
import { axiosInstance } from './axios';

export const DeveloperApi = new DeveloperApiService({
  request: (params, config) => axiosInstance.request({ ...params, ...config }),
});
```

### 自动错误提示 (Toast)

默认情况下，业务层会自动捕获 API 错误并弹出 Toast 提示。可以通过配置禁用此行为：

```typescript
// 禁用自动错误提示
await DeveloperApi.getBotList(params, {
  __disableErrorToast: true
});
```

### 常用服务

| 服务名称 | 导出对象 | 用途 |
|---------|---------|------|
| Developer Service | `DeveloperApi` | Bot 管理、发布、配置 |
| Playground Service | `PlaygroundApi` | 调试预览、对话测试 |
| Knowledge Service | `KnowledgeApi` | 知识库管理、文档上传 |
| Workflow Service | `workflowApi` | 工作流编排、节点管理 |
| Product Service | `ProductApi` | 产品相关业务 |

## 3. 认证与令牌管理

认证逻辑由 `TokenManager` 统一管理，支持 API Key 和 OAuth Token。

### TokenManager

位置：`packages/common/chat-area/chat-core/src/credential/token-manager.ts`

```typescript
export default class TokenManager {
  // 获取 Bearer 格式的认证头
  getApiKeyAuthorizationValue() {
    return `Bearer ${this?.getApiKey()}`;
  }
  
  // 更新 Token
  updateApiKey(newToken: string) {
    // ...
  }
}
```

### 注入方式

1. **全局拦截器**：通过 `addGlobalRequestInterceptor` 在请求头中注入 Authorization
2. **ChatSDK**：在初始化时自动配置请求钩子
3. **流式请求**：在 `HttpChunk` 中直接构建包含 Token 的 Headers

## 4. WebSocket 实时通信

位置：`packages/common/websocket-manager-adapter`

用于处理实时消息、状态更新和异步任务通知。

### 使用方式

```typescript
import webSocketManager from '@coze-common/websocket-manager-adapter';

// 1. 创建连接
const connection = webSocketManager.createConnection({
  biz: 'EditorPic', // 业务标识
  service: serviceID,
});

// 2. 监听消息
connection.addEventListener('message', (data) => {
  console.log('Received:', data);
});

// 3. 发送消息
connection.send({ type: 'ping' });

// 4. 销毁连接
connection.destroy();
```

## 5. 文件上传适配器

位置：`packages/common/uploader-adapter`

封装了字节跳动内部的 `tt-uploader`，提供统一的上传接口，自动处理国内外节点路由。

### 使用方式

```typescript
import { getUploader } from '@coze-studio/uploader-adapter';

// 1. 获取上传器实例
const uploader = getUploader({
  userId: '...',
  appId: 123456,
  // ...其他配置
}, isOversea); // 支持海外节点自动切换

// 2. 添加文件
const fileKey = uploader.addFile({
  file: blobObject,
  stsToken: token, // 阿里云 STS Token
});

// 3. 监听进度和结果
uploader.on('progress', (info) => {
  console.log(`Progress: ${info.percent}%`);
});

uploader.on('complete', (info) => {
  console.log('Upload success:', info.uploadResult);
});

// 4. 开始上传
uploader.start(fileKey);
```

## 最佳实践

1. **优先使用 SDK**：始终优先使用 `@coze-arch/bot-api` 导出的服务实例，而不是直接使用 axios。
2. **类型安全**：利用 TypeScript 类型提示，避免手动定义请求/响应结构。
3. **错误处理**：
   - 一般错误让全局 Toast 处理。
   - 特殊业务错误使用 `try-catch` 捕获并设置 `__disableErrorToast: true`。
4. **流式数据**：对于对话等流式响应，使用 `fetch-stream` 或 `HttpChunk` 机制（ChatSDK 内部封装）。
5. **资源清理**：使用 WebSocket 或 Uploader 时，务必在组件卸载时调用 `destroy` 或 `close` 方法。
