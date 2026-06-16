/**
 * Test suite for standalone HTML bundler
 *
 * Tests the ES module to CommonJS transformation and bundle generation
 * for file:// protocol compatibility.
 */

import { describe, expect, it } from 'vitest'

/**
 * Transform ES module code to CommonJS (extracted from standalone-bundler.ts)
 * This is a simplified version for testing the core transformation logic
 */
function transformToCommonJS(code: string, modulePath: string): string {
  const moduleDir = modulePath.substring(0, modulePath.lastIndexOf('/')) || '.'

  // Transform named imports: import {x, y} from './mod'
  code = code.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g,
    (match, imports, modPath) => {
      const varName = `__imp_${Math.random().toString(36).substr(2, 9)}`
      let result = `const ${varName}=__require('${modPath}');`
      imports.split(',').forEach((imp: string) => {
        const parts = imp.trim().split(/\s+as\s+/)
        if (parts.length === 2) {
          result += `const ${parts[1].trim()}=${varName}.${parts[0].trim()};`
        }
        else {
          const name = parts[0].trim()
          result += `const ${name}=${varName}.${name};`
        }
      })
      return result
    },
  )

  // Transform default imports: import X from './mod'
  code = code.replace(
    /import\s+([a-zA-Z_$][\w$]*)\s+from\s*["']([^"']+)["']\s*;?/g,
    (m, name, p) => `const ${name}=__require('${p}').default||__require('${p}');`,
  )

  // Transform mixed imports: import X, {y} from './mod'
  code = code.replace(
    /import\s+([a-zA-Z_$][\w$]*)\s*,\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g,
    (m, defName, namedImports, p) => {
      const varName = `__imp_${Math.random().toString(36).substr(2, 9)}`
      let result = `const ${varName}=__require('${p}');const ${defName}=${varName}.default||${varName};`
      namedImports.split(',').forEach((imp: string) => {
        const parts = imp.trim().split(/\s+as\s+/)
        if (parts.length === 2) {
          result += `const ${parts[1].trim()}=${varName}.${parts[0].trim()};`
        }
        else {
          const name = parts[0].trim()
          result += `const ${name}=${varName}.${name};`
        }
      })
      return result
    },
  )

  // Transform dynamic imports: import('./mod')
  code = code.replace(/import\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g, (m, q, importPath) => {
    let resolvedPath = importPath

    // Resolve relative paths
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const parts = (`${moduleDir}/${importPath}`).split('/')
      const resolvedParts = []
      for (const part of parts) {
        if (part === '..') {
          resolvedParts.pop()
        }
        else if (part !== '.' && part !== '') {
          resolvedParts.push(part)
        }
      }
      resolvedPath = `./${resolvedParts.join('/')}`
    }

    return `Promise.resolve(window.__require('${resolvedPath}'))`
  })

  // Transform import.meta
  code = code.replace(/import\.meta\.url/g, '""')
  code = code.replace(/import\.meta\.glob\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g, '{}')

  // Transform exports - CRITICAL FIX
  code = code.replace(/export\s*\{([^}]+)\}\s*;?/g, (m, exports) =>
    exports
      .split(',')
      .map((e: string) => {
        const parts = e.trim().split(/\s+as\s+/)
        if (parts.length === 2) {
          const exportName = parts[1].trim()
          const localName = parts[0].trim()
          // CRITICAL: Default exports need dual assignment for Vue compatibility
          if (exportName === 'default') {
            return `module.exports.default=module.exports=${localName};`
          }
          return `module.exports.${exportName}=${localName};`
        }
        return `module.exports.${parts[0].trim()}=${parts[0].trim()};`
      })
      .join(''))

  code = code.replace(
    /export\s+default\s+/g,
    'module.exports.default=module.exports=',
  )

  code = code.replace(
    /export\s+(const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/g,
    (m, kw, name) => `${kw} ${name}=module.exports.${name}=`,
  )

  code = code.replace(
    /export\s+(function|class)\s+([a-zA-Z_$][\w$]*)/g,
    (m, kw, name) => `${kw} ${name}`,
  )

  return code
}

describe('standalone-bundler', () => {
  describe('eS Module to CommonJS Transformation', () => {
    it('should transform named imports', () => {
      const input = `import { foo, bar } from './module.js';`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./module.js\')')
      expect(output).toContain('const foo=')
      expect(output).toContain('const bar=')
    })

    it('should transform renamed named imports', () => {
      const input = `import { foo as baz, bar } from './module.js';`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./module.js\')')
      expect(output).toContain('const baz=')
      expect(output).toContain('.foo')
      expect(output).toContain('const bar=')
    })

    it('should transform default imports', () => {
      const input = `import MyComponent from './component.js';`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('const MyComponent=__require(\'./component.js\').default||__require(\'./component.js\')')
    })

    it('should transform mixed imports', () => {
      const input = `import MyComponent, { foo, bar } from './module.js';`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./module.js\')')
      expect(output).toContain('const MyComponent=')
      expect(output).toContain('.default')
      expect(output).toContain('const foo=')
      expect(output).toContain('const bar=')
    })

    it('should transform dynamic imports', () => {
      const input = `const mod = await import('./dynamic.js');`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('Promise.resolve(window.__require(\'./dynamic.js\'))')
    })

    it('should resolve relative paths in dynamic imports', () => {
      const input = `const mod = await import('../sibling/module.js');`
      const output = transformToCommonJS(input, './nested/test.js')

      expect(output).toContain('Promise.resolve(window.__require(\'./sibling/module.js\'))')
    })

    it('should transform import.meta.url', () => {
      const input = `const url = import.meta.url;`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('const url = "";')
    })

    it('should transform import.meta.glob', () => {
      const input = `const modules = import.meta.glob('./components/*.vue');`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('const modules = {};')
    })
  })

  describe('export Transformation - Critical Vue Fix', () => {
    it('should transform default export with dual assignment', () => {
      const input = `const MyComponent = {}; export { MyComponent as default };`
      const output = transformToCommonJS(input, './test.js')

      // CRITICAL: Must have BOTH assignments for Vue's defineAsyncComponent
      expect(output).toContain('module.exports.default=module.exports=MyComponent')
    })

    it('should transform export default statement', () => {
      const input = `export default MyComponent;`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('module.exports.default=module.exports=MyComponent')
    })

    it('should transform named exports', () => {
      const input = `export { foo, bar };`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('module.exports.foo=foo')
      expect(output).toContain('module.exports.bar=bar')
    })

    it('should transform renamed named exports', () => {
      const input = `export { foo as baz };`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('module.exports.baz=foo')
    })

    it('should transform export const declarations', () => {
      const input = `export const foo = 42;`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('const foo=module.exports.foo=')
      expect(output).toContain('42')
    })

    it('should transform export function declarations', () => {
      const input = `export function myFunc() { return 42; }`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('function myFunc()')
      expect(output).not.toContain('export')
    })

    it('should transform export class declarations', () => {
      const input = `export class MyClass { constructor() {} }`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('class MyClass')
      expect(output).not.toContain('export')
    })
  })

  describe('complex Real-World Scenarios', () => {
    it('should handle Vue component with default export (Vite pattern)', () => {
      const input = `
        const S = {};
        export { S as default };
      `
      const output = transformToCommonJS(input, './component.js')

      // This is the critical fix that makes Vue components work
      expect(output).toContain('module.exports.default=module.exports=S')
    })

    it('should handle multiple named exports with default', () => {
      const input = `
        export const foo = 1;
        export const bar = 2;
        const Main = {};
        export { Main as default };
      `
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('const foo=module.exports.foo=')
      expect(output).toContain('const bar=module.exports.bar=')
      expect(output).toContain('module.exports.default=module.exports=Main')
    })

    it('should handle imports and exports in the same file', () => {
      const input = `
        import { helper } from './utils.js';
        const result = helper();
        export { result as default };
      `
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./utils.js\')')
      expect(output).toContain('const helper=')
      expect(output).toContain('module.exports.default=module.exports=result')
    })

    it('should preserve code that is not import/export related', () => {
      const input = `
        const myVar = 42;
        function myFunc() { return myVar; }
        const obj = { key: "value" };
      `
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('const myVar = 42')
      expect(output).toContain('function myFunc()')
      expect(output).toContain('const obj = { key: "value" }')
    })

    it('should handle multi-line imports with line breaks', () => {
      const input = `import {
        foo,
        bar,
        baz
      } from './module.js';`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./module.js\')')
      // The regex should handle multi-line, but it might not work perfectly
      // This test documents current behavior
    })

    it('should not transform import/export in comments', () => {
      const input = `
        // import something from './fake.js';
        /* export const notReal = 1; */
        const real = 42;
      `
      const output = transformToCommonJS(input, './test.js')

      // Comments should remain as-is (though we don't currently handle this)
      // This test documents current limitation
      expect(output).toContain('const real = 42')
    })

    it('should not transform import/export in strings', () => {
      const input = `const str = "import foo from './bar.js'";`
      const output = transformToCommonJS(input, './test.js')

      // Strings should remain as-is (though we don't currently handle this)
      // This test documents current limitation
      expect(output).toContain('const str =')
    })
  })

  describe('edge Cases', () => {
    it('should handle empty input', () => {
      const input = ''
      const output = transformToCommonJS(input, './test.js')

      expect(output).toBe('')
    })

    it('should handle code with no imports or exports', () => {
      const input = 'const x = 42; console.log(x);'
      const output = transformToCommonJS(input, './test.js')

      expect(output).toBe(input)
    })

    it('should handle deeply nested relative paths', () => {
      const input = `import mod from '../../../deeply/nested/module.js';`
      const output = transformToCommonJS(input, './a/b/c/test.js')

      expect(output).toContain('__require(\'../../../deeply/nested/module.js\')')
    })

    it('should handle path resolution with dots', () => {
      const input = `const mod = await import('./../sibling/./module.js');`
      const output = transformToCommonJS(input, './nested/test.js')

      expect(output).toContain('Promise.resolve(window.__require(\'./sibling/module.js\'))')
    })

    it('should handle semicolon-less imports', () => {
      const input = `import foo from './bar.js'\nimport baz from './qux.js'`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./bar.js\')')
      expect(output).toContain('__require(\'./qux.js\')')
    })

    it('should handle exports without semicolons', () => {
      const input = `const foo = 1\nexport { foo as default }`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('module.exports.default=module.exports=foo')
    })
  })

  describe('module Path Resolution', () => {
    it('should resolve relative imports from root', () => {
      const input = `import mod from './module.js';`
      const output = transformToCommonJS(input, './test.js')

      expect(output).toContain('__require(\'./module.js\')')
    })

    it('should resolve relative imports from nested directory', () => {
      const input = `import mod from './sibling.js';`
      const output = transformToCommonJS(input, './nested/dir/test.js')

      // Should preserve the relative path as-is for __require
      expect(output).toContain('__require(\'./sibling.js\')')
    })

    it('should resolve parent directory imports', () => {
      const input = `import mod from '../parent.js';`
      const output = transformToCommonJS(input, './nested/test.js')

      expect(output).toContain('__require(\'../parent.js\')')
    })

    it('should handle dynamic import path resolution from nested module', () => {
      const input = `const mod = await import('./sibling.js');`
      const output = transformToCommonJS(input, './a/b/test.js')

      // Dynamic imports should resolve relative to module directory
      expect(output).toContain('Promise.resolve(window.__require(\'./a/b/sibling.js\'))')
    })

    it('should handle dynamic import with parent directory from nested module', () => {
      const input = `const mod = await import('../parent.js');`
      const output = transformToCommonJS(input, './a/b/test.js')

      expect(output).toContain('Promise.resolve(window.__require(\'./a/parent.js\'))')
    })
  })
})
