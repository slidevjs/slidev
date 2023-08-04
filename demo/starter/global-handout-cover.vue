<template>
    <div>
        <div class="break-after-page">
            <span class="font-bold text-xl border-b-4 border-r-4 px-1 py-1 border-gray-800 ">{{ shortname }}</span>

            <div class="h-58"></div>
            <div class="w-120 mx-auto font-bold flex flex-wrap gap-4">
                <h1 class="text-5xl font-bold border-b-4 border-gray-800">
                    {{ title }}
                </h1>
                {{ version }}
            </div>
            <div class="h-32"></div>
            <div class="text-2xl font-bold mx-auto w-120 text-right">{{ doctitle }}</div>
        </div>
        <div class="break-after-page mt-68 ">


            <div class="font-bold text-xl">ATTENTION</div>

            <p class="mt-4">
                The Information contained in this guide is intended for training purposes only.
            </p>

            <div class="font-bold text-xl mt-8">COPYRIGHT</div>

            <div class="flex flex-row gap-4 mt-4 align-center items-center">

             
                © <span>{{ new Date().getFullYear().toString() }}</span> All rights reserved.

            </div>

            <p class="mt-4">
                All other brands and product names are trademarks of their respective owners.</p>

        </div>

    </div>
</template>
<script setup>
import { ref } from 'vue'
const shortname = ref("SHORTNAME")
const version = ref("Version 1.0.0")
const title = ref("Course Name")
const doctitle = "Student Guide"
</script>