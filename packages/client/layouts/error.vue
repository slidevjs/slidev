<template>
  <div class="px-4 py-10 text-center text-red-700 dark:text-red-500 font-bold font-mono">
    {{
      __SLIDEV_HAS_SERVER__
        ? 'An error occurred on this slide. Check the terminal for more information.'
        : 'Failed to fetch this slide. Please check your network connection.'
    }}
  </div>
</template>
