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

      <ShikiMagicMove steps-lz="NobwRAxg9gJgpmAXGA9CgBAFQBYEsDO6B6AhutPOgEYA2UEA1gDoB20L+UNcAdHQOYAKAOQAJODToAadAGUaueADcAhMICUYKWGwl82JGBJK4AWRIAlAF4AXAGwAPLWBtQGcDklCQoLGx5tDNCw8QmIyCjhqOkZnKAAzePw4QMQABm1oOgAnQwBiOwBGOwBRAA4y53jfG1kbAE9uJAywd3rDYzNLW0cAWjSwAF8pcHZ/P0NWOMTk1IAmAGZtNo6Tc2t7B17CoZGfPwDDdk4m7QSklKQ5gBZMrihc5DyAETLnkpKATiqausaEdLLODtZCddY9LZzXajGqHZA8aYXVILQp3HL5EoAYRKADEcdcfn4/k1Aa1gasuhs+gtoftxqkwAJEbMkAs5miHvkKpi0s8BtpqkSGiSWitQWtuptegThjCDhNkIJmZdEAsAKwcx5gF5vD6fPGE2rCgGi8niykQ3pq2ljOFgYTK5F2TUY7F4gkC37G5pAkFGCVUrZ2G2whVgcSSKAyeSKOCqR2sgDsLqeAEEFgAhcqYw3Ek2+ingqWJkPyhkOs4zFVq1E+dFPLG4/G572ksX+i1Syqyul2zSVpFINXsuucp6vd5fA2eoX/H1kv1gyV9b4921hqYDlmINVLBeF5dbQoDQYAXW0VH4+TmcAW12uaUSVSvTxgZXgcE+T7XsABjJS6AALZwPg+AkPwUQALzoGIEjSHICjKGozi6PohgAOoMAAcoBJAAK7ZAAagAit82iuO4niIN464MtwgRbiqLRZGO2plIUqaFJiOwzkac5tmaYCYTh+FEaR/SlvShjoAmqoptqE56tOYCCnxIoFsgwm4QRJGfNskl2sBoHgQgjGpLco5ajqk5kSpXr8aafpaaJum9FCP5ltJsmFLWLFWYpU44i2DkaUJ2HaWJek0h5UnIJB3kjn5XIcVxPF2bO6n7pp4UueJMp7LRXlmUghR7kl466oFwWZe2zk6eJ1oxXaFZgOc26FBZ5Xao27rVfmWUdkWfTBk1YYRvBMZId5GqWfk6ZZmUOa8Xm87tkuga9CWo3lrJcyfPJeQ9c2y2to5B4bd2BWhgym6tVWyJndlIn1Xpq7nmAl7Xre96PvEz75G+H5fn9Z5AA==" />

      Some text after
        
      "
    `)
})
