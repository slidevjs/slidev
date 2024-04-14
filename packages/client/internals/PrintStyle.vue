<script setup lang="ts">
defineProps<{
  pageWidth: number
  pageHeight: number
}>()
</script>

<style>
@page {
  size: v-bind('`${pageWidth}px`') v-bind('`${pageHeight}px`');
  margin: 0;
}
</style>
