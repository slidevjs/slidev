import { computed } from 'vue'
import { configs } from '../env'
import type { SlidevContext } from '../modules/context'
import * as nav from '../logic/nav'

export function useContext(): SlidevContext {
  return {
    nav: { ...nav }, // Convert the module to a plain object
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  }
}
