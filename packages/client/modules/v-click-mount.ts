import type { ClicksInfo, RawAtValue } from '@slidev/types'
import type { PropType, VNode } from 'vue'
import { injectLocal } from '@vueuse/core'
import { cloneVNode, Comment, computed, defineComponent, Fragment, h, isVNode, nextTick, onMounted, onUnmounted, shallowRef, Text, Transition } from 'vue'
import {
  CLASS_VCLICK_ANIMATION_PREFIX,
  CLASS_VCLICK_CURRENT,
  CLASS_VCLICK_HIDDEN,
  CLASS_VCLICK_PRIOR,
  CLASS_VCLICK_TARGET,
  injectionClicksContext,
  injectionFrontmatter,
} from '../constants'
import { configs } from '../env'
import { makeId } from '../logic/utils'

const RE_WHITESPACE_OR_COMMA = /[\s,]+/

function flattenChildren(children: unknown): VNode[] {
  const result: VNode[] = []
  for (const child of Array.isArray(children)
    ? children
    : [children]) {
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child))
    }
    else if (isVNode(child)) {
      if (child.type === Fragment)
        result.push(...flattenChildren(child.children))
      else if (child.type !== Comment)
        result.push(child)
    }
    else if (child != null && typeof child !== 'boolean') {
      result.push(h(Text, String(child)))
    }
  }
  return result
}

/**
 * Renders its slot only while its click is shown, so the content is mounted
 * on the click and unmounted when it's hidden again.
 *
 * Each element is mounted with the `slidev-vclick-hidden` class (`opacity: 0`, plus the
 * animation preset) and the class is removed on the next frame, so it animates in the same
 * way as with the plain `v-click` directive. When it's hidden again, the content is unmounted
 * on the click, and its element is kept with the class added back until the transition has finished.
 *
 * Used by `<v-click mount>`, `<v-after mount>` and the `.mount` modifier of the click directives.
 *
 * @internal
 */
export const VClickMount = defineComponent({
  name: 'VClickMount',
  props: {
    at: {
      type: [Number, String, Array, Boolean] as PropType<RawAtValue>,
      default: '+1',
    },
    hide: {
      type: Boolean,
      default: false,
    },
    /**
     * Animation presets, e.g. `"fade up"`. Defaults to the `clickAnimation` frontmatter / config.
     */
    animation: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    wrapText: {
      type: Function as PropType<(text: VNode) => VNode>,
      default: (text: VNode) => h('span', text),
    },
  },
  setup(props, { slots }) {
    const clicks = injectLocal(injectionClicksContext, undefined)?.value
    const frontmatter = injectLocal(injectionFrontmatter, undefined)
    const id = makeId()

    // `undefined` until the click is registered, `null` when there is no click to wait for
    const info = shallowRef<ClicksInfo | null | undefined>(undefined)
    // The content that is already shown when the slide is rendered isn't animated,
    // the same as the plain `v-click` directive.
    const animate = shallowRef(false)

    // Register in `onMounted`, which runs in the same order as the `mounted` hook
    // of the `v-click` directive, so relative values (`'+1'`) resolve the same way.
    onMounted(() => {
      if (!clicks) {
        info.value = null
        return
      }
      const resolved = clicks.calculate(props.at)
      clicks.register(id, resolved)
      info.value = resolved
      nextTick(() => {
        animate.value = true
      })
    })

    onUnmounted(() => {
      clicks?.unregister(id)
    })

    const isShown = computed(() => {
      const resolved = info.value
      if (resolved === undefined)
        return false
      if (resolved === null)
        return true
      return props.hide
        ? !resolved.isActive.value
        : resolved.isActive.value
    })

    const animationClasses = computed(() => {
      let animations: string[]
      if (props.animation != null) {
        animations = Array.isArray(props.animation)
          ? props.animation
          : props.animation.split(RE_WHITESPACE_OR_COMMA)
      }
      else {
        animations = (frontmatter?.clickAnimation || configs.clickAnimation || '').split(RE_WHITESPACE_OR_COMMA)
      }
      return animations.filter(Boolean).map(a => `${CLASS_VCLICK_ANIMATION_PREFIX}${a}`)
    })

    return () => {
      const shown = isShown.value
      const resolved = info.value
      const current = !!resolved && resolved.isCurrent.value
      const classes = [
        CLASS_VCLICK_TARGET,
        ...animationClasses.value,
        {
          [CLASS_VCLICK_CURRENT]: current,
          [CLASS_VCLICK_PRIOR]: !!resolved && resolved.isActive.value && !current,
        },
      ]
      // The slot is rendered even while hidden, so the transitions stay in place and
      // can animate the elements out before they are unmounted.
      // Rendering the slot only creates vnodes, nothing is mounted until it's shown.
      const children = flattenChildren(slots.default?.())
      // One transition per element, so each of them is animated on its own,
      // like the plain `v-click` directive does on every element.
      return h(Fragment, children.map((child, idx) => h(
        Transition,
        {
          key: child.key ?? `__vclick_mount_${idx}`,
          css: animate.value,
          enterFromClass: CLASS_VCLICK_HIDDEN,
          enterActiveClass: '',
          enterToClass: '',
          leaveFromClass: '',
          leaveActiveClass: '',
          leaveToClass: CLASS_VCLICK_HIDDEN,
        },
        () => shown
          ? cloneVNode(child.type === Text
              ? props.wrapText(child)
              : child, { class: classes })
          : null,
      )))
    }
  },
})
