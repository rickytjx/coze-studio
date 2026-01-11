# API 服务层 (bot-api)

`bot-api` 模块是业务逻辑与后端接口的直接桥梁。它在 `bot-http` 的基础上进一步封装，集成了 UI 反馈（Toast）并定义了具体的服务实例。

## 业务层 Axios 配置

在 `bot-api` 中，响应拦截器被进一步定制，以自动处理错误提示。

### Toast 集成

默认情况下，如果接口返回业务错误（且未被底层 `bot-http` 拦截为特殊事件），`bot-api` 会自动弹出 Toast 提示。

```typescript
// frontend/packages/arch/bot-api/src/axios.ts:17-57 (摘录)
import { Toast } from '@coze-arch/bot-semi';
import { axiosInstance, isApiError } from '@coze-arch/bot-http';

// 配置 Toast 位置 (:25-27)
Toast.config({ top: 80 });

// 扩展请求配置类型 (:29-38)
interface CustomAxiosConfig { 
  __disableErrorToast?: boolean; // 关键配置：是否禁用自动错误提示
}
export type BotAPIRequestConfig = AxiosRequestConfig & CustomAxiosConfig;

// 添加业务层响应拦截器 (:40-57)
axiosInstance.interceptors.response.use(
  response => response.data, // 直接解包 data，使业务代码直接获取 payload
  error => {
    // 自动 Toast 逻辑
    if (
      isApiError(error) && 
      error.msg && 
      !(error.config as CustomAxiosConfig).__disableErrorToast
    ) {
      Toast.error({ content: error.msg, showClose: false });
    }
    throw error;
  },
);
```

## 服务实例化模式

应用不直接使用 `axios.get/post`，而是通过实例化的 Service 类来调用。这种模式提供了更好的类型支持和统一的配置注入能力。

### 基础服务 (DeveloperApi)

```typescript
// frontend/packages/arch/bot-api/src/developer-api.ts (摘录)
import { DeveloperApiService } from './generated/services'; // 由 IDL 生成

export const DeveloperApi = new DeveloperApiService<BotAPIRequestConfig>({
  // 注入请求适配器
  request: (params, config = {}) => axiosInstance.request({ ...params, ...config }),
});
```

### 特殊服务 (PlaygroundApi)

某些服务需要特殊的 HTTP 头或其他自定义配置。

```typescript
import { PlaygroundApiService } from './generated/services';

export const PlaygroundApi = new PlaygroundApiService<BotAPIRequestConfig>({
  request: (params, config = {}) => {
    // 注入特殊 Header
    config.headers = Object.assign(config.headers || {}, { 'Agw-Js-Conv': 'str' });
    return axiosInstance.request({ ...params, ...config });
  },
});
```

## 使用示例

```typescript
import { DeveloperApi } from '@coze-arch/bot-api';

// 正常调用
const botList = await DeveloperApi.getBotList({ page: 1 });

// 禁用自动错误提示
try {
  await DeveloperApi.createBot(
    { name: 'My Bot' }, 
    { __disableErrorToast: true }
  );
} catch (e) {
  // 手动处理错误
  console.error('创建失败，但不弹窗', e);
}
```
