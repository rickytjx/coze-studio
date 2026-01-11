# 设计令牌 (Design Tokens)

设计令牌（Design Tokens）是设计系统中的原子变量，用于存储颜色、间距、圆角等设计决策。Coze Studio 实现了一套将设计令牌 JSON 自动转换为 Tailwind 配置的机制。

## 令牌转换工具 (`design-token.ts`)

源码位置: `frontend/config/tailwind-config/src/design-token.ts`

该文件导出了 `designTokenToTailwindConfig` 函数，用于将符合特定 Schema 的 Token JSON 对象转换为 Tailwind 的 `theme` 配置对象。

### 工作流程

1.  **输入**: 接收包含 `palette` (调色板) 和 `tokens` (语义令牌) 的 JSON 对象。
2.  **解析**: 遍历 `color`, `spacing`, `border-radius` 等 token 类别。
3.  **转换**:
    *   **颜色**: 将语义颜色引用（如 `var(primary-500)`）替换为调色板中的实际值，并处理主题后缀（`-light`, `-dark`）。
    *   **间距**: 去除前缀（如 `$spacing-`），生成 Tailwind 的 spacing 配置。
    *   **圆角**: 去除前缀，生成 borderRadius 配置。
4.  **输出**: 返回可直接合并到 `tailwind.config.js` 的配置对象。

### 核心代码逻辑

```typescript
export function designTokenToTailwindConfig(tokenJson: Record<string, unknown>) {
  const res = { colors: {}, spacing: {}, borderRadius: {} };
  // ...遍历 tokenJson
  // 调用相应的 Transformer
  return res;
}

// 颜色转换器：处理引用替换
function genColorValueFormatter(palette: Record<string, Record<string, string>>) {
  return (theme: string, colorValue: string) => {
    // 匹配 var(...) 引用
    const re = /var\((.+?)\)/;
    const match = colorValue.match(re);
    // ...从 palette 中查找对应值并替换
  };
}
```

## 令牌输入格式要求

`designTokenToTailwindConfig` 函数接收 `Record<string, unknown>` 类型的 JSON 对象，根据源码处理逻辑（见 `frontend/config/tailwind-config/src/design-token.ts:19-53`），函数会访问以下字段：

```typescript
// frontend/config/tailwind-config/src/design-token.ts:27-28 (摘录)
const palette = tokenJson.palette ?? {};
const tokens = tokenJson.tokens ?? {};

// :29-51 - 遍历 tokens 对象，只处理以下 key:
// - 'color': 调用 colorTransformer
// - 'spacing': 调用 spacingTransformer  
// - 'border-radius': 调用 borderRadiusTransformer
```

> **注意**: 实际的 Token JSON 文件由设计工具（如 Figma Tokens）导出或外部包（如 `@coze-arch/semi-theme-hand01`）提供，不包含在本仓库源码中。输入格式需满足上述字段访问模式。

## 优势

1. **设计与开发解耦**: 设计师在设计工具中更新令牌，开发自动同步
2. **主题一致性**: 所有颜色、间距、圆角统一管理
3. **多主题支持**: 通过 palette 的 light/dark 分支支持深浅色切换
4. **类型安全**: TypeScript 类型推断确保配置正确性

## 应用层集成 (Integration)

在主应用 `frontend/apps/coze-studio` 中，设计令牌被实际集成到 Tailwind 配置中。

### 源码路径
`frontend/apps/coze-studio/tailwind.config.ts`

### 集成方式
应用引用了 `@coze-arch/semi-theme-hand01` 包中的原始 JSON 数据，并通过转换工具将其注入到 Tailwind 的 `theme.extend` 中。

```typescript
import type { Config } from 'tailwindcss';
import { designTokenToTailwindConfig } from '@coze-arch/tailwind-config/design-token';
// 导入原始 Token 数据
import json from '@coze-arch/semi-theme-hand01/raw.json';

export default {
  // ...
  presets: [require('@coze-arch/tailwind-config')],
  theme: {
    extend: {
      // 动态转换并扩展配置
      ...designTokenToTailwindConfig(json),
    },
  },
  // ...
} satisfies Config;
```

这种集成方式确保了应用始终使用最新的设计规范，并且可以通过更新 `@coze-arch/semi-theme-hand01` 包来全局更新设计系统，而无需修改应用代码。

## Token 转换约束

> 以下约束基于 `frontend/config/tailwind-config/src/design-token.ts` 的实际实现。

### 命名规则

| Token 类型 | 前缀要求 | 示例 | 说明 |
|------------|----------|------|------|
| Color | 无特定前缀，但需 `-color-` 分隔 | `primary-color-500` | 会按 `-color-` 分割取后缀 |
| Spacing | `$spacing-` 前缀 | `$spacing-small`, `$spacing-16` | 去除前缀后作为 key |
| Border Radius | `--semi-border-radius-` 前缀 | `--semi-border-radius-small` | 去除前缀后作为 key |

### 颜色处理规则

```typescript
// frontend/config/tailwind-config/src/design-token.ts (示意)

// 颜色 key 处理逻辑
const colorKey = tokenKey.split('-color-')[1];  // 取 -color- 后的部分
// 例如: 'primary-color-500' → '500'
```

### Spacing 处理规则

```typescript
// Spacing key 处理逻辑
const spacingKey = tokenKey.replace('$spacing-', '');
// 例如: '$spacing-small' → 'small'
//       '$spacing-16' → '16'
```

### Border Radius 处理规则

```typescript
// Border radius key 处理逻辑
const radiusKey = tokenKey.replace('--semi-border-radius-', '');
// 例如: '--semi-border-radius-small' → 'small'
```

### Alpha 透明度体系

Tailwind 使用 `rgba(var(--xxx), <alpha-value>)` 机制支持透明度：

```css
/* CSS 变量存储 RGB 值（不含 alpha） */
:root {
  --coze-brand-5: 81, 71, 255;  /* RGB 分量，逗号分隔 */
}

/* Tailwind 使用时注入 alpha */
.bg-brand-5 {
  background-color: rgba(var(--coze-brand-5), 1);
}

.bg-brand-5\/50 {
  background-color: rgba(var(--coze-brand-5), 0.5);  /* 50% 透明度 */
}
```

**关键约束**:
- CSS 变量值必须是 `R, G, B` 格式（逗号分隔的数字）
- 不能包含 `rgb()` 或 `rgba()` 包装
- alpha 值由 Tailwind 的 opacity modifier 动态注入

### 变量引用约束

```json
// Token JSON 中的引用格式
{
  "tokens": {
    "color": {
      "light": {
        "primary-button-bg": "var(blue-500)"  // 引用 palette 中的 key
      }
    }
  },
  "palette": {
    "light": {
      "blue-500": "59, 130, 246"  // RGB 格式
    }
  }
}
```

**引用规则**:
- `var(xxx)` 引用必须能在 `palette` 中找到对应 key
- 引用只支持一层，不支持嵌套引用
- 引用的 key 需要与 palette 中的 key 完全匹配

### 错误场景与处理

> 源码位置: `frontend/config/tailwind-config/src/design-token.ts`

| 错误类型 | 示例 | 结果 | 源码依据 |
|----------|------|------|----------|
| 缺失引用 | `var(not-exist)` | 引用部分被替换为 `undefined`，整个值变成无效字符串 | `:82-83` - `valueObj[key]` 返回 undefined |
| 前缀不匹配 | `spacing-small` (缺少 `$`) | key **原样保留**并进入输出，导致未转换 key 进入 Tailwind 配置 | `:91` - `replace('$spacing-', '')` 不匹配时 key 不变 |
| 无 `-color-` 分隔 | `primary500` | 转换后 key 为空字符串 `''` 加主题后缀 | `:64` - `split('-color-')[1]` 返回 undefined |
| 多处引用 | `var(a) var(b)` | 只替换第一个 `var()`，后续保留原样 | `:75` - 正则 `/var\((.+?)\)/` 无全局标记 |
| 循环引用 | `a: var(b)`, `b: var(a)` | 不支持，会产生 undefined 替换 | `:71-85` - 转换只做一层替换 |
| 格式错误 | `rgba(255, 0, 0, 1)` | alpha modifier 失效，透明度类无法使用 | Tailwind 需要 `R, G, B` 格式 |
| palette 缺少 theme | `tokens.color` 有 `light` 但 `palette` 无 `light` | 运行时抛错 `Cannot read properties of undefined` | `:82` - `palette[theme]` 前未判空 |

#### 源码行为说明

```typescript
// frontend/config/tailwind-config/src/design-token.ts (摘录)

// genColorValueFormatter 中的引用替换逻辑 (:71-85)
function genColorValueFormatter(palette: Record<string, Record<string, string>>) {
  return (theme: string, colorValue: string) => {
    const re = /var\((.+?)\)/;  // :75 - 无全局标记，只匹配第一个
    const match = colorValue.match(re);
    // ...
    const v = valueObj[key];  // :83 - 如果 key 不存在，v 为 undefined
    return colorValue.replace(whole, v);  // :84 - 'var(xxx)' 被替换为 'undefined' 字符串
  };
}

// spacingTransformer 中的前缀处理 (:88-94)
function spacingTransformer(spacingObj: Record<string, string>) {
  // ...
  const newKey = `${k.replace('$spacing-', '')}`;  // :91 - 不匹配时原样保留
  // ...
}

// borderRadiusTransformer 同理 (:97-103)
function borderRadiusTransformer(borderRadiusObj: Record<string, string>) {
  // ...
  const newKey = `${k.replace('--semi-border-radius-', '')}`;  // :100 - 不匹配时原样保留
  // ...
}
```

**前置条件**:
- `palette` 必须包含所有 `tokens.color` 中出现的 theme key（如 `light`、`dark`），否则转换会抛错
- 建议在使用设计令牌前，通过构建脚本或 lint 规则验证 Token JSON 的格式正确性

### 最佳实践

1. **使用正确前缀**: 严格按照规范添加 `$spacing-`、`--semi-border-radius-` 前缀
2. **RGB 格式颜色**: 颜色值使用 `R, G, B` 格式，不要包含 `rgb()` 包装
3. **避免嵌套引用**: 变量引用只支持一层
4. **主题分离**: `light` 和 `dark` 分支保持 key 一致，只改变值
5. **验证转换结果**: 修改 Token 后检查 Tailwind 输出是否正确
