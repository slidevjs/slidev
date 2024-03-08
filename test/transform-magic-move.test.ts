import { expect, it } from 'vitest'
import { getHighlighter } from 'shiki'
import { transformMagicMove } from '../packages/slidev/node/syntax/transform'

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

it('hyphenated code language', async () => {
  const code = `

Some text before

\`\`\`\`md magic-move
\`\`\`angular-ts
console.log('Hello, Angular!')
\`\`\`
\`\`\`angular-ts
console.log('Hello, Angular #2!')
\`\`\`
\`\`\`\`

Some text after
  
`
  const shiki = await getHighlighter({
    themes: ['nord'],
    langs: ['angular-ts'],
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

        <ShikiMagicMove v-bind="{}" steps-lz="NobwRAxg9gJgpmAXJKA7AzlANnAdFqAcwAoByACTiwIBoACAQVUIFcsBDAJwEJSBKMDTAALdumFIwABwBeABgBCAMQCcCgMwAtAG6CwAFygBrOBiSgUqfaf2ToGbAiFQAZi/RxbiOUOgFOkgDEACIAHMEAohEqei5o+gDK+gCeOEg+YCbJkrKKqho6ALRyYAC+NOD21laSuHqu7p5IAOy+2FAByIERAMIRSkoALLHxSakI3kJZOfLKalrahQCMZRWW1V5gBIT1bh5eoW3+QaGhPXLBJUJxVmNpk5lw2ci5cwWLAEyrlfE2ksS7RpeJZLI4dIJhSLRAYjW4pe4ZaYvWb5BaFdTfdZ/ZCkQH7JBLD5gzpgbp9AbDa6jeETRFPGZ5eZFYblH5WbFgSjUKD0JisDg8PFNRBLdTEoIMdQKCJnWGJGnpKb05GM96FACsmKqHNxzj2wo+hxQxy6vX6Qzld1pSue0hRTMWADYtb8asgBHqgUgPipxV1IVEVDCqXDxorHrbXqiis0Xey3WAADqoIVedR0yP2tWhMoAXSEACMdl0PnB1INBnI3LFi6SYKF4HAVNWhPphHAALZwABy7C7klQHRgeg4zEk7GYbC4hX06Bd8DsaEwOHwRDIXNojEnArogQ+vA9IjEEmQADUlgwINolgBFAAaAFkc63jKY54gLNqE/Zl04wA18QePxwX9cJA0tBUHiRMBz0va97yfYo4w2WpUxaP1STNCkILDKDlRgi8r1vR9QmWZCOW2NDECNYCSUCU5zkuHCERtSRYKIhDSK+VksQTAFPUAkEMJCMDoSUZjrQjNjCPgkj0XIhNdX/fVgSJY0QMw8kLRDeVcIzaS4OIxCWTWL9Ng3Hkt35Lhd33KjRWEyVpVlHSrXDaD2NkxDNR4szJCUgDhXUUF1LorDtLAG5dJYqSzxkozSOdXzXU2Q9ArTNTaIhUSg3E1zIP0uLDM4wpY2S+NNmTKj1DFWKCOKuSc1KfMwCLIJS3LSsW0i2tAnrRtmxcPQ207Hs+wmMBB04YchFHWsJ2szgZznZqgA" :step-ranges='[[],[]]' />

        Some text after
          
        "
      `)
})
