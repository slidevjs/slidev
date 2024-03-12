<template>
    <div class="w-full absolute bottom-[75px] px-2">
        <div class="h-[1px] bg-black w-full" />
        <div class="mt-2 relative">
            <div class="top-3.0 absolute left-0 !text-[11px]">© {{ new Date().getFullYear() }} Author
            </div>
            <div class="top-3.0 absolute right-0 !text-[11px]">Footer Title - Module - Abc</div>
        </div>

    </div>
    <!-- TODO: props not getting passed -->
    <div class="absolute bottom-5 right-0 text-right text-[11px] ">
        {{ pageNumber }}
    </div>
</template>
<script setup lang="ts">
defineProps<{
    pageNumber: Number
}>()
</script>