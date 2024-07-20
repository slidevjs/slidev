# Slide Layout

Layouts in Slidev are used to define the structure for each slides. They are Vue components that wrap the content of the slides.

## Using Layouts {#use}

To use a layout, you can specify it in the frontmatter of the slide:

```md
---
layout: quote
---

A quote from someone
```

By default, the layout of the first slide is `cover`, and the rest are `default`.

The layouts are loaded in the following order, and the last one loaded will override the previous ones:

1. default layouts. See [Built-in Layouts](../builtin/layouts).
2. layouts provided by the theme
3. layouts provided by the addons
4. custom layouts in the `layouts` directory

<SeeAlso :links="[
  'features/slot-sugar',
]" />

## Writing Layouts {#write}

<LinkCard link="guide/write-layout" />
