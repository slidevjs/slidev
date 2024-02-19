import path from 'node:path'
import {
  transformMermaid,
  transformPageCSS,
  transformPlantUml,
  transformSlotSugar,
} from '@slidev/cli/node/plugins/markdown'
import { transformSnippet } from 'packages/slidev/node/plugins/transformSnippet'
import { describe, expect, it } from 'vitest'

// const isMacOS = process.platform === 'darwin'
// const isNode18orAbove = +process.version.slice(1, 3) >= 18

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

  it('slot-sugar with symbols in name', () => {
    expect(transformSlotSugar(`
# Page 

Default Slot
::slot::1::
First Slot
::slot.2::
Second Slot
`)).toMatchSnapshot()
  })

  it('inline CSS', () => {
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

  it('mermaid', () => {
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

  it('plantUML', () => {
    const result = transformPlantUml(
      `
# Page

\`\`\`plantuml
@startuml
Alice -> Bob : Hello
Alice <- Bob : Hello, too!
@enduml
\`\`\`

\`\`\`plantuml {scale: 0.5}
@startmindmap
* Debian
** Ubuntu
*** Linux Mint
*** Kubuntu
*** Lubuntu
*** KDE Neon
** LMDE
** SolydXK
** SteamOS
** Raspbian with a very long name
*** <s>Raspmbc</s> => OSMC
*** <s>Raspyfi</s> => Volumio
@endmindmap
\`\`\`
`,
      'https://www.plantuml.com/plantuml',
    )

    expect(result).toContain(`<PlantUml :code="'JOzD`)

    // TODO: not so sure on this,
    // it seems the encode result of `plantuml-encoder` is different across platforms since Node 18
    // we may need to find a better way to test this
    // expect(result).toMatchSnapshot()
  })

  it('external snippet', () => {
    expect(transformSnippet(`
<<< @/snippets/snippet.ts#snippet ts {2|3|4}{lines:true}
`, {
      userRoot: path.join(__dirname, './fixtures/'),
      data: {
        slides: [
          {} as any,
        ],
        watchFiles: [],
      },
    } as any, `/@slidev/slides/1.md`)).toMatchSnapshot()
  })
})
