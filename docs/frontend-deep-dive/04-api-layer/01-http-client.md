# HTTP 客户端层 (bot-http)

`bot-http` 模块提供了应用的基础 HTTP 通信能力。它基于 Axios 构建，封装了通用的拦截逻辑和安全策略。

## Axios 实例配置

核心实例定义在 `frontend/packages/arch/bot-http/src/axios.ts` 中。

```typescript
// frontend/packages/arch/bot-http/src/axios.ts:39 (摘录)
import axios from 'axios';

export const axiosInstance = axios.create();
```

## 请求拦截器链

请求拦截器主要负责安全增强和协议标准化。

### 请求标识 Header 注入

请求拦截器统一注入 `x-requested-with: XMLHttpRequest`（请求标识 Header，配合后端安全策略）与默认 `content-type`。

```typescript
// frontend/packages/arch/bot-http/src/axios.ts:125-152 (摘录)
axiosInstance.interceptors.request.use(config => {
  const setHeader = (key: string, value: string) => {
    if (typeof config.headers.set === 'function') {
      config.headers.set(key, value);
    } else {
      config.headers[key] = value;
    }
  };

  // 标记为 AJAX 请求
  setHeader('x-requested-with', 'XMLHttpRequest');

  // 默认 Content-Type
  if (['post', 'get'].includes(config.method?.toLowerCase() ?? '') && !getHeader('content-type')) {
    setHeader('content-type', 'application/json');
    // 确保 data 不为 undefined，避免某些情况下 content-type 被移除
    if (!config.data) { config.data = {}; }
  }
  return config;
});
```

## 响应拦截器链

响应拦截器是错误处理的第一道防线。它将后端返回的业务错误码转换为前端可处理的异常对象。

### 业务错误标准化

当 HTTP 状态码为 200 但业务 `code !== 0` 时，拦截器会抛出 `ApiError` 并触发相应的全局事件。

```typescript
// frontend/packages/arch/bot-http/src/axios.ts:48-123 (摘录)
// 注意: ErrorCodes 定义在同一文件 :32-37
import { emitAPIErrorEvent, APIErrorEvent } from './eventbus';
import { ApiError, reportHttpError, ReportEventNames } from './api-error';

axiosInstance.interceptors.response.use(
  response => {
    const { data = {} } = response;
    const { code, msg, message } = data;

    // 业务成功
    if (code === 0) {
      return response; // bot-http 层返回 response 对象，bot-api 层解包 data (见 frontend/packages/arch/bot-api/src/axios.ts:41)
    }

    // 业务失败，转换为 ApiError
    if (code !== 0) {
      const apiError = new ApiError(String(code), message ?? msg, response);

      // 特定错误码处理
      switch (code) {
        case ErrorCodes.NOT_LOGIN:
          apiError.config.__disableErrorToast = true; // 禁用默认弹窗，由事件监听处理
          emitAPIErrorEvent(APIErrorEvent.UNAUTHORIZED, apiError);
          break;
        case ErrorCodes.COUNTRY_RESTRICTED:
          apiError.config.__disableErrorToast = true;
          emitAPIErrorEvent(APIErrorEvent.COUNTRY_RESTRICTED, apiError);
          break;
        case ErrorCodes.COZE_TOKEN_INSUFFICIENT:
          apiError.config.__disableErrorToast = true;
          emitAPIErrorEvent(APIErrorEvent.COZE_TOKEN_INSUFFICIENT, apiError);
          break;
      }

      // 上报错误日志
      reportHttpError(ReportEventNames.ApiError, apiError);
      return Promise.reject(apiError);
    }
    return response;
  },
  error => {
    // 网络层错误处理 (如 4xx, 5xx)
    if (isAxiosError(error)) {
      reportHttpError(ReportEventNames.NetworkError, error);
      
      // 401 自动跳转
      if (error.response?.status === 401) {
        const redirectUri = error.response.data?.data?.redirect_uri;
        if (redirectUri) { redirect(redirectUri); }
      }
    }
    return Promise.reject(error);
  }
);
```

### 关键错误码

```typescript
// frontend/packages/arch/bot-http/src/axios.ts:32-37
export enum ErrorCodes {
  NOT_LOGIN = 700012006,            // 未登录
  COUNTRY_RESTRICTED = 700012015,   // 地域限制
  COZE_TOKEN_INSUFFICIENT = 702082020, // Token 不足
  COZE_TOKEN_INSUFFICIENT_WORKFLOW = 702095072, // 工作流 Token 不足
}
```
