import { prompt } from 'enquirer'
import { parseNi, run } from '@antfu/ni'

const officialThemes: Record<string, string> = {
  none: '',
  default: '@slidev/theme-default',
  seriph: '@slidev/theme-seriph',
}

export function packageExists(name: string) {
  try {
    if (require.resolve(`${name}/package.json`))
      return true
  }
  catch {}
  return false
}

export function resolveThemeName(name: string) {
  if (!name)
    return ''
  if (name.startsWith('@slidev/theme-') || name.startsWith('slidev-theme-'))
    return name
  if (officialThemes[name] !== null)
    return officialThemes[name]

  return `slidev-theme-${name}`
}

export async function promptForThemeInstallation(name: string) {
  name = resolveThemeName(name)
  if (!name)
    return name

  if (packageExists(name))
    return name

  const { confirm } = await prompt<{ confirm: boolean }>({
    name: 'confirm',
    initial: 'Y',
    type: 'confirm',
    message: `Does not found theme "${name}" in your project, do you want to install it now?`,
  })

  if (!confirm)
    return false

  await run(parseNi, [name])

  return name
}
