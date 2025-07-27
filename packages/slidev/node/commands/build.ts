import type { BuildArgs, ResolvedSlidevOptions } from '@slidev/types'
import type { InlineConfig, ResolvedConfig } from 'vite'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import http from 'node:http'
import { join, resolve } from 'node:path'
import connect from 'connect'
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
  if (existsSync(indexPath))
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

  // copy or generate ogImage if it's a relative path, skip if not
  if (options.data.config.seoMeta?.ogImage === 'auto' || options.data.config.seoMeta?.ogImage?.startsWith('.')) {
    const filename = options.data.config.seoMeta?.ogImage === 'auto' ? 'og-image.png' : options.data.config.seoMeta.ogImage
    const projectOgImagePath = resolve(options.userRoot, filename)
    const outputOgImagePath = resolve(outDir, filename)

    const projectOgImageExists = await fs.access(projectOgImagePath).then(() => true).catch(() => false)
    if (projectOgImageExists) {
      await fs.copyFile(projectOgImagePath, outputOgImagePath)
    }
    else if (options.data.config.seoMeta?.ogImage === 'auto') {
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

      const { exportSlides } = await import('./export')
      const tempDir = resolve(outDir, 'temp')
      await fs.mkdir(tempDir, { recursive: true })

      await exportSlides({
        port,
        base: config.base,
        slides: options.data.slides,
        total: options.data.slides.length,
        format: 'png',
        output: tempDir,
        range: '1',
        width: options.data.config.canvasWidth,
        height: Math.round(options.data.config.canvasWidth / options.data.config.aspectRatio),
        routerMode: options.data.config.routerMode,
        waitUntil: 'networkidle',
        timeout: 30000,
        perSlide: true,
        omitBackground: false,
      })

      const tempFiles = await fs.readdir(tempDir)
      const pngFile = tempFiles.find(file => file.endsWith('.png'))
      if (pngFile) {
        const generatedPath = resolve(tempDir, pngFile)
        await fs.copyFile(generatedPath, projectOgImagePath)
        await fs.copyFile(generatedPath, outputOgImagePath)
      }

      await fs.rm(tempDir, { recursive: true, force: true })
      server.close()
    }
    else {
      throw new Error(`[Slidev] ogImage: ${filename} not found`)
    }
  }

  // copy index.html to 404.html for GitHub Pages
  await fs.copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
  // _redirects for SPA
  const redirectsPath = resolve(outDir, '_redirects')
  if (!existsSync(redirectsPath))
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
      ...getExportOptions(args, options, join(outDir, 'slidev-exported.pdf')),
    })
    server.close()
  }
}
