<template>
  <ElDialog :model-value="open" :width="400" @update:model-value="$emit('update:open', $event)">
    <template #header>
      <h3 class="text-lg font-semibold">{{ t('dialog-session-rename.title') }}</h3>
      <p class="text-sm text-muted-foreground mt-1">{{ t('dialog-session-rename.description') }}</p>
    </template>
    <ElForm>
      <ElFormItem :label="t('dialog-session-rename.label')">
        <ElInput
          v-model="name"
          :placeholder="t('dialog-session-rename.placeholder')"
          @keydown.enter="handleConfirm"
          autofocus
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:open', false)" :disabled="loading">
        <CircleAlert class="size-3.5 mr-1" />{{ t('common.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="handleConfirm" :disabled="loading || !name.trim()">
        <ElIcon class="mr-1">
          <Loader2 v-if="loading" class="animate-spin" />
          <CircleCheck v-else />
        </ElIcon>
        {{ t('common.confirm') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElDialog, ElButton, ElForm, ElFormItem, ElInput, ElIcon } from 'element-plus';
import { CircleAlert, CircleCheck, Loader2 } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  currentName: string;
  onConfirm: (name: string) => Promise<void>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const name = ref(props.currentName);
const loading = ref(false);

watch(() => props.open, (val) => {
  if (val) name.value = props.currentName;
});

async function handleConfirm() {
  if (!name.value.trim()) return;
  loading.value = true;
  try {
    await props.onConfirm(name.value.trim());
    emit('update:open', false);
  } finally {
    loading.value = false;
  }
}
</script>
