import type { LanguagePlugin, VirtualCode } from '@volar/language-core'
import type * as ts from 'typescript'
import type { URI } from 'vscode-uri'

export const slidevLanguagePlugin: LanguagePlugin<URI> = {
  getLanguageId() {
    return undefined
  },
  createVirtualCode(_uri, languageId, snapshot) {
    if (languageId === 'markdown') {
      return {
        id: 'root',
        languageId: 'markdown',
        mappings: [],
        embeddedCodes: [...getEmbeddedCodes(snapshot)],
        snapshot,
      }
    }
  },
}

function* getEmbeddedCodes(snapshot: ts.IScriptSnapshot): Generator<VirtualCode> {
  const blocks = snapshot.getText(0, snapshot.getLength()).matchAll(/---\n([\s\S]*?)\n---/g)
  let i = 0
  for (const block of blocks) {
    yield {
      id: `yaml_${i++}`,
      languageId: 'yaml',
      snapshot: {
        getText: (start, end) => block[1].substring(start, end),
        getLength: () => block[1].length,
        getChangeRange: () => undefined,
      },
      mappings: [{
        sourceOffsets: [block.index],
        generatedOffsets: [0],
        lengths: [block[1].length],
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
}
