<template>
  <p v-if="hasLastUpdated" class="last-updated">
    <span class="prefix">{{ prefix }}:</span>
    <span class="datetime">{{ datetime }}</span>
  </p>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useSiteDataByRoute, usePageData } from 'vitepress'

export default defineComponent({
  setup() {
    const site = useSiteDataByRoute()
    const page = usePageData()

    const datetime = ref('')

    const hasLastUpdated = computed(() => {
      const lu = site.value.themeConfig.lastUpdated

      return lu !== undefined && lu !== false
    })

    const prefix = computed(() => {
      const p = site.value.themeConfig.lastUpdated

      return p === true ? 'Last Updated' : p
    })

    onMounted(() => {
      datetime.value = new Date(page.value.lastUpdated).toLocaleString('en-US')
    })

    return {
      hasLastUpdated,
      prefix,
      datetime,
    }
  },
})
</script>

<style scoped>
.last-updated {
  display: inline-block;
  margin: 0;
  line-height: 1.4;
  font-size: .9rem;
  color: var(--c-text-light);
}

@media (min-width: 960px) {
  .last-updated {
    font-size: 1rem;
  }
}

.prefix {
  display: inline-block;
  font-weight: 500;
}

.datetime {
  display: inline-block;
  margin-left: 6px;
  font-weight: 400;
}
</style>
