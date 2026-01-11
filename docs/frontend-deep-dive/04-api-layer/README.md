# API 层架构

Coze Studio 前端采用分层架构处理 API 请求，确保了请求的统一拦截、错误处理的标准化以及服务定义的清晰化。

## 核心模块

API 层由以下几个关键部分组成：

1. **[HTTP 客户端 (bot-http)](./01-http-client.md)**
   基于 Axios 的底层封装，负责基础的请求/响应拦截、请求标识 Header 注入和协议标准化。

2. **[错误处理系统](./02-error-handling.md)**
   统一的错误定义 (`ApiError`) 和事件驱动的错误上报机制，处理认证失效、权限不足等通用问题。

3. **[API 服务层 (bot-api)](./03-api-services.md)**
   业务层的具体实现，集成了 UI 反馈 (Toast) 并导出了类型安全的 API 服务实例。

4. **[流式处理](./04-streaming.md)**
   专门用于处理 SSE (Server-Sent Events) 和分块传输的流式请求工具。

## 架构概览

```mermaid
graph TD
    UI[React Components] --> Services[API Services (bot-api)]
    Services --> |Request| Client[HTTP Client (bot-http)]
    Client --> |Interceptor| ReqId[Request Header Injection]
    Client --> |Network| Server[Backend API]
    
    Server --> |Response| Client
    Client --> |Interceptor| ErrorHandler[Error Handling]
    ErrorHandler --> |Event| EventBus[Global Event Bus]
    ErrorHandler --> |Reject/Resolve| Services
    Services --> |Toast/Data| UI
```
