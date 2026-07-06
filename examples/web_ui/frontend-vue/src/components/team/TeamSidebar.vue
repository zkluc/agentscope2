<template>
  <div class="w-56 border-r bg-sidebar flex flex-col gap-1 p-3">
    <div class="flex items-center gap-2.5 px-2 py-2.5">
      <div class="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Users class="size-3.5 text-primary" />
      </div>
      <span class="text-sm font-medium text-foreground truncate">{{ team.team.data.name || t('team.title') }}</span>
    </div>

    <div v-if="team.leader_agent">
      <div class="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {{ t('common.leader') }}
      </div>
      <div
        class="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm cursor-pointer transition-colors"
        :class="currentSessionId === leaderSessionId ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'"
        @click="navigateToLeader"
      >
        <Crown class="size-3.5 shrink-0" />
        <span class="truncate text-xs">{{ team.leader_agent.data.name }}</span>
      </div>
    </div>

    <div>
      <div class="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {{ t('team-sidebar.membersHeading') }}
      </div>
      <div v-if="team.members.length === 0" class="px-3 py-3 text-xs text-muted-foreground/60 italic">
        {{ t('team-sidebar.noMembers') }}
      </div>
      <div v-else class="space-y-0.5">
        <div
          v-for="member in team.members"
          :key="member.agent.id"
          class="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm cursor-pointer transition-colors"
          :class="[
            member.session_id === currentSessionId
              ? 'bg-primary/10 text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent',
            member.session_id === null ? 'opacity-50 cursor-default' : '',
          ]"
          :aria-disabled="member.session_id === null"
          @click="navigateToMember(member)"
        >
          <div class="relative shrink-0">
            <Bot class="size-3.5" />
            <div
              v-if="member.session_id === currentSessionId"
              class="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary"
            />
          </div>
          <span class="truncate text-xs">{{ member.agent.data.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Crown, Bot } from 'lucide-vue-next';
import { useTranslation } from '@/i18n/useI18n';

const props = defineProps<{
  team: Record<string, any>;
  currentSessionId: string | null;
}>();

const router = useRouter();
const { t } = useTranslation();

const leaderAgentId = computed(() => props.team.leader_agent?.id ?? null);
const leaderSessionId = computed(() => props.team.team?.session_id ?? null);

function navigateToLeader() {
  if (!leaderAgentId.value || !leaderSessionId.value) return;
  router.push(`/chat/${leaderAgentId.value}/${leaderSessionId.value}`);
}

function navigateToMember(member: any) {
  if (!leaderAgentId.value || !leaderSessionId.value || !member.session_id) return;
  router.push(`/chat/${leaderAgentId.value}/${leaderSessionId.value}/${member.agent.id}`);
}
</script>
