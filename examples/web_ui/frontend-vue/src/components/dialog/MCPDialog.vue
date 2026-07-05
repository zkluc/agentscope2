<template>
  <ElDialog :model-value="open" :title="t('mcp.addTitle')" :width="500" @update:model-value="$emit('update:open', $event)">
    <ElForm label-position="top">
      <ElFormItem :label="t('mcp.name')" required>
        <ElInput v-model="form.name" />
      </ElFormItem>
      <ElFormItem :label="t('mcp.type')" required>
        <ElSelect v-model="form.type" class="w-full">
          <ElOption label="STDIO" value="stdio_mcp" />
          <ElOption label="HTTP" value="http_mcp" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="form.type === 'stdio_mcp'" :label="t('mcp.command')" required>
        <ElInput v-model="form.command" />
      </ElFormItem>
      <ElFormItem v-if="form.type === 'stdio_mcp'" :label="t('mcp.args')">
        <ElInput v-model="form.argsStr" placeholder='["--arg1", "--arg2"]' />
      </ElFormItem>
      <ElFormItem v-if="form.type === 'http_mcp'" :label="t('mcp.url')" required>
        <ElInput v-model="form.url" placeholder="http://localhost:8080/sse" />
      </ElFormItem>
      <ElFormItem :label="t('mcp.isStateful')">
        <ElSwitch v-model="form.isStateful" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:open', false)">{{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleAdd">{{ t('common.add') }}</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElSwitch, ElButton, ElMessage } from 'element-plus';
import { workspaceApi } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  agentId: string;
  sessionId: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'added': [];
}>();

const { t } = useTranslation();
const loading = ref(false);
const form = reactive({
  name: '',
  type: 'stdio_mcp',
  command: '',
  argsStr: '',
  url: '',
  isStateful: false,
});

async function handleAdd() {
  if (!form.name) return;
  loading.value = true;
  try {
    const mcpConfig: any = {
      name: form.name,
      is_stateful: form.isStateful,
    };
    if (form.type === 'stdio_mcp') {
      if (!form.command) throw new Error('Command required');
      mcpConfig.mcp_config = {
        type: 'stdio_mcp',
        command: form.command,
        args: form.argsStr ? JSON.parse(form.argsStr) : [],
        env: null,
        cwd: null,
        encoding_error_handler: 'strict',
      };
    } else {
      if (!form.url) throw new Error('URL required');
      mcpConfig.mcp_config = {
        type: 'http_mcp',
        url: form.url,
        headers: null,
        timeout: null,
      };
    }
    await workspaceApi.mcp.add(props.agentId, props.sessionId, mcpConfig);
    ElMessage.success(t('mcp.addSuccess'));
    emit('added');
    emit('update:open', false);
  } catch (e) {
    ElMessage.error(t('mcp.addError'));
  } finally {
    loading.value = false;
  }
}
</script>
