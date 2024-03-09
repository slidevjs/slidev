<script setup lang="ts">
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  value: number
  label?: string
  active?: boolean
  controls?: boolean
}>()

const emit = defineEmits<{
  (e: any): void
}>()
const num = useVModel(props, 'value', emit)
</script>

<template>
  <div
    class="w-16 h-16 rounded-xl text-white overflow-hidden"
    style="background-image: radial-gradient(farthest-corner at 0 0, var(--un-gradient-from) 30%, var(--un-gradient-to))"
  >
    <div
      style="background-image: radial-gradient(farthest-corner at 0 0, var(--un-gradient-from) 30%, var(--un-gradient-to))"
      class="absolute w-full h-full from-orange-400 to-red-400 opacity-0 transition duration-400 ease-in pointer-events-none"
      :class="active ? '!opacity-100 !duration-10' : ''"
    />
    <slot>
      <div class="absolute left-0 top-0 px-2 py-0.5 opacity-40">
        {{ label }}
      </div>
      <div class="absolute w-full h-full flex z-10">
        <div class="m-auto text-2xl leading-0.8em" :class="controls ? 'pl-2' : ''">
          {{ value }}
        </div>
        <div v-if="controls" class="grid grid-rows-2 text-xl">
          <mdi:menu-up-outline
            class="mt-auto opacity-50 hover:opacity-100 pr-1 cursor-pointer"
            @click="num += 1"
          />
          <mdi:menu-down-outline
            class="opacity-50 hover:opacity-100 pr-1 cursor-pointer"
            @click="num -= 1"
          />
        </div>
      </div>
    </slot>
  </div>
</template>
