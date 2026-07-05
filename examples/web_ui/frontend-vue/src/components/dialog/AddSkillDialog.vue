<template>
  <ElDialog :model-value="open" :title="t('skill.addTitle')" :width="400" @update:model-value="$emit('update:open', $event)">
    <ElForm label-position="top">
      <ElFormItem :label="t('skill.path')" required>
        <ElInput v-model="skillPath" :placeholder="t('skill.pathPlaceholder')" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:open', false)">{{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleAdd">{{ t('common.add') }}</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus';
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
const skillPath = ref('');
const loading = ref(false);

async function handleAdd() {
  if (!skillPath.value) return;
  loading.value = true;
  try {
    await workspaceApi.skill.add(props.agentId, props.sessionId, { skill_path: skillPath.value });
    ElMessage.success(t('skill.addSuccess'));
    emit('added');
    emit('update:open', false);
  } catch {
    ElMessage.error(t('skill.addError'));
  } finally {
    loading.value = false;
  }
}
</script>
