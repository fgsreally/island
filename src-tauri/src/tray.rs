use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{App, Emitter, Manager};

pub fn setup(app: &App) -> tauri::Result<()> {
    let settings_label = if cfg!(target_os = "macos") {
        "偏好设置…"
    } else {
        "设置"
    };

    let settings = MenuItemBuilder::new(settings_label).id("settings").build(app)?;
    let quit = MenuItemBuilder::new("退出").id("quit").build(app)?;
    let menu = MenuBuilder::new(app).items(&[&settings, &quit]).build()?;

    let Some(icon) = app.default_window_icon() else {
        return Ok(());
    };

    let _tray = TrayIconBuilder::new()
        .icon(icon.clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "settings" => {
                // 打开设置窗口
                let handle = app.app_handle();
                if let Some(window) = handle.get_webview_window("settings") {
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _ = tauri::WebviewWindowBuilder::new(
                        app,
                        "settings",
                        tauri::WebviewUrl::App("index.html#/settings".into())
                    )
                    .title("Settings")
                    .inner_size(600.0, 700.0)
                    .center()
                    .build();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
