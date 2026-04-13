<script setup lang="ts">
import { computed } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import IslandContent from '../../../components/IslandContent.vue'
import MarqueeText from '../../../components/MarqueeText.vue'
import FavoriteList from '../components/FavoriteList.vue'
import { useFavoriteSelectionPlugin } from '../composables/useFavoriteSelectionPlugin'
import { useIslandApp } from '../../../app/islandApp'

definePage({
  meta: {
    expandType: 'force',
  },
})

const { items, status } = useFavoriteSelectionPlugin()

const stateTitle = computed(() => {
  if (status.value === 'running') return '收藏中'
  if (status.value === 'success') return '已收藏'
  return '收藏夹'
})

const stateClass = computed(() => {
  if (status.value === 'running') return 'running'
  if (status.value === 'success') return 'done'
  return 'idle'
})
</script>

<template>
  <IslandContent>
    <template #header>
      <div class="island-state-dot" :class="stateClass" />
      <MarqueeText class="island-collapsed-label" :text="stateTitle" />
    </template>
    <template #default>
      <div class="favorite-content">
        <FavoriteList :items="items" />
      </div>
    </template>
  </IslandContent>
</template>

<style scoped>
.favorite-content {
  padding: calc(8px * var(--island-scale));
  display: flex;
  flex-direction: column;
  gap: calc(8px * var(--island-scale));
}
</style>
