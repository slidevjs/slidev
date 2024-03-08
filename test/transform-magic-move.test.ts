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
      "

      Some text before

      <ShikiMagicMove v-bind="{}" steps-lz="NobwRAxg9gJgpmAXGA9CgBAFQBYEsDO6B6AhutPOgEYA2UEA1gDoB20L+UNcAdHQOYAKAOQAJODToAadAGUaueADcAhMICUYKWGwl82JGAC2AeRMB3AB4MSJywCstYAC5QGcDklCQoLZx+dDNCw8QmIyCjhqOkYnKAAzePw4QMQABm1oOgAnQwBiADYARgKAUQAOcqd432dZZwBPbiQMsHcGw1MLa1sHAFo0sABfKXB2fz9DVjjE5NSAJgBmbXbOsysbO3s+ouHRnz8Aw3ZOZu0EpJSkeYAWTK4oXOQ8gBFyl9LSgE5q2vqmhDpFZwDrILobXrbeZ7Ma1I7IHgzS6pRZFe45fKlADCpQAYribr8/P9mkC2iC1t1Nv1FjCDhNUmABEi5khFvN0Y98pUsWkXoNtDViY1Sa1VmD1j0tn1CSNYYdJshBCyrohFgBWTlPMCvd6fL74ol1EWAsUUiVUyF9dV08bwsDCFUogpazE4/GEwV/E0tYGg4yS6nbAq2uGKsDiSRQGTyRRwVROtkAdldzwAgosAEIVLFGkmmv2UiHSpOhhWMx3nWaq9VonwY57YvEEvM+snigOW6VVOX0+2aKvIpDqjn1rnPN4fb6Gr3CgG+8n+8FS/o/Xt28PTQesxDq5aLosr7ZFQZDAC62io/Hy8zgixuNzSiWq1+eMHK8DgX2f2mc2DgRhwAAciQgGGCwjwwE4NAkCwr4uPgobwIY3DOOggH4PgJD8FEAC86BiBI0hyAoyhqE4uj6IYuCyAA0rRUDYOYDCLCQTiuO4niIN4G6MqhiZklk446uURRpkUWK7LOxrzu25pgDR9GMcxrEDGWDKGOgAn7kJ2q6lOBq4q2slmv6ikMUxLEkDs6n2hhWE4QJdxjnpk76sZoqFsg5nKVZfTQuuYaMlp26qkUda6fkbnTkZ0n5guHY+ZZqm0oF5aGLhAlFKOkXPKJ4mSR5BYHt5dEWSp1myvsvGaVlOkPK5eoxUVCXyUlFXWrZ4aVmAFw7kUzm5TqTYei1clmWVvmqSGaUacgkbEbGZFZZqLn5Bm2blLmcVtqZ1GTcl1mlrN9o9X1qrzF8qbDe6LY7SZXkKQdHU9tVQVTCw2l7aVSmHX0a4XmAV43neD5PvEL75O+n7fhDv7/oBIFgcgEHZFB2gwXBhjOIh55AA===" :step-ranges='[[],[]]' />

      Some text after
        
      "
    `)
})
