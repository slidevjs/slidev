import { transformSlotSugar } from '../packages/slidev/node/plugins/markdown'

describe('markdown transform', () => {
  it('slot-sugar', () => {
    expect(transformSlotSugar(`
# Page 

Default Slot
::right::
Right Slot
::left::
<div>Left Slot</div>
`)).toMatchSnapshot()
  })

  it('slot-sugar with code', () => {
    expect(transformSlotSugar(`
# Page 

Default Slot

::code::

\`\`\`md
Slot Usage
::right::
::left::
\`\`\`

`)).toMatchSnapshot()
  })
})
