import { Plugin, resolvePackageData } from 'vite'
import base64 from 'js-base64'
import { isTruthy } from '@antfu/utils'

export function createMonacoLoader(): Plugin {
  return {
    name: 'slidev:monaco-types-loader',

    resolveId(id) {
      if (id.startsWith('/@monaco-types/'))
        return id
      return null
    },

    load(id) {
      const match = id.match(/^\/\@monaco-types\/(.*)$/)
      if (match) {
        const pkg = match[1]
        const info = resolvePackageData(pkg, process.cwd())
        if (!info)
          return

        const typePath = info.data.types || info.data.typings
        if (!typePath)
          return ''

        return [
          'import * as monaco from \'monaco-editor\'',
          `import Type from "${info.dir}/${typePath}?raw"`,
          ...Object.keys(info.data.dependencies || {}).map(i => `import "/@monaco-types/${i}"`),
          `monaco.languages.typescript.typescriptDefaults.addExtraLib(\`declare module "${pkg}" { \$\{Type\} }\`)`,
        ].join('\n')
      }
    },
  }
}

export function transformMarkdownMonaco(md: string) {
  const typeModules = new Set<string>()

  // transform monaco
  md = md.replace(/\n```(\w+?){monaco([\w:,-]*)}[\s\n]*([\s\S]+?)\n```/mg, (full, lang = 'ts', options: string, code: string) => {
    options = options || ''
    lang = lang.trim()
    if (lang === 'ts' || lang === 'typescript') {
      Array.from(code.matchAll(/\s+from\s+(["'])([\/\w@-]+)\1/g))
        .map(i => i[2])
        .filter(isTruthy)
        .map(i => typeModules.add(i))
    }
    const encoded = base64.encode(code, true)
    return `<Monaco :code="'${encoded}'" lang="${lang}" :readonly="${options.includes('readonly')}" />`
  })

  // types auto discovery for TypeScript monaco
  if (typeModules.size)
    md += `\n<script setup>\n${Array.from(typeModules).map(i => `import('/@monaco-types/${i}')`).join('\n')}\n</script>\n`

  return md
}

export function truncateMancoMark(code: string) {
  return code.replace(/{monaco.*?}/g, '')
}
