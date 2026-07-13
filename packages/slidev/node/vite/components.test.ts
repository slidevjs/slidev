import pm from 'picomatch'
import { expect, it } from 'vitest'
import { createPipePathComponentGlobs } from './components'

it('keeps the default component discovery for ordinary paths', () => {
  expect(createPipePathComponentGlobs(
    ['/work/presentation/components'],
    ['vue', 'ts'],
  )).toBeUndefined()
})

it('leaves empty extension validation to the component plugin', () => {
  expect(createPipePathComponentGlobs(
    ['/work/|presentation/components'],
    [],
  )).toBeUndefined()
})

it('escapes pipe characters when building component globs', () => {
  const globs = createPipePathComponentGlobs(
    ['/work/|presentation/components'],
    ['vue', 'md', 'ts'],
  )

  expect(globs).toEqual([
    '/work/\\|presentation/components/**/*.{vue,md,ts}',
  ])
  expect(pm(globs![0])('/work/|presentation/components/Counter.vue')).toBe(true)
})
