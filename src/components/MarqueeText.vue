<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps<{ text: string }>()
const containerRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)

function checkOverflow() {
  if (containerRef.value && textRef.value) {
    isOverflowing.value = textRef.value.scrollWidth > containerRef.value.clientWidth
  }
}

onMounted(() => {
  checkOverflow()
  window.addEventListener('resize', checkOverflow)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkOverflow)
})

watch(() => props.text, async () => {
  await nextTick()
  checkOverflow()
})
</script>

<template>
  <div class="marquee-container" ref="containerRef">
    <div 
      class="marquee-text" 
      :class="{ 'is-scrolling': isOverflowing }"
    >
      <span ref="textRef">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped>
.marquee-container {
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
}

.marquee-text {
  display: inline-block;
  white-space: nowrap;
}

.marquee-text.is-scrolling {
  padding-left: 100%;
  animation: marquee 6s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}
</style>
