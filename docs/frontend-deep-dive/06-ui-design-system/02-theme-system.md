# 主题系统 (Theme System)

Coze Studio 的主题系统基于 CSS 变量（CSS Custom Properties）构建，支持自动和手动的深色模式（Dark Mode）切换。

## 核心机制

1. **变量定义**: 在 `light.js` 和 `dark.js` 中定义原始颜色值（RGB 通道）。
2. **变量注入**: 通过 Tailwind 插件将变量注入到 HTML 文档根节点。
3. **样式引用**: Tailwind 配置引用这些变量，组件通过 Tailwind 类名使用样式。
4. **模式切换**: 通过在 `<html>` 或 `<body>` 标签添加 `.dark` 类名来触发生效变量的切换。

## 变量定义源码

### Light Mode (`light.js`)
```javascript
// frontend/config/tailwind-config/src/light.js
module.exports = {
  // 基础颜色 (RGB)
  background: '255, 255, 255',
  foreground: '28, 28, 35',
  
  // 品牌色
  'coze-brand-5': '81, 71, 255', // 主品牌色
  'coze-brand-6': '69, 56, 255', // Hover 态
  
  // 功能色
  'coze-red-5': '229, 50, 65',
  
  // 透明度 (Alpha)
  'coze-fg-3-alpha': '0.82', // 主要文本不透明度
};
```

### Dark Mode (`dark.js`)
```javascript
// frontend/config/tailwind-config/src/dark.js
module.exports = {
  // 基础颜色 (RGB) - 深色背景，浅色前景
  background: '2, 8, 23',
  foreground: '249, 249, 249',
  
  // 品牌色 - 深色模式下调整亮度以保证对比度
  'coze-brand-5': '166, 166, 255', 
  
  // 透明度
  'coze-fg-3-alpha': '0.79',
};
```

## CSS 变量生成逻辑

在 `coze.js` 中，辅助函数 `generateCssVariables` 负责将上述 JS 对象转换为 CSS 变量对象：

```javascript
function generateCssVariables(variables, theme) {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    // 生成如 --coze-brand-5: 81, 71, 255
    acc[`--${key}`] = theme ? theme(value) : value;
    return acc;
  }, {});
}
```

最终生成的 CSS (示意)：
```css
:root {
  --coze-brand-5: 81, 71, 255;
  --coze-fg-3: 15, 21, 40;
}

.dark {
  --coze-brand-5: 166, 166, 255;
  --coze-fg-3: 255, 255, 255;
}
```

## 语义化分层

主题系统不仅定义了颜色，还定义了语义层级：

1.  **Foreground (前景)**: 文本、图标
    *   `coz-fg-primary`: 主要信息
    *   `coz-fg-secondary`: 次要信息
    *   `coz-fg-dim`: 弱化信息
2.  **Background (背景)**
    *   `coz-bg-primary`: 页面主背景
    *   `coz-bg-secondary`: 模块/卡片背景
3.  **Middleground (中景)**
    *   用于悬浮、按下、选中态背景
    *   `coz-mg-hglt`: 高亮背景（如选中项）
4.  **Stroke (描边)**
    *   `coz-stroke-primary`: 默认边框

## 透明度处理技巧

为了支持 `bg-brand-5/50` 这样的 Tailwind 透明度语法，颜色变量只定义 RGB 通道值（例如 `81, 71, 255`），而不是完整的 `rgb(...)` 字符串。

Tailwind 配置中这样使用：
```javascript
'brand-5': 'rgba(var(--coze-brand-5), <alpha-value>)'
```
当使用 `text-brand-5` 时，Tailwind 会自动将 `<alpha-value>` 替换为 `1`；当使用 `text-brand-5/50` 时，替换为 `0.5`。
