import { reactive } from 'vue'

export type IslandState = 'idle' | 'running' | 'done'

const STATES: IslandState[] = ['idle', 'running', 'done']

export const islandStore = reactive({
  plugin: 'island-toggle',
  state: 'idle' as IslandState,
  progress: 0,
  _timer: null as ReturnType<typeof setInterval> | null,

  advance() {
    if (this.state === 'running') return
    if (this._timer) { clearInterval(this._timer); this._timer = null }

    const idx = STATES.indexOf(this.state)
    this.state = STATES[(idx + 1) % STATES.length]

    if (this.state === 'running') {
      this.progress = 0
      this._timer = setInterval(() => {
        this.progress = Math.min(this.progress + 20, 100)
        if (this.progress >= 100) {
          clearInterval(this._timer!)
          this._timer = null
          // 通过改 state 触发 watch，让 App.vue 处理路由
          setTimeout(() => {
            const idx = STATES.indexOf(this.state)
            this.state = STATES[(idx + 1) % STATES.length]
          }, 800)
        }
      }, 300)
    }
  },
})
