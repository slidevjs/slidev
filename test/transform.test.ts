import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { transformCodeWrapper, transformMermaid, transformPageCSS, transformPlantUml, transformSlotSugar, transformSnippet } from '../packages/slidev/node/syntax/transform'
import { createTransformContext } from './_tutils'

describe('markdown transform', () => {
  it('slot-sugar', () => {
    const ctx = createTransformContext(`
# Page 

Default Slot
::right::
Right Slot
::left::
<div>Left Slot</div>
`)

    transformCodeWrapper(ctx)
    transformSlotSugar(ctx)

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`[]`)
  })

  it('slot-sugar with default', () => {
    const ctx = createTransformContext(`
:: right::
Right Slot
::left ::
<div>Left Slot</div>
:: default ::
# Page 
Default Slot
`)

    transformSlotSugar(ctx)

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`[]`)
  })

  it('slot-sugar with code', () => {
    const ctx = createTransformContext(`
# Page 

Default Slot

::code::

\`\`\`md
Slot Usage
::right::
::left::
\`\`\`

`)

    transformCodeWrapper(ctx)
    transformSlotSugar(ctx)

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`
      [
        [
          34,
          73,
        ],
      ]
    `)
  })

  it('slot-sugar with symbols in name', () => {
    const ctx = createTransformContext(`
# Page 

Default Slot
::slot::1::
First Slot
::slot.2::
Second Slot
`)

    transformSlotSugar(ctx)

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`[]`)
  })

  it('inline CSS', () => {
    const ctx = createTransformContext(`
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
`)

    transformCodeWrapper(ctx)
    transformPageCSS(ctx, '01.md')

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`
      [
        [
          49,
          99,
        ],
      ]
    `)
  })

  it('mermaid', () => {
    const ctx = createTransformContext(`
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
`)

    transformMermaid(ctx)

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`
      [
        [
          10,
          126,
        ],
        [
          128,
          252,
        ],
      ]
    `)
  })

  it('plantUML', () => {
    const ctx = createTransformContext(`
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
`)

    transformPlantUml(ctx, 'https://www.plantuml.com/plantuml')

    expect(ctx.s.toString()).toContain(`<PlantUml :code="'JOzD`)
    expect(ctx.ignores).toMatchInlineSnapshot(`
      [
        [
          9,
          90,
        ],
        [
          92,
          338,
        ],
      ]
    `)

    // TODO: not so sure on this,
    // it seems the encode result of `plantuml-encoder` is different across platforms since Node 18
    // we may need to find a better way to test this
    // expect(result).toMatchSnapshot()
  })

  it('external snippet', () => {
    const ctx = createTransformContext(`
<<< @/snippets/snippet.ts#snippet ts {2|3|4}{lines:true}
`)

    transformSnippet(
      ctx,
      {
        userRoot: path.join(__dirname, './fixtures/'),
        data: {
          slides: [
            {} as any,
          ],
          watchFiles: [],
        },
      } as any,
`/@slidev/slides/1.md`,
    )

    expect(ctx.s.toString()).toMatchSnapshot()
    expect(ctx.ignores).toMatchInlineSnapshot(`[]`)
  })
})
