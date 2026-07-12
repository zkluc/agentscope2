# GenUI 集成实现方案

## 目录

- [1. 概述](#1-概述)
- [2. 系统架构](#2-系统架构)
- [3. 后端实现](#3-后端实现)
  - [3.1 GenUI 工具定义](#31-genui-工具定义)
  - [3.2 Schema 生成器](#32-schema-生成器)
  - [3.3 Agent 集成](#33-agent-集成)
  - [3.4 后端代理服务](#34-后端代理服务)
- [4. 前端实现](#4-前端实现)
  - [4.1 GenUI 渲染组件](#41-genui-渲染组件)
  - [4.2 自定义组件库](#42-自定义组件库)
  - [4.3 消息气泡集成](#43-消息气泡集成)
  - [4.4 工具函数库](#44-工具函数库)
  - [4.5 API 调用层](#45-api-调用层)
- [5. 数据流](#5-数据流)
- [6. Schema 规范](#6-schema-规范)
- [7. 部署与配置](#7-部署与配置)
- [8. 扩展指南](#8-扩展指南)

---

## 1. 概述

GenUI（Generative UI）是一种让 AI Agent 动态生成交互式用户界面的功能。用户通过自然语言描述需求（如"创建一个登录表单"），Agent 调用 GenUI 工具生成对应的 UI Schema，前端实时渲染出可交互的界面组件。

### 核心特性

- 自然语言驱动 UI 生成
- 支持表单、表格、问卷等多种组件
- 流式渲染，实时预览
- 基于 OpenTiny 组件库
- 可扩展的自定义组件系统

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面 (Vue 3)                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  聊天窗口     │───▶│ MessageBubble│───▶│GenUIRenderer │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                              │                    │              │
│                              ▼                    ▼              │
│                     ┌──────────────┐    ┌──────────────┐       │
│                     │  SSE/WebSocket│    │ OpenTiny 组件 │       │
│                     └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    后端代理 (Node.js Express)                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  CORS 处理    │───▶│  反向代理     │───▶│  WebSocket   │       │
│  └──────────────┘    └──────────────┘    │  中继 (可选)  │       │
│                                          └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AgentScope Python 服务                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Agent 核心   │───▶│  GenUI 工具  │───▶│  Schema 生成 │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 后端实现

### 3.1 GenUI 工具定义

**文件**: `examples/agent_service/genui_tool.py`

GenUI 工具是一个 `FunctionTool` 子类，Agent 可以通过标准工具调用机制触发 UI 生成。

```python
class GenUITool(FunctionTool):
    """GenUI 工具 - 自动允许执行，不需要用户确认"""
    
    async def check_permissions(self, *_args, **_kwargs) -> PermissionDecision:
        """自动允许 GenUI 工具执行"""
        return PermissionDecision(
            behavior=PermissionBehavior.ALLOW,
            message="GenUI 工具自动允许执行。",
        )
```

**关键设计决策**:
- `is_read_only=True`: 工具只生成数据，不修改系统状态
- 自动权限授予: 避免每次调用都需要用户确认
- 返回 JSON 字符串: 前端统一解析

### 3.2 Schema 生成器

**文件**: `examples/agent_service/genui_tool.py`

`GenUIgenerator` 类负责根据用户输入生成对应的 UI Schema。

#### 内置模板

| 模板名称 | 触发关键词 | 用途 |
|---------|-----------|------|
| `login` | 登录、login、账号、注册 | 用户登录表单 |
| `survey` | 调查、问卷、survey、满意度 | 满意度调查问卷 |
| `table` | 表格、数据、列表、table | 数据展示表格 |

#### 模板匹配逻辑

```python
@classmethod
def detect_template(cls, user_message: str) -> Optional[str]:
    lower_msg = user_message.lower()
    if any(kw in lower_msg for kw in ["登录", "login", "账号", "注册"]):
        return "login"
    elif any(kw in lower_msg for kw in ["调查", "问卷", "survey", "满意度"]):
        return "survey"
    elif any(kw in lower_msg for kw in ["表格", "数据", "列表", "table"]):
        return "table"
    return None
```

#### 自定义表单生成

当没有匹配的模板时，生成通用表单：

```python
@classmethod
def generate_custom_form(cls, user_message: str) -> Dict[str, Any]:
    return {
        "schema": {
            "componentName": "Page",
            "children": [
                # 标题组件
                {"componentName": "Text", "props": {"text": "根据您的需求生成的界面"}},
                # 表单组件
                {"componentName": "TinyForm", "children": [
                    {"componentName": "TinyFormItem", "children": [
                        {"componentName": "TinyInput", "props": {"placeholder": "请输入内容"}}
                    ]},
                    {"componentName": "TinyFormItem", "children": [
                        {"componentName": "TinyButton", "props": {"type": "primary", "text": "提交"}}
                    ]}
                ]}
            ]
        }
    }
```

### 3.3 Agent 集成

**文件**: `src/agentscope/app/storage/_model/_agent.py`

修改默认 System Prompt，指示 Agent 在适当时机调用 GenUI 工具：

```python
system_prompt: str = Field(
    default="""You are a helpful assistant with UI generation capabilities.

## GenUI Tool — Mandatory Usage

You MUST call the `generate_genui` tool whenever the user's request involves 
generating, creating, or displaying any kind of UI.

### Trigger rules — call `generate_genui` when the user says ANY of:
- "create a form", "build a page", "show a table", "generate UI"
- "登录", "注册", "表单", "表格", "界面", "UI"

### How to call
Call `generate_genui` with the user's original message as the `user_message` parameter.
Example: user says "帮我创建一个登录表单" → call `generate_genui(user_message="帮我创建一个登录表单")`
""",
)
```

**文件**: `examples/agent_service/main.py`

注册 GenUI 工具到 Agent：

```python
from genui_tool import genui_tool

async def genui_tool_factory(
    user_id: str,
    agent_id: str,
    session_id: str,
) -> list[ToolBase]:
    """为每个 agent 添加 GenUI 工具"""
    return [genui_tool]

# 在创建 Agent 时注入工具
app = AgentScopeApp(
    ...
    extra_agent_tools=genui_tool_factory,
)
```

### 3.4 后端代理服务

**文件**: `examples/web_ui/backend/src/index.ts`

Node.js 后端服务提供：
1. CORS 处理
2. 反向代理到 AgentScope Python 服务
3. 可选的 WebSocket 中继

```typescript
// 配置
export interface BackendConfig {
    port: number;                    // 监听端口，默认 3000
    upstream: string;                // AgentScope 服务地址
    enableWsRelay: boolean;          // 是否启用 WebSocket 中继
}

// 反向代理 - 零缓冲，SSE 安全
app.use((req, res) => {
    proxyToUpstream(config, req, res);
});
```

**SSE 流式响应支持**:

```typescript
// 关键响应头，防止代理缓冲
responseHeaders['x-accel-buffering'] = 'no';
responseHeaders['cache-control'] = 'no-cache, no-transform';

// 直接管道传输，零缓冲
proxyRes.pipe(res);
```

**WebSocket 中继** (可选):

当 SSE 连接被防火墙或反向代理阻断时，启用 WebSocket 中继：

```typescript
if (config.enableWsRelay) {
    const io = new SocketIOServer(server, {
        cors: { origin: '*' },
        path: '/ws/events',
    });
    
    io.on('connection', (socket) => {
        socket.on('subscribe', async (payload) => {
            // 订阅上游 SSE 并转发到 WebSocket
        });
    });
}
```

---

## 4. 前端实现

### 4.1 GenUI 渲染组件

**文件**: `examples/web_ui/frontend-vue/src/components/chat/GenUIRenderer.vue`

核心渲染组件，负责解析 Schema 并渲染对应的 UI 组件。

```vue
<template>
  <div class="genui-renderer-container">
    <!-- 加载状态 -->
    <div v-if="isGenerating && !schemaContent" class="genui-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">正在生成UI...</span>
    </div>
    
    <!-- 流式渲染中 -->
    <div v-else-if="isGenerating && schemaContent" class="genui-streaming">
      <div class="streaming-indicator">
        <div class="loading-spinner small"></div>
        <span class="streaming-text">渲染中...</span>
      </div>
      <GenuiConfigProvider theme="light" locale="zh_CN">
        <GenuiRenderer :content="schemaContent" :generating="true" />
      </GenuiConfigProvider>
    </div>
    
    <!-- 完整渲染 -->
    <GenuiConfigProvider v-else-if="schemaContent" theme="light" locale="zh_CN">
      <GenuiRenderer :content="schemaContent" :generating="false" />
    </GenuiConfigProvider>
    
    <!-- 空状态 -->
    <div v-else class="genui-empty">
      <span class="empty-text">暂无UI内容</span>
    </div>
  </div>
</template>
```

**Schema 清洗**:

移除不安全的 JSExpression，防止 XSS 攻击：

```typescript
function sanitizeNode(node: any): any {
  if (!node || typeof node !== 'object') return node;
  
  const result: any = { ...node };
  
  // 移除 props 中的 JSExpression
  if (result.props) {
    const props: Record<string, any> = {};
    for (const [key, val] of Object.entries(result.props)) {
      if (isJSExpression(val)) continue;
      props[key] = val;
    }
    result.props = props;
  }
  
  // 递归处理 children
  if (result.children) {
    result.children = result.children.map(sanitizeNode);
  }
  
  return result;
}
```

### 4.2 自定义组件库

**文件**: `examples/web_ui/frontend-vue/src/components/chat/GenUICustomComponents.ts`

基于 OpenTiny 组件库封装的 GenUI 专用组件：

| 组件名 | 说明 | 主要 Props |
|-------|------|-----------|
| `TinyForm` | 表单容器 | `model`, `labelWidth`, `labelPosition` |
| `TinyFormItem` | 表单项 | `label`, `prop`, `required` |
| `TinyInput` | 输入框 | `type`, `placeholder`, `clearable` |
| `TinyButton` | 按钮 | `type`, `text`, `loading` |
| `TinyNumeric` | 数字输入 | `min`, `max`, `step` |

**表单状态管理**:

通过 Vue 的 `provide/invest` 实现表单上下文共享：

```typescript
const FORM_KEY = Symbol('genui-form');

interface FormContext {
  model: Record<string, any>;
  fields: Record<string, { prop: string; el: any }>;
  registerField: (prop: string, el: any) => void;
  unregisterField: (prop: string) => void;
}

// 在 TinyForm 中 provide
provide(FORM_KEY, { model: formModel, fields, registerField, unregisterField });

// 在 TinyInput 中 inject
const formCtx = inject<FormContext | null>(FORM_KEY, null);
```

### 4.3 消息气泡集成

**文件**: `examples/web_ui/frontend-vue/src/components/chat/MessageBubble.vue`

扩展消息气泡组件，支持 GenUI 类型消息：

```typescript
// 新增 GenUIBlock 类型
interface GenUIBlock {
  type: 'genui';
  id?: string;
  schema: string | object;
  state?: Record<string, any>;
  generating?: boolean;
}

type ExtendedContentBlock = ContentBlock | ToolCallGroupBlock | GenUIBlock;
```

**工具调用结果提取**:

当 Agent 调用 `generate_genui` 工具后，从工具结果中提取 Schema：

```typescript
function extractGenUISchema(toolResult: any, callId?: string): GenUIBlock | null {
  try {
    const output = toolResult.output;
    const text = Array.isArray(output)
      ? output.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
      : typeof output === 'string' ? output : '';
    
    const parsed = JSON.parse(text);
    if (parsed.type === 'genui' && parsed.schema) {
      return {
        type: 'genui',
        id: callId || cacheKey,
        schema: parsed.schema,
        state: parsed.schema.state || parsed.state || {},
        generating: toolResult.state === 'running',
      };
    }
  } catch {
    // 解析失败 - 可能是流式传输中的部分 JSON
  }
  return null;
}
```

**性能优化**:

使用 `v-memo` 指令减少不必要的重渲染：

```vue
<div v-if="block.type === 'genui'" :class="blockPad">
  <GenUIRenderer
    v-memo="[block, block.generating]"
    :block="block"
    :is-generating="!!block.generating"
  />
</div>
```

### 4.4 工具函数库

**文件**: `examples/web_ui/frontend-vue/src/utils/genui.ts`

提供 Schema 处理的工具函数：

```typescript
// Schema 解析
export function parseGenUISchema(schema: string | GenUISchema): GenUISchema | null;

// Schema 验证
export function validateGenUISchema(schema: any): boolean;

// 检查是否包含 GenUI 内容
export function hasGenUIContent(content: any[]): boolean;

// 提取 GenUI Schema
export function extractGenUISchema(content: any[]): GenUISchema | null;

// 创建 GenUI 内容块
export function createGenUIBlock(schema: GenUISchema | string, state?: Record<string, any>): GenUIContentBlock;

// 检查是否需要生成 UI
export function shouldGenerateUI(userMessage: string): boolean;
```

### 4.5 API 调用层

**文件**: `examples/web_ui/frontend-vue/src/api/genui.ts`

封装与后端的 API 交互：

```typescript
// 普通请求
export async function sendChatMessage(message: string, apiUrl: string = '/api/chat'): Promise<ChatResponse>;

// 流式请求
export async function sendChatMessageStream(
  message: string,
  apiUrl: string = '/api/genui/stream',
  onChunk: (chunk: string) => void,
  onComplete: (schema: GenUISchema) => void
): Promise<void>;

// 响应转换
export function convertResponseToContentBlock(response: ChatResponse): GenUIContentBlock[];
```

**流式响应处理**:

```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder('utf-8');
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  
  while (true) {
    const lineEndIndex = buffer.indexOf('\n');
    if (lineEndIndex === -1) break;
    
    const line = buffer.slice(0, lineEndIndex).trim();
    buffer = buffer.slice(lineEndIndex + 1);
    
    if (!line.startsWith('data: ')) continue;
    
    const dataStr = line.slice(6);
    if (dataStr === '[DONE]') return;
    
    const chunk = JSON.parse(dataStr);
    if (chunk.schema) {
      onComplete(chunk.schema);
    } else if (chunk.content) {
      onChunk(chunk.content);
    }
  }
}
```

---

## 5. 数据流

### 完整调用流程

```
┌─────────────┐
│  用户输入    │  "帮我创建一个登录表单"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Agent 处理  │  识别用户意图，决定调用工具
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  调用工具    │  generate_genui(user_message="帮我创建一个登录表单")
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  生成 Schema │  返回 {"type": "genui", "schema": {...}}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  SSE 流式传输 │  通过 /sessions/{id}/stream 发送事件
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  前端接收    │  MessageBubble 解析 tool_result
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  提取 Schema │  extractGenUISchema() 解析 JSON
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  渲染 UI    │  GenUIRenderer 渲染 OpenTiny 组件
└─────────────┘
```

### 消息格式

**Agent 返回的工具结果**:

```json
{
  "type": "tool_result",
  "name": "generate_genui",
  "output": [
    {
      "type": "text",
      "text": "{\"type\":\"genui\",\"schema\":{\"componentName\":\"Page\",...},\"message\":\"为您生成了以下界面：\"}"
    }
  ],
  "state": "finished"
}
```

**前端解析后的 GenUI Block**:

```typescript
{
  type: 'genui',
  id: 'tcg-generate_genui-xxx',
  schema: {
    componentName: 'Page',
    props: { style: { padding: '20px' } },
    children: [
      { componentName: 'Text', props: { text: '用户登录' } },
      { componentName: 'TinyForm', children: [...] }
    ]
  },
  state: {},
  generating: false
}
```

---

## 6. Schema 规范

### 基础结构

```typescript
interface GenUISchema {
  componentName: string;           // 组件名称
  props?: Record<string, any>;     // 组件属性
  children?: GenUISchema[];        // 子组件
  state?: Record<string, any>;     // 状态数据
  methods?: Record<string, any>;   // 方法定义
  css?: string;                    // 自定义样式
}
```

### 支持的组件

| 组件类型 | componentName | 说明 |
|---------|--------------|------|
| 页面容器 | `Page` | 根容器 |
| 文本 | `Text` | 文本显示 |
| 表单 | `TinyForm` | 表单容器 |
| 表单项 | `TinyFormItem` | 表单项 |
| 输入框 | `TinyInput` | 文本输入 |
| 按钮 | `TinyButton` | 操作按钮 |
| 数字输入 | `TinyNumeric` | 数字输入 |
| 表格 | `table` | HTML 表格 |

### 示例 Schema

**登录表单**:

```json
{
  "componentName": "Page",
  "props": {
    "style": {
      "padding": "20px",
      "maxWidth": "400px",
      "margin": "0 auto"
    }
  },
  "children": [
    {
      "componentName": "Text",
      "props": {
        "text": "用户登录",
        "style": {
          "fontSize": "24px",
          "fontWeight": "bold",
          "textAlign": "center"
        }
      }
    },
    {
      "componentName": "TinyForm",
      "props": { "model": "loginForm" },
      "children": [
        {
          "componentName": "TinyFormItem",
          "props": { "label": "用户名", "prop": "username" },
          "children": [
            {
              "componentName": "TinyInput",
              "props": { "placeholder": "请输入用户名" }
            }
          ]
        },
        {
          "componentName": "TinyFormItem",
          "props": { "label": "密码", "prop": "password" },
          "children": [
            {
              "componentName": "TinyInput",
              "props": { "type": "password", "placeholder": "请输入密码" }
            }
          ]
        },
        {
          "componentName": "TinyFormItem",
          "children": [
            {
              "componentName": "TinyButton",
              "props": { "type": "primary", "text": "登录" }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 7. 部署与配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|-------|------|-------|
| `PORT` | 后端服务端口 | `3000` |
| `AGENTSCOPE_UPSTREAM` | AgentScope 服务地址 | `http://127.0.0.1:8000` |
| `ENABLE_WS_RELAY` | 启用 WebSocket 中继 | `0` |

### 启动步骤

**1. 启动 AgentScope Python 服务**:

```bash
cd examples/agent_service
python main.py
```

**2. 启动 Node.js 后端代理**:

```bash
cd examples/web_ui/backend
npm install
npm run dev
```

**3. 启动 Vue 前端**:

```bash
cd examples/web_ui/frontend-vue
npm install --legacy-peer-deps
npm run dev
```

**4. 访问应用**:

打开浏览器访问 `http://localhost:5173`

### 构建注意事项

**CSS 压缩问题**:

已禁用 CSS 压缩以解决构建问题：

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    // 禁用 CSS 压缩
    postcss: '',
  },
});
```

**依赖冲突**:

使用 `--legacy-peer-deps` 安装依赖：

```bash
npm install --legacy-peer-deps
```

---

## 8. 扩展指南

### 添加新组件

**1. 定义组件** (`GenUICustomComponents.ts`):

```typescript
const GenuiTinySelect = defineComponent({
  name: 'GenuiTinySelect',
  props: {
    modelValue: { type: [String, Number], default: '' },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: '请选择' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h(TinySelectOrigin, {
      modelValue: props.modelValue,
      'onUpdate:modelValue': (v: any) => emit('update:modelValue', v),
      options: props.options,
      placeholder: props.placeholder,
    });
  },
});

// 导出
export const genuiCustomComponents = {
  // ... 现有组件
  TinySelect: GenuiTinySelect,
};
```

**2. 注册组件** (`GenUIRenderer.vue`):

```typescript
import { genuiCustomComponents } from './GenUICustomComponents';

const customComponents = genuiCustomComponents;
```

### 添加新模板

**1. 在 `GenUIgenerator.TEMPLATES` 中添加**:

```python
TEMPLATES = {
    # ... 现有模板
    "dashboard": {
        "schema": {
            "componentName": "Page",
            "children": [
                # 仪表盘组件结构
            ]
        }
    }
}
```

**2. 更新关键词匹配**:

```python
@classmethod
def detect_template(cls, user_message: str) -> Optional[str]:
    lower_msg = user_message.lower()
    # ... 现有匹配
    elif any(kw in lower_msg for kw in ["仪表盘", "dashboard", "统计"]):
        return "dashboard"
    return None
```

### 自定义动作

在 `GenUIRenderer.vue` 中添加自定义动作：

```typescript
const customActions = {
  // 现有动作
  openPage: {
    execute: (params: any) => {
      window.open(params.url, params.target || '_self');
    },
  },
  // 新增动作
  submitForm: {
    execute: async (params: any) => {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(params.formData),
      });
      return response.json();
    },
  },
};
```

---

## 附录: 文件结构

```
examples/
├── agent_service/
│   ├── main.py                    # Agent 服务入口
│   └── genui_tool.py              # GenUI 工具定义
│
└── web_ui/
    ├── genui_api_example.py       # Flask API 示例
    ├── GENUI_INTEGRATION.md       # 集成指南
    ├── GENUI_SUMMARY.md           # 完成总结
    │
    ├── backend/
    │   ├── src/
    │   │   ├── index.ts           # Express 服务
    │   │   └── config.ts          # 配置管理
    │   └── package.json
    │
    └── frontend-vue/
        └── src/
            ├── api/
            │   └── genui.ts       # API 调用
            ├── assets/
            │   └── styles/
            │       └── genui.css  # 样式文件
            ├── components/
            │   └── chat/
            │       ├── GenUIRenderer.vue      # 核心渲染组件
            │       ├── GenUICustomComponents.ts # 自定义组件
            │       ├── GenUITest.vue          # 测试组件
            │       └── MessageBubble.vue      # 消息气泡 (已修改)
            ├── utils/
            │   └── genui.ts       # 工具函数
            └── views/
                └── GenUIExample.vue # 示例页面
```

---

*文档生成时间: 2026-07-12*
