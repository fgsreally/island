/**
 * island-toggle 插件配置：默认值 + JSON Schema 形状（单文件约定，供设置弹窗与类型推导）
 */
export const islandToggleSettingsSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'island-toggle.settings',
  title: 'island-toggle',
  description: '演示插件的可选配置',
  type: 'object',
  additionalProperties: false,
  properties: {
    collapsedTitleIdle: {
      title: '收缩态 · 空闲',
      type: 'string',
      description: '收缩态 idle 标题',
      default: '等待解析',
    },
    collapsedTitleRunning: {
      title: '收缩态 · 运行中',
      type: 'string',
      description: '收缩态 running 标题',
      default: '解析中',
    },
    collapsedTitleDone: {
      title: '收缩态 · 完成',
      type: 'string',
      description: '收缩态 done 标题',
      default: '解析完成',
    },
  },
} as const

export const islandToggleSettingsDefaults = {
  collapsedTitleIdle: '等待解析',
  collapsedTitleRunning: '解析中',
  collapsedTitleDone: '解析完成',
} as const

export type IslandToggleSettings = typeof islandToggleSettingsDefaults

// 由 src/utils/island-settings.ts 中 import.meta.glob 聚合
export const pluginSettings = {
  id: 'island-toggle',
  title: 'Island Toggle（演示）',
  schema: islandToggleSettingsSchema,
  defaults: { ...islandToggleSettingsDefaults },
}
