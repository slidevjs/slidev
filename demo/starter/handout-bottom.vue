<script setup lang="ts">
defineProps<{ pageNumber: number }>()
// A footer layout that relies on the parent handout container for the full-width
// top rule and page number placement. Avoid absolute positioning so the
// container can reserve space and prevent overlaps.
const year = new Date().getFullYear()
// Replace these with your flavor system if needed
const company = 'Slidev'
const rightText = 'Presentation slides for developers'
</script>

<template>
  <div class="handout-footer">
    <div class="handout-row">
      <div class="left">
        © {{ year }} {{ company }}
      </div>
      <div class="right">
        {{ rightText }}
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
.right {
  white-space: nowrap;
}
</style>
