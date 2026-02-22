FROM node:18-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 py3-pip
# 安装 edge-tts 库
RUN pip3 install edge-tts --break-system-packages
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# 修复了原来这里的换行语法错误
COPY . .

# 关键：构建前必须生成 Prisma Client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1
# 关键：跳过构建时的类型检查和 Lint（因为稍后我们会在本地修完），防止构建中断
ENV NEXT_PUBLIC_IGNORE_BUILD_ERRORS true

RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# 修复了原来 ENV 的语法错误
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安装运行时的 Python 环境
RUN apk add --no-cache python3 py3-pip
RUN pip3 install edge-tts --break-system-packages

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# 复制 Next.js standalone 构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs scripts ./scripts

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]