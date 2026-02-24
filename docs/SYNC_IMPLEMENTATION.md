# 数据同步与冲突解决策略 - 实现文档

## 📋 实现概览

已完成数据同步与冲突解决策略的完整实现，支持跨设备数据同步和冲突处理。

## ✅ 已完成的修改

### 1. 数据库模型更新

**文件**: `prisma/schema.prisma`

- ✅ 为 `Highlight` 模型添加 `updatedAt` 字段
- ✅ `Note` 模型已有 `updatedAt` 字段

```prisma
model Highlight {
  // ... 其他字段
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // 新增
}

model Note {
  // ... 其他字段
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // 已存在
}
```

### 2. TypeScript 类型定义

**文件**: `store/types.ts`

- ✅ 为 `HighlightData` 添加 `updatedAt?` 字段
- ✅ 为 `NoteData` 添加 `updatedAt?` 字段
- ✅ 新增 `SyncMode` 类型 (`'merge' | 'overwrite'`)
- ✅ 新增 `SyncSlice` 接口，包含同步状态管理
- ✅ 更新 `StoreState` 包含 `SyncSlice`

```typescript
export type SyncMode = 'merge' | 'overwrite';

export interface SyncSlice {
  syncMode: SyncMode;
  setSyncMode: (mode: SyncMode) => void;
  lastSyncTime: number | null;
  setLastSyncTime: (time: number) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  syncError: string | null;
  setSyncError: (error: string | null) => void;
}
```

### 3. 状态管理切片

**文件**: `store/slices.ts`

- ✅ 导入 `SyncSlice` 类型
- ✅ 更新 `addHighlightLocally` 自动添加 `updatedAt`
- ✅ 更新 `addNote` 自动添加 `updatedAt`
- ✅ 更新 `updateNote` 自动更新 `updatedAt`
- ✅ 新增 `createSyncSlice` 实现同步状态管理

### 4. 主 Store 配置

**文件**: `store/useBibleStore.ts`

- ✅ 导入 `createSyncSlice`
- ✅ 将 `createSyncSlice` 添加到 store 组合中
- ✅ 更新 `partialize` 配置，排除临时同步状态

### 5. 同步服务提供者

**文件**: `components/providers/SyncProvider.tsx`

完全重构，新增功能：

- ✅ **登录后自动拉取** - 用户登录后自动从服务器拉取数据
- ✅ **智能防抖保存** - 3秒防抖自动同步到服务器
- ✅ **冲突解决策略** - 支持 merge 和 overwrite 两种模式
- ✅ **同步状态管理** - 跟踪同步进度和错误
- ✅ **手动同步接口** - 暴露 `window.__syncToServer()` 供手动触发
- ✅ **完整数据同步** - 同步 settings、highlights、notes

#### 同步流程

```
1. 用户登录
   ↓
2. GET /api/user/sync → 拉取服务器数据
   ↓
3. 合并到本地状态
   ↓
4. 监听本地变化 (3秒防抖)
   ↓
5. POST /api/user/sync (mode: merge/overwrite)
   ↓
6. 服务器处理冲突
   ↓
7. 返回最新数据 → 更新本地状态
```

### 6. 后端 API 路由

**文件**: `app/api/user/sync/route.ts`

新增 `POST` 路由，实现：

- ✅ **Settings 同步** - upsert 用户设置
- ✅ **Highlights 同步** - 根据 bookId/chapter/verse 判断冲突
- ✅ **Notes 同步** - 根据 id 判断冲突
- ✅ **时间戳比较** - merge 模式下比较 `updatedAt`
- ✅ **模式支持** - merge (智能合并) / overwrite (本地覆盖)

#### 冲突解决逻辑

**Merge 模式 (默认)**:
- 只在客户端数据更新时间 > 服务器数据更新时间时才更新
- 保留双方最新的修改

**Overwrite 模式**:
- 无条件用客户端数据覆盖服务器数据
- 适用于用户明确要求以本地为准的场景

### 7. UI 组件

**文件**: `components/settings/SyncSettings.tsx` (新建)

- ✅ 同步模式选择 (智能合并 / 本地覆盖)
- ✅ 同步状态显示 (上次同步时间)
- ✅ 同步进度指示器
- ✅ 错误提示
- ✅ 手动同步按钮
- ✅ 未登录状态提示

**文件**: `app/page.tsx`

- ✅ 导入 `SyncSettings` 组件
- ✅ 在移动端设置面板中添加同步设置区域

## 🎯 功能特性

### 1. 冲突解决策略

#### 智能合并 (Merge)
- **适用场景**: 多设备日常使用
- **行为**: 
  - 比较每条记录的 `updatedAt` 时间戳
  - 保留最新的修改
  - 不会丢失任何设备上的数据

#### 本地覆盖 (Overwrite)
- **适用场景**: 
  - 重装应用后恢复数据
  - 确信本地数据是最新的
- **行为**:
  - 无条件用本地数据覆盖服务器
  - 服务器上的修改会被丢弃

### 2. 自动同步

- **登录同步**: 用户登录后立即拉取服务器数据
- **变更同步**: 本地数据变化后 3 秒防抖自动同步
- **状态反馈**: 实时显示同步状态和错误

### 3. 数据完整性

- **时间戳追踪**: 每条记录都有 `updatedAt` 字段
- **冲突检测**: 基于时间戳的精确冲突判断
- **原子操作**: 单条记录的更新是原子的

## 📱 UI/UX

### 移动端设置面板
```
┌─────────────────────────────┐
│  阅读设置                    │
├─────────────────────────────┤
│  字号大小: 18px              │
│  行间距: 标准                │
│  中英对照: 已开启            │
├─────────────────────────────┤
│  ☁️ 数据同步                 │
│  ┌───────────────────────┐  │
│  │ 冲突解决策略           │  │
│  │ [智能合并] [本地覆盖]  │  │
│  │                       │  │
│  │ 上次同步: 2分钟前      │  │
│  │                       │  │
│  │ [🔄 立即同步]          │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## 🔄 同步数据范围

### Settings (设置)
- fontSize (字号)
- lineHeight (行距)
- isDarkMode (深色模式)
- showEnglish (中英对照)
- lastBook (最后阅读书卷)
- lastChapter (最后阅读章节)

### Highlights (高亮)
- bookId (书卷ID)
- chapter (章节)
- verse (经节)
- color (颜色)
- updatedAt (更新时间)

### Notes (笔记)
- id (笔记ID)
- bookId (书卷ID)
- chapter (章节)
- verse (经节)
- content (内容)
- updatedAt (更新时间)

## 🚀 部署步骤

### 1. 数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 变更到数据库
npx prisma db push

# 或创建迁移 (生产环境推荐)
npx prisma migrate dev --name add_updated_at_to_highlight
```

### 2. 环境变量

确保 `.env` 中配置了数据库连接：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/scripture_db"
```

### 3. 重启应用

```bash
npm run dev
```

## 🧪 测试清单

### 功能测试

- [ ] 未登录状态：显示提示信息
- [ ] 登录后：自动拉取服务器数据
- [ ] 修改设置：3秒后自动同步
- [ ] 添加高亮：自动添加 updatedAt
- [ ] 添加笔记：自动添加 updatedAt
- [ ] Merge 模式：保留最新修改
- [ ] Overwrite 模式：本地覆盖服务器
- [ ] 手动同步按钮：立即触发同步
- [ ] 同步状态显示：正确显示时间
- [ ] 错误处理：显示错误信息

### 冲突场景测试

- [ ] **场景 1**: 设备 A 修改高亮，设备 B 也修改同一高亮
  - Merge: 保留最新的修改
  - Overwrite: 设备 B 的修改覆盖设备 A

- [ ] **场景 2**: 设备 A 离线添加笔记，设备 B 在线添加笔记
  - Merge: 两个笔记都保留
  - Overwrite: 取决于同步顺序

- [ ] **场景 3**: 服务器有数据，本地是新设备
  - 首次登录: 拉取服务器数据

## 📊 性能优化

1. **防抖机制**: 3秒防抖避免频繁请求
2. **增量同步**: 只同步变化的数据
3. **批量操作**: 一次性同步所有数据类型
4. **本地优先**: 本地状态立即更新，后台同步

## 🔒 安全考虑

1. **认证检查**: 所有同步 API 都需要登录
2. **数据隔离**: 用户只能访问自己的数据
3. **输入验证**: 后端验证所有输入数据
4. **错误处理**: 不暴露敏感错误信息

## 🎨 未来改进

- [ ] 同步历史记录和回滚
- [ ] 细粒度冲突解决 (逐条记录选择)
- [ ] 离线队列和重试机制
- [ ] WebSocket 实时同步
- [ ] 数据版本号 (替代时间戳)
- [ ] 同步冲突可视化
- [ ] 选择性同步 (只同步部分数据)

## 📝 代码示例

### 手动触发同步

```typescript
// 在任何组件中
if (typeof window !== 'undefined' && (window as any).__syncToServer) {
  await (window as any).__syncToServer();
}
```

### 使用同步状态

```typescript
import { useBibleStore } from '@/store/useBibleStore';

function MyComponent() {
  const { syncMode, setSyncMode, isSyncing, lastSyncTime } = useBibleStore();
  
  return (
    <div>
      <p>同步模式: {syncMode}</p>
      <p>同步状态: {isSyncing ? '同步中...' : '已同步'}</p>
      <button onClick={() => setSyncMode('overwrite')}>
        切换到覆盖模式
      </button>
    </div>
  );
}
```

## 🐛 已知问题

1. **Prisma 版本不匹配警告**: 本地开发环境可能有版本警告，不影响功能
2. **首次部署需要数据库连接**: 确保数据库服务正在运行

## 📚 相关文档

- [Prisma Schema 文档](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Zustand 状态管理](https://github.com/pmndrs/zustand)
- [NextAuth.js 认证](https://next-auth.js.org/)

---

**实现日期**: 2026-02-24  
**版本**: v1.0.0  
**作者**: Claude AI Assistant
