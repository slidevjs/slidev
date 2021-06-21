/* eslint-disable no-console */
import { resolve, join } from 'path'
import http from 'http'
import fs from 'fs-extra'
import { build as viteBuild, InlineConfig, mergeConfig, ResolvedConfig, resolveConfig } from 'vite'
import connect from 'connect'
import sirv from 'sirv'
import { blue, yellow } from 'kolorist'
import { ViteSlidevPlugin } from './plugins/preset'
import { getIndexHtml } from './common'
import { ResolvedSlidevOptions } from './options'

export async function build(
  options: ResolvedSlidevOptions,
  viteConfig: InlineConfig = {},
) {
  const indexPath = resolve(options.userRoot, 'index.html')
  const rawConfig = await resolveConfig({}, 'build')
  const pluginOptions = rawConfig.slidev || {}

  let originalIndexHTML: string | undefined
  if (fs.existsSync(indexPath))
    originalIndexHTML = await fs.readFile(indexPath, 'utf-8')

  await fs.writeFile(indexPath, await getIndexHtml(options), 'utf-8')
  let config: ResolvedConfig = undefined!

  try {
    const inlineConfig = mergeConfig(
      viteConfig,
      <InlineConfig>({
        plugins: [
          await ViteSlidevPlugin(options, pluginOptions),
          {
            name: 'resolve-config',
            configResolved(_config) {
              config = _config
            },
          },
        ],
      }),
    )

    await viteBuild(inlineConfig)

    if (options.data.features.monaco) {
      if (options.data.config.monaco === 'dev') {
        console.log(yellow('  Monaco is disabled in the build, to enabled it, set `monaco: true` in the frontmatter'))
      }
      else {
        console.log(blue('  building for Monaco...\n'))

        await viteBuild(
          mergeConfig(inlineConfig,
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
        })),
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

  if (options.data.config.download === true || options.data.config.download === 'auto') {
    const { exportSlides } = await import('./export')

    const port = 12445
    const app = connect()
    const server = http.createServer(app)
    app.use(
      config.base,
      sirv(config.build.outDir, {
        etag: true,
        single: true,
      }),
    )
    server.listen(port)
    await exportSlides({
      port,
      total: options.data.slides.length,
      format: 'pdf',
      output: join(config.build.outDir, 'slidev-exported.pdf'),
      base: config.base,
      dark: options.data.config.colorSchema === 'dark',
      width: 1920,
      height: Math.round(1920 / options.data.config.aspectRatio),
    })
    server.close()
  }
}
