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

  expect(transformMagicMove(code, shiki, {
    theme: 'nord',
  }))
    .toMatchInlineSnapshot(`
      "

      Some text before

      <script>
      const __magicMoveSteps = Object.freeze([{"code":"// This is a code block\\nconsole.log('Hello, Slidev!')\\n","hash":"26gnXdptaP","tokens":[{"content":"// This is a code block","offset":0,"color":"#616E88","fontStyle":0,"key":"26gnXdptaP-0"},{"content":"\\n","offset":23,"key":"26gnXdptaP-1"},{"content":"console","offset":24,"color":"#D8DEE9","fontStyle":0,"key":"26gnXdptaP-2"},{"content":".","offset":31,"color":"#ECEFF4","fontStyle":0,"key":"26gnXdptaP-3"},{"content":"log","offset":32,"color":"#88C0D0","fontStyle":0,"key":"26gnXdptaP-4"},{"content":"(","offset":35,"color":"#D8DEE9FF","fontStyle":0,"key":"26gnXdptaP-5"},{"content":"'","offset":36,"color":"#ECEFF4","fontStyle":0,"key":"26gnXdptaP-6"},{"content":"Hello, Slidev!","offset":37,"color":"#A3BE8C","fontStyle":0,"key":"26gnXdptaP-7"},{"content":"'","offset":51,"color":"#ECEFF4","fontStyle":0,"key":"26gnXdptaP-8"},{"content":")","offset":52,"color":"#D8DEE9FF","fontStyle":0,"key":"26gnXdptaP-9"},{"content":"\\n","offset":53,"key":"26gnXdptaP-10"},{"content":"\\n","offset":54,"key":"26gnXdptaP-11"}],"bg":"#2e3440ff","fg":"#d8dee9ff"},{"code":"let message = 'Hello, Slidev!'\\n","hash":"MteySnEs9y","tokens":[{"content":"let","offset":0,"color":"#81A1C1","fontStyle":0,"key":"MteySnEs9y-0"},{"content":" ","offset":3,"color":"#D8DEE9FF","fontStyle":0,"key":"MteySnEs9y-1"},{"content":"message","offset":4,"color":"#D8DEE9","fontStyle":0,"key":"MteySnEs9y-2"},{"content":" ","offset":11,"color":"#D8DEE9FF","fontStyle":0,"key":"MteySnEs9y-3"},{"content":"=","offset":12,"color":"#81A1C1","fontStyle":0,"key":"MteySnEs9y-4"},{"content":" ","offset":13,"color":"#D8DEE9FF","fontStyle":0,"key":"MteySnEs9y-5"},{"content":"'","offset":14,"color":"#ECEFF4","fontStyle":0,"key":"26gnXdptaP-6"},{"content":"Hello, Slidev!","offset":15,"color":"#A3BE8C","fontStyle":0,"key":"26gnXdptaP-7"},{"content":"'","offset":29,"color":"#ECEFF4","fontStyle":0,"key":"26gnXdptaP-8"},{"content":"\\n","offset":30,"key":"MteySnEs9y-9"},{"content":"\\n","offset":31,"key":"MteySnEs9y-10"}],"bg":"#2e3440ff","fg":"#d8dee9ff"}])
      </script>

      <ShikiMagicMove :steps='__magicMoveSteps' />

      Some text after
        
      "
    `)
})
