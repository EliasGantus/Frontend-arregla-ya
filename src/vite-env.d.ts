/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENABLE_DEV_AUTH?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
