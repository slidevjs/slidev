import { onScopeDispose } from '@vue/runtime-core'
import { window } from 'vscode'
import { createSingletonComposable } from '../utils/singletonComposable'

export const useLogger = createSingletonComposable(() => {
  const outputChannel = window.createOutputChannel('Slidev')

  onScopeDispose(() => outputChannel.dispose())

  const createLogger = (type: string) => (message: string) => {
    const date = new Date()
    const year = String(date.getFullYear()).padStart(4, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    const millisecond = String(date.getMilliseconds()).padStart(3, '0')
    outputChannel.appendLine(
      `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond} [${type}] ${message}`,
    )
  }

  return {
    outputChannel,
    info: createLogger('INFO'),
    warn: createLogger('WARN'),
    error: createLogger('ERROR'),
    appendLine: (message: string) => outputChannel.appendLine(message),
  }
})
