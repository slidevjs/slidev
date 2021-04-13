<template>
  <main class="master default">
    <KeepAlive>
      <slot />
    </KeepAlive>
  </main>
</template>

<style>
.master {
  @apply px-14 py-12 text-[1.1rem];

  h1 {
    @apply text-4xl mb-4 -ml-[0.05em];
  }

  h2 {
    @apply text-3xl;
  }

  h3 {
    @apply text-sm pt-2 opacity-40 uppercase tracking-widest font-500 -ml-[0.1em];
  }

  p {
    @apply my-4;
  }

  h1 ~ p {
    @apply -mt-2 opacity-50;
  }

  p ~ h2, ul ~ h2, table ~ h2 {
    @apply mt-10;
  }

  ul {
    list-style: square;
  }

  li {
    @apply ml-1.1em pl-0.2em leading-1.8em;
  }

  blockquote {
    @apply text-sm px-2 py-1 bg-$prism-background rounded;
  }

  blockquote > * {
    @apply my-0 opacity-50;
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

  a {
    @apply border-current border-b border-dashed hover:(text-green-600 border-solid);
  }

  td, th {
    @apply p-2 py-3;
  }
}
</style>
