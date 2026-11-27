<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePresenterDriver } from '../composables/usePresenterDriver'
import IconButton from './IconButton.vue'
import MenuButton from './MenuButton.vue'

const {
  acceptRequest: acceptPendingRequest,
  activeDriver,
  claim,
  driverRequest,
  hasPendingRequest,
  isActiveDriver,
  localName,
  request,
} = usePresenterDriver()

const menuOpen = ref(false)

const title = computed(() => {
  if (isActiveDriver.value && hasPendingRequest.value)
    return `${driverRequest.value!.name} requested control of the synced deck.`
  if (isActiveDriver.value)
    return 'You are controlling the synced deck'
  if (activeDriver.value?.name)
    return `${activeDriver.value.name} is controlling the synced deck.`
  return 'No active presenter driver.'
})

const status = computed(() => {
  if (isActiveDriver.value)
    return 'You are driving'
  if (activeDriver.value?.name)
    return `${activeDriver.value.name} is driving`
  return 'No active driver'
})

function requestControl() {
  request()
  menuOpen.value = false
}

function takeControl() {
  claim()
  menuOpen.value = false
}

function acceptRequest() {
  acceptPendingRequest()
  menuOpen.value = false
}
</script>

<template>
  <MenuButton v-model="menuOpen">
    <template #button="{ value }">
      <IconButton
        :title="title"
        :active="value || isActiveDriver"
      >
        <div
          class="i-carbon:user-speaker"
          :class="isActiveDriver ? 'text-green6 dark:text-green' : 'op40'"
        />
        <div
          v-if="hasPendingRequest"
          class="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber"
        />
      </IconButton>
    </template>
    <template #menu>
      <div text-sm flex="~ col gap-2" min-w-48 px3>
        <div ws-nowrap>
          <div text-xs op60>
            Presenter driver
          </div>
          <div font-bold>
            {{ status }}
          </div>
        </div>
        <div class="h-1px opacity-10 bg-current w-full" />
        <div v-if="localName" text-xs op60 ws-nowrap>
          This presenter: {{ localName }}
        </div>
        <div v-if="isActiveDriver && hasPendingRequest" flex="~ col gap-1">
          <div text-xs op75 ws-nowrap>
            {{ driverRequest?.name }} requested control
          </div>
          <button
            class="text-left px2 py1 rounded hover:bg-active"
            @click="acceptRequest"
          >
            Accept request
          </button>
        </div>
        <template v-else-if="!isActiveDriver">
          <button
            v-if="activeDriver"
            class="text-left px2 py1 rounded hover:bg-active"
            @click="requestControl"
          >
            Request control
          </button>
          <button
            class="text-left px2 py1 rounded hover:bg-active"
            @click="takeControl"
          >
            Take control now
          </button>
        </template>
      </div>
    </template>
  </MenuButton>
</template>
