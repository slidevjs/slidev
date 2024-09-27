---
relates:
  - Vue's Scoped CSS: https://vuejs.org/api/sfc-css-features.html#scoped-css
  - UnoCSS directives: https://unocss.dev/transformers/directives
tags: [styling, syntax]
description: |
  Define styles for only the current slide.
---

# Slide Scope Styles

You can use the `<style>` tag in your Markdown to define styles for **only the current slide**.

```md
# This is Red

<style>
h1 {
  color: red;
}
</style>

---

# Other slides are not affected
```

The `<style>` tag in Markdown is always [scoped](https://vuejs.org/api/sfc-css-features.html#scoped-css). As a result, a selector with a child combinator (`.a > .b`) is unusable as such; see the previous link. To have global styles, check out the [customization section](/custom/directory-structure#style).

Powered by [UnoCSS](/custom/config-unocss), you can directly use nested css and [directives](https://unocss.dev/transformers/directives):

```md
# Slidev

> Hello **world**

<style>
blockquote {
  strong {
    --uno: 'text-teal-500 dark:text-teal-400';
  }
}
</style>
```
