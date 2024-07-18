import type { MarkdownTransformContext, MarkdownTransformer } from '@slidev/types'
import type { ShikiSetupResult } from '../../setups/shiki'
import { transformCodeWrapper } from './code-wrapper'
import { transformPageCSS } from './in-page-css'
import { transformKaTexWrapper } from './katex-wrapper'
import { transformMagicMove } from './magic-move'
import { transformMermaid } from './mermaid'
import { transformMonaco } from './monaco'
import { transformPlantUml } from './plant-uml'
import { transformSlotSugar } from './slot-sugar'
import { transformSnippet } from './snippet'

export function applyMarkdownTransform(ctx: MarkdownTransformContext, shiki: ShikiSetupResult) {
  const transformers: (MarkdownTransformer | false)[] = [
    transformSnippet,
    ctx.options.data.config.highlighter === 'shiki'
    && transformMagicMove(shiki, ctx.options.data.config.lineNumbers),
    transformMermaid,
    transformPlantUml,
    ctx.options.data.features.monaco
    && transformMonaco,
    transformCodeWrapper,
    ctx.options.data.features.katex
    && transformKaTexWrapper,
    transformPageCSS,
    transformSlotSugar,
  ]

  for (const transformer of transformers) {
    if (!transformer)
      continue
    transformer(ctx)
    if (!ctx.s.isEmpty())
      ctx.s.commit()
  }
}
