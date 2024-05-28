import { isString } from '@antfu/utils'
import { getSlideTitle } from '../commands/shared'
import type { VirtualModuleTemplate } from './types'

export const templateConfigs: VirtualModuleTemplate = {
  id: '/@slidev/configs',
  getContent: async ({ data, remote }, { md }) => {
    const config = {
      ...data.config,
      remote,
      slidesTitle: getSlideTitle(data),
    }

    if (isString(config.info))
      config.info = md.render(config.info)

    return `export default ${JSON.stringify(config)}`
  },
}
