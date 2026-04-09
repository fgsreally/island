# Island - 灵动岛桌面应用

类似 macOS Dynamic Island / 苹果灵动岛效果，浮现在屏幕顶部中央的任务状态面板。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（需先安装 Rust + MinGW）
npm run tauri dev

# 生产构建
npm run tauri build
```

## 快捷键

- `Ctrl+Q` — 触发收藏选中内容

## HTTP API

```
POST http://127.0.0.1:3001/api/island/push
```

详见 [docs/plugin-protocol.md](docs/plugin-protocol.md)

## 技术栈

- 桌面框架：Tauri 2.x（Rust + WebView）
- 前端：React 19 + TypeScript + Vite
- 样式：CSS Variables + 主题目录
- 插件：项目内目录规范，启动时加载
