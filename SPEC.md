# SPEC: 经文卡片定制功能全面升级

## 1. Objective

### 目标
将现有的经文卡片（ShareCard）从简单的客户端截图工具升级为专业级的经文图片生成器，支持多分辨率输出、多图库来源、服务端渲染、AI 全套生成、模板收藏与历史同步。

### 目标用户
- **日常读经用户**：快速生成社交媒体分享图（微信朋友圈、Instagram）
- **教会服事人员**：制作讲道PPT背景、周报插图
- **内容创作者**：批量生成不同尺寸的经文壁纸

### 核心价值
1. **一次编辑，多端输出** — 同一张卡片可导出为手机壁纸、桌面壁纸、社交分享图等
2. **丰富图库** — 从3个来源（Picsum/Bing/Unsplash）按关键词搜索背景
3. **专业品质** — 服务端 Satori 渲染，像素级精确，字体无缺失
4. **AI 加持** — 一键生成完整卡片（背景+配色+标题+布局+字体）
5. **模板复用** — 收藏喜欢的配置，跨设备同步

### 验收标准
- [ ] 支持 6 种预设分辨率 + 自定义宽高输入
- [ ] Picsum 随机图库集成（按分类浏览）
- [ ] Bing 每日壁纸 + 图片搜索集成
- [ ] Unsplash 关键词搜索集成
- [ ] 服务端 Satori 渲染替代客户端 html-to-image
- [ ] 所有 10 种布局模式在服务端完整支持
- [ ] AI 全套生成（背景+配色+标题+布局+字体推荐）
- [ ] 模板收藏（本地优先 + 登录同步）
- [ ] 生成历史记录（本地优先 + 登录同步）
- [ ] Web Share API 集成
- [ ] QR 码水印选项
- [ ] 中英文 i18n 完整覆盖

---

## 2. Commands

### 开发命令
```bash
npm run dev                    # 开发服务器 (port 3000)
npm run build                  # 生产构建
npx prisma generate            # 生成 Prisma client
npx prisma db push             # 推送 schema 变更
docker-compose up -d --build   # Docker 重建
```

### 测试命令
```bash
npm run lint                   # ESLint 检查
```

### 部署命令
```bash
./auto_deploy.sh -s "feat: 经文卡片升级" -d "详细说明"
```

---

## 3. Project Structure

### 新增文件

```
app/api/
├── card-image/route.tsx           # 重写：服务端渲染（支持多分辨率+完整布局）
├── card-theme/route.ts            # 重写：AI 全套生成（背景+配色+标题+布局+字体）
├── card-template/route.ts         # 新增：模板 CRUD（收藏/列表/删除）
├── card-history/route.ts          # 新增：生成历史 CRUD
├── proxy/route.ts                 # 扩展：增加 Picsum/Bing/Unsplash 域名白名单
├── picsum/route.ts                # 新增：Picsum 图片代理+分类列表
├── bing-wallpaper/route.ts        # 新增：Bing 每日壁纸 + 搜索代理
└── unsplash-search/route.ts       # 新增：Unsplash 关键词搜索代理

components/bible/
├── ShareCard.tsx                  # 重写：全面升级的主组件（精简为容器）
├── share-card/
│   ├── CardPreview.tsx            # 新增：卡片实时预览（客户端轻量预览）
│   ├── ResolutionPicker.tsx       # 新增：分辨率选择器（预设+自定义）
│   ├── BackgroundPicker.tsx       # 新增：背景选择器（图库+渐变+上传）
│   ├── TextStylePanel.tsx         # 新增：文字样式面板
│   ├── LayoutPicker.tsx           # 新增：布局选择器
│   ├── AIGeneratePanel.tsx        # 新增：AI 一键生成面板
│   ├── TemplatePanel.tsx          # 新增：模板收藏面板
│   ├── HistoryPanel.tsx           # 新增：历史记录面板
│   ├── QRWatermark.tsx            # 新增：QR 码水印组件
│   └── ShareActions.tsx           # 新增：分享/下载操作栏
│
lib/
├── card-presets.ts                # 新增：分辨率预设、渐变预设、字体选项等常量
├── card-renderer.ts               # 新增：服务端渲染参数构建工具
└── i18n/
    ├── zh/shareCard.ts            # 扩展：新增翻译键
    └── en/shareCard.ts            # 扩展：新增翻译键

store/
├── slices.ts                      # 扩展：新增 ShareSlice（卡片编辑状态）
└── types.ts                       # 扩展：新增 ShareSlice 类型
```

### 修改文件

```
prisma/schema.prisma               # 新增 CardTemplate + CardHistory 模型
app/api/proxy/route.ts             # 扩展白名单域名
package.json                       # 移除 html2canvas 僵尸依赖
```

---

## 4. Code Style

### TypeScript 严格模式
- 无 `as any`、`@ts-ignore`
- 所有组件 Props 使用 `interface` 定义
- API 请求/响应使用 Zod schema 验证

### 不可变状态更新
```typescript
// 正确：使用展开运算符
setTemplates(prev => [...prev, newTemplate]);

// 错误：直接修改
templates.push(newTemplate);
```

### 组件拆分原则
- 每个文件 < 400 行
- 单一职责：一个组件只做一件事
- Props 向下传递，状态提升到 ShareSlice

### API 路由规范
- 所有外部图片必须通过 `/api/proxy` 代理（SSRF 防护）
- 响应格式：`{ success: boolean, data?: T, error?: string }`
- 错误处理：显式 try-catch，不吞异常

### i18n 规范
- 所有用户可见文本必须通过 `useTranslation()` 获取
- 新增键同时更新 zh/ 和 en/ 两个文件
- 键名格式：`shareCard.<feature>.<detail>`

---

## 5. Testing Strategy

### 单元测试（覆盖率目标 80%）
- `lib/card-presets.ts` — 预设数据验证
- `lib/card-renderer.ts` — 渲染参数构建逻辑
- 各 Picker 组件的交互逻辑

### 集成测试
- `/api/card-image` — 服务端渲染输出验证（不同分辨率、布局模式）
- `/api/card-theme` — AI 生成结果格式验证
- `/api/proxy` — 域名白名单、SSRF 防护
- `/api/picsum`、`/api/bing-wallpaper`、`/api/unsplash-search` — 图库代理
- `/api/card-template`、`/api/card-history` — CRUD 操作

### E2E 测试（Playwright）
- 完整的卡片生成流程：选经文 → 选背景 → 调样式 → 生成 → 下载
- 分辨率切换：验证输出图片尺寸正确
- AI 一键生成：验证生成结果完整
- 模板收藏：保存 → 刷新 → 验证持久化

---

## 6. Boundaries

### Always Do（必须做）
- 所有外部图片请求必须通过 `/api/proxy` 代理，维护域名白名单
- 服务端渲染使用 Satori（`@vercel/og`），不使用 Puppeteer 等重量级方案
- 新增 API 端点必须包含错误处理和输入验证
- 所有用户可见文本必须 i18n
- Prisma 模型变更必须通过 `npx prisma db push` 同步

### Ask First（先确认）
- 新增第三方 API Key（如 Bing Image Search API Key）— 需确认环境变量配置方式
- 修改现有 Zustand store 的 slice 结构 — 可能影响其他组件
- 更改 Dialog/Modal 的打开/关闭逻辑 — 可能影响 FloatingMenu 等触发点
- 新增 npm 依赖 — 需评估包大小和安全性

### Never Do（绝不做）
- 不在客户端直接请求外部图库 API（必须走服务端代理）
- 不在源码中硬编码 API Key
- 不使用 `html2canvas`（已废弃，统一用 Satori）
- 不修改 `FloatingMenu.tsx` 的触发逻辑（只扩展 `openShareModal` 的参数）
- 不删除现有的 10 种布局模式
- 不破坏桌面端（Tauri）的 ShareCard 兼容性

---

## 7. Feature Specifications

### 7.1 分辨率定制

#### 预设模板
| 名称 | 宽 x 高 | 用途 |
|------|---------|------|
| 手机壁纸 | 1080 x 1920 | iPhone/Android 锁屏 |
| 平板壁纸 | 1536 x 2048 | iPad 锁屏 |
| 桌面壁纸 | 1920 x 1080 | PC 桌面 (16:9) |
| 社交卡片 | 1080 x 1440 | 微信朋友圈/小红书 (3:4) |
| 正方形 | 1080 x 1080 | Instagram 帖子 |
| 微信头像 | 640 x 640 | 头像尺寸 |

#### 自定义输入
- 宽度输入框：范围 320-3840px
- 高度输入框：范围 320-3840px
- 宽高比锁定开关（默认开启）
- 常用宽高比快捷按钮：1:1, 3:4, 9:16, 16:9, 4:3

#### 实现要点
- 预览区域根据选定分辨率动态调整宽高比
- 服务端渲染时使用用户选择的实际分辨率
- 预览使用缩放适配（保持宽高比，fit 到预览容器内）

### 7.2 在线图库

#### Picsum Photos
- **随机浏览**：按分类（Nature/City/People/Tech 等）获取随机图片
- **按 ID 获取**：支持指定图片 ID（高级用户）
- **API**：`https://picsum.photos/v2/list?page=1&limit=30`
- **图片 URL**：`https://picsum.photos/id/{id}/1080/1920`
- **代理**：通过 `/api/picsum` 代理，域名白名单添加 `picsum.photos`
- **无需 API Key**

#### Bing 壁纸
- **每日壁纸**：`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8`
  - 获取最近 8 天的 Bing 每日壁纸
  - 无需 API Key
- **图片搜索**：Bing Image Search API（需 `BING_SEARCH_API_KEY` 环境变量）
  - 用户输入关键词（如"山"、"海"、"日落"）
  - 返回缩略图列表供选择
  - 代理：通过 `/api/bing-wallpaper` 代理
- **降级策略**：无 API Key 时只显示每日壁纸，隐藏搜索入口

#### Unsplash 搜索
- **关键词搜索**：用户输入关键词搜索 Unsplash 图片
- **API**：使用 Unsplash Search API（需 `UNSPLASH_ACCESS_KEY` 环境变量）
  - 搜索端点：`https://api.unsplash.com/search/photos?query={keyword}&per_page=12`
- **保留现有预设**：11 张精选 Unsplash 图片保留
- **代理**：通过 `/api/unsplash-search` 代理
- **降级策略**：无 API Key 时只显示预设图片，隐藏搜索入口

#### 图库 UI 设计
- 新增"在线图库"标签页（在"精选美图"和"简约渐变"之间）
- 三个图库来源以 Tab 切换：Picsum / Bing / Unsplash
- 每个图库显示缩略图网格（3列），点击加载大图
- 搜索框在 Bing 和 Unsplash Tab 下显示
- 加载状态：骨架屏 + 加载动画
- 分页：滚动加载更多

### 7.3 服务端渲染（全面切换）

#### 架构变更
- **移除**客户端 `html-to-image`（`toPng`）生成方式
- **使用**服务端 `/api/card-image`（Satori）作为唯一渲染引擎
- **客户端预览**：保留 DOM 预览用于实时编辑反馈，但最终输出走服务端

#### 服务端渲染增强
1. **支持所有 10 种布局模式**：补充 `frame`、`magazine`、`stamp` 三种布局的服务端实现
2. **多分辨率输出**：根据用户选择的分辨率动态设置 `width`/`height`
3. **多字体支持**：加载 `NotoSerifSC-Bold.otf`、`NotoSansSC-Bold.ttf`、`KaiTi`（如可用）
4. **Base64 图片传入**：客户端先将选中图片通过 proxy 转为 Base64，再 POST 给服务端

#### 渲染流程
```
用户点击"生成" → 客户端收集所有参数 → POST /api/card-image → 服务端 Satori 渲染 → 返回 PNG blob → 客户端展示/下载
```

#### API 参数扩展
```typescript
interface CardImageRequest {
  // 内容
  verseContent: string[];
  bookName: string;
  chapter: string;
  verseRange: string;

  // 分辨率（新增）
  width: number;       // 输出宽度（px）
  height: number;      // 输出高度（px）

  // 背景
  bgImage?: string;    // Base64 data URL
  bgGradient?: string; // CSS linear-gradient

  // 布局
  layoutMode: LayoutMode; // 全部10种

  // 文字
  textColor: string;
  infoColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  fontFamily: string;  // 新增：字体选择

  // AI 标题（新增）
  aiTitle?: string;

  // QR 码（新增）
  qrCodeUrl?: string;  // 生成 QR 码的 URL
  qrCodePosition?: 'bottom-left' | 'bottom-right' | 'none';
}
```

### 7.4 AI 全套生成

#### 升级 `/api/card-theme`
现有接口只返回 `title` + `gradient`，升级为返回完整卡片配置：

```typescript
interface AICardThemeResponse {
  title: string;           // 4-8字标题
  gradient: string;        // CSS gradient
  layoutMode: LayoutMode;  // 推荐布局
  fontFamily: string;      // 推荐字体
  textColor: string;       // 推荐文字颜色
  infoColor: string;       // 推荐信息颜色
  fontSize: number;        // 推荐字号
  textAlign: 'left' | 'center' | 'right';
  bgSearchQuery?: string;  // 推荐搜索关键词（用于图库搜索）
}
```

#### AI 生成流程
1. 用户点击"AI 一键生成"按钮
2. 前端发送经文内容到 `/api/card-theme`
3. AI 返回完整配置
4. 前端应用配置到编辑器
5. 如果返回了 `bgSearchQuery`，自动搜索图库并应用第一张图
6. 用户可在此基础上微调

#### AI 面板 UI
- 大按钮"AI 一键生成"
- 生成中显示加载动画 + "AI 正在创作..."
- 生成后显示"已应用 AI 推荐"提示，可一键撤销

### 7.5 模板收藏

#### Prisma 模型
```prisma
model CardTemplate {
  id          String   @id @default(cuid())
  userId      String?  // 关联用户（可选，未登录为 null）
  name        String   // 模板名称
  config      Json     // 完整卡片配置 JSON
  thumbnail   String?  // 缩略图 Base64
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

#### 存储策略
- **未登录用户**：模板保存到 `localStorage`，key: `scripture-card-templates`
- **已登录用户**：模板保存到数据库，同时缓存到 `localStorage`
- **登录时同步**：将 localStorage 中的模板上传到数据库，合并去重
- **读取优先级**：先读 localStorage 缓存，登录用户异步同步数据库

#### 模板操作
- **保存当前配置为模板**：弹出命名对话框
- **应用模板**：一键恢复所有配置
- **删除模板**：确认后删除
- **模板缩略图**：保存时自动生成小尺寸预览

### 7.6 生成历史

#### Prisma 模型
```prisma
model CardHistory {
  id          String   @id @default(cuid())
  userId      String?  // 关联用户（可选）
  config      Json     // 使用的配置
  imageUrl    String?  // 生成的图片 URL（临时存储）
  resolution  String   // 如 "1080x1920"
  createdAt   DateTime @default(now())
  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}
```

#### 存储策略
- 与模板相同的本地优先 + 登录同步策略
- 历史记录保留最近 50 条
- 图片使用 Base64 存储在 localStorage（限制 5MB），数据库只存配置

### 7.7 Web Share API 集成

#### 实现要点
- 检测 `navigator.share` 支持
- 支持时显示"分享"按钮，调用 `navigator.share({ title, text, files: [imageFile] })`
- 不支持时显示"下载"按钮（现有行为）
- 同时提供"复制到剪贴板"选项（`navigator.clipboard.write`）

### 7.8 QR 码水印

#### 实现要点
- 可选功能，默认关闭
- 开启后，在卡片底部角落添加 QR 码
- QR 码内容：当前经文的引用 URL（如 `https://app.example.com/genesis/1/1`）
- QR 码大小：根据卡片分辨率自适应（约 80x80px 在 1080 宽度下）
- 位置选项：左下角 / 右下角 / 关闭
- 服务端渲染时使用 `qrcode` 包生成 QR 码图片，嵌入 Satori JSX

---

## 8. Implementation Phases

### Phase 1: 基础架构重构
1. 创建 `lib/card-presets.ts`（分辨率预设、常量提取）
2. 创建 `lib/card-renderer.ts`（服务端渲染参数构建）
3. 扩展 Zustand ShareSlice
4. 拆分 ShareCard.tsx 为子组件

### Phase 2: 服务端渲染升级
1. 重写 `/api/card-image/route.tsx`（多分辨率 + 全布局 + 多字体）
2. 扩展 `/api/proxy/route.ts`（新增域名白名单）
3. 新增 `/api/picsum/route.ts`
4. 新增 `/api/bing-wallpaper/route.ts`
5. 新增 `/api/unsplash-search/route.ts`
6. 客户端切换到服务端渲染

### Phase 3: 分辨率 + 图库 UI
1. 实现 `ResolutionPicker.tsx`
2. 实现 `BackgroundPicker.tsx`（含图库搜索）
3. 更新 `CardPreview.tsx`（动态宽高比预览）

### Phase 4: AI + 高级功能
1. 重写 `/api/card-theme/route.ts`（全套 AI 生成）
2. 实现 `AIGeneratePanel.tsx`
3. 实现 `QRWatermark.tsx`
4. 实现 `ShareActions.tsx`（Web Share API）

### Phase 5: 模板 + 历史
1. Prisma 模型迁移
2. 新增 `/api/card-template/route.ts`
3. 新增 `/api/card-history/route.ts`
4. 实现 `TemplatePanel.tsx`
5. 实现 `HistoryPanel.tsx`
6. 本地优先 + 登录同步逻辑

### Phase 6: i18n + 测试 + 清理
1. 扩展 i18n 翻译
2. 移除 `html2canvas` 依赖
3. 单元测试 + 集成测试
4. Docker 构建验证 + 部署

---

## 9. Environment Variables

| 变量 | 用途 | 必需 |
|------|------|------|
| `BING_SEARCH_API_KEY` | Bing 图片搜索 API | 否（降级为仅每日壁纸） |
| `UNSPLASH_ACCESS_KEY` | Unsplash 搜索 API | 否（降级为仅预设图片） |
| `AI_PROVIDER` | AI 提供商 | 是（已有） |
| `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` | AI 生成主题 | 是（已有） |

---

## 10. Risk Assessment

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Satori 不支持某些 CSS 特性 | 部分布局渲染不一致 | 预览与最终输出对比测试，限制 CSS 子集 |
| Bing/Unsplash API Key 不可用 | 图库搜索不可用 | 降级策略：只显示免费功能 |
| 大尺寸图片（如 1920x1080）服务端渲染慢 | 用户体验差 | 添加加载动画，考虑缓存 |
| localStorage 5MB 限制 | 历史记录/模板存储溢出 | 限制条数，图片压缩，数据库同步 |
| Satori 字体加载失败 | 中文显示异常 | 多字体 fallback，启动时验证字体文件 |
