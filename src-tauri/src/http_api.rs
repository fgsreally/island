//! 本地 HTTP API（与插件投递相关，后续可按插件拆路由）

use axum::{
    Router,
    extract::{Json, State},
    http::StatusCode,
    routing::post,
};
use serde::Deserialize;
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Deserialize)]
pub struct PluginPushRequest {
    pub plugin: String,
    pub action: String,
    #[serde(default)]
    pub payload: Value,
}

#[derive(Debug, serde::Serialize)]
pub struct ApiResponse {
    pub code: u16,
    pub message: String,
}

impl ApiResponse {
    pub fn ok(msg: &str) -> Self {
        Self {
            code: 0,
            message: msg.to_string(),
        }
    }
    pub fn error(code: u16, msg: &str) -> Self {
        Self {
            code,
            message: msg.to_string(),
        }
    }
}

async fn push(
    State(app): State<AppHandle>,
    Json(body): Json<PluginPushRequest>,
) -> (StatusCode, Json<ApiResponse>) {
    log::info!("[HTTP] push -> plugin={}, action={}", body.plugin, body.action);

    let payload = json!({
        "type": body.action,
        "payload": body.payload,
    });

    match app.emit(
        &format!("plugin:{}:message", body.plugin),
        payload,
    ) {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::ok("消息已投递"))),
        Err(e) => {
            log::error!("[HTTP] emit failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(500, &e.to_string())),
            )
        }
    }
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

pub async fn start_http_server(app: AppHandle) {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let router = Router::new()
        .route("/api/island/push", post(push))
        .route("/api/island/health", axum::routing::get(health))
        .layer(cors)
        .with_state(app);

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 3001));
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("[HTTP] Failed to bind on {}: {}", addr, e);
            return;
        }
    };

    log::info!("[HTTP] Island API server listening on http://{}", addr);
    axum::serve(listener, router).await.ok();
}
