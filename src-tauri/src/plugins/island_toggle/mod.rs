//! 对应前端插件 `island-toggle`（路由 `/island-toggle/...`）

use tauri::App;

/// 注册本插件在宿主侧需要的资源（全局快捷键等）
pub fn register(_app: &App) -> tauri::Result<()> {
    Ok(())
}
