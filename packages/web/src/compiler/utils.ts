// Ported from https://github.com/vuejs/repl/blob/main/src/transform.ts

export function isJsLikeFile(filename: string | undefined | null) {
  return !!(filename && /\.[jt]sx?$/.test(filename))
}
export function isTsFile(filename: string | undefined | null) {
  return !!(filename && /(?:\.|\b)tsx?$/.test(filename))
}
export function isJsxFile(filename: string | undefined | null) {
  return !!(filename && /(?:\.|\b)[jt]sx$/.test(filename))
}
