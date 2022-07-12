<template>
  <div class="theme">
    <h1>404</h1>
    <blockquote>{{ getMsg() }}</blockquote>
    <a :href="site.base" aria-label="go to home">Take me home.</a>
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress';

const {site} = useData()
const msgs = [
  'There\'s nothing here.',
  'How did we get here?',
  'That\'s a Four-Oh-Four.',
  'Looks like we\'ve got some broken links.',
]

function getMsg() {
  return msgs[Math.floor(Math.random() * msgs.length)]
}
</script>
