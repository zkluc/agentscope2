<template>
  <div class="text-sm space-y-2">
    <div v-if="loading" class="text-center text-muted-foreground">
      <Loader2 class="animate-spin inline" />
    </div>
    <div v-else-if="mcps.length === 0" class="text-muted-foreground">
      <p>{{ t('panel.mcp.empty') }}</p>
    </div>
    <div v-else class="space-y-1">
      <div v-for="mcp in mcps" :key="mcp.name" class="flex items-center justify-between">
        <span class="truncate">{{ mcp.name }}</span>
        <ElButton size="small" text @click="onRemove(mcp.name)">
          <X class="size-3" />
        </ElButton>
      </div>
    </div>
    <ElButton size="small" @click="handleAdd">
      <Plus class="size-3" /> {{ t('panel.mcp.add') }}
    </ElButton>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import { Loader2, Plus, X } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  mcps: any[];
  loading: boolean;
  onAdd: (mcp: any) => void;
  onRemove: (name: string) => void;
}>();

const { t } = useTranslation();

async function handleAdd() {
  const name = prompt(t('panel.mcp.enterName'));
  if (name) {
    props.onAdd({ name });
  }
}
</script>
