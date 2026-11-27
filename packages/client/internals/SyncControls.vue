<script setup lang="ts">
import { computed } from 'vue'
import { useNav } from '../composables/useNav'
import { syncDirections } from '../state'
import IconButton from './IconButton.vue'
import MenuButton from './MenuButton.vue'
import SelectList from './SelectList.vue'

const { isPresenter } = useNav()

const shouldReceive = computed({
  get: () => isPresenter.value
    ? syncDirections.value.presenterReceive
    : syncDirections.value.viewerReceive,
  set(v) {
    if (isPresenter.value) {
      syncDirections.value.presenterReceive = v
    }
    else {
      syncDirections.value.viewerReceive = v
    }
  },
})

const shouldSend = computed({
  get: () => isPresenter.value
    ? syncDirections.value.presenterSend
    : syncDirections.value.viewerSend,
  set(v) {
    if (isPresenter.value) {
      syncDirections.value.presenterSend = v
    }
    else {
      syncDirections.value.viewerSend = v
    }
  },
})

const state = computed({
  get: () => {
    if (shouldReceive.value && shouldSend.value) {
      return 'bidirectional'
    }
    if (shouldReceive.value && !shouldSend.value) {
      return 'receive-only'
    }
    if (!shouldReceive.value && shouldSend.value) {
      return 'send-only'
    }
    return 'off'
  },
  set(v) {
    switch (v) {
      case 'bidirectional':
        shouldReceive.value = true
        shouldSend.value = true
        break
      case 'receive-only':
        shouldReceive.value = true
        shouldSend.value = false
        break
      case 'send-only':
        shouldReceive.value = false
        shouldSend.value = true
        break
      case 'off':
        shouldReceive.value = false
        shouldSend.value = false
        break
    }
  },
})
</script>

<template>
  <MenuButton>
    <template #button>
      <IconButton title="Change sync settings">
        <div class="i-ph:arrow-up-bold mx--1.2 scale-x-80" :class="shouldSend ? 'text-green6 dark:text-green' : 'op30'" />
        <div class="i-ph:arrow-down-bold mx--1.2 scale-x-80" :class="shouldReceive ? 'text-green6 dark:text-green' : 'op30'" />
      </IconButton>
    </template>
    <template #menu>
      <div text-sm flex="~ col gap-2">
        <div px3 ws-nowrap>
          <span op75>Slides navigation syncing for </span>
          <span font-bold text-primary>{{ isPresenter ? 'presenter' : 'viewer' }}</span>
        </div>
        <div class="h-1px opacity-10 bg-current w-full" />
        <SelectList
          v-model="state"
          title="Sync Mode"
          :items="[
            { value: 'bidirectional', display: 'Bidirectional Sync' },
            { value: 'receive-only', display: 'Receive Only' },
            { value: 'send-only', display: 'Send Only' },
            { value: 'off', display: 'Disable' },
          ]"
        />
      </div>
    </template>
  </MenuButton>
</template>
