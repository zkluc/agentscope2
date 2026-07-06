<template>
  <div class="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
    <div class="size-14 rounded-2xl bg-muted flex items-center justify-center">
      <MessageSquare class="size-7 text-muted-foreground/50" />
    </div>
    <div>
      <p class="text-sm font-medium text-foreground/60">{{ t('chat.noMessages') }}</p>
      <p class="text-xs text-muted-foreground/50 mt-1">{{ t('chat.noMessagesDesc') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const { t } = useTranslation();
</script>
