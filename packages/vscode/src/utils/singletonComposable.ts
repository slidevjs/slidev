import process from 'node:process'

export function createSingletonComposable<T>(fn: () => T): () => T {
  let result: T | undefined
  return () => {
    if (!result) {
      if (process.env.NODE_ENV !== 'production') {
        // @ts-expect-error Debug only check
        result = 'Cannot call singleton composable recursively!'
      }
      result = fn()
    }
    return result
  }
}
