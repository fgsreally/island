import { onMounted, onUnmounted } from 'vue'
import { useIslandApp } from './islandApp'

export function useIslandPrimaryColor(color: string) {
  const { pushPrimaryColor, removePrimaryColor } = useIslandApp()
  let colorId: number | null = null

  onMounted(() => {
    colorId = pushPrimaryColor(color)
  })

  onUnmounted(() => {
    if (colorId !== null) {
      removePrimaryColor(colorId)
    }
  })
}
