// scripts/test-sync.js
/**
 * 数据同步功能测试脚本
 * 运行方式：在浏览器控制台中执行
 */

// 测试 1: 检查同步状态
console.log('=== 测试 1: 检查同步状态 ===');
console.log('window.__syncToServer 存在:', typeof window.__syncToServer === 'function');

// 测试 2: 获取当前同步配置
console.log('\n=== 测试 2: 当前同步配置 ===');
const store = useBibleStore.getState();
console.log('同步模式:', store.syncMode);
console.log('上次同步时间:', store.lastSyncTime ? new Date(store.lastSyncTime).toLocaleString() : '从未同步');
console.log('是否正在同步:', store.isSyncing);
console.log('同步错误:', store.syncError);

// 测试 3: 检查本地数据
console.log('\n=== 测试 3: 本地数据统计 ===');
console.log('高亮数量:', store.highlights.length);
console.log('笔记数量:', store.notes.length);
console.log('设置:', {
  fontSize: store.fontSize,
  lineHeight: store.lineHeight,
  isDarkMode: store.isDarkMode,
  showEnglish: store.showEnglish,
});

// 测试 4: 模拟添加高亮（带时间戳）
console.log('\n=== 测试 4: 测试添加高亮 ===');
const testHighlight = {
  bookId: 'Gen',
  chapter: 1,
  verse: 1,
  color: '#FFD700',
};
console.log('添加测试高亮:', testHighlight);
store.addHighlightLocally(testHighlight);
console.log('添加后高亮数量:', store.highlights.length);
console.log('最新高亮:', store.highlights[store.highlights.length - 1]);

// 测试 5: 切换同步模式
console.log('\n=== 测试 5: 切换同步模式 ===');
console.log('当前模式:', store.syncMode);
store.setSyncMode('overwrite');
console.log('切换后模式:', useBibleStore.getState().syncMode);
store.setSyncMode('merge'); // 恢复
console.log('恢复后模式:', useBibleStore.getState().syncMode);

// 测试 6: 手动触发同步（如果已登录）
console.log('\n=== 测试 6: 手动同步测试 ===');
if (typeof window.__syncToServer === 'function') {
  console.log('触发手动同步...');
  window.__syncToServer().then(() => {
    console.log('同步完成！');
    console.log('新的同步时间:', new Date(useBibleStore.getState().lastSyncTime).toLocaleString());
  }).catch(err => {
    console.error('同步失败:', err);
  });
} else {
  console.log('同步函数未就绪，可能未登录');
}

console.log('\n✅ 测试脚本执行完成！');
console.log('提示: 等待 3 秒后检查是否自动同步');
