# AI Interview Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local desktop AI interview assistant with Tauri + React — web config pages, a semi-transparent overlay window (space-key controlled), and a full-transcript record window.

**Architecture:** Single Tauri v2 app with three windows: main config window (React SPA with HashRouter), semi-transparent overlay window (always-on-top, no decorations), and a record window. Tauri Store plugin for local persistence. Windows communicate via Tauri events.

**Tech Stack:** Tauri v2, React 18 + TypeScript, shadcn/ui + Tailwind CSS 3, Zustand, React Router v6, iFlytek RTASR (WebSocket), DeepSeek Chat API (HTTP)

---

### Task 1: Scaffold Tauri + React + Vite project

**Files:**
- Create: entire project via `npm create tauri-app`

- [ ] **Step 1: Create the project**

```bash
cd C:/Users/29542/Desktop/aifzms
npm create tauri-app@latest . -- --template react-ts
```

Select: React + TypeScript template. When prompted, confirm creating in current directory.

- [ ] **Step 2: Install all npm dependencies**

```bash
cd C:/Users/29542/Desktop/aifzms
pnpm install
pnpm add react-router-dom zustand @tauri-apps/api @tauri-apps/plugin-store
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @types/react @types/react-dom
```

- [ ] **Step 3: Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Configure tailwind.config.js**

Read the generated `tailwind.config.js`, then Edit to:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./overlay.html",
    "./record.html",
    "./overlay-src/**/*.{js,ts,jsx,tsx}",
    "./record-src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Add Tailwind directives to src/index.css**

Write `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #ffffff;
  color: #1e293b;
}
```

- [ ] **Step 6: Verify project runs**

```bash
pnpm tauri dev
```

Expected: Tauri window opens showing the default React + Vite page.

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Tauri + React + TypeScript + Tailwind project"
```

---

### Task 2: Set up shadcn/ui

**Files:**
- Create: `src/lib/utils.ts`
- Modify: `tsconfig.json`, `vite.config.ts`, `components.json`

- [ ] **Step 1: Create components.json for shadcn/ui**

Write `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": false
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

- [ ] **Step 2: Create utils file**

Write `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install needed deps:

```bash
pnpm add clsx tailwind-merge
pnpm add -D @types/node
```

- [ ] **Step 3: Update tsconfig.json for path aliases**

Read and edit `tsconfig.json` to add path aliases in compilerOptions:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: Update vite.config.ts**

Read `vite.config.ts`, then Edit to add path resolve:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
```

- [ ] **Step 5: Add shadcn Button, Input, Select, Card, Tabs, Label components**

```bash
npx shadcn@latest add button input select card tabs label form
```

- [ ] **Step 6: Verify build works**

```bash
pnpm tauri build --debug
```

Expected: Build succeeds with shadcn components.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: set up shadcn/ui with Tailwind and path aliases"
```

---

### Task 3: Set up routing and multi-entry Vite config

**Files:**
- Create: `overlay.html`, `record.html`, `src/pages/`, `overlay-src/`, `record-src/`
- Modify: `vite.config.ts`

- [ ] **Step 1: Update vite.config.ts for multi-page**

Read and Edit `vite.config.ts` to add multi-page build inputs:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        overlay: path.resolve(__dirname, "overlay.html"),
        record: path.resolve(__dirname, "record.html"),
      },
    },
  },
});
```

- [ ] **Step 2: Create overlay.html entry point**

Write `overlay.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>面试辅助</title>
    <style>
      html, body { margin: 0; padding: 0; background: transparent !important; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/overlay-src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create record.html entry point**

Write `record.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>面试记录</title>
  </head>
  <body style="margin:0;padding:0;background:#111827;">
    <div id="root"></div>
    <script type="module" src="/record-src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create main App with React Router**

Write `src/App.tsx`:

```typescript
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Records from "@/pages/Records";
import Help from "@/pages/Help";

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/records" element={<Records />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
```

- [ ] **Step 5: Update main.tsx**

Edit `src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create placeholder page files**

Write `src/pages/Home.tsx`:

```typescript
export default function Home() {
  return <div className="p-8"><h1 className="text-2xl font-bold">新建面试</h1></div>;
}
```

Write `src/pages/Settings.tsx`:

```typescript
export default function Settings() {
  return <div className="p-8"><h1 className="text-2xl font-bold">系统设置</h1></div>;
}
```

Write `src/pages/Records.tsx`:

```typescript
export default function Records() {
  return <div className="p-8"><h1 className="text-2xl font-bold">面试记录</h1></div>;
}
```

Write `src/pages/Help.tsx`:

```typescript
export default function Help() {
  return <div className="p-8"><h1 className="text-2xl font-bold">帮助</h1></div>;
}
```

- [ ] **Step 7: Create overlay and record entry points**

```bash
mkdir -p src/overlay-src src/record-src
```

Write `overlay-src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import OverlayApp from "./OverlayApp";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <OverlayApp />
  </React.StrictMode>
);
```

Write `overlay-src/OverlayApp.tsx`:

```typescript
export default function OverlayApp() {
  return (
    <div className="h-screen w-screen bg-black/70 text-white flex items-center justify-center">
      <p className="text-lg">面试辅助窗口就绪</p>
    </div>
  );
}
```

Write `record-src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import RecordApp from "./RecordApp";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecordApp />
  </React.StrictMode>
);
```

Write `record-src/RecordApp.tsx`:

```typescript
export default function RecordApp() {
  return (
    <div className="h-screen bg-gray-900 text-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">面试全程记录</h2>
      <p className="text-gray-500">等待面试开始...</p>
    </div>
  );
}
```

- [ ] **Step 8: Verify dev build with multi-page**

```bash
pnpm tauri dev
```

Expected: Main window shows the React app with routing. (Overlay and record windows are not yet launched — tested in later tasks.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: set up multi-page routing and overlay/record entry points"
```

---

### Task 4: Configure Tauri for multi-window and plugins

**Files:**
- Modify: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-tauri/src/main.rs`
- Create: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Read existing Tauri config files**

```
src-tauri/tauri.conf.json
src-tauri/Cargo.toml
src-tauri/src/lib.rs
src-tauri/src/main.rs
```

- [ ] **Step 2: Update Cargo.toml for dependencies**

Add to `src-tauri/Cargo.toml` under `[dependencies]`:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-store = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 3: Update tauri.conf.json**

Edit `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/nicedoc/open-docs/master/schemas/tauri/tauri.conf.schema.json",
  "productName": "AI面试助手",
  "version": "0.1.0",
  "identifier": "com.aifzms.interview-assistant",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "AI面试助手 - 配置",
        "width": 900,
        "height": 680,
        "resizable": true,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "plugins": {
    "store": {}
  }
}
```

- [ ] **Step 4: Update lib.rs to register plugins**

Write `src-tauri/src/lib.rs`:

```rust
use tauri::Manager;

mod commands;
mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Store the main window handle for later use
            let main_window = app.get_webview_window("main").unwrap();
            main_window.set_title("AI面试助手 - 配置").ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_config,
            commands::load_config,
            commands::save_record,
            commands::load_records,
            commands::start_interview_windows,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: Write main.rs**

Write `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    aifzms_lib::run()
}
```

Note: Tauri v2 uses `LIB_NAME_lib::run()` pattern. The lib name derives from the package name in Cargo.toml. If the package name is `aifzms`, then it's `aifzms_lib`. If the package name is `app`, it's `app_lib`. Check Cargo.toml `[package].name` and adjust accordingly.

- [ ] **Step 6: Create placeholder commands.rs**

Write `src-tauri/src/commands.rs`:

```rust
use tauri::{AppHandle, WebviewWindowBuilder, WebviewUrl};
use crate::store;

#[tauri::command]
pub async fn save_config(config_json: String) -> Result<String, String> {
    store::save_config(&config_json).map_err(|e| e.to_string())?;
    Ok("ok".to_string())
}

#[tauri::command]
pub async fn load_config() -> Result<String, String> {
    store::load_config().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_record(record_json: String) -> Result<String, String> {
    store::save_record(&record_json).map_err(|e| e.to_string())?;
    Ok("ok".to_string())
}

#[tauri::command]
pub async fn load_records() -> Result<String, String> {
    store::load_records().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_interview_windows(app: AppHandle) -> Result<String, String> {
    // Create overlay window (semi-transparent, always on top)
    let overlay = WebviewWindowBuilder::new(&app, "overlay", WebviewUrl::App("overlay.html".into()))
        .title("面试辅助")
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .resizable(true)
        .inner_size(420.0, 320.0)
        .min_inner_size(300.0, 200.0)
        .build()
        .map_err(|e| e.to_string())?;

    // Position overlay on the right side of screen
    if let Ok(Some(monitor)) = overlay.current_monitor() {
        let monitor_size = monitor.size();
        let window_size = overlay.outer_size().unwrap();
        let x = (monitor_size.width as i32 - window_size.width as i32) - 20;
        let y = 60i32;
        overlay.set_position(tauri::PhysicalPosition::new(x, y)).ok();
    }

    // Create record window
    let record = WebviewWindowBuilder::new(&app, "record", WebviewUrl::App("record.html".into()))
        .title("面试记录")
        .transparent(false)
        .decorations(true)
        .always_on_top(false)
        .resizable(true)
        .inner_size(420.0, 580.0)
        .min_inner_size(300.0, 300.0)
        .build()
        .map_err(|e| e.to_string())?;

    // Position record window next to overlay
    if let Ok(Some(monitor)) = record.current_monitor() {
        let monitor_size = monitor.size();
        let window_size = record.outer_size().unwrap();
        let x = (monitor_size.width as i32 - window_size.width as i32) - 20;
        let y = 400i32;
        record.set_position(tauri::PhysicalPosition::new(x, y)).ok();
    }

    Ok("ok".to_string())
}
```

- [ ] **Step 7: Create placeholder store.rs**

Write `src-tauri/src/store.rs`:

```rust
use std::fs;
use std::path::PathBuf;

fn config_path() -> PathBuf {
    let mut path = dirs_next().unwrap_or_else(|| PathBuf::from("."));
    path.push("aifzms_config.json");
    path
}

fn records_path() -> PathBuf {
    let mut path = dirs_next().unwrap_or_else(|| PathBuf::from("."));
    path.push("aifzms_records.json");
    path
}

fn dirs_next() -> Option<PathBuf> {
    // Use Tauri's app data dir or fallback to current directory
    std::env::current_dir().ok()
}

pub fn save_config(json: &str) -> Result<(), Box<dyn std::error::Error>> {
    fs::write(config_path(), json)?;
    Ok(())
}

pub fn load_config() -> Result<String, Box<dyn std::error::Error>> {
    let path = config_path();
    if path.exists() {
        Ok(fs::read_to_string(path)?)
    } else {
        Ok("{}".to_string())
    }
}

pub fn save_record(json: &str) -> Result<(), Box<dyn std::error::Error>> {
    fs::write(records_path(), json)?;
    Ok(())
}

pub fn load_records() -> Result<String, Box<dyn std::error::Error>> {
    let path = records_path();
    if path.exists() {
        Ok(fs::read_to_string(path)?)
    } else {
        Ok("{\"records\":[]}".to_string())
    }
}
```

- [ ] **Step 8: Create capabilities/default.json**

```bash
mkdir -p src-tauri/capabilities
```

Write `src-tauri/capabilities/default.json`:

```json
{
  "identifier": "default",
  "description": "Default capability for the main window",
  "windows": ["main", "overlay", "record"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "store:default",
    "core:window:allow-create",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-close",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-decorations",
    "core:event:default",
    "core:event:allow-emit",
    "core:event:allow-listen"
  ]
}
```

- [ ] **Step 9: Verify Tauri compiles**

```bash
cd src-tauri && cargo check
```

Expected: No compilation errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: configure Tauri multi-window, store plugin, and Rust commands"
```

---

### Task 5: Create Layout and Sidebar components

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/Sidebar.tsx`

- [ ] **Step 1: Write Sidebar component**

Write `src/components/Sidebar.tsx`:

```typescript
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/settings", label: "系统设置", icon: "⚙️" },
  { to: "/records", label: "面试记录", icon: "📋" },
  { to: "/help", label: "帮助", icon: "❓" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-6 py-6">
        <h1 className="text-lg font-bold text-primary">AI 面试助手</h1>
        <p className="text-xs text-gray-400 mt-1">本地桌面版</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary-50 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="text-xs text-gray-400">面试管理</div>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-2 py-2 mt-1 rounded-lg text-sm transition-colors",
              isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"
            )
          }
        >
          📝 新的面试
        </NavLink>
        <NavLink
          to="/records"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors",
              isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"
            )
          }
        >
          📋 面试记录
        </NavLink>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Write Layout component**

Write `src/components/Layout.tsx`:

```typescript
import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify layout renders**

```bash
pnpm tauri dev
```

Expected: Main window shows sidebar with navigation links and the Home page content area.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add sidebar navigation layout"
```

---

### Task 6: Build Home page (new interview config)

**Files:**
- Write: `src/pages/Home.tsx`

- [ ] **Step 1: Write the full Home page**

Write `src/pages/Home.tsx`:

```typescript
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const regions = [
  { value: "zh-cn", label: "简体中文" },
  { value: "en-us", label: "English (US)" },
];

const positions = [
  { value: "frontend", label: "前端" },
  { value: "backend", label: "后端" },
  { value: "fullstack", label: "全栈" },
  { value: "devops", label: "DevOps" },
  { value: "data", label: "数据工程师" },
  { value: "mobile", label: "移动端" },
  { value: "ai", label: "AI/ML" },
];

const languages = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
];

export default function Home() {
  const [region, setRegion] = useState("zh-cn");
  const [position, setPosition] = useState("frontend");
  const [language, setLanguage] = useState("typescript");
  const [useCustomQa, setUseCustomQa] = useState("no");
  const [hasResume, setHasResume] = useState(false);

  const handleStartInterview = async () => {
    try {
      await invoke("start_interview_windows");
    } catch (err) {
      console.error("Failed to start interview windows:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新的面试</h1>
        <p className="text-sm text-gray-500 mt-1">配置面试参数，然后点击"前往面试"开始</p>
      </div>

      {/* Module 1: Basic Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">请选择面试地区和岗位</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="region">地区 <span className="text-red-400">*</span></Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">岗位 <span className="text-red-400">*</span></Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          没有想要的岗位？<a href="#" className="text-primary underline">联系小助手一键添加</a>
        </p>
      </Card>

      {/* Module 2: Tech Customization */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">技术定制</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="language">
              编程语言 <span className="text-xs text-gray-400">（仅针对笔试功能）</span>
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customQa">是否使用自定义问答库</Label>
            <Select value={useCustomQa} onValueChange={setUseCustomQa}>
              <SelectTrigger id="customQa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">否</SelectItem>
                <SelectItem value="yes">是</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {useCustomQa === "no" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-500">当前问答库为空</span>
            <Button variant="outline" size="sm" className="text-primary border-primary">
              创建问答库
            </Button>
          </div>
        )}
      </Card>

      {/* Module 3: Resume hint + Submit */}
      <div className="space-y-4">
        {!hasResume && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
            你并未上传简历，AI将无法基于简历回答，
            <a href="#" className="underline font-medium">去上传</a>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-600 text-white px-12 py-6 text-base rounded-xl"
            onClick={handleStartInterview}
          >
            前往面试
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders with Tauri**

```bash
pnpm tauri dev
```

Expected: Home page renders with all three modules, selects work, "前往面试" button is present.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: build Home page with interview config form"
```

---

### Task 7: Build Settings page (iFlytek + DeepSeek tabs)

**Files:**
- Write: `src/pages/Settings.tsx`
- Modify: `src/lib/commands.ts` (create if needed)

- [ ] **Step 1: Create Tauri command wrappers**

Write `src/lib/commands.ts`:

```typescript
import { invoke } from "@tauri-apps/api/core";

export interface IflytekConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface InterviewConfig {
  region: string;
  position: string;
  language: string;
  customQaEnabled: boolean;
}

export interface AppConfig {
  iflytek: IflytekConfig;
  deepseek: DeepSeekConfig;
  interview: InterviewConfig;
}

export async function saveConfig(config: AppConfig): Promise<string> {
  return invoke("save_config", { configJson: JSON.stringify(config) });
}

export async function loadConfig(): Promise<string> {
  return invoke("load_config");
}

export async function saveRecord(recordJson: string): Promise<string> {
  return invoke("save_record", { recordJson });
}

export async function loadRecords(): Promise<string> {
  return invoke("load_records");
}

export async function startInterviewWindows(): Promise<string> {
  return invoke("start_interview_windows");
}
```

- [ ] **Step 2: Write Settings page**

Write `src/pages/Settings.tsx`:

```typescript
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveConfig, loadConfig, type AppConfig } from "@/lib/commands";

const defaultConfig: AppConfig = {
  iflytek: { appId: "ccd6f814", apiKey: "", apiSecret: "" },
  deepseek: {
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    maxTokens: 2000,
    temperature: 0.7,
  },
  interview: { region: "zh-cn", position: "frontend", language: "typescript", customQaEnabled: false },
};

export default function Settings() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [showKey, setShowKey] = useState(false);
  const [showDsKey, setShowDsKey] = useState(false);
  const [iflytekStatus, setIflytekStatus] = useState("");
  const [saveTime, setSaveTime] = useState("");

  useEffect(() => {
    loadConfig()
      .then((json) => {
        if (json && json !== "{}") {
          const parsed = JSON.parse(json);
          setConfig({ ...defaultConfig, ...parsed });
          if (parsed.iflytek?.apiKey) {
            setIflytekStatus("✅ 已配置");
            checkSaveTime();
          }
        }
      })
      .catch(() => {});
  }, []);

  const checkSaveTime = () => {
    const now = new Date();
    setSaveTime(
      `最后更新：${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    );
  };

  const handleSaveIflytek = async () => {
    try {
      await saveConfig(config);
      setIflytekStatus("✅ 已配置");
      checkSaveTime();
    } catch (err) {
      setIflytekStatus("❌ 保存失败");
      console.error(err);
    }
  };

  const handleClearIflytek = () => {
    setConfig({
      ...config,
      iflytek: { appId: "", apiKey: "", apiSecret: "" },
    });
    setIflytekStatus("");
    setSaveTime("");
  };

  const handleSaveDeepseek = async () => {
    try {
      await saveConfig(config);
      setIflytekStatus("✅ 已配置");
      checkSaveTime();
    } catch (err) {
      setIflytekStatus("❌ 保存失败");
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">应用设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置API密钥和相关参数</p>
      </div>

      <Tabs defaultValue="iflytek" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="iflytek">科大讯飞语音</TabsTrigger>
          <TabsTrigger value="deepseek">DeepSeek AI</TabsTrigger>
        </TabsList>

        {/* iFlytek Tab */}
        <TabsContent value="iflytek">
          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="appId">应用 ID <span className="text-red-400">*</span></Label>
              <Input
                id="appId"
                value={config.iflytek.appId}
                onChange={(e) =>
                  setConfig({ ...config, iflytek: { ...config.iflytek, appId: e.target.value } })
                }
                placeholder="输入科大讯飞应用ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API 密钥 <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={config.iflytek.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, iflytek: { ...config.iflytek, apiKey: e.target.value } })
                  }
                  placeholder="输入API密钥"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showKey ? "text" : "password"}
                  value={config.iflytek.apiSecret}
                  onChange={(e) =>
                    setConfig({ ...config, iflytek: { ...config.iflytek, apiSecret: e.target.value } })
                  }
                  placeholder="输入API Secret"
                  className="pr-10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveIflytek} className="bg-primary hover:bg-primary-600">
                保存配置
              </Button>
              <Button variant="outline" onClick={handleClearIflytek}>
                清除配置
              </Button>
            </div>

            {iflytekStatus && (
              <div className="text-sm space-y-1">
                <p className={iflytekStatus.includes("✅") ? "text-green-600" : "text-red-500"}>
                  配置状态：{iflytekStatus}
                </p>
                {saveTime && <p className="text-gray-400">{saveTime}</p>}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* DeepSeek Tab */}
        <TabsContent value="deepseek">
          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dsApiKey">API 密钥 <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="dsApiKey"
                  type={showDsKey ? "text" : "password"}
                  value={config.deepseek.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, deepseek: { ...config.deepseek, apiKey: e.target.value } })
                  }
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  onClick={() => setShowDsKey(!showDsKey)}
                >
                  {showDsKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">API 基础 URL <span className="text-red-400">*</span></Label>
              <Input
                id="baseUrl"
                value={config.deepseek.baseUrl}
                onChange={(e) =>
                  setConfig({ ...config, deepseek: { ...config.deepseek, baseUrl: e.target.value } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型名称 <span className="text-red-400">*</span></Label>
              <Input
                id="model"
                value={config.deepseek.model}
                onChange={(e) =>
                  setConfig({ ...config, deepseek: { ...config.deepseek, model: e.target.value } })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxTokens">最大 Token 数 <span className="text-red-400">*</span></Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={config.deepseek.maxTokens}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      deepseek: { ...config.deepseek, maxTokens: parseInt(e.target.value) || 2000 },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">温度 (Temperature) <span className="text-red-400">*</span></Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={config.deepseek.temperature}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      deepseek: { ...config.deepseek, temperature: parseFloat(e.target.value) || 0.7 },
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveDeepseek} className="bg-primary hover:bg-primary-600">
                保存配置
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Verify settings page**

```bash
pnpm tauri dev
```

Navigate to Settings. Verify tabs switch, inputs work, save/clear buttons respond.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: build Settings page with iFlytek and DeepSeek config tabs"
```

---

### Task 8: Build Records and Help pages

**Files:**
- Write: `src/pages/Records.tsx`, `src/pages/Help.tsx`

- [ ] **Step 1: Write Records page**

Write `src/pages/Records.tsx`:

```typescript
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { loadRecords } from "@/lib/commands";

interface QaItem {
  question: string;
  answer: string;
  timestamp: string;
}

interface Record {
  id: string;
  date: string;
  position: string;
  qaList: QaItem[];
}

export default function Records() {
  const [records, setRecords] = useState<Record[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords()
      .then((json) => {
        if (json) {
          const data = JSON.parse(json);
          setRecords(data.records || []);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">面试记录</h1>
        <p className="text-sm text-gray-500 mt-1">查看历史面试问答记录</p>
      </div>

      {records.length === 0 ? (
        <Card className="p-12 text-center text-gray-400">
          <p className="text-lg mb-2">📭 暂无面试记录</p>
          <p className="text-sm">完成一次面试后，记录将显示在这里</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="p-5">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              >
                <div>
                  <h3 className="font-medium text-gray-800">
                    {record.position} 面试 - {record.date}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {record.qaList.length} 轮问答
                  </p>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedId === record.id ? "▾" : "▸"}
                </span>
              </div>
              {expandedId === record.id && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  {record.qaList.map((qa, i) => (
                    <div key={i} className="pl-4 border-l-2 border-primary-100">
                      <p className="text-sm font-medium text-blue-600">
                        Q{i + 1} · 面试官：{qa.question}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        A{i + 1} · AI回答：{qa.answer}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{qa.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write Help page**

Write `src/pages/Help.tsx`:

```typescript
import { Card } from "@/components/ui/card";

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">帮助</h1>
        <p className="text-sm text-gray-500 mt-1">使用说明与常见问题</p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">🚀 快速开始</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>在「系统设置」中配置科大讯飞和 DeepSeek 的 API 密钥</li>
            <li>在首页选择面试地区和岗位</li>
            <li>点击「前往面试」启动面试辅助窗口</li>
            <li>在面试窗口中按空格键控制录音和回答生成</li>
          </ol>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">⌨️ 快捷键</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">空格</kbd> — 开始录音 / 停止录音并生成回答</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">🪟 面试窗口说明</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>辅助窗口（半透明）</strong>：显示当前一轮问答，空格键控制，始终置顶</p>
            <p><strong>记录窗口</strong>：完整记录所有问答，可滚动查看</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">🔑 API 密钥获取</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>科大讯飞 RTASR：<a href="https://www.xfyun.cn/" className="text-primary underline" target="_blank">讯飞开放平台</a></p>
            <p>DeepSeek：<a href="https://platform.deepseek.com/" className="text-primary underline" target="_blank">DeepSeek 开放平台</a></p>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify pages**

```bash
pnpm tauri dev
```

Navigate to Records and Help via sidebar. Verify content renders.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Records and Help pages"
```

---

### Task 9: Create Zustand interview store and audio capture

**Files:**
- Create: `src/stores/interviewStore.ts`, `src/lib/audioCapture.ts`

- [ ] **Step 1: Write interview store**

Write `src/stores/interviewStore.ts`:

```typescript
import { create } from "zustand";

export type InterviewState = "idle" | "recording" | "generating" | "displaying";

interface QaItem {
  question: string;
  answer: string;
  timestamp: string;
}

interface InterviewStore {
  // Overlay state
  state: InterviewState;
  currentQuestion: string;
  currentAnswer: string;
  partialTranscript: string;

  // Record window state
  qaHistory: QaItem[];

  // Actions
  setState: (state: InterviewState) => void;
  setPartialTranscript: (text: string) => void;
  setCurrentQuestion: (text: string) => void;
  setCurrentAnswer: (text: string) => void;
  addToHistory: (qa: QaItem) => void;
  resetOverlay: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  state: "idle",
  currentQuestion: "",
  currentAnswer: "",
  partialTranscript: "",
  qaHistory: [],

  setState: (state) => set({ state }),
  setPartialTranscript: (text) => set({ partialTranscript: text }),
  setCurrentQuestion: (text) => set({ currentQuestion: text }),
  setCurrentAnswer: (text) => set({ currentAnswer: text }),
  addToHistory: (qa) =>
    set((prev) => ({ qaHistory: [...prev.qaHistory, qa] })),
  resetOverlay: () =>
    set({ currentQuestion: "", currentAnswer: "", partialTranscript: "", state: "idle" }),
}));
```

- [ ] **Step 2: Write audio capture library**

Write `src/lib/audioCapture.ts`:

```typescript
export class AudioCapture {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private onDataCallback: ((buffer: ArrayBuffer) => void) | null = null;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    this.chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        // Convert blob to array buffer for processing
        event.data.arrayBuffer().then((buffer) => {
          this.onDataCallback?.(buffer);
        });
      }
    };

    this.mediaRecorder.start(250); // deliver chunks every 250ms
  }

  onAudioData(callback: (buffer: ArrayBuffer) => void): void {
    this.onDataCallback = callback;
  }

  stop(): void {
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add interview Zustand store and audio capture library"
```

---

### Task 10: Build iFlytek RTASR WebSocket client

**Files:**
- Create: `src/lib/iflytek.ts`

- [ ] **Step 1: Write iFlytek client**

Write `src/lib/iflytek.ts`:

```typescript
// iFlytek Real-time ASR WebSocket client
// API Reference: https://www.xfyun.cn/doc/asr/rtasr/API.html

interface IflytekConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

export class IflytekASR {
  private ws: WebSocket | null = null;
  private config: IflytekConfig;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(config: IflytekConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build WebSocket URL with auth params
      const hostUrl = "wss://rtasr.xfyun.cn/v1/ws";
      const date = new Date().toUTCString();
      const signatureOrigin = `host: rtasr.xfyun.cn\ndate: ${date}\nGET /v1/ws HTTP/1.1`;

      // Build the URL with auth params
      const url = `${hostUrl}?appid=${this.config.appId}&ts=${Date.now()}&signa=&pd=general`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // Send start frame
        const startFrame = {
          common: { app_id: this.config.appId },
          business: {
            language: "zh_cn",
            domain: "iat",
            accent: "mandarin",
            ptt: 0, // punctuation
            rlang: "zh-cn",
            vinfo: 1,
            nunum: 1,
            speex_size: 60,
            wbest: 1,
          },
          data: {
            status: 0,
            format: "audio/L16;rate=16000",
            encoding: "raw",
            audio: "",
          },
        };
        this.ws?.send(JSON.stringify(startFrame));
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.code !== 0) {
            this.onErrorCallback?.(msg.message || "ASR error");
            return;
          }
          if (msg.data?.result) {
            const text = msg.data.result.text || "";
            const isFinal = msg.data.status === 2; // 2 = final result
            this.onResultCallback?.(text, isFinal);
          }
        } catch {
          // Ignore parse errors for binary frames
        }
      };

      this.ws.onerror = () => {
        this.onErrorCallback?.("WebSocket connection error");
        reject(new Error("WebSocket connection failed"));
      };

      this.ws.onclose = () => {
        // Connection closed
      };
    });
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const frame = {
        data: {
          status: 1, // 1 = continuing
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: arrayBufferToBase64(audioData),
        },
      };
      this.ws.send(JSON.stringify(frame));
    }
  }

  sendEnd(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const frame = {
        data: {
          status: 2, // 2 = end
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: "",
        },
      };
      this.ws.send(JSON.stringify(frame));
    }
  }

  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  close(): void {
    this.sendEnd();
    this.ws?.close();
    this.ws = null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: implement iFlytek RTASR WebSocket client"
```

---

### Task 11: Build DeepSeek API client

**Files:**
- Create: `src/lib/deepseek.ts`

- [ ] **Step 1: Write DeepSeek client**

Write `src/lib/deepseek.ts`:

```typescript
// DeepSeek Chat API client
// API Reference: https://platform.deepseek.com/api-docs/

interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class DeepSeekClient {
  private config: DeepSeekConfig;

  constructor(config: DeepSeekConfig) {
    this.config = config;
  }

  async generateAnswer(
    question: string,
    context?: {
      position?: string;
      language?: string;
      resume?: string;
    }
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];

    const url = `${this.config.baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async generateAnswerStream(
    question: string,
    onToken: (token: string) => void,
    context?: {
      position?: string;
      language?: string;
      resume?: string;
    }
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ];

    const url = `${this.config.baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

      for (const line of lines) {
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const token = parsed.choices?.[0]?.delta?.content || "";
          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {
          // Skip parse errors
        }
      }
    }

    return fullText;
  }

  private buildSystemPrompt(
    context?: {
      position?: string;
      language?: string;
      resume?: string;
    }
  ): string {
    let prompt = "你是一位专业的面试助手，帮助应聘者在面试中提供回答建议。";

    if (context?.position) {
      prompt += `面试岗位：${context.position}。`;
    }

    if (context?.language) {
      prompt += `主要编程语言：${context.language}。`;
    }

    prompt += `请遵循以下规则：
1. 回答简洁、专业、有结构（要点式）
2. 结合岗位特点给出针对性回答
3. 使用中文回答（除非面试官使用英文提问）
4. 控制在200-300字以内，便于快速阅读
5. 使用 STAR 法则（情境、任务、行动、结果）组织项目经验类回答`;

    if (context?.resume) {
      prompt += `\n\n应聘者简历信息：${context.resume}`;
    }

    return prompt;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: implement DeepSeek Chat API client with streaming"
```

---

### Task 12: Build Overlay window (space key state machine)

**Files:**
- Write: `overlay-src/OverlayApp.tsx` (rewrite), `overlay-src/index.css`

- [ ] **Step 1: Write overlay CSS**

Write `overlay-src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  background: transparent !important;
  height: 100%;
  width: 100%;
  overflow: hidden;
  user-select: none;
}
```

Import it in `overlay-src/main.tsx` by adding: `import "./index.css";` at the top.

- [ ] **Step 2: Write OverlayApp with state machine**

Write `overlay-src/OverlayApp.tsx`:

```typescript
import { useEffect, useCallback, useRef } from "react";
import { useInterviewStore, InterviewState } from "@/src/stores/interviewStore";
import { AudioCapture } from "@/src/lib/audioCapture";
import { IflytekASR } from "@/src/lib/iflytek";
import { DeepSeekClient } from "@/src/lib/deepseek";

// We access config from localStorage set by main window, or use defaults
function getConfig() {
  try {
    const raw = localStorage.getItem("app_config");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    iflytek: { appId: "", apiKey: "", apiSecret: "" },
    deepseek: {
      apiKey: "sk-placeholder",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      maxTokens: 2000,
      temperature: 0.7,
    },
    interview: { position: "前端", language: "TypeScript" },
  };
}

export default function OverlayApp() {
  const {
    state,
    currentQuestion,
    currentAnswer,
    partialTranscript,
    setState,
    setCurrentQuestion,
    setCurrentAnswer,
    setPartialTranscript,
    addToHistory,
    resetOverlay,
  } = useInterviewStore();

  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const asrRef = useRef<IflytekASR | null>(null);
  const fullTranscriptRef = useRef("");

  const startRecording = useCallback(async () => {
    const config = getConfig();
    const audioCapture = new AudioCapture();
    const asr = new IflytekASR(config.iflytek);

    fullTranscriptRef.current = "";

    asr.onResult((text, isFinal) => {
      if (isFinal) {
        fullTranscriptRef.current += text;
        setPartialTranscript(fullTranscriptRef.current);
      } else {
        setPartialTranscript(fullTranscriptRef.current + text);
      }
    });

    asr.onError((err) => {
      console.error("ASR error:", err);
    });

    try {
      await asr.connect();
      await audioCapture.start();

      audioCapture.onAudioData((buffer) => {
        asr.sendAudio(buffer);
      });

      audioCaptureRef.current = audioCapture;
      asrRef.current = asr;
      setState("recording");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setState("idle");
    }
  }, [setState, setPartialTranscript]);

  const stopRecordingAndGenerate = useCallback(async () => {
    // Stop recording
    audioCaptureRef.current?.stop();
    asrRef.current?.close();

    const question = fullTranscriptRef.current.trim();
    if (!question) {
      setState("idle");
      return;
    }

    setCurrentQuestion(question);
    setState("generating");

    // Generate answer
    const config = getConfig();
    const dsClient = new DeepSeekClient(config.deepseek);

    try {
      let answerText = "";
      await dsClient.generateAnswerStream(
        question,
        (token) => {
          answerText += token;
          setCurrentAnswer(answerText);
        },
        {
          position: config.interview.position,
          language: config.interview.language,
        }
      );

      setCurrentAnswer(answerText);
      setState("displaying");

      // Add to history for record window
      addToHistory({
        question,
        answer: answerText,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to generate answer:", err);
      setCurrentAnswer("生成回答失败，请检查 DeepSeek API 配置");
      setState("displaying");
    }
  }, [setState, setCurrentQuestion, setCurrentAnswer, addToHistory]);

  const nextRound = useCallback(() => {
    resetOverlay();
    startRecording();
  }, [resetOverlay, startRecording]);

  // Space key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        switch (state) {
          case "idle":
            startRecording();
            break;
          case "recording":
            stopRecordingAndGenerate();
            break;
          case "displaying":
            nextRound();
            break;
          case "generating":
            // Don't interrupt generating
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, startRecording, stopRecordingAndGenerate, nextRound]);

  // Store history in localStorage so record window can access
  useEffect(() => {
    const store = useInterviewStore.getState();
    const unsub = useInterviewStore.subscribe((s) => {
      localStorage.setItem("interview_history", JSON.stringify(s.qaHistory));
      localStorage.setItem("interview_state", JSON.stringify({
        state: s.state,
        currentQuestion: s.currentQuestion,
        currentAnswer: s.currentAnswer,
        partialTranscript: s.partialTranscript,
      }));
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-screen w-screen bg-black/70 text-white flex flex-col p-4 select-none" data-tauri-drag-region>
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs text-gray-400">
          {state === "idle" && "⏸️ 等待中 | 空格开始"}
          {state === "recording" && "🎙️ 录音中 | 空格停止"}
          {state === "generating" && "🤖 AI 生成中..."}
          {state === "displaying" && "📋 空格开始下一轮"}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {(state === "recording" || state === "generating" || state === "displaying") && (
          <div className="bg-white/10 rounded-xl p-3 border-l-2 border-blue-400">
            <p className="text-xs text-blue-300 mb-1">面试官问题：</p>
            {state === "recording" ? (
              <p className="text-sm text-white">
                {partialTranscript || "正在听取..."}
                <span className="animate-pulse text-blue-400"> ▍</span>
              </p>
            ) : (
              <p className="text-sm text-white">{currentQuestion}</p>
            )}
          </div>
        )}

        {(state === "generating" || state === "displaying") && (
          <div className="bg-white/10 rounded-xl p-3 border-l-2 border-green-400">
            <p className="text-xs text-green-300 mb-1">AI 回答：</p>
            {state === "generating" ? (
              <p className="text-sm text-white">
                {currentAnswer || "正在生成..."}
                <span className="animate-pulse text-green-400"> ▍</span>
              </p>
            ) : (
              <p className="text-sm text-white whitespace-pre-wrap">{currentAnswer}</p>
            )}
          </div>
        )}

        {state === "idle" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">按空格键开始录音</p>
          </div>
        )}
      </div>

      {/* Hint at bottom */}
      <div className="text-center text-xs text-gray-600 mt-2 shrink-0">
        空格键控制 · 可拖动窗口 · 始终置顶
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update overlay-src/main.tsx to import CSS**

Read `overlay-src/main.tsx`, Edit to add `import "./index.css";` at the top.

- [ ] **Step 4: Verify overlay compiles**

```bash
pnpm build
```

Expected: Build succeeds with overlay entry point included.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build overlay window with space key state machine"
```

---

### Task 13: Build Record window (full transcript)

**Files:**
- Write: `record-src/RecordApp.tsx` (rewrite), `record-src/index.css`

- [ ] **Step 1: Write record CSS**

Write `record-src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #111827;
  color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

- [ ] **Step 2: Update record-src/main.tsx to import CSS**

Read `record-src/main.tsx`, Edit to add `import "./index.css";` at the top.

- [ ] **Step 3: Write RecordApp**

Write `record-src/RecordApp.tsx`:

```typescript
import { useState, useEffect, useRef } from "react";

interface QaItem {
  question: string;
  answer: string;
  timestamp: string;
}

export default function RecordApp() {
  const [qaList, setQaList] = useState<QaItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Poll localStorage for updates from overlay window
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("interview_history");
        if (raw) {
          const history = JSON.parse(raw) as QaItem[];
          setQaList(history);
        }
      } catch {
        // Ignore
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new items added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [qaList]);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-200">📋 面试全程记录</h2>
        <p className="text-xs text-gray-500 mt-0.5">一问一答 · 自动追加</p>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {qaList.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">等待面试开始...</p>
          </div>
        ) : (
          qaList.map((qa, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-3 border-l-2 border-blue-500">
                <p className="text-xs text-blue-400 font-medium mb-1">
                  Q{index + 1} · 面试官：
                </p>
                <p className="text-sm text-gray-200">{qa.question}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 border-l-2 border-green-500 ml-3">
                <p className="text-xs text-green-400 font-medium mb-1">
                  A{index + 1} · AI回答：
                </p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{qa.answer}</p>
              </div>
              <p className="text-xs text-gray-600 text-right">
                {new Date(qa.timestamp).toLocaleTimeString("zh-CN")}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer status */}
      <div className="shrink-0 px-4 py-2 border-t border-gray-700 text-center">
        <p className="text-xs text-gray-600">
          {qaList.length > 0
            ? `共 ${qaList.length} 轮问答`
            : "空格键开始首轮问答"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with both overlay and record entry points.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build record window with full transcript display"
```

---

### Task 14: Wire up data flow — config from main to overlay/record windows

**Files:**
- Modify: `overlay-src/OverlayApp.tsx`, `src/pages/Home.tsx`

- [ ] **Step 1: Update Home page to save config before launching windows**

Edit `src/pages/Home.tsx` — update the `handleStartInterview` function:

```typescript
import { startInterviewWindows, saveConfig, type AppConfig } from "@/lib/commands";

const handleStartInterview = async () => {
  try {
    // Build config from current state
    const config: AppConfig = {
      iflytek: { appId: "", apiKey: "", apiSecret: "" },
      deepseek: {
        apiKey: "",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        maxTokens: 2000,
        temperature: 0.7,
      },
      interview: {
        region,
        position,
        language,
        customQaEnabled: useCustomQa === "yes",
      },
    };
    // Load existing API keys from store
    try {
      const existing = await invoke("load_config") as string;
      if (existing && existing !== "{}") {
        const parsed = JSON.parse(existing);
        config.iflytek = parsed.iflytek || config.iflytek;
        config.deepseek = parsed.deepseek || config.deepseek;
      }
    } catch {}

    // Save merged config
    await saveConfig(config);
    // Store config in localStorage for overlay/record windows to access
    localStorage.setItem("app_config", JSON.stringify(config));
    // Clear previous history
    localStorage.setItem("interview_history", JSON.stringify([]));

    // Start interview windows
    await startInterviewWindows();
  } catch (err) {
    console.error("Failed to start interview:", err);
  }
};
```

Add `invoke` import at the top:
```typescript
import { invoke } from "@tauri-apps/api/core";
```

- [ ] **Step 2: Verify the full flow works**

```bash
pnpm tauri dev
```

1. Click "前往面试" button
2. Verify overlay and record windows open
3. Verify config is passed correctly

- [ ] **Step 3: Test full interview flow**

1. Click overlay window to focus it
2. Press Space → should start recording (microphone permission prompt)
3. Press Space again → should stop and generate (if API keys configured)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up config flow between main, overlay, and record windows"
```

---

### Task 15: Final integration, polish, and GitHub setup

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

Write `.gitignore`:

```
node_modules/
dist/
.superpowers/
src-tauri/target/
*.log
.DS_Store
```

- [ ] **Step 2: Verify full build**

```bash
pnpm tauri build --debug
```

Expected: Build succeeds, produces a working Tauri app.

- [ ] **Step 3: Final git commit**

```bash
git add -A
git commit -m "feat: complete AI interview assistant MVP"
```

- [ ] **Step 4: Set up GitHub remote**

```bash
git remote add origin https://github.com/akk-jay/aifzms.git
git branch -M main
git push -u origin main
```

(If repo doesn't exist yet on GitHub, create it first at https://github.com/akk-jay/aifzms)

- [ ] **Step 5: Verify on GitHub**

Open `https://github.com/akk-jay/aifzms` and confirm all files are pushed.

---

### Task 16: Verify entire flow end-to-end

- [ ] **Step 1: Launch the app**

```bash
pnpm tauri dev
```

- [ ] **Step 2: Test checklist**
  1. Sidebar navigation works (all 4 pages) ✓
  2. Home page: selects work, form renders correctly ✓
  3. Settings: iFlytek tab saves/clears config ✓
  4. Settings: DeepSeek tab saves config ✓
  5. Records: shows empty state, expands records ✓
  6. Help: renders all sections ✓
  7. "前往面试" button opens overlay + record windows ✓
  8. Overlay window: semi-transparent, always on top, draggable ✓
  9. Record window: dark theme, scrollable ✓
  10. Space key cycles through idle → recording → displaying → idle ✓

- [ ] **Step 3: Fix any issues found, commit fixes**

```bash
git add -A
git commit -m "fix: address integration test issues"
git push
```
