<script setup lang="ts">
import { defineProps, defineEmit } from 'vue'
import { useVModel } from '@vueuse/core'

const emit = defineEmit()
const props = defineProps<{
  value: number
  active?: boolean
  controls?: boolean
}>()

const value = useVModel(props, 'value', emit)
</script>

<template>
  <div
    class="w-16 h-16 rounded-xl shadow text-white overflow-hidden"
    style="background-image: radial-gradient(farthest-corner at 0 0, var(--tw-gradient-from) 30%, var(--tw-gradient-to))"
  >
    <div
      style="background-image: radial-gradient(farthest-corner at 0 0, var(--tw-gradient-from) 30%, var(--tw-gradient-to))"
      class="absolute w-full h-full from-orange-400 to-red-400 opacity-0 transition duration-600 ease-out pointer-events-none"
      :class="active ? '!opacity-100 !duration-20' : ''"
    ></div>
    <div class="absolute w-full h-full flex z-10">
      <div class="m-auto text-2xl leading-0.8em" :class="controls ? 'pl-2' : ''">
        {{ value }}
      </div>
      <div v-if="controls" class="grid grid-rows-2 text-xl">
        <mdi:menu-up-outline
          class="mt-auto opacity-50 hover:opacity-100 pr-1 cursor-pointer"
          @click="value += 1"
        />
        <mdi:menu-down-outline
          class="opacity-50 hover:opacity-100 pr-1 cursor-pointer"
          @click="value -= 1"
        />
      </div>
    </div>
  </div>
</template>
