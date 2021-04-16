import { resolve, dirname } from 'path'

export function getPackageRoot() {
  return resolve(__dirname, '..')
}

// TODO: read from config
export const theme = '@vite-slides/theme-default'

export function getThemeRoot() {
  return dirname(require.resolve(`${theme}/package.json`))
}
