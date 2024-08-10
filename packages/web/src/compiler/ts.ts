import { transform } from 'sucrase'

export async function transformTS(src: string, isJSX?: boolean) {
  return transform(src, {
    transforms: ['typescript', ...(isJSX ? (['jsx'] as const) : [])],
    jsxRuntime: 'preserve',
  }).code
}
