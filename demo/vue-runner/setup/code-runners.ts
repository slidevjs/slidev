/* eslint-disable no-new-func */
import { defineCodeRunnersSetup } from '@slidev/types'

export default defineCodeRunnersSetup(() => {
  return {
    // Support Vue SFC
    async vue(code) {
      const Vue = await import('vue')
      const { parse, compileScript } = await import('@vue/compiler-sfc')

      // Compile the script, note this demo does not handle Vue styles
      const sfc = parse(code)
      let scripts = compileScript(sfc.descriptor, {
        id: sfc.descriptor.filename,
        genDefaultAs: '__Component',
        inlineTemplate: true,
      }).content

      // Replace Vue imports to object destructuring
      // Only for simple demo, it doesn't work with imports from other packages
      scripts = scripts.replace(/import (\{[^}]+\}) from ['"]vue['"]/g, (_, imports) => `const ${imports.replace(/\sas\s/g, ':')} = Vue`)
      scripts += '\nreturn __Component'

      // Create function to evaluate the script and get the component
      // Note this is not sandboxed, it's NOT secure.
      const component = new Function(`return (Vue) => {${scripts}}`)()(Vue)

      // Mount the component
      const app = Vue.createApp(component)
      const el = document.createElement('div')
      app.mount(el)

      return {
        element: el,
      }
    },
  }
})
