# AI 面试辅助工具 — 设计文档

**日期**: 2026-05-30
**状态**: 已确认
**GitHub**: akk-jay

---

## 一、产品概述

本地部署的桌面级 AI 面试辅助工具。用户在 Web 配置端设置 API 密钥和面试参数，点击「前往面试」后启动双窗口面试模式：一个半透明悬浮窗用于实时辅助（空格控制），一个完整记录窗口保留全流程问答。

---

## 二、技术栈

| 层级 | 技术 | 理由 |
|------|------|------|
| 桌面框架 | Tauri v2 | 轻量 (~10MB)，支持多窗口 + 透明窗口 |
| 前端 | React 18 + TypeScript | 生态成熟，类型安全 |
| UI 组件 | shadcn/ui + Tailwind CSS 3 | 极简风格，匹配白色/浅蓝设计需求 |
| 路由 | React Router v6 | SPA 路由 |
| 状态管理 | Zustand | 轻量、简洁 |
| 本地存储 | Tauri Store Plugin | JSON 文件持久化 |
| 语音转文字 | 科大讯飞 RTASR (WebSocket) | 需求指定 |
| AI 文本生成 | DeepSeek Chat API (HTTP) | 需求指定 |
| 包管理 | pnpm | 快速、节省磁盘 |

---

## 三、架构设计

### 3.1 整体架构

```
Tauri App (Rust 壳)
├── 窗口 1: 配置主窗口 (800x700, 正常窗口)
│   ├── / (首页/新建面试)
│   ├── /settings (系统设置 - 讯飞/DeepSeek)
│   ├── /records (面试记录)
│   └── /help (帮助)
│
├── 窗口 2: 辅助悬浮窗口 (400x300, 半透明置顶无边框)
│   ├── 显示本轮问答 (一问一答，替换式)
│   └── 空格键控制：录音/停止 → 生成
│
├── 窗口 3: 全程记录窗口 (400x500, 正常窗口)
│   ├── 一问一答追加式显示
│   └── 保留全流程问答，可滚动
│
└── Rust Backend (Tauri Commands)
    ├── create_overlay_window() — 创建悬浮窗口
    ├── create_record_window() — 创建记录窗口
    ├── save_config() / load_config() — 配置读写
    └── save_record() / load_records() — 记录管理
```

### 3.2 窗口间通信

```
配置窗口 ──(Tauri Store)──→ 辅助窗口 (读取配置)
配置窗口 ──(Tauri Event)──→ 辅助窗口 + 记录窗口 (启动/关闭)
辅助窗口 ──(Tauri Event)──→ 记录窗口 (问答数据推送)
```

---

## 四、页面设计

### 4.1 页面 1: 新建面试配置 (`/`)

**布局**: 左侧固定导航 + 右侧主内容区

**模块 1 — 面试基础信息**:
- 地区下拉框 (默认: 简体中文)
- 岗位下拉框 (默认: 前端)
- 补充入口: "没有想要的岗位？联系小助手一键添加"

**模块 2 — 技术定制**:
- 编程语言下拉框 (默认: TypeScript)
- 自定义问答库开关 (默认: 否)
- 状态提示 + "创建问答库" 按钮

**模块 3 — 模式选择与提交**:
- 简历上传提示栏 (浅蓝背景)
- "前往面试" 蓝色主按钮 → 启动双窗口

### 4.2 页面 2-3: 系统设置 (`/settings`)

双标签页切换:

**科大讯飞标签**:
- 应用 ID、API Key (密码框+显示/隐藏)
- 保存配置 / 清除配置 按钮
- 配置状态: 已配置 + 时间戳

**DeepSeek AI 标签**:
- API Key、Base URL、Model、MaxTokens、Temperature
- 保存配置按钮

### 4.3 面试记录 (`/records`)

历史面试列表 + 详情查看（全程记录的数据回放）

---

## 五、双窗口面试模式

### 5.1 窗口 A: 辅助悬浮窗口

**外观**: 半透明黑色背景 (rgba 0,0,0,0.7)，无边框，80% 透明度
**行为**: 始终置顶、可拖动、可调节大小
**内容**: 仅显示当前一轮 — 面试官问题 + AI 回答
**控制**: 全局快捷键空格

**空格键状态机**:
```
等待中 ──[空格]──→ 🎙️ 录音中 (讯飞转文字)
                         │
                     [空格] 停止录音
                         │
                         ↓
                    🤖 生成中 (DeepSeek)
                         │
                    自动完成
                         │
                         ↓
                    📋 显示回答 (保留在屏幕)
                         │
                     [空格] 新一轮录音
                         │
                         ↓
                    录音中 (上一轮内容被替换)
```

### 5.2 窗口 B: 全程记录窗口

**外观**: 深色背景 (不透明)，正常窗口装饰
**行为**: 可拖动、可调大小、与辅助窗口并列
**内容**: 全部问答记录，一问一答格式
**更新**: 自动追加，不替换

**数据格式**:
```
Q1 · 面试官: 请做一下自我介绍
A1 · AI回答: 我是一名前端开发工程师...
Q2 · 面试官: 说说 React Fiber
A2 · AI回答: React Fiber 是 React 16 引入的...
```

### 5.3 两窗口协作

| 触发 | 窗口 A (辅助) | 窗口 B (记录) |
|------|--------------|--------------|
| 空格 (第1次) | 开始录音，显示实时文字 | 无变化 |
| 空格 (第2次) | 停止录音，生成回答 | 追加新问题文字 |
| 回答完成 | 显示当前 Q&A（替换） | 追加 AI 回答 |
| 空格 (第3次) | 开始新录音（旧内容消失） | 追加新一轮 Q |

---

## 六、数据存储

### 6.1 存储结构

```typescript
// Tauri Store: config.json
{
  iflytek: {
    appId: string,
    apiKey: string,
    apiSecret: string
  },
  deepseek: {
    apiKey: string,
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    maxTokens: 2000,
    temperature: 0.7
  },
  interview: {
    region: "简体中文",
    position: "前端",
    language: "TypeScript",
    customQaEnabled: false
  }
}

// Tauri Store: records.json
{
  records: [
    {
      id: "uuid",
      date: "2026-05-30T20:30:00",
      position: "前端",
      qaList: [
        { question: "...", answer: "...", timestamp: "..." }
      ]
    }
  ]
}
```

---

## 七、API 集成

### 7.1 科大讯飞 RTASR

- 协议: WebSocket
- 音频格式: 16kHz, 16bit, mono PCM
- 语言: 根据配置选择 (简体中文等)

### 7.2 DeepSeek Chat

- 端点: `{baseUrl}/v1/chat/completions`
- 模型: deepseek-chat (可配置)
- System Prompt: 结合岗位、简历、题库生成面试回答
- 参数: maxTokens / temperature 由用户配置

---

## 八、UI 规范

- Web 端: 白色背景，浅蓝色 (#3b82f6) 主色调，圆角卡片 (12px border-radius)
- 表单: 必填项 * 标记，密码框显示/隐藏切换
- 提示: 成功/错误明确反馈，配置状态 + 时间戳
- 字体: 系统默认中文字体，代码块等宽字体

---

## 九、项目结构

```
aifzms/
├── src-tauri/          # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs     # 入口，窗口管理
│   │   ├── commands.rs # Tauri Commands
│   │   └── store.rs    # 数据存取
│   └── tauri.conf.json
├── src/                # React 前端
│   ├── components/     # 通用组件
│   ├── pages/
│   │   ├── Home.tsx          # 新建面试配置
│   │   ├── Settings.tsx      # 系统设置
│   │   ├── Records.tsx       # 面试记录
│   │   └── Help.tsx          # 帮助
│   ├── overlay/        # 面试窗口组件
│   │   ├── OverlayApp.tsx    # 辅助窗口
│   │   └── RecordApp.tsx     # 记录窗口
│   ├── stores/         # Zustand stores
│   ├── lib/            # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 十、待定/后续迭代

- 简历上传与管理功能
- 自定义问答库创建与管理
- 系统托盘最小化
- 多用户独立配置
- 笔试功能（代码编辑器集成）
