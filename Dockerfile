# 使用 Node 20
FROM node:20-alpine AS base

# [网络加速] 1. 替换 Alpine 系统的软件源为阿里云
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 1. 依赖安装阶段
FROM base AS deps
# 仅安装基础依赖，不再安装不存在的 openssl1.1-compat
RUN apk add --no-cache libc6-compat python3 py3-pip openssl

# [网络加速] 2. 配置 pip 国内源
RUN pip3 install edge-tts --break-system-packages -i https://mirrors.aliyun.com/pypi/simple/

WORKDIR /app
COPY package.json package-lock.json* ./

# [网络加速] 3. 配置 npm 国内源
RUN npm config set registry https://registry.npmmirror.com/
RUN npm ci

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建前生成 Prisma Client (此时会根据 schema 生成 musl-openssl-3.0.x 引擎)
RUN export PRISMA_ENGINES_MIRROR=https://npmmirror.com/mirrors/prisma
RUN export PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_IGNORE_BUILD_ERRORS true

RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# [修复] 仅安装系统必需的 openssl 和 python
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache python3 py3-pip openssl

RUN pip3 install edge-tts --break-system-packages -i https://mirrors.aliyun.com/pypi/simple/

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# 复制 Next.js standalone 构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs scripts ./scripts

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]