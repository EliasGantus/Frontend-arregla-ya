const required = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export const env = {
  apiUrl: required(import.meta.env.VITE_API_URL, 'http://localhost:3000'),
  appName: required(import.meta.env.VITE_APP_NAME, 'ArreglaYa'),
  enableDevAuth: import.meta.env.VITE_ENABLE_DEV_AUTH === 'true',
} as const;
