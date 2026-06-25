import type { ComputedRef } from 'vue'
import { computed, reactive } from 'vue'
import { patch, sharedState } from '../state/shared'

interface LocalPresenterDriver {
  id: string
  name: string
  type: 'presenter' | 'viewer'
}

export interface PresenterDriver {
  id: string
  name: string
  time: number
}

export interface PresenterDriverRequest {
  id: string
  name: string
  time: number
}

const localDriver = reactive<LocalPresenterDriver>({
  id: '',
  name: '',
  type: 'viewer',
})

function getPresenterName(id: string) {
  const hashQuery = location.hash.includes('?')
    ? location.hash.slice(location.hash.indexOf('?') + 1)
    : ''
  const query = new URLSearchParams(hashQuery)
  new URLSearchParams(location.search).forEach((value, key) => query.set(key, value))
  return query.get('driver') || query.get('presenter') || `Presenter ${id.slice(-4)}`
}

export function setPresenterDriverIdentity(id: string, type: 'presenter' | 'viewer') {
  localDriver.id = id
  localDriver.type = type
  localDriver.name = getPresenterName(id)
}

export function claimPresenterDriver() {
  if (localDriver.type !== 'presenter' || !localDriver.id)
    return

  setActivePresenterDriver({
    id: localDriver.id,
    name: localDriver.name,
    time: Date.now(),
  })
}

export function requestPresenterDriver() {
  if (localDriver.type !== 'presenter' || !localDriver.id)
    return

  patch('driverRequest', {
    id: localDriver.id,
    name: localDriver.name,
    time: Date.now(),
  })
}

export function acceptPresenterDriverRequest() {
  const request = sharedState.driverRequest
  if (!request || localDriver.type !== 'presenter' || sharedState.activeDriver?.id !== localDriver.id)
    return

  setActivePresenterDriver({
    id: request.id,
    name: request.name,
    time: Date.now(),
  })
}

function setActivePresenterDriver(driver: PresenterDriver) {
  patch('activeDriver', {
    ...driver,
  })
  patch('driverRequest', undefined)
}

export function canDrivePresenter(): boolean {
  if (localDriver.type !== 'presenter')
    return true

  return !sharedState.activeDriver?.id || sharedState.activeDriver.id === localDriver.id
}

export function usePresenterDriver(): {
  activeDriver: ComputedRef<PresenterDriver | undefined>
  canDrive: ComputedRef<boolean>
  driverRequest: ComputedRef<PresenterDriverRequest | undefined>
  hasPendingRequest: ComputedRef<boolean>
  isActiveDriver: ComputedRef<boolean>
  localName: ComputedRef<string>
  acceptRequest: () => void
  claim: () => void
  request: () => void
} {
  const activeDriver = computed(() => sharedState.activeDriver)
  const driverRequest = computed(() => sharedState.driverRequest)
  const isActiveDriver = computed(() => !!activeDriver.value?.id && activeDriver.value.id === localDriver.id)
  const canDrive = computed(canDrivePresenter)
  const hasPendingRequest = computed(() => !!driverRequest.value?.id && driverRequest.value.id !== localDriver.id)
  const localName = computed(() => localDriver.name)

  return {
    activeDriver,
    driverRequest,
    canDrive,
    hasPendingRequest,
    isActiveDriver,
    localName,
    acceptRequest: acceptPresenterDriverRequest,
    claim: claimPresenterDriver,
    request: requestPresenterDriver,
  }
}
