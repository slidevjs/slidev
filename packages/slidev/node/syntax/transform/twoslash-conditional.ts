import type { ShikiTransformer } from 'shiki'

/**
 * Custom Twoslash transformer that replaces :shown='true' with conditional logic
 * to prevent poppers from being shown during preload
 */
export function transformerTwoslashConditional(): ShikiTransformer {
  return {
    name: 'slidev:twoslash-conditional',
    postprocess(code) {
      return code.replace(
        /(<v-menu[^>]*):shown=['"]true['"]/g,
        '$1:shown="false"',
      )
    },
  }
}
