# ----------------------------------------------------
# 优化后的 Dockerfile (利用缓存极限加速)
# ----------------------------------------------------

# 使用 Node 20
FROM node:20-alpine AS base

# 1. 全局基础环境：提前安装公用依赖，利用 Docker 分层缓存
# 把 openssl, python 和 edge-tts 放在 base，这样后面 deps, builder, runner 就不用重复安装了
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat python3 py3-pip openssl && \
    pip3 install edge-tts --break-system-packages -i https://mirrors.aliyun.com/pypi/simple/

# 2. 依赖安装阶段
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# 只要 package.json 不变，npm ci 就永远走缓存，瞬间完成
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm ci

# 3. Prisma 预生成阶段 (关键优化！)
FROM deps AS prisma-builder
WORKDIR /app
# 仅复制 prisma 目录。只要 schema 不变，这一步也是瞬间跳过
COPY prisma ./prisma
RUN export PRISMA_ENGINES_MIRROR=https://npmmirror.com/mirrors/prisma && \
    export PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma && \
    npx prisma generate

# 4. 业务代码构建阶段
FROM prisma-builder AS builder
WORKDIR /app
# 修改业务代码只会使得从这里开始的层失效
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_IGNORE_BUILD_ERRORS true
RUN npm run build

# 5. 运行阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# 复制 Next.js standalone 构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs scripts ./scripts

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]