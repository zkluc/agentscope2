# GenUI 集成指南

## 概述

本指南介绍了如何在现有的 AgentScope Web UI (Vue 3) 项目中集成 OpenTiny NEXT GenUI SDK，实现 AI 生成动态 UI 的能力。

## 集成步骤

### 1. 安装依赖

```bash
cd examples/web_ui/frontend-vue
npm install @opentiny/genui-sdk-vue --legacy-peer-deps
```

### 2. 项目结构

集成后新增的文件：

```
src/
├── components/chat/
│   ├── GenUIRenderer.vue      # GenUI 渲染组件
│   └── GenUITest.vue          # 测试组件
├── utils/
│   └── genui.ts               # GenUI 工具函数
├── api/
│   └── genui.ts               # GenUI API 调用
└── assets/styles/
    └── genui.css              # GenUI 样式
```

### 3. 修改现有文件

#### 3.1 修改 `MessageBubble.vue`

在 `MessageBubble.vue` 中添加对 GenUI 消息类型的支持：

```vue
<!-- 在 script 中导入 -->
import GenUIRenderer from './GenUIRenderer.vue';

<!-- 在 template 中添加 -->
<div v-else-if="block.type === 'genui'" :class="blockPad">
  <GenUIRenderer
    :block="block"
    :is-generating="isRunning"
  />
</div>
```

#### 3.2 修改 `main.ts`

在 `main.ts` 中引入 GenUI 样式：

```typescript
import './assets/styles/genui.css';
```

### 4. 使用方法

#### 4.1 在消息中使用 GenUI

GenUI 消息块的格式：

```typescript
interface GenUIContentBlock {
  type: 'genui';
  schema: GenUISchema | string;
  state?: Record<string, any>;
}
```

#### 4.2 创建 GenUI 消息

```typescript
import { createGenUIBlock } from '@/utils/genui';

const genuiMessage = createGenUIBlock({
  componentName: 'Page',
  children: [
    {
      componentName: 'Text',
      props: {
        text: 'Hello World'
      }
    }
  ]
});
```

#### 4.3 使用工具函数

```typescript
import { 
  parseGenUISchema, 
  validateGenUISchema, 
  shouldGenerateUI 
} from '@/utils/genui';

// 解析 schema
const schema = parseGenUISchema(schemaString);

// 验证 schema
const isValid = validateGenUISchema(schema);

// 判断是否需要生成 UI
const needsUI = shouldGenerateUI('生成登录表单');
```

### 5. 后端 API 改造

#### 5.1 响应格式

后端需要返回以下格式的响应：

```json
{
  "type": "genui",
  "schema": {
    "componentName": "Page",
    "children": [...]
  },
  "content": [
    {
      "type": "text",
      "text": "为您生成了以下界面："
    }
  ]
}
```

#### 5.2 Python 后端示例

参考 `genui_api_example.py` 文件，实现了：
- `/api/chat` - 聊天 API 端点
- `/api/genui/stream` - 流式 GenUI API 端点

### 6. 自定义组件

#### 6.1 创建自定义组件

```vue
<!-- components/custom/MyChart.vue -->
<template>
  <div class="my-chart">
    <!-- 自定义图表组件 -->
  </div>
</template>

<script setup>
// 组件逻辑
</script>
```

#### 6.2 注册自定义组件

```vue
<template>
  <GenUIRenderer
    :block="block"
    :custom-components="customComponents"
  />
</template>

<script setup>
import MyChart from '@/components/custom/MyChart.vue';

const customComponents = {
  MyChart: MyChart
};
</script>
```

### 7. 测试

#### 7.1 使用测试组件

```vue
<template>
  <GenUITest />
</template>

<script setup>
import GenUITest from '@/components/chat/GenUITest.vue';
</script>
```

#### 7.2 启动测试

```bash
npm run dev
```

访问 `http://localhost:5173` 查看测试效果。

### 8. 常见问题

#### 8.1 安装依赖失败

如果遇到依赖冲突，使用 `--legacy-peer-deps` 参数：

```bash
npm install @opentiny/genui-sdk-vue --legacy-peer-deps
```

#### 8.2 样式不生效

确保在 `main.ts` 中正确引入了样式文件：

```typescript
import './assets/styles/genui.css';
```

#### 8.3 Schema 解析错误

检查后端返回的 schema 格式是否正确，使用 `validateGenUISchema` 函数进行验证。

### 9. 下一步

1. 实现流式 GenUI 生成
2. 添加更多自定义组件
3. 优化性能和用户体验
4. 添加 GenUI 消息的复制/分享功能

## 参考文档

- [OpenTiny NEXT GenUI SDK 文档](https://docs.opentiny.design/genui-sdk/guide/quick-start)
- [GenuiRenderer 组件文档](https://docs.opentiny.design/genui-sdk/components/renderer)
- [GenUI Schema 协议规范](https://docs.opentiny.design/genui-sdk/schema/protocol)
