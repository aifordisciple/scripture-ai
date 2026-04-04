// apps/desktop/src/sync/index.ts
/**
 * Desktop sync module
 *
 * Provides offline-first data synchronization between local SQLite
 * and remote Web API
 */

export { DesktopSyncEngine, getSyncEngine, type SyncStatus } from './engine';