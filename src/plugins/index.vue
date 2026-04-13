<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onBeforeMount(() => {
  router.replace({ path: '/favorite-selection', query: router.currentRoute.value.query })
})
</script>

<template>
  <span />
</template>
