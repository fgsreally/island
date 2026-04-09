import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import './styles/themes/mac/tokens.css'
import './styles/themes/mac/island.css'

createApp(App).use(router).mount('#root')
