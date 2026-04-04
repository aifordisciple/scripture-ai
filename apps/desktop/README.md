# AI读 桌面版

基于 Tauri v2 + React 的圣经阅读桌面应用。

## 技术栈

- **框架**: Tauri v2 (Rust + WebView)
- **前端**: React 19 + Vite + TypeScript
- **状态管理**: Zustand (共享Web端store)
- **本地存储**: SQLite (tauri-plugin-sql)
- **认证**: 嵌入式WebView登录，与Web端账号统一

## 开发指南

### 前置要求

1. 安装 Rust: https://rustup.rs/
2. 安装 Node.js 18+
3. 安装 pnpm: `npm install -g pnpm`

### 安装依赖

```bash
# 在项目根目录
pnpm install
```

### 开发模式

```bash
cd apps/desktop
pnpm tauri:dev
```

### 构建发布

```bash
cd apps/desktop
pnpm tauri:build
```

## 项目结构

```
apps/desktop/
├── src/                    # React前端代码
│   ├── adapters/           # 平台适配器初始化
│   ├── components/         # 桌面端专用组件
│   │   ├── DesktopMenu.tsx
│   │   └── OfflineIndicator.tsx
│   ├── hooks/              # 桌面端专用hooks
│   ├── sync/               # 离线同步引擎
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── styles.css          # 全局样式
│
└── src-tauri/              # Rust后端代码
    ├── src/
    │   ├── commands/       # IPC命令处理
    │   │   ├── auth.rs     # 认证命令
    │   │   └── storage.rs  # 存储命令
    │   ├── main.rs         # 入口
    │   └── lib.rs          # 库模块
    ├── Cargo.toml          # Rust依赖
    └── tauri.conf.json     # Tauri配置
```

## 共享代码

桌面端与Web端共享以下代码：

- `packages/core/` - 核心业务逻辑（圣经引擎、AI客户端、常量）
- `packages/native/` - 平台抽象层（存储、认证适配器）
- `packages/ui/` - 共享UI组件和hooks

### 平台适配器使用

```typescript
import { getStorageAdapter, getAuthAdapter, getPlatform } from '@scripture-ai/native';

// 自动选择正确的适配器
const storage = getStorageAdapter();
const auth = getAuthAdapter();

// 存储数据
await storage.set('key', { value: 'data' });

// 认证
if (await auth.isAuthenticated()) {
  const token = await auth.getToken();
}
```

## 认证流程

桌面端使用嵌入式WebView登录：

1. 用户点击登录
2. 打开WebView窗口加载 `/desktop-login` 页面
3. 用户在WebView中完成NextAuth登录
4. 登录成功后，页面通过IPC回调token
5. 桌面端存储token到本地
6. 关闭WebView，进入已认证状态

## 离线支持

- 本地SQLite存储高频数据（高亮、笔记、书签）
- 离线时正常使用，联网时自动同步
- 同步引擎位于 `src/sync/engine.ts`

## API调用

桌面端调用部署的Web API：

```typescript
import { getAuthAdapter } from '@scripture-ai/native';

const API_BASE = 'https://your-domain.com';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const auth = getAuthAdapter();
  const token = await auth.getToken();

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
}

// 使用
const verses = await apiCall('/api/bible/gen/1');
```

## 配置

### Tauri配置 (tauri.conf.json)

- 窗口大小: 1200x800
- 最小窗口: 800x600
- 支持平台: macOS, Windows, Linux

### 环境变量

在 `.env` 文件中配置：

```
VITE_API_URL=https://your-domain.com
```

## 构建产物

构建后生成以下安装包：

- macOS: `.dmg` 和 `.app`
- Windows: `.msi` 和 `.exe`
- Linux: `.deb` 和 `.AppImage`

## 注意事项

1. **首次运行**: 需要先安装Rust工具链
2. **macOS开发**: 可能需要 `xcode-select --install`
3. **Windows开发**: 需要安装 Microsoft Visual Studio C++ Build Tools
4. **API URL**: 生产环境需要配置正确的API地址