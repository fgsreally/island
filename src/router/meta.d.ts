import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 状态顺序：小在左、大在右，用于路由切换滑动方向 */
    index?: number
    /** 展开类型：auto (自动展开, 无光晕) | force (强制展开, 有彩色光晕) */
    expandType?: 'auto' | 'force'
  }
}

export {}
