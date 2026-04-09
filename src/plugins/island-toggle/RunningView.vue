<script setup lang="ts">
import { computed } from 'vue'
import { islandStore } from '../../state/island'

defineProps<{ expanded: boolean }>()

const R = 11
const CIRCUMFERENCE = 2 * Math.PI * R
const dashoffset = computed(() =>
  CIRCUMFERENCE - (islandStore.progress / 100) * CIRCUMFERENCE
)
</script>

<template>
  <!-- 收缩：圆点 + 解析中 + 环形图（无数字） -->
  <div v-if="!expanded" class="island-collapsed-content">
    <div class="island-state-dot running" />
    <span class="island-collapsed-label">解析中</span>
    <svg class="island-ring-small" viewBox="0 0 28 28">
      <circle class="island-ring-track" cx="14" cy="14" :r="R" fill="none" stroke-width="2.5" />
      <circle class="island-ring-fill"  cx="14" cy="14" :r="R" fill="none" stroke-width="2.5"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="dashoffset" />
    </svg>
  </div>

  <!-- 展开：圆点+解析中标题保留，环形图消失，步骤列表 -->
  <div v-else class="island-expanded-wrap">
    <div class="island-expanded-title-row">
      <div class="island-state-dot running" />
      <span class="island-collapsed-label">解析中</span>
    </div>
    <div class="island-expanded-body">
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
    </div>
  </div>
</template>
