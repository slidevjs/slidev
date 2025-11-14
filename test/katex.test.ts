import { expect, it } from 'vitest'
import { getMarkdownTransformers } from '../packages/slidev/node/syntax/transform'
import { createTransformContext } from './_tutils'

it('katex with double braces', async () => {
  const ctx = createTransformContext(`
# Page with KaTeX

Inline math with double braces: $\{\{\alpha\}\}^T$

Block math with double braces:

$$
\{\{\alpha\}^i\}^T
$$

Another example: $\{\{x\}\}$
`)

  const transformers = await getMarkdownTransformers({
    roots: [],
    data: {
      config: {
        highlighter: 'shiki',
      },
      features: {
        katex: true,
      },
    },
  } as any)

  for (const transformer of transformers) {
    if (!transformer)
      continue
    transformer(ctx)
    if (!ctx.s.isEmpty())
      ctx.s.commit()
  }

  const result = ctx.s.toString()
  
  // The result should NOT contain {{ or }} that Vue would try to interpret
  // Instead, they should be escaped as &lbrace;&lbrace; and &rbrace;&rbrace;
  // We check that the annotation element doesn't have unescaped braces
  expect(result).not.toMatch(/annotation[^>]*>\{\{/)
  expect(result).not.toMatch(/\}\}<\/annotation/)
  
  // Verify that the escaping is present
  expect(result).toContain('&lbrace;&lbrace;')
})
