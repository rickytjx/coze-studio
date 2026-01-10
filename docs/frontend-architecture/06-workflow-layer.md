# 工作流层 (Workflow Layer) Architecture

工作流层是 Coze Studio 的核心引擎，负责工作流的编辑、编排、执行调试及变量管理。该层采用高度模块化的架构，基于 React + TypeScript 构建，利用 FlowGram 适配器自带的容器模块与注入机制（ContainerModule、lazyInject）实现依赖管理，并深度集成 FlowGram.ai 渲染引擎。

## 1. 概览

工作流层包含约 14 个核心包，提供以下关键能力：
- **可视化编排**：基于 Canvas 的节点拖拽与连线。
- **变量系统**：强类型的变量定义、引用与作用域管理。
- **表达式引擎**：支持 `{{ variable.path }}` 语法的动态表达式编辑。
- **调试运行**：完整的测试运行环境与执行链路追踪。

## 2. 包结构

位于 `frontend/packages/workflow/` 目录下：

| 包名 | 描述 | 核心职责 |
|------|------|----------|
| `base` | 基础层 | 定义基础类型 (VO, DTO)、枚举 (`ViewVariableType`)、工具函数 |
| `variable` | 变量系统 | 变量门面 (`Facade`)、作用域管理、循环引用检测、响应式更新 |
| `components` | 组件库 | 表达式编辑器 (`ExpressionEditor`)、变量选择器 |
| `render` | 渲染引擎 | 画布渲染 (`WorkflowRenderProvider`)、层级管理、插件注册 |
| `nodes` | 节点库 | 各类工作流节点的具体实现 (定义、UI、配置) |
| `sdk` | SDK | 对外暴露的工作流操作接口 |
| `test-run-next` | 测试运行 | 新版测试运行器、表单生成 (`TestRunForm`)、链路追踪 (`TracePanel`) |
| `fabric-canvas` | 画布 | 底层 Canvas 交互逻辑 |
| `setters` | 设置器 | 节点属性配置面板组件 |
| `playground` | 调试场 | 开发与调试环境 |
| `adapter` | 适配器 | 兼容旧版协议的适配层 |

## 3. 核心模块分析

### 3.1 基础类型层 (@coze-workflow/base)

定义了系统的通用语言。

- **ViewVariableType**: 核心变量类型枚举。
  ```typescript
  export enum ViewVariableType {
    String = 1,
    Integer,
    Boolean,
    Object = 6,
    ArrayString = 99,
    // ...
  }
  ```
- **WorkflowJSON**: 工作流序列化格式。
- **DTO**: 前后端交互的数据传输对象定义 (`ValueExpressionDTO`, `RefExpression`).

### 3.2 变量系统 (@coze-workflow/variable)

采用 **Facade 模式** 和 **响应式编程**，管理复杂的变量作用域和引用关系。

#### 核心类
- **WorkflowVariableFacade**: 变量操作的统一入口。
  - `canAccessByNode(nodeId)`: 检查节点是否可访问此变量。
  - `keyPath`: 变量的全路径数组。
  - `viewMeta`: 获取变量元数据。
  - `onDispose()`, `onRename()`, `onDataChange()`: 响应式监听。
  
- **WorkflowVariableFacadeService**: 服务层，管理 Facade 实例的生命周期与缓存。
  - 使用 `WeakMap` 缓存实例。
  - 处理跨节点的变量重命名同步。

- **循环引用检测 (checkRefCycle)**:
  使用 BFS 算法检测变量引用链中是否存在环。
  ```typescript
  // 伪代码逻辑
  function checkRefCycle(currExpression, refNodes) {
    if (!hasScopeIntersection(curr, refNodes)) return false;
    const queue = [...refNodes];
    while(queue.length) {
      const node = queue.shift();
      if (isParentOf(node, currExpression)) return true; // Found cycle
      queue.push(...getAllRefs(node));
    }
    return false;
  }
  ```

### 3.3 表达式编辑器 (@coze-workflow/components)

基于 **Slate** (及新版 `@coze-editor/editor`) 构建的富文本编辑器，支持 `{{ variable.path }}` 语法。

#### 架构组件
1. **ExpressionEditorModel**: 编辑器模型，管理 Slate 实例、历史记录、内部值状态。
2. **ExpressionEditorParser**: 解析器。
   - `deserialize()`: 文本 -> Slate Nodes
   - `serialize()`: Slate Nodes -> 文本
   - `parse()`: 识别 `{{ }}` Token 并解析为路径段 (`Segments`)。
3. **ExpressionEditorValidator**: 验证器。
   - `findPatterns()`: 提取所有插值表达式。
   - `patternValidate()`: 结合变量树 (`VariableTree`) 验证路径有效性。
4. **TreeHelper**: 构建变量树，处理 `ObjectKey` 和 `ArrayIndex` 的匹配逻辑。

#### 语法处理
输入 `{{ user.profile.name }}` 会被解析为：
- Token: `FullStart` (`{{`)
- Segments: `ObjectKey(user)` -> `ObjectKey(profile)` -> `ObjectKey(name)`
- Token: `FullEnd` (`}}`)

### 3.4 渲染引擎 (@coze-workflow/render)

基于 **@flowgram.ai** (内部代号) 封装的渲染层。

#### 核心组件
- **WorkflowRenderProvider**: React Context Provider，负责初始化引擎。
- **Container Modules**: FlowGram 容器模块，用于注入自定义服务（基于 `@flowgram-adapter/free-layout-editor` 提供的 DI 机制）。
- **Layer System**:
  - `BackgroundLayer`: 背景网格。
  - `HoverLayer`: 处理悬停交互。
  - `ShortcutsLayer`: 快捷键管理。
  - `FlowNodesContentLayer`: 节点内容渲染。

#### 插件化架构
通过 Preset 注入核心插件：
```typescript
const preset = [
  createFreeAutoLayoutPlugin({}), // 自动布局
  createNodeCorePlugin({}),       // 节点核心行为
  createFreeStackPlugin({}),      // 层级堆叠管理
];
```

### 3.5 测试运行器 (@coze-workflow/test-run-next)

新版测试运行模块采用单一入口模式 (`main/src/index.ts`)，聚合了三个子模块的功能：`form` (表单)、`trace` (追踪) 和 `shared` (共享)。

#### 核心组件

1.  **TestRunForm (测试运行表单)**
    -   **表单引擎**: 基于 `@flowgram-adapter/free-layout-editor` 扩展。
    -   **动态生成**: `generateField()` 根据变量类型 (`ViewVariableType`) 自动生成 Schema 定义，并应用 `FieldItem` 装饰器。
    -   **验证机制**: `generateFieldValidator()` 集成 `ajv` 进行 JSON Schema 校验，支持必填项检查。
    -   **组件映射**:
        -   `ViewVariableType.String` -> `InputString`
        -   `ViewVariableType.Object/Array` -> `InputJson`
        -   `ViewVariableType.File` -> `TypedFileInput`
    -   **状态管理**: 使用 `Zustand` (`useTestRunFormStore`) 管理表单状态，支持 `form` 和 `json` 两种编辑模式。

2.  **TracePanel (链路追踪)**
    -   **TraceListPanel**: 
        -   **TraceTree**: 左侧树状结构，展示 Span 调用层级。
        -   **TraceGraph**: 右侧可视化区域，支持 **火焰图 (FlameThread)** 和 **表格 (Table)** 模式。
    -   **TraceDetailPanel**: 
        -   展示 Span 详情（LogId、状态码）。
        -   **ResultViewer**: 渲染输入/输出 JSON 数据。
        -   **性能指标**: 展示 Latency 和 Token 消耗。
    -   **数据流**: `useTrace()` Hook 获取 Span 数据 -> `spans2SpanNodes` 转换为树结构 -> `TraceTree` 渲染。

## 4. 数据流

### 变量引用流程
1. **用户输入**: 在表达式编辑器中输入 `{{`。
2. **触发建议**: 编辑器捕获输入，调用 `VariableService` 获取当前 Scope 可用变量树。
3. **选择变量**: 用户从下拉树中选择变量 (如 `input.query`)。
4. **插入节点**: 编辑器插入 `Mention` 类型的 Slate Node。
5. **实时验证**: `Validator` 校验路径有效性，无效则标红。
6. **序列化**: 保存时转换为 `RefExpression` DTO。
   ```json
   {
     "type": "ref",
     "content": {
       "source": "block-output",
       "blockID": "node_123",
       "name": "query"
     }
   }
   ```

### 渲染流程
1. **加载**: `WorkflowLoader` 读取 `WorkflowJSON`。
2. **初始化**: `FlowRendererRegistry` 注册所有 Layer 和 Node 组件。
3. **布局**: `AutoLayoutPlugin` 计算节点位置。
4. **绘制**: Canvas 绘制节点、连线和背景。
5. **交互**: 用户拖拽/缩放触发 `TransformLayer` 更新。

## 5. 技术特性

- **AST 驱动**: 变量系统基于抽象语法树 (AST) 构建，支持复杂的嵌套结构解析。
- **类型安全**: 全链路 TypeScript 类型定义，DTO 层严格校验。
- **响应式更新**: 变量重命名自动同步更新所有引用处，基于发布订阅模式。
- **依赖注入**: 使用 FlowGram 适配器提供的容器模块与 `lazyInject` 装饰器管理服务依赖，解耦各模块。
- **插件化**: 渲染引擎高度可扩展，支持自定义节点、连线和交互行为。

## 6. 数据结构示例

### WorkflowNodeJSON (节点定义)
```typescript
interface WorkflowNodeJSON {
  id: string;
  type: string; // e.g., 'function_node', 'llm_node'
  data: {
    inputs: Record<string, any>;
    outputs: VariableMetaDTO[];
    nodeMeta: {
      title: string;
      description: string;
    };
  };
  meta: {
    position: { x: number; y: number };
  };
}
```

### RefExpression (变量引用)
```typescript
interface RefExpression {
  type: 'ref';
  content: {
    source: 'variable' | 'block-output' | 'global_variable';
    blockID?: string;
    name: string; // 变量名或路径
    path?: string[]; // 全局变量路径
  };
}
```
