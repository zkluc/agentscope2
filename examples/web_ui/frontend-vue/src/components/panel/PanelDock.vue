<template>
  <div v-if="layout.length > 0" class="flex flex-row gap-2 p-2 bg-muted/30">
    <div v-for="(column, colIdx) in layout" :key="colIdx" class="flex flex-col gap-2 w-72">
      <div v-for="key in column" :key="key" class="rounded-lg border bg-background p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 text-sm font-medium">
            <component :is="panels[key]?.icon" class="size-4" />
            <span>{{ panels[key]?.title }}</span>
          </div>
          <div class="flex items-center gap-1">
            <component :is="panels[key]?.actions" v-if="panels[key]?.actions" />
            <ElButton size="small" circle @click="onClosePanel(key)">
              <X class="size-3" />
            </ElButton>
          </div>
        </div>
        <div class="text-sm text-muted-foreground">
          <component :is="panels[key]?.content" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import { X } from 'lucide-vue-next';

export type PanelKey = string;

export interface PanelDescriptor {
  title: string | any;
  icon?: any;
  content: any;
  actions?: any;
}

defineProps<{
  layout: PanelKey[][];
  panels: Record<PanelKey, PanelDescriptor>;
  onClosePanel: (key: PanelKey) => void;
}>();
</script>
