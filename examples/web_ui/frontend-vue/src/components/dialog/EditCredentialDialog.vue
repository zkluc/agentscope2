<template>
  <ElDialog :model-value="open" :width="500" @update:model-value="$emit('update:open', $event)" top="5vh">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t('dialog-credential-edit.title') }}</h3>
      <p class="text-sm text-muted-foreground mt-1">{{ t('dialog-credential-edit.description') }}</p>
    </template>
    <p v-if="loadingSchema" class="text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    <SchemaForm
      v-else-if="schema && credential"
      :schema="schema.properties"
      :model="values"
    />
    <template #footer>
      <ElButton @click="$emit('update:open', false)" :disabled="submitting">
        <CircleAlert class="size-3.5 mr-1" />{{ t('common.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="handleSubmit" :disabled="submitting || !schema">
        <ElIcon class="mr-1">
          <Loader2 v-if="submitting" class="animate-spin" />
          <Save v-else />
        </ElIcon>
        {{ submitting ? t('common.saving') : t('common.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElDialog, ElButton, ElIcon } from 'element-plus';
import { CircleAlert, Loader2, Save } from 'lucide-vue-next';
import { credentialApi } from '@/api';
import type { CredentialRecord, CredentialSchema } from '@/api';
import SchemaForm from '@/components/form/SchemaForm.vue';
import { useCredentials } from '@/composables/useCredentials';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  credential: CredentialRecord | null;
  onUpdated?: () => void;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const { update } = useCredentials();
const schema = ref<CredentialSchema | null>(null);
const loadingSchema = ref(false);
const values = reactive<Record<string, any>>({});
const submitting = ref(false);

watch(() => props.open, async (val) => {
  if (!val || !props.credential) {
    if (!val) schema.value = null;
    return;
  }
  const type = (props.credential.data as any)?.type as string | undefined;
  if (!type) return;
  loadingSchema.value = true;
  try {
    const res = await credentialApi.schemas();
    const matched = res.schemas.find(
      (s) => (s.properties.type?.const as string) === type,
    );
    schema.value = matched ?? null;
    if (matched) {
      Object.keys(values).forEach(k => delete (values as any)[k]);
      for (const [key, prop] of Object.entries(matched.properties)) {
        if (key === 'id' || key === 'type' || prop.const !== undefined) continue;
        if (prop.writeOnly) continue;
        const existing = (props.credential!.data as any)[key];
        if (existing !== undefined) {
          (values as any)[key] = existing;
        }
      }
    }
  } finally {
    loadingSchema.value = false;
  }
});

async function handleSubmit() {
  if (!schema.value || !props.credential) return;
  submitting.value = true;
  try {
    const data: Record<string, unknown> = { ...props.credential.data } as Record<string, unknown>;
    for (const [key, prop] of Object.entries(schema.value.properties)) {
      if (key === 'id' || key === 'type' || prop.const !== undefined) continue;
      const val = (values as any)[key];
      if (val !== undefined && val !== '') data[key] = val;
    }
    await update(props.credential.id, { data });
    emit('update:open', false);
    props.onUpdated?.();
  } finally {
    submitting.value = false;
  }
}
</script>
