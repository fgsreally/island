<script setup lang="ts">
defineProps<{ expanded: boolean }>()
</script>

<template>
  <!-- 收缩：圆点 + 文字居中 -->
  <div v-if="!expanded" class="island-collapsed-content">
    <div class="island-state-dot idle" />
    <span class="island-collapsed-label">等待解析</span>
  </div>

  <!-- 展开：标题行保留 + 下方内容 -->
  <div v-else class="island-expanded-wrap">
    <div class="island-expanded-title-row">
      <div class="island-state-dot idle" />
      <span class="island-collapsed-label">等待解析</span>
    </div>
    <div class="island-expanded-body">
      <div class="idle-expanded-icon">🔍</div>
      <div class="idle-expanded-title">文件解析助手</div>
      <div class="idle-expanded-desc">选择文件后点击开始，我会帮你提取关键信息</div>
      <button class="idle-expanded-btn">开始解析</button>
    </div>
  </div>
</template>
