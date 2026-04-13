import { invoke } from '@tauri-apps/api/core'
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { primaryMonitor } from '@tauri-apps/api/window'

const LABEL = 'favorite-hud'
const W = 80
const H = 80

/**
 * 在光标附近打开置顶透明「收藏坞」（物理光标 ≈ 选区附近，类似豆包选区浮层）
 */
export async function openFavoriteHudNearCursor(): Promise<void> {
  console.log('[favorite-hud] 准备计算光标位置并打开收藏坞...')
  let px = 0, py = 0
  try {
    const pos = await invoke<[number, number]>('get_cursor_screen_position')
    px = pos[0]
    py = pos[1]
    console.log(`[favorite-hud] 光标物理坐标: x=${px}, y=${py}`)
  } catch (err) {
    console.warn('[favorite-hud] 无法获取光标物理坐标，使用默认位置', err)
  }
  const mon = await primaryMonitor()
  if (!mon) {
    console.warn('[favorite-hud] 未获取到主显示器')
    return
  }

  const scale = mon.scaleFactor
  const logicalWidth = mon.size.width / scale
  const logicalHeight = mon.size.height / scale

  let x = px / scale + 10
  let y = py / scale + 10
  if (px === 0 && py === 0) {
    x = logicalWidth / 2 - W / 2
    y = logicalHeight / 2 - H / 2
  }
  if (x + W > logicalWidth - 4) x = Math.max(4, logicalWidth - W - 4)
  if (y + H > logicalHeight - 4) y = Math.max(4, logicalHeight - H - 4)

  const url = import.meta.env.DEV
    ? `http://localhost:3000/#/favorite-selection/hud`
    : 'index.html#/favorite-selection/hud'

  const existing = await WebviewWindow.getByLabel(LABEL)
  if (existing) {
    console.log(`[favorite-hud] 窗口已存在，移动到 x=${x}, y=${y} 并显示`)
    await existing.setSize(new LogicalSize(W, H))
    await existing.setPosition(new LogicalPosition(x, y))
    await existing.show()
    await existing.setFocus()
    return
  }

  console.log(`[favorite-hud] 创建新窗口，位置 x=${x}, y=${y}`)
  try {
    const win = new WebviewWindow(LABEL, {
      url,
      width: W,
      height: H,
      x,
      y,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      shadow: false,
      focus: true,
      visible: true,
    })
    
    win.once('tauri://error', (e) => {
      console.error('[favorite-hud] 窗口创建失败:', e)
    })
  } catch (err) {
    console.error('[favorite-hud] WebviewWindow 实例化异常:', err)
  }
}
