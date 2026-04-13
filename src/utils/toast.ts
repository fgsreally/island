import { ref } from 'vue'

/** 各窗口独立一份，供本窗口内 Toast 展示 */
export const toastMessage = ref('')
export const toastVisible = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, durationMs = 2600) {
  toastMessage.value = message
  toastVisible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    toastVisible.value = false
    hideTimer = null
  }, durationMs)
}
