import type { VirtualModuleTemplate } from './types'
import { isString } from '@antfu/utils'
import { getSlideTitle, sharedMd } from '../commands/shared'

export const templateConfigs: VirtualModuleTemplate = {
  id: '/@slidev/configs',
  getContent({ data, remote }) {
    const config = {
      ...data.config,
      remote,
      slidesTitle: getSlideTitle(data),
    }

    if (isString(config.info))
      config.info = sharedMd.render(config.info)

    return `export default ${JSON.stringify(config)}`
  },
}
