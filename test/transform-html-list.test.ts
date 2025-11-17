import { expect, it } from 'vitest'
import { transformHtmlListIndent } from '../packages/slidev/node/syntax/transform/html-list-indent'
import { createTransformContext } from './_tutils'

it('indents lists inside HTML blocks when unindented', () => {
  const ctx = createTransformContext(`
<div>
  <div>

- A
- B

  </div>
</div>
`)

  transformHtmlListIndent(ctx)

  expect(ctx.s.toString()).toMatchSnapshot()
})
