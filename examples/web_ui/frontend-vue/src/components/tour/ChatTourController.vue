<template>
  <Teleport to="body">
    <div
      v-if="activeStep !== null && currentTour"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      @click="handleBackdrop"
    >
      <div
        class="relative"
        :style="stepPosition"
        @click.stop
      >
        <TourCard
          :title="currentTour[activeStep].title"
          :content="currentTour[activeStep].content"
          :current-step="activeStep"
          :total-steps="currentTour.length"
          @next="goNext"
          @prev="goPrev"
          @close="endTour"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import TourCard from '@/components/tour/TourCard.vue';
import { buildChatTour } from '@/components/tour/chatTourSteps';
import { useTranslation } from '@/i18n/useI18n';

interface Props {
  agentsCount: number;
  sessionsCount: number;
  onEnsureSidebarOpen?: () => void;
}

const props = defineProps<Props>();

const { t } = useTranslation();
const activeStep = ref<number | null>(null);
const startCounts = ref({ agents: props.agentsCount, sessions: props.sessionsCount });

const currentTour = computed(() => {
  if (activeStep.value === null) return null;
  return buildChatTour(t);
});

const stepPosition = computed(() => {
  // Position tour card centered by default
  return {};
});

function goNext() {
  if (currentTour.value && activeStep.value !== null) {
    if (activeStep.value < currentTour.value.length - 1) {
      activeStep.value++;
    } else {
      endTour();
    }
  }
}

function goPrev() {
  if (activeStep.value !== null && activeStep.value > 0) {
    activeStep.value--;
  }
}

function endTour() {
  localStorage.setItem('chat_tour_done', '1');
  activeStep.value = null;
}

function handleBackdrop() {
  // Don't close on backdrop click
}

onMounted(() => {
  const force = sessionStorage.getItem('force_tour') === '1';
  const done = localStorage.getItem('chat_tour_done') === '1';
  if (force) sessionStorage.removeItem('force_tour');
  if (!force && done) return;
  props.onEnsureSidebarOpen?.();
  setTimeout(() => {
    activeStep.value = 0;
  }, 300);
});

watch(() => props.agentsCount, (val) => {
  if (activeStep.value === 0 && val > startCounts.value.agents) {
    activeStep.value = 1;
  }
});

watch(() => props.sessionsCount, (val) => {
  if (activeStep.value === 1 && val > startCounts.value.sessions) {
    activeStep.value = 2;
  }
});
</script>
