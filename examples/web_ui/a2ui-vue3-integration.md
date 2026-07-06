# Vue 3 + A2UI 完整落地方案

## 整体架构

```
┌─────────────────┐     A2UI JSON (JSONL)      ┌──────────────────────┐
│   后端 (Agent)    │ ─────────────────────────▶ │   前端 (Vue 3)        │
│  - 生成 A2UI 消息  │                            │  - @a2ui/web_core    │
│  - 调用 LLM      │                            │  - Vue 渲染器        │
│  - 处理用户动作   │ ◀───────────────────────── │  - 组件映射          │
└─────────────────┘   Action / 错误消息         └──────────────────────┘
         │                                                        │
         └─────────── Transport (SSE / WebSocket / A2A) ──────────┘
```

---

## 一、前端需要做的事

### 1. 安装依赖

```bash
npm install @a2ui/web_core@v0_9 vue
```

### 2. 项目目录结构

```
src/
├── a2ui/
│   ├── MessageProcessor.ts      # 消息处理器封装
│   ├── Catalog.ts               # 组件目录注册
│   ├── components/
│   │   ├── A2UISurface.vue      # Surface 容器组件
│   │   ├── A2uiText.vue         # Text 组件映射
│   │   ├── A2uiButton.vue       # Button 组件映射
│   │   ├── A2uiTextField.vue    # TextField 组件映射
│   │   ├── A2uiColumn.vue       # Column 布局组件
│   │   ├── A2uiCard.vue         # Card 组件
│   │   └── ...                  # 更多组件映射
│   └── composables/
│       └── useA2UI.ts           # Vue composable
├── transport/
│   ├── SSEClient.ts             # SSE 传输层
│   └── WebSocketClient.ts       # WebSocket 传输层
└── App.vue
```

### 3. 核心代码实现

#### 3.1 消息处理器封装 (`a2ui/MessageProcessor.ts`)

```typescript
import { MessageProcessor, SurfaceModel } from '@a2ui/web_core/v0_9'
import { ref, reactive } from 'vue'

export class VueA2UIProcessor {
  private processor: MessageProcessor
  private surfaces = reactive<Map<string, SurfaceModel>>(new Map())
  private connected = ref(false)

  constructor() {
    this.processor = new MessageProcessor()
  }

  /** 处理来自后端的 A2UI 消息 */
  processMessage(json: string): void {
    try {
      this.processor.processLine(json)
      this.syncSurfaces()
    } catch (err) {
      this.sendError(err)
    }
  }

  /** 同步状态到 Vue 响应式系统 */
  private syncSurfaces(): void {
    // web_core 内部状态 -> Vue reactive 映射
    // 具体实现参考 React 渲染器的 sync 逻辑
  }

  /** 发送用户动作到后端 */
  async sendAction(action: {
    version: string
    action: {
      name: string
      surfaceId: string
      context: Record<string, unknown>
    }
  }): Promise<void> {
    await this.transport.send(JSON.stringify(action))
  }

  /** 发送验证错误到后端 */
  private sendError(error: unknown): void {
    // VALIDATION_FAILED 错误回传
  }
}
```

#### 3.2 组件注册表 (`a2ui/Catalog.ts`)

```typescript
import type { Component } from 'vue'

// 组件映射表：A2UI 组件名 -> Vue 组件
export const componentRegistry = new Map<string, Component>([
  ['Text', () => import('./components/A2uiText.vue')],
  ['Button', () => import('./components/A2uiButton.vue')],
  ['TextField', () => import('./components/A2uiTextField.vue')],
  ['Column', () => import('./components/A2uiColumn.vue')],
  ['Row', () => import('./components/A2uiRow.vue')],
  ['Card', () => import('./components/A2uiCard.vue')],
  ['Image', () => import('./components/A2uiImage.vue')],
  ['List', () => import('./components/A2uiList.vue')],
  ['Tabs', () => import('./components/A2uiTabs.vue')],
  ['Modal', () => import('./components/A2uiModal.vue')],
  ['CheckBox', () => import('./components/A2uiCheckBox.vue')],
  ['Slider', () => import('./components/A2uiSlider.vue')],
  ['ChoicePicker', () => import('./components/A2uiChoicePicker.vue')],
  ['Divider', () => import('./components/A2uiDivider.vue')],
  ['Icon', () => import('./components/A2uiIcon.vue')],
])

// 向 Agent 声明支持的目录
export const supportedCatalogIds = [
  'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
]
```

#### 3.3 Surface 容器组件 (`a2ui/components/A2UISurface.vue`)

```vue
<template>
  <div class="a2ui-surface" :data-surface-id="surfaceId">
    <template v-if="rootComponentId">
      <A2uiComponentRenderer
        :component="resolvedRootComponent"
        :data-model="dataModel"
        :on-action="handleAction"
      />
    </template>
    <div v-else class="a2ui-loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useA2UIState } from '../composables/useA2UIState'

const props = defineProps<{
  surfaceId: string
}>()

const { getSurface, getRootComponent, getDataModel, sendAction } = useA2UIState()

const resolvedRootComponent = computed(() => {
  const surface = getSurface(props.surfaceId)
  return surface?.rootComponent || null
})

const rootComponentId = computed(() => {
  return resolvedRootComponent.value?.id || null
})

const dataModel = computed(() => {
  const surface = getSurface(props.surfaceId)
  return surface?.dataModel || {}
})

function handleAction(actionEvent: CustomEvent) {
  const { name, context } = actionEvent.detail
  sendAction({
    version: 'v0.9',
    action: {
      name,
      surfaceId: props.surfaceId,
      context,
    },
  })
}

// 动态渲染子组件（递归解析 adjacency list）
const A2uiComponentRenderer = defineAsyncComponent(
  () => import('./A2uiComponentRenderer.vue')
)
</script>
```

#### 3.4 通用组件渲染器 (`a2ui/components/A2uiComponentRenderer.vue`)

```vue
<template>
  <!-- 根据 component.type 动态加载对应 Vue 组件 -->
  <component
    :is="resolvedComponent"
    v-bind="resolvedProps"
    :children="resolvedChildren"
    :data-model="dataModel"
    @a2ui-action="emitAction"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { componentRegistry } from '../Catalog'

const props = defineProps<{
  component: A2UIComponent
  dataModel: Record<string, unknown>
  children?: A2UIComponent[]
}>()

const resolvedComponent = computed(() => {
  return componentRegistry.get(props.component.component) || null
})

const resolvedProps = computed(() => {
  // 剥离 A2UI 协议字段，留下组件属性
  const { component: _type, id, children, ...rest } = props.component
  return rest
})

const resolvedChildren = computed(() => {
  // 根据 adjacency list 解析子组件引用
  if (!props.children) return []
  return props.children
})

function emitAction(event: CustomEvent) {
  $emit('a2ui-action', event.detail)
}
</script>
```

#### 3.5 具体组件示例 — Text (`a2ui/components/A2uiText.vue`)

```vue
<template>
  <component :is="tagClass" :class="variantClass">{{ text }}</component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption'
}>()

const tagClass = computed(() => {
  const map = { h1: 'h1', h2: 'h2', h3: 'h3', body: 'p', caption: 'span' }
  return map[props.variant || 'body']
})

const variantClass = computed(() => `a2ui-text-${props.variant || 'body'}`)
</script>
```

#### 3.6 具体组件示例 — Button (`a2ui/components/A2uiButton.vue`)

```vue
<template>
  <button
    :class="[variant === 'primary' ? 'a2ui-btn-primary' : 'a2ui-btn']"
    :disabled="isDisabled"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'primary' | 'borderless'
  action?: { event?: { name: string; context?: Record<string, unknown> } }
  checks?: Array<{ condition: { call: string; args: Record<string, unknown> }; message: string }>
}>()

const isDisabled = computed(() => {
  // 执行 checks 验证，任一失败则禁用
  if (!props.checks) return false
  return props.checks.some(check => !evaluateCheck(check))
})

function onClick() {
  if (isDisabled.value) return
  const { name, context } = props.action?.event || {}
  // 解析 context 中的 path 引用，从 dataModel 取值
  const resolvedContext = resolveContextPaths(context)
  emit('a2ui-action', { name, context: resolvedContext })
}

function resolveContextPaths(context: Record<string, unknown>) {
  // 将 { path: "/reservation/guests" } 替换为 dataModel 中对应值
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (value && typeof value === 'object' && 'path' in value) {
      result[key] = resolvePath(value.path)
    } else {
      result[key] = value
    }
  }
  return result
}

function resolvePath(jsonPointer: string): unknown {
  // 实现 JSON Pointer 解析 (/key1/key2)
  const parts = jsonPointer.replace(/^\//, '').split('/')
  let obj = props.dataModel
  for (const part of parts) {
    obj = obj?.[part]
  }
  return obj
}

function evaluateCheck(check: { condition: { call: string; args: Record<string, unknown> } }) {
  // 执行客户端验证函数（如 required）
  if (check.condition.call === 'required') {
    const val = resolvePath(check.condition.args.value.path)
    return val !== undefined && val !== ''
  }
  return true
}

const emit = defineEmits<{
  'a2ui-action': [payload: { name: string; context: Record<string, unknown> }]
}>()
</script>
```

#### 3.7 具体组件示例 — TextField (`a2ui/components/A2uiTextField.vue`)

```vue
<template>
  <div class="a2ui-textfield">
    <label v-if="label">{{ label }}</label>
    <textarea
      v-if="variant === 'longText'"
      :value="currentValue"
      @input="onInput"
    />
    <input
      v-else
      :type="inputType"
      :value="currentValue"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label?: string
  value?: { path: string } | string | number
  variant?: 'shortText' | 'longText' | 'email' | 'password'
  dataModel?: Record<string, unknown>
}>()

const currentValue = ref(resolveValue(props.value, props.dataModel))

watch(
  () => props.value,
  () => { currentValue.value = resolveValue(props.value, props.dataModel) }
)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  // 写入本地 dataModel（Read/Write Contract）
  currentValue.value = target.value
  emit('a2ui-change', { value: target.value })
}

function resolveValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'path' in value) {
    // 从 dataModel 按 path 取值
    return resolvePath(value.path)
  }
  return value
}

const emit = defineEmits<{
  'a2ui-change': [payload: { value: unknown }]
}>()
</script>
```

#### 3.8 传输层 — SSE 客户端 (`transport/SSEClient.ts`)

```typescript
export class SSETransport {
  private eventSource: EventSource | null = null
  private processors: Array<(line: string) => void> = []

  connect(url: string): void {
    this.eventSource = new EventSource(url)

    this.eventSource.onmessage = (event) => {
      // 每条消息是一行 JSONL
      this.processors.forEach(fn => fn(event.data))
    }

    this.eventSource.onerror = (err) => {
      console.error('A2UI SSE connection error', err)
    }
  }

  /** 注册消息处理回调 */
  onMessage(fn: (line: string) => void): void {
    this.processors.push(fn)
  }

  /** 发送 action 到后端 */
  async sendAction(payload: string): Promise<void> {
    await fetch('/api/a2ui/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
  }

  close(): void {
    this.eventSource?.close()
  }
}
```

#### 3.9 Vue Composable (`a2ui/composables/useA2UI.ts`)

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
import { VueA2UIProcessor } from '../MessageProcessor'
import { SSETransport } from '../../transport/SSEClient'

export function useA2UI(agentUrl: string) {
  const processor = new VueA2UIProcessor()
  const transport = new SSETransport()
  const surfaces = ref(new Map<string, SurfaceData>())

  interface SurfaceData {
    components: Record<string, A2UIComponent>
    dataModel: Record<string, unknown>
    rootComponentId: string | null
  }

  function init() {
    transport.connect(agentUrl)

    transport.onMessage((line) => {
      processor.processMessage(line)
      updateSurfaces()
    })

    // 声明客户端能力
    transport.sendAction(JSON.stringify({
      version: 'v0.9',
      capabilities: {
        supportedCatalogIds: [
          'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
        ],
      },
    }))
  }

  function updateSurfaces() {
    // 将 web_core 的状态同步到 surfaces ref
  }

  function sendAction(actionPayload: {
    version: string
    action: { name: string; surfaceId: string; context: Record<string, unknown> }
  }) {
    transport.sendAction(JSON.stringify(actionPayload))
  }

  onMounted(init)
  onUnmounted(() => transport.close())

  return { surfaces, sendAction }
}
```

#### 3.10 根组件集成 (`App.vue`)

```vue
<template>
  <div id="app">
    <!-- 你的应用 UI -->
    <main>
      <A2UISurface
        v-for="surface in surfaces.values()"
        :key="surface.id"
        :surface-id="surface.id"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useA2UI } from './a2ui/composables/useA2UI'
import A2UISurface from './a2ui/components/A2UISurface.vue'

const { surfaces } = useA2UI('http://localhost:8080/api/a2ui/stream')
</script>
```

---

## 二、后端需要做的事

### 1. Agent 生成 A2UI 消息

后端 Agent（Python/Node/Go 均可）需要：

```python
# Python 伪代码示例 - Agent 生成 A2UI 消息

import json

def generate_ui(user_message: str) -> list[str]:
    """Agent 根据用户消息生成 A2UI JSON 消息序列"""
    
    # 第1步：创建 Surface
    messages = [json.dumps({
        "version": "v0.9",
        "createSurface": {
            "surfaceId": "booking",
            "catalogId": "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json",
            "sendDataModel": True  # 启用数据模型同步
        }
    })]
    
    # 第2步：定义组件结构
    messages.append(json.dumps({
        "version": "v0.9",
        "updateComponents": {
            "surfaceId": "booking",
            "components": [
                {
                    "id": "root",
                    "component": "Column",
                    "children": ["title", "form", "submit-btn"]
                },
                {
                    "id": "title",
                    "component": "Text",
                    "text": "Book a Table",
                    "variant": "h1"
                },
                {
                    "id": "guests-input",
                    "component": "TextField",
                    "label": "Number of Guests",
                    "value": {"path": "/booking/guests"},
                    "variant": "shortText"
                },
                {
                    "id": "submit-btn",
                    "component": "Button",
                    "child": "submit-text",
                    "variant": "primary",
                    "action": {
                        "event": {
                            "name": "confirm_booking",
                            "context": {
                                "guests": {"path": "/booking/guests"}
                            }
                        }
                    }
                },
                {
                    "id": "submit-text",
                    "component": "Text",
                    "text": "Confirm"
                }
            ]
        }
    }))
    
    # 第3步：初始化数据模型
    messages.append(json.dumps({
        "version": "v0.9",
        "updateDataModel": {
            "surfaceId": "booking",
            "path": "/booking",
            "value": {
                "guests": ""
            }
        }
    }))
    
    return messages
```

### 2. 传输层 — SSE 端点

```python
# FastAPI 示例
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

@app.get("/api/a2ui/stream")
async def stream_a2ui():
    """SSE 端点：持续推送 A2UI 消息"""
    async def event_generator():
        # 接收用户消息后触发
        user_msg = await get_user_message()  # 从队列/WebSocket 获取
        agent = create_agent()
        
        # Agent 生成 A2UI 消息并逐行推送
        for a2ui_msg in agent.generate(user_msg):
            yield f"data: {a2ui_msg}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

### 3. 接收用户 Action

```python
@app.post("/api/a2ui/action")
async def handle_action(payload: A2UIActionPayload):
    """处理前端发回的用户动作"""
    action = payload.action
    
    if action.name == "confirm_booking":
        guests = action.context.get("guests")
        
        # 调用 LLM 处理业务逻辑
        llm_response = await llm.chat(
            f"User confirmed booking for {guests} guests."
        )
        
        # Agent 可以返回新的 A2UI 消息（确认页面、错误提示等）
        new_messages = generate_confirmation_ui(guests)
        return {"a2ui_responses": new_messages}
    
    return {"status": "ok"}
```

---

## 三、完整交互流程

```
时间线                          前端 (Vue 3)                    后端 (Agent)
─────────────────────────────────────────────────────────────────────────
T1  <- 连接 SSE ---------------------- ----------------------------------> GET /api/a2ui/stream
T2  ------- createSurface -----------> ----------------------------------> 生成 UI 描述
T3  ------- updateComponents ---------> ----------------------------------> 定义组件树
T4  ------- updateDataModel ---------> ----------------------------------> 初始化数据
T5  <-- 渲染 Surface --------------- A2UISurface 组件挂载 ------------------
T6  <-- 用户填写表单 ---------------- TextField 本地更新 --------------------
T7  <-- 用户点击 Confirm ------------- Button 触发 action ------------------
T8  ------- POST action ------------> ----------------------------------> 发送 {name:"confirm_booking", context:{guests:"4"}}
T9  -----------------------------> LLM 处理请求 -------------------------->
T10 ------- updateComponents -------> 显示确认页面 -------------------------> 新 UI 消息
T11 <-- deleteSurface -------------- 移除 Surface -------------------------> 任务完成
```

---

## 四、需要实现的组件清单

| A2UI 组件 | Vue 组件 | 优先级 |
|-----------|----------|--------|
| Text | A2uiText | P0 必须 |
| Button | A2uiButton | P0 必须 |
| TextField | A2uiTextField | P0 必须 |
| Column | A2uiColumn | P0 必须 |
| Row | A2uiRow | P0 必须 |
| Image | A2uiImage | P0 必须 |
| Card | A2uiCard | P1 重要 |
| List | A2uiList | P1 重要 |
| CheckBox | A2uiCheckBox | P1 重要 |
| Slider | A2uiSlider | P2 可选 |
| ChoicePicker | A2uiChoicePicker | P2 可选 |
| Tabs | A2uiTabs | P2 可选 |
| Modal | A2uiModal | P2 可选 |
| Divider | A2uiDivider | P2 可选 |
| Icon | A2uiIcon | P2 可选 |

---

## 五、关键注意事项

1. **使用 `@a2ui/web_core`**：不要从零实现协议层，它已处理消息解析、状态管理、数据绑定
2. **Adjacency List 解析**：组件以扁平列表存储，通过 `id` 引用构建树，需要在渲染器中递归解析
3. **数据绑定（JSON Pointer）**：`{ "path": "/booking/guests" }` 需要从 dataModel 中按路径取值
4. **Progressive Rendering**：收到 `createSurface` + `updateComponents` 后即可渲染，无需等待特殊信号
5. **Checks 验证**：按钮的 `checks` 在客户端执行，失败时自动禁用按钮
6. **Data Model Sync**：后端在 `createSurface` 中设 `sendDataModel: true`，前端每次 action 自动附带完整数据模型
7. **错误上报**：前端遇到无效 A2UI JSON 时，发送 `VALIDATION_FAILED` 错误给后端
8. **版本兼容**：当前生产版本是 v0.9.1，建议从 v0.9 开始，逐步兼容 v1.0

---

## 六、传输方式对比

| 传输方式 | 适用场景 | 双向通信 | 实现难度 |
|----------|----------|----------|----------|
| **SSE** | 单向流式推送 | 需额外 POST | 低 |
| **WebSocket** | 实时双向通信 | 原生支持 | 中 |
| **A2A 协议** | 多 Agent 系统 | 原生支持 | 高 |
| **AG-UI** | CopilotKit 全栈方案 | 原生支持 | 中 |

---

## 七、自定义组件扩展

如需扩展自己的业务组件：

### 1. 定义组件 Schema

```typescript
// lib/a2ui/definitions.ts
import { z } from 'zod'

export const myDefinitions = {
  StatusBadge: {
    description: 'A colored status badge.',
    props: z.object({
      text: z.string(),
      variant: z.enum(['success', 'warning', 'error']).optional(),
    }),
  },
  Metric: {
    description: 'A key metric with label and value.',
    props: z.object({
      label: z.string(),
      value: z.string(),
      trend: z.enum(['up', 'down']).optional(),
    }),
  },
}
```

### 2. 创建 Vue 渲染器

```vue
<!-- A2uiStatusBadge.vue -->
<template>
  <span
    :style="{
      padding: '2px 8px',
      borderRadius: 9999,
      fontSize: '0.75rem',
      background: colors[variant],
      color: textColor[variant],
    }"
  >
    {{ props.text }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  variant?: 'success' | 'warning' | 'error'
}>()

const colors = { success: '#dcfce7', warning: '#fef3c7', error: '#fee2e2' }
const textColor = { success: '#166534', warning: '#92400e', error: '#991b1b' }
</script>
```

### 3. 注册到目录

```typescript
componentRegistry.set('StatusBadge', () => import('./A2uiStatusBadge.vue'))
componentRegistry.set('Metric', () => import('./A2uiMetric.vue'))
```

---

## 八、性能优化建议

1. **批量渲染**：缓冲 16ms 内的多条消息，批量渲染
2. **Diff 算法**：比较新旧组件，只更新变化的部分
3. **细粒度更新**：更新特定 path 的数据，而非整个 dataModel
4. **懒加载组件**：使用 `defineAsyncComponent` 按需加载组件
5. **虚拟滚动**：List 组件使用虚拟滚动处理大数据量

---

## 九、错误处理模式

```typescript
// 前端错误处理
try {
  processor.processMessage(line)
} catch (err) {
  // 发送 VALIDATION_FAILED 错误给后端
  transport.sendAction(JSON.stringify({
    version: 'v0.9',
    error: {
      code: 'VALIDATION_FAILED',
      surfaceId: 'booking',
      path: '/components/0/children',
      message: 'Expected array of strings, got null.',
    },
  }))
}

// 网络中断重连
transport.on('error', () => {
  // 显示错误状态
  showError('连接断开，正在重连...')
  
  // 延迟重连
  setTimeout(() => transport.connect(agentUrl), 3000)
})
```

---

## 十、多 Agent 路由模式

在复杂系统中，多个 Agent 可能共享同一前端：

```python
# Orchestrator 路由逻辑

# 1. 记录 Surface 归属
def on_surface_created(surface_id, agent_name, session):
    session.state[f"owner_of_{surface_id}"] = agent_name

# 2. 路由 Action 到正确的 Agent
async def handle_incoming_action(payload, session):
    action = payload.get("action")
    surface_id = action.get("surfaceId")
    target_agent = session.state.get(f"owner_of_{surface_id}")
    
    if target_agent:
        return transfer_to(target_agent, action)

# 3. 数据隔离 - 过滤敏感信息
async def strip_data_model(data_model, target_agent, session):
    filtered = {
        sid: state
        for sid, state in data_model.items()
        if session.state.get(f"owner_of_{sid}") == target_agent
    }
    return filtered
```
