import type MagicString from 'magic-string-stack'
import path from 'node:path'
import MarkdownExit from 'markdown-exit'
import * as shiki from 'shiki'
import { expect, it } from 'vitest'
import { useMarkdownItPlugins } from '.'

it('all syntax combined', async () => {
  const md = MarkdownExit({ html: true })
  const map = new Map<string, MagicString>()

  await useMarkdownItPlugins(md, {
    userRoot: path.join(__dirname, '../../../../test/fixtures/'),
    data: {
      watchFiles: {},
      slides: [{
        index: 0,
        source: { filepath: path.join(__dirname, '../../../../test/fixtures/test.md') },
      }],
      config: {},
      features: { katex: true },
    },
    utils: {
      shiki,
      shikiOptions: { theme: 'nord' },
      katexOptions: {},
    },
  } as any, map, [])

  const result = await md.renderAsync(`
# Slide Title

Default content with [internal link](#1) and [external](https://example.com)

Inline code: \`{{ code }}\` and math: $x^2$

::right::

<v-drag>Draggable content</v-drag>

$$ {1}
x^2
$$

::right::

<style>
.custom { color: blue; }
</style>

- item
   <<< @/snippets/snippet.ts#snippet {monaco}{propA:1}

\`\`\` [filename.ts]{1,2|3}{maxHeight:'200px'}
This is code block with:
- ::slot:: markers
- {{$math$}}
- <<< snippets
Should not transform
\`\`\`

text1
::bottom::
text2

\`\`\`mermaid {scale:0.5}
graph TD
  A --> B
\`\`\`

1. foo
   \`\`\`plantuml {scale:0.5}
   @startuml
   Alice -> Bob: Hello
   @enduml
   \`\`\`

2. bar
   \`\`\`\`md magic-move {prop:1,lines:true}
   \`\`\`ts
   a = 1
   \`\`\`
   \`\`\`ts {1}
   b = 2
   \`\`\`
   \`\`\`\`

`, { id: 'slides.md__slidev_1.md' })

  expect(result).toMatchInlineSnapshot(`
    "<h1>Slide Title</h1>
    <p>Default content with <Link to="#1">internal link</Link> and <a href="https://example.com" target="_blank">external</a></p>
    <p>Inline code: <code v-pre>{{ code }}</code> and math: <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">x^2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></p>

    <template v-slot:right="slotProps">
    <p><v-drag :markdownSource="[9,10,0]">Draggable content</v-drag></p>
    <KaTexBlockWrapper  :ranges='["1"]'><p><span class="katex-display"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">x^2
    </annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.8641em;"></span><span class="mord"><span class="mord mathnormal">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8641em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span></p></KaTexBlockWrapper>

    </template>

    <template v-slot:right="slotProps">
    <style scoped>
    .custom { color: blue; }
    </style>
    <ul>
    <li>item<Monaco v-bind="{propA:1}"  lang="ts" code-lz="GYVwdgxgLglg9mABAfWHOAKAlIg3gKEUQHpjEA6S/AX3yA=="  />
    </li>
    </ul>
    <CodeBlockWrapper v-bind="{maxHeight:'200px'}" title="filename.ts" :ranges='["1,2","3"]'><pre class="shiki nord slidev-code" style="background-color:#2e3440ff;color:#d8dee9ff"><code class="language-text"><span class="line"><span>This is code block with:</span></span>
    <span class="line"><span>- ::slot:: markers</span></span>
    <span class="line"><span>- &lbrace;&lbrace;$math$}}</span></span>
    <span class="line"><span>- &#x3C;&#x3C;&#x3C; snippets</span></span>
    <span class="line"><span>Should not transform</span></span></code></pre>
    </CodeBlockWrapper>
    <p>text1</p>

    </template>

    <template v-slot:bottom="slotProps">
    <p>text2</p>
    <Mermaid v-bind="{scale:0.5}" code-lz="OYJwhgDgFgBAKgEQFAxgQRgWkwPhgISA" />
    <ol>
    <li>
    <p>foo</p>
    <PlantUml v-bind="{scale:0.5}" code="SoWkIImgAStDuNBCoKnELT2rKt3AJx9Iy4ZDoSddSaZDIodDpG40" server=undefined />
    </li>
    <li>
    <p>bar</p>
    <ShikiMagicMove v-bind="{prop:1,lines:true}" steps-lz="NobwRAxg9gJgpmAXGAhgAgLxoIxgDRgAWKAzoUmANZQAqAGgMo1QBCATgJqGECSA7gFcALgBYAbnTEA1AGKEAwgAUAXgC1KikgA84WiAGkAZgFkAHAwCO8gLSn8YIVEpwAdiSSgqcAJ4Vq9JlZObn5hcUlZBRV1TR09IzNLG1NrABsXa1wCaBchVyEKbDQ0eyhDQxI4AsQABgJCIQBbVPlU0ndkMgBLSi7rRpQAcy6IfqgxODSul0mXAUaAIzg2MABfPHAcvNyKFFLyyuq6yChUqBXkAGIAEVNrgFF7gE57QyhchiFvVIRagmdfMh/IxmOwuLxBKIJNI5Eo1BptLoDCZzFZbJk1hsTrl8hQSgQyhUqkhsNlTucKDc7o8njIZK93kJPt9fscAX5aCCguDQlCIrDogi4sjEmiUgAmTGbRm45AYfZE6rislnC5gS6mbAAQWw8iyYDeHy+PyQbJ8HICoOCELC0MicJiiPiKKS6IAzFLsdtqmB8WBCYckG6VRSrrcHs86QyjSzTf9zUDOYEwSFIeEYVF4bEkQlUclrCJPVtZWB9QHiYgRCG1ZcWCJTPctddo0zjaz44CqEmrTy03aBVmnSK8+iAKxFmU7ZAAHRcCsDiFHHYtXJTNr5GYdQpzLrF1gAbGsALoEVLTOAAOXmSzYHSEbAEcAIC0GlPFcDdIhENXKr1fVxgUx4DgJ5fwIIRCDgRpLxQaCKBcc4YHsNoXH/Bx3HWaV4AoBZMDQSV6lIchkFSfdCAvDgAFVCDEe4eEaUcpC0ABxUdvEMAB2Og+HuKotGUC8IBILgeBYe4uj4Hh9HkBYWBYABFexHGcNwPHAdkSLIijqNo+jGJYtjOO43ihH4wThN4MSJKkmS5PktIMn1Ysp1LYp5wrY4GmaVp2gobpen6IYRjGCYphmaw5kWZYJxxFyFnco5q0pcMaRbZkTT+LxO1I8iqJouiGKY1j2K4ni+IEoSRKsyTpNkhSMUwr0Sz9ctqlJE5VWS6lI3pAhDVbWNMo0sAcu0/K9KKwzSpMszKss8Sats+rJUa5yfXlAkDgrZUOtDdVNR1PU0rbOMsooUa8t0wqDJK4zyvMqqFpsur7I9VbJx9FqtuqYNdprFKeuOwazWyrTLoK/TiqMsrTIqizRKe2q7ILGLvQoAj/W+pAqz+yk6wbJsgYykHzrBnSIcm26Ydm+Hque5Hx3e2KfVnBKkCXM7NNy8mJpu6GZrhx7rKR+rD1WE8RvPK8otvJB70fZ80Mud9P2/MCDSVwDgNAwwlMg6CL1g34wAQtgkNPFBUIoIQMKPIA=" :title='""' :step-ranges='[[],["1"]]' />
    </li>
    </ol>

    </template>
    "
  `)
})
