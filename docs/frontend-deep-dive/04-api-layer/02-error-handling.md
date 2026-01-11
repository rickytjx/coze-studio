# 错误处理系统

前端 API 层的错误处理系统围绕 `ApiError` 类和事件总线构建，旨在将底层通信错误转化为可操作的业务信号。

## ApiError 类定义

`ApiError` 继承自 AxiosError，增加了业务特定的元数据，如错误码、是否已展示错误提示等。

```typescript
// frontend/packages/arch/bot-http/src/api-error.ts (摘录)
import { AxiosError, AxiosResponse } from 'axios';

export interface ApiErrorOptions {
  hasShowedError?: boolean;
}

export class ApiError extends AxiosError {
  hasShowedError: boolean; // 标记该错误是否已被 UI (如 Toast) 展示过，避免重复提示
  public raw?: any;        // 原始响应数据
  type: string;

  constructor(
    public code: string,
    public msg: string | undefined,
    response: AxiosResponse,
    options: ApiErrorOptions = {},
  ) {
    const { hasShowedError = false } = options;
    super(msg, code, response.config, response.request, response);
    this.name = 'ApiError';
    this.type = 'Api Response Error';
    this.hasShowedError = hasShowedError;
    this.raw = response.data;
  }
}
```

## 事件总线系统

为了解耦网络层与 UI 层（例如，网络层检测到未登录，不应直接调用 UI 组件弹出登录框，而是发送事件），系统使用了一个专用的事件总线。

### 事件定义

```typescript
// frontend/packages/arch/bot-http/src/eventbus.ts (摘录)
export enum APIErrorEvent {
  UNAUTHORIZED = 'unauthorized',             // 401 或特定业务码：未授权
  NOACCESS = 'noAccess',                     // 403：无权限
  SHARK_BLOCK = 'sharkBlocked',              // 风控拦截
  COUNTRY_RESTRICTED = 'countryRestricted',  // 地域限制
  COZE_TOKEN_INSUFFICIENT = 'cozeTokenInsufficient', // Token 额度不足
}
```

### 发布与订阅

```typescript
// frontend/packages/arch/bot-http/src/eventbus.ts:17 (摘录)
import { GlobalEventBus } from '@coze-arch/web-context';

const getEventBus = () => GlobalEventBus.create<APIErrorEvent>('bot-http');

// 发送事件 - 在 Axios 拦截器中调用 (见 axios.ts:68,74,81,88)
export const emitAPIErrorEvent = (event: APIErrorEvent, ...data: unknown[]) => {
  getEventBus().emit(event, ...data);
};

// 监听事件 - 在 account-base hooks 中使用 (见 foundation/account-base/src/hooks/factory.ts)
export const handleAPIErrorEvent = (event: APIErrorEvent, fn: (...args: unknown[]) => void) => {
  getEventBus().on(event, fn);
};
```

## 错误上报

系统集成了监控埋点，所有 API 异常都会被上报。

```typescript
reportHttpError(ReportEventNames.ApiError, apiError);
```

## 最佳实践

1. **禁用默认 Toast**：
   如果你的业务逻辑需要手动处理错误（而不是让框架弹出默认的红色 Toast），请在请求配置（第二参数）中设置 `__disableErrorToast: true`。注意：这是 Axios 请求配置，不是业务 DTO 字段。

   ```typescript
   await DeveloperApi.getBotList(
     { page: 1 },  // 业务参数
     { __disableErrorToast: true }  // 请求配置
   ).catch(err => {
     // 自定义处理
   });
   ```

2. **全局事件监听**：
   对于“未登录”或“地域限制”等全局性错误，不要在每个 API 调用处处理，而应在 `App.tsx` 或类似入口处统一监听 `APIErrorEvent`。
