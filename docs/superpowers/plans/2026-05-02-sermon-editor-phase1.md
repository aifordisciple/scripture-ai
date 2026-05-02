# 我的讲章 (My Sermons) — Phase 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现"我的讲章"功能的基础框架——数据模型、API、讲章标签页、图标侧栏、讲章列表面板和基础 Tiptap 编辑器（无 AI）。

**Architecture:** 在现有标签页系统中新增 `sermon` 类型，通过图标侧栏切换不同面板。左侧面板为讲章列表（文件夹+标签），右侧为 Tiptap 富文本编辑器。数据通过 Prisma + PostgreSQL 持久化，API 遵循现有 CRUD 模式。

**Tech Stack:** Tiptap (@tiptap/react + @tiptap/starter-kit), Prisma ORM, Next.js App Router API, Zustand (新增 SermonSlice), Radix UI + Tailwind CSS

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `components/sermon/SermonTab.tsx` | 讲章标签页主组件，布局容器 |
| `components/sermon/SermonSidebar.tsx` | 图标侧栏（~40px），切换面板 |
| `components/sermon/SermonListPanel.tsx` | 讲章列表面板（文件夹树+标签筛选） |
| `components/sermon/SermonEditor.tsx` | Tiptap 编辑器组件 |
| `components/sermon/SermonEditorHeader.tsx` | 编辑器顶部元数据栏 |
| `components/sermon/SermonEmptyState.tsx` | 无选中讲章时的空状态 |
| `components/sermon/NewSermonDialog.tsx` | 新建讲章对话框 |
| `app/api/sermon/route.ts` | 讲章 CRUD API |
| `app/api/sermon/folder/route.ts` | 文件夹 CRUD API |
| `lib/sermon-templates.ts` | 预置讲章模板定义 |
| `store/slices/sermonSlice.ts` | Zustand SermonSlice |
| `lib/i18n/zh/sermon.ts` | 中文 i18n |
| `lib/i18n/en/sermon.ts` | 英文 i18n |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | 添加 Sermon, SermonFolder, SermonTemplate 模型 + 枚举 |
| `store/types.ts` | 添加 SermonSlice 接口 + Tab 类型扩展 + 数据接口 |
| `store/slices.ts` | 导入并展开 sermonSlice |
| `store/useBibleStore.ts` | 组合 sermonSlice |
| `components/auth/UserMenu.tsx` | 添加"我的讲章"菜单项 |
| `components/bible/TabContentRenderer.tsx` | 添加 sermon 标签页渲染 |
| `app/page.tsx` | 添加 sermon 标签页标签文本 |
| `lib/i18n/zh/index.ts` | 导入 sermon 命名空间 |
| `lib/i18n/en/index.ts` | 导入 sermon 命名空间 |
| `lib/i18n/zh/auth.ts` | 添加 mySermons 键 |
| `lib/i18n/en/auth.ts` | 添加 mySermons 键 |
| `package.json` | 添加 @tiptap 依赖 |

---

### Task 1: 安装 Tiptap 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 Tiptap 包**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/extension-placeholder @tiptap/extension-highlight
```

- [ ] **Step 2: 验证安装成功**

```bash
npm ls @tiptap/react @tiptap/starter-kit
```

Expected: 两个包都显示版本号，无错误

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install tiptap editor dependencies"
```

---

### Task 2: 添加 Prisma 数据模型

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 添加枚举和模型**

在 `prisma/schema.prisma` 末尾添加：

```prisma
// --- 讲章系统 ---

enum SermonStyle {
  EXPOSITORY
  TOPICAL
  NARRATIVE
  FREE
}

enum SermonStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
}

model Sermon {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  title           String       @default("")
  content         String       @default("{}") @db.Text  // Tiptap JSON as string
  folderId        String?

  style           SermonStyle  @default(FREE)
  status          SermonStatus @default(DRAFT)
  sermonDate      DateTime?

  // 关联经文引用 JSON: [{bookId, chapter, verseStart, verseEnd}]
  verseRefs       String       @default("[]") @db.Text
  // 标签
  tags            String[]

  // AI 对话历史 JSON
  aiChatHistory   String?      @db.Text

  wordCount       Int          @default(0)
  estimatedMinutes Int?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([userId, folderId])
  @@index([userId, status])
  @@index([userId, createdAt])
}

model SermonFolder {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  parentId  String?  // 支持多级文件夹
  sortOrder Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, parentId])
}

model SermonTemplate {
  id          String   @id @default(cuid())
  userId      String?  // null = 系统预置
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String
  description String?
  style       SermonStyle @default(FREE)
  structure   String   @default("{}") @db.Text  // Tiptap JSON template
  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

在 `User` 模型中添加关联：

```prisma
  // 讲章
  sermons        Sermon[]
  sermonFolders  SermonFolder[]
  sermonTemplates SermonTemplate[]
```

- [ ] **Step 2: 推送 schema 到数据库**

```bash
npx prisma db push
```

Expected: 成功，无错误

- [ ] **Step 3: 生成 Prisma client**

```bash
npx prisma generate
```

Expected: 成功

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Sermon, SermonFolder, SermonTemplate models to Prisma schema"
```

---

### Task 3: 添加 i18n 翻译

**Files:**
- Create: `lib/i18n/zh/sermon.ts`
- Create: `lib/i18n/en/sermon.ts`
- Modify: `lib/i18n/zh/index.ts`
- Modify: `lib/i18n/en/index.ts`
- Modify: `lib/i18n/zh/auth.ts`
- Modify: `lib/i18n/en/auth.ts`

- [ ] **Step 1: 创建中文 i18n 文件**

```typescript
// lib/i18n/zh/sermon.ts
export const sermon = {
  sermon: {
    title: '我的讲章',
    newSermon: '新建讲章',
    fromVerse: '从经文开始',
    fromTopic: '从主题开始',
    untitled: '无标题讲章',
    // 列表面板
    listTitle: '讲章列表',
    allSermons: '全部讲章',
    searchPlaceholder: '搜索讲章...',
    newFolder: '新建文件夹',
    sortByDate: '按日期排序',
    sortByTitle: '按标题排序',
    noSermons: '暂无讲章',
    noSermonsDesc: '点击"新建讲章"开始预备',
    deleteConfirm: '确定删除这篇讲章？',
    deleteFolderConfirm: '确定删除此文件夹？讲章将移至根目录。',
    // 编辑器
    editorPlaceholder: '开始书写你的讲章...',
    autoSaved: '已自动保存',
    saving: '保存中...',
    // 元数据
    sermonTitle: '标题',
    sermonStyle: '讲道风格',
    sermonDate: '讲道日期',
    verseRef: '经文引用',
    tagsLabel: '标签',
    addTag: '添加标签',
    // 风格
    expository: '释经式',
    topical: '主题式',
    narrative: '叙事式',
    free: '自由',
    // 状态
    draft: '草稿',
    inProgress: '进行中',
    completed: '已完成',
    // 侧栏
    panelList: '讲章列表',
    panelAi: 'AI 助手',
    panelVerse: '经文参考',
    panelTemplate: '模板',
    panelReview: '审查',
    panelSettings: '设置',
    // 模板
    templateExpository: '释经式讲章',
    templateTopical: '主题式讲章',
    templateNarrative: '叙事式讲章',
    templateExpositoryDesc: '经文→背景→释义→应用→结语',
    templateTopicalDesc: '主题→经文依据→论证→应用→呼召',
    templateNarrativeDesc: '故事→转折→启示→应用',
  },
} as const
```

- [ ] **Step 2: 创建英文 i18n 文件**

```typescript
// lib/i18n/en/sermon.ts
export const sermon = {
  sermon: {
    title: 'My Sermons',
    newSermon: 'New Sermon',
    fromVerse: 'Start from Verse',
    fromTopic: 'Start from Topic',
    untitled: 'Untitled Sermon',
    listTitle: 'Sermon List',
    allSermons: 'All Sermons',
    searchPlaceholder: 'Search sermons...',
    newFolder: 'New Folder',
    sortByDate: 'Sort by Date',
    sortByTitle: 'Sort by Title',
    noSermons: 'No sermons yet',
    noSermonsDesc: 'Click "New Sermon" to start preparing',
    deleteConfirm: 'Are you sure you want to delete this sermon?',
    deleteFolderConfirm: 'Delete this folder? Sermons will move to root.',
    editorPlaceholder: 'Start writing your sermon...',
    autoSaved: 'Auto-saved',
    saving: 'Saving...',
    sermonTitle: 'Title',
    sermonStyle: 'Sermon Style',
    sermonDate: 'Sermon Date',
    verseRef: 'Verse Reference',
    tagsLabel: 'Tags',
    addTag: 'Add tag',
    expository: 'Expository',
    topical: 'Topical',
    narrative: 'Narrative',
    free: 'Free',
    draft: 'Draft',
    inProgress: 'In Progress',
    completed: 'Completed',
    panelList: 'Sermons',
    panelAi: 'AI Assistant',
    panelVerse: 'Verses',
    panelTemplate: 'Templates',
    panelReview: 'Review',
    panelSettings: 'Settings',
    templateExpository: 'Expository Sermon',
    templateTopical: 'Topical Sermon',
    templateNarrative: 'Narrative Sermon',
    templateExpositoryDesc: 'Verse→Context→Exposition→Application→Conclusion',
    templateTopicalDesc: 'Topic→Scripture→Argument→Application→Invitation',
    templateNarrativeDesc: 'Story→Turning Point→Insight→Application',
  },
} as const
```

- [ ] **Step 3: 在 zh/index.ts 和 en/index.ts 中导入并展开 sermon 命名空间**

在 `lib/i18n/zh/index.ts` 中添加 `import { sermon } from './sermon'` 并在导出对象中添加 `...sermon`。同样修改 `lib/i18n/en/index.ts`。

- [ ] **Step 4: 在 auth i18n 中添加菜单键**

在 `lib/i18n/zh/auth.ts` 中添加 `mySermons: '我的讲章'`。
在 `lib/i18n/en/auth.ts` 中添加 `mySermons: 'My Sermons'`。

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/
git commit -m "feat: add sermon i18n translations (zh/en)"
```

---

### Task 4: 添加 Store 类型和 Slice

**Files:**
- Modify: `store/types.ts`
- Create: `store/slices/sermonSlice.ts`
- Modify: `store/slices.ts`
- Modify: `store/useBibleStore.ts`

- [ ] **Step 1: 在 store/types.ts 中添加数据接口和 SermonSlice**

在数据结构区域添加：

```typescript
// 讲章数据结构
export interface SermonData {
  id: string;
  title: string;
  content: string; // Tiptap JSON string
  folderId: string | null;
  style: 'EXPOSITORY' | 'TOPICAL' | 'NARRATIVE' | 'FREE';
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  sermonDate: string | null;
  verseRefs: string; // JSON string
  tags: string[];
  wordCount: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SermonFolderData {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SermonPanelType = 'list' | 'ai' | 'verse' | 'template' | 'review' | 'settings';
```

在 Tab 接口的 type 联合中添加 `'sermon'`。

在 addTab params type 联合中添加 `'sermon'`。

添加 SermonSlice 接口：

```typescript
export interface SermonSlice {
  // 当前编辑的讲章
  currentSermon: SermonData | null;
  setCurrentSermon: (sermon: SermonData | null) => void;

  // 讲章列表
  sermons: SermonData[];
  setSermons: (sermons: SermonData[]) => void;

  // 文件夹
  sermonFolders: SermonFolderData[];
  setSermonFolders: (folders: SermonFolderData[]) => void;

  // 侧面板
  activeSermonPanel: SermonPanelType;
  setActiveSermonPanel: (panel: SermonPanelType) => void;

  // 列表筛选
  sermonSearchQuery: string;
  setSermonSearchQuery: (query: string) => void;
  sermonSelectedFolderId: string | null;
  setSermonSelectedFolderId: (id: string | null) => void;
  sermonSelectedTags: string[];
  setSermonSelectedTags: (tags: string[]) => void;

  // 保存状态
  isSermonSaving: boolean;
  setIsSermonSaving: (saving: boolean) => void;

  // 加载状态
  sermonsLoading: boolean;
  setSermonsLoading: (loading: boolean) => void;
}
```

在 StoreState 聚合类型中添加 `& SermonSlice`。

- [ ] **Step 2: 创建 sermonSlice.ts**

```typescript
// store/slices/sermonSlice.ts
import { StateCreator } from 'zustand';
import { StoreState, SermonSlice } from '../types';

export const createSermonSlice: StateCreator<StoreState, [], [], SermonSlice> = (set) => ({
  currentSermon: null,
  setCurrentSermon: (sermon) => set({ currentSermon: sermon }),

  sermons: [],
  setSermons: (sermons) => set({ sermons }),

  sermonFolders: [],
  setSermonFolders: (folders) => set({ sermonFolders: folders }),

  activeSermonPanel: 'list',
  setActiveSermonPanel: (panel) => set({ activeSermonPanel: panel }),

  sermonSearchQuery: '',
  setSermonSearchQuery: (query) => set({ sermonSearchQuery: query }),
  sermonSelectedFolderId: null,
  setSermonSelectedFolderId: (id) => set({ sermonSelectedFolderId: id }),
  sermonSelectedTags: [],
  setSermonSelectedTags: (tags) => set({ sermonSelectedTags: tags }),

  isSermonSaving: false,
  setIsSermonSaving: (saving) => set({ isSermonSaving: saving }),

  sermonsLoading: false,
  setSermonsLoading: (loading) => set({ sermonsLoading: loading }),
});
```

- [ ] **Step 3: 在 store/slices.ts 中导入并导出**

在 `store/slices.ts` 顶部添加导入：
```typescript
import { createSermonSlice } from './slices/sermonSlice';
export { createSermonSlice };
```

- [ ] **Step 4: 在 store/useBibleStore.ts 中组合 slice**

在 `useBibleStore.ts` 的组合函数中添加 `...createSermonSlice(...a),`。

- [ ] **Step 5: 在 addTab 中处理 sermon 类型**

在 `store/slices.ts` 的 `addTab` 方法中，在 `else if (type === 'theme-graph')` 之后添加：
```typescript
// sermon 不需要额外参数
```

- [ ] **Step 6: Commit**

```bash
git add store/
git commit -m "feat: add SermonSlice to Zustand store with types and state"
```

---

### Task 5: 添加讲章 CRUD API

**Files:**
- Create: `app/api/sermon/route.ts`
- Create: `app/api/sermon/folder/route.ts`

- [ ] **Step 1: 创建讲章 CRUD API**

```typescript
// app/api/sermon/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ data: [] });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ data: [] });

  const where: any = { userId: user.id };
  if (folderId) where.folderId = folderId;
  if (tag) where.tags = { has: tag };
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const sermons = await prisma.sermon.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, folderId: true, style: true, status: true,
      sermonDate: true, verseRefs: true, tags: true, wordCount: true,
      estimatedMinutes: true, createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ data: sermons });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const sermon = await prisma.sermon.create({
    data: {
      userId: user.id,
      title: body.title || "",
      content: body.content || "{}",
      folderId: body.folderId || null,
      style: body.style || "FREE",
      status: body.status || "DRAFT",
      sermonDate: body.sermonDate ? new Date(body.sermonDate) : null,
      verseRefs: body.verseRefs || "[]",
      tags: body.tags || [],
    },
  });

  return NextResponse.json({ data: sermon });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return new NextResponse("Missing sermon id", { status: 400 });

  // 所有权验证
  const existing = await prisma.sermon.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.folderId !== undefined) updateData.folderId = data.folderId;
  if (data.style !== undefined) updateData.style = data.style;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.sermonDate !== undefined) updateData.sermonDate = data.sermonDate ? new Date(data.sermonDate) : null;
  if (data.verseRefs !== undefined) updateData.verseRefs = data.verseRefs;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.wordCount !== undefined) updateData.wordCount = data.wordCount;
  if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;

  const sermon = await prisma.sermon.update({ where: { id }, data: updateData });
  return NextResponse.json({ data: sermon });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.sermon.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await prisma.sermon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: 创建文件夹 CRUD API**

```typescript
// app/api/sermon/folder/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ data: [] });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ data: [] });

  const folders = await prisma.sermonFolder.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: folders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { name, parentId, sortOrder } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const folder = await prisma.sermonFolder.create({
    data: {
      userId: user.id,
      name: name || "New Folder",
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json({ data: folder });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { id, name, parentId, sortOrder } = await req.json();
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.sermonFolder.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (parentId !== undefined) updateData.parentId = parentId;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const folder = await prisma.sermonFolder.update({ where: { id }, data: updateData });
  return NextResponse.json({ data: folder });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.sermonFolder.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 删除文件夹，讲章移至根目录
  await prisma.sermon.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  await prisma.sermonFolder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/sermon/
git commit -m "feat: add sermon and sermon folder CRUD API routes"
```

---

### Task 6: 添加讲章标签页入口

**Files:**
- Modify: `components/auth/UserMenu.tsx`
- Modify: `components/bible/TabContentRenderer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 在 UserMenu.tsx 中添加"我的讲章"菜单项**

在 `UserMenu.tsx` 中：
1. 在 lucide-react 导入中添加 `BookOpen`
2. 在"读经计划"菜单项之后（约 line 182），添加：

```tsx
<MenuItem
  icon={<BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
  label={t('auth.mySermons')}
  onClick={() => {
    setIsOpen(false);
    const { tabs, setActiveTab, addTab } = useBibleStore.getState();
    const existTab = tabs.find(t => t.type === 'sermon');
    if (existTab) setActiveTab(existTab.id);
    else addTab({ type: 'sermon' as any });
  }}
/>
```

注意：使用 `as any` 临时绕过类型检查，Task 4 已扩展类型后可移除。

- [ ] **Step 2: 在 TabContentRenderer.tsx 中添加 sermon 渲染**

1. 在顶部添加动态导入：
```typescript
const SermonTab = dynamic(() => import('@/components/sermon/SermonTab').then(m => ({ default: m.SermonTab })), { ssr: false })
```

2. 在渲染条件中添加：
```typescript
{tab.type === 'sermon' && <SermonTab key={tab.id} />}
```

3. 在本地 Tab type 联合中添加 `'sermon'`

- [ ] **Step 3: 在 app/page.tsx 中添加 sermon 标签文本**

在标签文本渲染逻辑中（约 line 98），添加：
```typescript
tab.type === 'sermon' ? `📝 ${t('sermon.title')}` :
```

- [ ] **Step 4: Commit**

```bash
git add components/auth/UserMenu.tsx components/bible/TabContentRenderer.tsx app/page.tsx
git commit -m "feat: add sermon tab entry in UserMenu, TabContentRenderer, and page"
```

---

### Task 7: 创建讲章标签页主组件

**Files:**
- Create: `components/sermon/SermonTab.tsx`
- Create: `components/sermon/SermonSidebar.tsx`
- Create: `components/sermon/SermonEmptyState.tsx`

- [ ] **Step 1: 创建 SermonTab.tsx**

```tsx
// components/sermon/SermonTab.tsx
'use client'

import { useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { SermonSidebar } from './SermonSidebar'
import { SermonListPanel } from './SermonListPanel'
import { SermonEditor } from './SermonEditor'
import { SermonEmptyState } from './SermonEmptyState'
import { cn } from '@/lib/utils'

export function SermonTab() {
  const { t } = useTranslation()
  const {
    currentSermon,
    activeSermonPanel,
    sermonsLoading,
    setSermonsLoading,
    setSermons,
    setSermonFolders,
    sermons,
  } = useBibleStore()

  // 加载讲章列表和文件夹
  useEffect(() => {
    const loadData = async () => {
      setSermonsLoading(true)
      try {
        const [sermonsRes, foldersRes] = await Promise.all([
          fetch('/api/sermon'),
          fetch('/api/sermon/folder'),
        ])
        const sermonsData = await sermonsRes.json()
        const foldersData = await foldersRes.json()
        setSermons(sermonsData.data || [])
        setSermonFolders(foldersData.data || [])
      } catch (e) {
        // 静默处理，使用空数据
      } finally {
        setSermonsLoading(false)
      }
    }
    loadData()
  }, [setSermons, setSermonFolders, setSermonsLoading])

  const panelWidth = activeSermonPanel !== 'list' ? 0 : 280

  return (
    <div className="flex h-full bg-white dark:bg-slate-950">
      {/* 图标侧栏 */}
      <SermonSidebar />

      {/* 列表面板 */}
      <div
        className={cn(
          'border-r border-slate-200 dark:border-slate-800 transition-all duration-200 overflow-hidden',
          activeSermonPanel === 'list' ? 'w-[280px]' : 'w-0'
        )}
      >
        {activeSermonPanel === 'list' && <SermonListPanel />}
      </div>

      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentSermon ? <SermonEditor /> : <SermonEmptyState />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 SermonSidebar.tsx**

```tsx
// components/sermon/SermonSidebar.tsx
'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Bot,
  BookMarked,
  LayoutTemplate,
  CheckCircle2,
  Settings,
} from 'lucide-react'
import type { SermonPanelType } from '@/store/types'

const PANEL_ICONS: { type: SermonPanelType; icon: typeof BookOpen; key: string }[] = [
  { type: 'list', icon: BookOpen, key: 'panelList' },
  { type: 'ai', icon: Bot, key: 'panelAi' },
  { type: 'verse', icon: BookMarked, key: 'panelVerse' },
  { type: 'template', icon: LayoutTemplate, key: 'panelTemplate' },
  { type: 'review', icon: CheckCircle2, key: 'panelReview' },
  { type: 'settings', icon: Settings, key: 'panelSettings' },
]

export function SermonSidebar() {
  const { t } = useTranslation()
  const { activeSermonPanel, setActiveSermonPanel } = useBibleStore()

  return (
    <div className="w-10 bg-slate-900 dark:bg-slate-950 flex flex-col items-center py-3 gap-1 border-r border-slate-800">
      {PANEL_ICONS.map(({ type, icon: Icon, key }) => {
        const isActive = activeSermonPanel === type
        return (
          <button
            key={type}
            onClick={() => setActiveSermonPanel(isActive ? 'list' : type)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            )}
            title={t(`sermon.${key}`)}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: 创建 SermonEmptyState.tsx**

```tsx
// components/sermon/SermonEmptyState.tsx
'use client'

import { useTranslation } from '@/lib/i18n'
import { BookOpen } from 'lucide-react'

export function SermonEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-5">
        <BookOpen className="w-10 h-10 text-orange-400 dark:text-orange-500" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('sermon.noSermons')}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{t('sermon.noSermonsDesc')}</p>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/sermon/
git commit -m "feat: add SermonTab, SermonSidebar, and SermonEmptyState components"
```

---

### Task 8: 创建讲章列表面板

**Files:**
- Create: `components/sermon/SermonListPanel.tsx`
- Create: `components/sermon/NewSermonDialog.tsx`

- [ ] **Step 1: 创建 SermonListPanel.tsx**

此组件包含：文件夹树、标签筛选、搜索、排序、讲章列表、新建按钮。约 200 行。

核心功能：
- 顶部搜索栏
- 文件夹树（可展开/折叠），点击文件夹筛选
- 标签区域（显示所有标签，点击筛选）
- 讲章列表（标题+风格标签+日期），点击选中
- 底部"新建讲章"按钮
- 右键菜单（重命名、删除、移动）

- [ ] **Step 2: 创建 NewSermonDialog.tsx**

新建讲章对话框，包含：
- 标题输入
- 风格选择（释经式/主题式/叙事式/自由）
- 文件夹选择
- "从经文开始"和"从主题开始"两个按钮（Phase 1 先只实现直接创建）

- [ ] **Step 3: Commit**

```bash
git add components/sermon/SermonListPanel.tsx components/sermon/NewSermonDialog.tsx
git commit -m "feat: add SermonListPanel with folder tree, tags, search, and NewSermonDialog"
```

---

### Task 9: 创建 Tiptap 编辑器

**Files:**
- Create: `components/sermon/SermonEditor.tsx`
- Create: `components/sermon/SermonEditorHeader.tsx`

- [ ] **Step 1: 创建 SermonEditorHeader.tsx**

顶部元数据栏，显示：
- 讲章标题（可编辑 input）
- 风格标签（下拉选择）
- 讲道日期（date input）
- 关联经文引用
- 自动保存状态

约 80 行。

- [ ] **Step 2: 创建 SermonEditor.tsx**

Tiptap 编辑器组件，核心功能：
- 使用 `useEditor` 初始化 Tiptap
- StarterKit + Placeholder 扩展
- 工具栏（粗体/斜体/标题/列表/引用）
- 自动保存（debounce 2秒，调用 PUT /api/sermon）
- 字数统计
- 内容居中显示（max-w-3xl）

约 150 行。

- [ ] **Step 3: Commit**

```bash
git add components/sermon/SermonEditor.tsx components/sermon/SermonEditorHeader.tsx
git commit -m "feat: add Tiptap-based SermonEditor with auto-save and SermonEditorHeader"
```

---

### Task 10: 创建预置模板

**Files:**
- Create: `lib/sermon-templates.ts`

- [ ] **Step 1: 创建模板定义文件**

```typescript
// lib/sermon-templates.ts
// 预置讲章模板的 Tiptap JSON 结构

export const EXPOSITORY_TEMPLATE = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '一、引言' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（引入经文和主题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '二、经文背景' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（历史、文化、文学背景）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '三、经文释义' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（逐节解释经文含义）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '四、生活应用' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（将经文真理应用到当代生活）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '五、结语' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（总结与呼召）' }] },
  ],
})

export const TOPICAL_TEMPLATE = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '一、主题引入' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（提出主题和核心问题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '二、圣经依据' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（引用相关经文支持主题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '三、论证展开' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（从多角度论证主题）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '四、生活应用' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（主题在生活中的具体应用）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '五、呼召' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（邀请会众回应）' }] },
  ],
})

export const NARRATIVE_TEMPLATE = JSON.stringify({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '一、故事叙述' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（生动讲述圣经故事）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '二、转折点' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（故事中的关键转折）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '三、属灵启示' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（从故事中提取属灵真理）' }] },
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '四、生活应用' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '（将启示应用到日常生活中）' }] },
  ],
})

export const SERMON_TEMPLATES = {
  EXPOSITORY: EXPOSITORY_TEMPLATE,
  TOPICAL: TOPICAL_TEMPLATE,
  NARRATIVE: NARRATIVE_TEMPLATE,
} as const
```

- [ ] **Step 2: Commit**

```bash
git add lib/sermon-templates.ts
git commit -m "feat: add preset sermon templates (expository, topical, narrative)"
```

---

### Task 11: 构建验证与部署

- [ ] **Step 1: Docker 构建验证**

```bash
docker-compose down && docker-compose up -d --build
```

Expected: 构建成功，服务正常启动

- [ ] **Step 2: 修复构建错误（如有）**

检查构建日志，修复任何 TypeScript 错误或运行时问题。

- [ ] **Step 3: 自动部署**

```bash
./auto_deploy.sh -s "feat: 我的讲章 Phase 1 基础框架" -d "实现讲章编辑器基础框架：1) Prisma数据模型(Sermon/SermonFolder/SermonTemplate+枚举); 2) CRUD API(/api/sermon, /api/sermon/folder); 3) Zustand SermonSlice; 4) 讲章标签页+图标侧栏+列表面板; 5) Tiptap富文本编辑器+自动保存; 6) 预置模板(释经式/主题式/叙事式); 7) i18n中英文翻译"
```
