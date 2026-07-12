# GenUI 快速开始指南

## 在现有聊天窗口中使用 GenUI

### 1. 确认依赖已安装
```bash
cd examples/web_ui/frontend-vue
npm ls @opentiny/genui-sdk-vue
```

### 2. 在消息中添加 GenUI 内容

在发送消息时，添加 `type: 'genui'` 的内容块：

```typescript
// 示例：发送包含 GenUI 的消息
const message = {
  id: '1',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: '为您生成了登录表单：'
    },
    {
      type: 'genui',
      schema: {
        componentName: 'Page',
        children: [
          {
            componentName: 'Form',
            children: [
              {
                componentName: 'FormItem',
                props: { label: '用户名' },
                children: [
                  {
                    componentName: 'Input',
                    props: { placeholder: '请输入用户名' }
                  }
                ]
              },
              {
                componentName: 'FormItem',
                props: { label: '密码' },
                children: [
                  {
                    componentName: 'Input',
                    props: { type: 'password', placeholder: '请输入密码' }
                  }
                ]
              },
              {
                componentName: 'FormItem',
                children: [
                  {
                    componentName: 'Button',
                    props: { type: 'primary', text: '登录' }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  created_at: new Date().toISOString()
};
```

### 3. 使用工具函数创建消息

```typescript
import { createGenUIBlock, textToGenUISchema } from '@/utils/genui';

// 创建简单的文本 GenUI
const textBlock = createGenUIBlock(
  textToGenUISchema('这是一个文本消息')
);

// 创建复杂的表单 GenUI
const formBlock = createGenUIBlock({
  componentName: 'Page',
  children: [
    {
      componentName: 'Form',
      children: [
        // 表单内容...
      ]
    }
  ]
});
```

### 4. 在 API 响应中使用

后端 API 返回 GenUI 格式的响应：

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

### 5. 前端处理响应

```typescript
import { convertResponseToContentBlock } from '@/api/genui';

// 转换 API 响应为消息内容
const response = await sendChatMessage('生成登录表单');
const contentBlocks = convertResponseToContentBlock(response);

// 添加到消息列表
const newMessage = {
  id: Date.now().toString(),
  role: 'assistant',
  content: contentBlocks,
  created_at: new Date().toISOString()
};

messages.value.push(newMessage);
```

## 常用 GenUI 组件

### 1. 文本组件
```json
{
  "componentName": "Text",
  "props": {
    "text": "Hello World",
    "style": {
      "fontSize": "16px",
      "color": "#333"
    }
  }
}
```

### 2. 输入框组件
```json
{
  "componentName": "Input",
  "props": {
    "placeholder": "请输入内容",
    "type": "text"
  }
}
```

### 3. 按钮组件
```json
{
  "componentName": "Button",
  "props": {
    "type": "primary",
    "text": "提交"
  }
}
```

### 4. 表单组件
```json
{
  "componentName": "Form",
  "children": [
    {
      "componentName": "FormItem",
      "props": { "label": "用户名" },
      "children": [
        {
          "componentName": "Input",
          "props": { "placeholder": "请输入用户名" }
        }
      ]
    }
  ]
}
```

### 5. 表格组件
```json
{
  "componentName": "Table",
  "props": {
    "data": [
      { "id": 1, "name": "张三" },
      { "id": 2, "name": "李四" }
    ],
    "columns": [
      { "prop": "id", "label": "ID" },
      { "prop": "name", "label": "姓名" }
    ]
  }
}
```

## 自定义组件

### 1. 创建自定义组件
```vue
<!-- components/custom/MyChart.vue -->
<template>
  <div class="my-chart">
    <!-- 图表内容 -->
  </div>
</template>

<script setup>
// 组件逻辑
</script>
```

### 2. 注册自定义组件
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

### 3. 在 Schema 中使用
```json
{
  "componentName": "MyChart",
  "props": {
    "data": [...],
    "type": "bar"
  }
}
```

## 自定义动作

### 1. 定义动作
```typescript
const customActions = {
  openPage: {
    execute: (params, context) => {
      window.open(params.url, params.target || '_self');
    }
  },
  showNotification: {
    execute: (params) => {
      alert(params.message);
    }
  }
};
```

### 2. 在 Schema 中使用
```json
{
  "componentName": "Button",
  "props": {
    "text": "打开页面"
  },
  "methods": {
    "onClick": {
      "type": "JSFunction",
      "value": "openPage",
      "params": {
        "url": "https://example.com"
      }
    }
  }
}
```

## 调试技巧

### 1. 检查 Schema 格式
```typescript
import { validateGenUISchema } from '@/utils/genui';

const isValid = validateGenUISchema(yourSchema);
console.log('Schema 有效:', isValid);
```

### 2. 查看渲染状态
```vue
<GenUIRenderer 
  :block="block"
  :is-generating="isGenerating"
/>
```

### 3. 使用测试组件
```vue
<template>
  <GenUITest />
</template>

<script setup>
import GenUITest from '@/components/chat/GenUITest.vue';
</script>
```

## 常见问题

### Q: GenUI 组件不显示？
A: 检查 schema 格式是否正确，确保 `componentName` 存在。

### Q: 样式不生效？
A: 确保在 `main.ts` 中引入了 `genui.css` 样式文件。

### Q: 如何支持更多组件？
A: 创建自定义组件并通过 `customComponents` 注册。

### Q: 如何处理大 schema？
A: 使用流式生成，或实现组件懒加载。

## 下一步

1. 查看 `GENUI_INTEGRATION.md` 了解详细集成步骤
2. 运行 `GenUIExample.vue` 查看示例效果
3. 参考 OpenTiny NEXT 文档了解更多组件
