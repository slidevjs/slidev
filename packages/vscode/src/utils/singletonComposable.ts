export function createSingletonComposable<T>(fn: () => T): () => T {
  let result: T | undefined
  return () => {
    result ??= fn()
    return result
  }
}
