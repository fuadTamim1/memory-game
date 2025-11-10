interface StorageResult {
  keys: string[];
}

interface StorageData {
  value: string;
}

interface Storage {
  list(prefix: string): Promise<StorageResult>;
  get(key: string, asJSON: boolean): Promise<StorageData>;
  set(key: string, value: string, asJSON: boolean): Promise<void>;
}

declare global {
  interface Window {
    storage: Storage;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export {};