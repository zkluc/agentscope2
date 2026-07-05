<template>
  <ElDrawer
    :model-value="open"
    :title="t('knowledge.test.title')"
    :size="480"
    @update:model-value="$emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center gap-x-2">
        <FlaskConical class="size-4" />
        <span>{{ t('knowledge.test.title') }}</span>
      </div>
      <p class="text-sm text-muted-foreground truncate">
        {{ t('knowledge.test.description', { name: knowledgeBaseName }) }}
      </p>
    </template>

    <div class="flex flex-col gap-y-3">
      <div class="flex flex-col gap-y-1.5">
        <label class="text-xs text-muted-foreground">{{ t('knowledge.test.queryLabel') }}</label>
        <ElInput
          v-model="query"
          :placeholder="t('knowledge.test.queryPlaceholder')"
          type="textarea"
          :rows="3"
          :disabled="loading"
        />
      </div>
      <div class="flex items-center gap-x-3">
        <div class="flex items-center gap-x-2">
          <label class="text-xs text-muted-foreground">{{ t('knowledge.test.topKLabel') }}</label>
          <ElInputNumber
            v-model="topK"
            :min="1"
            :max="50"
            :disabled="loading"
            class="w-20"
            size="small"
          />
        </div>
        <ElButton
          class="ml-auto"
          size="small"
          type="primary"
          @click="handleSearch"
          :disabled="loading || !query.trim()"
        >
          <ElIcon class="mr-1">
          <Loader2 v-if="loading" class="animate-spin" />
          <Search v-else />
          </ElIcon>
          {{ t('knowledge.test.searchButton') }}
        </ElButton>
      </div>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </div>

    <div class="flex-1 overflow-y-auto mt-4">
      <template v-if="results !== null">
        <div v-if="results.length === 0" class="flex flex-col items-center py-8 text-muted-foreground">
          <Search class="size-8 mb-2" />
          <p>{{ t('knowledge.test.emptyTitle') }}</p>
          <p class="text-xs">{{ t('knowledge.test.emptyDescription') }}</p>
        </div>
        <div v-else class="flex flex-col gap-y-3">
          <div
            v-for="(hit, idx) in results"
            :key="`${hit.document_id}-${idx}`"
            class="rounded-md border p-3 flex flex-col gap-y-2"
          >
            <div class="flex items-center gap-x-2 text-xs text-muted-foreground">
              <ElTag size="small" type="info">#{{ idx + 1 }}</ElTag>
              <ElTag size="small" effect="plain">{{ t('knowledge.test.score') }}: {{ hit.score.toFixed(4) }}</ElTag>
              <span class="ml-auto truncate" :title="hit.chunk.source">{{ hit.chunk.source }}</span>
            </div>
            <p class="text-sm whitespace-pre-wrap break-words">{{ chunkText(hit.chunk) }}</p>
            <div class="text-xs text-muted-foreground">
              {{ t('knowledge.test.chunkPosition', { index: hit.chunk.chunk_index + 1, total: hit.chunk.total_chunks }) }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:open', false)">{{ t('common.close') }}</ElButton>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElDrawer, ElButton, ElInput, ElInputNumber, ElTag, ElIcon } from 'element-plus';
import { FlaskConical, Search, Loader2 } from 'lucide-vue-next';
import { useKnowledgeBases } from '@/composables/useKnowledgeBases';
import { useTranslation } from '@/i18n/useI18n';
import type { VectorSearchResult, KnowledgeChunk } from '@/api';

const props = defineProps<{
  open: boolean;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
}>();

defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const { search } = useKnowledgeBases();
const query = ref('');
const topK = ref(5);
const loading = ref(false);
const results = ref<VectorSearchResult[] | null>(null);
const error = ref<string | null>(null);

async function handleSearch() {
  const trimmed = query.value.trim();
  if (!trimmed) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await search(props.knowledgeBaseId, { query: trimmed, top_k: topK.value });
    results.value = res.results;
  } catch (e) {
    error.value = (e as Error).message || String(e);
    results.value = null;
  } finally {
    loading.value = false;
  }
}

function chunkText(chunk: KnowledgeChunk): string {
  const content = chunk.content;
  if (content && typeof content === 'object' && 'text' in content) {
    return String(content.text ?? '');
  }
  return JSON.stringify(content);
}
</script>
