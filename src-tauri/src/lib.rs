mod http_api;
mod plugins;
mod tray;

use tauri::{Manager, generate_handler, Emitter};

#[tauri::command]
fn get_windows_accent_color() -> String {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Graphics::Dwm::DwmGetColorizationColor;
        let mut color: u32 = 0;
        let mut opaque: windows::Win32::Foundation::BOOL = windows::Win32::Foundation::BOOL(0);
        unsafe {
            if DwmGetColorizationColor(&mut color, &mut opaque).is_ok() {
                let r = (color >> 16) & 0xFF;
                let g = (color >> 8) & 0xFF;
                let b = color & 0xFF;
                // 忽略 alpha，因为通常我们需要一个不透明的颜色作为渐变
                return format!("rgb({}, {}, {})", r, g, b);
            }
        }
    }
    // Fallback
    "AccentColor".to_string()
}

/// 物理像素，供前端换算为逻辑坐标并放置「收藏坞」窗口（靠近光标即靠近选区附近）
#[tauri::command]
fn get_cursor_screen_position() -> Result<(i32, i32), String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        unsafe {
            let mut pt = POINT::default();
            if GetCursorPos(&mut pt).is_ok() {
                return Ok((pt.x, pt.y));
            }
        }
        return Err("GetCursorPos failed".into());
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Only supported on Windows".into())
    }
}

use std::sync::{Arc, Mutex};

struct ClickRegion {
    rect: Arc<Mutex<Option<(i32, i32, i32, i32)>>>,
}

#[tauri::command]
fn update_click_region(
    window: tauri::Window,
    left: f64,
    top: f64,
    width: f64,
    height: f64,
    state: tauri::State<'_, ClickRegion>
) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        if let Ok(pos) = window.inner_position() {
            let pad = 20.0; // 增加 20px 的提前触发区域
            let px = pos.x + ((left - pad) * scale).round() as i32;
            let py = pos.y + ((top - pad) * scale).round() as i32;
            let pw = ((width + pad * 2.0) * scale).round() as i32;
            let ph = ((height + pad * 2.0) * scale).round() as i32;
            *state.rect.lock().unwrap() = Some((px, py, pw, ph));
        }
    }
}

pub fn get_selected_content_via_copy_impl() -> Result<crate::plugins::favorite_selection::FavoritePayload, String> {
    #[cfg(target_os = "windows")]
    {
        use clipboard_rs::{Clipboard, ClipboardContext};
        use std::thread;
        use std::time::Duration;
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL, VK_C
        };
        use std::mem::size_of;

        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        
        // 1. 备份当前的剪贴板文本
        let backup_text = ctx.get_text().ok();
        let backup_files = ctx.get_files().ok();
        // 2. 模拟按下 Ctrl+C
        unsafe {
            let mut inputs = [INPUT::default(); 4];
            
            // Ctrl down
            inputs[0].r#type = INPUT_KEYBOARD;
            inputs[0].Anonymous.ki = KEYBDINPUT { wVk: VK_CONTROL, ..Default::default() };
            
            // C down
            inputs[1].r#type = INPUT_KEYBOARD;
            inputs[1].Anonymous.ki = KEYBDINPUT { wVk: VK_C, ..Default::default() };
            
            // C up
            inputs[2].r#type = INPUT_KEYBOARD;
            inputs[2].Anonymous.ki = KEYBDINPUT { wVk: VK_C, dwFlags: KEYEVENTF_KEYUP, ..Default::default() };
            
            // Ctrl up
            inputs[3].r#type = INPUT_KEYBOARD;
            inputs[3].Anonymous.ki = KEYBDINPUT { wVk: VK_CONTROL, dwFlags: KEYEVENTF_KEYUP, ..Default::default() };
            
            SendInput(&inputs, size_of::<INPUT>() as i32);
        }
        
        // 3. 等待剪贴板写入完成
        thread::sleep(Duration::from_millis(150));
        
        // 4. 读取新的剪贴板内容
        let mut payload = None;
        
        // 优先尝试读取文件
        if let Ok(files) = ctx.get_files() {
            if !files.is_empty() && Some(&files) != backup_files.as_ref() {
                payload = Some(crate::plugins::favorite_selection::FavoritePayload {
                    item_type: "file".to_string(),
                    content: files[0].clone(),
                });
            }
        }
        
        // 如果没有文件，尝试读取文本
        if payload.is_none() {
            if let Ok(text) = ctx.get_text() {
                if !text.is_empty() && Some(&text) != backup_text.as_ref() {
                    payload = Some(crate::plugins::favorite_selection::FavoritePayload {
                        item_type: "text".to_string(),
                        content: text,
                    });
                }
            }
        }
        
        // 5. 恢复剪贴板
        if let Some(t) = backup_text {
            let _ = ctx.set_text(t);
        }
        
        payload.ok_or_else(|| "No content selected".to_string())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Only supported on Windows".to_string())
    }
}

#[tauri::command]
async fn get_selected_content_via_copy() -> Result<crate::plugins::favorite_selection::FavoritePayload, String> {
    get_selected_content_via_copy_impl()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(generate_handler![
            get_windows_accent_color,
            get_cursor_screen_position,
            update_click_region,
            get_selected_content_via_copy,
            plugins::foreground::plugin_foreground_current,
            plugins::foreground::plugin_foreground_boost,
            plugins::favorite_selection::add_favorite,
            plugins::favorite_selection::get_favorites,
            plugins::favorite_selection::get_file_icon,
            plugins::favorite_selection::favorite_set_pending_capture,
            plugins::favorite_selection::favorite_take_pending_capture,
        ])
        .setup(|app| {
            let rect = Arc::new(Mutex::new(None));
            app.manage(ClickRegion { rect: rect.clone() });

            let window = app.get_webview_window("main").unwrap();
            
            // 固定主窗口大小，永不改变，彻底消除闪烁
            if let Ok(Some(monitor)) = window.primary_monitor() {
                let monitor_size = monitor.size();
                let scale_factor = monitor.scale_factor();
                let logical_width = monitor_size.width as f64 / scale_factor;
                
                let window_width = logical_width.min(1200.0);
                let window_height = 800.0;
                
                let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: window_width, height: window_height }));
                
                let x = (logical_width - window_width) / 2.0;
                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y: 0.0 }));
            }

            let window_clone = window.clone();
            std::thread::spawn(move || {
                let mut is_ignored = false;
                loop {
                    std::thread::sleep(std::time::Duration::from_millis(16));
                    
                    let mut inside = false;
                    if let Some((rx, ry, rw, rh)) = *rect.lock().unwrap() {
                        #[cfg(target_os = "windows")]
                        {
                            use windows::Win32::Foundation::POINT;
                            use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
                            unsafe {
                                let mut pt = POINT::default();
                                if GetCursorPos(&mut pt).is_ok() {
                                    if pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh {
                                        inside = true;
                                    }
                                }
                            }
                        }
                        #[cfg(not(target_os = "windows"))]
                        {
                            // macOS/Linux fallback if needed, though mostly target Windows
                        }
                    }
                    
                    let should_ignore = !inside;
                    if should_ignore != is_ignored {
                        is_ignored = should_ignore;
                        let _ = window_clone.set_ignore_cursor_events(should_ignore);
                    }
                }
            });

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                http_api::start_http_server(handle).await;
            });

            let app_handle_for_mouse = app.handle().clone();
            std::thread::spawn(move || {
                #[cfg(target_os = "windows")]
                {
                    use windows::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;
                    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
                    use windows::Win32::Foundation::POINT;
                    
                    let mut was_pressed = false;
                    let mut start_pt = POINT::default();

                    loop {
                        std::thread::sleep(std::time::Duration::from_millis(20));
                        unsafe {
                            // VK_LBUTTON is 1
                            let pressed = (GetAsyncKeyState(1) as i16) < 0;
                            if pressed && !was_pressed {
                                was_pressed = true;
                                let _ = GetCursorPos(&mut start_pt);
                            } else if !pressed && was_pressed {
                                was_pressed = false;
                                let mut end_pt = POINT::default();
                                if GetCursorPos(&mut end_pt).is_ok() {
                                    let dx = end_pt.x - start_pt.x;
                                    let dy = end_pt.y - start_pt.y;
                                    let dist_sq = dx * dx + dy * dy;
                                    // 移动距离大于约 6 像素才算划词，降低漏触发
                                    if dist_sq > 36 {
                                        // 略微延迟，确保系统选区已稳定
                                        std::thread::sleep(std::time::Duration::from_millis(120));
                                        let app_handle_clone = app_handle_for_mouse.clone();
                                        std::thread::spawn(move || {
                                            if let Ok(payload) = get_selected_content_via_copy_impl() {
                                                let _ = app_handle_clone.emit("favorite-selection-triggered", payload);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            });

            app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
            plugins::foreground::init(app)?;
            plugins::island_toggle::register(app)?;
            plugins::favorite_selection::register(app)?;
            tray::setup(app)?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
