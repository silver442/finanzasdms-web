/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WHATSAPP_NUMBER: string;
  readonly VITE_CRYPTO_API_KEY: string;
  readonly VITE_FX_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
