<template>
  <div class="w-56 border-r bg-background p-2 flex flex-col gap-2">
    <div class="flex items-center gap-2 p-2 text-sm font-medium">
      <Users class="size-4" />
      <span class="truncate">{{ team.team.data.name || t('team.title') }}</span>
    </div>

    <div v-if="team.leader_agent">
      <div class="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide">
        {{ t('common.leader') }}
      </div>
      <div
        class="flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted"
        :class="currentSessionId === leaderSessionId ? 'bg-muted' : ''"
        @click="navigateToLeader"
      >
        <Crown class="size-4 shrink-0" />
        <span class="truncate">{{ team.leader_agent.data.name }}</span>
      </div>
    </div>

    <div>
      <div class="px-2 py-1 text-xs text-muted-foreground uppercase tracking-wide">
        {{ t('team-sidebar.membersHeading') }}
      </div>
      <div v-if="team.members.length === 0" class="px-3 py-2 text-xs text-muted-foreground">
        {{ t('team-sidebar.noMembers') }}
      </div>
      <div v-else>
        <div
          v-for="member in team.members"
          :key="member.agent.id"
          :class="['flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted', member.session_id === currentSessionId ? 'bg-muted' : '']"
          :aria-disabled="member.session_id === null"
          @click="navigateToMember(member)"
        >
          <Bot class="size-4 shrink-0" />
          <span class="truncate">{{ member.agent.data.name }}</span>
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
