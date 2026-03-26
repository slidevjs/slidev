import type { MarkdownTransformer, ResolvedSlidevOptions } from '@slidev/types'
import setupTransformers from '../../setups/transformers'
import { transformPageCSS } from './in-page-css'
import { transformMagicMove } from './magic-move'
import { transformMermaid } from './mermaid'
import { transformPlantUml } from './plant-uml'
import { transformSlotSugar } from './slot-sugar'
import { transformSnippet } from './snippet'

export async function getMarkdownTransformers(options: ResolvedSlidevOptions): Promise<(false | MarkdownTransformer)[]> {
  const extras = await setupTransformers(options.roots)
  return [
    ...extras.pre,

    transformSnippet,
    options.data.config.highlighter === 'shiki' && transformMagicMove,

    ...extras.preCodeblock,

    transformMermaid,
    transformPlantUml,

    ...extras.postCodeblock,

    transformPageCSS,
    transformSlotSugar,

    ...extras.post,
  ]
}
