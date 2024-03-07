<template>
  <div class="demo-editor">
    <slot />
  </div>
</template>

<style lang="postcss">
.demo-editor {
  font-size: 1em;
  line-height: 1.2em;
  min-height: 450px;
  margin-top: 25px;
  padding: 10px;
  border-radius: 7px;
  position: relative;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 30px 1px rgba(0, 0, 0, 0.15);
}
.dark .demo-editor {
  @apply bg-[#161618] border border-gray-400 border-opacity-10;
}
.demo-editor::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 10px;
  width: 12px;
  height: 12px;
  background: #f95c5b;
  border-radius: 100%;
  box-shadow:
    0 0 0 1px #da3d42,
    22px 0 0 0 #fabe3b,
    22px 0 0 1px #ecb03e,
    44px 0 0 0 #38cd46,
    44px 0 0 1px #2eae32;
}
</style>
