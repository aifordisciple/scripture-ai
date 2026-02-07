# Scripture AI - 你的智能灵修伴侣

**Scripture AI** 是一个现代化的开源圣经阅读与灵修 Web 应用程序。它结合了传统的经文阅读体验与前沿的 AI 技术，旨在通过智能解读、语音朗读、笔记记录和个性化设置，帮助用户更深入地理解经文，提升灵修体验。

## ✨ 主要功能

* **📖 沉浸式阅读体验**
* 支持中英文对照阅读（CUV 和 KJV 版本）。
* 移动端与桌面端自适应布局。
* 自定义字号、行间距，支持深色/浅色模式切换。


* **🤖 AI 智能辅助**
* **AI 逐节解读**：选中经文，AI 即可提供背景、释经及现代应用。
* **Magic Ball (灵修助手)**：悬浮球交互，随时唤起 AI 对话或功能菜单。
* **章节摘要**：一键生成全章摘要。


* **🎧 语音朗读 (TTS)**
* 集成了高质量的语音合成功能，支持自动连播下一章。
* 支持锁屏播放（移动端）。


* **📝 个人灵修系统**
* **高亮标记**：支持多种颜色高亮经文。
* **灵修笔记**：随时记录灵修感悟，支持 AI 辅助生成祷告文。
* **数据同步**：注册登录后，设置、高亮和笔记将在多端自动同步。


* **📱 移动端原生体验**
* 优化的移动端交互，支持手势操作（左滑、上滑、下滑）。
* 底部导航栏与沉浸式全屏阅读。



## 🛠️ 技术栈

* **前端框架**: [Next.js 14](https://nextjs.org/) (App Router)
* **编程语言**: TypeScript
* **样式库**: [Tailwind CSS](https://tailwindcss.com/)
* **UI 组件**: [Radix UI](https://www.radix-ui.com/) / Lucide React / Framer Motion (动画)
* **数据库 ORM**: [Prisma](https://www.prisma.io/)
* **数据库**: SQLite (默认) / PostgreSQL (生产环境推荐)
* **认证系统**: [NextAuth.js (Auth.js)](https://next-auth.js.org/)
* **状态管理**: Zustand
* **语音服务**: Python 脚本集成 (Edge-TTS 或其他)

---

## 🚀 安装与配置指南

你可以选择在本地电脑运行开发，或将其部署到服务器。

### 1. 环境准备

在开始之前，请确保你的环境已安装：

* **Node.js**: 版本 >= 18.17.0
* **Python**: 版本 >= 3.8 (用于 TTS 功能)
* **Git**

### 2. 获取代码

```bash
git clone https://github.com/your-username/scripture-ai.git
cd scripture-ai

```

### 3. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖 (用于语音生成)
# 建议创建虚拟环境，这里假设直接安装
pip install edge-tts

```

### 4. 配置环境变量

在项目根目录下创建一个 `.env` 文件，复制以下内容并根据实际情况修改：

```env
# 数据库连接 (默认使用本地 SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth 密钥 (必须设置！生成方式：openssl rand -base64 32)
AUTH_SECRET="your-super-secret-random-string"
NEXTAUTH_URL="http://localhost:3000"

# AI 服务配置 (根据你的 app/api/chat/route.ts 逻辑配置)
# 例如使用 OpenAI 或 兼容接口
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxx"
OPENAI_BASE_URL="https://api.openai.com/v1"

# 其他可能的配置...

```

### 5. 初始化数据库

本项目使用 Prisma 管理数据库。

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库结构 (这会自动创建 dev.db 文件)
npx prisma db push

```

### 6. 导入圣经数据 (Seeding)

为了让应用有内容可读，你需要运行种子脚本导入圣经文本。

```bash
# 导入完整数据 (如果提供了 seed_full.js)
node scripts/seed_full.js
node scripts/seed_full_kjv.js

```

### 7. 启动开发服务器

```bash
npm run dev

```

打开浏览器访问 [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) 即可看到应用。

---

## 🐳 使用 Docker 部署 (推荐)

如果你想在服务器上稳定运行，推荐使用 Docker。

### 前置条件

* 服务器已安装 Docker 和 Docker Compose。

### 部署步骤

1. **修改配置**：确保 `docker-compose.yml` 和 `.env` 文件存在。
2. **构建并启动**：
```bash
docker-compose up -d --build

```


3. **初始化数据** (首次运行时)：
进入容器并执行数据库迁移和数据填充：
```bash
# 进入容器
docker-compose exec web sh

# 执行数据库推送
npx prisma db push

# 填充数据
node scripts/seed_full.js
node scripts/seed_full_kjv.js

# 退出容器
exit

```



现在，应用应该运行在服务器的 `3000` 端口上。你可以配置 Nginx 进行反向代理以通过域名访问。

---

## 📖 使用说明

1. **注册/登录**: 点击右上角头像进行注册。登录后您的阅读进度和笔记将云端保存。
2. **阅读经文**: 点击目录侧边栏选择经卷和章节。
3. **使用 AI**:
* **选中经文**: 长按或鼠标划选经文，弹出菜单中点击 "AI 深度解读"。
* **Magic Ball**: 点击右下角的悬浮球，可以呼出侧边栏与 AI 对话。


4. **听圣经**: 点击顶部的播放按钮（移动端在“设置”面板中），系统将自动朗读当前章节。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库。
2. 创建一个新的分支 (`git checkout -b feature/AmazingFeature`)。
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)。
4. 推送到分支 (`git push origin feature/AmazingFeature`)。
5. 提交 Pull Request。

## 📄 版权说明

本项目开源代码遵循 [MIT License](https://www.google.com/search?q=LICENSE)。
*注意：本项目中包含的圣经文本（如和合本 CUV、KJV）版权情况请遵循各版本的相关规定。*

---

**Made with ❤️ for Disciple.**