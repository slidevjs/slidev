import prettier from 'prettier'
import { create as createPrettierPlugin } from 'volar-service-prettier'

export function create() {
  return createPrettierPlugin(
    prettier,
    {
      documentSelector: ['yaml'],
      async getFormattingOptions(_prettier, _document, formatOptions) {
        return {
          parser: 'yaml',
          tabWidth: formatOptions.tabSize,
          useTabs: !formatOptions.insertSpaces,
        }
      },
    },
  )
}
