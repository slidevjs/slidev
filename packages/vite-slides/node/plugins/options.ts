import { resolve, dirname } from 'path'
import Vue from '@vitejs/plugin-vue'
import ViteIcons from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
import { ArgumentsType } from '@antfu/utils'

export interface ViteSlidesOptions {
  /**
   * Markdown entry
   *
   * @default 'slides.md'
   */
  entry?: string
  /**
   * Theme name
   *
   * @default `@vite-slides/theme-default`
   */
  theme?: string
}

export interface ViteSlidesPluginOptions extends ViteSlidesOptions {
  vue?: ArgumentsType<typeof Vue>[0]
  markdown?: ArgumentsType<typeof Markdown>[0]
  components?: ArgumentsType<typeof ViteComponents>[0]
  windicss?: ArgumentsType<typeof WindiCSS>[0]
  icons?: ArgumentsType<typeof ViteIcons>[0]
}

export interface ResolvedViteSlidesOptions {
  entry: string
  userRoot: string
  packageRoot: string
  theme: string
  themeRoot: string
}

export function resolveOptions(options: ViteSlidesOptions): ResolvedViteSlidesOptions {
  const userRoot = process.cwd()
  const {
    entry = 'slides.md',
    theme = '@vite-slides/theme-default',
  } = options

  return {
    entry: resolve(userRoot, entry),
    theme,
    userRoot,
    packageRoot: resolve(__dirname, '..'),
    themeRoot: dirname(require.resolve(`${theme}/package.json`)),
  }
}
