import { computed } from 'vue'
import {
  loadAllPluginSettings,
  pluginSettingsRevision,
} from '../../../utils/island-settings'
import {
  favoriteSelectionSettingsDefaults,
  type FavoriteSelectionSettings,
} from '../config'

export function useFavoriteSelectionSettings() {
  return computed((): FavoriteSelectionSettings => {
    pluginSettingsRevision.value
    const all = loadAllPluginSettings()
    const row = all['favorite-selection']
    return { ...favoriteSelectionSettingsDefaults, ...(row ?? {}) }
  })
}
