import { transformCodeWrapper } from 'packages/slidev/node/syntax/transform/code-wrapper'
import { transformPageCSS } from 'packages/slidev/node/syntax/transform/in-page-css'
import { transformMermaid } from 'packages/slidev/node/syntax/transform/mermaid'
import { transformPlantUml } from 'packages/slidev/node/syntax/transform/plant-uml'
import { transformSlotSugar } from 'packages/slidev/node/syntax/transform/slot-sugar'
import { transformSnippet } from 'packages/slidev/node/syntax/transform/snippet'
import { expect, it } from 'vitest'
import { createTransformContext } from './_tutils'

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
  ctx.s.commit()
  transformSlotSugar(ctx)

  expect(ctx.s.toString()).toMatchSnapshot()
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
  ctx.s.commit()
  transformSlotSugar(ctx)

  expect(ctx.s.toString()).toMatchSnapshot()
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
  ctx.s.commit()
  transformPageCSS(ctx)

  expect(ctx.s.toString()).toMatchSnapshot()
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

  transformPlantUml(ctx)

  expect(ctx.s.toString()).toContain(`<PlantUml :code="'JOzD`)

  // TODO: not so sure on this,
  // it seems the encode result of `plantuml-encoder` is different across platforms since Node 18
  // we may need to find a better way to test this
  // expect(result).toMatchSnapshot()
})

it('external snippet', () => {
  const ctx = createTransformContext(`
<<< @/snippets/snippet.ts#snippet ts {2|3|4}{lines:true}
`)

  transformSnippet(ctx)

  expect(ctx.s.toString()).toMatchSnapshot()
})
