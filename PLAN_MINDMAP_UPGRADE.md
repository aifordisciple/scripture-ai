# 思维导图功能升级计划

## 一、用户视角：使用流程与体验需求

### 1.1 核心使用场景

| 场景 | 描述 | 用户期望 |
|------|------|---------|
| **灵修后整理** | 完成 AI 解读后，一键生成思维导图帮助记忆 | 快速、直观、结构清晰 |
| **主日学备课** | 准备查经材料时，将解读结果导出为讲义插图 | 可导出高清图片 |
| **小组分享** | 在小组中分享经文理解的视觉呈现 | 支持分享到小组动态 |
| **个人复习** | 回顾历史 AI 解读，快速定位要点 | 历史消息也可生成 |
| **沉浸式学习** | 专注思考经文结构，不受干扰 | 全屏模式、暗色主题 |

### 1.2 理想使用流程

```
┌─────────────────────────────────────────────────────────────────┐
│  步骤 1: 触发生成                                                │
│  ─────────────────────────────────────────────────────────────  │
│  用户完成 AI 对话 → 点击"导图"按钮 → 智能解析内容                 │
│                                                                 │
│  [期望] 无需等待，1秒内弹窗打开                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  步骤 2: 查看与交互                                              │
│  ─────────────────────────────────────────────────────────────  │
│  弹窗全屏展示 → 自动适配视图 → 用户自由探索                       │
│                                                                 │
│  [交互需求]                                                      │
│  - 鼠标滚轮缩放 / 双指捏合缩放                                   │
│  - 拖拽平移画布                                                 │
│  - 点击节点展开/收起子节点                                       │
│  - 双击节点聚焦高亮                                             │
│  - 暗色模式自动适配                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  步骤 3: 调整样式                                                │
│  ─────────────────────────────────────────────────────────────  │
│  工具栏选择布局 → 切换主题配色 → 调整显示密度                     │
│                                                                 │
│  [样式需求]                                                      │
│  - 5种布局：逻辑结构图、思维导图、组织结构图、目录组织图、时间轴  │
│  - 主题配色：经典、简约、深色、彩色                              │
│  - 节点样式：紧凑/标准/宽松                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  步骤 4: 导出或分享                                              │
│  ─────────────────────────────────────────────────────────────  │
│  点击导出 → 选择格式 → 下载或分享                                │
│                                                                 │
│  [导出需求]                                                      │
│  - PNG 图片（透明背景可选）                                      │
│  - SVG 矢量图（可编辑）                                          │
│  - 分享到小组动态（图片 + 经文引用）                             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 边界场景处理

| 边界情况 | 当前行为 | 期望行为 |
|----------|---------|---------|
| AI 回复无标准章节 | 空白导图 | 提示"内容格式不兼容"，或尝试通用解析 |
| 内容过长（50+节点） | 可能卡顿 | 分页或虚拟滚动提示 |
| 历史消息无上下文 | 按钮不显示 | 从消息内容解析经文引用 |
| 移动端触控 | 基本可用 | 优化手势、增大触控区域 |
| 网络断开时导出 | 无处理 | 本地生成，无需网络 |

---

## 二、工程师视角：现有代码分析

### 2.1 当前实现架构

```
components/mindmap/
├── MindMapModal.tsx      # 全屏弹窗 (166行)
│   └── 使用 @radix-ui/react-dialog
│   └── 管理思维导图实例生命周期
│
├── MindMapCanvas.tsx     # 画布渲染 (201行)
│   └── 导出 MindMapCanvas Hook 和 MindMapCanvasView 组件
│   └── 5种布局类型定义
│
├── MindMapToolbar.tsx    # 工具栏 (97行)
│   └── 缩放、布局切换、导出按钮
│
├── markdownParser.ts     # Markdown解析器 (206行)
│   └── 7种章节模板定义
│   └── 解析为 MindMapNode 树形结构
│
└── types.ts              # 类型定义 (11行)
```

### 2.2 数据流分析

```
用户点击"导图"
      ↓
AISidebar.handleOpenMindMap(content)
      ↓
parseMarkdownToMindMap(markdown, title)
      ↓
MindMapNode 树形结构 { id, text, children, collapsed }
      ↓
openMindMapModal(data, title) → Zustand Store
      ↓
page.tsx 渲染 <MindMapModal>
      ↓
toSimpleMindMapData(node) → simple-mind-map 格式
      ↓
new MindMap({ data, layout, theme: 'default' })
```

### 2.3 问题清单

| 问题 | 严重程度 | 描述 |
|------|---------|------|
| **P0: 历史消息无法生成** | 🔴 高 | `onOpenMindMap` 条件要求 `aiRequestTrigger` 存在 |
| **P1: 无节点展开/折叠** | 🟡 中 | `collapsed` 字段定义但未使用 |
| **P1: 主题固定** | 🟡 中 | `theme: 'default'` 硬编码 |
| **P2: 布局切换重建实例** | 🟡 中 | 每次 `destroy()` + `new MindMap()` 性能损失 |
| **P2: 移动端手势缺失** | 🟡 中 | 无双指缩放、滑动平移 |
| **P3: 导出格式单一** | 🟢 低 | 仅支持 PNG |
| **P3: 无分享功能** | 🟢 低 | 无法分享到小组 |

### 2.4 simple-mind-map 库能力

**当前使用**：
- `new MindMap()` - 初始化
- `mindMap.on('scale')` - 监听缩放
- `mindMap.fit()` - 适配视图
- `mindMap.enlarge()/narrow()` - 缩放控制
- `mindMap.setLayout()` - 布局切换
- `mindMap.export('png')` - 导出
- `mindMap.destroy()` - 销毁

**未使用的潜在能力**：
- `mindMap.on('node_click')` - 节点点击事件
- `mindMap.setTheme('dark')` - 主题切换
- `mindMap.setData()` - 数据更新（无需重建实例）
- `mindMap.export('svg')` - SVG 导出
- `mindMap.renderer.startTextEdit()` - 节点编辑（可选）

---

## 三、架构师视角：升级计划

### 3.1 升级阶段划分

```
Phase 1 (P0 - 紧急修复) ────────────────────────────────────
├── 修复历史消息生成问题
└── 增强解析器鲁棒性

Phase 2 (P1 - 核心功能) ────────────────────────────────────
├── 节点展开/折叠交互
├── 主题切换（亮色/暗色）
└── 优化布局切换性能

Phase 3 (P2 - 体验优化) ────────────────────────────────────
├── 移动端手势支持
├── 增强工具栏 UI
└── 导出选项扩展

Phase 4 (P3 - 社交功能) ────────────────────────────────────
├── 分享到小组动态
└── 嵌入笔记功能
```

### 3.2 Phase 1 详细方案：紧急修复

#### 修复 1：历史消息支持

**文件**: `components/bible/AISidebar.tsx`

**当前代码**:
```typescript
onOpenMindMap={(isAssistant && m.content.length > 0 && aiRequestTrigger)
  ? () => handleOpenMindMap(m.content)
  : undefined}
```

**修改方案**:
```typescript
onOpenMindMap={(isAssistant && m.content.length > 0)
  ? () => handleOpenMindMap(m.content, m.id)
  : undefined}
```

**修改 `handleOpenMindMap`**:
```typescript
const handleOpenMindMap = useCallback((content: string, messageId?: string) => {
  // 优先使用当前会话上下文
  let title = '';

  if (aiRequestTrigger) {
    const { ref } = aiRequestTrigger;
    title = ref.verse > 0
      ? `${ref.bookName} ${ref.chapter}:${ref.verse}`
      : `${ref.bookName} ${ref.chapter}`;
  } else {
    // 从消息内容解析经文引用
    const parsed = parseVerseReference(content);
    if (parsed) {
      const book = BIBLE_BOOKS.find(b => b.id === parsed.bookId);
      title = parsed.verse > 0
        ? `${book?.name || parsed.bookId} ${parsed.chapter}:${parsed.verse}`
        : `${book?.name || parsed.bookId} ${parsed.chapter}`;
    } else {
      title = 'AI 解读';
    }
  }

  const mindMapData = parseMarkdownToMindMap(content, title);
  openMindMapModal(mindMapData, title);
}, [aiRequestTrigger, openMindMapModal, parseVerseReference]);
```

#### 修复 2：增强解析器鲁棒性

**文件**: `components/mindmap/markdownParser.ts`

**新增功能**:
- 当无匹配章节时，尝试通用列表解析
- 处理非标准格式的内容

```typescript
export function parseMarkdownToMindMap(markdown: string, rootTitle: string): MindMapNode {
  // ... 现有逻辑 ...

  // 如果没有匹配到任何章节，尝试通用解析
  if (rootChildren.length === 0) {
    rootChildren.push(...parseGenericContent(lines));
  }

  return rootNode;
}

function parseGenericContent(lines: string[]): MindMapNode[] {
  // 尝试解析任何列表项作为一级节点
  const children: MindMapNode[] = [];
  // ... 通用解析逻辑 ...
  return children;
}
```

### 3.3 Phase 2 详细方案：核心功能

#### 功能 1：节点展开/折叠

**修改**: `MindMapModal.tsx`

```typescript
// 初始化时启用节点交互
const mindMap = new MindMap({
  // ...existing config...
  enableEdit: false,
  enableNodeDrag: false,
  // 新增：启用节点点击
});

// 监听节点点击事件
mindMap.on('node_click', (node: any) => {
  // 切换展开/折叠状态
  const isCollapsed = node.nodeData.data.collapsed;
  mindMap.setNodeData(node, { collapsed: !isCollapsed });
  mindMap.render();
});
```

#### 功能 2：主题切换

**新增**: 主题配置

```typescript
const MINDMAP_THEMES = [
  { value: 'default', label: '经典', icon: '🎨' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'classic', label: '简约', icon: '📄' },
  { value: 'minions', label: '活泼', icon: '🌈' },
] as const;

// 在 MindMapModal 中
const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
  return isDarkMode ? 'dark' : 'default';
});

// 初始化时应用主题
const mindMap = new MindMap({
  theme: currentTheme,
  // ...
});
```

#### 功能 3：优化布局切换

**当前问题**: 每次布局切换都销毁并重建实例

**优化方案**: 使用 `setLayout()` 方法

```typescript
// 当前实现
mindMap.destroy();
mindMapRef.current = new MindMap({ layout: newLayout });

// 优化后
mindMap.setLayout(newLayout);
mindMap.fit();
```

### 3.4 Phase 3 详细方案：体验优化

#### 优化 1：移动端手势

**方案**: simple-mind-map 内置支持触摸事件，需确认配置

```typescript
const mindMap = new MindMap({
  // ...
  enableTouch: true,  // 启用触摸支持
});
```

**工具栏优化**:
- 增大按钮触控区域 (`min-h-[44px] min-w-[44px]`)
- 底部固定工具栏（移动端）

#### 优化 2：增强工具栏 UI

**新增功能**:
- 主题选择下拉
- 全屏切换按钮
- 节点搜索（大数据量场景）

#### 优化 3：导出选项扩展

```typescript
// 新增导出选项
const handleExport = useCallback(async (format: 'png' | 'svg') => {
  if (mindMapRef.current) {
    const data = await mindMapRef.current.export(format, true);

    if (format === 'svg') {
      // SVG 需要转换为文件
      const blob = new Blob([data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      // ...
    }
  }
}, []);
```

### 3.5 Phase 4 详细方案：社交功能

#### 功能 1：分享到小组

**参考**: 现有 `ShareCard` 组件的分享流程

```typescript
const handleShareToGroup = useCallback(async () => {
  // 1. 导出为图片
  const imageData = await mindMapRef.current.export('png', true);

  // 2. 上传图片
  const formData = new FormData();
  formData.append('image', dataURLtoBlob(imageData));

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const { url } = await uploadRes.json();

  // 3. 发布到小组动态
  await fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify({
      type: 'mindmap',
      imageUrl: url,
      verseRef: mindMapTitle,
    })
  });
}, [mindMapTitle]);
```

---

## 四、实施时间线

| 阶段 | 内容 | 预估时间 |
|------|------|---------|
| Phase 1 | 紧急修复 | 2h |
| Phase 2 | 核心功能 | 4h |
| Phase 3 | 体验优化 | 3h |
| Phase 4 | 社交功能 | 3h |
| **总计** | | **12h** |

---

## 五、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| simple-mind-map API 变更 | 功能异常 | 版本锁定，充分测试 |
| 大数据量性能 | 卡顿 | 添加节点数量提示，建议分段 |
| 移动端兼容性 | 体验不佳 | 真机测试，降级方案 |
| 导出图片质量问题 | 用户不满意 | 提供多种分辨率选项 |

---

## 六、验收标准

### 功能验收
- [ ] 所有 AI 回复（含历史消息）都能生成思维导图
- [ ] 点击节点可展开/折叠
- [ ] 至少 2 种主题可选
- [ ] 支持导出 PNG 和 SVG
- [ ] 移动端触控流畅

### 性能验收
- [ ] 弹窗打开时间 < 1s
- [ ] 布局切换时间 < 300ms
- [ ] 50 节点内无明显卡顿

### 兼容性验收
- [ ] Chrome、Safari、Firefox 最新版
- [ ] iOS Safari、Android Chrome
- [ ] 暗色模式正确显示