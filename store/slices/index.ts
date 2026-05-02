// store/slices/index.ts
/**
 * Store Slices Index
 *
 * Re-exports all slices from the original slices.ts file.
 * This maintains backward compatibility while the slices are gradually
 * migrated to separate files.
 */

// Import from original file for backward compatibility
export {
  createUISlice,
  createReaderSlice,
  createAISlice,
  createUserDataSlice,
  createSyncSlice,
  createGroupSlice,
  createAtlasSlice,
  createDMSlice,
} from '../slices'

// Re-export individual slices from new files
// These will be used as slices are migrated
// [P3-5修复] 移除已删除的死代码 uiSlice.ts 的导出
export { createReaderSlice as createReaderSliceNew } from './readerSlice'
export { createLocaleSlice } from './localeSlice'
export { createSermonSlice } from './sermonSlice'