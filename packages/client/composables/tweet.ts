import { createSharedComposable, useScriptTag } from '@vueuse/core'
import type { ComponentInternalInstance } from 'vue'
import { onMounted } from 'vue'

export const useTweet = createSharedComposable(
  (vm: ComponentInternalInstance, create: () => void) =>
    useScriptTag(
      'https://platform.twitter.com/widgets.js',
      () => {
        if (vm.isMounted)
          create()
        else
          onMounted(create, vm)
      },
      { async: true },
    ),
)
