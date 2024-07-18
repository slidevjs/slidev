import type { Plugin } from 'vite'
import { templateImportContextUtils, templateInitContext, templateInjectionMarker } from './common'

/**
 * Inject `$slidev` into the script block of a Vue component
 */
export function createContextInjectionPlugin(): Plugin {
  return {
    name: 'slidev:context-injection',
    async transform(code, id) {
      if (!id.endsWith('.vue') || id.includes('/@slidev/client/') || id.includes('/packages/client/'))
        return
      if (code.includes(templateInjectionMarker) || code.includes('useSlideContext()'))
        return code // Assume that the context is already imported and used
      const imports = [
        templateImportContextUtils,
        templateInitContext,
        templateInjectionMarker,
      ]
      // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
      const matchScript = code.match(/<script((?!setup).)*(setup)?.*>/)
      if (matchScript && matchScript[2]) {
        // setup script
        return code.replace(/(<script.*>)/g, `$1\n${imports.join('\n')}\n`)
      }
      else if (matchScript && !matchScript[2]) {
        // not a setup script
        const matchExport = code.match(/export\s+default\s+\{/)
        if (matchExport) {
          // script exports a component
          const exportIndex = (matchExport.index || 0) + matchExport[0].length
          let component = code.slice(exportIndex)
          component = component.slice(0, component.indexOf('</script>'))

          const scriptIndex = (matchScript.index || 0) + matchScript[0].length
          const provideImport = '\nimport { injectionSlidevContext } from "@slidev/client/constants.ts"\n'
          code = `${code.slice(0, scriptIndex)}${provideImport}${code.slice(scriptIndex)}`

          let injectIndex = exportIndex + provideImport.length
          let injectObject = '$slidev: { from: injectionSlidevContext },'
          const matchInject = component.match(/.*inject\s*:\s*([[{])/)
          if (matchInject) {
            // component has a inject option
            injectIndex += (matchInject.index || 0) + matchInject[0].length
            if (matchInject[1] === '[') {
              // inject option in array
              let injects = component.slice((matchInject.index || 0) + matchInject[0].length)
              const injectEndIndex = injects.indexOf(']')
              injects = injects.slice(0, injectEndIndex)
              injectObject += injects.split(',').map(inject => `${inject}: {from: ${inject}}`).join(',')
              return `${code.slice(0, injectIndex - 1)}{\n${injectObject}\n}${code.slice(injectIndex + injectEndIndex + 1)}`
            }
            else {
              // inject option in object
              return `${code.slice(0, injectIndex)}\n${injectObject}\n${code.slice(injectIndex)}`
            }
          }
          // add inject option
          return `${code.slice(0, injectIndex)}\ninject: { ${injectObject} },\n${code.slice(injectIndex)}`
        }
      }
      // no setup script and not a vue component
      return `<script setup>\n${imports.join('\n')}\n</script>\n${code}`
    },
  }
}
