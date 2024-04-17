import { expect, it } from 'vitest'
import { applyMarkdownTransform } from '../packages/slidev/node/vite/markdown'
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
`)

  applyMarkdownTransform(ctx)

  expect(ctx.s.toString()).toMatchSnapshot()
})
