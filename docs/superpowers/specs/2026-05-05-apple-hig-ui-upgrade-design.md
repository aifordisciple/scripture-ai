# Apple HIG 全面 UI 升级设计文档

> 日期：2026-05-05
> 状态：已批准
> 范围：前端主应用 + Admin 后台 + 基础架构

## 背景

项目已完成 Apple HIG 基础迁移（27+ commits），token 系统、颜色、字体、间距、阴影均已 tokenized。但存在以下技术债和视觉不一致：

1. **双暗色模式系统** — 主应用用 Zustand `isDarkMode`，Admin 用 `localStorage + prefers-color-scheme`，互不协调
2. **双色彩体系** — Shadcn HSL 变量和 Apple CSS var 并存，组件混用
3. **无 ThemeProvider** — 无 React context 统一管理主题
4. **Admin 后台** — 功能完整但未达到 Apple HIG 精致度
5. **移动端响应式** — 每个页面手动 `hidden md:block` / `md:hidden` 重复实现

## 设计原则

- 纯 Apple HIG 风格：单蓝色强调、无阴影 UI、SF Pro 字体、tile 交替节奏、pill 按钮
- 分阶段渐进升级：每阶段可独立验证和部署
- Apple token 为唯一真相源：所有色彩通过 Apple CSS 变量定义

---

## Phase 1：基础架构统一

### 1.1 创建 ThemeProvider

**文件**：`components/providers/ThemeProvider.tsx`

- 创建 React context `ThemeContext`
- 提供 `useTheme()` hook：`{ theme, setTheme, toggleTheme }`
- 初始状态优先级：服务端用户设置 > `localStorage("theme")` > `prefers-color-scheme`
- 统一管理 `document.documentElement.classList`（add/remove `dark`）
- 统一 `localStorage` 持久化

**迁移**：
- 主应用 Zustand `isDarkMode` → 调用 `useTheme().toggleTheme()`，Zustand 保留 `isDarkMode` 作为派生状态
- Admin `AdminLayout` → 删除独立 `darkMode` state，使用 `useTheme()`
- `app/layout.tsx` → 包裹 `ThemeProvider`

### 1.2 消除双色彩体系

**策略**：Shadcn HSL 变量映射为 Apple token 别名

```css
/* :root (light) */
--primary: var(--apple-primary);              /* #0066cc */
--primary-foreground: var(--apple-on-primary); /* #ffffff */
--background: var(--apple-canvas);            /* #ffffff */
--foreground: var(--apple-ink);               /* #1d1d1f */
--card: var(--apple-canvas);                  /* #ffffff */
--card-foreground: var(--apple-ink);          /* #1d1d1f */
--muted: var(--apple-parchment);              /* #f5f5f7 */
--muted-foreground: var(--apple-ink-muted-48); /* #7a7a7a */
--border: var(--apple-hairline);              /* #e0e0e0 */
--input: var(--apple-hairline);               /* #e0e0e0 */
--ring: var(--apple-primary-focus);           /* #0071e3 */
--destructive: #cc0000;
--destructive-foreground: #ffffff;
--accent: var(--apple-pearl);                 /* #fafafc */
--accent-foreground: var(--apple-ink-muted-80); /* #333333 */
--popover: var(--apple-canvas);               /* #ffffff */
--popover-foreground: var(--apple-ink);       /* #1d1d1f */
--secondary: var(--apple-pearl);              /* #fafafc */
--secondary-foreground: var(--apple-ink-muted-80); /* #333333 */

/* .dark */
--primary: var(--apple-primary-on-dark);      /* #2997ff */
--primary-foreground: var(--apple-on-primary); /* #ffffff */
--background: var(--apple-tile-1);            /* #272729 */
--foreground: var(--apple-on-dark);           /* #ffffff */
--card: var(--apple-tile-2);                  /* #2a2a2c */
--card-foreground: var(--apple-on-dark);      /* #ffffff */
--muted: var(--apple-tile-3);                 /* #252527 */
--muted-foreground: var(--apple-body-muted);  /* #cccccc */
--border: #3a3a3c;
--input: #3a3a3c;
--ring: var(--apple-primary-on-dark);         /* #2997ff */
--destructive: #ff4444;
--destructive-foreground: #ffffff;
--accent: var(--apple-tile-3);                /* #252527 */
--accent-foreground: var(--apple-body-muted); /* #cccccc */
--popover: var(--apple-tile-2);               /* #2a2a2c */
--popover-foreground: var(--apple-on-dark);   /* #ffffff */
--secondary: var(--apple-tile-3);             /* #252527 */
--secondary-foreground: var(--apple-body-muted); /* #cccccc */
```

**效果**：`bg-primary` 和 `bg-apple-primary` 指向同一值，组件无需修改类名即可统一。后续逐步将 `bg-apple-*` 迁移为 `bg-primary` 等标准语义类名。

### 1.3 globals.css 清理

- 删除 Shadcn HSL 中与 Apple token 重复的定义
- Apple token 为唯一真相源
- 保留 Apple 专用 token（`--apple-tile-1/2/3`、`--apple-chip-translucent` 等）作为扩展
- 清理未使用的 CSS 变量

---

## Phase 2：核心组件 Apple HIG 升级

### 2.1 主页面 Header — Apple 双层导航

**Global Nav**（44px）：
- 亮色：`bg-surface-black text-on-dark`
- 暗色：`bg-surface-black text-on-dark`（不变）
- 左：Logo + 应用名（`nav-link` 12px/400）
- 中：搜索图标
- 右：用户头像 + 设置图标
- 移动端：Logo + hamburger + 用户图标

**Sub Nav Frosted**（52px）：
- 亮色：`bg-canvas-parchment/80 backdrop-blur-[20px] backdrop-saturate-[180%]`
- 暗色：`bg-tile-1/80 backdrop-blur-[20px] backdrop-saturate-[180%]`
- 左：当前书名/章节（`tagline` 21px/600）
- 中：Tab pills（scrollable，pill 形状活跃标签）
- 右：主操作按钮（AI 按钮，`button-primary` pill 风格）
- 移动端：书名 + 主操作按钮

### 2.2 Sidebar — Apple 书目浏览器

- 背景：`canvas-parchment`（亮色）/ `tile-2`（暗色）
- 搜索框：`search-input` 风格 — pill 形状、17px body、搜索图标前缀
- 分类标题：`caption-strong`（14px/600）+ `ink-muted-48` 颜色
- 书名：`body`（17px/400）
- 当前选中：`bg-primary text-on-primary` pill 高亮
- 章节网格：`configurator-option-chip` 风格 — pill 形状、紧凑间距
- 底部操作区：`button-dark-utility` 风格

### 2.3 Reader — Apple 排版

- 章节标题：`display-md`（34px/600）+ 负 letter-spacing（-0.374px）
- Verse 编号：`caption`（14px/400）+ `ink-muted-48` 颜色，右对齐
- Verse 文本：`body`（17px/400/1.47）+ `-0.374px` tracking
- 高亮色：四色柔和变体，亮色/暗色各有对应
- 章节导航按钮：`button-icon-circular` 风格 — 44px 圆形、translucent 背景
- 底部摘要按钮：`apple-pill-btn` 风格

### 2.4 AISidebar — Apple 对话界面

- 面板背景：`canvas`（亮色）/ `tile-1`（暗色），无装饰
- Header（52px）：`sub-nav-frosted` 风格 — 毛玻璃 + backdrop-blur
- 消息气泡：用户消息 `bg-primary text-on-primary` pill，AI 消息 `bg-canvas` 无边框
- Quick Prompts：`configurator-option-chip` 风格 — pill 形状、紧凑排列
- 输入框：`search-input` 风格 — pill 形状、17px body
- 发送按钮：`button-primary` pill
- 模式选择器：`button-pearl-capsule` 风格

### 2.5 MagicBall — 简化为 Apple icon-circular

- 外观：`button-icon-circular` — 44px 圆形、`surface-chip-translucent` 背景（64% alpha）、`ink` 图标
- 状态指示：通过微妙的 ring 颜色变化（而非复杂动画）
- 保留核心手势（左滑 AI、点击队列面板），视觉反馈更克制
- 生成中：subtle `border-primary` ring pulse

---

## Phase 3：Admin 后台全面升级

### 3.1 AdminLayout — Apple 双层导航

**Global Nav**（44px）：
- `bg-surface-black text-on-dark`
- 左：Logo + "Admin" 标签（`nav-link` 12px/400）
- 右：暗色模式切换 + 返回主站链接

**Sub Nav Frosted**（52px）：
- `bg-canvas-parchment/80 backdrop-blur-[20px]`（亮色）
- `bg-tile-1/80 backdrop-blur-[20px]`（暗色）
- 左：当前页面名（`tagline` 21px/600）
- 右：主操作按钮

**侧边栏**：
- 改为左侧窄轨（64px icon rail）+ hover 展开面板（200px）
- 图标用 `button-icon-circular` 风格
- 选中态：`bg-primary text-on-primary`
- 移动端：icon rail 隐藏，hamburger 展开全宽 drawer

### 3.2 Dashboard — Apple Product Tile 风格

- 顶部统计区：`product-tile-parchment` 风格大卡片，`display-lg`（40px/600）数字 + `caption` 标签
- 图表区：`store-utility-card` 风格 — 白色卡片、`rounded-lg`（18px）、1px hairline border、24px padding
- 卡片间距：`spacing.lg`（24px）gutter

### 3.3 数据表格 — Apple Configurator 风格

- 抽象 `<ResponsiveTable>` 组件：自动在 desktop 渲染表格、mobile 渲染卡片
- 筛选栏：`configurator-option-chip` 风格 — pill 形状筛选按钮
- 搜索框：`search-input` 风格 — pill 形状
- 表格行：hover `bg-black/[0.02]`（亮色）/ `bg-white/[0.02]`（暗色），无 border
- 操作按钮：`button-pearl-capsule` 风格
- 状态 badge：Apple HIG badge 变体（info/success/warning/error）
- 分页：Apple 风格 — 简洁 pill 按钮

### 3.4 表单与对话框 — Apple 输入风格

- 输入框：`search-input` 风格 — pill 形状、17px body、1px `rgba(0,0,0,0.08)` border
- 选择器：`configurator-option-chip` 风格
- 主按钮：`button-primary` — Action Blue pill
- 次按钮：`button-secondary-pill` — 透明背景 + Action Blue border
- 对话框：`rounded-lg`（18px）、无 shadow、parchment 背景
- 确认操作：`button-dark-utility` 风格

### 3.5 响应式策略

- `<ResponsiveTable>` 组件封装 desktop/mobile 双渲染逻辑
- Admin 侧边栏：`lg:` 固定 icon rail，`<lg:` hamburger drawer
- 统计卡片：`grid-cols-2 md:grid-cols-4`
- 图表：`grid-cols-1 md:grid-cols-2`
- 触控目标：统一 44px 最小尺寸

---

## 暗色模式统一规范

### Surface 映射

| 亮色 | 暗色 | 用途 |
|------|------|------|
| `canvas` #ffffff | `tile-1` #272729 | 页面背景 |
| `parchment` #f5f5f7 | `tile-2` #2a2a2c | 交替区域、卡片背景 |
| `pearl` #fafafc | `tile-3` #252527 | 次级按钮、chip 背景 |
| `surface-black` #000000 | `surface-black` #000000 | Global Nav（不变） |

### Text 映射

| 亮色 | 暗色 | 用途 |
|------|------|------|
| `ink` #1d1d1f | `on-dark` #ffffff | 主文本 |
| `ink-muted-80` #333333 | `body-muted` #cccccc | 次级文本 |
| `ink-muted-48` #7a7a7a | `ink-muted-48` #7a7a7a | 辅助文本（不变） |

### Accent 映射

| 亮色 | 暗色 | 用途 |
|------|------|------|
| `primary` #0066cc | `primary-on-dark` #2997ff | 交互元素 |

### Glass 映射

| 亮色 | 暗色 |
|------|------|
| `rgba(245,245,247,0.8)` | `rgba(39,39,41,0.8)` |

---

## 移动端适配规范

### 断点策略（对齐 Apple HIG）

| 断点 | 宽度 | 关键变化 |
|------|------|----------|
| phone | ≤640px | 单列、sidebar drawer、底部 tab bar |
| tablet | 641–833px | 双列、sidebar drawer、顶部 tab bar |
| desktop | ≥834px | 多列、固定 sidebar、双层导航 |

### 触控规范

- 所有可交互元素最小 44×44px
- 按钮间距 ≥12px（`spacing.sm`）
- 手势区域与视觉边界对齐

### 移动端特有组件

- 底部 Tab Bar：毛玻璃背景 + pill 形状活跃标签
- Sheet/Drawer：`rounded-t-xl`（22px）顶部圆角 + drag handle
- 移动端设置面板：底部 Sheet，分组列表风格

---

## 验证策略

每个 Phase 完成后：
1. `docker-compose down && docker-compose up -d --build` 验证构建
2. 桌面端测试：亮色/暗色模式、各组件交互
3. 移动端测试：各断点布局、触控交互、手势
4. 确认无视觉回归后再进入下一 Phase
