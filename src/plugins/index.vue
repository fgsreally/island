<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onBeforeMount(() => {
  // 默认跳转到 island-toggle 插件
  router.replace({ path: '/plugin/island-toggle/idle', query: router.currentRoute.value.query })
})
</script>

<template>
  <span />
</template>
