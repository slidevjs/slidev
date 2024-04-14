<script setup lang="ts">
import { slideHeight, slideWidth } from '../env'

defineProps<{
  pageWidth?: number
  pageHeight?: number
}>()
</script>

<style>
@page {
  size: v-bind('`${pageWidth ?? slideWidth}px`')
    v-bind('`${pageHeight ?? slideHeight}px`');
  margin: 0;
}
</style>
