<script setup lang="ts">
import { computed } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import IslandContent from '../../../components/IslandContent.vue'
import MarqueeText from '../../../components/MarqueeText.vue'
import { useIslandApp } from '../../../app/islandApp'
import { useIslandToggleSettings } from '../composables/useIslandToggleSettings'
import { islandStore } from '../../../state/island'

definePage({
  meta: {
    index: 1,
    expandType: 'auto',
  },
})

const { isExpanded: expanded } = useIslandApp()
const settings = useIslandToggleSettings()

const R = 11
const CIRCUMFERENCE = 2 * Math.PI * R
const dashoffset = computed(() =>
  CIRCUMFERENCE - (islandStore.progress / 100) * CIRCUMFERENCE,
)
</script>

<template>
  <IslandContent>
    <template #header>
      <div class="island-state-dot running" />
      <MarqueeText class="island-collapsed-label" :text="settings.collapsedTitleRunning" />
      <svg
        class="island-ring-small"
        :class="{ 'island-ring-faded': expanded }"
        viewBox="0 0 28 28"
        aria-hidden="true"
      >
        <circle class="island-ring-track" cx="14" cy="14" :r="R" fill="none" stroke-width="2.5" />
        <circle
          class="island-ring-fill"
          cx="14"
          cy="14"
          :r="R"
          fill="none"
          stroke-width="2.5"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashoffset"
        />
      </svg>
    </template>

    <div class="island-steps">
      <div class="island-step done">
        <div class="island-step-icon">✓</div>
        <div class="island-step-text">读取文件</div>
      </div>
      <div class="island-step active">
        <div class="island-step-icon">⋯</div>
        <div class="island-step-text">分析内容结构</div>
      </div>
      <div class="island-step pending">
        <div class="island-step-icon">○</div>
        <div class="island-step-text">生成摘要</div>
      </div>
    </div>
  </IslandContent>
</template>

<style scoped>
.island-ring-small {
  margin-left: auto;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  transition: opacity 200ms ease;
}

.island-ring-small.island-ring-faded {
  opacity: 0;
  pointer-events: none;
}

.island-ring-small circle {
  transition: stroke-dashoffset 300ms ease;
}

.island-ring-track {
  stroke: var(--island-ring-track-stroke);
}

.island-ring-fill {
  stroke: var(--island-accent);
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
}

.island-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.island-step {
  display: flex;
  align-items: center;
  gap: var(--island-plugin-header-gap);
}

.island-step-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--island-font-micro);
  font-weight: 700;
  flex-shrink: 0;
}

.island-step.done .island-step-icon {
  background: var(--island-success);
  color: var(--island-on-badge);
}
.island-step.active .island-step-icon {
  background: var(--island-running);
  color: var(--island-on-badge);
  animation: island-pulse-step 1.2s ease-in-out infinite;
}
.island-step.pending .island-step-icon {
  border: 1.5px solid var(--island-step-pending-border);
  color: var(--island-text-muted);
}

.island-step-text {
  font-size: var(--island-font-body);
  color: var(--island-text);
}
.island-step.pending .island-step-text {
  color: var(--island-text-muted);
}

@keyframes island-pulse-step {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.02);
  }
}
</style>
