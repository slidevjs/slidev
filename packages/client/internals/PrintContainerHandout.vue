<script setup lang="ts">
import { parseRangeString } from '@slidev/parser/core'
import { useNav } from '../composables/useNav'
import PrintHandout from './PrintHandout.vue'

const { slides, currentRoute } = useNav()

// In print mode, the routes will never change. So we don't need reactivity here.
let routes = slides.value
if (currentRoute.value.query.range) {
    const r = parseRangeString(routes.length, currentRoute.value.query.range as string)
    routes = r.map(i => routes[i - 1])
}
</script>

<template>
    <div id="print-container">
        <div id="print-content">
            <PrintHandout v-for="(route, index) of routes" :key="route.path" :route="route" :index="index" />
            <div class="break-after-page h-130" />
        </div>
        <slot name="controls" />
    </div>
</template>

<style lang="postcss">
#print-content {
    @apply bg-main;
}

.print-slide-container {
    @apply relative overflow-hidden break-after-page translate-0;
}
</style>
