<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import { useRouter } from 'vue-router'
import IslandContent from '../../../components/IslandContent.vue'
import MarqueeText from '../../../components/MarqueeText.vue'
import FavoriteList from '../components/FavoriteList.vue'
import { useFavoriteSelectionPlugin } from '../composables/useFavoriteSelectionPlugin'
import { useIslandPlugin } from '../../../composables/useIslandPlugin'
import iconUrl from '../icon.svg?url'

definePage({
  meta: {
    expandType: 'auto',
  },
})

const router = useRouter()
const { items, status } = useFavoriteSelectionPlugin()

// 收藏夹页面激活
const { acquire } = useIslandPlugin('favorite-selection')

onMounted(() => {
  // 收藏夹激活（10秒后由队列自动释放）
  acquire({
    priority: 1,
    duration: 10000,
    label: '收藏夹',
    avatar: iconUrl,
  })
})

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
  <IslandContent collapsed-size="normal" :scroll-when-overflow="true">
    <template #header="{ scrollWhenOverflow }">
      <div class="island-state-dot" :class="stateClass" />
      <MarqueeText class="island-collapsed-label" :text="stateTitle" :enabled="scrollWhenOverflow" />
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
