# 组件库架构 (Component Library)

Coze Studio 采用双层组件库架构，既保证了底层设计的统一性，又满足了业务场景的灵活性。

## 架构分层

1.  **Base Layer**: `@coze-arch/coze-design`
    *   **定位**: 基础原子组件库。
    *   **实现**: 基于 Semi UI 进行二次封装和主题定制。
    *   **职责**: 提供 Button, Input, Modal 等通用组件，确保符合 Coze Design 设计规范。
2.  **Business Layer**: `@coze-common/biz-components`
    *   **定位**: 业务复用组件库。
    *   **实现**: 组合基础组件，包含特定的业务逻辑。
    *   **职责**: 提供 Banner, PictureUpload, UserAvatar 等与业务领域相关的组件。

## 业务组件剖析

以 `Banner` 组件为例，分析其如何结合 CSS Modules 和 Tailwind 进行样式管理。

### 源码路径
`frontend/packages/common/biz-components/src/banner/`

### 实现 (`index.tsx`)

以 Banner 为例：该实现通过包装基础组件并使用 `className` 注入样式（见下方摘录）。

```typescript
import { Banner as CozeDesignBanner } from '@coze-arch/coze-design';
import styles from './index.module.less';

export const Banner = forwardRef<HTMLDivElement, BannerProps>((props, ref) => {
    // ...逻辑处理
    return (
      <div ref={ref} className={props.className} style={props.style}>
        <CozeDesignBanner
          className={styles['banner-preview']} // 使用 CSS Modules 类名
          // ...其他属性
        />
      </div>
    );
});
```

### 样式 (`index.module.less`)

使用了 Less 配合 Tailwind 的 `@apply` 指令，这是一种混合写法，既利用了 Tailwind 的原子类，又保持了 CSS Modules 的局部作用域优势。

```less
.banner-preview {
  /* 使用 Tailwind 原子类设置宽度 */
  @apply w-full;

  .label {
    /* 组合使用语义化颜色类和排版类 */
    @apply coz-fg-white-dim text-xxl font-medium;
    
    line-height: 22px;
  }

  /* 嵌套选择器与伪类 */
  a {
    @apply coz-fg-white-dim text-xxl font-medium underline;

    &:visited, &:active, &:focus {
      @apply coz-fg-white-dim;
    }
  }
}
```

### 依赖关系
在 `apps/coze-studio/package.json` 中可以看到对这些包的引用：

```json
"dependencies": {
  "@coze-arch/coze-design": "0.0.6-alpha.346d77",
  "@coze-arch/semi-theme-hand01": "0.0.6-alpha.346d77"
}
```
这表明项目使用了定制的 Semi UI 主题包 (`semi-theme-hand01`) 来确保 Semi 组件的样式与设计系统一致。

## 常见业务组件列表

根据源码目录 `frontend/packages/common/biz-components/src/`，主要业务组件包括：

| 组件名 | 说明 |
|--------|------|
| **Banner** | 顶部通告栏，支持 HTML 内容渲染 |
| **PictureUpload** | 图片上传组件，封装了上传逻辑和预览 |
| **UpdateUserAvatar** | 用户头像裁剪与更新 |
| **AsyncSettingUI** | 异步配置界面 |
| **Coachmark** | 新手引导气泡/遮罩 |
