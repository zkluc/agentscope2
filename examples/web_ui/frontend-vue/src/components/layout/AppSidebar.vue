<template>
	<div class="flex flex-col w-[var(--sidebar-width-icon)] border-r bg-sidebar h-full">
		<!-- Header -->
		<div class="flex items-center justify-center h-12 mt-2">
			<ElIcon :size="32" class="rounded-lg">
				<Monitor />
			</ElIcon>
		</div>

		<!-- Main nav -->
		<div class="flex-1 flex flex-col gap-1 px-1 py-2">
			<!-- Chat nav item -->
			<ElTooltip :content="t('common.chat')" placement="right" :show-arrow="false">
				<button
					@click="navigateTo('/chat')"
					:class="[
						'flex items-center justify-center w-10 h-10 rounded-md transition-colors',
						isActive('/chat')
							? 'bg-sidebar-accent text-sidebar-accent-foreground'
							: 'text-sidebar-foreground hover:bg-sidebar-accent/50',
					]"
				>
					<ElIcon :size="20"><ChatDotRound /></ElIcon>
				</button>
			</ElTooltip>

			<!-- Schedule nav item -->
			<ElTooltip :content="t('common.schedule')" placement="right" :show-arrow="false">
				<button
					@click="navigateTo('/schedule')"
					:class="[
						'flex items-center justify-center w-10 h-10 rounded-md transition-colors',
						isActive('/schedule')
							? 'bg-sidebar-accent text-sidebar-accent-foreground'
							: 'text-sidebar-foreground hover:bg-sidebar-accent/50',
					]"
				>
					<ElIcon :size="20"><Calendar /></ElIcon>
				</button>
			</ElTooltip>
		</div>

		<!-- Secondary nav -->
		<div class="flex flex-col gap-1 px-1 pb-2">
			<!-- Credential nav item -->
			<ElTooltip :content="t('common.credential')" placement="right" :show-arrow="false">
				<button
					@click="navigateTo('/credential')"
					:class="[
						'flex items-center justify-center w-10 h-10 rounded-md transition-colors',
						isActive('/credential')
							? 'bg-sidebar-accent text-sidebar-accent-foreground'
							: 'text-sidebar-foreground hover:bg-sidebar-accent/50',
					]"
				>
					<ElIcon :size="20"><Key /></ElIcon>
				</button>
			</ElTooltip>

			<!-- Knowledge nav item -->
			<ElTooltip :content="t('common.knowledge')" placement="right" :show-arrow="false">
				<button
					@click="navigateTo('/knowledge')"
					:class="[
						'flex items-center justify-center w-10 h-10 rounded-md transition-colors',
						isActive('/knowledge')
							? 'bg-sidebar-accent text-sidebar-accent-foreground'
							: 'text-sidebar-foreground hover:bg-sidebar-accent/50',
					]"
				>
					<ElIcon :size="20"><Collection /></ElIcon>
				</button>
			</ElTooltip>
		</div>

		<!-- Footer -->
		<div class="flex flex-col gap-1 px-1 pb-2">
			<!-- Language toggle -->
			<ElTooltip
				:content="
					locale.startsWith('zh') ? t('common.switchToEn') : t('common.switchToZh')
				"
				placement="right"
				:show-arrow="false"
			>
				<button
					@click="toggleLanguage"
					class="flex items-center justify-center w-10 h-10 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
				>
					<ElIcon :size="20"><Coffee /></ElIcon>
				</button>
			</ElTooltip>

			<!-- Tour trigger -->
			<ElTooltip :content="t('tour.trigger')" placement="right" :show-arrow="false">
				<button
					@click="startTour"
					class="flex items-center justify-center w-10 h-10 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
				>
					<ElIcon :size="20"><Compass /></ElIcon>
				</button>
			</ElTooltip>

			<!-- Settings -->
			<ElTooltip :content="t('common.settings')" placement="right" :show-arrow="false">
				<button
					@click="navigateTo('/setup')"
					class="flex items-center justify-center w-10 h-10 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
				>
					<ElIcon :size="20"><Setting /></ElIcon>
				</button>
			</ElTooltip>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useTranslation } from '@/i18n/useI18n';
import {
	Calendar,
	ChatDotRound,
	Collection,
	Compass,
	Key,
	Monitor,
	Setting,
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const { t, locale } = useTranslation();

function isActive(path: string) {
	return route.path.startsWith(path);
}

function navigateTo(path: string) {
	router.push(path);
}

function toggleLanguage() {
	const next = locale.value.startsWith('zh') ? 'en' : 'zh';
	localStorage.setItem('locale', next);
	window.location.reload();
}

function startTour() {
	if (!route.path.startsWith('/chat')) {
		sessionStorage.setItem('force_tour', '1');
		router.push('/chat');
	} else {
		// Tour will be implemented later
	}
}
</script>
