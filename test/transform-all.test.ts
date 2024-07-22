import { expect, it } from 'vitest'
import { getMarkdownTransformers } from '../packages/slidev/node/syntax/transform'
import { createTransformContext } from './_tutils'

it('transform-all', async () => {
  const ctx = createTransformContext(`
# Page 

Default Slot

<<< @/snippets/snippet.ts#snippet ts {2|3|4}{lines:true}

::right::

Foo \`{{ code }}\`

::left::
<div>Left Slot</div>

\`\`\`md
<style>
.text-red { color: red; }
</style>
\`\`\`

<style>
.text-green { color: green; }
</style>

<<< ./fixtures/snippets/snippet.ts#snippet
`)

  const transformers = await getMarkdownTransformers({
    roots: [],
    data: {
      config: {
        highlighter: 'shiki',
      },
      features: {
        monaco: true,
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

  expect(ctx.s.toString()).toMatchSnapshot()
})
