import { createSharedComposable } from '@vueuse/core'
import { computed, reactive } from 'vue'
import { configs, isTrusted } from '../env'
import { useNav } from './useNav'

export const useFeatures = createSharedComposable(() => {
  const { isPresenter, isEmbedded } = useNav()

  const showDrawings = computed(() => __SLIDEV_FEATURE_DRAWINGS__ && !isEmbedded.value && isTrusted.value)
  const allowToDraw = computed(() => __SLIDEV_FEATURE_DRAWINGS__ && !isEmbedded.value && isTrusted.value && (!configs.drawings.presenterOnly || isPresenter.value))
  const allowToEdit = computed(() => __SLIDEV_FEATURE_EDITOR__ && isTrusted.value)
  const enterPresenter = computed(() => __SLIDEV_FEATURE_PRESENTER__ && !isPresenter.value && isTrusted.value)

  return reactive({
    showDrawings,
    allowToDraw,
    allowToEdit,
    enterPresenter,
  })
})
