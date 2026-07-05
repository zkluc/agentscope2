<template>
	<div class="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
		<ElIcon :size="48" class="mb-4"><WarningFilled /></ElIcon>
		<p class="text-lg font-medium mb-2">{{ t('error.pageNotFound') }}</p>
		<p class="text-sm mb-4">{{ t('error.description') }}</p>
		<ElButton type="primary" @click="$router.push('/')">{{ t('error.backHome') }}</ElButton>
	</div>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue';
import { useTranslation } from '@/i18n/useI18n';

const { t } = useTranslation();
</script>
