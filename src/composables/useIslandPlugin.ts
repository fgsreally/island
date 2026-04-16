import { computed, onBeforeUnmount } from 'vue'
import { islandQueueStore, type AcquireOptions } from '../state/islandQueue'

/**
 * 插件调用 Island 的 API
 * @param pluginId 插件 ID（应与 config.ts 中的 id 一致）
 */
export function useIslandPlugin(pluginId: string) {
  // 不在组件卸载时自动释放，由插件自行控制生命周期
  // 只有显式调用 release() 才释放

  const acquire = (options: AcquireOptions = {}) => {
    islandQueueStore.acquire(pluginId, options)
  }

  const release = () => {
    islandQueueStore.release(pluginId)
  }

  const isActive = computed(() => islandQueueStore.activePluginId === pluginId)

  return {
    acquire,
    release,
    isActive,
  }
}

/**
 * 手动切换到指定插件（供 UI 使用）
 */
export function useIslandSwitch() {
  const switchTo = (pluginId: string) => {
    islandQueueStore.switchTo(pluginId)
  }

  return {
    switchTo,
  }
}