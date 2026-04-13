<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useIslandApp } from '../app/islandApp'

const { isExpanded: expanded } = useIslandApp()

const bodyRef = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

function updateHeight() {
  if (bodyRef.value) {
    const h = bodyRef.value.offsetHeight
    // 强制将高度写入 CSS 变量，确保容器能精确计算总高度
    document.documentElement.style.setProperty('--island-expanded-content-height', `${h}px`)
  }
}

onMounted(() => {
  updateHeight()
  if (bodyRef.value) {
    ro = new ResizeObserver(() => {
      updateHeight()
    })
    ro.observe(bodyRef.value)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
})
</script>

<template>
  <div class="island-state-root" :class="{ 'is-expanded': expanded }">
    <div class="island-unified-header">
      <slot name="header" />
    </div>
    <div class="island-expandable-outer">
      <div class="island-expanded-body" ref="bodyRef">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.island-state-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.island-unified-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--island-plugin-header-gap);
  height: calc(var(--island-plugin-header-height) + var(--island-bar-height)); /* 永远保持和收缩状态一样的总高度，绝对不参与高度动画 */
  width: 100%; /* 限制宽度，防止长文本撑破胶囊 */
  padding: 0 var(--island-plugin-header-padding-x);
  box-sizing: border-box;
  border-bottom: 1px solid transparent; /* 预留边框位置，防止出现时内容跳动 */
  transition: border-color var(--island-fade);
}

.island-state-root.is-expanded .island-unified-header {
  border-bottom-color: var(--island-border-color);
}

.island-expandable-outer {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.island-expanded-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--island-expanded-body-padding-y) var(--island-expanded-body-padding-x) calc(12px + var(--island-bar-height)); /* 底部留出蓝条的空间 */
  gap: var(--island-expanded-body-gap);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: var(--island-width-expanded); /* 固定宽度，避免展开动画时内容重排导致高度突变 */
}

/* 头部槽位内通用：状态点 + 文案（具体配色由各页 slot 上的 class 决定） */
:deep(.island-state-dot) {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

:deep(.island-state-dot.idle) {
  background: var(--island-text-muted);
}

:deep(.island-state-dot.running) {
  background: var(--island-running);
  animation: island-pulse-dot 1.2s ease-in-out infinite;
}

:deep(.island-state-dot.done) {
  background: var(--island-success);
}

:deep(.island-collapsed-label) {
  color: var(--island-text);
  font-size: var(--island-font-tiny); /* 字体改小 */
  font-weight: 600;
  white-space: nowrap;
  max-width: 100%;
}

@keyframes island-pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 204, 0, 0);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
    box-shadow: 0 0 6px rgba(255, 204, 0, 0.6);
  }
}
</style>
