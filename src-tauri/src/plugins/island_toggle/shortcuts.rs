//! island-toggle：全局快捷键（Alt+T → `island:toggle`）

use tauri::{App, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub fn register_global_hotkeys(app: &App) -> tauri::Result<()> {
    let shortcut: Shortcut = "Alt+T".parse().expect("Alt+T");

    let handle = app.handle().clone();
    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    log::info!("[island-toggle][Shortcut] Alt+T");
                    let _ = handle.emit("island:toggle", ());
                }
            })
            .build(),
    )?;

    app.global_shortcut().register(shortcut).map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;
    Ok(())
}
