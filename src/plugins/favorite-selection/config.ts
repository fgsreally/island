export const favoriteSelectionSettingsSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'favorite-selection.settings',
  title: 'favorite-selection',
  description: '收藏夹插件配置',
  type: 'object',
  additionalProperties: false,
  properties: {
  },
} as const

export const favoriteSelectionSettingsDefaults = {
} as const

export type FavoriteSelectionSettings = typeof favoriteSelectionSettingsDefaults

// 由 src/utils/island-settings.ts 中 import.meta.glob 聚合
export const pluginSettings = {
  id: 'favorite-selection',
  title: '收藏夹',
  schema: favoriteSelectionSettingsSchema,
  defaults: { ...favoriteSelectionSettingsDefaults },
}
