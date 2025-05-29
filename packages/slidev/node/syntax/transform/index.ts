import type { MarkdownTransformContext } from '@slidev/types'
import { transformCodeWrapper } from './code-wrapper'
import { transformInPageCSS } from './in-page-css'
import { transformKaTexWrapper } from './katex-wrapper'
import { transformTypstWrapper } from './typst-wrapper'
import { transformMagicMove } from './magic-move'
import { transformMermaid } from './mermaid'
import { transformMonaco } from './monaco'
import { transformPlantUml } from './plant-uml'
import { transformSlotSugar } from './slot-sugar'
import { transformSnippet } from './snippet'

export function transformMarkdown(ctx: MarkdownTransformContext) {
  transformCodeWrapper(ctx)
  transformInPageCSS(ctx)
  transformKaTexWrapper(ctx)
  transformTypstWrapper(ctx)
  transformMagicMove(ctx)
  transformMermaid(ctx)
  transformMonaco(ctx)
  transformPlantUml(ctx)
  transformSlotSugar(ctx)
  transformSnippet(ctx)
}