<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

/** 仅将 `/plugin/island-toggle` 默认引到 idle */
const router = useRouter()

onBeforeMount(() => {
  router.replace({
    path: '/plugin/island-toggle/idle',
    query: router.currentRoute.value.query,
  })
})
</script>

<template>
  <span class="island-plugin-redirect" aria-hidden="true" />
</template>
