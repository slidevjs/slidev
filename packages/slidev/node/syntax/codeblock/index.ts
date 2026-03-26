import type { CodeblockTransformContext, CodeblockTransformer, ResolvedSlidevOptions } from '@slidev/types'
import type { MarkdownExit } from 'markdown-exit'
import { regexSlideSourceId } from '../../vite/common'
import magicMoveTransformer from './magic-move'
import mermaidTransformer from './mermaid'
import monacoTransformer from './monaco'
import plantUmlTransformer from './plant-uml'
import wrapperTransformer from './wrapper'

export function MarkdownItCodeblocks(md: MarkdownExit, options: ResolvedSlidevOptions, extraTransformers: (CodeblockTransformer | false)[]) {
  const oldFence = md.renderer.rules.fence!
  md.renderer.rules.fence = async function (tokens, idx, renderOptions, env, slf) {
    const token = tokens[idx]

    const slideNo = env.id?.match(regexSlideSourceId)
    const ctx: CodeblockTransformContext = {
      info: token.info.trim(),
      code: token.content,
      fence: token.markup.length,
      slide: slideNo ? options.data.slides[slideNo[1] - 1] : null,
      options,
      renderHighlighted(override) {
        if (override.info != null)
          token.info = override.info
        if (override.code != null)
          token.content = override.code
        return oldFence(tokens, idx, renderOptions, env, slf)
      },
    }

    const transformers = [
      ...extraTransformers,
      mermaidTransformer,
      plantUmlTransformer,
      magicMoveTransformer,
      monacoTransformer,
      wrapperTransformer,
    ]

    for (const transformer of transformers) {
      if (!transformer)
        continue
      const res = await transformer(ctx)
      if (res != null)
        return res
    }

    throw new Error('Should not reach here')
  }
}
