<template>
  <div
    class="layout-master cover text-white text-center"
    style="
      background-image: linear-gradient(#0005, #0008), url('https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2167&q=80');
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
    "
  >
    <div class="my-auto w-full">
      <slot />
    </div>
  </div>
</template>
