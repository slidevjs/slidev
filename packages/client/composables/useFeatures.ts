import { createSharedComposable } from '@vueuse/core'
import { computed, reactive } from 'vue'
import { configs } from '../env'
import { useRouteQuery } from '../logic/route'
import { useNav } from './useNav'

function satisfiesMode(mode: boolean | string) {
  return mode === true || mode === __MODE__
}

export const staticFeatures = {
  record: satisfiesMode(configs.record),
  presenter: satisfiesMode(configs.presenter),
  contextMenu: configs.contextMenu === true || configs.contextMenu === undefined || configs.contextMenu === __MODE__,
}

export const useFeatures = createSharedComposable(() => {
  const { isPresenter, isEmbedded } = useNav()

  const password = useRouteQuery<string>('password')
  const trusted = computed(() => !configs.remote || password.value === configs.remote)

  const drawings = computed(() => satisfiesMode(configs.drawings.enabled) && !isEmbedded.value)
  const allowToDraw = computed(() => drawings.value && trusted.value && (!configs.drawings.presenterOnly || isPresenter.value) && !isEmbedded.value)
  const editor = computed(() => configs.editor && trusted.value && __MODE__ === 'dev')
  const enterPresenter = computed(() => staticFeatures.presenter && !isPresenter.value && trusted.value)

  return reactive({
    ...staticFeatures,
    drawings,
    allowToDraw,
    editor,
    enterPresenter,
  })
})
