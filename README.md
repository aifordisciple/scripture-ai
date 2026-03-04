# Scripture AI - 你的智能灵修伴侣

**Scripture AI** 是一个现代化的开源圣经阅读与灵修 Web 应用程序。它结合了传统的经文阅读体验与前沿的 AI 技术，旨在通过智能解读、语音朗读、笔记记录和个性化设置，帮助用户更深入地理解经文，提升灵修体验。

---

## ✨ 主要功能

### 📖 沉浸式阅读体验
- 支持中英文对照阅读（CUV 和 KJV 版本）
- 移动端与桌面端自适应布局 (PWA)
- 自定义字号、行间距，支持深色/浅色模式切换
- 多标签页导航（阅读、搜索、数据看板、高亮、笔记、计划）
- 手势操作支持（左滑、右滑、上滑）

### 🤖 AI 智能辅助 (Phase 2)
- **AI 逐节解读**：选中经文，AI 即可提供背景、释经及现代应用
- **AI 导师 (Tutor)**：苏格拉底式问答，引导深入思考
- **章节摘要**：一键生成全章神学摘要
- **智能搜索**：支持精确搜索、AI 语义推荐、向量模糊搜索
- **AI 祷告文生成**：基于经文感动生成祷告文
- **AI 灵修导读**：读经计划中自动生成每日灵修内容
- **AI 查经材料**：生成小组查经讨论问题
- **AI 讲道大纲**：基于经文生成讲道要点

### 🧠 记忆系统 (Phase 2)
- **艾宾浩斯记忆法**：基于 SM-2 算法的智能复习系统
- **记忆卡片**：将重要经文加入记忆库
- **智能复习提醒**：根据记忆曲线安排复习时间

### 🎧 语音朗读 (TTS)
- 集成高质量 Edge-TTS 语音合成
- 支持自动连播下一章
- 锁屏播放支持（移动端 Media Session API）
- 多语种支持（普通话、粤语、英语等）

### 📝 个人灵修系统
- **高亮标记**：支持多种颜色（黄、绿、蓝、红）标记经文
- **灵修笔记**：随时记录灵修感悟
- **数据同步**：注册登录后，设置、高亮和笔记将在多端自动同步
- **读经计划**：内置多个读经计划模板，支持自定义计划

### 👥 社交功能 (Phase 1)
- **好友系统**：搜索、添加、删除好友
- **社区动态**：分享读经感动
- **帖子互动**：点赞、评论
- **私密/公开高亮**：控制高亮可见性

### 📱 移动端 (Phase 0)
- **Expo 跨平台应用**：iOS/Android 原生体验
- **离线阅读**：下载圣经到本地，无网也能读
- **推送通知**：每日读经提醒
- **社区标签**：好友动态、阅读分享

### ⛪ 教会/小组系统 (Phase 3)
- **教会管理**：创建、管理教会群组
- **小组读经计划**：集体读经进度跟踪
- **成员管理**： Owner/Admin/Member 角色

### 🌐 开放平台 (Phase 3)
- **API 密钥**：为开发者提供 API 访问
- **OpenAPI 文档**：完整的 API 文档
- **多语言支持**：中文、英文、繁体、韩文、日文

### 📊 数据看板
- 读经热力图可视化
- 连续阅读火苗计数
- 勋章系统激励（连续 7 天、30 天等成就）
- 阅读进度统计

### 🖼️ 经文分享
- 精美经文卡片生成（10+ 布局模板）
- 支持自定义背景、字体、颜色
- 一键保存或分享到社交媒体

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) |
| 编程语言 | TypeScript |
| 样式库 | Tailwind CSS 4 |
| UI 组件 | Radix UI / Lucide React / Framer Motion |
| 数据库 ORM | Prisma |
| 数据库 | SQLite (开发) / PostgreSQL + pgvector (生产) |
| 认证系统 | NextAuth.js v5 (Credentials) |
| 状态管理 | Zustand (Redux 风格切片模式) |
| AI 集成 | OpenAI SDK / DeepSeek / Ollama |
| 语音服务 | Python edge-tts |
| 移动端 | Expo (React Native) |

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量 (.env)
cp .env.local .env
# 编辑 .env 填入必要配置

# 3. 初始化数据库
npx prisma generate
npx prisma db push

# 4. 导入圣经数据
node scripts/seed_full.js      # CUV 和合本
node scripts/seed_full_kjv.js  # KJV 英文版

# 5. 启动开发服务器
npm run dev
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d --build

# 首次运行需初始化数据
docker-compose exec web sh
npx prisma db push
node scripts/seed_full.js
```

---

## ⚙️ 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接 | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | NextAuth 密钥 | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-...` |
| `OPENAI_BASE_URL` | API 端点 | `https://api.openai.com/v1` |
| `AI_PROVIDER` | AI 提供商 | `openai` / `deepseek` / `ollama` |
| `DEEPSEEK_API_KEY` | DeepSeek Key | (可选) |

---

## 📖 功能使用指南

### 注册与登录
1. 点击右上角头像 → 登录/注册
2. 支持邮箱密码注册
3. 登录后可同步数据到云端

### 阅读经文
1. 点击顶部标题栏打开目录侧边栏
2. 选择书卷 → 章节
3. 支持点击章节号跳转

### 使用 AI
- **方式一**：选中经文 → 弹出菜单 → "AI 深度解读"
- **方式二**：点击右下角 Magic Ball → 打开 AI 侧边栏
- **快捷指令**：深度解读、历史背景、原文词义、生活应用、祷告回应、儿童讲解

### AI 导师
1. 打开 AI 侧边栏
2. 选择"AI 导师"模式
3. 提问关于经文的问题
4. 享受苏格拉底式的引导学习

### 记忆复习
1. 进入"我的" → "记忆复习"
2. 查看待复习的经文
3. 根据记忆情况评分（0-5分）
4. 系统自动安排下次复习时间

### 语音朗读
- 点击顶部播放按钮开始朗读
- 支持调整语速 (0.5x - 2x)
- 自动播放下一章

### 读经计划
1. 切换到"计划"标签页
2. 选择计划模板或自定义
3. 跟随每日任务流完成阅读

### 经文分享
1. 选中经文 → 分享
2. 选择模板、背景、字体
3. 保存图片或直接分享

---

## 🗂️ 项目结构

```
scripture-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由 (36+ 个端点)
│   │   ├── chat/          # AI 对话相关
│   │   │   ├── route.ts          # 主对话
│   │   │   ├── tutor/            # AI 导师
│   │   │   ├── study-guide/      # 查经材料
│   │   │   ├── sermon/           # 讲道大纲
│   │   │   ├── devotional/       # 灵修导读
│   │   │   ├── prayer/          # 祷告词
│   │   │   └── history/         # 历史记录
│   │   ├── highlight/     # 高亮 CRUD
│   │   ├── note/         # 笔记 CRUD
│   │   ├── tts/          # 语音合成
│   │   ├── memory/       # 记忆系统
│   │   ├── friends/      # 好友系统
│   │   ├── posts/        # 社区动态
│   │   ├── church/       # 教会/小组
│   │   ├── reminder/     # 提醒
│   │   ├── versions/     # 圣经版本
│   │   ├── user/         # 用户同步
│   │   └── docs/        # API 文档
│   ├── dashboard/        # 数据看板页
│   └── page.tsx         # 主阅读页
├── app-mobile/           # Expo 移动应用
│   ├── app/             # Expo Router 页面
│   │   ├── (tabs)/      # Tab 导航
│   │   └── chapter/     # 章节阅读
│   └── packages/        # 共享包
│       ├── core/        # 核心业务逻辑
│       ├── ui/          # 共享 UI
│       └── native/      # 原生能力
├── components/
│   ├── bible/           # 核心阅读组件
│   │   ├── Reader.tsx   # 经文渲染
│   │   ├── AISidebar.tsx # AI 侧边栏
│   │   ├── PlanTab.tsx  # 读经计划
│   │   └── ShareCard.tsx # 经文卡片
│   ├── ui/              # Radix UI 组件
│   └── auth/            # 认证组件
├── store/               # Zustand 状态管理
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具库
│   ├── auth.ts         # NextAuth 配置
│   ├── prisma.ts       # 数据库客户端
│   ├── constants.ts    # 常量定义
│   ├── i18n.ts        # 国际化
│   └── rate-limit.ts   # 限流
├── prisma/
│   └── schema.prisma   # 数据库模型 (20+ 模型)
└── scripts/
    ├── seed_full.js     # 种子数据脚本
    └── tts.py          # TTS 语音脚本
```

---

## 🔧 开发指南

### 添加新功能

1. **API 端点**：`app/api/[name]/route.ts`
2. **前端组件**：`components/bible/` 或 `components/ui/`
3. **状态管理**：`store/slices.ts` 添加切片

### 代码规范

- 使用 TypeScript strict 模式
- 使用 ESLint 检查：`npm run lint`
- 组件使用 Tailwind CSS 样式
- 避免使用 `@ts-ignore` 或 `as any`

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建新分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 版权说明

- 本项目开源代码遵循 MIT License
- 圣经文本（和合本 CUV、KJV）版权归属各译者/出版机构
- 请确保遵守相关版权规定

---

**Made with ❤️ for Disciple.**
