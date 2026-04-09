use std::net::SocketAddr;
use axum::{
    Router,
    routing::post,
    extract::{State, Json},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

// 请求体：插件消息
#[derive(Debug, Deserialize)]
struct PluginPushRequest {
    plugin: String,
    action: String,
    #[serde(default)]
    payload: Value,
}

// 响应体
#[derive(Debug, Serialize)]
struct ApiResponse {
    code: u16,
    message: String,
}

impl ApiResponse {
    fn ok(msg: &str) -> Self {
        Self { code: 0, message: msg.to_string() }
    }
    fn error(code: u16, msg: &str) -> Self {
        Self { code: code, message: msg.to_string() }
    }
}

// POST /api/island/push
async fn push(
    State(app): State<AppHandle>,
    Json(body): Json<PluginPushRequest>,
) -> (StatusCode, Json<ApiResponse>) {
    log::info!("[HTTP] push -> plugin={}, action={}", body.plugin, body.action);

    let payload = serde_json::json!({
        "type": body.action,
        "payload": body.payload,
    });

    match app.emit(&format!("plugin:{}:message", body.plugin), payload) {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::ok("消息已投递"))),
        Err(e) => {
            log::error!("[HTTP] emit failed: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(500, &e.to_string())))
        }
    }
}

// GET /api/island/health
async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

async fn start_http_server(app: AppHandle) {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/island/push", post(push))
        .route("/api/island/health", axum::routing::get(health))
        .layer(cors)
        .with_state(app);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("[HTTP] Failed to bind on {}: {}", addr, e);
            return;
        }
    };

    log::info!("[HTTP] Island API server listening on http://{}", addr);
    axum::serve(listener, app).await.ok();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 窗口水平居中，贴顶放置
            let window = app.get_webview_window("main").unwrap();
            let monitor = window.primary_monitor()?.unwrap();
            let monitor_size = monitor.size();
            let window_size = window.outer_size()?;
            let x = (monitor_size.width as i32 - window_size.width as i32) / 2;
            window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y: 0 }))?;

            let handle = app.handle().clone();

            // 启动 HTTP 服务器
            tauri::async_runtime::spawn(async move {
                start_http_server(handle).await;
            });

            // 注册全局快捷键 Ctrl+T -> 直接调用 JS 函数
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

            let shortcut: Shortcut = "Ctrl+T".parse().unwrap();
            let handle2 = app.handle().clone();
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |_app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            log::info!("[Shortcut] Ctrl+T pressed");
                            let _ = handle2.emit("island:toggle", ());
                        }
                    })
                    .build(),
            )?;
            app.global_shortcut().register(shortcut)?;

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
