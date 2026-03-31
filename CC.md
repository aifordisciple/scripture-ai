# Scripture AI 系统 CentOS 7.9 部署指南

本文档详细说明如何在一台全新的 CentOS 7.9 服务器上部署 Scripture AI 圣经阅读应用。

---

## 目录

1. [系统要求](#1-系统要求)
2. [服务器初始化](#2-服务器初始化)
3. [安装 Docker](#3-安装-docker)
4. [安装 Docker Compose](#4-安装-docker-compose)
5. [安装 Git](#5-安装-git)
6. [克隆项目](#6-克隆项目)
7. [配置环境变量](#7-配置环境变量)
8. [启动服务](#8-启动服务)
9. [数据库初始化](#9-数据库初始化)
10. [导入圣经数据](#10-导入圣经数据)
11. [验证部署](#11-验证部署)
12. [配置域名与 HTTPS](#12-配置域名与-https)
13. [常见问题](#13-常见问题)

---

## 1. 系统要求

### 硬件要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 40 GB SSD | 100 GB SSD |

### 软件要求

- 操作系统: CentOS 7.9 (已测试)
- Docker: 20.10+
- Docker Compose: V2 (2.20+)
- Git: 2.x

### 网络端口

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Web 应用 | HTTP 访问端口 |
| 5432 | PostgreSQL | 数据库端口（可限制内网访问） |
| 80/443 | Nginx | 反向代理（可选） |

---

## 2. 服务器初始化

### 2.1 更新系统

```bash
# 更新所有软件包
sudo yum update -y

# 安装基础工具
sudo yum install -y vim wget curl unzip epel-release
```

### 2.2 配置时区

```bash
# 设置为上海时区
sudo timedatectl set-timezone Asia/Shanghai

# 验证
date
```

### 2.3 配置防火墙

```bash
# 开放必要端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=22/tcp

# 重载防火墙
sudo firewall-cmd --reload

# 查看已开放端口
sudo firewall-cmd --list-ports
```

### 2.4 关闭 SELinux（推荐）

```bash
# 临时关闭
sudo setenforce 0

# 永久关闭
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

# 验证
getenforce
```

---

## 3. 安装 Docker

CentOS 7.9 需要较新的 Docker 版本，建议使用 Docker 官方仓库安装。

### 3.1 安装依赖

```bash
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 3.2 添加 Docker 官方仓库

```bash
# 使用阿里云镜像加速（国内服务器推荐）
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 或使用官方仓库（海外服务器）
# sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

### 3.3 安装 Docker

```bash
# 安装 Docker CE
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 注意：CentOS 7.9 可能需要手动处理依赖，如果报错尝试：
# sudo yum install -y docker-ce docker-ce-cli containerd.io --nobest
```

### 3.4 启动 Docker

```bash
# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
# 预期输出: Docker version 24.x.x 或更高
```

### 3.5 配置 Docker 镜像加速（国内服务器）

```bash
# 创建配置目录
sudo mkdir -p /etc/docker

# 配置镜像加速
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker 生效
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 4. 安装 Docker Compose

### 方式一：通过 Docker 插件安装（推荐）

```bash
# Docker Compose 现已作为 Docker 插件提供
# 安装 docker-compose-plugin 时已自动安装

# 验证
docker compose version
# 预期输出: Docker Compose version v2.x.x
```

### 方式二：手动安装（备选）

```bash
# 下载最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 创建软链接
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证
docker-compose --version
```

---

## 5. 安装 Git

```bash
# CentOS 7 默认 Git 版本较旧，建议使用 IUS 仓库安装新版本
sudo yum install -y https://repo.ius.io/ius-release-el7.rpm
sudo yum install -y git236

# 或使用默认版本
# sudo yum install -y git

# 验证
git --version
```

### 配置 Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 6. 克隆项目

### 6.1 创建项目目录

```bash
# 创建工作目录
sudo mkdir -p /opt/apps
sudo chown -R $USER:$USER /opt/apps
cd /opt/apps
```

### 6.2 克隆代码

```bash
# 克隆项目（使用 SSH 或 HTTPS）
git clone git@github.com:aifordisciple/scripture-ai.git

# 或使用 HTTPS
# git clone https://github.com/aifordisciple/scripture-ai.git

cd scripture-ai
```

---

## 7. 配置环境变量

### 7.1 创建环境变量文件

```bash
# 复制示例文件（如果有）
cp .env.example .env.local 2>/dev/null || true

# 创建新的环境变量文件
cat > .env.local << 'EOF'
# ============================================
# 数据库配置
# ============================================
DATABASE_URL="postgresql://scripture_user:YOUR_STRONG_PASSWORD@db:5432/scripture_db"

# ============================================
# AI 服务配置
# ============================================
# AI 提供商: openai | deepseek | ollama | cloud
AI_PROVIDER=openai

# OpenAI 配置（或兼容 API）
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

# DeepSeek 配置（如果使用 DeepSeek）
# DEEPSEEK_API_KEY=sk-your-deepseek-key

# Ollama 配置（如果使用本地 Ollama）
# OLLAMA_MODEL=llama2

# ============================================
# 向量嵌入配置（可选）
# ============================================
# EMBEDDING_BASE_URL=http://localhost:11434/v1
# IMAGE_EMBEDDING_MODEL=bge-m3

# ============================================
# 认证配置
# ============================================
# 生成方法: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-here-replace-this"

# 生产环境域名
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-domain.com

# ============================================
# 其他配置（可选）
# ============================================
# NODE_ENV=production
EOF
```

### 7.2 生成密钥

```bash
# 生成 AUTH_SECRET
openssl rand -base64 32

# 将生成的值替换到 .env.local 中的 AUTH_SECRET
```

### 7.3 修改数据库密码

编辑 `.env.local` 和 `docker-compose.yml` 中的数据库密码，确保一致：

```yaml
# docker-compose.yml 中的数据库配置
environment:
  POSTGRES_USER: scripture_user
  POSTGRES_PASSWORD: YOUR_STRONG_PASSWORD  # 修改为强密码
  POSTGRES_DB: scripture_db
```

---

## 8. 启动服务

### 8.1 首次构建启动

```bash
cd /opt/apps/scripture-ai

# 构建并启动（首次运行或代码更新后）
docker compose up -d --build

# 查看构建日志
docker compose logs -f web
```

### 8.2 验证容器状态

```bash
# 查看运行中的容器
docker compose ps

# 预期输出:
# NAME           IMAGE           STATUS         PORTS
# scripture-ai   scripture-ai    Up 2 minutes   0.0.0.0:3000->3000/tcp
# scripture-db   pgvector/pg... Up 2 minutes   0.0.0.0:5432->5432/tcp
```

---

## 9. 数据库初始化

### 9.1 进入容器执行命令

```bash
# 进入 web 容器
docker compose exec web sh

# 在容器内执行以下命令
```

### 9.2 生成 Prisma 客户端

```bash
# 生成 Prisma 客户端
npx prisma generate
```

### 9.3 推送数据库 Schema

```bash
# 创建数据库表结构
npx prisma db push

# 预期输出:
# Your database is now in sync with your Prisma schema.
```

### 9.4 退出容器

```bash
exit
```

---

## 10. 导入圣经数据

### 10.1 导入中文和合本 (CUV)

```bash
# 进入容器
docker compose exec web sh

# 导入中文圣经
node scripts/seed_full.js

# 等待导入完成（约 1-3 分钟）
# 预期输出: Successfully seeded CUV Bible data
```

### 10.2 导入英文 KJV（可选）

```bash
# 导入英文圣经
node scripts/seed_full_kjv.js

# 退出容器
exit
```

---

## 11. 验证部署

### 11.1 健康检查

```bash
# 检查应用是否响应
curl http://localhost:3000

# 预期输出: HTML 内容
```

### 11.2 检查数据库连接

```bash
# 进入容器检查数据库
docker compose exec web sh

# 测试数据库连接
npx prisma db pull

# 退出
exit
```

### 11.3 访问应用

打开浏览器访问:
- HTTP: `http://YOUR_SERVER_IP:3000`
- 如配置了域名: `https://your-domain.com`

---

## 12. 配置域名与 HTTPS

### 12.1 安装 Nginx（反向代理）

```bash
# 安装 Nginx
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 12.2 配置 Nginx 反向代理

```bash
# 创建配置文件
sudo tee /etc/nginx/conf.d/scripture-ai.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

### 12.3 安装 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo yum install -y certbot python2-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示输入邮箱并同意条款

# 设置自动续期
sudo systemctl enable certbot-renew.timer
```

### 12.4 更新环境变量

```bash
# 更新 .env.local 中的域名
NEXTAUTH_URL=https://your-domain.com

# 重启服务
docker compose restart web
```

---

## 13. 常见问题

### Q1: Docker 启动失败 - "permission denied"

```bash
# 将当前用户加入 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker
```

### Q2: 数据库连接失败

```bash
# 检查数据库容器是否运行
docker compose ps db

# 查看数据库日志
docker compose logs db

# 确保 .env.local 中的 DATABASE_URL 使用容器服务名
# 正确格式: postgresql://user:pass@db:5432/scripture_db
# 注意: @ 后面是 "db" 而不是 "localhost"
```

### Q3: 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000

# 或
sudo lsof -i :3000

# 停止占用端口的进程
sudo kill -9 <PID>
```

### Q4: 容器内存不足

```bash
# 查看 Docker 资源使用
docker stats

# 限制容器内存（修改 docker-compose.yml）
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Q5: 构建超时或网络问题

```bash
# 使用国内镜像源
# 在 Dockerfile 中已有阿里云镜像配置

# 或手动拉取镜像
docker pull node:20-alpine
docker pull pgvector/pgvector:pg16
```

### Q6: 数据库数据丢失

```bash
# 确保 pgdata 目录存在且有正确权限
ls -la pgdata/

# 备份数据库
docker compose exec db pg_dump -U scripture_user scripture_db > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T db psql -U scripture_user scripture_db
```

### Q7: 更新代码后如何重新部署

```bash
# 拉取最新代码
git pull origin main


保存本地修改到进度列表：

Bash
git stash
拉取远程代码：

Bash
git pull origin main
恢复本地修改（此时可能会触发冲突，需要手动合并）：

Bash
git stash pop



# 重新构建并启动
docker compose down
docker compose up -d --build

# 如果数据库 schema 有变化，需要执行
docker compose exec web npx prisma generate
docker compose exec web npx prisma db push
```

### Q8: 查看 API 日志

```bash
# 实时查看日志
docker compose logs -f web

# 查看最近 100 行
docker compose logs --tail 100 web

# 查看数据库日志
docker compose logs --tail 100 db
```

---

## 快速命令参考

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重新构建
docker compose up -d --build

# 查看日志
docker compose logs -f web

# 进入容器
docker compose exec web sh

# 数据库操作
docker compose exec web npx prisma db push
docker compose exec web npx prisma generate

# 导入圣经数据
docker compose exec web node scripts/seed_full.js
docker compose exec web node scripts/seed_full_kjv.js
```

---

## 附录：完整的初始化脚本

将以下脚本保存为 `deploy.sh`，一键执行部署：

```bash
#!/bin/bash
set -e

echo "=== Scripture AI 部署脚本 ==="

# 配置变量
PROJECT_DIR="/opt/apps/scripture-ai"
DB_USER="scripture_user"
DB_PASS=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)
AUTH_SECRET=$(openssl rand -base64 32)
DOMAIN=${1:-"localhost"}

echo "数据库密码: $DB_PASS"
echo "Auth Secret: $AUTH_SECRET"

# 更新 docker-compose.yml 中的数据库密码
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASS/" docker-compose.yml

# 创建 .env.local
cat > .env.local << EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@db:5432/scripture_db"
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
AUTH_SECRET="$AUTH_SECRET"
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://$DOMAIN:3000
EOF

echo "请编辑 .env.local 配置你的 API Key"

# 构建启动
docker compose up -d --build

echo "等待服务启动..."
sleep 30

# 初始化数据库
docker compose exec web npx prisma generate
docker compose exec web npx prisma db push

echo "=== 部署完成 ==="
echo "访问: http://$DOMAIN:3000"
echo "请记得: 1) 配置 OPENAI_API_KEY  2) 导入圣经数据"
```

使用方法：
```bash
chmod +x deploy.sh
./deploy.sh your-domain.com
```

---

**部署完成后，请务必：**

1. ✅ 修改数据库默认密码
2. ✅ 配置 AI API 密钥
3. ✅ 修改 AUTH_SECRET 为随机值
4. ✅ 配置正确的 NEXTAUTH_URL
5. ✅ 配置 HTTPS（生产环境必需）
6. ✅ 导入圣经数据