<template>
  <ElDialog :model-value="open" :width="520" @update:model-value="$emit('update:open', $event)" top="5vh">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t('knowledge.createTitle') }}</h3>
    </template>
    <ElForm label-position="top">
      <ElFormItem :label="t('knowledge.name')" required>
        <ElInput v-model="form.name" />
      </ElFormItem>
      <ElFormItem :label="t('knowledge.description')">
        <ElInput v-model="form.description" type="textarea" :rows="2" />
      </ElFormItem>
      <ElFormItem :label="t('knowledge.embeddingModel')" required>
        <ElSelect v-model="form.embeddingProvider" :placeholder="t('knowledge.selectEmbeddingModel')" class="w-full">
          <ElOption
            v-for="provider in providers"
            :key="provider.credential.id"
            :label="provider.credential.id"
            :value="provider.credential.id"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:open', false)"> {{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="creating" @click="handleCreate">{{ t('common.create') }}</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElDialog, ElButton, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElMessage } from 'element-plus';
import { useKnowledgeBases } from '@/composables/useKnowledgeBases';
import { useKbEmbeddingModels } from '@/composables/useKbEmbeddingModels';
import { knowledgeBaseApi } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  onCreated?: () => void;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const { refetch } = useKnowledgeBases();
const { providers } = useKbEmbeddingModels();
const creating = ref(false);

const form = reactive({
  name: '',
  description: '',
  embeddingProvider: '',
});

watch(() => props.open, (val) => {
  if (val) {
    form.name = '';
    form.description = '';
    form.embeddingProvider = '';
  }
});

async function handleCreate() {
  if (!form.name || !form.embeddingProvider) return;
  creating.value = true;
  try {
    const provider = providers.value.find((p) => p.credential.id === form.embeddingProvider);
    const model = provider?.models[0];
    if (!provider || !model) return;
    await knowledgeBaseApi.create({
      name: form.name,
      description: form.description || undefined,
      embedding_model_config: {
        type: (provider.credential.data as any).type,
        credential_id: provider.credential.id,
        model: model.name,
        dimensions: model.dimensions,
        parameters: {},
      },
    });
    ElMessage.success(t('knowledge.createSuccess'));
    emit('update:open', false);
    props.onCreated?.();
    refetch();
  } catch {
    ElMessage.error(t('knowledge.createError'));
  } finally {
    creating.value = false;
  }
}
</script>
