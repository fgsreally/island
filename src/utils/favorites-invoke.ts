import { invoke } from '@tauri-apps/api/core'

/** 与 Rust `FavoritePayload` 一致（serde 默认 snake_case） */
export async function invokeAddFavorite(item_type: string, content: string): Promise<number> {
  return invoke<number>('add_favorite', {
    payload: { item_type, content },
  })
}

export async function favoriteSetPendingCapture(
  payload: { item_type: string; content: string } | null,
): Promise<void> {
  await invoke('favorite_set_pending_capture', {
    payload,
  })
}

export async function favoriteTakePendingCapture(): Promise<{
  item_type: string
  content: string
} | null> {
  return invoke('favorite_take_pending_capture')
}
