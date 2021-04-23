<template>
  <footer class="page-footer">
    <div class="edit">
      <EditLink />
    </div>
    <!-- <div class="updated">
      <LastUpdated />
    </div> -->
  </footer>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue'
import EditLink from './EditLink.vue'
import LastUpdated from './LastUpdated.vue'
</script>

<style scoped>
.page-footer {
  padding-top: 1rem;
  padding-bottom: 1rem;
  overflow: auto;
}

@media (min-width: 960px) {
  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.updated {
  padding-top: 4px;
}

@media (min-width: 960px) {
  .updated {
    padding-top: 0;
  }
}
</style>
