<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { autoResetRef } from '@vueuse/core'

const a = ref(2)
const b = ref(4)

const a2 = computed(() => a.value ** 2)
const b2 = computed(() => b.value ** 2)

const c = computed(() => a2.value + b2.value)

const a2c = autoResetRef(false, 100)
const b2c = autoResetRef(false, 100)
const cc = autoResetRef(false, 100)

watch(a, () => a2c.value = true)
watch(b, () => b2c.value = true)
watch([a2, b2], () => cc.value = true)
</script>

<template>
  <div>
    <div class="px-6 pt-4 text-xl">
      <b>𝒛=𝒙²+𝒚²</b>={{ a }}x{{ a }}+{{ b }}x{{ b }}={{ c }}
    </div>
    <div class="relative w-100 h-100">
      <NumBox
        v-model:value="a"
        label="𝒙"
        class="absolute left-5 top-5 from-green-400 to-cyan-500"
        :controls="true"
      />
      <NumBox
        v-model:value="b"
        label="𝒚"
        class="absolute left-5 top-30 from-green-400 to-cyan-500"
        :controls="true"
      />
      <NumBox
        :value="a2"
        label="𝒙²"
        class="absolute left-35 top-5 from-blue-400 to-purple-400"
        :active="a2c"
      />
      <NumBox
        :value="b2"
        label="𝒚²"
        class="absolute left-35 top-30 from-blue-400 to-purple-400"
        :active="b2c"
      />
      <NumBox
        :value="c"
        label="𝒛"
        class="absolute left-65 top-17.5 from-blue-400 to-purple-400"
        :active="cc"
      />
      <!--Line1-->
      <svg
        class="absolute left-20 top-10 -z-1"
        width="62"
        height="1"
        viewBox="0 0 62 1"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="-3.75678e-10"
          y1="0.5"
          x2="62"
          y2="0.5"
          stroke="#888888"
          stroke-dasharray="5 2"
        />
      </svg>
      <!--Line2-->
      <svg
        class="absolute left-20 top-40 -z-1"
        width="62"
        height="1"
        viewBox="0 0 62 1"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="-3.75678e-10"
          y1="0.5"
          x2="62"
          y2="0.5"
          stroke="#888888"
          stroke-dasharray="5 2"
        />
      </svg>
      <!--Arc1-->
      <svg
        class="absolute left-50 top-10 -z-1"
        width="62"
        height="61"
        viewBox="0 0 62 61"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0.5C27.5 0.5 39.5 59 61.5 60" stroke="#888888" stroke-dasharray="5 2" />
      </svg>
      <!--Arc2-->
      <svg
        class="absolute left-50 top-25 -z-1"
        width="62"
        height="61"
        viewBox="0 0 62 61"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 60.5C27.5 60.5 39.5 2 61.5 1" stroke="#888888" stroke-dasharray="5 2" />
      </svg>
    </div>
  </div>
</template>
