import type { SlidevConfig } from '@slidev/types'
import type { Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isColorSchemaConfigured, isDark, toggleDark } from './dark'

const mocks = vi.hoisted(() => ({
  configs: undefined as Pick<SlidevConfig, 'colorSchema'> | undefined,
  preferredDark: undefined as Ref<boolean> | undefined,
  store: undefined as Ref<string> | undefined,
}))

vi.mock('../env', async () => {
  const { reactive } = await import('vue')
  const configs = reactive({ colorSchema: 'auto' as SlidevConfig['colorSchema'] })
  mocks.configs = configs
  return { configs }
})

vi.mock('@vueuse/core', async () => {
  const { ref } = await import('vue')
  mocks.preferredDark = ref(false)
  mocks.store = ref('auto')
  return {
    isClient: false,
    useLocalStorage: () => mocks.store,
    usePreferredDark: () => mocks.preferredDark,
    useToggle: (target: Ref<boolean>) => () => target.value = !target.value,
  }
})

describe('dark mode configuration', () => {
  beforeEach(() => {
    mocks.configs!.colorSchema = 'auto'
    mocks.preferredDark!.value = false
    mocks.store!.value = 'auto'
  })

  it.each([
    ['dark light', true],
    ['light dark', false],
  ] as const)('uses the first scheme as the default for "%s"', (colorSchema, expected) => {
    mocks.configs!.colorSchema = colorSchema

    expect(isDark.value).toBe(expected)
    expect(isColorSchemaConfigured.value).toBe(false)
  })

  it.each([
    ['dark light', 'light', false],
    ['light dark', 'dark', true],
  ] as const)('uses a saved manual preference for "%s"', (colorSchema, savedPreference, expected) => {
    mocks.configs!.colorSchema = colorSchema
    mocks.store!.value = savedPreference

    expect(isDark.value).toBe(expected)
  })

  it.each([
    ['dark light', false, 'light'],
    ['light dark', true, 'dark'],
  ] as const)('persists manual changes for "%s"', (colorSchema, selection, storedValue) => {
    mocks.configs!.colorSchema = colorSchema

    isDark.value = selection

    expect(mocks.store!.value).toBe(storedValue)
    expect(isDark.value).toBe(selection)
  })

  it('uses the system preference for auto and preserves its existing storage behavior', () => {
    mocks.preferredDark!.value = true
    expect(isDark.value).toBe(true)

    isDark.value = false
    expect(mocks.store!.value).toBe('light')
    expect(isDark.value).toBe(false)

    isDark.value = true
    expect(mocks.store!.value).toBe('auto')
    expect(isDark.value).toBe(true)
  })

  it.each([
    ['dark', true],
    ['light', false],
  ] as const)('keeps "%s" forced and non-switchable', (colorSchema, expected) => {
    mocks.configs!.colorSchema = colorSchema

    expect(isColorSchemaConfigured.value).toBe(true)
    expect(isDark.value).toBe(expected)

    toggleDark()

    expect(isDark.value).toBe(expected)
    expect(mocks.store!.value).toBe('auto')
  })
})
