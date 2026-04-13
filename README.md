# Island

基于 **Tauri 2 + Vue 3 + Vite** 的桌面「灵动岛」式浮层：在屏幕上方展示可展开的状态条，通过 **插件** 扩展不同任务与交互。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3（`<script setup>`）、Vue Router、`unplugin-vue-router`（文件路由） |
| 桌面 | Tauri 2（窗口、托盘、全局快捷键、可选 Rust 插件逻辑） |
| 样式 | 主题 CSS 变量（`src/styles/themes/mac/`） |

---

## 目录约定

```
src/
├── app/                    # 岛壳级应用状态（如 islandApp）
├── components/             # 全局 UI：IslandContent、IslandSettingsModal 等
├── plugins/                # 【插件根目录】每个子目录 = 一个插件
│   ├── index.vue           # 应用入口路由（默认重定向到某插件）
│   ├── island-toggle/      # 示例插件
│   │   ├── config.ts       # 插件元数据 + 默认配置（供设置页与 glob 发现）
│   │   ├── composables/
│   │   ├── components/
│   │   └── pages/          # 该插件页面；URL 中不含 `pages` 段（见 vite 配置）
│   └── favorite-selection/
├── state/                  # 跨插件可共享的轻量状态（按需）
├── styles/themes/mac/      # 设计令牌与岛壳/设置弹窗样式
├── utils/
│   ├── island-route.ts     # 路由 query（如 expanded）
│   └── island-settings.ts  # 托盘「设置」持久化：岛尺寸 + 各插件 JSON
├── router/                 # meta 类型扩展等
└── main.ts / App.vue

src-tauri/                  # Rust：窗口、托盘、HTTP、按插件拆分的命令与后台逻辑
```

**不要**再使用已移除的 `src/config/`：与设置相关的聚合逻辑放在 **`src/utils/island-settings.ts`**，UI 在 **`IslandSettingsModal.vue`**。

---

## 插件开发规范

1. **一个插件一个目录**：`src/plugins/<plugin-id>/`，`plugin-id` 与路由前缀一致（如 `island-toggle` → `/island-toggle/...`）。
2. **路由文件**放在 **`pages/`** 下；`vite.config.ts` 里已配置去掉 URL 中的 `/pages/`。
3. **`config.ts`** 必须导出 **`pluginSettings`**，供 `utils/island-settings.ts` 的 `import.meta.glob('../plugins/*/config.ts')` 发现，从而在托盘设置里出现该插件的配置块。
4. **可复用逻辑**放在 **`composables/`**；仅本插件使用的组件放在 **`components/`**。
5. **岛 UI 容器**：优先使用 **`IslandContent`**（标题槽 + 展开内容），样式用主题 CSS 变量，避免在全局 theme 里写插件特有 class（插件特有样式用各页 `<style scoped>`）。
6. **路由元信息**：需要参与转场方向（`App.vue` 里 `route-slide-forward/back`）时，在页面中调用 **`definePage`**，并设置 **`meta.index`**（数字越小越靠「左」）：

   ```ts
   import { definePage } from 'unplugin-vue-router/runtime'

   definePage({
     meta: { index: 0 },
   })
   ```

   若编辑器仍报「找不到名称 definePage」，请确认 **`src/vite-env.d.ts`** 含 `/// <reference types="unplugin-vue-router/client" />`；上述**显式 import** 也可消除告警。

7. **Rust 侧**：与系统能力相关的命令（快捷键、文件、SQLite 等）放在 `src-tauri/src/plugins/<name>/`，在 `lib.rs` 里注册。

---

## 新建插件（检查清单）

1. 新建 `src/plugins/<plugin-id>/`，并添加 `pages/`（至少一个入口页，例如 `pages/index.vue`）。
2. 编写 **`config.ts`**，导出 `pluginSettings: { id, title, schema, defaults }`。
3. 在 **`src/plugins/index.vue`**（或产品策略规定的默认入口）里把默认重定向改到新插件路由，或保留多插件由用户/后续「前台插件」逻辑切换（见下节）。
4. 若需要托盘里的 JSON 配置，无需改 `island-settings.ts`：只要 `config.ts` 存在，保存时会自动出现新块。
5. Tauri：如需新命令，在 `src-tauri` 增加模块并 `register`；前端用 `@tauri-apps/api/core` 的 `invoke` 调用。
6. 运行 `pnpm run typecheck` 与 `pnpm run build` 确认无类型与构建错误。

---

## 前台插件与优先级（设计说明 · 当前与规划）

### 现状（简化描述）

- 所有插件代码都会随前端包加载；**真正「显示在岛上」的是当前 Vue Router 对应的路由**。
- 各插件可通过 **`router.push('/<plugin-id>/...')`** 自行切换展示（例如收藏流程里跳到 `/favorite-selection`）。
- 尚无统一的「全局前台插件 ID」状态机；**多插件同时抢岛**时，依赖各插件自行协商，容易乱。

### 目标行为（与你描述一致）

- **后台**：多个插件可长期监听快捷键、托盘、HTTP 等（Rust / 前端事件）。
- **前台**：**同一时刻只有一个插件**占据岛的 UI（路由可视区域）。
- **临时优先**：例如「收藏」触发时，应在约 2 秒内把前台切到 **favorite-selection**，结束后再**恢复**之前的插件或默认插件。

### 建议：在 Rust 维护「前台插件」与「临时优先级」

在宿主进程集中管理更稳妥，原因包括：

1. **快捷键与系统事件**多在 Rust 注册，由 Rust 决定「接下来谁该出现在岛上」可避免前端未启动或未聚焦时的竞态。
2. 可统一数据结构，例如：`active_plugin_id`、`default_plugin_id`、`boost: Option<{ plugin_id, until_epoch_ms }>`。
3. 前端通过 **一次 Tauri 事件**（如 `island:foreground-changed`）或启动时 **invoke 拉取状态**，再 **`router.replace` 到对应前缀路由**，避免每个插件自己抢路由。

**优先级策略（示例）**

| 场景 | 行为 |
|------|------|
| 用户无操作 | `active` = `default_plugin_id`（如 `island-toggle`） |
| 插件 A 请求短时前台（收藏完成 2s 内） | 提升 A 的优先级，`until` 到期后恢复 `default` 或恢复栈顶 |
| 冲突 | 以 **更高优先级或更新截止时间** 覆盖（需唯一排序规则） |

实现时可配合：Rust `tokio::time::sleep` + 到期发事件；前端只负责展示与路由同步。

> **说明**：上述 Rust 状态机可作为下一迭代实现；当前仓库若仍以「各插件 `router.push`」为主，README 保留本段作为架构约定，避免与后续改动冲突。

---

## 常用命令

```bash
pnpm install
pnpm dev              # Vite 开发服务
pnpm run typecheck    # vue-tsc
pnpm run build        # 类型检查 + 生产构建
pnpm tauri dev        # Tauri 开发（需本机已配置 Tauri 环境）
pnpm tauri build      # 打包桌面应用
```

---

## 相关文件

- 路由扫描与 `definePage`：`vite.config.ts`、`src/typed-router.d.ts`（自动生成）
- 岛壳展开与路由转场：`src/App.vue`
- 设置持久化：`src/utils/island-settings.ts`
