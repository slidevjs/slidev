import { Plugin, resolvePackageData } from 'vite'
import base64 from 'js-base64'

export function createMonacoLoader(): Plugin {
  return {
    name: 'vite-slides:monaco-types-loader',

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

export function transformMarkdownMonaco(code: string) {
  // transform monaco
  code = code.replace(/\n```(\w+?){monaco([\w:,-]*)}[\s\n]*([\s\S]+?)\n```/mg, (full, lang = 'ts', options: string, code: string) => {
    options = options || ''
    code = base64.encode(code, true)
    return `<Monaco :code="'${code}'" :lang="'${lang}'" :readonly="${options.includes('readonly')}" />`
  })

  return code
}
