<template>
  <a
    v-bind="linkProps"
    class="group flex w-fit max-w-xs items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 no-underline transition-colors hover:bg-muted"
  >
    <span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
      <component :is="iconComponent" class="size-4" />
    </span>
    <span class="flex min-w-0 flex-col">
      <span class="truncate text-sm font-medium text-foreground">{{ displayName }}</span>
      <span v-if="ext" class="text-xs text-muted-foreground">{{ ext }}</span>
    </span>
    <Download class="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download, File, FileImage, FileAudio, FileVideo, FileText } from 'lucide-vue-next';

const MIME_EXT: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/json': 'JSON',
  'application/xml': 'XML',
  'application/zip': 'ZIP',
  'application/gzip': 'GZ',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/plain': 'TXT',
  'text/html': 'HTML',
  'text/css': 'CSS',
  'text/javascript': 'JS',
  'text/csv': 'CSV',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'image/webp': 'WEBP',
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/ogg': 'OGG',
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
};

const props = defineProps<{
  name?: string;
  href: string;
  mediaType: string;
}>();

const ext = computed(() => {
  return MIME_EXT[props.mediaType] || '';
});

const displayName = computed(() => {
  return props.name || (ext.value ? `file.${ext.value.toLowerCase()}` : 'file');
});

const iconComponent = computed(() => {
  const kind = props.mediaType.split('/')[0];
  switch (kind) {
    case 'image': return FileImage;
    case 'audio': return FileAudio;
    case 'video': return FileVideo;
    case 'text': return FileText;
    default:
      return props.mediaType === 'application/pdf' ? FileText : File;
  }
});

function classifyHref(href: string): { safe: boolean; downloadable: boolean } {
  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return { safe: false, downloadable: false };
  }
  const safe = ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol);
  const downloadable =
    url.protocol === 'data:' ||
    url.protocol === 'blob:' ||
    url.origin === window.location.origin;
  return { safe, downloadable };
}

const { safe, downloadable } = classifyHref(props.href);

const linkProps = computed(() => {
  if (!safe) return {};
  if (downloadable) {
    return { href: props.href, download: displayName.value };
  }
  return { href: props.href, target: '_blank', rel: 'noopener noreferrer' };
});
</script>
