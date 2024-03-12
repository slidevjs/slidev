import type { SlideRoute } from '@slidev/types'
import type { TransitionGroupProps } from 'vue'
import { configs } from '../env'

const transitionResolveMap: Record<string, string | undefined> = {
  'slide-left': 'slide-left | slide-right',
  'slide-right': 'slide-right | slide-left',
  'slide-up': 'slide-up | slide-down',
  'slide-down': 'slide-down | slide-up',
}

function resolveTransition(transition?: string | TransitionGroupProps, isBackward = false): TransitionGroupProps | undefined {
  if (!transition)
    return undefined
  if (typeof transition === 'string') {
    transition = {
      name: transition,
    }
  }

  if (!transition.name)
    return undefined

  let name = transition.name.includes('|')
    ? transition.name
    : (transitionResolveMap[transition.name] || transition.name)

  if (name.includes('|')) {
    const [forward, backward] = name.split('|').map(i => i.trim())
    name = isBackward ? backward : forward
  }

  if (!name)
    return undefined

  return {
    ...transition,
    name,
  }
}

export function getCurrentTransition(direction: number, currentRoute?: SlideRoute, prevRoute?: SlideRoute) {
  let transition = direction > 0
    ? prevRoute?.meta?.transition
    : currentRoute?.meta?.transition
  if (!transition)
    transition = configs.transition

  return resolveTransition(transition, direction < 0)
}
