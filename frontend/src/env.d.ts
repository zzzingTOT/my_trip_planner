// 加载vite内置环境变量类型
/// <reference types="vite/client" />

// 自定义你的环境变量
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}