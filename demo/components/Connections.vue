<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { autoResetRef } from '@vueuse/core'

const a = ref(2)
const b = ref(4)

const a2 = computed(() => a.value ** 2)
const b2 = computed(() => b.value ** 2)

const c = computed(() => a2.value + b2.value)

const a2c = autoResetRef(false, 500)
const b2c = autoResetRef(false, 500)
const cc = autoResetRef(false, 500)

watch(a, () => a2c.value = true)
watch(b, () => b2c.value = true)
watch([a2, b2], () => cc.value = true)
</script>

<template>
  <div class="relative w-100 h-100">
    <NumBox
      v-model:value="a"
      class="absolute left-10 top-10 from-green-400 to-cyan-500"
      :controls="true"
    />
    <NumBox
      v-model:value="b"
      class="absolute left-10 top-35 from-green-400 to-cyan-500"
      :controls="true"
    />
    <NumBox
      :value="a2"
      class="absolute left-40 top-10 from-blue-400 to-purple-400"
      :active="a2c"
    />
    <NumBox
      :value="b2"
      class="absolute left-40 top-35 from-blue-400 to-purple-400"
      :active="b2c"
    />
    <NumBox
      :value="c"
      class="absolute left-70 top-22.5 from-blue-400 to-purple-400"
      :active="cc"
    />
  </div>
</template>
