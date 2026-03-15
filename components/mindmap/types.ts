// components/mindmap/types.ts

export type LayoutType = 'logicalStructure' | 'mindMap' | 'organizationStructure' | 'catalogOrganization' | 'timeline';

export interface LayoutOption {
  value: LayoutType;
  label: string;
}

// Re-export MindMapNode from store types
export type { MindMapNode } from '@/store/types';