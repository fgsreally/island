use tauri::{App, Manager, command, State};
use std::path::PathBuf;
use std::fs;
use std::sync::Mutex;

pub mod db;
pub mod icon;

/// 快捷键触发时先抓取选区内容，再打开 HUD；HUD 通过 take 读取（避免抢焦后选区丢失）
pub struct PendingFavorite(pub Mutex<Option<FavoritePayload>>);

impl Default for PendingFavorite {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

#[command]
pub fn favorite_set_pending_capture(
    state: State<'_, PendingFavorite>,
    payload: Option<FavoritePayload>,
) {
    *state.0.lock().unwrap() = payload;
}

#[command]
pub fn favorite_take_pending_capture(state: State<'_, PendingFavorite>) -> Option<FavoritePayload> {
    state.0.lock().unwrap().take()
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct FavoritePayload {
    pub item_type: String, // "text", "image", "file"
    pub content: String,   // text content or file path
}

#[command]
pub async fn add_favorite(
    payload: FavoritePayload,
    app_handle: tauri::AppHandle,
    db_state: State<'_, db::DbState>,
) -> Result<i64, String> {
    let mut original_path = None;
    let mut final_content = payload.content.clone();

    // 如果是文件，尝试硬链接到收藏夹目录
    if payload.item_type == "file" || payload.item_type == "image" {
        // 这里为了演示，默认存到应用数据目录下的 favorites 文件夹
        // 实际中应从配置读取
        let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
        let fav_dir = app_dir.join("favorites");
        fs::create_dir_all(&fav_dir).map_err(|e| e.to_string())?;

        let src_path = PathBuf::from(&payload.content);
        if src_path.exists() && src_path.is_file() {
            let file_name = src_path.file_name().unwrap_or_default();
            let dest_path = fav_dir.join(file_name);
            
            // 尝试硬链接
            if fs::hard_link(&src_path, &dest_path).is_err() {
                // 回退到复制
                fs::copy(&src_path, &dest_path).map_err(|e| e.to_string())?;
            }
            
            original_path = Some(payload.content.clone());
            final_content = dest_path.to_string_lossy().to_string();
        }
    }

    let conn = db_state.conn.lock().unwrap();
    db::add_favorite(&conn, &payload.item_type, &final_content, original_path.as_deref())
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_favorites(
    limit: u32,
    offset: u32,
    db_state: State<'_, db::DbState>,
) -> Result<Vec<db::FavoriteItem>, String> {
    let conn = db_state.conn.lock().unwrap();
    db::get_favorites(&conn, limit, offset).map_err(|e| e.to_string())
}

#[command]
pub async fn get_file_icon(path: String) -> Result<String, String> {
    icon::get_file_icon_base64(&path)
}

pub fn register(app: &App) -> tauri::Result<()> {
    let app_dir = app.path().app_data_dir().unwrap();
    fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("favorite_selection.db");

    let conn = db::init_db(db_path).expect("Failed to init favorite selection DB");
    app.manage(db::DbState {
        conn: Mutex::new(conn),
    });
    app.manage(PendingFavorite::default());

    Ok(())
}
