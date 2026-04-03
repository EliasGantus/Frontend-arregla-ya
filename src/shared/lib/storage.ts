import type { SessionPayload } from '@/shared/types/api';

const SESSION_KEY = 'arreglaya.session';

export const sessionStorageManager = {
  load(): SessionPayload | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawValue = window.localStorage.getItem(SESSION_KEY);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as SessionPayload;
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },
  save(value: SessionPayload) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  },
  clear() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(SESSION_KEY);
  },
};
