import type { BuildArgs, ResolvedSlidevOptions } from '@slidev/types'
import type { InlineConfig, ResolvedConfig } from 'vite'
import http from 'node:http'
import { resolve } from 'node:path'
import connect from 'connect'
import fs from 'fs-extra'
import sirv from 'sirv'
import { build as viteBuild } from 'vite'
import { resolveViteConfigs } from './shared'

export async function build(
  options: ResolvedSlidevOptions,
  viteConfig: InlineConfig = {},
  args: BuildArgs,
) {
  const indexPath = resolve(options.userRoot, 'index.html')

  let originalIndexHTML: string | undefined
  if (fs.existsSync(indexPath))
    originalIndexHTML = await fs.readFile(indexPath, 'utf-8')

  await fs.writeFile(indexPath, options.utils.indexHtml, 'utf-8')
  let config: ResolvedConfig = undefined!

  try {
    const inlineConfig = await resolveViteConfigs(
      options,
      {
        plugins: [
          {
            name: 'resolve-config',
            configResolved(_config) {
              config = _config
            },
          },
        ],
        build: {
          chunkSizeWarningLimit: 2000,
        },
      } satisfies InlineConfig,
      viteConfig,
      'build',
    )

    await viteBuild(inlineConfig)
  }
  finally {
    if (originalIndexHTML != null)
      await fs.writeFile(indexPath, originalIndexHTML, 'utf-8')
    else
      await fs.unlink(indexPath)
  }

  const outDir = resolve(options.userRoot, config.build.outDir)

  // copy index.html to 404.html for GitHub Pages
  await fs.copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
  // _redirects for SPA
  const redirectsPath = resolve(outDir, '_redirects')
  if (!fs.existsSync(redirectsPath))
    await fs.writeFile(redirectsPath, `${config.base}*    ${config.base}index.html   200\n`, 'utf-8')

  if ([true, 'true', 'auto'].includes(options.data.config.download)) {
    const { exportSlides, getExportOptions } = await import('./export')

    const port = 12445
    const app = connect()
    const server = http.createServer(app)
    app.use(
      config.base,
      sirv(outDir, {
        etag: true,
        single: true,
        dev: true,
      }),
    )
    server.listen(port)
    await exportSlides({
      port,
      base: config.base,
      ...getExportOptions(args, options, outDir, 'slidev-exported.pdf'),
    })
    server.close()
  }
}
