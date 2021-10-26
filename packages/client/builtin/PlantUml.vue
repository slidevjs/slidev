<template>
  <img :alt="content" :src="uri" />
</template>

<script>

import { encode } from 'plantuml-encoder'

export default {
  props: {
    content: String,
    server: {
      type: String,
      default: 'https://www.plantuml.com/plantuml',
    },
  },
  computed: {
    uri() {
      return `${this.server}/svg/${encode(this.content)}`
    },
  },
}
</script>
