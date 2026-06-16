/**
 * Standalone HTML Bundler for Slidev
 *
 * This module transforms Vite's multi-file ES module output into a single
 * self-contained HTML file that works under file:// protocol.
 *
 * Key transformations:
 * - ES modules → CommonJS with custom loader
 * - Dynamic imports → Promise.resolve(__require())
 * - export {X as default} → module.exports.default=module.exports=X
 * - All JavaScript and CSS inlined
 *
 * @see https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/docs/STANDALONE_BUNDLE_FIX.md
 */

import fs from 'node:fs/promises'
import path from 'node:path'

interface ModuleInfo {
  code: string
  size: number
}

/**
 * Recursively load all JavaScript modules from the build output
 */
async function loadModulesRecursive(
  dir: string,
  modules: Map<string, ModuleInfo>,
  prefix = '.',
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = `${prefix}/${entry.name}`

    if (entry.isDirectory()) {
      await loadModulesRecursive(fullPath, modules, relativePath)
    }
    else if (entry.name.endsWith('.js')) {
      const code = await fs.readFile(fullPath, 'utf-8')
      modules.set(relativePath, { code, size: code.length })
    }
  }
}

/**
 * Transform ES module code to CommonJS
 *
 * Critical fix: export {X as default} must generate BOTH:
 * - module.exports.default = X
 * - module.exports = X
 * This ensures Vue's defineAsyncComponent works correctly
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

  // Remove Vite's modulepreload polyfill (not needed in standalone)
  code = code.replace(
    /\(function\(\)\{let e=document\.createElement\(`link`\)\.relList[\s\S]*?fetch\(e\.href,n\)\}\}\)\(\);?/,
    '',
  )

  // Simplify Vite's preload function to just resolve
  const pFunctionStart = ',P=function(e,t,n){'
  const pStartIdx = code.indexOf(pFunctionStart)

  if (pStartIdx !== -1) {
    const searchFrom = pStartIdx + pFunctionStart.length
    const nextVarMatch = code.substring(searchFrom).match(/\},([A-Z][a-z]*=)/)

    if (nextVarMatch) {
      const pEndIdx = searchFrom + nextVarMatch.index + 1
      const before = code.substring(0, pStartIdx)
      const after = code.substring(pEndIdx)
      code = `${before},P=function(e,t,n){return Promise.resolve().then(e)}${after}`
    }
  }

  return code
}

/**
 * Create standalone HTML bundle
 */
export async function createStandaloneBundle(
  buildDir: string,
  outputPath: string,
): Promise<void> {
  // Load all modules
  const modules = new Map<string, ModuleInfo>()
  await loadModulesRecursive(path.join(buildDir, 'assets'), modules)

  // Find entry module
  const entryModule = Array.from(modules.keys()).find(
    p => p.includes('/index-') && !p.includes('modules/'),
  )

  if (!entryModule) {
    throw new Error('[Slidev Standalone] Entry module not found')
  }

  // Transform modules to CommonJS
  const moduleCodeObject: Record<string, string> = {}
  for (const [modulePath, { code }] of modules.entries()) {
    let transformed = transformToCommonJS(code, modulePath)

    // Expose Xt array globally for entry module
    if (modulePath === entryModule) {
      transformed = transformed.replace(/([,;])Xt=Array\((\d+)\)/g, '$1Xt=window.Xt=Array($2)')
    }

    moduleCodeObject[modulePath] = transformed
  }

  // Serialize module code
  let moduleCodeJSON = JSON.stringify(moduleCodeObject)
  moduleCodeJSON = moduleCodeJSON.replace(/<\/script>/gi, '<\\/script>')

  // Build module system
  const moduleSystem = `
(function() {
  "use strict";

  // CSS preload stub (CSS is inlined)
  window.__cssModules = new Set();
  window.__cssPreload = function(href) {
    return Promise.resolve();
  };

  // URL constructor polyfill for empty base
  var _origURL = window.URL;
  window.URL = function(url, base) {
    if (!base || base === "") {
      base = window.location.href;
    }
    return new _origURL(url, base);
  };
  window.URL.prototype = _origURL.prototype;
  window.URL.createObjectURL = _origURL.createObjectURL;
  window.URL.revokeObjectURL = _origURL.revokeObjectURL;

  // localStorage/sessionStorage safe wrapper for file:// protocol
  (function() {
    var _memStorage = {};
    var _useMem = false;
    var origLS = window.localStorage;
    var safeLS = {
      getItem: function(key) {
        if (_useMem) return _memStorage[key] || null;
        try { return origLS.getItem(key); }
        catch(e) { _useMem = true; return _memStorage[key] || null; }
      },
      setItem: function(key, value) {
        if (_useMem) { _memStorage[key] = String(value); return; }
        try { origLS.setItem(key, value); }
        catch(e) { _useMem = true; _memStorage[key] = String(value); }
      },
      removeItem: function(key) {
        if (_useMem) { delete _memStorage[key]; return; }
        try { origLS.removeItem(key); }
        catch(e) { _useMem = true; delete _memStorage[key]; }
      },
      clear: function() {
        if (_useMem) { _memStorage = {}; return; }
        try { origLS.clear(); }
        catch(e) { _useMem = true; _memStorage = {}; }
      },
      key: function(i) {
        if (_useMem) return Object.keys(_memStorage)[i] || null;
        try { return origLS.key(i); }
        catch(e) { _useMem = true; return Object.keys(_memStorage)[i] || null; }
      },
      get length() {
        if (_useMem) return Object.keys(_memStorage).length;
        try { return origLS.length; }
        catch(e) { _useMem = true; return Object.keys(_memStorage).length; }
      }
    };
    try {
      Object.defineProperty(window, "localStorage", {
        get: function() { return safeLS; },
        configurable: true
      });
    } catch(e) {}
  })();

  // Module code and cache
  var __moduleCode = ${moduleCodeJSON};
  var __moduleCache = {};

  // Custom require function
  window.__require = function(modulePath) {
    var resolved = modulePath;
    if (!resolved.startsWith("./")) {
      resolved = "./" + resolved;
    }
    if (__moduleCache[resolved]) {
      return __moduleCache[resolved];
    }
    if (!__moduleCode[resolved]) {
      console.error("[Module Loader] Module not found:", resolved);
      throw new Error("Cannot find module: " + resolved);
    }
    var module = { exports: {} };
    var exports = module.exports;
    try {
      var moduleDir = resolved.substring(0, resolved.lastIndexOf("/"));
      var boundRequire = function(requestPath) {
        if (requestPath.startsWith("./") || requestPath.startsWith("../")) {
          var parts = (moduleDir + "/" + requestPath).split("/");
          var resolvedParts = [];
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part === "..") {
              resolvedParts.pop();
            } else if (part !== "." && part !== "") {
              resolvedParts.push(part);
            }
          }
          return window.__require("./" + resolvedParts.join("/"));
        }
        return window.__require(requestPath);
      };
      var moduleFunction = new Function(
        "__require",
        "module",
        "exports",
        "require",
        __moduleCode[resolved]
      );
      moduleFunction(boundRequire, module, exports, boundRequire);

      __moduleCache[resolved] = module.exports;
      return module.exports;
    }
    catch (error) {
      console.error("[Module Loader] Error loading:", resolved, error);
      throw error;
    }
  };

  // Vite stubs
  window.__vite__mapDeps = function() { return []; };
  window.__vitePreload = function(loader) {
    return Promise.resolve().then(function() {
      var result = typeof loader === "function" ? loader() : loader;
      return result;
    }).then(function(module) {
      return module;
    });
  };
  if (typeof window.P === "undefined") {
    window.P = window.__vitePreload;
  }

  // Bootstrap entry module
  window.__require("${entryModule}");
})();`

  // Load HTML
  let html = await fs.readFile(path.join(buildDir, 'index.html'), 'utf-8')

  // Remove external script/link tags
  html = html.replace(
    /<script[^>]*\bsrc\s*=\s*["']\.\/assets\/[^"']+["'][^>]*><\/script>/g,
    '',
  )
  html = html.replace(/<link[^>]*\brel\s*=\s*["']modulepreload["'][^>]*>/g, '')

  // Inline CSS from <link> tags
  const cssMatches = [...html.matchAll(/<link[^>]*href="\.\/([^"]+\.css)"[^>]*>/g)]
  for (const match of cssMatches) {
    const cssPath = match[1]
    try {
      const css = await fs.readFile(path.join(buildDir, cssPath), 'utf-8')
      html = html.replace(match[0], `<style>\n${css}\n</style>`)
    }
    catch (error) {
      console.warn(`[Slidev Standalone] Failed to inline CSS: ${cssPath}`)
    }
  }

  // Inline CSS referenced in modules
  const cssFilesInModules = new Set<string>()
  for (const [, { code }] of modules.entries()) {
    const cssRefs = code.match(/["']\.\/([\w/-]+\.css)["']/g)
    if (cssRefs) {
      for (const ref of cssRefs) {
        const cssFile = ref.slice(2, -1) // Remove quotes and ./
        cssFilesInModules.add(cssFile)
      }
    }
  }

  let inlinedCssStyles = ''
  for (const cssFile of cssFilesInModules) {
    try {
      const cssPath = path.join(buildDir, 'assets', cssFile)
      const css = await fs.readFile(cssPath, 'utf-8')
      inlinedCssStyles += `\n/* ${cssFile} */\n${css}\n`
    }
    catch (error) {
      console.warn(`[Slidev Standalone] Failed to inline referenced CSS: ${cssFile}`)
    }
  }

  if (inlinedCssStyles) {
    html = html.replace('</head>', `<style>${inlinedCssStyles}</style>\n</head>`)
  }

  // Add bundle marker
  html = html.replace(
    '<head>',
    '<head>\n  <meta name="slidev-bundle-mode" content="single-file-inline">',
  )

  // Inject module system (escape $ for String.replace)
  const initScript = `\n<script type="text/javascript">\n${moduleSystem}\n\n(function() {\n  try {\n    console.log("[Slidev Standalone] Loading presentation...");\n    var entryExports = window.__require("${entryModule}");\n    console.log("[Slidev Standalone] Presentation loaded successfully");\n  } catch (error) {\n    console.error("[Slidev Standalone] Failed:", error);\n    document.body.innerHTML =\n      "<div style=\\"padding:2rem;font-family:monospace;color:#ff0000;\\">" +\n      "<h2>Failed to load Slidev presentation</h2>" +\n      "<p><strong>Error:</strong> " + error.message + "</p>" +\n      "<pre>" + error.stack + "</pre>" +\n      "<p>Check browser console for details.</p>" +\n      "</div>";\n  }\n})();\n</script>\n`

  const escapedInitScript = initScript.replace(/\$/g, '$$$$')
  html = html.replace('</body>', `${escapedInitScript}\n</body>`)

  // Write output
  await fs.writeFile(outputPath, html, 'utf-8')

  const stats = await fs.stat(outputPath)
  console.log(`\n✅ [Slidev] Created standalone bundle: ${outputPath}`)
  console.log(`📦 [Slidev] Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
}
