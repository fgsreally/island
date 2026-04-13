<script setup lang="ts">
import { definePage } from 'unplugin-vue-router/runtime'
import IslandContent from '../../../components/IslandContent.vue'
import MarqueeText from '../../../components/MarqueeText.vue'
import { useIslandToggleSettings } from '../composables/useIslandToggleSettings'

definePage({
  meta: {
    index: 0,
    expandType: 'auto',
  },
})

const settings = useIslandToggleSettings()
</script>

<template>
  <IslandContent>
    <template #header>
      <div class="island-state-dot idle" />
      <MarqueeText class="island-collapsed-label" :text="settings.collapsedTitleIdle" />
    </template>

    <div class="idle-expanded-icon">🔍</div>
    <div class="idle-expanded-title">文件解析助手</div>
    <div class="idle-expanded-desc">选择文件后点击开始，我会帮你提取关键信息</div>
    <button type="button" class="idle-expanded-btn">开始解析</button>
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
