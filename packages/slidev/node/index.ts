import type { SlidevPluginOptions } from './options'

// extend vite.config.ts
declare module 'vite' {
  interface UserConfig {
    /**
     * Custom internal plugin options for Slidev (advanced)
     *
     * @see https://github.com/slidevjs/slidev/blob/main/packages/slidev/node/options.ts#L50
     */
    slidev?: SlidevPluginOptions
  }
}

export * from './commands/server'
export * from './vite'
export * from './options'
export { parser } from './parser'
