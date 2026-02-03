FROM node:18-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 关键：在构建前生成 Prisma Client
RUN npx prisma generate

# 禁用遥测并构建
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ... (前文保持不变)

# 3. 运行阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# --- 新增开始：安装 Python3 和 edge-tts ---
# 安装 python3 和 pip
RUN apk add --no-cache python3 py3-pip
# 安装 edge-tts 库 (使用 --break-system-packages 允许在 alpine 中全局安装)
RUN pip3 install edge-tts --break-system-packages
# --- 新增结束 ---

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# --- 新增开始：复制 scripts 目录 ---
# 确保 Python 脚本被复制到运行镜像中
COPY --chown=nextjs:nodejs scripts ./scripts
# --- 新增结束 ---

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]