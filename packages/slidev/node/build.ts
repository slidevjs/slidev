/* eslint-disable no-console */
import { join, resolve } from 'node:path'
import http from 'node:http'
import fs from 'fs-extra'
import type { InlineConfig, ResolvedConfig } from 'vite'
import { resolveConfig, build as viteBuild } from 'vite'
import connect from 'connect'
import sirv from 'sirv'
import { blue, yellow } from 'kolorist'
import type { BuildArgs } from '@slidev/types'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml, mergeViteConfigs } from './common'
import type { ResolvedSlidevOptions } from './options'

export async function build(
  options: ResolvedSlidevOptions,
  viteConfig: InlineConfig = {},
  args: BuildArgs,
) {
  const indexPath = resolve(options.userRoot, 'index.html')
  const rawConfig = await resolveConfig({}, 'build', options.entry)
  const pluginOptions = rawConfig.slidev || {}

  let originalIndexHTML: string | undefined
  if (fs.existsSync(indexPath))
    originalIndexHTML = await fs.readFile(indexPath, 'utf-8')

  await fs.writeFile(indexPath, await getIndexHtml(options), 'utf-8')
  let config: ResolvedConfig = undefined!

  try {
    const inlineConfig = await mergeViteConfigs(
      options,
      viteConfig,
      <InlineConfig>({
        root: options.userRoot,
        plugins: [
          await ViteSlidevPlugin(options, pluginOptions),
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
      }),
      'build',
    )

    await viteBuild(inlineConfig)

    if (options.data.features.monaco) {
      if (options.data.config.monaco === 'dev') {
        console.log(yellow('  Monaco is disabled in the build, to enabled it, set `monaco: true` in the frontmatter'))
      }
      else {
        console.log(blue('  building for Monaco...\n'))

        await viteBuild(
          await mergeViteConfigs(
            options,
            inlineConfig,
            <InlineConfig>({
              root: join(options.clientRoot, 'iframes/monaco'),
              base: `${config.base}iframes/monaco/`,
              build: {
                outDir: resolve(config.build.outDir, 'iframes/monaco'),
                // fix for monaco workers
                // https://github.com/vitejs/vite/issues/1927#issuecomment-805803918
                rollupOptions: {
                  output: {
                    manualChunks: {
                      jsonWorker: ['monaco-editor/esm/vs/language/json/json.worker'],
                      cssWorker: ['monaco-editor/esm/vs/language/css/css.worker'],
                      htmlWorker: ['monaco-editor/esm/vs/language/html/html.worker'],
                      tsWorker: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
                      editorWorker: ['monaco-editor/esm/vs/editor/editor.worker'],
                    },
                  },
                },
              },
            }),
            'build',
          ),
        )
      }
    }
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
