<template>
  <div class="text-sm space-y-2">
    <div v-if="loading" class="text-center text-muted-foreground">
      <Loader2 class="animate-spin inline" />
    </div>
    <div v-else-if="skills.length === 0" class="text-muted-foreground">
      <p>{{ t('panel.skill.empty') }}</p>
    </div>
    <div v-else class="space-y-1">
      <div v-for="skill in skills" :key="skill.name" class="flex items-center justify-between">
        <span class="truncate">{{ skill.name }}</span>
        <ElButton size="small" text @click="onRemove(skill.name)">
          <X class="size-3" />
        </ElButton>
      </div>
    </div>
    <ElButton size="small" @click="handleAdd">
      <Plus class="size-3" /> {{ t('panel.skill.add') }}
    </ElButton>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import { Loader2, Plus, X } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  skills: any[];
  loading: boolean;
  onAdd: (skill: any) => void;
  onRemove: (name: string) => void;
}>();

const { t } = useTranslation();

async function handleAdd() {
  const name = prompt(t('panel.skill.enterName'));
  if (name) {
    props.onAdd({ name });
  }
}
</script>
