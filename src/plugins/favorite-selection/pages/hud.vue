<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { invoke } from '@tauri-apps/api/core'
import {
  favoriteTakePendingCapture,
  invokeAddFavorite,
} from '../../../utils/favorites-invoke'

definePage({})

const pending = ref<{ item_type: string; content: string } | null>(null)
const busy = ref(false)
const hint = ref('')
const isVisible = ref(false)
const isDragOver = ref(false) // 拖拽进入状态
const isDragEnter = ref(false) // 是否已经开始拖拽（隐藏状态）
let unlistenDrop: (() => void) | null = null
let unlistenReopen: (() => void) | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null

function startHideTimer() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    closeHud()
  }, 2500) // 2.5秒后自动消失
}

function clearHideTimer() {
  if (hideTimer) clearTimeout(hideTimer)
}

// 开始显示收藏坞（拖拽进入时调用）
function showHud() {
  if (showTimer) clearTimeout(showTimer)
  showTimer = setTimeout(() => {
    isVisible.value = true
  }, 100)
}

// 隐藏收藏坞（拖拽离开时调用）
function hideHud() {
  if (showTimer) clearTimeout(showTimer)
  isVisible.value = false
}

async function refreshPending() {
  pending.value = await favoriteTakePendingCapture()
}

async function addPendingToFavorites() {
  const p = pending.value
  if (!p?.content) {
    closeHud()
    return
  }
  busy.value = true
  clearHideTimer()
  try {
    await invokeAddFavorite(p.item_type, p.content)
    pending.value = null
    hint.value = '已收藏'
    await emit('favorites-changed', {})
    setTimeout(() => closeHud(), 800)
  } catch (e) {
    hint.value = '失败'
    setTimeout(() => closeHud(), 1200)
  } finally {
    busy.value = false
  }
}

async function closeHud() {
  isVisible.value = false
  setTimeout(async () => {
    const w = getCurrentWebviewWindow()
    await w.hide()
  }, 300) // 等待渐出动画完成
}

async function onTextDrop(event: DragEvent) {
  const text = event.dataTransfer?.getData('text/plain')
  if (!text) return
  
  busy.value = true
  clearHideTimer()
  try {
    await invokeAddFavorite('text', text)
    hint.value = '已收藏'
    await emit('favorites-changed', {})
    setTimeout(() => closeHud(), 800)
  } catch (e) {
    hint.value = '失败'
    setTimeout(() => closeHud(), 1200)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  document.body.style.pointerEvents = 'auto'
  document.body.style.background = 'transparent'

  // 初始状态：隐藏（等拖拽进入才显示）
  isVisible.value = false

  const w = getCurrentWebviewWindow()

  unlistenDrop = await w.onDragDropEvent(async (e) => {
    const type = (e.payload as any).type
    if (type === 'over' || type === 'enter') {
      clearHideTimer()
      isDragOver.value = true
      isDragEnter.value = true
      document.body.style.cursor = 'copy'
      showHud() // 拖拽进入时显示
    } else if (type === 'drop' && (e.payload as any).paths.length > 0) {
      busy.value = true
      isDragOver.value = false
      isDragEnter.value = false
      document.body.style.cursor = 'default'
      try {
        for (const path of (e.payload as any).paths) {
          await invokeAddFavorite('file', path)
        }
        hint.value = '已收藏'
        await emit('favorites-changed', {})
        setTimeout(() => closeHud(), 800)
      } catch (err) {
        hint.value = '失败'
        setTimeout(() => closeHud(), 1200)
      } finally {
        busy.value = false
      }
    } else if (type === 'leave') {
      isDragOver.value = false
      document.body.style.cursor = 'default'
      if (!pending.value) {
        hideHud() // 没有待收藏内容时隐藏
      }
    } else if (type === 'cancel') {
      isDragOver.value = false
      isDragEnter.value = false
      document.body.style.cursor = 'default'
      hideHud()
    }
  })

  unlistenReopen = await listen('favorite-hud-reopen', async () => {
    hint.value = ''
    await refreshPending()
    clearHideTimer()
    requestAnimationFrame(() => {
      isVisible.value = true
    })
    startHideTimer()
  })
})

onBeforeUnmount(() => {
  unlistenDrop?.()
  unlistenReopen?.()
  clearHideTimer()
  if (showTimer) clearTimeout(showTimer)
  document.body.style.cursor = 'default'
})
</script>

<template>
  <div
    class="fav-hud"
    :class="{ 'is-visible': isVisible, 'is-drag-over': isDragOver }"
    @mouseenter="clearHideTimer"
    @mouseleave="startHideTimer"
    @dragover.prevent
    @drop.prevent="onTextDrop"
  >
    <div class="fav-hud__card" :class="{ 'fav-hud__card--busy': busy, 'fav-hud__card--drag': isDragOver }" @click="addPendingToFavorites">
      <!-- 动态光晕背景 -->
      <div class="fav-hud__glow"></div>
      
      <div class="fav-hud__content">
        <svg class="fav-hud__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <div class="fav-hud__text">
          <span v-if="hint">{{ hint }}</span>
          <span v-else-if="pending?.content">点击收藏</span>
          <span v-else>拖至此处</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fav-hud {
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  padding: 8px; /* 留出空间给光晕和阴影 */
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fav-hud.is-visible {
  opacity: 1;
  transform: scale(1);
}

.fav-hud__card {
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease;
  isolation: isolate;
}

.fav-hud__card:hover {
  transform: scale(1.05);
}

.fav-hud__card:active {
  transform: scale(0.95);
}

.fav-hud__card--busy {
  opacity: 0.7;
  pointer-events: none;
}

/* 拖拽进入时的样式 */
.fav-hud__card--drag {
  border-color: var(--island-primary-color) !important;
  box-shadow: 0 0 12px var(--island-primary-color);
}

/* 拖拽进入时内容变色 */
.fav-hud.is-drag-over .fav-hud__icon {
  color: var(--island-primary-color);
  transform: scale(1.1);
}

.fav-hud.is-drag-over .fav-hud__text {
  color: var(--island-primary-color);
}

/* 彩色呼吸光晕 */
.fav-hud__glow {
  position: absolute;
  inset: -2px;
  z-index: -1;
  border-radius: 10px;
  background: linear-gradient(
    115deg,
    #00f2fe,
    #4facfe,
    #fa709a,
    #b02aff,
    #00f2fe
  );
  background-size: 200% 200%;
  filter: blur(4px);
  opacity: 0.5;
  animation: island-glow-flow 3s linear infinite;
  pointer-events: none;
}

@keyframes island-glow-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.fav-hud__content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--island-bg) 85%, transparent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
}

:root.theme-light .fav-hud__content {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.fav-hud__icon {
  width: 20px;
  height: 20px;
  color: var(--island-text);
  opacity: 0.9;
}

.fav-hud__text {
  font-size: 11px;
  font-weight: 500;
  color: var(--island-text);
  opacity: 0.9;
  text-align: center;
}
</style>
