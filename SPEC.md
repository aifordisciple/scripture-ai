# SPEC: 讲章系统深度重构 — 心流体验与AI写作助手对齐

## Objective

将讲章功能从"工具集合"重构为"心流引导系统"，让用户在准备讲道的过程中始终处于沉浸、连贯的创作状态。核心对标千问等一流AI写作助手的内联补全体验，同时保留讲章特有的结构化引导能力。

### 目标用户

- **传道人/牧师**：系统性讲章准备流程
- **带职传道/平信徒**：更多AI辅助和指导
- **神学生**：学习讲章写作，需要模板和AI教练

### 核心体验目标

1. **零切换心流**：AI辅助直接在编辑器内发生，无需切换面板
2. **渐进式引导**：从经文研读→大纲→初稿→精修→审查，每一步都有智能建议
3. **即时响应**：AI操作流式输出、内联呈现，像千问写作助手一样自然

---

## Current Pain Points (现状痛点分析)

### P1: 面板切换割裂
- **现状**：6个面板（列表/AI/经文/模板/审查/设置）通过侧边栏切换，编辑器和AI面板分处两列
- **痛点**：写稿时需要AI续写→切到AI面板→输入→等回复→点"插入"→切回编辑器，至少4步操作
- **理想**：在编辑器中直接触发AI，结果内联呈现

### P2: AI响应不连贯
- **现状**：`EditorToolbar`的续写/润色调用`/api/chat/sermon`（非流式），`SermonAIPanel`的聊天调用`/api/sermon/[id]/ai-chat`（流式），两套独立系统
- **痛点**：工具栏AI操作是同步等待整段返回，用户看到loading spinner无法继续编辑；AI面板的流式输出又需要手动插入
- **理想**：所有AI操作统一流式输出，内联补全式呈现

### P3: 操作步骤繁琐
- **现状**：插入经文需要点工具栏→3步选择器→确认；插入段落标题需要点工具栏→下拉菜单→选择
- **痛点**：频繁的弹窗和选择打断写作节奏
- **理想**：AI自动识别上下文建议插入经文/段落，或用快捷键/斜杠命令快速触发

### P4: 缺少流程引导
- **现状**：创建讲章后直接进入空白编辑器，用户需要自己知道下一步做什么
- **痛点**：新手不知道从何开始，老手也需要记住流程
- **理想**：根据讲章当前状态智能建议下一步操作

---

## Architecture Changes

### 1. 编辑器内AI补全系统 (Inline AI Completion)

**替换**：`EditorToolbar`的AI续写/润色按钮 + `SermonAIPanel`的"插入到编辑器"流程

**新设计**：
- 在Vditor编辑器中实现"幽灵文本"(ghost text)补全
- 用户按`Tab`接受补全，按`Esc`拒绝，继续打字则忽略
- 选中文字后出现浮动工具条（floating toolbar），提供：润色、扩写、缩写、插入经文、添加例证
- AI操作统一走流式API，补全文本以半透明灰色内联显示

**技术方案**：
- Vditor不支持原生ghost text，需要通过CSS + DOM操作模拟
- 在编辑器的contenteditable区域中，在光标位置插入一个`<span class="ai-ghost-text">`元素
- 流式更新该span的内容
- Tab键监听：将ghost text转为正式文本
- 选中文字时：在selection上方显示浮动工具条

**新增文件**：
- `components/sermon/InlineAICompletion.tsx` — 内联补全控制器
- `components/sermon/FloatingToolbar.tsx` — 选中文本的浮动工具条
- `hooks/use-inline-ai.ts` — 内联AI补全hook

**修改文件**：
- `components/sermon/VditorEditor.tsx` — 添加ghost text渲染支持、Tab键监听
- `components/sermon/EditorToolbar.tsx` — 简化为快捷操作入口（保留经文选择器、段落标题，移除AI续写/润色按钮）
- `app/api/sermon/ai-action/route.ts` — 改为流式响应（streamText替代generateText）

### 2. AI助手面板重构 (AI Copilot Panel)

**替换**：`SermonAIPanel`的独立聊天面板

**新设计**：
- 面板从"聊天窗口"变为"AI副驾驶"面板，始终可见于编辑器右侧
- 三个标签页：
  - **对话**：保留当前聊天功能，但AI回复自动高亮可插入段落
  - **建议**：根据当前讲章状态智能推荐下一步操作（如"建议添加引言"、"建议插入经文引用"）
  - **上下文**：显示当前讲章的经文引用、大纲结构、写作进度

**修改文件**：
- `components/sermon/SermonAIPanel.tsx` — 重构为三标签页AI副驾驶面板
- `store/slices/sermonSlice.ts` — 添加`sermonAiSuggestions`、`sermonOutline`状态
- `app/api/sermon/[id]/ai-chat/route.ts` — 增强上下文感知（传入当前光标位置的内容片段）

### 3. 讲章流程引导系统 (Flow Guide)

**新增**：基于讲章状态的智能引导

**设计**：
- 讲章生命周期：`经文研读 → 大纲构建 → 初稿撰写 → 内容精修 → 审查完善`
- 每个阶段有对应的AI建议和快捷操作
- 在编辑器顶部显示进度条和当前阶段
- 阶段转换条件：
  - 经文研读→大纲构建：用户开始输入标题或大纲
  - 大纲构建→初稿撰写：大纲结构完整（有引言+至少1个要点+结论）
  - 初稿撰写→内容精修：字数超过500
  - 内容精修→审查完善：用户触发审查或字数超过1500

**新增文件**：
- `components/sermon/FlowGuide.tsx` — 流程引导组件（进度条+阶段提示）
- `components/sermon/FlowSuggestions.tsx` — 阶段性建议卡片
- `lib/sermon-flow.ts` — 讲章阶段判断逻辑、建议生成

**修改文件**：
- `components/sermon/SermonEditor.tsx` — 集成FlowGuide
- `store/slices/sermonSlice.ts` — 添加`sermonFlowStage`状态
- `store/types.ts` — 添加`SermonFlowStage`类型

### 4. 快捷操作系统 (Slash Commands & Quick Actions)

**替换**：`EditorToolbar`的多级菜单

**新设计**：
- 在编辑器中输入`/`触发斜杠命令菜单：
  - `/verse` — 插入经文引用
  - `/section` — 插入段落标题
  - `/continue` — AI续写
  - `/polish` — AI润色选中文字
  - `/example` — AI添加例证
  - `/crossref` — AI交叉引用
  - `/template` — 应用模板
  - `/review` — 生成审查报告
- 键盘快捷键：
  - `Cmd+J` / `Ctrl+J` — 触发AI续写（ghost text）
  - `Cmd+Shift+J` — 打开AI副驾驶面板
  - `Cmd+/` — 打开斜杠命令菜单

**新增文件**：
- `components/sermon/SlashCommandMenu.tsx` — 斜杠命令菜单组件
- `hooks/use-slash-commands.ts` — 斜杠命令hook

**修改文件**：
- `components/sermon/VditorEditor.tsx` — 添加`/`键监听和命令触发
- `components/sermon/EditorToolbar.tsx` — 简化，保留核心按钮但减少层级

### 5. 创建流程优化

**修改**：`NewSermonDialog`

**新设计**：
- 创建后自动生成大纲（而非空白模板）
- 创建流程增加"AI生成大纲"选项
- 大纲生成后进入编辑器，FlowGuide显示在"大纲构建"阶段
- 如果用户选择跳过AI大纲，FlowGuide显示在"经文研读"阶段

**修改文件**：
- `components/sermon/NewSermonDialog.tsx` — 添加"AI生成大纲"选项
- `app/api/sermon/route.ts` — POST时可选触发大纲生成

---

## Commands

```bash
# Development
npm run dev

# Build & Deploy
docker-compose down && docker-compose up -d --build

# Auto Deploy
./auto_deploy.sh -s "<summary>" -d "<detail>"
```

---

## Project Structure (Changes Only)

```
components/sermon/
├── SermonTab.tsx                  # MODIFY: 集成FlowGuide，调整布局
├── SermonEditor.tsx               # MODIFY: 集成FlowGuide、InlineAI
├── SermonAIPanel.tsx              # REWRITE: AI Copilot三标签面板
├── EditorToolbar.tsx              # MODIFY: 简化，移除AI按钮
├── VditorEditor.tsx               # MODIFY: ghost text、斜杠命令、快捷键
├── NewSermonDialog.tsx            # MODIFY: 添加AI大纲生成选项
├── InlineAICompletion.tsx         # NEW: 内联AI补全控制器
├── FloatingToolbar.tsx            # NEW: 选中文本浮动工具条
├── FlowGuide.tsx                  # NEW: 流程引导进度条
├── FlowSuggestions.tsx            # NEW: 阶段性建议卡片
├── SlashCommandMenu.tsx           # NEW: 斜杠命令菜单
├── SermonSidebar.tsx              # MODIFY: 精简面板切换
├── SermonVersePanel.tsx           # KEEP: 保留经文面板
├── SermonTemplatePanel.tsx        # KEEP: 保留模板面板
├── SermonReviewPanel.tsx          # MODIFY: 审查结果可一键应用建议
├── SermonSettingsPanel.tsx        # KEEP: 保留设置面板
├── SermonListPanel.tsx            # KEEP: 保留列表面板
├── SermonEditorContext.tsx        # MODIFY: 添加ghost text控制方法
├── SermonErrorBoundary.tsx        # KEEP
├── SermonMobileBottomBar.tsx      # MODIFY: 适配新面板结构
└── VersePickerPopover.tsx         # KEEP

hooks/
├── use-inline-ai.ts               # NEW: 内联AI补全hook
└── use-slash-commands.ts          # NEW: 斜杠命令hook

lib/
├── sermon-flow.ts                 # NEW: 讲章阶段判断逻辑
├── sermon-vditor.ts               # MODIFY: 添加ghost text渲染支持
└── constants.ts                   # MODIFY: 更新AI提示词

app/api/sermon/
├── ai-action/route.ts             # MODIFY: 改为流式响应
├── [id]/ai-chat/route.ts          # MODIFY: 增强上下文感知
└── [id]/ai-suggest/route.ts       # NEW: 阶段性建议API

store/slices/
└── sermonSlice.ts                 # MODIFY: 添加flow stage、suggestions状态
```

---

## Code Style

- TypeScript strict mode, no `as any` or `@ts-ignore`
- Immutable state updates (spread operator)
- Components: PascalCase files, functional components with hooks
- Hooks: kebab-case files (`use-inline-ai.ts`)
- API routes: lowercase paths
- Path alias `@/` for all imports
- `"use client"` for client components
- Files < 400 lines preferred, 800 max
- Functions < 50 lines
- No deep nesting (> 4 levels)

---

## Testing Strategy

### Unit Tests
- `lib/sermon-flow.ts` — 阶段判断逻辑
- `hooks/use-inline-ai.ts` — 内联AI补全状态管理
- `hooks/use-slash-commands.ts` — 斜杠命令解析

### Integration Tests
- API routes: `/api/sermon/ai-action`（流式响应验证）
- API routes: `/api/sermon/[id]/ai-suggest`（建议生成）

### E2E Tests (Playwright)
- 创建讲章→AI大纲生成→编辑→内联补全→审查 完整流程
- 斜杠命令触发和执行
- 浮动工具条交互

---

## Boundaries

### Always Do
- 所有AI操作必须走流式响应（streamText），不允许同步等待
- 编辑器内的AI交互必须不阻断用户操作（ghost text模式）
- 保留现有数据模型和API兼容性（不破坏已有讲章数据）
- 移动端适配所有新交互（触摸友好的浮动工具条、底部命令面板）
- i18n支持所有新增UI文本

### Ask First About
- Vditor编辑器的ghost text实现方案（可能需要评估是否切换到支持更好的编辑器）
- AI大纲生成的触发时机（创建时自动 vs 用户手动）
- 流程引导的强制程度（建议性 vs 阻断性）

### Never Do
- 不删除现有API端点（保持向后兼容）
- 不修改Prisma schema中的Sermon模型核心字段
- 不引入新的外部编辑器依赖（在Vditor上扩展）
- 不在编辑器外弹窗显示AI结果（所有AI输出内联或侧边面板）
- 不自动保存AI生成的内容（必须用户明确接受）
