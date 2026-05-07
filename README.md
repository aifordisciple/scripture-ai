# AI读 - 你的智能灵修伴侣

**AI读** 是一个现代化的开源圣经阅读与灵修 Web 应用程序。它结合了传统的经文阅读体验与前沿的 AI 技术，旨在通过智能解读、语音朗读、笔记记录和个性化设置，帮助用户更深入地理解经文，提升灵修体验。

---

## 主要功能

### 沉浸式阅读体验
- 支持中英文对照阅读（CUV 和合本 / KJV 英文版）
- 移动端与桌面端自适应布局 (PWA)
- 自定义字号、行间距，支持深色/浅色模式切换
- 多标签页导航（阅读、搜索、数据看板、高亮、笔记、计划、交叉引用、主题图谱、书签、收藏等）
- 手势操作支持（左滑、右滑、上滑）
- 键盘快捷键支持

### AI 智能辅助
- **AI 逐节解读**：选中经文，AI 即可提供背景、释经及现代应用
- **AI 导师 (Tutor)**：苏格拉底式问答，引导深入思考
- **章节摘要**：一键生成全章神学摘要
- **智能搜索**：支持精确搜索、AI 语义推荐、向量模糊搜索（pgvector）
- **AI 祷告文生成**：基于经文感动生成祷告文
- **AI 灵修导读**：读经计划中自动生成每日灵修内容
- **AI 查经材料**：生成小组查经讨论问题
- **AI 讲道大纲**：基于经文生成讲道要点
- **AI 自定义提示词**：用户可创建、管理自定义快捷提问
- **AI 风格设置**：可调节详细度、深度、语调
- **AI 会话管理**：多会话切换、历史记录、标题自动生成
- **AI 洞见收藏**：保存 AI 回答中的精彩观点

### 圣经地图与时间线（Atlas）
- **圣经地图**：交互式地图，标注圣经地理位置
- **时间线**：按年代浏览圣经事件
- **旅程回放**：动态播放人物旅程（如保罗传教旅程）
- **AI 地理提取**：AI 自动从经文提取地理信息
- **经文-地点关联**：查看某地点相关的所有经文

### 主题图谱
- **主题网络**：可视化圣经主题之间的关联
- **主题-经文链接**：查看主题覆盖的经文范围
- **主题间连接**：展示主题间的引用、平行、预言等关系

### 交叉引用
- **经文关联**：查看经文之间的主题、引用、平行、预言、例证关联
- **AI 交叉引用**：AI 自动发现经文间的深层联系

### 记忆系统
- **艾宾浩斯记忆法**：基于 SM-2 算法的智能复习系统
- **记忆卡片**：将重要经文加入记忆库
- **智能复习提醒**：根据记忆曲线安排复习时间

### 语音朗读 (TTS)
- 集成高质量 Edge-TTS 语音合成
- 支持多声音选择
- 支持自动连播下一章
- 锁屏播放支持（移动端 Media Session API）
- 多语种支持（普通话、粤语、英语等）
- 语速调节（0.5x - 2x）

### 个人灵修系统
- **高亮标记**：支持多种颜色（黄、绿、蓝、红）标记经文，批量操作
- **灵修笔记**：随时记录灵修感悟
- **书签**：快速标记和跳转常用章节
- **阅读历史**：自动记录阅读轨迹
- **数据同步**：注册登录后，设置、高亮和笔记将在多端自动同步
- **读经计划**：内置多个读经计划模板，支持自定义计划，每日任务流引导

### 社交功能
- **好友系统**：搜索、添加、删除好友
- **私信**：好友间一对一实时消息
- **社区动态**：分享读经感动
- **帖子互动**：点赞、评论
- **隐私设置**：控制私信权限、在线状态、资料可见性

### 教会/小组系统
- **教会管理**：创建、管理教会群组
- **小组读经计划**：集体读经进度跟踪，支持挑战模式
- **成员管理**：Owner/Admin/Member 角色
- **小组聊天**：群组内实时聊天，支持经文分享
- **公告管理**：置顶公告发布
- **邀请码**：通过邀请码加入教会
- **排行榜**：小组读经进度排名
- **落后成员提醒**：自动识别进度落后成员
- **小组徽章**：成就系统激励
- **共享笔记**：小组内笔记共享

### 讲道管理
- **讲道稿管理**：创建、编辑、组织讲道稿
- **文件夹分类**：按主题/系列归档讲道
- **讲道模板**：内置讲道结构模板
- **AI 讲道辅助**：基于经文生成讲道大纲

### 桌面端（Tauri）
- **跨平台桌面应用**：基于 Tauri v2（Windows/macOS/Linux）
- **命令面板**：Cmd+P 快速导航
- **离线下载**：下载圣经到本地，无网也能读
- **打印预览**：经文打印支持
- **自动更新**：应用自动检测更新
- **自定义标题栏**：原生窗口体验

### 数据看板
- 读经热力图可视化
- 连续阅读火苗计数
- 勋章系统激励（连续 7 天、30 天等成就）
- 阅读进度统计
- 数据导出（TSV 格式）

### 经文分享
- 精美经文卡片生成（10+ 布局模板）
- AI 生成卡片主题
- 支持自定义背景、字体、颜色
- 一键保存或分享到社交媒体

### 通知与提醒
- 读经提醒（自定义时间）
- 推送通知（移动端）
- 系统公告
- 好友动态通知

### 管理后台
- 用户管理（禁言、角色变更、群发消息）
- 教会/小组管理
- 反馈处理
- 系统公告管理
- 操作日志审计
- 数据统计（PV/UV、日活趋势）

### 开放平台
- **API 密钥**：为开发者提供 API 访问
- **OpenAPI 文档**：完整的 API 文档（`/api/docs`）
- **多语言支持**：中文、英文

### 新手引导
- 5 步引导流程（欢迎 → 阅读 → AI → 计划 → 小组）
- 可跳过，可重置

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router, Webpack) |
| 编程语言 | TypeScript |
| 样式库 | Tailwind CSS 4 |
| UI 组件 | Radix UI / Lucide React / Framer Motion |
| 数据库 ORM | Prisma |
| 数据库 | PostgreSQL + pgvector (生产) |
| 认证系统 | NextAuth.js v5 (Credentials) |
| 状态管理 | Zustand (10 个 Redux 风格切片) |
| AI 集成 | OpenAI SDK / DeepSeek / Ollama |
| 语音服务 | Python edge-tts |
| 桌面端 | Tauri v2 (Rust + React + Vite) |
| 测试 | Vitest |

---

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local .env
# 编辑 .env 填入必要配置（见下方环境变量说明）

# 3. 初始化数据库
npx prisma generate
npx prisma db push

# 4. 导入圣经数据
node scripts/seed_full.js      # CUV 和合本（必须）
node scripts/seed_full_kjv.js  # KJV 英文版（可选）

# 5. 导入地图/时间线数据（可选）
node scripts/seed_events.ts
node scripts/seed_journeys.ts
node scripts/seed_themes_extended.js
node scripts/seed_theme_verses.js
node scripts/seed_theme_connections.js

# 6. 启动开发服务器
npm run dev
```

### Docker 部署（生产）

```bash
# 构建并启动
docker-compose up -d --build

# 首次运行需初始化数据
docker-compose exec web npx prisma db push
docker-compose exec web node scripts/seed_full.js
```

### Docker 开发模式

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 桌面端开发

```bash
cd apps/desktop
npm install
npm run tauri:dev     # 开发模式
npm run tauri:build   # 构建安装包
```

---

## 新服务器部署指南

以下是将 scripture-ai 部署到全新服务器的完整步骤。

### 前置要求

| 项目 | 要求 |
|------|------|
| OS | Linux (推荐 Ubuntu 22.04+) 或 macOS |
| Docker | Docker Engine 20.10+ |
| Docker Compose | v2+ |
| Git | 任意版本 |
| 磁盘空间 | >= 5GB (镜像 + 数据库 + 圣经数据) |
| 内存 | >= 2GB |
| 网络 | 能访问 GitHub 和 Docker Hub (国内需配置镜像加速) |

### 1. 克隆代码

```bash
git clone git@github.com:aifordisciple/scripture-ai.git
cd scripture-ai
```

### 2. 配置环境变量

```bash
cp .env .env.local
```

编辑 `.env.local`，**必须逐项检查并修改**以下变量：

**必须修改（否则服务无法启动）：**

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:password@localhost:5432/scripture_db` |
| `AUTH_SECRET` | NextAuth 加密密钥 | 用 `openssl rand -base64 32` 生成，每台服务器必须不同 |
| `NEXTAUTH_URL` | 服务器对外地址 | `http://你的IP:3000` 或 `https://your.domain` |
| `AUTH_TRUST_HOST` | 信任非 localhost | 非本地部署必须设为 `true` |

**AI 功能配置（按需选择一种）：**

| 方案 | 变量 | 说明 |
|------|------|------|
| 云端 API（推荐） | `AI_PROVIDER=cloud`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OLLAMA_MODEL` | 使用云端模型 |
| Ollama 本地 | `AI_PROVIDER=ollama`, `OPENAI_BASE_URL=http://host.docker.internal:11434/v1`, `OLLAMA_MODEL` | 本地部署模型 |
| DeepSeek | `AI_PROVIDER=deepseek`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`（可选） | DeepSeek API |

**Docker Compose 环境变量覆盖：**

`docker-compose.yml` 中的 `environment` 字段会**覆盖** `.env.local` 中的同名变量。容器内 `DATABASE_URL` 的 host 必须是 `db`（Docker 服务名），不是 `localhost`。

### 3. 启动 Docker 容器

```bash
docker-compose up -d --build
```

验证容器状态：

```bash
docker-compose ps
# 期望：web = Up, db = Up (healthy)

docker-compose logs web --tail=30
# 期望：看到 "Ready in XXXms"
```

### 4. 初始化数据库表结构

**不可跳过**，否则所有 API 请求返回 500。

```bash
docker-compose exec web npx prisma db push
```

验证表已创建：

```bash
docker-compose exec db psql -U user -d scripture_db -c "\dt"
# 应列出 50+ 张表
```

### 5. 导入圣经数据

**必须执行**，否则首页无经文内容。

```bash
# 导入中文和合本 (CUV) — 必须
docker-compose exec web node scripts/seed_full.js

# 导入英文 KJV — 如需双语支持
docker-compose exec web node scripts/seed_full_kjv.js
```

验证数据已导入：

```bash
docker-compose exec db psql -U user -d scripture_db -c "SELECT COUNT(*) FROM bible_verses;"
# CUV: ~31102 节，KJV: ~31102 节
```

**可选数据导入：**

```bash
# 圣经地图/时间线/主题数据
docker-compose exec web node scripts/seed_events.js
docker-compose exec web node scripts/seed_journeys.js
docker-compose exec web node scripts/seed_themes_extended.js
docker-compose exec web node scripts/seed_theme_verses.js
docker-compose exec web node scripts/seed_theme_connections.js

# 经文向量（需宿主机 Ollama + bge-m3 模型）
ollama pull bge-m3
docker-compose exec web npx tsx scripts/generate-embeddings.ts
```

### 6. 创建管理员账户

**方式 A：通过注册 API 创建**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"你的密码","name":"管理员"}'
```

**方式 B：通过 Prisma Studio 创建**

```bash
docker-compose exec web npx prisma studio
# 浏览器访问 http://localhost:5555，在 User 表中手动添加记录
# password 字段填入 bcrypt 哈希值：
docker-compose exec web node -e "
  const bcrypt = require('bcryptjs');
  console.log(bcrypt.hashSync('你的密码', 10));
"
```

设置管理员角色：

```bash
docker-compose exec db psql -U user -d scripture_db -c \
  "UPDATE \"User\" SET role='admin' WHERE email='admin@example.com';"
```

### 7. 验证部署完整性

```bash
# 页面可访问
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 期望: 200

# 同步接口返回 401 (未登录) 而非 500
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/user/sync
# 期望: 401

# 圣经数据存在
curl -s http://localhost:3000/api/bible?bookId=Gen&chapter=1 | head -c 200
# 期望: JSON 数据包含经文内容

# 数据库连接正常
docker-compose exec db psql -U user -d scripture_db -c "SELECT 1;"
# 期望: 返回 1
```

### 8. 生产环境优化（可选）

**Nginx 反向代理 + HTTPS：**

```nginx
server {
    listen 443 ssl;
    server_name your.domain;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

配置后修改 `.env.local`：`NEXTAUTH_URL=https://your.domain`、`AUTH_TRUST_HOST=true`。

**Docker Compose 安全建议：** 移除 `ports: "5432:5432"`（不暴露数据库端口到外网），添加 `logging` 配置防止日志膨胀。

### 从旧服务器迁移数据

```bash
# 旧服务器：导出数据库
docker-compose exec db pg_dump -U user scripture_db > backup.sql

# 新服务器：导入数据库（在执行 prisma db push 之后）
cat backup.sql | docker-compose exec -T db psql -U user scripture_db

# 导入后重新同步 Prisma 客户端
docker-compose exec web npx prisma generate
```

> 导入旧数据后不需要再执行 seed 脚本，因为圣经经文已在 backup.sql 中。

### 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `/api/user/sync` 返回 500 | 数据库表未创建 | `docker-compose exec web npx prisma db push` |
| 登录后同步报错 `SyntaxError` | AUTH_SECRET 与旧环境不同 | 清除浏览器 cookie，重新登录 |
| 首页空白无经文 | 未执行 seed 脚本 | `docker-compose exec web node scripts/seed_full.js` |
| AI 功能不可用 | AI_PROVIDER/API Key 未配置 | 检查 `.env.local` 中 AI 相关变量 |
| 数据库连接失败 | DATABASE_URL host 不是 `db` | Docker 内网络用服务名 `db`，不是 `localhost` |
| TTS 语音不可用 | 容器内缺少 edge-tts | 用 `docker-compose up --build` 重建镜像 |
| 容器启动后立即退出 | `.env.local` 缺少必要变量 | 检查 AUTH_SECRET、DATABASE_URL 是否已填写 |
| pgvector 扩展未安装 | 使用了普通 PostgreSQL 镜像 | 必须使用 `pgvector/pgvector:pg16` 镜像 |
| 向量搜索不工作 | 未生成 embedding 数据 | 执行 `generate-embeddings.ts` 脚本 |
| 端口冲突 | 3000/5432 被占用 | 修改 `docker-compose.yml` 的 ports 映射 |

### 部署检查清单

- [ ] `docker-compose ps` 显示 web 和 db 均 Up/healthy
- [ ] `curl localhost:3000` 返回 200
- [ ] `curl localhost:3000/api/user/sync` 返回 401 (非 500)
- [ ] `bible_verses` 表有数据 (CUV ~31102 条)
- [ ] 可正常注册/登录
- [ ] 登录后同步不报错
- [ ] AI 聊天功能可用
- [ ] TTS 语音朗读可用
- [ ] 经文高亮/笔记可保存
- [ ] 读经计划可创建和推进

---

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接 | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | NextAuth 密钥 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 服务器对外地址 | `http://IP:3000` 或 `https://domain` |
| `AUTH_TRUST_HOST` | 信任非 localhost | 非本地部署设为 `true` |
| `AI_PROVIDER` | AI 提供商 | `openai` / `deepseek` / `ollama` / `cloud` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-...` |
| `OPENAI_BASE_URL` | API 端点 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 模型名称 | `gpt-4o-mini` |
| `DEEPSEEK_API_KEY` | DeepSeek Key | (可选) |
| `DEEPSEEK_BASE_URL` | DeepSeek 端点 | (可选) |
| `OLLAMA_BASE_URL` | Ollama 端点 | `http://localhost:11434/v1` |
| `OLLAMA_MODEL` | Ollama 模型 | `qwen2.5:latest` |
| `EMBEDDING_BASE_URL` | 向量模型端点 | `http://host.docker.internal:11434/v1` |
| `IMAGE_EMBEDDING_MODEL` | 向量模型名 | `bge-m3` |
| `SMTP_HOST` | 邮件服务器 | (可选，未配置时邮件功能静默跳过) |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | (可选) |
| `SMTP_PASS` | SMTP 密码 | (可选) |

---

## 项目结构

```
scripture-ai/
├── app/                        # Next.js App Router
│   ├── api/                   # API 路由 (96个路由文件, 36个端点目录)
│   │   ├── admin/            # 管理后台
│   │   ├── ai/               # AI 辅助
│   │   ├── atlas/            # 圣经地图/时间线
│   │   ├── chat/             # AI 对话 (12个路由)
│   │   ├── church/           # 教会/小组 (21个路由)
│   │   ├── sermon/           # 讲道管理
│   │   ├── user/             # 用户数据
│   │   └── ...               # bible, search, highlight, note, tts, dm 等
│   ├── admin/                 # 管理后台页面
│   ├── dashboard/             # 数据看板页
│   ├── settings/prompts/      # 自定义提示词管理
│   ├── desktop-login/         # 桌面端登录
│   ├── layout.tsx            # 根布局 (Auth/Sync/Badge/Analytics)
│   ├── page.tsx              # 主阅读页
│   └── sitemap.ts            # 动态 sitemap
│
├── apps/                       # 桌面应用
│   └── desktop/               # Tauri v2 桌面端
│       ├── src-tauri/         # Rust 后端
│       └── src/               # React + Vite 前端
│
├── packages/                   # 共享库
│   ├── core/                  # 核心业务逻辑
│   ├── ui/                    # 共享 UI 工具
│   └── native/                # 原生能力抽象
│
├── components/                 # React 组件 (169个文件)
│   ├── bible/                 # 核心阅读组件 (61个文件)
│   ├── atlas/                 # 圣经地图组件
│   ├── group/                 # 小组功能组件 (22个)
│   ├── sermon/                # 讲道管理组件 (18个)
│   ├── mindmap/               # 思维导图
│   ├── onboarding/            # 新手引导
│   ├── admin/                 # 管理后台组件
│   ├── auth/                  # 认证组件
│   ├── common/                # 通用组件
│   ├── dm/                    # 私信组件
│   ├── feedback/              # 反馈组件
│   ├── providers/             # Context Providers
│   ├── pwa/                   # PWA 安装引导
│   ├── settings/              # 设置组件
│   ├── skeletons/             # 加载骨架屏
│   └── ui/                    # Radix UI 基础组件
│
├── store/                      # Zustand 状态管理 (10个切片)
│   ├── slices.ts              # 主要切片实现 (8个)
│   ├── slices/                # 独立切片文件
│   │   ├── localeSlice.ts     # 语言切片
│   │   ├── readerSlice.ts     # 阅读器切片
│   │   └── sermonSlice.ts     # 讲道切片
│   ├── useBibleStore.ts       # 主 Store 导出
│   └── types.ts               # TypeScript 类型定义
│
├── hooks/                      # 自定义 Hooks
│   ├── use-audio-player.ts    # 音频播放
│   ├── use-bible-data.ts      # 圣经数据
│   ├── use-bible-search.ts    # 经文搜索
│   ├── use-media-query.ts     # 响应式布局
│   ├── use-offline-cache.ts   # 离线缓存
│   ├── use-pwa-install.ts     # PWA 安装
│   ├── use-realtime.ts        # 实时更新
│   ├── use-swipe-navigation.ts # 手势导航
│   └── use-verse-menu.ts      # 经文菜单
│
├── lib/                        # 工具库
│   ├── auth.ts                # NextAuth 配置
│   ├── prisma.ts              # 数据库客户端
│   ├── constants.ts           # 常量 (BIBLE_BOOKS, prompts)
│   ├── plans.ts               # 读经计划定义
│   ├── ai-client.ts           # AI 客户端
│   ├── ai-context-builder.ts  # AI 上下文构建
│   ├── cross-reference-ai.ts  # 交叉引用AI
│   ├── i18n/                  # 国际化
│   ├── admin.ts               # 管理工具
│   ├── api-auth.ts            # API认证
│   ├── cache.ts               # 缓存
│   ├── rate-limit.ts          # 限流
│   ├── sse-manager.ts         # SSE管理
│   ├── email.ts               # 邮件服务
│   ├── group-badges.ts        # 小组徽章
│   ├── notification-service.ts # 通知服务
│   ├── memory-reminder-service.ts # 记忆提醒
│   ├── verse-preloader-service.ts # 经文预加载
│   ├── animation-presets.ts   # 动画预设
│   ├── bible-periods.ts       # 圣经时期
│   └── utils.ts               # 通用工具
│
├── prisma/
│   └── schema.prisma          # 数据库模型 (52个模型, 8个枚举)
│
├── scripts/                    # 数据脚本
│   ├── seed_full.js           # CUV 圣经数据
│   ├── seed_full_kjv.js       # KJV 圣经数据
│   ├── seed_events.ts         # 圣经事件数据
│   ├── seed_journeys.ts       # 旅程数据
│   ├── seed_themes_extended.js # 主题数据（扩展版）
│   ├── seed_theme_verses.js   # 主题-经文关联
│   ├── seed_theme_connections.js # 主题关联
│   ├── generate-embeddings.ts # 向量嵌入生成
│   └── tts.py                 # TTS 语音脚本
│
├── docker-compose.yml          # 生产 Docker 配置
├── docker-compose.dev.yml      # 开发 Docker 配置
├── Dockerfile                  # 多阶段构建 (5阶段)
├── auto_deploy.sh              # 自动部署脚本
└── package.json                # 项目配置
```

---

## 架构设计

### 状态管理 (Zustand 10 切片)

| 切片 | 职责 | 关键状态 |
|------|------|----------|
| **UISlice** | 界面控制 | 侧边栏、弹窗、分享、新手引导 |
| **ReaderSlice** | 阅读器 | 字号、暗色模式、标签页、章节导航 |
| **AISlice** | AI功能 | 会话、队列、模式、风格设置、洞见收藏 |
| **UserDataSlice** | 用户数据 | 高亮、笔记、计划、书签、阅读历史 |
| **SyncSlice** | 数据同步 | 同步模式、状态、错误 |
| **GroupSlice** | 小组功能 | 小组计划上下文、进度 |
| **AtlasSlice** | 圣经地图 | 地图中心/缩放、时间线、旅程 |
| **DMSlice** | 私信 | 会话列表、消息、未读数 |
| **LocaleSlice** | 语言 | locale (zh/en)、bibleVersion (CUV/KJV) |
| **SermonSlice** | 讲道 | 讲道稿、文件夹、模板 |

### 数据模型 (Prisma 52个模型, 8个枚举)

| 分类 | 模型 |
|------|------|
| **核心** | User, BibleVerse, Highlight, Note, ScriptureCard, Interaction |
| **设置** | UserSetting, Reminder, NotificationToken, PrivacySettings |
| **AI** | ChatSession, ChatMessage, CustomPrompt, SavedInsight |
| **记忆** | MemoryCard, ReviewLog (SM-2算法) |
| **社交** | Friend, DirectMessage, Feedback |
| **教会** | Church, ChurchMember, InviteCode, GroupPlan, GroupPlanProgress |
| **教会扩展** | GroupChatMessage, GroupAnnouncement, GroupCheckInActivity, GroupBadge, GroupChatReadStatus, LeaderboardEntry |
| **讲道** | Sermon, SermonFolder, SermonTemplate |
| **地图** | BibleLocation, BibleVerseLocation, BibleEvent, BibleJourney, JourneyStop |
| **主题** | BibleTheme, ThemeVerseLink, ThemeConnection |
| **系统** | ApiKey, ActivityLog, AdminLog, SystemAnnouncement, PageView, VerseConnection, Notification, Like, Comment, Badge, PlanProgress |

### 高级模式

**AI 请求队列系统**
AISlice 管理请求队列，防止并发 API 调用：
- `enqueueAI()` - 加入队列或立即执行
- `cancelAIRequest()` - 取消当前或排队请求
- `completeCurrentRequest()` - 完成当前请求，自动启动下一个

**读经计划流上下文**
用于逐步执行计划，包含 `{ planId, day, stepIndex, steps[] }`：
- `advancePlanStep()` - 推进到下一步，自动签到
- `catchUpPlan()` - 追赶落后进度

**小组计划流上下文**
类似读经计划，但用于教会小组，包含 `{ churchId, planId, planName, day, stepIndex, steps[] }`：
- 通过 `/api/church/[id]/plan/[planId]/progress` 同步进度
- `toggleGroupTaskCompleted()` - 异步完成任务并同步到服务器

**数据持久化**
- Zustand store 使用 `zustand/middleware` persist 持久化到 localStorage
- 排除瞬态状态（AI会话、生成标志、同步错误、地图/私信状态）
- 登录后通过 `/api/user/sync` 实现云端同步

---

## API 端点 (96个路由文件, 36个端点目录)

### 圣经核心
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/bible` | GET | 获取经文（书卷、章节、版本） |
| `/api/bible/[bookId]/[chapter]/[verse]` | GET | 获取单节经文 |
| `/api/search` | GET/POST | 搜索经文（精确/AI/向量三种模式） |
| `/api/versions` | GET | 圣经版本列表 |
| `/api/versions/import` | POST/DELETE | 导入/删除圣经版本 |
| `/api/cross-reference` | POST | 交叉引用查询 |
| `/api/parse-verse` | POST | 经文引用解析 |

### AI对话 (12个路由)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat` | POST | 主对话（流式响应） |
| `/api/chat/tutor` | POST | 苏格拉底式导师 |
| `/api/chat/devotional` | POST | 灵修导读生成 |
| `/api/chat/prayer` | POST | 祷告文生成 |
| `/api/chat/sermon` | POST | 讲道大纲生成 |
| `/api/chat/study-guide` | POST | 查经材料生成 |
| `/api/chat/plan` | POST | 自定义读经计划 |
| `/api/chat/verse` | GET | 经文AI解读 |
| `/api/chat/message` | POST/PATCH | 消息管理 |
| `/api/chat/session` | GET/POST/PATCH/DELETE | 会话管理 |
| `/api/chat/session/generate-title` | POST | 自动生成会话标题 |
| `/api/chat/history` | GET/DELETE | 对话历史管理 |

### 圣经地图/Atlas (6个路由)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/atlas/locations` | GET/POST | 地理位置数据 |
| `/api/atlas/events` | GET/POST | 圣经事件数据 |
| `/api/atlas/journeys` | GET/POST | 旅程数据 |
| `/api/atlas/ai-extract` | POST | AI提取地理信息 |
| `/api/atlas/verse-locations` | GET/POST | 经文-地点关联 |
| `/api/atlas/cache-verse-locations` | POST | 缓存经文地点关联 |

### 用户数据 (8个路由)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/highlight` | GET/POST | 高亮管理 |
| `/api/highlight/batch` | GET/POST | 批量高亮操作 |
| `/api/note` | POST | 笔记管理 |
| `/api/user/sync` | GET/POST | 全量数据同步 |
| `/api/user/settings` | GET/POST | 用户设置（含API配置） |
| `/api/user/dashboard` | GET | 仪表盘统计数据 |
| `/api/user/api-keys` | GET/POST/DELETE | API密钥管理 |
| `/api/user/privacy` | GET/PUT | 隐私设置 |
| `/api/user/role` | GET/PUT | 用户角色 |
| `/api/user/locale` | GET/POST | 语言偏好 |
| `/api/user/onboarding` | GET/POST/DELETE | 新手引导状态 |

### 社交功能
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/friends` | GET/POST/DELETE/PATCH | 好友系统 |
| `/api/dm` | GET/POST/PUT/DELETE | 私信系统 |
| `/api/posts` | GET/POST/DELETE | 社区动态 |
| `/api/posts/like` | POST/DELETE | 点赞 |
| `/api/posts/comment` | GET/POST | 评论 |
| `/api/member/[userId]` | GET | 用户资料 |

### 教会系统 (21个路由)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/church` | GET/POST | 教会列表/创建 |
| `/api/church/join-by-invite` | POST | 邀请码加入 |
| `/api/church/unread-count` | GET | 未读消息数 |
| `/api/church/[id]` | GET/POST | 教会详情/更新 |
| `/api/church/[id]/stats` | GET | 教会统计 |
| `/api/church/[id]/activity` | GET/POST | 活动动态 |
| `/api/church/[id]/chat` | GET/POST/PUT | 小组聊天 |
| `/api/church/[id]/notes` | GET/POST | 共享笔记 |
| `/api/church/[id]/like` | GET/POST | 点赞 |
| `/api/church/[id]/comment` | GET/POST/DELETE | 评论 |
| `/api/church/[id]/invite` | GET/POST/DELETE | 邀请码管理 |
| `/api/church/[id]/announcement` | GET/POST/PUT/DELETE | 公告管理 |
| `/api/church/[id]/remind` | POST | 提醒成员 |
| `/api/church/[id]/behind-members` | GET | 落后成员 |
| `/api/church/[id]/badges` | GET/POST | 小组徽章 |
| `/api/church/[id]/badges/check` | POST | 检查徽章 |
| `/api/church/[id]/plan` | GET/POST/PUT/DELETE | 小组计划 |
| `/api/church/[id]/plan/ai-create` | POST | AI创建计划 |
| `/api/church/[id]/plan/[planId]/leaderboard` | GET | 排行榜 |
| `/api/church/[id]/plan/[planId]/devotional` | GET/POST | 灵修内容 |
| `/api/church/[id]/plan/[planId]/progress` | GET/POST | 进度跟踪 |

### 记忆与提醒
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/memory` | GET/POST/PUT/DELETE | 记忆卡片（SM-2算法） |
| `/api/reminder` | GET/POST/DELETE | 读经提醒 |

### AI辅助与工具
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tts` | POST | 语音合成 |
| `/api/card-theme` | POST | 卡片主题AI生成 |
| `/api/card-image` | POST | 卡片图片生成 |
| `/api/insights` | GET/POST/PUT/DELETE | AI洞见收藏 |
| `/api/prompts` | GET/POST/PATCH/DELETE | 自定义提示词 |
| `/api/theme` | GET | 主题图谱数据 |
| `/api/proxy` | GET | 资源代理（带缓存） |
| `/api/docs` | GET | OpenAPI文档 |
| `/api/sync/offline` | POST | 离线数据同步 |

### 讲道管理
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sermon` | GET/POST/PUT/DELETE | 讲道稿管理 |
| `/api/sermon/folders` | GET/POST | 讲道文件夹 |

### 管理后台 (6个路由)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/admin/stats` | GET | 系统统计 |
| `/api/admin/users` | GET/PUT | 用户管理 |
| `/api/admin/churches` | GET | 教会管理 |
| `/api/admin/logs` | GET | 操作日志 |
| `/api/admin/messages` | GET/POST | 群发消息 |
| `/api/admin/messages/batch` | POST | 批量消息 |
| `/api/admin/announcements` | GET/POST/PUT/DELETE | 系统公告 |

### 其他
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth认证 |
| `/api/register` | POST | 用户注册 |
| `/api/analytics` | GET/POST | 访问分析 |
| `/api/announcements` | GET | 公告查询 |
| `/api/events` | GET | 事件查询 |
| `/api/notification` | GET/POST/PUT/DELETE | 通知管理 |
| `/api/feedback` | GET/POST/PUT/DELETE | 用户反馈 |
| `/api/feedback/batch` | POST | 批量反馈 |

---

## 开发指南

### 代码规范

- 使用 TypeScript strict 模式
- 使用 ESLint 检查：`npm run lint`
- 组件使用 Tailwind CSS 样式
- 避免使用 `@ts-ignore` 或 `as any`
- 使用路径别名 `@/` 导入
- 客户端组件使用 `"use client"` 指令
- 组件文件：PascalCase (`Reader.tsx`)
- Hooks 文件：kebab-case (`use-audio-player.ts`)
- API 路由：lowercase (`app/api/chat/route.ts`)

### 部署流程

```bash
# 1. 代码修改后重启 Docker 验证
docker-compose down && docker-compose up -d --build

# 2. 验证通过后自动部署
./auto_deploy.sh -s "feat: 功能描述" -d "详细修改说明"
```

### 运行测试

```bash
npm run test           # 运行测试（watch模式）
npm run test:run       # 单次运行
npm run test:coverage  # 带覆盖率
```

---

## 常见问题

**Q: 如何切换AI提供商？**
A: 有两种方式：1) 在用户设置中配置（优先级更高）；2) 设置环境变量 `AI_PROVIDER`。优先级：用户设置 > 环境变量默认值。

**Q: 如何添加新的圣经版本？**
A: 使用 `/api/versions/import` 端点导入，数据格式参考 `scripts/seed_full.js`。

**Q: 桌面端如何构建？**
A: `cd apps/desktop && npm install && npm run tauri:build`

**Q: 数据如何迁移？**
A: 使用 `/api/user/sync` 端点：`GET` 导出完整用户数据，`POST` 导入数据（会合并现有数据）。

**Q: 如何配置本地AI？**
A: 安装 Ollama 后运行 `ollama pull qwen2.5`，设置 `OLLAMA_BASE_URL=http://localhost:11434/v1` 和 `OLLAMA_MODEL=qwen2.5`。

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建新分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 版权说明

- 本项目开源代码遵循 MIT License
- 圣经文本（和合本 CUV、KJV）版权归属各译者/出版机构
- 请确保遵守相关版权规定
