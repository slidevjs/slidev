import {
  transformMagicMove,
} from '@slidev/cli/node/plugins/markdown'
import { expect, it } from 'vitest'
import { getHighlighter } from 'shiki'

it('basic', async () => {
  const code = `

Some text before

\`\`\`\`md magic-move
\`\`\`ts
// This is a code block
console.log('Hello, Slidev!')
\`\`\`
\`\`\`ts
let message = 'Hello, Slidev!'
\`\`\`
\`\`\`\`

Some text after
  
`
  const shiki = await getHighlighter({
    themes: ['nord'],
    langs: ['typescript'],
  })

  expect(transformMagicMove(
    code,
    shiki,
    {
      theme: 'nord',
    },
  ))
    .toMatchInlineSnapshot(`
      "<script setup>
      const __magicMoveSteps_5EG9vtwFVI_0 = Object.freeze([{"code":"// This is a code block\\nconsole.log('Hello, Slidev!')","hash":"aveMaRzt6x","tokens":[{"content":"// This is a code block","offset":0,"color":"#616E88","fontStyle":0,"key":"aveMaRzt6x-0"},{"content":"\\n","offset":23,"key":"aveMaRzt6x-1"},{"content":"console","offset":24,"color":"#D8DEE9","fontStyle":0,"key":"aveMaRzt6x-2"},{"content":".","offset":31,"color":"#ECEFF4","fontStyle":0,"key":"aveMaRzt6x-3"},{"content":"log","offset":32,"color":"#88C0D0","fontStyle":0,"key":"aveMaRzt6x-4"},{"content":"(","offset":35,"color":"#D8DEE9FF","fontStyle":0,"key":"aveMaRzt6x-5"},{"content":"'","offset":36,"color":"#ECEFF4","fontStyle":0,"key":"aveMaRzt6x-6"},{"content":"Hello, Slidev!","offset":37,"color":"#A3BE8C","fontStyle":0,"key":"aveMaRzt6x-7"},{"content":"'","offset":51,"color":"#ECEFF4","fontStyle":0,"key":"aveMaRzt6x-8"},{"content":")","offset":52,"color":"#D8DEE9FF","fontStyle":0,"key":"aveMaRzt6x-9"},{"content":"\\n","offset":53,"key":"aveMaRzt6x-10"}],"bg":"#2e3440ff","fg":"#d8dee9ff"},{"code":"let message = 'Hello, Slidev!'","hash":"WkNmaurVQ9","tokens":[{"content":"let","offset":0,"color":"#81A1C1","fontStyle":0,"key":"WkNmaurVQ9-0"},{"content":" ","offset":3,"color":"#D8DEE9FF","fontStyle":0,"key":"WkNmaurVQ9-1"},{"content":"message","offset":4,"color":"#D8DEE9","fontStyle":0,"key":"WkNmaurVQ9-2"},{"content":" ","offset":11,"color":"#D8DEE9FF","fontStyle":0,"key":"WkNmaurVQ9-3"},{"content":"=","offset":12,"color":"#81A1C1","fontStyle":0,"key":"WkNmaurVQ9-4"},{"content":" ","offset":13,"color":"#D8DEE9FF","fontStyle":0,"key":"WkNmaurVQ9-5"},{"content":"'","offset":14,"color":"#ECEFF4","fontStyle":0,"key":"aveMaRzt6x-6"},{"content":"Hello, Slidev!","offset":15,"color":"#A3BE8C","fontStyle":0,"key":"aveMaRzt6x-7"},{"content":"'","offset":29,"color":"#ECEFF4","fontStyle":0,"key":"aveMaRzt6x-8"},{"content":"\\n","offset":30,"key":"WkNmaurVQ9-9"}],"bg":"#2e3440ff","fg":"#d8dee9ff"}])</script>



      Some text before

      <ShikiMagicMove :steps='__magicMoveSteps_5EG9vtwFVI_0' />

      Some text after
        
      "
    `)
})
