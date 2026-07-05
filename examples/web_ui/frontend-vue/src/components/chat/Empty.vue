<template>
  <div class="flex size-full flex-col items-center justify-center gap-3 p-8 text-center">
    <ElIcon :size="48" class="text-muted-foreground">
      <ChatDotRound />
    </ElIcon>
    <span class="text-lg font-medium text-muted-foreground">{{ t('chat.noMessages') }}</span>
    <span class="text-sm text-muted-foreground/70">{{ t('chat.noMessagesDesc') }}</span>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue';
import { useTranslation } from '@/i18n/useI18n';

const { t } = useTranslation();
</script>
