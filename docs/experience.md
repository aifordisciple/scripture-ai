# Bug 修复经验总结

> 本文档记录 bug 修复过程中积累的经验教训，供后续开发参考。每次修复 bug 后应追加条目，处理新 bug 前应先查阅是否有可借鉴的经验。

---

## 1. React useEffect 中 setTimeout 被 cleanup 清除

**日期**: 2026-05-08
**场景**: 经文跳转高亮功能（scrollToVerse）
**现象**: `scrollIntoView` 和高亮动画始终不执行，但 effect 内部日志显示逻辑分支已正确进入。

### 根因

在 useEffect 中，先调用 `setState`（触发重渲染），再设置 `setTimeout`。当 setState 导致 effect 重新执行时，React 先执行上一次 effect 的 cleanup 函数（`clearTimeout`），把还没执行的定时器清除了。

```typescript
// 错误写法
useEffect(() => {
  if (!condition) return;
  setState(null);          // 触发重渲染 → effect 重新执行 → cleanup 清除 timer
  const timer = setTimeout(() => {
    doSomething();         // 永远不会执行！
  }, 300);
  return () => clearTimeout(timer);
}, [state]);

// 正确写法
useEffect(() => {
  if (!condition) return;
  const timer = setTimeout(() => {
    doSomething();
    setState(null);        // 在回调内部清除，确保 doSomething 先执行
  }, 300);
  return () => clearTimeout(timer);
}, [state]);
```

### 经验法则

1. **在 useEffect 中，setState 和 setTimeout 不要同时使用**——如果 setState 在 setTimeout 之前调用，cleanup 会清除 timer。
2. **setState 应放在 setTimeout 回调内部**，确保副作用先执行，再清除状态。
3. **调试时不要只看 effect 入口日志**，还要看 setTimeout 回调是否真正执行。如果入口日志有但回调没有，大概率是 cleanup 问题。

---

## 2. React 状态同步时序：props 更新先于数据就绪

**日期**: 2026-05-08
**场景**: 跨章节经文跳转（SearchResults → Reader）
**现象**: 跨章节跳转时高亮不生效，同章节跳转正常。

### 根因

React 的批量更新机制导致多个状态在同一个渲染周期内变化。当 `handleResultClick` 更新 tab 的 `book`/`chapter` 时，Reader 的 `initialBook`/`initialChapter` props 立即变化，内部 `book`/`chapter` state 同步更新。但 `useBibleData` 的数据获取是异步的，此时 `verses` 还是旧章节数据。

如果 effect 只检查 `book`/`chapter` 是否匹配目标就执行，会在旧 DOM 上操作并清除 `scrollToVerse`，导致新数据加载后无法再触发。

```typescript
// 错误判断：book/chapter 已更新但 verses 还是旧数据
if (scrollToVerse.bookId !== book || scrollToVerse.chapter !== chapter) return;
// ↑ 此时 book/chapter 已经是新值，检查通过，但 verses 是旧数据！

// 正确判断：验证 verses 的实际数据是否匹配
const firstVerse = verses.find(v => v.version === primaryVersion);
if (firstVerse && (firstVerse.bookId !== scrollToVerse.bookId ||
    firstVerse.chapter.toString() !== scrollToVerse.chapter)) {
  return; // verses 数据还是旧章节的，等数据更新后再执行
}
```

### 经验法则

1. **不要信任"元数据"状态来判断数据是否就绪**——`book`/`chapter` 等标识状态可能先于实际数据更新。应验证数据本身（如 verses 数组的内容）是否与目标匹配。
2. **跨组件/跨 hook 的状态同步存在时序差**——props 更新是同步的，数据获取是异步的。effect 中必须考虑"状态已更新但数据未就绪"的中间态。
3. **调试时记录完整状态快照**——同时记录 `book`、`chapter`、`verses.length`、`firstVerse`、`loading` 等关联状态，才能发现时序问题。

---

## 3. 调试策略：从"不工作"到"找到根因"

**日期**: 2026-05-08
**场景**: 上述两个 bug 的调试过程

### 踩过的坑

1. **过早优化假设**——前 4 次修复都假设问题在 effect 的触发时机（何时执行），实际根因在 effect 的执行结果（setTimeout 被 cleanup 清除）。
2. **日志位置不够深**——只在 effect 入口打日志，看到 "EXECUTING" 就以为逻辑正确，没发现 setTimeout 回调从未执行。
3. **忽略 React 的 cleanup 机制**——在 useEffect 中使用 setTimeout 时，没有考虑 setState 触发重渲染后 cleanup 会清除 timer。

### 有效的调试方法

1. **在 setTimeout 回调内部也打日志**——确认回调是否真正执行，而不仅仅是 effect 入口。
2. **在 store 层面追踪状态变化**——在 `setScrollToVerse` 实现中加日志，追踪何时被调用、调用栈是什么，发现 `setScrollToVerse(null)` 在 setTimeout 之前被调用。
3. **记录完整状态快照**——同时记录多个关联状态（scrollToVerse、loading、book、chapter、firstVerse），而不是只看单个状态，才能发现时序问题。
4. **逐步缩小范围**——先确认 effect 是否触发，再确认条件分支是否正确，再确认 DOM 操作是否执行，最后确认结果是否被覆盖。

### 经验法则

1. **日志要覆盖完整执行链路**——effect 入口 → 条件判断 → setTimeout 回调 → DOM 操作，每一层都要有日志。
2. **"逻辑正确但结果不对"时，检查副作用时序**——特别是 cleanup、setState 顺序、异步回调是否被取消。
3. **在 Zustand store 的 setter 中加日志**——可以追踪状态变化的来源和调用栈，比只在组件中观察更有效。
4. **不要假设"这次应该修好了"**——每次修复后必须构建部署验证，避免在错误假设上叠加更多修复。
