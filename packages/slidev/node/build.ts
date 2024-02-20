/* eslint-disable no-console */
import { join, resolve } from 'node:path'
import http from 'node:http'
import fs from 'fs-extra'
import type { InlineConfig, ResolvedConfig } from 'vite'
import { mergeConfig, build as viteBuild } from 'vite'
import connect from 'connect'
import sirv from 'sirv'
import { blue, yellow } from 'kolorist'
import type { BuildArgs } from '@slidev/types'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml, mergeViteConfigs } from './common'
import type { ResolvedSlidevOptions } from './options'
import { findPkgRoot } from './resolver'

export async function build(
  options: ResolvedSlidevOptions,
  viteConfig: InlineConfig = {},
  args: BuildArgs,
) {
  const indexPath = resolve(options.userRoot, 'index.html')

  let originalIndexHTML: string | undefined
  if (fs.existsSync(indexPath))
    originalIndexHTML = await fs.readFile(indexPath, 'utf-8')

  await fs.writeFile(indexPath, await getIndexHtml(options), 'utf-8')
  let config: ResolvedConfig = undefined!

  try {
    let inlineConfig = await mergeViteConfigs(
      options,
      viteConfig,
      <InlineConfig>({
        root: options.userRoot,
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
      }),
      'build',
    )

    inlineConfig = mergeConfig(
      inlineConfig,
      {
        plugins: [
          await ViteSlidevPlugin(options, inlineConfig.slidev || {}),
        ],
      },
    )

    await viteBuild(inlineConfig)

    if (options.data.features.monaco) {
      if (options.data.config.monaco === 'dev') {
        console.log(yellow('  Monaco is disabled in the build, to enabled it, set `monaco: true` in the frontmatter'))
      }
      else {
        console.log(blue('  building for Monaco...\n'))
        const monacoRoot = await findPkgRoot('monaco-editor', options.clientRoot, true)
        const getWorkerPath = (path: string) => [join(monacoRoot, 'esm/vs', path)]
        await viteBuild({
          root: join(options.clientRoot, 'iframes/monaco'),
          base: `${config.base}iframes/monaco/`,
          plugins: [
            await ViteSlidevPlugin(options, inlineConfig.slidev || {}),
          ],
          build: {
            outDir: resolve(options.userRoot, config.build.outDir, 'iframes/monaco'),
            // fix for monaco workers
            // https://github.com/vitejs/vite/issues/1927#issuecomment-805803918
            rollupOptions: {
              output: {
                manualChunks: {
                  jsonWorker: getWorkerPath('language/json/json.worker'),
                  cssWorker: getWorkerPath('language/css/css.worker'),
                  htmlWorker: getWorkerPath('language/html/html.worker'),
                  tsWorker: getWorkerPath('language/typescript/ts.worker'),
                  editorWorker: getWorkerPath('editor/editor.worker'),
                },
              },
            },
          },
        })
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
