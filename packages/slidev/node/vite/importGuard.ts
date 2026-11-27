import type { Plugin, ResolvedConfig } from 'vite'
import { existsSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'pathe'
import { parseSync } from 'vite'
import { templateLegacyTitles } from '../virtual/deprecated'
import { templateTitleRendererMd } from '../virtual/titles'
import { regexSlideSourceId } from './common'

interface ImportSource {
  value: string
  start?: number
}

const virtualSlideMarkdownIds = new Set([
  templateTitleRendererMd.id,
  templateLegacyTitles.id,
])

export function createSlideImportGuardPlugin(): Plugin {
  let config: ResolvedConfig
  let allowRoots: string[] = []

  return {
    name: 'slidev:slide-import-guard',

    configResolved(resolved) {
      config = resolved
      allowRoots = config.server.fs.allow.map(normalizeFsPath)
    },

    async transform(code, id) {
      if (!isSlideMarkdownId(id) || !config?.server.fs.strict)
        return null

      const importer = filePathFromId(id) ?? id
      await Promise.all(extractImportSources(code, id).map(async ({ value, start }) => {
        // Public-directory assets are referenced by root-absolute URL (`/foo.png`)
        // and served by Vite's public-dir middleware, not module-resolved. Such a
        // URL is a Vite URL, not a filesystem-absolute path, so exempt it from the
        // fs.allow check when it maps to an existing file under `config.publicDir`.
        if (isPublicAsset(value, config))
          return

        const resolved = await this.resolve(value, importer, { skipSelf: true })
        if (!resolved || resolved.external)
          return

        const filePath = filePathFromId(resolved.id)
        if (!filePath)
          return

        const normalized = normalizeFsPath(filePath)
        if (isAllowedFile(normalized, allowRoots))
          return
        if (isBareImport(value) && isDependencyFile(normalized))
          return

        this.error(
          `[slidev] Import "${value}" from slide Markdown resolves outside of Vite server.fs.allow: ${normalized}`,
          start,
        )
      }))

      return null
    },
  }
}

export function isSlideMarkdownId(id: string) {
  const clean = cleanUrl(id)
  return regexSlideSourceId.test(clean) || virtualSlideMarkdownIds.has(clean)
}

export function filePathFromId(id: string): string | null {
  const clean = cleanUrl(id)
  if (clean.startsWith('file://'))
    return fileURLToPath(clean)
  if (clean.startsWith('/@fs/'))
    return clean.slice('/@fs'.length)
  if (clean.startsWith('/@'))
    return null
  if (path.isAbsolute(clean))
    return clean
  return null
}

export function isAllowedFile(filePath: string, allowRoots: string[]) {
  return allowRoots.some(root => isFileInRoot(root, filePath))
}

/**
 * Whether a static import `value` is a public-directory asset, i.e. a
 * root-absolute Vite URL (`/foo.png`) that maps to an existing file under
 * `config.publicDir`. The Vue SFC compiler turns `<img src="/foo.png">` into a
 * static `import`, but public assets are served by URL rather than
 * module-resolved, so `/foo.png` is a Vite URL — not a filesystem-absolute path
 * — and must be exempted from the `server.fs.allow` check.
 */
export function isPublicAsset(value: string, config: Pick<ResolvedConfig, 'publicDir'>): boolean {
  // `publicDir` is `''` when disabled (`publicDir: false`). Vite treats `/@fs/`,
  // `/@id/`, … as internal URLs, never public assets, so leave those alone.
  if (!config.publicDir || !value.startsWith('/') || value.startsWith('/@'))
    return false
  const publicDir = normalizeFsPath(config.publicDir)
  const publicPath = normalizeFsPath(path.join(publicDir, cleanUrl(value).slice(1)))
  return isFileInRoot(publicDir, publicPath) && existsSync(publicPath)
}

export function extractImportSources(code: string, id: string): ImportSource[] {
  const result = parseSync(id, code)
  const sources: ImportSource[] = []

  for (const item of result.module.staticImports) {
    sources.push({
      value: item.moduleRequest.value,
      start: item.moduleRequest.start,
    })
  }

  for (const item of result.module.staticExports) {
    for (const entry of item.entries) {
      if (entry.moduleRequest) {
        sources.push({
          value: entry.moduleRequest.value,
          start: entry.moduleRequest.start,
        })
      }
    }
  }

  for (const item of result.module.dynamicImports) {
    const source = parseStringLiteral(code.slice(item.moduleRequest.start, item.moduleRequest.end))
    if (source) {
      sources.push({
        value: source,
        start: item.moduleRequest.start,
      })
    }
  }

  return sources
}

function cleanUrl(id: string) {
  return id.replace(/[?#].*$/, '')
}

function normalizeFsPath(filePath: string) {
  const absolute = path.resolve(filePath)
  if (!existsSync(absolute))
    return normalizeMissingFsPath(absolute)
  return realpathSync.native(absolute)
}

function normalizeMissingFsPath(filePath: string): string {
  const dir = path.dirname(filePath)
  if (dir === filePath)
    return filePath
  if (existsSync(dir))
    return path.join(realpathSync.native(dir), path.basename(filePath))
  return path.join(normalizeMissingFsPath(dir), path.basename(filePath))
}

function isFileInRoot(root: string, filePath: string) {
  const relative = path.relative(root, filePath)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function isDependencyFile(filePath: string) {
  return filePath.split(/[\\/]/).includes('node_modules')
}

function isBareImport(source: string) {
  return /^(?![a-z]:)[\w@](?!.*:\/\/)/i.test(source)
}

function parseStringLiteral(raw: string) {
  const trimmed = raw.trim()
  const quote = trimmed[0]
  if (quote !== '"' && quote !== '\'' && quote !== '`')
    return null
  if (trimmed.at(-1) !== quote)
    return null
  if (quote === '`' && trimmed.includes('${'))
    return null

  try {
    if (quote === '"')
      return JSON.parse(trimmed) as string
    return JSON.parse(`"${trimmed.slice(1, -1).replace(/"/g, '\\"')}"`) as string
  }
  catch {
    return trimmed.slice(1, -1)
  }
}
