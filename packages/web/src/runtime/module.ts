// Ported from https://github.com/vuejs/repl/blob/main/src/output/moduleCompiler.ts

import MagicString from 'magic-string'
import { babelParse, extractIdentifiers, isInDestructureAssignment, isStaticProperty, walk, walkIdentifiers } from 'vue/compiler-sfc'
import type { ExportSpecifier, Identifier, Node } from '@babel/types'
import { basename, dirname, resolve } from 'pathe'
import * as vueModule from 'vue'

const importKey = `__import__`
const exportKey = `__export__`
const moduleKey = `__module__`

export const moduleLoaders: Record<string, () => Promise<any>> = Object.create(null)
moduleLoaders.vue = async () => vueModule
moduleLoaders['@slidev/client/context.ts'] = async () => import('@slidev/client/context')

// Similar to `Function`, but async
const AsyncFunction: any = async function () {}.constructor

export function evalJs(src: string, filepath: string): () => Promise<any> {
  delete moduleLoaders[filepath]

  const filedir = dirname(filepath)
  const filename = basename(filepath)
  const { code } = processModule(src, filename)
  const fn = new AsyncFunction(importKey, exportKey, code)
  let loaded: any
  return moduleLoaders[filepath] = () => loaded ??= fn(
    async (specifier: string) => {
      // TODO: assets

      // File
      if ('./'.includes(specifier[0])) {
        const path = resolve(filedir, specifier)
        const possibleFiles = [
          path,
          `${path}.ts`,
          `${path}.js`,
          path.replace(/.ts$/, '.js'),
          path.replace(/.js$/, '.ts'),
        ]
        for (const path of possibleFiles) {
          if (moduleLoaders[path]) {
            return moduleLoaders[path]()
          }
        }
      }

      // Special module
      if (moduleLoaders[specifier]) {
        return moduleLoaders[specifier]()
      }

      throw new Error(`Failed to resolve module: ${specifier}`)
    },
    (mod: any, key: string, get: () => any) => {
      Object.defineProperty(mod, key, {
        enumerable: true,
        configurable: true,
        get,
      })
    },
  )
}

function processModule(src: string, filename: string) {
  const s = new MagicString(src)

  const ast = babelParse(src, {
    sourceFilename: filename,
    sourceType: 'module',
  }).program.body

  const idToImportMap = new Map<string, string>()
  const declaredConst = new Set<string>()
  const importedFiles = new Set<string>()
  const importToIdMap = new Map<string, string>()

  function defineImport(node: Node, source: string) {
    if (importedFiles.has(source)) {
      return importToIdMap.get(source)!
    }
    importedFiles.add(source)
    const id = `__import_${importedFiles.size}__`
    importToIdMap.set(source, id)
    s.appendLeft(
      node.start!,
      `const ${id} = await ${importKey}(${JSON.stringify(source)})\n`,
    )
    return id
  }

  function defineExport(name: string, local = name) {
    s.append(`\n${exportKey}(${moduleKey}, "${name}", () => ${local})`)
  }

  // 0. instantiate module
  s.prepend(
    `const ${moduleKey} = { [Symbol.toStringTag]: "Module" }\n\n`,
  )

  // 1. check all import statements and record id -> importName map
  for (const node of ast) {
    // import foo from 'foo' --> foo -> __import_foo__.default
    // import { baz } from 'foo' --> baz -> __import_foo__.baz
    // import * as ok from 'foo' --> ok -> __import_foo__
    if (node.type === 'ImportDeclaration') {
      const importId = defineImport(node, node.source.value)
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          idToImportMap.set(
            spec.local.name,
              `${importId}.${(spec.imported as Identifier).name}`,
          )
        }
        else if (spec.type === 'ImportDefaultSpecifier') {
          idToImportMap.set(spec.local.name, `${importId}.default`)
        }
        else {
          // namespace specifier
          idToImportMap.set(spec.local.name, importId)
        }
      }
      s.remove(node.start!, node.end!)
    }
  }

  // 2. check all export statements and define exports
  for (const node of ast) {
    // named exports
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (
          node.declaration.type === 'FunctionDeclaration'
          || node.declaration.type === 'ClassDeclaration'
        ) {
          // export function foo() {}
          defineExport(node.declaration.id!.name)
        }
        else if (node.declaration.type === 'VariableDeclaration') {
          // export const foo = 1, bar = 2
          for (const decl of node.declaration.declarations) {
            for (const id of extractIdentifiers(decl.id)) {
              defineExport(id.name)
            }
          }
        }
        s.remove(node.start!, node.declaration.start!)
      }
      else if (node.source) {
        // export { foo, bar } from './foo'
        const importId = defineImport(node, node.source.value)
        for (const spec of node.specifiers) {
          defineExport(
            (spec.exported as Identifier).name,
            `${importId}.${(spec as ExportSpecifier).local.name}`,
          )
        }
        s.remove(node.start!, node.end!)
      }
      else {
        // export { foo, bar }
        for (const spec of node.specifiers) {
          const local = (spec as ExportSpecifier).local.name
          const binding = idToImportMap.get(local)
          defineExport((spec.exported as Identifier).name, binding || local)
        }
        s.remove(node.start!, node.end!)
      }
    }

    // default export
    if (node.type === 'ExportDefaultDeclaration') {
      if ('id' in node.declaration && node.declaration.id) {
        // named hoistable/class exports
        // export default function foo() {}
        // export default class A {}
        const { name } = node.declaration.id
        s.remove(node.start!, node.start! + 15)
        s.append(`\n${exportKey}(${moduleKey}, "default", () => ${name})`)
      }
      else {
        // anonymous default exports
        s.overwrite(node.start!, node.start! + 14, `${moduleKey}.default =`)
      }
    }

    // export * from './foo'
    if (node.type === 'ExportAllDeclaration') {
      const importId = defineImport(node, node.source.value)
      s.remove(node.start!, node.end!)
      s.append(`\nfor (const key in ${importId}) {
        if (key !== 'default') {
          ${exportKey}(${moduleKey}, key, () => ${importId}[key])
        }
      }`)
    }
  }

  // 3. convert references to import bindings
  for (const node of ast) {
    if (node.type === 'ImportDeclaration')
      continue
    walkIdentifiers(node, (id, parent, parentStack) => {
      const binding = idToImportMap.get(id.name)
      if (!binding) {
        return
      }
      if (parent && isStaticProperty(parent) && parent.shorthand) {
        // let binding used in a property shorthand
        // { foo } -> { foo: __import_x__.foo }
        // skip for destructure patterns
        if (
          !(parent as any).inPattern
          || isInDestructureAssignment(parent, parentStack)
        ) {
          s.appendLeft(id.end!, `: ${binding}`)
        }
      }
      else if (
        parent
        && parent.type === 'ClassDeclaration'
        && id === parent.superClass
      ) {
        if (!declaredConst.has(id.name)) {
          declaredConst.add(id.name)
          // locate the top-most node containing the class declaration
          const topNode = parentStack[1]
          s.prependRight(topNode.start!, `const ${id.name} = ${binding};\n`)
        }
      }
      else {
        s.overwrite(id.start!, id.end!, binding)
      }
    })
  }

  // 4. convert dynamic imports
  let hasDynamicImport = false
  walk(ast, {
    enter(node: Node, parent: Node) {
      if (node.type === 'Import' && parent.type === 'CallExpression') {
        const arg = parent.arguments[0]
        if (arg.type === 'StringLiteral' && arg.value.startsWith('./')) {
          hasDynamicImport = true
          s.overwrite(node.start!, node.start! + 6, importKey)
          s.overwrite(
            arg.start!,
            arg.end!,
            JSON.stringify(arg.value.replace(/^\.\/+/, 'src/')),
          )
        }
      }
    },
  })

  // 5. return the module
  s.append(`\n\nreturn ${moduleKey}`)

  return {
    code: s.toString(),
    importedFiles,
    hasDynamicImport,
  }
}
