<template>
  <div class="genui-test-container">
    <h2 class="test-title">GenUI 集成测试</h2>
    
    <div class="test-section">
      <h3>1. GenUI Renderer 组件测试</h3>
      <div class="test-case">
        <h4>简单文本</h4>
        <GenUIRenderer :block="simpleTextBlock" />
      </div>
      
      <div class="test-case">
        <h4>表单组件</h4>
        <GenUIRenderer :block="formBlock" />
      </div>
      
      <div class="test-case">
        <h4>加载状态</h4>
        <GenUIRenderer :block="emptyBlock" :is-generating="true" />
      </div>
    </div>
    
    <div class="test-section">
      <h3>2. 工具函数测试</h3>
      <div class="test-case">
        <h4>Schema 解析</h4>
        <p>解析结果：{{ parseTestResult }}</p>
      </div>
      
      <div class="test-case">
        <h4>UI 生成判断</h4>
        <p>"生成登录表单" 需要生成 UI：{{ shouldGenerateTest1 }}</p>
        <p>"今天天气怎么样" 需要生成 UI：{{ shouldGenerateTest2 }}</p>
      </div>
    </div>
    
    <div class="test-section">
      <h3>3. API 调用测试</h3>
      <div class="test-case">
        <button @click="testApiCall" :disabled="apiLoading">
          {{ apiLoading ? '测试中...' : '测试 API 调用' }}
        </button>
        <p v-if="apiResult">API 结果：{{ apiResult }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import GenUIRenderer from './GenUIRenderer.vue';
import { parseGenUISchema, shouldGenerateUI } from '@/utils/genui';
import type { GenUIContentBlock } from '@/utils/genui';

// 测试数据
const simpleTextBlock: GenUIContentBlock = {
  type: 'genui',
  schema: {
    componentName: 'Page',
    children: [
      {
        componentName: 'Text',
        props: {
          text: '这是一个简单的文本测试',
          style: {
            fontSize: '16px',
            color: '#333'
          }
        }
      }
    ]
  }
};

const formBlock: GenUIContentBlock = {
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
            props: { label: '邮箱' },
            children: [
              {
                componentName: 'Input',
                props: { placeholder: '请输入邮箱', type: 'email' }
              }
            ]
          },
          {
            componentName: 'FormItem',
            children: [
              {
                componentName: 'Button',
                props: { type: 'primary', text: '提交' }
              }
            ]
          }
        ]
      }
    ]
  }
};

const emptyBlock: GenUIContentBlock = {
  type: 'genui',
  schema: { componentName: 'Page', children: [] }
};

// 工具函数测试
const parseTestResult = computed(() => {
  const schema = parseGenUISchema('{"componentName":"Text","props":{"text":"测试"}}');
  return schema ? '成功' : '失败';
});

const shouldGenerateTest1 = shouldGenerateUI('生成登录表单');
const shouldGenerateTest2 = shouldGenerateUI('今天天气怎么样');

// API 测试
const apiLoading = ref(false);
const apiResult = ref('');

async function testApiCall() {
  apiLoading.value = true;
  apiResult.value = '';
  
  try {
    // 这里应该调用实际的 API，现在只是模拟
    await new Promise(resolve => setTimeout(resolve, 1000));
    apiResult.value = 'API 调用成功（模拟）';
  } catch (error) {
    apiResult.value = `API 调用失败：${error}`;
  } finally {
    apiLoading.value = false;
  }
}
</script>

<style scoped>
.genui-test-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.test-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #333;
}

.test-section {
  margin-bottom: 32px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.test-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.test-case {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #ffffff;
}

.test-case h4 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #666;
}

.test-case p {
  font-size: 14px;
  color: #666;
  margin: 8px 0;
}

.test-case button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.test-case button:hover {
  background: #66b1ff;
}

.test-case button:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}
</style>
