# 新服务器部署指南

本文档记录将 scripture-ai 部署到一台全新服务器所需的完整操作步骤。

---

## 前置要求

| 项目 | 要求 |
|------|------|
| OS | Linux (推荐 Ubuntu 22.04+) 或 macOS |
| Docker | Docker Engine 20.10+ |
| Docker Compose | v2+ (随 Docker Desktop 安装) |
| Git | 任意版本 |
| 磁盘空间 | >= 5GB (镜像 + 数据库 + 圣经数据) |
| 内存 | >= 2GB |
| 网络 | 能访问 GitHub 和 Docker Hub (国内需配置镜像加速) |

---

## 1. 克隆代码

```bash
git clone git@github.com:aifordisciple/scripture-ai.git
cd scripture-ai
```

---

## 2. 配置环境变量

```bash
cp .env .env.local
```

编辑 `.env.local`，**必须逐项检查并修改**以下变量：

### 必须修改（否则服务无法启动）

| 变量 | 说明 | 示例 | 备注 |
|------|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:password@localhost:5432/scripture_db` | 本地开发用 `localhost`，Docker 内部用 `db` |
| `AUTH_SECRET` | NextAuth 加密密钥 | 用 `openssl rand -base64 32` 生成 | **每台服务器必须不同**，否则 session 互斥 |
| `NEXTAUTH_URL` | 服务器对外地址 | `http://你的IP:3000` 或 `https://your.domain` | 必须与浏览器访问地址一致 |
| `AUTH_TRUST_HOST` | 信任非 localhost | `true` | 非本地部署必须设为 `true` |

### AI 功能配置（按需选择一种）

**方案 A: 云端 API（推荐）**

| 变量 | 说明 |
|------|------|
| `AI_PROVIDER` | 设为 `cloud` |
| `OPENAI_API_KEY` | 你的 API Key |
| `OPENAI_BASE_URL` | API 端点地址 |
| `OLLAMA_MODEL` | 模型名称 |

**方案 B: Ollama 本地模型**

| 变量 | 说明 |
|------|------|
| `AI_PROVIDER` | 设为 `ollama` |
| `OPENAI_BASE_URL` | `http://host.docker.internal:11434/v1` (Docker 内访问宿主机) |
| `OLLAMA_MODEL` | 已下载的模型名，如 `qwen3:8b` |

**方案 C: DeepSeek**

| 变量 | 说明 |
|------|------|
| `AI_PROVIDER` | 设为 `deepseek` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | DeepSeek 端点（可选） |

### 可选配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SMTP_HOST` | 邮件服务器（通知功能） | 无（未配置时邮件功能静默跳过） |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | 无 |
| `SMTP_PASS` | SMTP 密码 | 无 |
| `EMBEDDING_BASE_URL` | 向量模型端点 | `http://host.docker.internal:11434/v1` |
| `IMAGE_EMBEDDING_MODEL` | 向量模型名 | `bge-m3` |

### Docker Compose 环境变量覆盖

`docker-compose.yml` 中的 `environment` 字段会**覆盖** `.env.local` 中的同名变量：

```yaml
environment:
  - DATABASE_URL=postgresql://user:password@db:5432/scripture_db  # 容器内用服务名 db
  - AUTH_TRUST_HOST=true
```

**重要**：容器内 `DATABASE_URL` 的 host 必须是 `db`（Docker 服务名），不是 `localhost`。

---

## 3. 启动 Docker 容器

```bash
docker-compose up -d --build
```

首次构建约 5-10 分钟，后续增量构建约 1-2 分钟。

验证容器状态：

```bash
docker-compose ps
# 期望：web = Up, db = Up (healthy)
```

查看日志：

```bash
docker-compose logs web --tail=30
# 期望：看到 "Ready in XXXms"
```

---

## 4. 初始化数据库表结构

**这一步不可跳过**，否则所有 API 请求都会返回 500。

```bash
docker-compose exec web npx prisma db push
```

验证表已创建：

```bash
docker-compose exec db psql -U user -d scripture_db -c "\dt"
# 应列出 30+ 张表
```

---

## 5. 导入圣经数据

**必须执行**，否则首页无经文内容。

```bash
# 导入中文和合本 (CUV) — 必须执行
docker-compose exec web node scripts/seed_full.js

# 导入英文 KJV — 如需双语支持则执行
docker-compose exec web node scripts/seed_full_kjv.js
```

验证数据已导入：

```bash
docker-compose exec db psql -U user -d scripture_db -c "SELECT COUNT(*) FROM bible_verses;"
# CUV: ~31102 节，KJV: ~31102 节
```

### 可选：导入地图/时间线/主题数据

```bash
# 圣经地图事件
docker-compose exec web node scripts/seed_events.js

# 圣经旅程路线
docker-compose exec web node scripts/seed_journeys.js

# 主题网络图（扩展版）
docker-compose exec web node scripts/seed_themes_extended.js

# 主题-经文关联
docker-compose exec web node scripts/seed_theme_verses.js

# 主题间关联
docker-compose exec web node scripts/seed_theme_connections.js
```

### 可选：生成经文向量（用于串珠/关联搜索）

需要宿主机运行 Ollama 且已下载 `bge-m3` 模型：

```bash
# 在宿主机安装 Ollama + bge-m3
ollama pull bge-m3

# 在容器内执行向量生成脚本
docker-compose exec web npx tsx scripts/generate-embeddings.ts
```

---

## 6. 创建管理员账户

目前系统仅支持 Credentials (邮箱+密码) 登录，无自动注册页面。

### 方式 A：通过 Prisma Studio 创建

```bash
docker-compose exec web npx prisma studio
# 浏览器访问 http://localhost:5555
# 在 User 表中手动添加记录，password 字段填入 bcrypt 哈希值
```

生成 bcrypt 哈希：

```bash
docker-compose exec web node -e "
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('你的密码', 10);
  console.log(hash);
"
```

### 方式 B：通过注册 API 创建

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"你的密码","name":"管理员"}'
```

### 设置管理员角色

```bash
docker-compose exec db psql -U user -d scripture_db -c \
  "UPDATE \"User\" SET role='admin' WHERE email='admin@example.com';"
```

---

## 7. 验证部署完整性

逐项验证所有核心功能：

```bash
# 1. 页面可访问
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 期望: 200

# 2. 同步接口返回 401 (未登录) 而非 500
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/user/sync
# 期望: 401 (不是 500)

# 3. 圣经数据存在
curl -s http://localhost:3000/api/bible?bookId=Gen&chapter=1 | head -c 200
# 期望: JSON 数据包含经文内容

# 4. TTS 功能 (需 edge-tts)
curl -s -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试"}' -o /tmp/tts-test.mp3
# 期望: 生成 mp3 文件

# 5. 数据库连接正常
docker-compose exec db psql -U user -d scripture_db -c "SELECT 1;"
# 期望: 返回 1
```

---

## 8. 生产环境优化（可选）

### Nginx 反向代理 + HTTPS

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

配置后修改 `.env.local`：

```bash
NEXTAUTH_URL=https://your.domain
AUTH_TRUST_HOST=true
```

### Docker Compose 生产配置建议

修改 `docker-compose.yml`：

- 移除 `ports: "5432:5432"` (不暴露数据库端口到外网)
- 移除 `ports: "3000:3000"` (仅通过 Nginx 访问)
- 添加 `logging` 配置防止日志膨胀

---

## 从旧服务器迁移数据（保留用户数据）

如果需要保留旧服务器的用户数据（高亮、笔记、读经计划等）：

```bash
# 旧服务器：导出数据库
docker-compose exec db pg_dump -U user scripture_db > backup.sql

# 新服务器：导入数据库（在执行 prisma db push 之后）
cat backup.sql | docker-compose exec -T db psql -U user scripture_db

# 导入后重新同步 Prisma 客户端
docker-compose exec web npx prisma generate
```

**注意**：导入旧数据后不需要再执行 seed 脚本，因为圣经经文已在 backup.sql 中。

---

## 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `/api/user/sync` 返回 500 | 数据库表未创建 | `docker-compose exec web npx prisma db push` |
| 登录后同步报错 `SyntaxError` | AUTH_SECRET 与旧环境不同导致 session 无效 | 清除浏览器 cookie，重新登录 |
| 首页空白无经文 | 未执行 seed 脚本 | `docker-compose exec web node scripts/seed_full.js` |
| AI 功能不可用 | AI_PROVIDER/API Key 未配置 | 检查 `.env.local` 中 AI 相关变量 |
| 数据库连接失败 | DATABASE_URL host 不是 `db` | Docker 内网络用服务名 `db`，不是 `localhost` |
| TTS 语音不可用 | 容器内缺少 edge-tts | Dockerfile 已内置安装，确认用 `docker-compose up --build` 重建 |
| 容器启动后立即退出 | `.env.local` 缺少必要变量 | 检查 AUTH_SECRET、DATABASE_URL 是否已填写 |
| pgvector 扩展未安装 | 使用了普通 PostgreSQL 镜像 | 必须使用 `pgvector/pgvector:pg16` 镜像 |
| 向量搜索不工作 | 未生成 embedding 数据 | 执行 `generate-embeddings.ts` 脚本 |
| 端口冲突 | 3000/5432 被占用 | 修改 `docker-compose.yml` 的 ports 映射 |
| 构建超时 | npm 镜像源不通 | Dockerfile 已配置 npmmirror，国内网络应正常 |

---

## 部署检查清单

部署完成后逐项确认：

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