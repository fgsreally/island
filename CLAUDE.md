# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tauri-based "Island" (Dynamic Island) desktop application that displays a floating pill/drawer handle at the top-center of the screen, similar to macOS Dynamic Island or Apple Intelligence Island. Tasks can be shown as status (idle/running/success/error) and the panel expands on hover or message events.

Platform priority: Windows first, macOS secondary, Linux TBD.

## Development Commands

```bash
npm run dev      # Start Vite dev server (hot reload)
npm run build    # Build for production (tsc + vite build)
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

Note: Tauri CLI commands (`tauri dev`, `tauri build`) will be added once Tauri is initialized in the project.

## Architecture

### Directory Structure (Planned)

```
src/                    # React UI shell
  components/           # IslandHandle, IslandPanel, Settings components
  styles/               # Design tokens + theme directory
    themes/
      mac/              # macOS-style theme (tokens.css, base.css, island.css, settings.css)
      win/              # Windows-style theme (future)
  features/
    settings/            # Settings page (theme switch + plugin config)
src-tauri/              # Rust host layer (window control, plugin dispatch, IPC)
plugins/                # Plugin directory (loaded at startup from enabled.json)
  core/                 # Plugin interfaces and common types
  favorite-selection/   # First plugin (collect selected text via Ctrl+Q)
docs/                   # Plugin protocol and external invocation docs
```

### Plugin System

Each plugin follows this convention:
- `plugin.manifest.json` — id, name, version, entry, capabilities
- `plugin.settings.schema.json` — configurable options (hotkeys, toggles)
- `index.ts` — frontend entry; optional `native/` folder for Rust-side logic
- `styles.css` — isolated plugin styles

Lifecycle: `setup()` → `start()` → `stop()` → `dispose()`. Plugins communicate via `onMessage(message)` and emit `TaskStatusPayload` (idle | running | success | error + text + optional progress).

### State & Events

Frontend state management + Tauri event/command bridge. Status changes flow through a central StatusBus to the Island UI.

### Theme System

Styles are organized by theme folders. Components use only CSS class names (no inline styles). Theme switching is managed by a ThemeManager that loads the appropriate theme CSS at startup. All visual tokens are CSS variables defined in theme files — never hardcode colors/spacing in components.

### External Communication (MVP)

Local HTTP POST endpoint at `127.0.0.1/api/island/push` receives external messages, mapped to plugin `onMessage()` calls.

## Current Status

The project is freshly initialized with Vite + React + TypeScript. Tauri has not yet been added. The first milestone (M1) is to add Tauri and display a working Island window. See `plan.md` for full milestones: M1 (Island window) → M2 (expand/collapse) → M3 (plugin system) → M4 (themes + polish).
