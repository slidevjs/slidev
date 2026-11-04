import type { ExportArgs, HtmlExportOptions, ResolvedSlidevOptions } from '@slidev/types'
import type { HtmlAsset } from '../vite/singlefile'
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'pathe'

export function getHtmlExportOptions(args: ExportArgs, defaults: HtmlExportOptions = {}): HtmlExportOptions {
  const images = {
    maxWidth: args['image-max-width'] ?? defaults.images?.maxWidth,
    maxHeight: args['image-max-height'] ?? defaults.images?.maxHeight,
    quality: args['image-quality'] ?? defaults.images?.quality,
  }
  const allowRemote = args['allow-remote'] ?? defaults.allowRemote ?? false
  if (typeof allowRemote !== 'boolean')
    throw new TypeError('[slidev] Invalid HTML allowRemote: expected a boolean')
  const maxBytes = args['max-bytes'] ?? defaults.maxBytes
  for (const [name, value] of Object.entries({ maxBytes, ...images })) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0 || (name === 'quality' && value > 100))) {
      throw new Error(`[slidev] Invalid HTML ${name}: expected a positive safe integer${name === 'quality'
        ? ' between 1 and 100'
        : ''}`)
    }
  }
  return { allowRemote, maxBytes, images }
}

export function validateHtmlExportArgs(args: ExportArgs, format: string) {
  const flags = format === 'html'
    ? [
        'range',
        'with-clicks',
        'with-toc',
        'per-slide',
        'scale',
        'omit-background',
        'wait',
        'wait-until',
        'timeout',
        'executable-path',
      ] as const
    : [
        'allow-remote',
        'max-bytes',
        'image-max-width',
        'image-max-height',
        'image-quality',
        'without-notes',
      ] as const
  for (const flag of flags) {
    if (args[flag] !== undefined)
      throw new Error(`[slidev] --${flag} is not supported for ${format} export`)
  }
}

export function getHtmlOutput(args: ExportArgs, options: ResolvedSlidevOptions) {
  const configured = options.data.config.exportFilename
  if (!args.output && configured && (configured === '..' || /[/\\]/.test(configured)))
    throw new Error('[slidev] exportFilename must be a filename; use --output for an explicit path')
  const filename = args.output || configured || `${basename(options.entry, '.md')}-export`
  return resolve(filename.endsWith('.html')
    ? filename
    : `${filename}.html`)
}

export async function publishHtml(html: string, output: string, maxBytes?: number, assets: HtmlAsset[] = []) {
  const bytes = Buffer.byteLength(html, 'utf8')
  if (maxBytes !== undefined && bytes > maxBytes) {
    const largest = [...assets].sort((left, right) => right.encoded.length - left.encoded.length).slice(0, 5)
    const details = largest.map(asset => `  ${asset.name} (${asset.type}): ${asset.encoded.length} base64 bytes`).join('\n')
    throw new Error(`[slidev] HTML is ${bytes} bytes, exceeding maxBytes ${maxBytes}. Existing output preserved. Reduce image dimensions/quality or the embedded media size.${details
      ? `\nLargest embedded assets:\n${details}`
      : ''}`)
  }
  await fs.mkdir(dirname(output), { recursive: true })
  const stage = await fs.mkdtemp(join(dirname(output), '.slidev-html-'))
  try {
    const filename = join(stage, 'presentation.html')
    await fs.writeFile(filename, html, 'utf8')
    await fs.rename(filename, output)
  }
  finally {
    await fs.rm(stage, { recursive: true, force: true })
  }
  return bytes
}

export async function exportHtml(options: ResolvedSlidevOptions, args: ExportArgs) {
  validateHtmlExportArgs(args, 'html')
  const settings = getHtmlExportOptions(args, options.data.config.export.html)
  const output = getHtmlOutput(args, options)
  const temporary = await fs.mkdtemp(join(tmpdir(), 'slidev-html-'))
  try {
    const [{ buildPresentation }, { createSingleFilePlugins }] = await Promise.all([
      import('./build'),
      import('../vite/singlefile'),
    ])
    let assets: HtmlAsset[] = []
    await buildPresentation(options, {
      base: './',
      plugins: createSingleFilePlugins(options, settings, (value) => { assets = value }),
      build: { outDir: temporary, emptyOutDir: true },
    })
    const html = await fs.readFile(join(temporary, 'index.html'), 'utf8')
    const bytes = await publishHtml(html, output, settings.maxBytes, assets)
    return `${output} (${bytes} bytes)`
  }
  finally {
    await fs.rm(temporary, { recursive: true, force: true })
  }
}
