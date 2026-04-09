Tauri 灵动岛项目开发计划（Win 优先）

目标与范围





先完成可运行的 MVP：顶部中间悬浮把手态 + 展开态、任务状态显示、消息触发展开。



平台优先级：Windows 首发可用，macOS 做兼容适配，Linux 暂不承诺。



插件策略（第一期）：不做动态安装/热插拔，采用项目内插件目录规范，启动时按配置加载。



样式策略：每种视觉风格独立一个文件夹，组件不写内联样式；支持用户在设置中切换主题，默认偏 mac 风格。

技术选型（已确认）





桌面框架：Tauri（Rust + WebView）



前端：React + TypeScript + Vite



状态与事件：前端状态库 + Tauri event/command（按最小可用实现）



样式：styles/themes/<themeName>/ + 组件级 *.css + 主题管理器

目录与模块规划（初始化后）





d:/my-project/island/src-tauri：Rust 宿主层（窗口控制、插件调度、桥接 API）



d:/my-project/island/src：React UI 壳层



d:/my-project/island/src/styles：设计令牌、基础样式与主题目录



d:/my-project/island/src/components：IslandHandle、IslandPanel 等组件



d:/my-project/island/plugins：内置插件目录（统一范式）



d:/my-project/island/plugins/core：插件接口与公共类型



d:/my-project/island/plugins/favorite-selection：首个插件（收藏选中内容）



d:/my-project/island/docs：插件规范与外部调用协议文档



d:/my-project/island/src/features/settings：设置页（主题切换 + 各插件配置）

插件范式约定（第一期）





每个插件一个目录，至少包含：





plugin.manifest.json：元信息（id、name、version、entry、capabilities）



plugin.settings.schema.json：该插件可配置项定义（如快捷键、开关、超时）



index.ts（前端插件入口）和/或 native/（Rust 侧实现）



styles.css（插件独立样式）



每个插件必须声明 defaultSettings，并通过统一设置中心读写配置（第一期落本地配置文件）。



生命周期接口（统一约定）：





setup(context)：初始化



start()：开始订阅/轮询



stop()：释放资源



onMessage(message)：接收外部或宿主消息



dispose()：卸载（第一期可选）



数据契约（宿主统一渲染）：





TaskStatusPayload：idle | running | success | error + 文案 + 可选进度



IslandAction：点击/悬停动作回调



加载策略：读取 plugins/enabled.json，按顺序注册；失败插件不阻断主程序，仅记录日志。



插件启用策略：设置页支持开关插件启停，以及修改插件自定义配置（如快捷键 Ctrl+Q）。

首个插件（favorite-selection）





目标：验证“全局快捷键 -> 获取选中内容 -> 状态流转 -> UI 展示 -> 外部调用”的完整链路。



功能：





注册快捷键 Ctrl+Q，触发“收藏当前选中内容”动作。



初期“解析”用定时器模拟：解析中 -> 解析完成。



收藏结果写入本地存储（MVP 可用 JSON 文件或本地数据库二选一）。



支持宿主和外部应用发消息触发收藏动作（无快捷键场景）。



验证点：





解析中/解析完成 状态刷新是否实时



快捷键是否可在设置页修改并即时生效



展开动画与交互是否流畅



插件异常是否被隔离处理

UI 与样式隔离方案





主题目录结构：





styles/themes/mac/：tokens.css、base.css、island.css、settings.css



styles/themes/win/（预留）：同结构



styles/themes/<custom>/（后续用户自定义）



组件样式单文件：ComponentName.css，组件内只使用类名，不写行内样式。



主题切换机制：设置页保存 themeId，启动时加载对应主题目录入口 CSS。



约束：禁止把主题变量写入组件文件，组件仅消费 CSS 变量。

平台实施顺序





第 1 阶段（Windows）：





固定顶部居中窗口定位



悬浮置顶与展开收起动画



自动启动与最小化到托盘（按需）



第 2 阶段（macOS）：





对齐状态栏/刘海区域的视觉与位置策略



窗口层级与焦点行为微调



平台差异通过 Rust platform 模块封装，避免散落在业务代码。

外部调用（第一期最小能力）





提供统一入口（先实现一个）：





推荐：本地 HTTP（127.0.0.1）POST /api/island/push



请求体统一映射为 onMessage(message)，由宿主转发到目标插件。



文档除协议外，必须包含“外部应用触发收藏插件”示例：





示例 1：外部应用传入 selectedText，直接触发收藏并进入 解析中 状态



示例 2：外部应用查询任务状态并收到 解析完成



文档落地在：





d:/my-project/island/docs/plugin-protocol.md



d:/my-project/island/docs/external-invoke-example.md

里程碑与验收





M1：项目可启动，显示把手态窗口。



M2：展开态与 hover/消息触发完成。



M3：插件系统（项目内加载）与 favorite-selection 跑通（含快捷键与设置）。



M4：主题目录切换能力 + Windows 可用性打磨 + macOS 基础兼容。

flowchart LR
externalApp[ExternalApp] -->|pushMessage| hostApi[HostApiLocalHttp]
hostApi --> pluginManager[PluginManager]
pluginManager --> favoritePlugin[FavoriteSelectionPlugin]
favoritePlugin --> statusBus[StatusBus]
statusBus --> islandUi[IslandUIReact]
settingsUi[SettingsUI] -->|updateHotkeyAndTheme| pluginManager
settingsUi --> themeManager[ThemeManager]
themeManager --> islandUi
islandUi -->|hoverOrClick| pluginManager

实施顺序（执行时）





初始化 Tauri + React + TypeScript 工程与基础脚本。



建立主题目录（每种风格一个文件夹）与主题切换机制，先完成 mac 风格初版。



完成 IslandHandle / IslandPanel 组件与窗口展开逻辑。



实现插件核心接口、加载器、enabled.json 与插件设置 schema 支持。



实现 favorite-selection 插件（Ctrl+Q 收藏选中内容）并接入状态总线。



增加本地 HTTP 推送入口，并补充外部应用触发收藏/查询状态示例文档。



Windows 自测与 macOS 兼容性清单验证。

