<script setup lang="ts">
import { ref } from 'vue'

const timeout = ref(false)
setTimeout(() => {
  timeout.value = true
}, 200)
</script>

<template>
  <div class="slide-loading">
    <template v-if="timeout">
      <div class="lds-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
      <div>Slide is loading...</div>
    </template>
  </div>
</template>

<style>
.slide-loading {
  font-weight: 600;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 66vh;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 32px;
  height: 32px;
  margin: 4px;
  border: 4px solid;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--slidev-theme-primary) transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
