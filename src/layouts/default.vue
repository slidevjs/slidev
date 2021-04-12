<template>
  <main class="master default">
    <slot />
  </main>
</template>

<style>
.master {
  @apply px-30 py-12 text-5xl;

  h1 {
    @apply text-8xl leading-40 -ml-[0.05em];
  }

  h2 {
    @apply text-6xl mt-4 mb-6 font-500 opacity-75;
  }

  p ~ h2, ul ~ h2, table ~ h2 {
    @apply mt-15;
  }

  ul {
    list-style: square;
  }

  li {
    @apply ml-1em pl-0.5em leading-1.8em;
  }

  table {
    @apply w-full;
  }

  tr {
    @apply border-b border-gray-400;
  }

  th {
    @apply text-left font-600;
  }

  td, th {
    @apply p-4 py-6;
  }
}

.master.default {
  h1 ~ p {
    @apply mb-10 -mt-4;
  }
}
</style>
