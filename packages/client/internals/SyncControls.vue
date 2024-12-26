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
        <div px4 pt3 ws-nowrap>
          <span op75>Slides navigation syncing for </span>
          <span font-bold text-primary>{{ isPresenter.value ? 'presenter' : 'viewer' }}</span>
        </div>
        <SelectList
          v-model="shouldSend"
          title="Send Changes"
          :items="[
            { value: true, display: 'On' },
            { value: false, display: 'Off' },
          ]"
        />
        <SelectList
          v-model="shouldReceive"
          title="Receive Changes"
          :items="[
            { value: true, display: 'On' },
            { value: false, display: 'Off' },
          ]"
        />
      </div>
    </template>
  </MenuButton>
</template>
