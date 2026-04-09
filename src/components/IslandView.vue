<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { islandStore } from '../state/island'
import IdleView from '../plugins/island-toggle/IdleView.vue'
import RunningView from '../plugins/island-toggle/RunningView.vue'
import DoneView from '../plugins/island-toggle/DoneView.vue'

const route = useRoute()
const state = computed(() => route.params.state as string)
const hovered = ref(false)
const doneSticky = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | null = null

watch(state, (s) => {
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
  if (s === 'done') {
    hovered.value = true
    doneSticky.value = true
  } else {
    hovered.value = false
    doneSticky.value = false
  }
}, { immediate: true })

const isExpanded = computed(() => hovered.value)

function onEnter() {
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
  hovered.value = true
}
function onLeave() {
  if (doneSticky.value) return
  // 防抖：50ms 内重新进入则取消收缩，避免圆角边缘抖动
  leaveTimer = setTimeout(() => {
    hovered.value = false
    leaveTimer = null
  }, 50)
}
function onBarClick() {
  if (!isExpanded.value) return
  hovered.value = false
  doneSticky.value = false
}

// 展开动画：放慢，opacity 延迟等容器先打开
function onEnterHook(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.maxHeight = '0'
  e.style.opacity = '0'
  e.style.overflow = 'hidden'
  void e.offsetHeight
  e.style.transition = 'max-height 500ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease 180ms'
  e.style.maxHeight = '400px'
  e.style.opacity = '1'
  setTimeout(done, 500)
}
function onAfterEnterHook(el: Element) {
  const e = el as HTMLElement
  e.style.maxHeight = ''
  e.style.overflow = ''
  e.style.transition = ''
  e.style.opacity = ''
}
function onLeaveHook(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.maxHeight = e.scrollHeight + 'px'
  e.style.overflow = 'hidden'
  void e.offsetHeight
  e.style.transition = 'max-height 240ms cubic-bezier(0.4,0,1,1), opacity 100ms ease'
  e.style.maxHeight = '0'
  e.style.opacity = '0'
  setTimeout(done, 240)
}
function onAfterLeaveHook(el: Element) {
  const e = el as HTMLElement
  e.style.maxHeight = ''
  e.style.overflow = ''
  e.style.transition = ''
  e.style.opacity = ''
}

const views: Record<string, any> = { idle: IdleView, running: RunningView, done: DoneView }
const ViewComponent = computed(() => views[state.value] ?? IdleView)
</script>

<template>
  <div
    :class="['island-container', { 'is-expanded': isExpanded }]"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- 收缩态 -->
    <Transition name="island-fade" mode="out-in">
      <div v-if="!isExpanded" class="island-collapsed-area">
        <component :is="ViewComponent" :key="state" :expanded="false" />
      </div>
    </Transition>

    <!-- 展开区：JS hooks 高度动画 -->
    <Transition
      @enter="onEnterHook"
      @after-enter="onAfterEnterHook"
      @leave="onLeaveHook"
      @after-leave="onAfterLeaveHook"
    >
      <div v-if="isExpanded" class="island-expanded-area">
        <component :is="ViewComponent" :expanded="true" />
      </div>
    </Transition>

    <div class="island-bar" @click.stop="onBarClick">
      <div class="island-bar-line" />
    </div>
  </div>
</template>
