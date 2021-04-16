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
    class="w-16 h-16 rounded-xl shadow flex text-white"
    style="background-image: radial-gradient(farthest-corner at 0 0, var(--tw-gradient-from) 30%, var(--tw-gradient-to))"
  >
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
    <div
      class="absolute w-full h-full rounded-xl ring ring-red-400 opacity-0 transition duration-1000 pointer-events-none"
      :class="active ? '!opacity-100 !duration-100' : ''"
    ></div>
  </div>
</template>
