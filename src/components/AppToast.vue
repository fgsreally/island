<script setup lang="ts">
import { toastMessage, toastVisible } from '../utils/toast'
</script>

<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div v-if="toastVisible" class="app-toast" role="status">
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100000;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--island-text);
  background: color-mix(in srgb, var(--island-bg) 88%, #fff);
  border: 1px solid rgba(128, 128, 128, 0.25);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  max-width: min(90vw, 420px);
  text-align: center;
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
