import { transformMermaid, transformPageCSS, transformSlotSugar } from '../packages/slidev/node/plugins/markdown'

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

  it('slot-sugar with default', () => {
    expect(transformSlotSugar(`
:: right::
Right Slot
::left ::
<div>Left Slot</div>
:: default ::
# Page 
Default Slot
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

  it('Inline CSS', () => {
    expect(transformPageCSS(`
# Page 

<style>
h1 {
  color: red;
}
</style>

\`\`\`css
<style>
h1 {
  color: green;
}
</style>
\`\`\`
`, '01.md')).toMatchSnapshot()
  })

  it('Mermaid', () => {
    expect(transformMermaid(`
# Page 

\`\`\`mermaid
sequenceDiagram
  Alice->John: Hello John, how are you?
  Note over Alice,John: A typical interaction
\`\`\`

\`\`\`mermaid {theme: 'neutral', scale: 0.8}
graph TD
B[Text] --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
\`\`\`
`)).toMatchSnapshot()
  })
})
