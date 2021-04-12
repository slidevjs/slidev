import { Plugin, resolvePackageData } from 'vite'

export function createMonacoLoader(): Plugin {
  return {
    name: 'monaco-types-loader',

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

        if (!info.data.types)
          return ''

        return [
          'import * as monaco from \'monaco-editor\'',
          `import Type from "${info.dir}/${info.data.types}?raw"`,
          ...Object.keys(info.data.dependencies || {}).map(i => `import "/@monaco-types/${i}"`),
          `monaco.languages.typescript.typescriptDefaults.addExtraLib(\`declare module "${pkg}" { \$\{Type\} }\`)`,
        ].join('\n')
      }
    },
  }
}
