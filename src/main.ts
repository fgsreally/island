import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { ISLAND_SETTINGS_STORAGE_KEY, pluginSettingsRevision } from './utils/island-settings'
import './index.css'
import './styles/themes/mac/tokens.css'
import './styles/themes/mac/island-shell.css'
import './styles/themes/mac/island-settings.css'

/* 设置页在独立 WebView 中保存时，本窗口需同步 revision（同 origin 的 storage 事件） */
window.addEventListener('storage', (e) => {
  if (e.key === ISLAND_SETTINGS_STORAGE_KEY && e.newValue != null) {
    pluginSettingsRevision.value++
  }
})

createApp(App).use(router).mount('#root')
