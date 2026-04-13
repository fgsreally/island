<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type { FavoriteItem } from '../composables/useFavoriteSelectionPlugin'

const props = defineProps<{
  items: FavoriteItem[]
}>()

const iconCache = ref<Record<string, string>>({})

const getIcon = async (path: string) => {
  if (iconCache.value[path]) return iconCache.value[path]
  try {
    const base64 = await invoke<string>('get_file_icon', { path })
    iconCache.value[path] = `data:image/png;base64,${base64}`
    return iconCache.value[path]
  } catch (e) {
    console.error('Failed to get icon', e)
    return ''
  }
}

onMounted(async () => {
  for (const item of props.items) {
    if (item.item_type === 'file' && item.original_path) {
      await getIcon(item.original_path)
    }
  }
})
</script>

<template>
  <div class="favorite-list">
    <div
      v-for="item in items"
      :key="item.id"
      class="favorite-item"
    >
      <template v-if="item.item_type === 'text'">
        <div class="favorite-text">{{ item.content }}</div>
      </template>
      <template v-else-if="item.item_type === 'image'">
        <img :src="item.content" class="favorite-image" alt="favorite" />
      </template>
      <template v-else-if="item.item_type === 'file'">
        <div class="favorite-file">
          <img
            v-if="iconCache[item.original_path || '']"
            :src="iconCache[item.original_path || '']"
            class="file-icon"
            alt="icon"
          />
          <div class="file-name">{{ item.content }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.favorite-list {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  gap: calc(8px * var(--island-scale));
  padding: calc(8px * var(--island-scale));
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}
.favorite-list::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

.favorite-item {
  flex: 0 0 auto;
  width: calc(64px * var(--island-scale));
  height: calc(64px * var(--island-scale));
  border-radius: calc(12px * var(--island-scale));
  background: var(--island-bg-panel);
  border: 1px solid var(--island-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.favorite-text {
  font-size: calc(10px * var(--island-scale));
  color: var(--island-text-primary);
  padding: calc(4px * var(--island-scale));
  text-align: center;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(4px * var(--island-scale));
  padding: calc(4px * var(--island-scale));
}

.file-icon {
  width: calc(32px * var(--island-scale));
  height: calc(32px * var(--island-scale));
  object-fit: contain;
}

.file-name {
  font-size: calc(9px * var(--island-scale));
  color: var(--island-text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
