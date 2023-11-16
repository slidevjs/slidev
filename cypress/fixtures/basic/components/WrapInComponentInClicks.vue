<template>
  <v-clicks>
    <ol style="border: 1px solid green">
      <li>Point a</li>
      <decorate-with-li>
        <slot />
      </decorate-with-li>
      <li>Point z</li>
    </ol>
  </v-clicks>
</template>
