<template>
  <div class="genui-renderer-container">
    <div v-if="isGenerating && !schemaContent" class="genui-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">正在生成UI...</span>
    </div>
    <div v-else-if="isGenerating && schemaContent" class="genui-streaming">
      <div class="streaming-indicator">
        <div class="loading-spinner small"></div>
        <span class="streaming-text">渲染中...</span>
      </div>
      <GenuiConfigProvider theme="light" locale="zh_CN">
        <GenuiRenderer
          :content="schemaContent"
          :generating="true"
          :customComponents="customComponents"
          :customActions="customActions"
          :state="rendererState"
        />
      </GenuiConfigProvider>
    </div>
    <GenuiConfigProvider v-else-if="schemaContent" theme="light" locale="zh_CN">
      <GenuiRenderer
        :content="schemaContent"
        :generating="false"
        :customComponents="customComponents"
        :customActions="customActions"
        :state="rendererState"
      />
    </GenuiConfigProvider>
    <div v-else class="genui-empty">
      <span class="empty-text">暂无UI内容</span>
    </div>
  </div>
</template>

<script setup>
import { GenuiConfigProvider, GenuiRenderer } from '@opentiny/genui-sdk-vue';
import { computed } from 'vue';
import { genuiCustomComponents } from './GenUICustomComponents';

const props = defineProps({
  block: Object,
  isGenerating: Boolean,
});

function isJSExpression(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.type === 'JSExpression' && typeof obj.value === 'string';
}

const sanitizeCache = new Map<any, any>();

function sanitizeNode(node: any): any {
  if (!node || typeof node !== 'object') return node;
  if (sanitizeCache.has(node)) return sanitizeCache.get(node);
  if (Array.isArray(node)) {
    const result = node.map(sanitizeNode);
    sanitizeCache.set(node, result);
    return result;
  }

  const result: any = { ...node };

  if (result.props) {
    const props: Record<string, any> = {};
    for (const [key, val] of Object.entries(result.props)) {
      if (isJSExpression(val)) continue;
      props[key] = val;
    }
    result.props = props;
  }

  if (result.children) {
    result.children = Array.isArray(result.children)
      ? result.children.map(sanitizeNode)
      : result.children;
  }

  sanitizeCache.set(node, result);
  return result;
}

const schemaContent = computed(() => {
  if (!props.block?.schema) return null;
  
  try {
    let schema = props.block.schema;
    if (typeof schema === 'string') {
      schema = JSON.parse(schema);
    }
    return sanitizeNode(schema);
  } catch (error) {
    console.error('Failed to parse GenUI schema:', error);
    return null;
  }
});

const rendererState = computed(() => {
  // 优先使用外部传入的 state
  if (props.block?.state && Object.keys(props.block.state).length > 0) {
    return props.block.state;
  }
  // 否则从 schema 内部提取
  if (props.block?.schema && typeof props.block.schema === 'object') {
    return (props.block.schema as any).state || {};
  }
  return {};
});

const customComponents = genuiCustomComponents;

const customActions = {
  openPage: {
    execute: (params: any, _context: any) => {
      window.open(params.url, params.target || '_self');
    },
  },
  showNotification: {
    execute: (params: any) => {
      console.log('Notification:', params.message);
    },
  },
};
</script>

<style scoped>
.genui-renderer-container {
  width: 100%;
  min-height: 100px;
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 8px;
  padding: 16px;
  background: var(--bg-color, #ffffff);
}

.genui-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.genui-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #999;
  font-size: 14px;
}

.empty-text {
  color: inherit;
}

.genui-streaming {
  position: relative;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 12px;
  color: #0284c7;
}

.loading-spinner.small {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

.streaming-text {
  font-size: 12px;
  color: #0284c7;
}
</style>
