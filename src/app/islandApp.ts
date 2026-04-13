import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { createInjectionState } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { isExpandedQuery, stripExpanded } from '../utils/island-route'
import { loadIslandShellSettings, pluginSettingsRevision } from '../utils/island-settings'

const [useProvideIslandApp, useIslandAppOptional] = createInjectionState(() => {
  const route = useRoute()
  const router = useRouter()
  const queryExpanded = computed(() => isExpandedQuery(route.query))
  const hoverExpanded = ref(false)
  const isExpanded = computed(() => queryExpanded.value || hoverExpanded.value)

  const defaultPrimaryColor = ref('AccentColor')
  const customPrimaryColorStack = ref<{ id: number; color: string }[]>([])
  let nextColorId = 0

  const primaryColor = computed(() => {
    const stack = customPrimaryColorStack.value
    if (stack.length > 0) {
      return stack[stack.length - 1].color
    }
    return defaultPrimaryColor.value
  })

  // 主题管理
  const isDarkMode = ref(true)

  function updateTheme() {
    const shell = loadIslandShellSettings()
    const mode = shell.themeMode || 'system'
    
    if (mode === 'dark') {
      isDarkMode.value = true
    } else if (mode === 'light') {
      isDarkMode.value = false
    } else {
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    
    if (isDarkMode.value) {
      document.documentElement.classList.add('theme-dark')
      document.documentElement.classList.remove('theme-light')
    } else {
      document.documentElement.classList.add('theme-light')
      document.documentElement.classList.remove('theme-dark')
    }
  }

  watch(pluginSettingsRevision, updateTheme)

  onMounted(() => {
    updateTheme()
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      const shell = loadIslandShellSettings()
      if (!shell.themeMode || shell.themeMode === 'system') {
        updateTheme()
      }
    }
    mediaQuery.addEventListener('change', listener)
    onUnmounted(() => mediaQuery.removeEventListener('change', listener))
  })

  // 初始化时获取系统主色
  invoke<string>('get_windows_accent_color')
    .then((color) => {
      if (color) {
        defaultPrimaryColor.value = color
      }
    })
    .catch(() => {
      // 非 tauri 环境或获取失败
    })

  watch(
    primaryColor,
    (color) => {
      document.documentElement.style.setProperty('--island-primary-color', color)
    },
    { immediate: true },
  )

  function pushPrimaryColor(color: string): number {
    const id = ++nextColorId
    customPrimaryColorStack.value.push({ id, color })
    return id
  }

  function removePrimaryColor(id: number) {
    customPrimaryColorStack.value = customPrimaryColorStack.value.filter((item) => item.id !== id)
  }

  let autoCollapseTimer: ReturnType<typeof setTimeout> | null = null

  function clearAutoCollapse() {
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer)
      autoCollapseTimer = null
    }
  }

  function setExpanded(value: boolean, timeout?: number) {
    clearAutoCollapse()
    
    // 如果是 hover 触发的（没有 timeout），我们只设置 hoverExpanded
    // 如果是代码调用（有 timeout，或者明确传 false），我们修改路由参数
    if (value && timeout === undefined) {
      hoverExpanded.value = true
    } else {
      hoverExpanded.value = false
      if (value) {
        router.replace({ path: route.path, query: { ...route.query, expanded: '1' } }).catch(() => {})
        if (timeout && timeout > 0) {
          autoCollapseTimer = setTimeout(() => {
            // 时间到了，只在没有被 hover 的情况下收起
            if (!hoverExpanded.value) {
              setExpanded(false)
            }
          }, timeout)
        }
      } else {
        router.replace({ path: route.path, query: stripExpanded(route.query) }).catch(() => {})
      }
    }
  }

  function toggleExpanded() {
    setExpanded(!isExpanded.value)
  }

  return { isExpanded, setExpanded, clearAutoCollapse, toggleExpanded, primaryColor, pushPrimaryColor, removePrimaryColor, isDarkMode }
})

export { useProvideIslandApp }

export type IslandAppContext = ReturnType<typeof useProvideIslandApp>

/** 岛壳 provide 之后，在子树内使用（插件视图等） */
export function useIslandApp(): IslandAppContext {
  const ctx = useIslandAppOptional()
  if (ctx === undefined) {
    throw new Error('[island] 请先在 App.vue 调用 useProvideIslandApp()')
  }
  return ctx
}
