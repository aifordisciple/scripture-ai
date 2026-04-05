// apps/desktop/src/components/KeyboardShortcutsHelp.tsx
/**
 * Keyboard shortcuts help modal
 *
 * Displays all available keyboard shortcuts
 */

import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string;
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: '导航',
    shortcuts: [
      { keys: 'Ctrl/Cmd + 1-5', description: '切换页面标签' },
      { keys: '← / →', description: '上一章 / 下一章' },
      { keys: 'Ctrl/Cmd + B', description: '切换侧边栏' },
      { keys: 'Ctrl/Cmd + G', description: '快速跳转到经文' },
    ],
  },
  {
    title: '标签页',
    shortcuts: [
      { keys: 'Ctrl/Cmd + N', description: '新建标签页' },
      { keys: 'Ctrl/Cmd + W', description: '关闭当前标签页' },
      { keys: '鼠标中键', description: '关闭标签页' },
    ],
  },
  {
    title: '操作',
    shortcuts: [
      { keys: 'Ctrl/Cmd + K', description: '打开命令面板' },
      { keys: 'Ctrl/Cmd + F', description: '搜索经文' },
      { keys: 'Escape', description: '关闭弹窗/取消选择' },
    ],
  },
  {
    title: '界面',
    shortcuts: [
      { keys: 'Ctrl/Cmd + Shift + D', description: '切换深色模式' },
      { keys: 'Ctrl/Cmd + /', description: '显示快捷键帮助' },
      { keys: '?', description: '显示快捷键帮助' },
    ],
  },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Keyboard className="w-5 h-5" />
            <h3>键盘快捷键</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="shortcut-group">
              <h4 className="shortcut-group-title">{group.title}</h4>
              <div className="shortcut-list">
                {group.shortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <span className="shortcut-keys">{shortcut.keys}</span>
                    <span className="shortcut-description">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <p className="shortcut-hint">按 <kbd>?</kbd> 或 <kbd>Ctrl</kbd> + <kbd>/</kbd> 随时打开此帮助</p>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcutsHelp() {
  // This hook can be used to manage the help modal state
  // and integrate with the keyboard shortcuts system
}