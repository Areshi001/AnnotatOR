import type { StorageConfig, StorageMode } from './types';

const CONFIG_KEY = 'annotator.storage.config';

const defaultConfig: StorageConfig = { storageMode: 'cloud', localRootName: 'AnnotatOR_Data' };

export const getStorageConfig = (): StorageConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...(JSON.parse(raw) as StorageConfig) };
  } catch {
    return defaultConfig;
  }
};

export const setStorageConfig = (config: StorageConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const setStorageMode = (storageMode: StorageMode) => {
  setStorageConfig({ ...getStorageConfig(), storageMode });
};

export const isDirectoryPickerSupported = () => typeof window.showDirectoryPicker === 'function';
