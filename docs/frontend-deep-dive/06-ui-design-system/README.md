# Coze Studio UI 设计系统深度解析

本文档深入解析 Coze Studio 前端项目的 UI 设计系统，涵盖 Tailwind 配置、主题系统、组件库架构及设计令牌（Design Tokens）的实现机制。

## 核心架构概览

Coze Studio 的 UI 系统采用分层架构，底层由 **Design Tokens** 和 **Tailwind 配置** 驱动，中间层为 **基础组件库 (@coze-arch/coze-design)**，上层为 **业务组件库 (@coze-common/biz-components)**。

```mermaid
graph TD
    DT[Design Tokens] --> TC[Tailwind Config]
    TC --> CSS[CSS Variables (Theme)]
    CSS --> CD[Coze Design (Base UI)]
    CSS --> BC[Biz Components]
    CD --> BC
    BC --> App[Coze Studio App]
    
    subgraph Styling
    TC
    CSS
    end
    
    subgraph Components
    CD
    BC
    end
```

## 文档导航

| 文档 | 说明 |
|------|------|
| [01-tailwind-config.md](./01-tailwind-config.md) | Tailwind CSS 核心配置、插件及语义化类名实现 |
| [02-theme-system.md](./02-theme-system.md) | 深浅色主题切换机制、CSS 变量映射策略 |
| [03-component-library.md](./03-component-library.md) | 基础组件与业务组件的分层架构及实现范例 |
| [04-design-tokens.md](./04-design-tokens.md) | 设计令牌结构及其向代码转换的流程 |

## 技术栈

- **样式引擎**: Tailwind CSS v3
- **预处理器**: Less (配合 CSS Modules 使用)
- **组件库**: 
  - `@coze-arch/coze-design` (基于 Semi UI 封装)
  - `@coze-common/biz-components` (业务定制)
- **主题方案**: CSS Variables + Tailwind Opacity Modifier

## 源码位置

- **Tailwind 配置**: `frontend/config/tailwind-config/src/`
- **业务组件**: `frontend/packages/common/biz-components/src/`
- **基础组件引用**: `frontend/apps/coze-studio/package.json`
