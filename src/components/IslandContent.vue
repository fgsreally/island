<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, provide, computed, watch } from 'vue'
import { useIslandApp } from '../app/islandApp'

type CollapsedSize = 'normal' | 'medium' | 'large'

const props = withDefaults(defineProps<{
  collapsedSize?: CollapsedSize
  scrollWhenOverflow?: boolean
}>(), {
  collapsedSize: 'normal',
  scrollWhenOverflow: true,
})

const { isExpanded: expanded } = useIslandApp()
provide('island-scroll-when-overflow', computed(() => props.scrollWhenOverflow))

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
  document.documentElement.style.setProperty('--island-width-collapsed', 'var(--island-width-collapsed-normal)')
})

watch(
  () => props.collapsedSize,
  (size) => {
    document.documentElement.style.setProperty('--island-width-collapsed', `var(--island-width-collapsed-${size})`)
  },
  { immediate: true },
)
</script>

<template>
  <div class="island-state-root" :class="{ 'is-expanded': expanded }">
    <div class="island-unified-header">
      <div class="island-header-content">
        <slot name="header" :scroll-when-overflow="scrollWhenOverflow" />
      </div>
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
  height: 100%; /* 收缩状态下占据整个胶囊高度，实现绝对垂直居中 */
  width: 100%; /* 限制宽度，防止长文本撑破胶囊 */
  padding: 0 var(--island-plugin-header-padding-x);
  box-sizing: border-box;
  transition: height var(--island-spring-duration) cubic-bezier(0.2, 0.8, 0.2, 1); /* 使用不回弹的平滑曲线，防止标题上下跳动 */
}

.island-header-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--island-plugin-header-gap);
  max-width: 100%;
}

.island-state-root.is-expanded .island-unified-header {
  height: var(--island-plugin-header-height); /* 展开时恢复正常头部高度 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
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
