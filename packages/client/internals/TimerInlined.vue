<script setup lang="ts">
import { useTimer } from '../composables/useTimer'

const { state, timer, reset, toggle } = useTimer()
</script>

<template>
  <div
    class="group flex items-center justify-center pl-4 select-none"
    :class="{ running: 'text-green6 dark:text-green3', paused: 'text-orange6 dark:text-orange3', stopped: 'op50' }[state]"
  >
    <div class="w-22px cursor-pointer">
      <div class="i-carbon:time group-hover:hidden text-xl" />
      <div class="group-not-hover:hidden flex flex-col items-center">
        <div class="relative op-80 hover:op-100" @click="toggle">
          <div v-if="state === 'running'" class="i-carbon:pause text-lg" />
          <div v-else class="i-carbon:play" />
        </div>
        <div class="op-80 hover:op-100" @click="reset">
          <div class="i-carbon:renew" />
        </div>
      </div>
    </div>
    <div class="text-3xl px-3 my-auto font-mono">
      <template v-if="timer.h">
        <span>{{ timer.h }}</span>
        <span op50>:</span>
      </template>
      <span>{{ timer.m }}</span>
      <span op50>:</span>
      <span>{{ timer.s }}</span>
      <span class="text-base op50">.{{ timer.ms }}</span>
    </div>
  </div>
</template>
