// apps/desktop/src/hooks/useUpdater.ts
/**
 * Auto-updater hook for desktop app
 *
 * Checks for updates and provides UI for installing them
 */

import { useState, useEffect, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask, message } from '@tauri-apps/plugin-dialog';

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

export interface UpdaterState {
  checking: boolean;
  updateAvailable: boolean;
  downloading: boolean;
  downloadProgress: number;
  readyToInstall: boolean;
  error: string | null;
  updateInfo: UpdateInfo | null;
}

export function useUpdater(options: { autoCheck?: boolean; checkInterval?: number } = {}) {
  const { autoCheck = true, checkInterval = 3600000 } = options; // Default: 1 hour

  const [state, setState] = useState<UpdaterState>({
    checking: false,
    updateAvailable: false,
    downloading: false,
    downloadProgress: 0,
    readyToInstall: false,
    error: null,
    updateInfo: null,
  });

  // Check for updates
  const checkForUpdates = useCallback(async (silent = false) => {
    setState(prev => ({ ...prev, checking: true, error: null }));

    try {
      const update = await check();

      if (update) {
        setState(prev => ({
          ...prev,
          checking: false,
          updateAvailable: true,
          updateInfo: {
            version: update.version,
            currentVersion: update.currentVersion,
            date: update.date,
            body: update.body,
          },
        }));

        // Show update notification
        if (!silent) {
          const shouldUpdate = await ask(
            `发现新版本 ${update.version}！\n\n${update.body || '是否立即更新？'}`,
            {
              title: '应用更新',
              kind: 'info',
              okLabel: '立即更新',
              cancelLabel: '稍后提醒',
            }
          );

          if (shouldUpdate) {
            await downloadAndInstall();
          }
        }
      } else {
        setState(prev => ({
          ...prev,
          checking: false,
          updateAvailable: false,
        }));

        if (!silent) {
          await message('您使用的已是最新版本。', {
            title: '检查更新',
            kind: 'info',
            okLabel: '确定',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setState(prev => ({
        ...prev,
        checking: false,
        error: error instanceof Error ? error.message : '检查更新失败',
      }));
    }
  }, []);

  // Download and install update
  const downloadAndInstall = useCallback(async () => {
    setState(prev => ({ ...prev, downloading: true, downloadProgress: 0 }));

    try {
      const update = await check();

      if (!update) {
        throw new Error('No update available');
      }

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            const contentLength = event.data.contentLength;
            console.log(`Started downloading ${contentLength} bytes`);
            break;
          case 'Progress':
            const downloaded = event.data.chunkLength;
            setState(prev => ({
              ...prev,
              downloadProgress: prev.downloadProgress + downloaded,
            }));
            break;
          case 'Finished':
            console.log('Download finished');
            break;
        }
      });

      setState(prev => ({
        ...prev,
        downloading: false,
        readyToInstall: true,
      }));

      // Ask to restart
      const shouldRestart = await ask(
        '更新已下载完成。需要重启应用以完成安装。是否立即重启？',
        {
          title: '安装更新',
          kind: 'info',
          okLabel: '立即重启',
          cancelLabel: '稍后重启',
        }
      );

      if (shouldRestart) {
        await relaunch();
      }
    } catch (error) {
      console.error('Failed to download update:', error);
      setState(prev => ({
        ...prev,
        downloading: false,
        error: error instanceof Error ? error.message : '下载更新失败',
      }));
    }
  }, []);

  // Install and restart
  const installAndRestart = useCallback(async () => {
    await relaunch();
  }, []);

  // Auto-check on mount and on interval
  useEffect(() => {
    if (autoCheck) {
      // Check on startup (after a delay)
      const timeout = setTimeout(() => {
        checkForUpdates(true);
      }, 10000);

      // Check on interval
      const interval = setInterval(() => {
        checkForUpdates(true);
      }, checkInterval);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [autoCheck, checkInterval, checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    downloadAndInstall,
    installAndRestart,
  };
}