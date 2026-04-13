import { ref } from 'vue'

/** 托盘设置弹窗：岛壳尺寸 + 各插件配置，localStorage 单键持久化 */
export const ISLAND_SETTINGS_STORAGE_KEY = 'island.settings'
const STORAGE_KEY = ISLAND_SETTINGS_STORAGE_KEY

export interface PluginSettingsExport {
  id: string
  title: string
  defaults: Record<string, unknown>
  schema: unknown
}

const modules = import.meta.glob<{ pluginSettings: PluginSettingsExport }>(
  '../plugins/*/config.ts',
  { eager: true },
)

export function getRegisteredPlugins(): PluginSettingsExport[] {
  return Object.values(modules).map((m) => m.pluginSettings)
}

export type PluginSettingsMap = Record<string, Record<string, unknown>>

/** 岛整体外观（影响 --island-scale） */
export interface IslandShellSettings {
  referenceScreenWidth?: number
  scaleMultiplier?: number
  scaleMin?: number
  scaleMax?: number
  themeMode?: 'system' | 'dark' | 'light'
}

export interface IslandSettingsStored {
  shell: IslandShellSettings
  plugins: PluginSettingsMap
}

export const islandShellSettingsDefaults: Required<IslandShellSettings> = {
  referenceScreenWidth: 1920,
  scaleMultiplier: 1,
  scaleMin: 0.6,
  scaleMax: 2.5,
  themeMode: 'system',
}

/** 岛整体设置：与上方字段一致，供设置页按 JSON Schema 渲染表单 */
export const islandShellSettingsSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'island.shell',
  title: '岛整体',
  description: '影响 --island-scale 与主题；保存在本地',
  type: 'object',
  additionalProperties: false,
  properties: {
    referenceScreenWidth: {
      title: '参考屏幕宽度',
      type: 'number',
      description: '单位 px，用于按比例计算 --island-scale',
      default: 1920,
    },
    scaleMultiplier: {
      title: '缩放乘数',
      type: 'number',
      description: '在参考宽度基础上的额外倍率',
      default: 1,
    },
    scaleMin: {
      title: '最小缩放',
      type: 'number',
      description: '岛 UI 的最小缩放系数',
      default: 0.6,
    },
    scaleMax: {
      title: '最大缩放',
      type: 'number',
      description: '岛 UI 的最大缩放系数',
      default: 2.5,
    },
    themeMode: {
      title: '主题模式',
      type: 'string',
      description: '与系统或明暗主题一致',
      enum: ['system', 'dark', 'light'],
      default: 'system',
    },
  },
} as const

export const pluginSettingsRevision = ref(0)

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeShell(raw: unknown): IslandShellSettings {
  if (!isRecord(raw)) return {}
  const out: IslandShellSettings = {}
  const numKeys = [
    'referenceScreenWidth',
    'scaleMultiplier',
    'scaleMin',
    'scaleMax',
  ] as const satisfies readonly (keyof IslandShellSettings)[]
  for (const k of numKeys) {
    const v = raw[k as string]
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k] = v
    }
  }

  const tm = raw['themeMode' as string]
  if (tm === 'system' || tm === 'dark' || tm === 'light') {
    out.themeMode = tm
  }

  return out
}

/** 合并默认值并只保留合法数值字段，供保存与展示 */
export function normalizeIslandShell(raw: unknown): IslandShellSettings {
  return { ...islandShellSettingsDefaults, ...normalizeShell(raw) }
}

export function loadIslandSettings(): IslandSettingsStored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isRecord(parsed) && 'plugins' in parsed) {
        const plugins = isRecord(parsed.plugins)
          ? (parsed.plugins as PluginSettingsMap)
          : {}
        return {
          shell: normalizeIslandShell(parsed.shell),
          plugins,
        }
      }
    }
  } catch {
    /* ignore */
  }

  return {
    shell: normalizeIslandShell({}),
    plugins: {},
  }
}

export function loadAllPluginSettings(): PluginSettingsMap {
  return loadIslandSettings().plugins
}

export function loadIslandShellSettings(): IslandShellSettings {
  return { ...loadIslandSettings().shell }
}

export function saveIslandSettings(data: IslandSettingsStored) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  /* 本窗口立即生效 */
  pluginSettingsRevision.value += 1
  /* 其它 WebView 不会收到本次 setItem 的 storage 事件，靠 main.ts 里 storage 监听同步 revision */
  window.dispatchEvent(new CustomEvent('island:settings-changed'))
}

export function saveAllPluginSettings(map: PluginSettingsMap) {
  const cur = loadIslandSettings()
  saveIslandSettings({ ...cur, plugins: map })
}

export function computeIslandScale(screenWidth: number, shell: IslandShellSettings): number {
  const refW = shell.referenceScreenWidth ?? islandShellSettingsDefaults.referenceScreenWidth
  const mult = shell.scaleMultiplier ?? islandShellSettingsDefaults.scaleMultiplier
  const min = shell.scaleMin ?? islandShellSettingsDefaults.scaleMin
  const max = shell.scaleMax ?? islandShellSettingsDefaults.scaleMax
  const base = (screenWidth / refW) * mult
  return Math.max(min, Math.min(base, max))
}
