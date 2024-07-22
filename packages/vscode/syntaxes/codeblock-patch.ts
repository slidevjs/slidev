import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const Markdown = JSON.parse(
  readFileSync(join(__dirname, '../node_modules/tm-grammars/grammars/markdown.json'), 'utf8'),
)

const base = {
  $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  fileTypes: [],
  injectionSelector: 'L:text.html.markdown -markup.frontmatter.slidev -markup.fenced_code.block.markdown',
  patterns: [
  ],
  repository: {
    fenced_code_block_unknown: {
      begin: '(^|\\G)(\\s*)(`{3,}|~{3,})\\s*(?=([^`]*)?$)',
      beginCaptures: {
        3: {
          name: 'punctuation.definition.markdown',
        },
        4: {
          name: 'fenced_code.block.language.attributes.markdown',
          patterns: [],
        },
      },
      end: '(^|\\G)(\\2|\\s{0,3})(\\3)\\s*$',
      endCaptures: {
        3: {
          name: 'punctuation.definition.markdown',
        },
      },
      name: 'markup.fenced_code.block.markdown',
    },
  },
  scopeName: 'inject-to-markdown.codeblock.patch.slidev',
} as any

export function generateCodeblockPatch() {
  for (const [k, v] of Object.entries(Markdown.repository) as any) {
    if (!k.startsWith('fenced_code_block_') || k === 'fenced_code_block_unknown')
      continue
    v.beginCaptures[5].patterns = []
    base.patterns.push(v)
  }

  base.patterns.push(
    {
      include: '#fenced_code_block_unknown',
    },
  )
  return base
}
