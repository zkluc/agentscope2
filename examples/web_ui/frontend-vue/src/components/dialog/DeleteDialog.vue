<template>
  <ElDialog :model-value="open" :width="400" @update:model-value="$emit('update:open', $event)">
    <template #header>
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <p v-if="description" class="text-sm text-muted-foreground mt-1">{{ description }}</p>
    </template>
    <template #footer>
      <ElButton @click="$emit('update:open', false)" :disabled="deleting">
        <CircleAlert class="size-3.5 mr-1" />{{ t('common.cancel') }}
      </ElButton>
      <ElButton type="danger" @click="handleConfirm" :disabled="deleting" autofocus>
        <ElIcon class="mr-1">
          <Loader2 v-if="deleting" class="animate-spin" />
          <CircleCheck v-else />
        </ElIcon>
        {{ confirmLabel || t('common.confirm') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElDialog, ElButton, ElIcon } from 'element-plus';
import { CircleAlert, CircleCheck, Loader2 } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const deleting = ref(false);

async function handleConfirm() {
  deleting.value = true;
  try {
    await props.onConfirm();
    emit('update:open', false);
  } finally {
    deleting.value = false;
  }
}
</script>
