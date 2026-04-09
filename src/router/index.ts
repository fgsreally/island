import { createRouter, createWebHashHistory } from 'vue-router'
import IslandView from '../components/IslandView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/:plugin/:state',
      component: IslandView,
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/island-toggle/idle',
    },
  ],
})

export default router
