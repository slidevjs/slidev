import { computed } from 'vue'
import { logicOr } from '@vueuse/math'
import { configs } from '../env'
import { router } from '../routes'
import { getSlide, slides } from './slides'

export const currentRoute = computed(() => router.currentRoute.value)

export const isPrintMode = computed(() => currentRoute.value.query.print !== undefined)
export const isPrintWithClicks = computed(() => currentRoute.value.query.print === 'clicks')
export const isEmbedded = computed(() => currentRoute.value.query.embedded !== undefined)
export const isPlaying = computed(() => currentRoute.value.name === 'play')
export const isPresenter = computed(() => currentRoute.value.name === 'presenter')
export const isNotesViewer = computed(() => currentRoute.value.name === 'notes')
export const isPresenterAvailable = computed(() => !isPresenter.value && (!configs.remote || currentRoute.value.query.password === configs.remote))

export const hasPrimarySlide = logicOr(isPlaying, isPresenter)

export const currentSlideNo = computed(() => hasPrimarySlide.value ? getSlide(currentRoute.value.params.no as string)?.no ?? 1 : 1)
export const currentSlideRoute = computed(() => slides.value[currentSlideNo.value - 1])
