export {}
declare global {
  const __DEV__: boolean
  const __SLIDEV_HASH_ROUTE__: boolean
  const __SLIDEV_CLIENT_ROOT__: string
  const __SLIDEV_FEATURE_DRAWINGS__: boolean
  const __SLIDEV_FEATURE_DRAWINGS_PERSIST__: boolean
  const __SLIDEV_FEATURE_EDITOR__: boolean
  const __SLIDEV_FEATURE_RECORD__: boolean
  const __SLIDEV_FEATURE_PRESENTER__: boolean
  const __SLIDEV_FEATURE_PRINT__: boolean
  const __SLIDEV_FEATURE_WAKE_LOCK__: boolean
  const __SLIDEV_HAS_SERVER__: boolean
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    __DEV__: boolean
    __SLIDEV_HASH_ROUTE__: boolean
    __SLIDEV_CLIENT_ROOT__: string
    __SLIDEV_FEATURE_DRAWINGS__: boolean
    __SLIDEV_FEATURE_DRAWINGS_PERSIST__: boolean
    __SLIDEV_FEATURE_EDITOR__: boolean
    __SLIDEV_FEATURE_RECORD__: boolean
    __SLIDEV_FEATURE_PRESENTER__: boolean
    __SLIDEV_FEATURE_PRINT__: boolean
    __SLIDEV_FEATURE_WAKE_LOCK__: boolean
    __SLIDEV_HAS_SERVER__: boolean
  }
}
