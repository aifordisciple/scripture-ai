# i18n 多语言支持升级设计文档

**日期**: 2026-04-23
**状态**: 已批准
**范围**: 英文 locale 支持 + P0/P1 组件翻译 + 版本联动 + 服务器同步

## 概述

在现有自建 i18n 系统上渐进式升级，增加完整的英文 locale 支持。和合本(CUV)作为中文默认版本，KJV 作为英文默认版本，切换语言时自动联动版本。

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 实现方案 | 渐进式升级（方案 A） | 零新依赖，与现有代码无缝衔接，风险低 |
| 版本联动 | 自动联动 | zh→CUV 主版本，en→KJV 主版本 |
| 翻译范围 | P0+P1 | 覆盖核心功能和高频使用组件 |
| 服务器同步 | 本次实现 | Prisma schema 已有 locale 字段 |
| 浏览器检测 | 本次实现 | 首次访问自动设置 locale |
| 读经计划双语 | 本次实现 | 添加 titleEn/descriptionEn/tagsEn |
| 搜索 API | 本次实现 | locale 感知版本选择 |

## 1. i18n 基础设施增强

### 1.1 全局 `resolveDualLang` 工具函数

提取 `QuickPrompts.tsx` 和 `Reader.tsx` 中的内联 resolve 函数为全局工具：

```typescript
// lib/i18n/index.ts 新增
export function resolveDualLang(v: DualLangString | string, locale: Locale): string {
  return typeof v === 'string' ? v : (v[locale] || v.zh);
}
```

替换 `QuickPrompts.tsx` 和 `Reader.tsx` 中的内联版本。

### 1.2 字典文件按模块拆分

当前 `zh.ts` 和 `en.ts` 各 ~190 键，扩展到 ~400+ 后需要拆分：

```
lib/i18n/
├── index.ts          # t(), useTranslation(), resolveDualLang()
├── types.ts          # Translations type
├── zh/
│   ├── index.ts      # 合并导出所有模块
│   ├── common.ts     # 通用按钮、标签
│   ├── reader.ts     # 阅读器相关
│   ├── ai.ts         # AI 聊天相关
│   ├── plan.ts       # 读经计划
│   ├── settings.ts   # 设置面板
│   ├── search.ts     # 搜索
│   ├── auth.ts       # 登录注册
│   ├── group.ts      # 群组/教会
│   └── atlas.ts      # 地图/时间线
└── en/
    └── (同结构)
```

每个模块文件导出 `Record<string, string>` 对象，`index.ts` 合并所有模块。

### 1.3 浏览器语言自动检测

在 `createLocaleSlice` 中增强初始化逻辑：

```typescript
function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const saved = localStorage.getItem('locale');
  if (saved === 'zh' || saved === 'en') return saved;
  const browserLang = navigator.language?.toLowerCase() || '';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en'; // 非中文默认英文
}
```

优先级：localStorage > navigator.language > 默认 'zh'

## 2. 语言-版本联动机制

### 2.1 Reader.tsx 主版本逻辑

引入计算属性替代硬编码的 CUV 主版本：

```typescript
const primaryVersion = locale === 'en' ? 'KJV' : 'CUV';
const secondaryVersion = locale === 'en' ? 'CUV' : 'KJV';
```

经文渲染：主版本始终显示，次要版本在 `showEnglish` 时显示。

### 2.2 双语对照按钮语义

`showEnglish` 字段名保持不变，UI 标签根据 locale 变化：

| locale | showEnglish=false | showEnglish=true |
|--------|-------------------|------------------|
| zh | "中" | "中/英" |
| en | "En" | "En/Zh" |

### 2.3 切换 locale 时的自动联动

- `zh → en`：自动设置 `showEnglish = true`，主版本切换为 KJV
- `en → zh`：保持当前 `showEnglish` 状态不变，主版本切换为 CUV

### 2.4 BIBLE_BOOKS 英文名称

更新 `getBookDisplayName` 等 helper 函数接受 locale 参数：

```typescript
export function getBookDisplayName(bookId: number, locale: Locale): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  return locale === 'en' ? (book?.nameEn || book?.name || '') : (book?.name || '');
}
```

### 2.5 搜索 API locale 感知

`/api/search/route.ts` 改为接受 `locale` 参数：
- `locale === 'en'` → 搜索 `version: 'KJV'`
- 默认 → 搜索 `version: 'CUV'`

## 3. 组件翻译策略

### 3.1 P0 组件

| 组件 | 硬编码中文数 | 翻译重点 |
|------|-------------|---------|
| AISidebar.tsx | ~19 | AI 聊天标签、按钮、占位符、错误消息 |
| PlanTab.tsx | ~15 | 计划标题、步骤描述、进度文本 |
| FloatingMenu.tsx | ~11 | 菜单项标签 |
| Reader.tsx | ~8 | 章节标题、操作按钮 |
| Sidebar.tsx | ~10 | 侧边栏标签 |

### 3.2 P1 组件

| 组件 | 硬编码中文数 | 翻译重点 |
|------|-------------|---------|
| HighlightsTab | ~5 | 高亮颜色名称、操作 |
| SearchResults | ~8 | 搜索提示、结果标签 |
| BookPicker | ~6 | 书卷分类、旧约/新约 |
| ShareCard.tsx | ~23 | 分享模板、装饰文字 |
| GroupTab | ~8 | 群组标签 |
| ApiSettingsDialog | ~5 | API 配置说明 |
| SyncSettings | ~3 | 同步状态文本 |
| NotificationSettings | ~3 | 通知标签 |
| UserMenu | ~5 | 用户菜单项 |
| onboarding/ | ~18 | 引导流程文本 |

### 3.3 翻译原则

1. **不改变组件逻辑**：只替换字符串，不修改行为
2. **保持中文为源**：`zh.ts` 是翻译的权威来源，`en.ts` 跟随
3. **键命名规范**：`组件.功能.具体项`，如 `ai.placeholder.input`、`plan.step.read`
4. **错误消息**：用户可见的错误消息翻译，技术错误保持英文
5. **emoji 保留**：emoji 在翻译键外，如 `📊 {t('tabs.dashboard')}`

### 3.4 page.tsx TabList 翻译

当前标签名硬编码（如 `'📊 数据看板'`），改为：
```typescript
<span>📊 {t('tabs.dashboard')}</span>
```

## 4. Locale 服务器同步

### 4.1 新增 API 端点

```
GET  /api/user/locale     → 返回 { locale: 'zh' | 'en' | null }
POST /api/user/locale     → 保存 { locale: 'zh' | 'en' }
```

Prisma schema 已有 `UserSetting.locale String?`，无需修改。

### 4.2 同步逻辑

1. 用户切换 locale → `setLocale()` 更新 localStorage + 异步调用 API 保存
2. 用户登录 → 从 `/api/user/locale` 读取偏好，覆盖 localStorage
3. 未登录用户 → 仅使用 localStorage + 浏览器检测

### 4.3 Store 变更

```typescript
setLocale: async (locale) => {
  localStorage.setItem('locale', locale);
  set({ locale });
  // 如果已登录，异步同步到服务器（不阻塞 UI）
  const session = await getSession();
  if (session?.user) {
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }).catch(() => {}); // 静默失败，不影响用户体验
  }
}
```

## 5. 读经计划双语数据

### 5.1 数据结构扩展

`lib/plans.ts` 中的计划定义扩展为：

```typescript
{
  id, title, titleEn,
  description, descriptionEn,
  tags, tagsEn,
  steps: [{ title, titleEn, description, descriptionEn, type }]
}
```

使用平面字段而非 DualLangString 对象，因为计划数据是静态定义的。

### 5.2 显示逻辑

```typescript
const planTitle = locale === 'en' ? (plan.titleEn || plan.title) : plan.title;
```

## 6. 错误处理与测试

### 6.1 翻译缺失处理

- `t()` 函数 fallback：缺失键返回键字符串本身
- 开发模式控制台 warn 缺失键
- `resolveDualLang()` fallback 到 `v.zh`

### 6.2 测试策略

| 测试类型 | 覆盖内容 |
|---------|---------|
| 单元测试 | `t()` 函数、`resolveDualLang()`、`detectLocale()`、字典完整性 |
| 集成测试 | `/api/user/locale` CRUD、搜索 API locale 感知 |
| 手动验证 | 切换 locale 后所有 P0+P1 组件显示正确、版本联动正常 |

### 6.3 回归风险控制

- 每完成一个组件翻译，立即 `docker-compose up -d --build` 验证
- 翻译替换是纯字符串替换，不改变逻辑，回归风险低
- 版本联动逻辑重点测试：zh↔en 切换后主版本是否正确

## 不在本次范围内

- P2 组件翻译（atlas/、theme/、group/ 详细页面、feedback/）
- next-intl 迁移
- SEO 相关的 URL locale 路由（如 `/en/...`）
- 服务端渲染的 locale 处理（当前全部客户端渲染）
