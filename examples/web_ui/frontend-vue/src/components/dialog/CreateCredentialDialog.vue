<template>
  <ElDialog
    :model-value="open"
    :title="t('dialog-credential-create.title')"
    :width="500"
    @update:model-value="$emit('update:open', $event)"
  >
    <div class="space-y-4">
      <ElForm label-position="top">
        <ElFormItem :label="t('dialog-credential-create.selectType')">
          <ElSelect v-model="selectedType" :placeholder="t('dialog-credential-create.selectTypePlaceholder')" class="w-full">
            <ElOption v-for="s in credentialSchemas" :key="s.title" :label="s.title" :value="s.title" />
          </ElSelect>
        </ElFormItem>
        <div v-if="selectedType && schemaProps.length > 0" class="space-y-3">
          <ElFormItem
            v-for="prop in schemaProps"
            :key="prop.key"
            :label="prop.label"
          >
            <ElInput v-model="formData[prop.key]" />
          </ElFormItem>
        </div>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="$emit('update:open', false)">{{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleCreate">
        {{ t('common.create') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElInput, ElButton, ElMessage } from 'element-plus';
import { credentialApi } from '@/api';
import type { CredentialSchema } from '@/api';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const { t } = useTranslation();
const submitting = ref(false);
const selectedType = ref('');
const formData = ref<Record<string, any>>({});
const credentialSchemas = ref<CredentialSchema[]>([]);

const schemaProps = computed(() => {
  const schema = credentialSchemas.value.find((s) => s.title === selectedType.value);
  if (!schema?.properties) return [];
  return Object.entries(schema.properties).map(([key, prop]: [string, any]) => ({
    key,
    label: prop.title || key,
    type: prop.type || 'string',
  }));
});

watch(selectedType, () => {
  formData.value = {};
});

onMounted(async () => {
  try {
    const res = await credentialApi.schemas();
    credentialSchemas.value = res.schemas;
  } catch {
    // silently fail
  }
});

async function handleCreate() {
  if (!selectedType.value) return;
  submitting.value = true;
  try {
    await credentialApi.create({ data: { ...formData.value } });
    ElMessage.success(t('dialog-credential-create.createSuccess'));
    emit('update:open', false);
    props.onCreated();
  } catch {
    ElMessage.error(t('dialog-credential-create.createError'));
  } finally {
    submitting.value = false;
  }
}
</script>
