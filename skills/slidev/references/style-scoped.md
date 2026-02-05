---
name: scoped
description: Slide-scoped CSS styles
---

# Slide Scope Styles

Define CSS that applies only to the current slide.

## Usage

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

## Scoped by Default

All `<style>` tags in slides are automatically scoped.

Child combinators (`.a > .b`) don't work as expected due to scoping.

## Nested CSS with UnoCSS

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

## Global Styles

For global styles, use `styles/index.css` in your project.
