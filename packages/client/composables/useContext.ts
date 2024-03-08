import { computed } from 'vue'
import { configs } from '../env'
import type { SlidevContext } from '../modules/context'
import { useNav } from '../logic/nav'

export function useContext(): SlidevContext {
  return {
    nav: useNav(),
    configs,
    themeConfigs: computed(() => configs.themeConfig),
  }
}
