import { defineConfig } from 'vite-plugin-windicss'

// fool VS Code extension that the classes are valid
export default defineConfig({
  shortcuts: {
    'bg-main': '',
    'abs-tl': '',
    'abs-tr': '',
    'abs-b': '',
    'abs-bl': '',
    'abs-br': '',
  },
})
