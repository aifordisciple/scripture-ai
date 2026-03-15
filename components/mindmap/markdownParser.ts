// components/mindmap/markdownParser.ts
import { MindMapNode } from '@/store/types';

/**
 * AI 解读回复的章节模板定义
 */
const SECTION_HEADERS = [
  { pattern: /### 🎯 解读范围/, key: 'scope', label: '解读范围' },
  { pattern: /### 📖 背景与情境/, key: 'context', label: '背景与情境' },
  { pattern: /### 🔍 深度释经/, key: 'exegesis', label: '深度释经' },
  { pattern: /### ✝️ 基督视角/, key: 'christ', label: '基督视角' },
  { pattern: /### 💡 现代应用/, key: 'application', label: '现代应用' },
  { pattern: /### 🙏 引导祷告/, key: 'prayer', label: '引导祷告' },
  { pattern: /### 🤔 反思问题/, key: 'reflection', label: '反思问题' },
];

/**
 * 清理 Markdown 格式，提取纯文本
 */
function cleanText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // 移除加粗
    .replace(/\*(.+?)\*/g, '$1')        // 移除斜体
    .replace(/`(.+?)`/g, '$1')          // 移除代码标记
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接，保留文本
    .replace(/^[•\-\*]\s*/, '')          // 移除列表标记
    .replace(/^\d+\.\s*/, '')            // 移除数字列表标记
    .trim();
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 解析章节内容中的要点
 */
function parseBulletPoints(lines: string[], startIdx: number): { children: MindMapNode[], endIdx: number } {
  const children: MindMapNode[] = [];
  let i = startIdx;
  let currentParent: MindMapNode | null = null;
  let currentChildren: MindMapNode[] = [];

  while (i < lines.length) {
    const line = lines[i].trim();

    // 遇到新的章节标题，停止解析
    if (line.match(/^### /)) {
      break;
    }

    // 空行，结束当前父节点的收集
    if (!line) {
      if (currentParent && currentChildren.length > 0) {
        currentParent.children = currentChildren;
        currentChildren = [];
      }
      i++;
      continue;
    }

    // 一级列表项（- 或 * 开头）
    if (line.match(/^[-*]\s+/)) {
      // 如果有正在收集的子节点，添加到上一个父节点
      if (currentParent && currentChildren.length > 0) {
        currentParent.children = currentChildren;
        currentChildren = [];
      }

      const text = cleanText(line);
      if (text) {
        currentParent = {
          id: generateId(),
          text,
          children: []
        };
        children.push(currentParent);
      }
      i++;
      continue;
    }

    // 二级列表项（缩进后的 - 或 * 或数字）
    if (line.match(/^\s+[-*]\s+/) || line.match(/^\s+\d+\.\s+/)) {
      const text = cleanText(line);
      if (text && currentParent) {
        currentChildren.push({
          id: generateId(),
          text
        });
      }
      i++;
      continue;
    }

    // 数字列表项
    if (line.match(/^\d+\.\s+/)) {
      if (currentParent && currentChildren.length > 0) {
        currentParent.children = currentChildren;
        currentChildren = [];
      }

      const text = cleanText(line);
      if (text) {
        currentParent = {
          id: generateId(),
          text,
          children: []
        };
        children.push(currentParent);
      }
      i++;
      continue;
    }

    // 普通文本段落（作为最后一个父节点的补充说明）
    if (line && currentParent) {
      // 如果有子节点，将段落文本作为一个新的子节点
      const text = cleanText(line);
      if (text) {
        currentChildren.push({
          id: generateId(),
          text
        });
      }
    }

    i++;
  }

  // 处理最后未完成的父节点
  if (currentParent && currentChildren.length > 0) {
    currentParent.children = currentChildren;
  }

  return { children, endIdx: i };
}

/**
 * 解析 AI 回复的 Markdown 内容，生成思维导图树形结构
 * @param markdown AI 回复的 Markdown 文本
 * @param rootTitle 根节点标题（通常是经文引用，如 "创世记 1:1-5"）
 */
export function parseMarkdownToMindMap(markdown: string, rootTitle: string): MindMapNode {
  const lines = markdown.split('\n');
  const rootChildren: MindMapNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 查找章节标题
    let sectionFound = false;
    for (const section of SECTION_HEADERS) {
      if (section.pattern.test(line)) {
        // 创建章节节点
        const sectionNode: MindMapNode = {
          id: generateId(),
          text: section.label,
          children: []
        };

        // 解析章节内容
        const result = parseBulletPoints(lines, i + 1);
        sectionNode.children = result.children;
        i = result.endIdx;

        // 只添加有内容的章节
        if (sectionNode.children && sectionNode.children.length > 0) {
          rootChildren.push(sectionNode);
        }

        sectionFound = true;
        break;
      }
    }

    if (!sectionFound) {
      i++;
    }
  }

  // 构建根节点
  const rootNode: MindMapNode = {
    id: generateId(),
    text: rootTitle,
    children: rootChildren
  };

  return rootNode;
}

/**
 * 将思维导图节点转换为 simple-mind-map 所需的数据格式
 */
export function toSimpleMindMapData(node: MindMapNode): any {
  return {
    data: {
      text: node.text
    },
    children: node.children?.map(toSimpleMindMapData) || []
  };
}