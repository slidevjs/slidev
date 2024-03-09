import { isString } from '@antfu/utils'
import { stringifyMarkdownTokens } from '../utils'
import type { VirtualModuleTemplate } from './types'

export const templateConfigs: VirtualModuleTemplate = {
  id: '/@slidev/configs',
  getContent: async ({ data, remote }, { md }) => {
    function getTitle() {
      if (isString(data.config.title)) {
        const tokens = md.parseInline(data.config.title, {})
        return stringifyMarkdownTokens(tokens)
      }
      return data.config.title
    }

    const config = {
      ...data.config,
      remote,
      title: getTitle(),
    }

    if (isString(config.info))
      config.info = md.render(config.info)

    return `export default ${JSON.stringify(config)}`
  },
}
