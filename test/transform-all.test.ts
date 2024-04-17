import path from 'node:path'
import { expect, it } from 'vitest'
import type { ResolvedSlidevOptions } from '@slidev/types'
import { applyMarkdownTransform } from '../packages/slidev/node/vite/markdown'

it('transform-all', async () => {
  const options = {
    entry: '1.md',
    data: {
      config: {},
      slides: [
        {},
      ],
      watchFiles: [] as any,
    },
    userRoot: path.join(__dirname, './fixtures/'),
    mode: 'dev',
  } as ResolvedSlidevOptions
  const code = `
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
`

  const ctx = applyMarkdownTransform(code, '1.md', options)

  expect(ctx.s.toString()).toMatchSnapshot()
})
