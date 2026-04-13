<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProvideIslandApp, useIslandApp } from './app/islandApp'
import { invoke } from '@tauri-apps/api/core'
import { useIslandTogglePlugin } from './plugins/island-toggle/composables/useIslandTogglePlugin'
import { useFavoriteSelectionPlugin } from './plugins/favorite-selection/composables/useFavoriteSelectionPlugin'
import {
  computeIslandScale,
  loadIslandShellSettings,
  pluginSettingsRevision,
} from './utils/island-settings'
import AppToast from './components/AppToast.vue'

import {
  getCurrentWindow,
  LogicalSize,
  LogicalPosition,
  primaryMonitor,
} from '@tauri-apps/api/window'

useProvideIslandApp()

let isSettingsWindow = false
let isHudWindow = false
try {
  const label = getCurrentWindow().label
  isSettingsWindow = label === 'settings'
  isHudWindow = label === 'favorite-hud'
} catch {
  isSettingsWindow = location.hash.includes('/settings')
}

if (isSettingsWindow) {
  document.body.style.pointerEvents = 'auto'
  document.body.style.background = 'var(--island-bg)'
} else if (isHudWindow) {
  document.body.style.pointerEvents = 'auto'
  document.body.style.background = 'transparent'
} else {
  useIslandTogglePlugin()
  useFavoriteSelectionPlugin()
}

const route = useRoute()
const router = useRouter()
const { isExpanded, setExpanded } = useIslandApp()

const currentExpandType = computed(() => route.meta?.expandType || 'auto')

const isExpandedClass = ref(false)
let expandSession = 0
watch(isExpanded, (val) => {
  const currentSession = ++expandSession
  if (val) {
    if (currentSession === expandSession) {
      isExpandedClass.value = true
    }
  } else {
    isExpandedClass.value = false
  }
}, { immediate: true })

const transitionName = ref<'route-slide-forward'>('route-slide-forward')
let forceExpandTimer: ReturnType<typeof setTimeout> | null = null
let forceRouteTransitionTimer: ReturnType<typeof setTimeout> | null = null

let unlistenSettings: (() => void) | undefined

let leaveTimer: ReturnType<typeof setTimeout> | null = null
let enterTimer: ReturnType<typeof setTimeout> | null = null

const islandContainerRef = ref<HTMLElement | null>(null)
let islandResizeObserver: ResizeObserver | null = null

function updateClickRegion() {
  if (isSettingsWindow || isHudWindow) return
  if (!islandContainerRef.value) return
  const rect = islandContainerRef.value.getBoundingClientRect()
  invoke('update_click_region', {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  }).catch(() => {})
}

function applyIslandScale() {
  const shell = loadIslandShellSettings()
  const scale = computeIslandScale(window.screen.width, shell)
  document.documentElement.style.setProperty('--island-scale', String(scale))
}

onMounted(async () => {
  if (isSettingsWindow) {
    const root = document.getElementById('root')
    if (root) root.style.pointerEvents = 'auto'
  }
  
  applyIslandScale()
  window.addEventListener('resize', applyIslandScale)

  await nextTick()
  if (!isSettingsWindow && islandContainerRef.value) {
    islandResizeObserver = new ResizeObserver(() => {
      updateClickRegion()
    })
    islandResizeObserver.observe(islandContainerRef.value)
    updateClickRegion()
  }
})

watch(pluginSettingsRevision, () => {
  applyIslandScale()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', applyIslandScale)
  if (leaveTimer) clearTimeout(leaveTimer)
  if (enterTimer) clearTimeout(enterTimer)
  if (forceExpandTimer) clearTimeout(forceExpandTimer)
  if (forceRouteTransitionTimer) clearTimeout(forceRouteTransitionTimer)
  islandResizeObserver?.disconnect()
  islandResizeObserver = null
  unlistenSettings?.()
})

function onIslandEnter() {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  if (!isExpanded.value && !enterTimer) {
    enterTimer = setTimeout(() => {
      setExpanded(true)
      enterTimer = null
    }, 30)
  }
}

function onIslandLeave() {
  if (enterTimer) {
    clearTimeout(enterTimer)
    enterTimer = null
  }
  if (currentExpandType.value === 'force') return
  leaveTimer = setTimeout(() => {
    setExpanded(false)
    leaveTimer = null
  }, 100) // 延长一点离开延迟，避免不小心滑出马上收缩
}

function onIslandBarClick() {
  if (!isExpanded.value) return
  setExpanded(false)
}

watch(
  currentExpandType,
  (type, prevType) => {
    if (forceExpandTimer) {
      clearTimeout(forceExpandTimer)
      forceExpandTimer = null
    }
    if (type === 'force' && prevType !== 'force') {
      setExpanded(false)
      forceExpandTimer = setTimeout(() => {
        setExpanded(true)
        forceExpandTimer = null
      }, 140)
    }
  },
  { immediate: true },
)

watch(
  () => route.path,
  () => {
    transitionName.value = 'route-slide-forward'
    if (forceRouteTransitionTimer) {
      clearTimeout(forceRouteTransitionTimer)
      forceRouteTransitionTimer = null
    }
    if (currentExpandType.value === 'force') {
      // 不通过路由守卫，改为路由切换后在这里执行「先收缩再展开」
      setExpanded(false)
      forceRouteTransitionTimer = setTimeout(() => {
        setExpanded(true)
        forceRouteTransitionTimer = null
      }, 180)
    }
  },
)
</script>

<template>
  <div
    v-if="!isSettingsWindow && !isHudWindow && !route.path.startsWith('/settings')"
    ref="islandContainerRef"
    class="island-container"
    :class="{ 
      'is-expanded': isExpandedClass,
      'is-force-expanded': isExpandedClass && currentExpandType === 'force'
    }"
    @mouseenter="onIslandEnter"
    @mouseleave="onIslandLeave"
  >
    <div class="island-clip">
      <div class="island-main">
        <div class="island-route-stage">
          <router-view v-slot="{ Component }">
            <Transition :name="transitionName" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </router-view>
        </div>
      </div>

      <div class="island-bar" @click.stop="onIslandBarClick">
        <div class="island-bar-line" />
      </div>
    </div>
  </div>
  <router-view v-else />
  <AppToast />
</template>
