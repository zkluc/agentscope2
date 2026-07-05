<template>
  <div v-if="renderedLines.length" class="diff-preview text-xs font-mono overflow-auto max-h-96">
    <div
      v-for="(line, i) in renderedLines"
      :key="i"
      :class="lineClass(line.type)"
    >
      <span class="inline-block w-8 shrink-0 text-right mr-2 select-none">{{ line.ln }}</span>
      <span class="inline-block w-5 shrink-0 select-none">{{ line.prefix }}</span>
      <span class="whitespace-pre">{{ line.text }}</span>
    </div>
  </div>
  <div v-else class="text-xs text-muted-foreground">No textual changes detected.</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  unifiedDiff: string;
}>();

interface DiffLine {
  type: 'add' | 'del' | 'ctx' | 'hunk' | 'header';
  ln: string;
  prefix: string;
  text: string;
}

function lineClass(type: string): string {
  return {
    add: 'bg-green-50 dark:bg-green-950/40',
    del: 'bg-red-50 dark:bg-red-950/40',
    hunk: 'bg-muted/50 text-muted-foreground',
    header: 'text-muted-foreground italic',
    ctx: '',
  }[type] || '';
}

const renderedLines = computed(() => {
  const raw = props.unifiedDiff;
  if (!raw) return [];

  const lines = raw.split('\n');
  const result: DiffLine[] = [];
  let hunkLn = 0;

  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) {
      result.push({ type: 'header', ln: '', prefix: '', text: line });
    } else if (line.startsWith('@@')) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) hunkLn = parseInt(match[1], 10) - 1;
      result.push({ type: 'hunk', ln: '', prefix: '', text: line });
    } else if (line.startsWith('+')) {
      hunkLn++;
      result.push({ type: 'add', ln: String(hunkLn), prefix: '+', text: line.slice(1) });
    } else if (line.startsWith('-')) {
      result.push({ type: 'del', ln: '', prefix: '-', text: line.slice(1) });
    } else {
      hunkLn++;
      result.push({ type: 'ctx', ln: String(hunkLn), prefix: ' ', text: line });
    }
  }

  return result;
});
</script>

<style scoped>
.diff-preview {
  line-height: 1.5;
}
</style>
