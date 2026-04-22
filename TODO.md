# i18n TODO - 待翻译页面与功能

## 已完成

- [x] i18n 基础设施 (lib/i18n/: t(), useTranslation(), zh.ts, en.ts)
- [x] LocaleSlice (store/slices/localeSlice.ts) + localStorage 持久化
- [x] DualLangString 类型 + 所有 AI 提示词双语化 (lib/constants.ts)
- [x] 语言切换 UI (page.tsx 顶部工具栏 + 设置面板)
- [x] 所有 chat API 路由接受 locale 参数并解析 DualLangString
- [x] AISidebar useChat 传递 locale
- [x] page.tsx 设置面板翻译 (深色/浅色模式、字号、行间距、双语对照、语言、TTS、关闭按钮)
- [x] page.tsx 工具栏翻译 (搜索占位符、tab 标签、读经计划 title)
- [x] QuickPrompts.tsx DualLangString 解析
- [x] Reader.tsx CHAPTER_SUMMARY_PROMPT DualLangString 解析
- [x] locale 切换时自动开启双语对照 (en → showEnglish)

## 待翻译组件 (硬编码中文 → t() 调用)

### P0 - 核心交互组件
- [ ] **components/bible/AISidebar.tsx** - AI 对话界面 (~600 行)
  - 模式标签 (标准/导师/讲道/查经/自定义)
  - 输入框占位符、思考中、新对话等
  - 会话管理 (重命名、删除确认)
  - 字体大小选择 (小/中/大/超大)
- [ ] **components/bible/Sidebar.tsx** - 圣经目录侧边栏
  - 旧约/新约标题、搜索占位符、章节
- [ ] **components/bible/PlanTab.tsx** - 读经计划 (~600 行)
  - 计划标题、进度、打卡、AI 定制等
- [ ] **components/bible/FloatingMenu.tsx** - 浮动操作菜单
  - 复制/高亮/笔记/分享/AI解读/朗读/串珠/地图等
- [ ] **components/bible/Reader.tsx** - 阅读器
  - 章节摘要按钮 "阅读第 X 章精意"
  - 错误提示、加载状态

### P1 - 辅助组件
- [ ] **components/bible/HighlightsTab.tsx** - 高亮标签页
- [ ] **components/bible/SearchResults.tsx** - 搜索结果
- [ ] **components/bible/BookPicker/index.tsx** - 书卷选择器
- [ ] **components/bible/ShareCard.tsx** - 分享卡片
- [ ] **components/bible/GroupTab.tsx** - 小组读经
- [ ] **components/settings/ApiSettingsDialog.tsx** - API 配置
- [ ] **components/settings/SyncSettings.tsx** - 同步设置
- [ ] **components/settings/NotificationSettings.tsx** - 通知设置
- [ ] **components/auth/UserMenu.tsx** - 用户菜单
- [ ] **components/onboarding/** - 引导流程

### P2 - 次要组件
- [ ] **components/atlas/** - 圣经地图/时间线
- [ ] **components/theme/** - 主题网络
- [ ] **components/group/** - 小组管理
- [ ] **components/feedback/** - 反馈

## 待实现功能

- [ ] **UserSetting 同步** - 登录用户 locale 持久化到服务器
  - prisma schema 已添加 `locale` 字段到 UserSetting
  - 需实现: 登录时加载 locale、切换时保存到 /api/user/settings
- [ ] **浏览器语言检测** - 首次访问时根据 navigator.language 自动设置 locale
- [ ] **英文 locale 下 KJV 为主版本** - Reader.tsx 中根据 locale 调整主/辅版本显示顺序
- [ ] **读经计划双语数据** - lib/plans.ts 添加 titleEn, descriptionEn, tagsEn
- [ ] **BIBLE_BOOKS 英文名使用** - 组件中使用 getBookDisplayName(bookId, locale) 替代 .bookName

## 翻译字典补充

当前 zh.ts/en.ts 已覆盖约 190 个 key，但以下场景可能需要补充:
- 认证/登录相关文本
- 错误提示消息
- 通知文本
- PWA 安装提示
- 管理后台文本
