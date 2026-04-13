import { computed } from 'vue'
import {
  loadAllPluginSettings,
  pluginSettingsRevision,
} from '../../../utils/island-settings'
import {
  islandToggleSettingsDefaults,
  type IslandToggleSettings,
} from '../config'

export function useIslandToggleSettings() {
  return computed((): IslandToggleSettings => {
    pluginSettingsRevision.value
    const all = loadAllPluginSettings()
    const row = all['island-toggle']
    return { ...islandToggleSettingsDefaults, ...(row ?? {}) }
  })
}
