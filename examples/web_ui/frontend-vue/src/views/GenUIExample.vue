<template>
  <div class="genui-example-container">
    <h1 class="example-title">GenUI 集成示例</h1>
    
    <div class="example-section">
      <h2>1. 简单文本示例</h2>
      <div class="example-content">
        <GenUIRenderer :block="simpleTextExample" />
      </div>
    </div>
    
    <div class="example-section">
      <h2>2. 表单示例</h2>
      <div class="example-content">
        <GenUIRenderer :block="formExample" />
      </div>
    </div>
    
    <div class="example-section">
      <h2>3. 动态生成示例</h2>
      <div class="example-content">
        <div class="input-group">
          <input 
            v-model="userInput" 
            placeholder="输入需求，例如：生成登录表单" 
            @keyup.enter="generateUI"
          />
          <button @click="generateUI" :disabled="isGenerating">
            {{ isGenerating ? '生成中...' : '生成 UI' }}
          </button>
        </div>
        <GenUIRenderer 
          v-if="generatedSchema" 
          :block="generatedBlock"
          :is-generating="isGenerating"
        />
      </div>
    </div>
    
    <div class="example-section">
      <h2>4. 测试组件</h2>
      <div class="example-content">
        <GenUITest />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenUIRenderer from '@/components/chat/GenUIRenderer.vue';
import GenUITest from '@/components/chat/GenUITest.vue';
import type { GenUIContentBlock, GenUISchema } from '@/utils/genui';
import { computed, ref } from 'vue';

const userInput = ref('');
const isGenerating = ref(false);
const generatedSchema = ref<GenUISchema | null>(null);

// 简单文本示例
const simpleTextExample: GenUIContentBlock = {
  type: 'genui',
  schema: {
    componentName: 'Page',
    children: [
      {
        componentName: 'Text',
        props: {
          text: '欢迎使用 GenUI！这是一个简单的文本示例。',
          style: {
            fontSize: '18px',
            color: '#333',
            textAlign: 'center',
            padding: '20px'
          }
        }
      }
    ]
  }
};

// 表单示例
const formExample: GenUIContentBlock = {
  type: 'genui',
  schema: {
    componentName: 'Page',
    children: [
      {
        componentName: 'Text',
        props: {
          text: '用户注册',
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px'
          }
        }
      },
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
            props: { label: '密码' },
            children: [
              {
                componentName: 'Input',
                props: { placeholder: '请输入密码', type: 'password' }
              }
            ]
          },
          {
            componentName: 'FormItem',
            children: [
              {
                componentName: 'Button',
                props: { type: 'primary', text: '注册', style: { width: '100%' } }
              }
            ]
          }
        ]
      }
    ]
  }
};

// 动态生成的 block
const generatedBlock = computed(() => ({
  type: 'genui' as const,
  schema: generatedSchema.value || { componentName: 'Page', children: [] }
}));

// 生成 UI
async function generateUI() {
  if (!userInput.value.trim()) return;
  
  isGenerating.value = true;
  
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 根据用户输入生成对应的 schema
    const lowerInput = userInput.value.toLowerCase();
    
    if (lowerInput.includes('登录') || lowerInput.includes('login')) {
      generatedSchema.value = {
        componentName: 'Page',
        children: [
          {
            componentName: 'Text',
            props: {
              text: '用户登录',
              style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }
            }
          },
          {
            componentName: 'Form',
            children: [
              {
                componentName: 'FormItem',
                props: { label: '用户名' },
                children: [{ componentName: 'Input', props: { placeholder: '请输入用户名' } }]
              },
              {
                componentName: 'FormItem',
                props: { label: '密码' },
                children: [{ componentName: 'Input', props: { placeholder: '请输入密码', type: 'password' } }]
              },
              {
                componentName: 'FormItem',
                children: [{ componentName: 'Button', props: { type: 'primary', text: '登录', style: { width: '100%' } } }]
              }
            ]
          }
        ]
      };
    } else if (lowerInput.includes('调查') || lowerInput.includes('问卷')) {
      generatedSchema.value = {
        componentName: 'Page',
        children: [
          {
            componentName: 'Text',
            props: {
              text: '用户满意度调查',
              style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }
            }
          },
          {
            componentName: 'Form',
            children: [
              {
                componentName: 'FormItem',
                props: { label: '您的姓名' },
                children: [{ componentName: 'Input', props: { placeholder: '请输入姓名' } }]
              },
              {
                componentName: 'FormItem',
                props: { label: '满意度评分' },
                children: [{ componentName: 'Rate', props: { allowHalf: true } }]
              },
              {
                componentName: 'FormItem',
                props: { label: '改进建议' },
                children: [{ componentName: 'Input', props: { type: 'textarea', rows: 4, placeholder: '请提供您的建议...' } }]
              },
              {
                componentName: 'FormItem',
                children: [{ componentName: 'Button', props: { type: 'primary', text: '提交', style: { width: '100%' } } }]
              }
            ]
          }
        ]
      };
    } else {
      // 默认表单
      generatedSchema.value = {
        componentName: 'Page',
        children: [
          {
            componentName: 'Text',
            props: {
              text: `根据"${userInput.value}"生成的界面`,
              style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }
            }
          },
          {
            componentName: 'Form',
            children: [
              {
                componentName: 'FormItem',
                props: { label: '输入框' },
                children: [{ componentName: 'Input', props: { placeholder: '请输入内容' } }]
              },
              {
                componentName: 'FormItem',
                children: [{ componentName: 'Button', props: { type: 'primary', text: '提交' } }]
              }
            ]
          }
        ]
      };
    }
  } catch (error) {
    console.error('生成 UI 失败:', error);
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped>
.genui-example-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.example-title {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 32px;
  color: #333;
}

.example-section {
  margin-bottom: 40px;
  padding: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fafafa;
}

.example-section h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.example-content {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.input-group input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input-group input:focus {
  outline: none;
  border-color: #409eff;
}

.input-group button {
  padding: 12px 24px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.input-group button:hover:not(:disabled) {
  background: #66b1ff;
}

.input-group button:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}
</style>
