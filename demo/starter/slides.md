---
transition: fade
---

# Previous Page

---

# This Page

<div
  v-motion
  :initial="{ x: -200, y: -200 }"
  :enter="{ x: 0, y: 0, rotate: 0 }"
  :click-1="{ y: 30 }"
  :click-2="{ y: 70 }"
  :click-3="{ y: 95 }"
  :click-4="{ y: 125 }"
  :click-5="{ y: 0 }"
  :click-2-3="{ rotate: 90 }"
  :leave="{ x: 800, y:400 }"
  absolute left-30 top-25 w-fit
>
  ← {{ $clicks }}
</div>

<v-clicks at="+0">

- A
- B
- C
- D

</v-clicks>

<div v-click="[4, 5]" v-motion
  :initial="{ x: -50 }"
  :enter="{ x: 0 }"
  :leave="{ x: 50 }"
>
  ABC
</div>

---

# Next Page

Click once to see the icons.

<div v-click class="w-60 relative mt-6">
  <div class="relative w-40 h-40">
    <img
      v-motion
      :initial="{ x: 800, y: -100, scale: 1.5, rotate: -50 }"
      :enter="final"
      class="absolute top-0 left-0 right-0 bottom-0"
      src="https://sli.dev/logo-square.png"
      alt=""
    />
    <img
      v-motion
      :initial="{ y: 500, x: -100, scale: 2 }"
      :enter="final"
      class="absolute top-0 left-0 right-0 bottom-0"
      src="https://sli.dev/logo-circle.png"
      alt=""
    />
    <img
      v-motion
      :initial="{ x: 600, y: 400, scale: 2, rotate: 100 }"
      :enter="final"
      class="absolute top-0 left-0 right-0 bottom-0"
      src="https://sli.dev/logo-triangle.png"
      alt=""
    />
  </div>

  <div
    class="text-5xl absolute top-14 left-40 text-[#2B90B6] -z-1"
    v-motion
    :initial="{ x: -80, opacity: 0}"
    :enter="{ x: 0, opacity: 1, transition: { delay: 2000, duration: 1000 } }">
    Slidev
  </div>
</div>

<!-- vue script setup scripts can be directly used in markdown, and will only affects current page -->
<script setup lang="ts">
const final = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  transition: {
    type: 'spring',
    damping: 10,
    stiffness: 20,
    mass: 2
  }
}
</script>

<div
  v-click
  v-motion
  :initial="{ x:35, y: 40, opacity: 0}"
  :enter="{ y: 0, opacity: 1 }">

[Learn More](https://sli.dev/guide/animations.html#motion)

</div>
