# Writing Layouts

> Please read <LinkInline link="guide/layout" /> first.

To create a custom layout, simply create a new Vue file in the `layouts` directory:

```bash
your-slidev/
  ├── ...
  ├── slides.md
  └── layouts/
      ├── ...
      └── MyLayout.vue
```

Layouts are Vue components, so you can use all the features of Vue in them.

In the layout component, use `<slot/>` (the default slot) for the slide content:

```vue
<!-- default.vue -->
<template>
  <div class="slidev-layout default">
    <slot />
  </div>
</template>
```

You can also have [named slots](https://vuejs.org/guide/components/slots.html) for more complex layouts:

```vue
<!-- split.vue -->
<template>
  <div class="slidev-layout split">
    <div class="left">
      <slot name="left" />
    </div>
    <div class="right">
      <slot name="right" />
    </div>
  </div>
</template>
```

And then use it with <LinkInline link="features/slot-sugar" />.
