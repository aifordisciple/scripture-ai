// packages/core/src/bible/versions.ts
// Bible version management

import { getApiBaseUrl } from './reader';

export interface BibleVersion {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  language: string;
  isDefault: boolean;
  isPublic: boolean;
}

// Fetch available versions
export async function fetchVersions(): Promise<BibleVersion[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/versions`);
    if (!response.ok) {
      throw new Error('Failed to fetch versions');
    }
    const data = await response.json();
    return data.versions || [];
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    // Return defaults
    return [
      { id: '1', code: 'CUV', name: '和合本', language: 'zh', isDefault: true, isPublic: true },
      { id: '2', code: 'KJV', name: 'King James Version', language: 'en', isDefault: false, isPublic: true }
    ];
  }
}

// Get default version
export function getDefaultVersion(versions: BibleVersion[]): BibleVersion {
  return versions.find(v => v.isDefault) || versions[0];
}

// Get version by code
export function getVersionByCode(versions: BibleVersion[], code: string): BibleVersion | undefined {
  return versions.find(v => v.code === code);
}

// Store version preference
export async function savePreferredVersion(versionCode: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-version', versionCode);
  }
}

// Load preferred version
export async function loadPreferredVersion(): Promise<string> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferred-version') || 'CUV';
  }
  return 'CUV';
}
