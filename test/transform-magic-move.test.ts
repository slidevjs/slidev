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

      <ShikiMagicMove v-bind="{}" steps-lz="NobwRAxg9gJgpmAXGA9CgBAFQBYEsDO6B6AhutPOgEYA2UEA1gDoB20L+UNcAdHQOYAKAOQAJODToAadAGUaueADcAhMICUYKWGwl82JGABSAMwBa2AGwBWWZgDCDAIrYA8gE0AciVwBZWQCingDMuAAs1gCqAFYACrg0AOo0SmyRAJKxAB78lgCeAO5aYAAuUAxwHEigkFAsJZUlhmhYeITEZBRw1HSMxVAmJvhwTYgADNrQdABOhgDElgCMlgEAHKvFJnUlsiV53EgTYBV5hqYWNnaOLh7efoEh4VFxCcmpEBnZuYUAtGNgAF8pOB2A16oZWP1BsNRgAmYLaE5ncxWWwOZxuLw+fxBUIRGLxJIpNKZHL5Ao/RaA4G1eqNQzsTgHbQDIYjJCwsKTLhQWbIOYAEVWAoCAQAnJttrt9ghxoi4KdkOdUVcMbdsQ88c9CW8SV9yT9YdSQdt6cgeFC2aNgotuTN5gF7AEAGLOsKS+rSg5y44K5EXNHXTF3HGPfEvInvT5k37BY20sGjMACS0wpDBWF23nzdb2MYC/7aLaevbeo5IpUoy7om5Y+64p4E17Ej6k74U91Ak108HIQSp9mIYLWLN8sCC4WisWuj07Uuy8t+ysB1W1kOaxsR3Wt/W/azx0FmsDCAfWyyjh1O13uotS+eHeWK4xVwNquuhrVNyN6mMUywH01ezAcRJCgGR5EUOBVFPdMAHYL35ABBYIACE1nsWcvQXR9/RVGtgw1Btwx1Fto3bH5YIAnskxPFloUHaxbVqe1+UdF03Uw+8fQrZ8V3w9V6zDbVmyjNsDQ2LsEyPTQ6KtJBrEzZjs35IURXFGdbxLGUH19J9lWrIMBI/TcSNE3cKQlSTDyAyFZLTRBrARXTcIMt91yI4Tvx3X9KX+AEAF1tAUFg4E8ABXABbKg4GmfAkBMEgaGGbQqH4eZYTgYIwjCMZBk2NL+RgVZ4DgMU8u0EpsDgCLQpIGrDBYXkYGKGgSBYArSjiqzYFlZMRnQGr8HwEh+G6ABedAxAkaQ5AUZQ1GKXR9EMJQIGCAAvABHex+GdAUoFwIxnQisKjCoJx0gyzb3CUAAHMIsmsdwAA11s8GAIBgFCnCUTaAHEBWsAJijKCoqkQGprKTbgmjswcjimZTx1WRZEMWewqU0udtO4pcwFWjbtt2/bDuO07zsuuBrruh6nte97Pu+36AaBv4qMTQx0BgocEPHVSpw0sBi2xsscOQAmtp2vaDqOk6zouq6bvux6Xrej6vp+/7AYCSl2aPQbhtG7muSUscJzUiUsawnSeIlonpdJuWKcVmmVfp9Wma11mjW66jOe5xYmMRs3+fU51OJxxcnztqWSdl8mFappXadVhmNeZ7WfjjX2OeQMaA8U4Oc1R9HMaFu9I7F/G1sl4mZbJ+XKep5W6bVxnNZZnXOxpKH/bh0ZFicouVMnMOI9F5zxZr+244b52k9d1u089zufn3HOj1osBWXsxYTeH8c2OvcfsMn6vCdj+uncT5uU/d9uM9Z/8N6AkCZog+aA5HU35mQtDVgwlbLiUcVrT0vo7BOTdk5uzbunL2OtKIvxotzWEYpeZzCPhxIBlcz4xzrhAxuLsW6pw9h3TOEke6ASTLZbe9FrQgKnhffB8dCEL2IffOBq9LKBWTLgEK4UooxTiogBKSU4ApQ6nMDKWUcrlSFpIoqJUyomBBlVGq3h6rIEatMZqQU2odRKF1fyQA===" :step-ranges='[[],[]]' />

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

      <ShikiMagicMove v-bind="{}" steps-lz="NobwRAxg9gJgpmAXJKA7AzlANnAdFqAcwAoByACTiwIBoACAQVUIFcsBDAJwEJSBKMDTAALdumFIwAcQAy7dgC0A1gBEsAZSUAHAAwB3AFYz06AMKEATAHYdBgOp6ALAEsAcs4CO6qwdQApAA0AMwBWIKCAMRCARUEwABcoJTgMJFAUVHiU+MloDGwEIShw9DgcxB0haAJOSQBiFQAOFQBRFoBOOKC0ePV4gE8cJEqwZP7JWXllNU1dQ2MzSxt7JzdPb19A0PCo6IBaHTAAXxpwPKzMyVw44qDS8qsq7Cha5DqW0xaIiMcunr7BggKkIxhM5IpVBptPojCZzNZbA4XO4vD5/MEwpEYnsAIzHU4ZC7lMAEQg3EplJCNJ41eqNRqmHQqQ5CbqZAFDYGjODjZCTCEzaHzOFLRGrFEbdHbLH7Cz4s49bKSYjku6UxA4nE0l71JqtDrfP7sgackagvng6ZQuawxYIlbI9ZoraY3Z7ADM8sJSuQpFV9yQOIs2teYHen2+v1Z/xNQLNPLBU0hsxhC3hyyRa1RmwxO2xvxOCsyPrAlGoUHoTFYHB4/vVOPdIfqDHdACEWgyjb1Y8MQQmLUnBTa06KHVnJS68/sQl7ziW/UUKeULNSULS3h8vj8uxy433edJLcmhbb02LHdmpa7sQA2WeKy7IASLtXL9pNt56trtQ3R42A3tuQPfkrRTYU7QzcUnRzaU3Sse9i0fMAAB1UDrcp3XjYCjyHVMRXtTMJWdXMZT2RpjgAXSELBnFQOBXBYABbAAjOBOHQJAgnYLBSiEZiyTeCw4HdRxHB0cIugEsMYEaeA4HaCShHiYQ4EY+j2DUyRUBeGA4g4ZhJHYZg2C4PZ4g4wsUHgXI0EwHB8CIMgy1oRhjJrOg6gsXhnxEMQJGQABVAAPcgAkYm9UACgItBxAB9GAABUAHkWnIKxWywQg9FMdB2AAaQATQgHF2kaYTYrgEIAgiVx3FbAK4kSZJUkQdI5yQvI7MKMBbgDLlqh1T9mm/Hcey5c0wGC0Lwsi6K4sSlK0oyrKcvyoqSrK90Kqqmq6oCg4EKJK50KQR410GsNN0jUaAPG/tJpCsKIqimL4uS1L0sy7LcsK4rSvKyrqtq5x6txQ6S1JE7EFXAbQzqelGWZG7TX3SQpqe2bXoWj7lu+ta/s27agb2vY5Us9riRVF8+s1D8wy/A0ImRvcgLRx6Zpe+b3qWr7Vt+jaAZ24HQc9cmH2JBceqXQNg3OuGru3P9u1urC2em565rexbPpWn71v+rbAd2kH9oLAkKckZyK1c6suA8ryoYbOm6hbdtOyV3dAIm9GOc17Ged1/GBcNoWSZnMXEIlqH3S1OX6gVqMwDZZWUdZwL2Y1rHuZ1vH+YNonjdBu8I6Op9o9l2HdWGxnma9+6fczrntdxvn9cJo3hf2+CS5LVDo8bNOHvVzGm5x3m9YJwXiZNsjKOo2j6KY1j2M47jeLAfj6iEkSxMUpOpLqGS5IUoJGpUtTXA0oEwG0zhdOooypMfkzODMiyKKAA" :step-ranges='[[],[]]' />

      Some text after
        
      "
    `)
})
