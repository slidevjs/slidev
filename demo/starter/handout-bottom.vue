<script setup lang="ts">
defineProps<{ pageNumber: number }>()
// A footer layout that relies on the parent handout container for the full-width
// top rule and page number placement. Avoid absolute positioning so the
// container can reserve space and prevent overlaps.
const year = new Date().getFullYear()
// Replace these with your flavor system if needed
const company = 'Slidev'
const rightText = 'Professional courses for developers'
const series = 'Engineering Enablement Series'
</script>

<template>
  <div class="handout-footer">
    <div class="handout-row">
      <div class="left">
        © {{ year }} {{ company }}
      </div>
      <div class="center">
        Page {{ pageNumber }}
      </div>
      <div class="right">
        <span class="block font-semibold uppercase tracking-wide text-xs text-gray-500">
          {{ series }}
        </span>
        <span>{{ rightText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.handout-footer {
  width: 100%;
}
.handout-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 11px;
  line-height: 1.2;
  padding-top: 3mm; /* space below the rule drawn by container */
}
.left,
.center,
.right {
  white-space: nowrap;
}
.center {
  font-variant-numeric: tabular-nums;
  color: rgba(0, 0, 0, 0.7);
}
.right {
  text-align: right;
}
</style>
