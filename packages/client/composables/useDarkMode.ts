import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'

export function useDarkMode() {
  return {
    isColorSchemaConfigured,
    isDark,
    toggleDark,
  }
}
