# Tailwind 配置详解

Coze Studio 使用 `@coze-arch/tailwind-config` 包统一管理整个 Monorepo 的 Tailwind 配置。该配置不仅仅是简单的样式预设，还包含了自定义插件以支持复杂的语义化主题系统。

## 源码路径
- 主配置文件: `frontend/config/tailwind-config/src/index.js`
- Coze 插件: `frontend/config/tailwind-config/src/coze.js`

## 核心配置结构 (`index.js`)

配置采用 `presets` 或 `extends` 的方式被各子项目引用。核心配置扩展了颜色、间距、圆角等系统，使其与设计规范严格对齐。

### 颜色系统 (Colors)
颜色定义采用 RGB 通道分离的方式（`r, g, b`），以便 Tailwind 使用透明度修饰符（Opacity Modifier）。

```javascript
// frontend/config/tailwind-config/src/index.js 部分源码
colors: {
  foreground: {
    DEFAULT: 'rgba(var(--foreground), 1)',
    revert: 'rgba(var(--coze-fg-revert), var(--coze-fg-revert-alpha))',
    white: 'rgba(var(--coze-fg-white), var(--coze-fg-white-alpha))',
    7: 'rgba(var(--coze-fg-7), 1)', // 高对比度
    3: 'rgba(var(--coze-fg-3), var(--coze-fg-3-alpha))', // 标准文本
  },
  background: {
    DEFAULT: 'rgba(var(--background), 1)',
    1: 'rgba(var(--coze-bg-1), var(--coze-bg-1-alpha))', // 基础背景
  },
  brand: {
    DEFAULT: 'rgba(var(--coze-brand-7), 1)',
    5: 'rgba(var(--coze-brand-5), 1)', // 品牌主色
  }
}
```

### 尺寸与间距 (Spacing & Sizing)
使用了语义化与精确像素值共存的策略：

```javascript
spacing: {
  DEFAULT: 'var(--coze-8)',
  normal: 'var(--coze-32)',
  small: 'var(--coze-20)',
  '12px': 'var(--coze-12)',
  '16px': 'var(--coze-16)',
}
```

## Coze Tailwind 插件 (`coze.js`)

为了支持语义化类名（如 `coz-fg-primary` 代替具体的颜色值），项目实现了一个自定义 Tailwind 插件。

### 功能
1. **注入 CSS 变量**: 将 `light.js` 和 `dark.js` 定义的变量注入到 `:root` 和 `.dark` 选择器中。
2. **生成语义化工具类**: 自动生成 `coz-fg-*`, `coz-bg-*` 等工具类。

```javascript
// frontend/config/tailwind-config/src/coze.js 核心逻辑
module.exports = plugin(function ({ addBase, addUtilities, theme }) {
  // 1. 注入基础变量
  addBase({
    ':root': generateCssVariables(lightModeVariables),
    '.dark': generateCssVariables(darkModeVariables),
  });

  // 2. 注入语义化变量 (Semantic Variables)
  addBase({
    ':root': {
      ...generateCssVariables(semanticForeground, theme),
      ...generateCssVariables(semanticBackground, theme),
      // ...其他语义类别
    },
  });

  // 3. 生成工具类 (Utilities)
  addUtilities([
    ...generateSemanticVariables(semanticForeground, theme, 'color'),
    ...generateSemanticVariables(semanticBackground, theme, 'background-color'),
    // 生成如 .coz-fg-primary { color: ... } 的类
  ]);
});
```

### 语义化映射表
插件内部维护了多个映射表，将抽象语义映射到具体的主题颜色：

```javascript
const semanticForeground = {
  'coz-fg-primary': 'colors.foreground.3',  // 主要文本 -> 前景色级别3
  'coz-fg-secondary': 'colors.foreground.2', // 次要文本 -> 前景色级别2
  'coz-fg-hglt': 'colors.brand.5',           // 高亮文本 -> 品牌色5
  'coz-fg-hglt-red': 'colors.red.5',         // 错误/红色高亮
};
```


```

## 内容发现机制 (Content Discovery)

由于 Monorepo 结构的复杂性，Tailwind 需要知道所有包含 class 名的文件路径。Coze Studio 实现了一个自动发现机制。

### 源码路径
`frontend/config/tailwind-config/src/tailwind-contents.ts`

### 工作原理
`getTailwindContents` 函数会：
1. **扫描依赖**: 解析主项目的依赖树，查找所有依赖 `react` 的子包（sub-packages）。
2. **构建路径**: 将所有符合条件的子包的 `src/**/*.{ts,tsx}` 路径加入 `content` 数组。
3. **包含组件库**: 显式包含 `@coze-arch/coze-design` 的源码路径，确保基础组件的样式被正确处理。

```typescript
// frontend/apps/coze-studio/tailwind.config.ts 使用示例
import { getTailwindContents } from '@coze-arch/tailwind-config/design-token';

// 自动发现所有相关包的内容路径
const contents = getTailwindContents('@coze-studio/app');

export default {
  content: contents,
  // ...
};
```

这种机制确保了当在任何子包中使用 Tailwind 类名时，主应用的构建过程都能正确生成对应的 CSS，而无需手动维护冗长的 content 列表。

