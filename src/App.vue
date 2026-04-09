<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { islandStore } from './state/island'

const router = useRouter()

// state 变化时同步路由（包括 store 内部自动推进）
watch(() => islandStore.state, (state) => {
  router.push(`/island-toggle/${state}`)
})

onMounted(async () => {
  await router.isReady()
  router.replace(`/island-toggle/${islandStore.state}`)

  try {
    const { listen } = await import('@tauri-apps/api/event')
    await listen('island:toggle', () => {
      islandStore.advance()
    })
  } catch (e) {
    console.warn('[App] Tauri event unavailable:', e)
  }
})
</script>

<template>
  <router-view />
</template>
