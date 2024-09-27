import type { SlidevMarkdown } from '@slidev/types'
import type { LanguagePlugin, VirtualCode } from '@volar/language-core'
import type { URI } from 'vscode-uri'
import { parseSync } from '@slidev/parser'

export const slidevLanguagePlugin: LanguagePlugin<URI> = {
  getLanguageId() {
    return undefined
  },
  createVirtualCode(uri, languageId, snapshot) {
    if (languageId === 'markdown') {
      const source = snapshot.getText(0, snapshot.getLength())
      const parsed = parseSync(source, uri.fsPath, {
        noParseYAML: true,
        preserveCR: true,
      })

      return {
        id: 'root',
        languageId: 'markdown',
        mappings: [],
        embeddedCodes: [...getEmbeddedCodes(parsed)],
        snapshot,
      }
    }
  },
}

function* getEmbeddedCodes(parsed: SlidevMarkdown): Generator<VirtualCode> {
  const lines = parsed.raw.split('\n')
  function lineToPos(line: number) {
    let pos = 0
    for (let i = 0; i <= line; i++) {
      pos += lines[i].length + 1
    }
    return pos
  }
  for (const { frontmatterRaw, start, contentStart, content, index } of parsed.slides) {
    if (frontmatterRaw != null) {
      yield {
        id: `frontmatter_${index}`,
        languageId: 'yaml',
        snapshot: {
          getText: (start, end) => frontmatterRaw.substring(start, end),
          getLength: () => frontmatterRaw.length,
          getChangeRange: () => undefined,
        },
        mappings: [{
          sourceOffsets: [lineToPos(start)],
          generatedOffsets: [0],
          lengths: [frontmatterRaw.length],
          data: {
            verification: true,
            completion: true,
            semantic: true,
            navigation: true,
            structure: true,
            format: true,
          },
        }],
        embeddedCodes: [],
      }
    }
    if (content) {
      yield {
        id: `content_${index}`,
        languageId: 'markdown',
        snapshot: {
          getText: (start, end) => content.substring(start, end),
          getLength: () => content.length,
          getChangeRange: () => undefined,
        },
        mappings: [{
          sourceOffsets: [lineToPos(contentStart)],
          generatedOffsets: [0],
          lengths: [content.length],
          data: {
            verification: true,
            completion: true,
            semantic: true,
            navigation: true,
            structure: true,
            format: false,
          },
        }],
        embeddedCodes: [],
      }
    }
  }
}
