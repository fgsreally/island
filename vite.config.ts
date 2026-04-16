import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      /**
       * 路由自 `src/plugins` 扫描：应用入口仍为 `plugins/index.vue`；
       * 各插件页面集中在 `plugins/<插件名>/pages/**`，URL 为 `/plugin/插件名/xx`。
       */
      routesFolder: {
        src: 'src/plugins',
        exclude: ['**/components/**', '**/composables/**'],
        path: (file: string) => {
          const norm = file.replace(/\\/g, '/')
          const marker = 'src/plugins/'
          const i = norm.indexOf(marker)
          if (i === -1) return norm
          let rel = norm.slice(i + marker.length)
          rel = rel.replace(/\/pages\//g, '/')
          // 添加 /plugin 前缀
          return '/plugin/' + rel
        },
      },
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
  ],
  server: {
    port: 3000,
  },
})
