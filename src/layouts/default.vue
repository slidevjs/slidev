<template>
  <main class="master default">
    <slot />
  </main>
</template>

<style>
.master {
  @apply px-14 py-6 text-[1.2rem];

  h1 {
    @apply text-5xl leading-20 -ml-[0.05em];
  }

  h2 {
    @apply text-3xl mt-2 mb-4 font-500 opacity-75;
  }

  p ~ h2, ul ~ h2, table ~ h2 {
    @apply mt-10;
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
    @apply p-2 py-3;
  }
}

.master.default {
  h1 ~ p {
    @apply mb-5 -mt-2;
  }
}
</style>
