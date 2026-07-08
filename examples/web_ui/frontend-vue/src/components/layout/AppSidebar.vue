<template>
  <div
    class="flex flex-col border-r bg-sidebar h-full relative transition-[width] duration-200"
    :class="collapsed ? 'w-[56px]' : 'w-[200px]'"
  >
    <div class="flex items-center h-14 mt-1 px-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Bot class="size-5 text-primary" />
        </div>
        <span
          v-show="!collapsed"
          class="text-sm font-semibold text-sidebar-foreground truncate"
        >AgentScope</span>
      </div>
    </div>

    <nav class="flex-1 flex flex-col gap-1 px-2 py-3">
      <template v-for="item in mainNav" :key="item.path">
        <button
          v-if="!collapsed"
          @click="navigateTo(item.path)"
          class="flex items-center gap-3 h-9 px-2 w-full rounded-lg transition-all duration-150 relative"
          :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          <div
            v-if="isActive(item.path)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary"
          />
          <Component :is="item.icon" class="size-[18px] shrink-0" />
          <span class="text-xs truncate">{{ item.label }}</span>
        </button>
        <ElTooltip v-else :content="item.label" placement="right" :show-arrow="false">
          <button
            @click="navigateTo(item.path)"
            class="flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150 relative"
            :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          >
            <div
              v-if="isActive(item.path)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
            />
            <Component :is="item.icon" class="size-[18px]" />
          </button>
        </ElTooltip>
      </template>
    </nav>

    <div class="flex flex-col gap-1 px-2 pb-2">
      <template v-for="item in secondaryNav" :key="item.path">
        <button
          v-if="!collapsed"
          @click="navigateTo(item.path)"
          class="flex items-center gap-3 h-9 px-2 w-full rounded-lg transition-all duration-150 relative"
          :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          <div
            v-if="isActive(item.path)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary"
          />
          <Component :is="item.icon" class="size-[18px] shrink-0" />
          <span class="text-xs truncate">{{ item.label }}</span>
        </button>
        <ElTooltip v-else :content="item.label" placement="right" :show-arrow="false">
          <button
            @click="navigateTo(item.path)"
            class="flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150 relative"
            :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          >
            <div
              v-if="isActive(item.path)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
            />
            <Component :is="item.icon" class="size-[18px]" />
          </button>
        </ElTooltip>
      </template>

      <div class="border-t my-2" />

      <button
        v-if="!collapsed"
        @click="toggleLanguage"
        class="flex items-center gap-3 h-9 px-2 w-full rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Languages class="size-[18px] shrink-0" />
        <span class="text-xs truncate">{{ locale.startsWith('zh') ? t('common.switchToEn') : t('common.switchToZh') }}</span>
      </button>
      <ElTooltip
        v-else
        :content="locale.startsWith('zh') ? t('common.switchToEn') : t('common.switchToZh')"
        placement="right"
        :show-arrow="false"
      >
        <button
          @click="toggleLanguage"
          class="flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Languages class="size-[18px]" />
        </button>
      </ElTooltip>

      <button
        v-if="!collapsed"
        @click="startTour"
        class="flex items-center gap-3 h-9 px-2 w-full rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Compass class="size-[18px] shrink-0" />
        <span class="text-xs truncate">{{ t('tour.trigger') }}</span>
      </button>
      <ElTooltip
        v-else
        :content="t('tour.trigger')"
        placement="right"
        :show-arrow="false"
      >
        <button
          @click="startTour"
          class="flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Compass class="size-[18px]" />
        </button>
      </ElTooltip>

      <button
        v-if="!collapsed"
        @click="navigateTo('/setup')"
        class="flex items-center gap-3 h-9 px-2 w-full rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Settings class="size-[18px] shrink-0" />
        <span class="text-xs truncate">{{ t('common.settings') }}</span>
      </button>
      <ElTooltip
        v-else
        :content="t('common.settings')"
        placement="right"
        :show-arrow="false"
      >
        <button
          @click="navigateTo('/setup')"
          class="flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings class="size-[18px]" />
        </button>
      </ElTooltip>

      <div class="border-t my-2" />

      <button
        @click="toggleCollapsed"
        class="flex items-center justify-center h-8 w-full rounded-lg transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ChevronsLeft class="size-[16px]" :class="collapsed ? 'rotate-180' : ''" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTranslation } from '@/i18n/useI18n';
import { ElTooltip } from 'element-plus';
import {
  Bot,
  MessageSquare,
  Calendar,
  Key,
  Library,
  Languages,
  Compass,
  Settings,
  ChevronsLeft,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const { t, locale } = useTranslation();

const collapsed = ref(localStorage.getItem('sidebar_collapsed') !== 'false');

watch(collapsed, (val) => {
  localStorage.setItem('sidebar_collapsed', String(val));
});

const mainNav = [
  { path: '/chat', icon: MessageSquare, label: t('common.chat') },
  { path: '/schedule', icon: Calendar, label: t('common.schedule') },
];

const secondaryNav = [
  { path: '/credential', icon: Key, label: t('common.credential') },
  { path: '/knowledge', icon: Library, label: t('common.knowledge') },
];

function isActive(path: string) {
  return route.path.startsWith(path);
}

function navigateTo(path: string) {
  router.push(path);
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
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
  }
}
</script>
