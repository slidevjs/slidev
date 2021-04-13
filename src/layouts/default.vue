<template>
  <main class="master default">
    <KeepAlive>
      <slot />
    </KeepAlive>
  </main>
</template>

<style>
.master {
  @apply px-14 py-12 text-[1.2rem];

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

  *:not(pre) > code {
    font-size: 0.9em;
    @apply font-light bg-gray-400 bg-opacity-15 px-1.5 py-0.5 rounded opacity-75;
  }
}

.master.default {
  h1 ~ p {
    @apply mb-5 -mt-2;
  }
}
</style>
