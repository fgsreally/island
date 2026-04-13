import { reactive, watch } from 'vue'

export type IslandState = 'idle' | 'running' | 'done'

const STATES: IslandState[] = ['idle', 'running', 'done']

export const islandStore = reactive({
  plugin: 'island-toggle',
  state: 'idle' as IslandState,
  progress: 0,
  _timer: null as ReturnType<typeof setInterval> | null,

  advance() {
    if (this.state === 'running') return
    
    const idx = STATES.indexOf(this.state)
    this.state = STATES[(idx + 1) % STATES.length]
  },
})

watch(
  () => islandStore.state,
  (newState) => {
    if (islandStore._timer) {
      clearInterval(islandStore._timer)
      islandStore._timer = null
    }

    if (newState === 'running') {
      islandStore.progress = 0
      islandStore._timer = setInterval(() => {
        islandStore.progress = Math.min(islandStore.progress + 20, 100)
        if (islandStore.progress >= 100) {
          clearInterval(islandStore._timer!)
          islandStore._timer = null
          // 延迟后自动进入 done 状态
          setTimeout(() => {
            if (islandStore.state === 'running') {
              islandStore.state = 'done'
            }
          }, 800)
        }
      }, 300)
    }
  },
  { immediate: true }
)
