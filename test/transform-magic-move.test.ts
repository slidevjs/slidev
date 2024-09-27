import { createHighlighter } from 'shiki'
import { expect, it } from 'vitest'
import { transformMagicMove } from '../packages/slidev/node/syntax/transform/magic-move'
import { createTransformContext } from './_tutils'

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
  const shiki = await createHighlighter({
    themes: ['nord'],
    langs: ['typescript'],
  })

  const ctx = createTransformContext(code, shiki)

  transformMagicMove(ctx)

  expect(ctx.s.toString())
    .toMatchInlineSnapshot(`
      "

      Some text before

      <ShikiMagicMove v-bind="{}" steps-lz="NobwRAxg9gJgpmAXGA9CgBAFQBYEsDO6B6AhutPOgEYA2UEA1gDoB20L+UNcAdHQOYAKAOQAJODToAadAGUaueADcAhMICUYKWGwl82JGAC2AeRMB3AB4MSJywCstYAC5QGcDklCQoLZx+dDNCw8QmIyCjhqOkYnKAAzePw4QMQABm1oOgAnQwBiADYARgKAUQAOcqd432dZZwBPbiQMsHcGw1MLa1sHAFo0sABfKXB2fz9DVjjE5NSAJgBmbXbOsysbO3s+ouHRnz8Aw3ZOZu0EpJSkeYAWTK4oXOQ8gBFyl9LSgE5q2vqmhDpFZwDrILobXrbeZ7Ma1I7IHgzS6pRZFe45fKlADCpQAYribr8/P9mkC2iC1t1Nv1FjCDhNUmABEi5khFvN0Y98pUsWkXoNtDViY1Sa1VmD1j0tn1CSNYYdJshBCyrohFgBWTlPMCvd6fL74ol1EWAsUUiVUyF9dV08bwsDCFUogpazE4/GEwV/E0tYGg4yS6nbAq2uGKsDiSRQGTyRRwVROtkAdldzwAgosAEIVLFGkmmv2UiHSpOhhWMx3nWaq9VonwY57YvEEvM+snigOW6VVOX0+2aKvIpDqjn1rnPN4fb6Gr3CgG+8n+8FS/o/Xt28PTQesxDq5aLosr7ZFQZDAC62gULDgADkAK5GKhwbL4JDxEg0ZLaKj8fLzOCLDcNxpIk1S/s8MDlPAcBfKB2jONgcBGLeJDIYYLCPDATg0CQLDgS4r7rrAgJMik6DIfg+AkPwUQALzoGIEjSHICjKGoTi6Pohi4LIADSvFQNg5gMIsJBOK47ieIg3gboy3CBNuqqtFk446uURRpkUWK7LOxrzu25pgDx/GCcJokDGWDKGOgiZqqmOqTvqM5gEKemioWyDGQJQkiSQOyWfaFFUTRtl3GO2q6lOPy6fmC4dl5pm+X00JEeW1m2UUdYqRFjnTrirb6Wa/oJT55m0qlVnILRGWjtl3IaVpOkud6hUeUZfHeWZfmyvssnpYpqRFPudUTnqeUFe5B6eR1iXmTaFX2pWYAXDuRRhSNOpNh6E0FlN7UmaVfkhgt4aRsxsZsRlmrhfkGbZuUuYxW2RXcTNh19KWJ0VrZ8xfPZeRbS2T2tXtJVdX0Pa9WGjJbst1Yoi900HeDa4XkyuDXvej7Pq+iDvp+cDfvheT/oBwFwS5xOQdBsHxOJiHITeqEkRh2RYZeuH4c4hFnkAA===" :step-ranges='[[],[]]' />

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
  const shiki = await createHighlighter({
    themes: ['nord'],
    langs: ['angular-ts'],
  })

  const ctx = createTransformContext(code, shiki)

  transformMagicMove(ctx)

  expect(ctx.s.toString())
    .toMatchInlineSnapshot(`
      "

      Some text before

      <ShikiMagicMove v-bind="{}" steps-lz="NobwRAxg9gJgpmAXJKA7AzlANnAdFqAcwAoByACTiwIBoACAQVUIFcsBDAJwEJSBKMDTAALdumFIwABwBeABgBCAMQCcCgMwAtAG6CwAFygBrOBiSgUqfaf2ToGbAiFQAZi/RxbiOUOgFOkgDEACIAHMEAohEqei5o+gDK+gCeOEg+YCbJkrKKqho6ALRyYAC+NOD21laSuHqu7p5IAOy+2FAByIERAMIRSkoALLHxSakI3kJZOfLKalrahQCMZRWW1V5gBIT1bh5eoW3+QaGhPXLBJUJxVmNpk5lw2ci5cwWLAEyrlfE2ksS7RpeJZLI4dIJhSLRAYjW4pe4ZaYvWb5BaFdTfdZ/ZCkQH7JBLD5gzpgbp9AbDa6jeETRFPGZ5eZFYblH5WbFgSjUKD0JisDg8PFNRBLdTEoIMdQKCJnWGJGnpKb05GM96FACsmKqHNxzj2wo+hxQxy6vX6Qzld1pSue0hRTMWADYtb8asgBHqgUgPipxV1IVEVDCqXDxorHrbXqiis0Xey3WAADqoIVedR0yP2tWhMoAXSEWAAlqg4AA5FgAWwARnBOOgkC52FgPEIqzsuh84OpBoM5G5Yu3STBQvA4Cp+0J9MI4BWy+xZ5JUB0YHoOMxJOxmGwuIV9PXWSh4HY0JgcPgiGQubRGFuBXRAh9eB6RGIJMgAGpLBgQbRLACKAAaACyOaTsYpj1ogFjagm9ink4YANPiDx+OC/rhIGloKg8SJgJ+36/oBIHFHGGy1KmLR+qSZoUlhYY4cqeFfj+/7AaEyykRy2wUYgRqoSSgSnOclx0QiNqSPhLFEexXwHjBmwAp6yEglRIQYdCSiidaEYScxhFseinEJrqiH6sCRLGmh1HkhaIbyvRGa6QRrHESyazyZIV48je/JcPej48aKqmStKsp2Va4a4ZJ+nEZqcmupsJlIcK6igpZAk0bZYA3PZYk6R+ekuexzrxfGmzPslaYWfxELqUGmnhdhjkFc50mFLGpVkcgyY8eoYr5UxrUGTmpT5lsxZlpWNZ1g2TYtmAbZBJ23a9hO2WDoEw6juOLh6FOM5zguyBLpwK4Fpug4XdunC7vuuZAA=" :step-ranges='[[],[]]' />

      Some text after
        
      "
    `)
})
