<script setup lang="ts">
import { computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { makeId } from '../logic/utils'
import { useSlideContext } from '../context'

const props = defineProps({
  fade: Number,
  start: Number,
  end: Number,
  size: Number,
  index: String,
})

const { $clicksContext: clicks } = useSlideContext()
const clickInfo = clicks.calculateSince(props.start as number, props.size)

const id = makeId()
const show = computed(() => !(clicks.current < (props.start as number) || clicks.current > (props.end as number)))

onMounted(() => {
  watchEffect((onCleanup) => {
    if (!clicks)
      return

    const id = makeId()
    onCleanup(() => clicks.unregister(id))
  })
  clicks.register(id, clickInfo)
})

onUnmounted(() => {
  clicks?.unregister(id)
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="show" :index="props.index" class="v-switch-content"
      :style="{ transition: `opacity ${props.fade}ms ease`, position: !show ? 'relative' : 'absolute' }"
    >
      <slot />
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave {
  opacity: 1;
}
</style>
