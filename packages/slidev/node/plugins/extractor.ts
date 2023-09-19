import type { Extractor } from '@unocss/core'

// ---
// layout: two-cols
// class: bg-red text-white
// layoutClass: bg-blue text-white
// ---

const regexFrontmatterRange = /^---\n((?:.|\n)*?)---/gm
const regexPossibleClassInFrontmatter = /^.*[cC]lass.*:\s*(.*)\s*$/gm

export function extractorFrontmatterClass(): Extractor {
  return {
    name: 'class-in-frontmatter',
    extract(ctx) {
      if (!ctx.code.endsWith('.frontmatter'))
        return

      ctx.code.match(regexFrontmatterRange)?.forEach((range) => {
        for (const item of range.matchAll(regexPossibleClassInFrontmatter)) {
          item[1].split(/\s+/).forEach((c) => {
            ctx.extracted.add(c)
          })
        }
      })
    },
  }
}
