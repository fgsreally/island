import { onMounted, ref, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useRouter } from 'vue-router'
import { useFavoriteSelectionSettings } from './useFavoriteSelectionSettings'
import { pluginSettingsRevision } from '../../../utils/island-settings'
import { favoriteSetPendingCapture, invokeAddFavorite } from '../../../utils/favorites-invoke'
import { openFavoriteHudNearCursor } from '../favorite-hud-window'
import { showToast } from '../../../utils/toast'

export interface FavoriteItem {
  id: number
  item_type: string
  content: string
  original_path: string | null
  created_at: string
}

const items = ref<FavoriteItem[]>([])
const isDragging = ref(false)
let isInitialized = false
let unregisterShortcut: (() => Promise<void>) | null = null

function normalizeShortcut(raw: string): string {
  return raw
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const p = part.toLowerCase()
      if (p === 'ctrl' || p === 'control') return 'Control'
      if (p === 'alt') return 'Alt'
      if (p === 'shift') return 'Shift'
      if (p === 'cmd' || p === 'command' || p === 'meta') return 'Command'
      if (p === 'win' || p === 'super') return 'Super'
      return part.length === 1 ? part.toUpperCase() : part
    })
    .join('+')
}

export function useFavoriteSelectionPlugin() {
  const router = useRouter()
  const settings = useFavoriteSelectionSettings()
  const status = ref<'idle' | 'running' | 'success' | 'error'>('idle')

  const loadItems = async () => {
    try {
      items.value = await invoke<FavoriteItem[]>('get_favorites', {
        limit: 200,
        offset: 0,
      })
    } catch (e) {
      console.error('Failed to load favorites', e)
    }
  }

  const handleDrop = async (paths: string[]) => {
    isDragging.value = false
    status.value = 'running'
    router.push('/favorite-selection')

    try {
      for (const path of paths) {
        await invokeAddFavorite('file', path)
      }

      await loadItems()

      status.value = 'success'

      setTimeout(() => {
        status.value = 'idle'
      }, 2000)
    } catch (e) {
      status.value = 'error'
      console.error(e)
    }
  }

  async function onFavoriteHotkey() {
    console.log('[favorite-selection] 快捷键触发，准备打开收藏区...')
    try {
      const payload = await invoke<{ item_type: string; content: string }>('get_selected_content_via_copy')
      console.log('[favorite-selection] 成功获取选区内容:', payload)
      await favoriteSetPendingCapture(payload)
    } catch (err) {
      console.log('[favorite-selection] 未获取到选区内容或获取失败:', err)
      await favoriteSetPendingCapture(null)
    }
    await openFavoriteHudNearCursor()
  }

  async function applyGlobalShortcut() {
    console.log('[favorite-selection] 开始注册全局快捷键...')
    let register: typeof import('@tauri-apps/plugin-global-shortcut').register
    let unregister: typeof import('@tauri-apps/plugin-global-shortcut').unregister
    let isRegistered: typeof import('@tauri-apps/plugin-global-shortcut').isRegistered
    try {
      const mod = await import('@tauri-apps/plugin-global-shortcut')
      register = mod.register
      unregister = mod.unregister
      isRegistered = mod.isRegistered
    } catch {
      console.warn('[favorite-selection] 全局快捷键仅能在 Tauri 桌面应用内注册')
      return
    }

    const next = normalizeShortcut('Ctrl+T')
    console.log('[favorite-selection] 目标快捷键:', next)

    if (unregisterShortcut) {
      await unregisterShortcut()
      unregisterShortcut = null
    }

    if (await isRegistered(next)) {
      console.log(`[favorite-selection] 快捷键 ${next} 已被注册，先注销`)
      await unregister(next)
    }

    try {
      await register(next, async (e) => {
        console.log('[favorite-selection] 快捷键事件触发:', e)
        if (e.state !== 'Pressed') return
        try {
          await onFavoriteHotkey()
        } catch (err) {
          console.error('[favorite-selection] 快捷键处理失败（请在 Tauri 桌面内使用，且勿与系统/其它软件抢占 Ctrl+T）', err)
        }
      })
      console.log(`[favorite-selection] 成功注册快捷键: ${next}`)
    } catch (err) {
      console.error(`[favorite-selection] 注册快捷键「${next}」失败（可能被其它程序占用）`, err)
      return
    }

    unregisterShortcut = async () => {
      if (await isRegistered(next)) {
        await unregister(next)
      }
    }
  }

  const initListeners = async () => {
    if (isInitialized) return
    isInitialized = true

    await loadItems()

    try {
      await listen('tauri://file-drop', (event) => {
        const payload = event.payload
        if (Array.isArray(payload) && payload.every((x): x is string => typeof x === 'string')) {
          handleDrop(payload)
        }
      })

      await listen('tauri://file-drop-hover', () => {
        isDragging.value = true
        status.value = 'running'
        router.push('/favorite-selection')
      })

      await listen('tauri://file-drop-cancelled', () => {
        isDragging.value = false
        status.value = 'idle'
      })

      await listen('favorites-changed', () => {
        void loadItems()
      })
    } catch (e) {
      console.warn('Events not available', e)
    }

    try {
      await listen<{ item_type: string; content: string }>('favorite-selection-triggered', async (event) => {
        console.log('[favorite-selection] 监听到全局划词事件:', event.payload)
        await favoriteSetPendingCapture(event.payload)
        await openFavoriteHudNearCursor()
      })
    } catch (e) {
      console.warn('Events not available', e)
    }
  }

  onMounted(() => {
    void initListeners()
    
    let scTimer: ReturnType<typeof setTimeout> | null = null
    watch(
      () => pluginSettingsRevision.value,
      () => {
        if (scTimer) clearTimeout(scTimer)
        scTimer = setTimeout(() => {
          scTimer = null
          void applyGlobalShortcut()
        }, 120)
      },
      { immediate: true },
    )
  })

  return {
    items,
    isDragging,
    status,
    loadItems,
  }
}
