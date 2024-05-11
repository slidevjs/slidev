export {}
declare global {
  const __MODE__: 'dev' | 'build' | 'export'
  const __DEV__: boolean
  const __SLIDEV_CLIENT_ROOT__: string
  const __SLIDEV_HASH_ROUTE__: boolean
  const __SLIDEV_HAS_SERVER__: boolean
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    __MODE__: 'dev' | 'build' | 'export'
    __DEV__: boolean
    __SLIDEV_CLIENT_ROOT__: string
    __SLIDEV_HASH_ROUTE__: boolean
    __SLIDEV_HAS_SERVER__: boolean
  }
}
