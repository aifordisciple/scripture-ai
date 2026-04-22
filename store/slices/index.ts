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
export { createUISlice as createUISliceNew } from './uiSlice'
export { createReaderSlice as createReaderSliceNew } from './readerSlice'
export { createLocaleSlice } from './localeSlice'