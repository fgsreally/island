//! 前台插件调度：每个插件有默认优先级，可通过临时加成在「岛上」抢占展示。
//! 前端监听 `island:foreground-plugin` 与初始 `invoke(plugin_foreground_current)` 同步路由。

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{App, AppHandle, Emitter, Manager, State};

#[derive(Default)]
struct Inner {
    /// plugin_id -> 默认优先级（越大越优先）
    defaults: HashMap<String, i32>,
    /// 临时加成：plugin_id -> (bonus, 到期时间)
    boosts: HashMap<String, (i32, Instant)>,
}

pub struct ForegroundState {
    inner: Mutex<Inner>,
    app: AppHandle,
}

impl ForegroundState {
    pub fn new(app: AppHandle) -> Self {
        let mut inner = Inner::default();
        // 默认优先级：可按产品调参；后续可从配置文件加载
        inner.defaults.insert("island-toggle".into(), 100);
        inner.defaults.insert("favorite-selection".into(), 60);
        Self {
            inner: Mutex::new(inner),
            app,
        }
    }

    fn prune_expired(g: &mut Inner) {
        let now = Instant::now();
        g.boosts.retain(|_, (_, until)| *until > now);
    }

    /// 当前应显示在岛上的插件 id（与前端路由前缀一致，如 `island-toggle`）
    pub fn current_plugin_id(&self) -> String {
        let mut g = self.inner.lock().unwrap();
        Self::prune_expired(&mut g);
        let now = Instant::now();
        g.defaults
            .iter()
            .map(|(id, &def)| {
                let bonus = g
                    .boosts
                    .get(id)
                    .filter(|(_, u)| *u > now)
                    .map(|(b, _)| *b)
                    .unwrap_or(0);
                (id.clone(), def + bonus)
            })
            .max_by(|a, b| a.1.cmp(&b.1).then_with(|| a.0.cmp(&b.0)))
            .map(|(id, _)| id)
            .unwrap_or_else(|| "island-toggle".into())
    }

    /// 在 `duration_ms` 内为某插件增加 `bonus` 有效优先级；到期后自动恢复并再次广播。
    pub fn boost(&self, plugin_id: &str, bonus: i32, duration_ms: u64) {
        let until = Instant::now() + Duration::from_millis(duration_ms);
        {
            let mut g = self.inner.lock().unwrap();
            g.boosts.insert(plugin_id.to_string(), (bonus, until));
        }
        self.emit_current();
        let app = self.app.clone();
        let pid = plugin_id.to_string();
        let expected_until = until;
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(duration_ms)).await;
            let Some(fg) = app.try_state::<ForegroundState>() else {
                return;
            };
            {
                let mut g = fg.inner.lock().unwrap();
                if let Some((_, u)) = g.boosts.get(&pid) {
                    if *u == expected_until {
                        g.boosts.remove(&pid);
                    }
                }
            }
            fg.emit_current();
        });
    }

    pub fn emit_current(&self) {
        let id = self.current_plugin_id();
        let payload = ForegroundPayload { plugin_id: id };
        let _ = self.app.emit("island:foreground-plugin", &payload);
    }
}

#[derive(Clone, Serialize)]
struct ForegroundPayload {
    plugin_id: String,
}

/// 在 `setup` 里于其他插件之前调用：`manage` + 初始广播
pub fn init(app: &App) -> tauri::Result<()> {
    let state = ForegroundState::new(app.handle().clone());
    app.manage(state);
    if let Some(fg) = app.try_state::<ForegroundState>() {
        fg.emit_current();
    }
    Ok(())
}

#[tauri::command]
pub fn plugin_foreground_current(state: State<'_, ForegroundState>) -> String {
    state.current_plugin_id()
}

#[tauri::command]
pub fn plugin_foreground_boost(
    plugin_id: String,
    bonus: i32,
    duration_ms: u64,
    state: State<'_, ForegroundState>,
) -> Result<(), String> {
    if plugin_id.is_empty() {
        return Err("plugin_id 不能为空".into());
    }
    if duration_ms == 0 {
        return Err("duration_ms 必须大于 0".into());
    }
    state.boost(&plugin_id, bonus, duration_ms);
    Ok(())
}
