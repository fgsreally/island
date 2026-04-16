<script setup lang="ts">
import { definePage } from 'unplugin-vue-router/runtime'
import IslandContent from '../../../components/IslandContent.vue'
import MarqueeText from '../../../components/MarqueeText.vue'
import { useIslandToggleSettings } from '../composables/useIslandToggleSettings'
import { islandStore } from '../../../state/island'
import { useIslandApp } from '../../../app/islandApp'
import { useIslandPlugin } from '../../../composables/useIslandPlugin'
import iconUrl from '../icon.svg?url'
import { onMounted } from 'vue'

definePage({
  meta: {
    expandType: 'auto',
  },
})

const settings = useIslandToggleSettings()
const { setExpanded } = useIslandApp()
const { acquire, release } = useIslandPlugin('island-toggle')

// idle 阶段：长时间显示
let hideTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  // 激活并占用岛（无限时长，优先级 0）
  acquire({
    priority: 0,
    duration: 0,
    label: '等待解析',
    avatar: iconUrl,
  })

  // 不自动收起，保持显示
})
</script>

<template>
  <IslandContent collapsed-size="normal" :scroll-when-overflow="true">
    <template #header="{ scrollWhenOverflow }">
      <div class="island-state-dot idle" />
      <MarqueeText class="island-collapsed-label" :text="settings.collapsedTitleIdle" :enabled="scrollWhenOverflow" />
    </template>

    <div class="idle-expanded-icon">🔍</div>
    <div class="idle-expanded-title">文件解析助手</div>
    <div class="idle-expanded-desc">选择文件后点击开始，我会帮你提取关键信息</div>
    <button type="button" class="idle-expanded-btn" @click="islandStore.advance()">开始解析</button>
  </IslandContent>
</template>

<style scoped>
.idle-expanded-icon {
  font-size: 24px;
  line-height: 1;
}
.idle-expanded-title {
  color: var(--island-text);
  font-size: var(--island-font-title);
  font-weight: 600;
}
.idle-expanded-desc {
  color: var(--island-text-muted);
  font-size: var(--island-font-caption);
  text-align: center;
  line-height: 1.5;
  max-width: 200px;
}
.idle-expanded-btn {
  padding: 6px 22px;
  background: var(--island-accent);
  color: var(--island-on-accent);
  border: none;
  border-radius: var(--island-radius-inner);
  font-size: var(--island-font-body);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 150ms;
}
.idle-expanded-btn:hover {
  opacity: 0.85;
}
</style>
