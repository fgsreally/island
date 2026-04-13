<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

/** 仅将 `/island-toggle` 默认引到 idle；布局与过渡在 App.vue */
const router = useRouter()

onBeforeMount(() => {
  router.replace({
    path: '/island-toggle/idle',
    query: router.currentRoute.value.query,
  })
})
</script>

<template>
  <span class="island-plugin-redirect" aria-hidden="true" />
</template>
