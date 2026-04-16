import { reactive, computed } from 'vue'

export interface QueueItem {
  pluginId: string // 插件 ID
  priority: number // 优先级（越大越高）
  duration: number // 期望显示时长（毫秒），0 表示无限
  acquiredAt: number // 获得占用权的时间戳
  avatar?: string // 头像 URL（可选）
  label?: string // 简短标签（可选）
}

export interface AcquireOptions {
  priority?: number
  duration?: number
  avatar?: string
  label?: string
}

let nextTimerId = 0

const islandQueueStore = reactive({
  queue: [] as QueueItem[],
  activePluginId: null as string | null,
  _timers: new Map<string, ReturnType<typeof setTimeout>>(),
  _timerIdCounter: 0,

  // 插件请求占用岛
  acquire(pluginId: string, options: AcquireOptions = {}) {
    const { priority = 0, duration = 0, avatar, label } = options
    console.log('[islandQueue] acquire:', pluginId, { priority, duration, label })

    // 检查是否已在队列中
    const existingIndex = this.queue.findIndex((item) => item.pluginId === pluginId)
    if (existingIndex >= 0) {
      this.queue[existingIndex].priority = priority
      this.queue[existingIndex].duration = duration
      if (avatar) this.queue[existingIndex].avatar = avatar
      if (label) this.queue[existingIndex].label = label
    } else {
      this.queue.push({
        pluginId,
        priority,
        duration,
        acquiredAt: Date.now(),
        avatar,
        label,
      })
    }

    this.recalculateActive()

    if (duration > 0) {
      this._scheduleRelease(pluginId, duration)
    }
  },

  // 插件释放占用
  release(pluginId: string) {
    console.log('[islandQueue] release:', pluginId)
    // 清除定时器
    this._cancelRelease(pluginId)

    // 从队列中移除
    this.queue = this.queue.filter((item) => item.pluginId !== pluginId)

    // 重新计算活跃插件
    this.recalculateActive()
  },

  // 获取队列（带 isActive，所有插件包括 active 都返回）
  getQueueWithActive(): (QueueItem & { isActive: boolean })[] {
    const activeId = this.activePluginId

    // 按优先级排序
    return this.queue
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.acquiredAt - b.acquiredAt
      })
      .map(item => ({
        ...item,
        isActive: item.pluginId === activeId
      }))
  },

  // 获取等待中的插件（未激活，按优先级排序）
  getInactiveQueue(): (QueueItem & { isActive: boolean })[] {
    const activeId = this.activePluginId
    return this.queue
      .filter(item => item.pluginId !== activeId)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.acquiredAt - b.acquiredAt
      })
      .map(item => ({
        ...item,
        isActive: false
      }))
  },

  // 切换到指定插件（用户点击）
  switchTo(pluginId: string) {
    const item = this.queue.find((i) => i.pluginId === pluginId)
    if (!item) return
    // 临时提升优先级
    item.priority = Number.MAX_SAFE_INTEGER
    this.recalculateActive()
  },

  // 内部：重新计算活跃插件
  recalculateActive() {
    if (this.queue.length === 0) {
      this.activePluginId = null
      return
    }

    // 按优先级（降序）和获取时间（升序）排序
    const sorted = [...this.queue].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // 优先级高在前
      }
      return a.acquiredAt - b.acquiredAt // 先到先得
    })

    const newActive = sorted[0].pluginId
    if (newActive !== this.activePluginId) {
      this.activePluginId = newActive
      console.log('[islandQueue] active changed:', newActive, 'queue:', this.queue.map(q => q.pluginId))
    }
  },

  // 内部：设置定时释放
  _scheduleRelease(pluginId: string, duration: number) {
    this._cancelRelease(pluginId)

    const timerId = ++this._timerIdCounter
    const timer = setTimeout(() => {
      this.release(pluginId)
    }, duration)

    this._timers.set(pluginId, timer)
  },

  // 内部：取消定时释放
  _cancelRelease(pluginId: string) {
    const timer = this._timers.get(pluginId)
    if (timer) {
      clearTimeout(timer)
      this._timers.delete(pluginId)
    }
  },
})

// 导出 store 和类型
export { islandQueueStore }

// 便捷：队列（带 isActive）
export function useQueueWithActive() {
  return computed(() => islandQueueStore.getQueueWithActive())
}

// 便捷：当前活跃插件 ID computed
export function useActivePlugin() {
  return computed(() => islandQueueStore.activePluginId)
}