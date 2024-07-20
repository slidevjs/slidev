import { create as createPrettierPlugin } from 'volar-service-prettier'
import prettier from 'prettier'

export function create() {
  return createPrettierPlugin(
    prettier,
    {
      documentSelector: ['yaml'],
    },
  )
}
