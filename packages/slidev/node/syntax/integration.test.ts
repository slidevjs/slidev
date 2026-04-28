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

> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action.


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
    <PlantUml v-bind="{scale:0.5}" code="SoWkIImgAStDuNBCoKnELT2rKt3AJx9Iy4ZDoSddSaZDIodDpG40" />
    </li>
    <li>
    <p>bar</p>
    <ShikiMagicMove v-bind="{prop:1,lines:true}" steps-lz="NobwRAxg9gJgpmAXGAhgAgLxoIxgDRgAWKAzoUmANZQAqAGgMo1QBCATgJqGECSA7gFcALgBYAbnTEA1AGKEAwgAUAXgC1KikgA84WiAGkAZgFkAHAwCO8gLSn8YIVEpwAdiSSgqcAJ4Vq9JlZObn5hcUlZBRV1TR09IzNLG1NrABsXa1wCaBchVyEKbDQ0eyhDQxI4AsQABgJCIQBbVPlU0ndkMgBLSi7rRpQAcy6IfqgxODSul0mXAUaAIzg2MABfPHAcvNyKFFLyyuq6yChUqBXkAGIAEVNrgFF7gE57QyhchiFvVIRagmdfMh/IxmOwuLxBKIJNI5Eo1BptLoDCZzFZbJk1hsTrl8hQSgQyhUqkhsNlTucKDc7o8njIZK93kJPt9fscAX5aCCguDQlCIrDogi4sjEmiUgAmTGbRm45AYfZE6rislnC5gS6mbAAQWw8iyYDeHy+PyQbJ8HICoOCELC0MicJiiPiKKS6IAzFLsdtqmB8WBCYckG6VRSrrcHs86QyjSzTf9zUDOYEwSFIeEYVF4bEkQlUclrCJPVtZWB9QHiYgRCG1ZcWCJTPctddo0zjaz44CqEmrTy03aBVmnSK8+iAKxFmU7ZAAHRcCsDiFHHYtXJTNr5GYdQpzLrF1gAbGsALoEVLTOAAOXmSzYHSEbAEcAIC0GlPFcDdIhENXKr1fVxgUx4DgJ5fwIIRCDgRpLxQaCKBcc4YHsNoXH/Bx3HWaV4AoBZMDQSV6lIchkFSfdCAvDgAFVCDEe4eEaUcpC0ABxUdvEMAB2Og+HuKotGUC8IBILgeBYe4uj4Hh9HkBYWBYABFexHGcNwPHAdkSLIijqNo+jGJYtjOO43ihH4wThN4MSJKkmS5PktIMn1Ysp1LYp5wrY4GmaVp2gobpen6IYRjGCYphmaw5kWZYJxxFyFnco5q0pcMaRbZkTT+LxO1I8iqJouiGKY1j2K4ni+IEoSRKsyTpNkhSMUwr0Sz9ctqlJE5VWS6lI3pAhDVbWNMo0sAcu0/K9KKwzSpMszKss8Sats+rJUa5yfXlAkDgrZUOtDdVNR1PU0rbOMsooUa8t0wqDJK4zyvMqqFpsur7I9VbJx9FqtuqYNdprFKeuOwazWyrTLoK/TiqMsrTIqizRKe2q7ILGLvQoAj/W+pAqz+yk6wbJsgYykHzrBnSIcm26Ydm+Hque5Hx3e2KfVnBKkCXM7NNy8mJpu6GZrhx7rKR+rD1WE8RvPK8otvJB70fZ80Mud9P2/MCDSVwDgNAwwlMg6CL1g34wAQtgkNPFBUIoIQMKPIA=" :title='""' :step-ranges='[[],["1"]]' />
    </li>
    </ol>
    <div class="markdown-alert markdown-alert-note"><p class="markdown-alert-title"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Note</p><p>Highlights information that users should take into account, even when skimming.</p>
    </div>
    <div class="markdown-alert markdown-alert-tip"><p class="markdown-alert-title"><svg class="octicon octicon-light-bulb mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>Tip</p><p>Optional information to help a user be more successful.</p>
    </div>
    <div class="markdown-alert markdown-alert-important"><p class="markdown-alert-title"><svg class="octicon octicon-report mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>Important</p><p>Crucial information necessary for users to succeed.</p>
    </div>
    <div class="markdown-alert markdown-alert-warning"><p class="markdown-alert-title"><svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>Warning</p><p>Critical content demanding immediate user attention due to potential risks.</p>
    </div>
    <div class="markdown-alert markdown-alert-caution"><p class="markdown-alert-title"><svg class="octicon octicon-stop mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Caution</p><p>Negative potential consequences of an action.</p>
    </div>

    </template>
    "
  `)
})
