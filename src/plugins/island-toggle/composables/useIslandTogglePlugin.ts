import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { IslandState } from '../../../state/island'
import { islandStore } from '../../../state/island'

/**
 * island-toggle：状态 ↔ 子路由、Tauri `island:toggle`。
 * 在 `App.vue` 中调用一次（与岛壳同层）。
 */
export function useIslandTogglePlugin() {
  const router = useRouter()
  const route = useRoute()

  function pathForState(state: IslandState) {
    return `/island-toggle/${state}`
  }

  function stateFromPath(path: string): IslandState | null {
    const m = path.match(/\/island-toggle\/(idle|running|done)$/)
    return m ? (m[1] as IslandState) : null
  }

  watch(
    () => islandStore.state,
    (state) => {
      const p = pathForState(state)
      if (route.path !== p) {
        const q = { ...route.query }
        if (state === 'done') q.expanded = '1'
        else if (state === 'idle') delete q.expanded
        router.push({ path: p, query: q })
      }
    },
  )

  watch(
    () => route.path,
    (p) => {
      const s = stateFromPath(p)
      if (s && s !== islandStore.state) {
        islandStore.state = s
      }
    },
  )

  onMounted(async () => {
    await router.isReady()
    const p = pathForState(islandStore.state)
    const q = { ...route.query }
    if (islandStore.state === 'done') q.expanded = '1'
    else if (islandStore.state === 'idle') delete q.expanded
    if (route.path !== p) {
      router.replace({ path: p, query: q })
    }

    try {
      const { listen } = await import('@tauri-apps/api/event')
      await listen('island:toggle', () => {
        islandStore.advance()
      })

      const { register, isRegistered, unregister } = await import('@tauri-apps/plugin-global-shortcut')
      
      if (await isRegistered('Alt+T')) {
        await unregister('Alt+T')
      }
      await register('Alt+T', () => {
        islandStore.advance()
      })
      console.log('[island-toggle] Alt+T registered successfully')
    } catch (e) {
      console.warn('[island-toggle] Tauri event/shortcut unavailable:', e)
    }
  })
}
