<template>
  <div class="flex size-full flex-col items-center justify-center gap-4 p-8 text-center select-none">
    <div class="size-12 rounded-[10px] border border-dashed border-[var(--brass)]/30 flex items-center justify-center bg-[var(--brass-dim)]">
      <span class="font-mono text-sm text-[var(--brass)]">~</span>
    </div>
    <div>
      <p class="text-sm font-medium text-foreground/50">{{ t('chat.noMessages') }}</p>
      <p class="text-xs text-muted-foreground/50 mt-1 max-w-[220px]">{{ t('chat.noMessagesDesc') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from '@/i18n/useI18n';

const { t } = useTranslation();
</script>
