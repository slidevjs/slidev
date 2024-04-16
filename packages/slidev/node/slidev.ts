import type { MarkdownTransformContext, ResolvedSlidevOptions, SlidevPluginOptions, SlidevServerOptions } from '@slidev/types'
import { createHooks } from 'hookable'
import type MarkdownIt from 'markdown-it'
import type { ViteDevServer } from 'vite'

export interface SlidevServerHooks {
  /**
   * Hook for the Vite server created
   */
  'server:created': (server: ViteDevServer) => void
  /**
   * Hook for the Vite config resolved
   */
  'vite:configResolved': (config: any) => void
  /**
   * Setting up the markdown-it instance
   */
  'markdown:setup': (md: MarkdownIt) => Promise<void> | void
  /**
   * Transforming markdown content before any Slidev transformations
   * You may manipulate MagicString instance
   * The hook has to be sync
   */
  'markdown:transform:pre': (context: MarkdownTransformContext, id: string) => void
  /**
   * Transforming markdown content after Slidev transformations
   * You may manipulate MagicString instance
   * The hook has to be sync
   */
  'markdown:transform:post': (context: MarkdownTransformContext, id: string) => void
}

export class SlidevServerApp {
  public readonly hooks = createHooks<SlidevServerHooks>()
  public viteServer?: ViteDevServer

  constructor(
    public options: ResolvedSlidevOptions,
    public pluginOptions: SlidevPluginOptions,
    public serverOptions?: SlidevServerOptions,
  ) {
  }
}
