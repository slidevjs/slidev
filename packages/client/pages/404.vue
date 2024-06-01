<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNav } from '../composables/useNav'

const { currentRoute } = useRouter()
const { total } = useNav()

const guessedSlide = computed(() => {
  const path = currentRoute.value.path
  const match = path.match(/\d+/)
  if (match) {
    const slideNo = +match[0]
    if (slideNo > 0 && slideNo <= total.value)
      return slideNo
  }
  return null
})
</script>

<template>
  <div class="grid justify-center pt-15%">
    <div>
      <h1 class="text-9xl font-bold">
        404
      </h1>
      <p class="text-2xl">
        Page not found<code class="op-70">:{{ currentRoute.path }}</code>
      </p>
      <div class="mt-3 flex flex-col gap-2">
        <RouterLink v-if="guessedSlide !== 1" to="/" class="page-link">
          Go Home
        </RouterLink>
        <RouterLink v-if="guessedSlide" :to="`/${guessedSlide}`" class="page-link">
          Go to Slide {{ guessedSlide }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.page-link {
  @apply py-2 px-4 bg-gray/10 hover:bg-gray/20 rounded;
}
</style>
