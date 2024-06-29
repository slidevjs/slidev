---
outline: deep
---

# Markdown Syntax

Slides are written within **a single markdown file** (by default `./slides.md`).

You can use [the Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) as you normally would, with the additional support of inlined HTML and Vue Components. Styling using [UnoCSS](/custom/config-unocss) is also supported. Use `---` padded with a new line to separate your slides.

````md
# Slidev

Hello, World!

---

# Page 2

Directly use code blocks for highlighting

```ts
console.log('Hello, World!')
```

---

# Page 3

You can directly use Windi CSS and Vue components to style and enrich your slides.

<div class="p-3">
  <Tweet id="20" />
</div>
````

## Frontmatter & Layouts

Specify layouts and other metadata for each slide by converting the separators into [frontmatter blocks](https://jekyllrb.com/docs/front-matter/). Each frontmatter starts with a triple-dash and ends with another. Texts between them are data objects in [YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/) format. For example:

<!-- eslint-skip -->

```md
---
layout: cover
---

# Slidev

This is the cover page.

---
layout: center
background: /background-1.png
class: 'text-white'
---

# Page 2

This is a page with the layout `center` and a background image.

---

# Page 3

This is a default page without any additional metadata.
```

Refer to [customization](/custom/) for more details.

# Slidev

This is the cover page.

---

```yaml
# The first yaml block will be treated as the frontmatter of that slide
layout: center
background: /background-1.png
class: 'text-white'
```

# Page 2

This is a page with the layout `center` and a background image.
````

## Code Blocks

One big reason that led to the creation of Slidev was the need to perfectly display code in slides. Consequently, you can use Markdown-flavored code blocks to highlight your code.

````md
```ts
console.log('Hello, World!')
```
````

Slidev has [Shiki](https://github.com/shikijs/shiki) built in as the syntax highlighter. Refer to [the highlighters section](/custom/highlighters) for more details.

## Embedded Styles

You can use `<style>` tag in your Markdown directly to override styles for the **current slide**.

```md
# This is Red

<style>
h1 {
  color: red;
}
</style>

---

# Next slide is not affected
```

The `<style>` tag in Markdown is always [scoped](https://vuejs.org/api/sfc-css-features.html#scoped-css). As a result, a selector with a child combinator (`.a > .b`) is unusable as such; see the previous link. To have global style overrides, check out the [customization section](/custom/directory-structure#style).

Powered by [UnoCSS](/custom/config-unocss), you can directly use nested css and [directives](https://unocss.dev/transformers/directives) (e.g. `--uno:` or `@apply`)

```md
# Slidev

> Hello `world`

<style>
blockquote {
  code {
    --uno: text-teal-500 dark:text-teal-400;
  }
}
</style>
```

## Static Assets

Just like you would do in markdown, you can use images pointing to a remote or local URL.

For remote assets, the built-in [`vite-plugin-remote-assets`](https://github.com/antfu/vite-plugin-remote-assets) will cache them onto the disk at first run, ensuring instant loading even for large images later on.

```md
![Remote Image](https://sli.dev/favicon.png)
```

For local assets, put them into the [`public` folder](/custom/directory-structure.html#public) and reference them with a **leading slash** (i.e., `/pic.png`, NOT `./pic.png`, which is relative to the working file).

```md
![Local Image](/pic.png)
```

If you want to apply custom sizes or styles, you can convert them to the `<img>` tag:

```html
<img src="/pic.png" class="m-40 h-40 rounded shadow" />
```

## Notes

You can also create presenter notes for each slide. They will show up in [Presenter Mode](/guide/presenter-mode) for you to reference during presentations.

In Markdown, the last comment block in each slide will be treated as a note.

```md
---
layout: cover
---

# Page 1

This is the cover page.

<!-- This is a note -->

---

# Page 2

<!-- This is NOT a note because it precedes the content of the slide -->

The second page

<!--
This is another note
-->
```

Basic Markdown and HTML are also supported in notes when the Presenter renders note content.

## Slots

> Available since v0.18

Some layouts can provide multiple contributing points using [Vue's named slots](https://v3.vuejs.org/guide/component-slots.html).

For example, in [`two-cols` layout](https://github.com/slidevjs/slidev/blob/main/packages/client/layouts/two-cols.vue), you can have two columns left (`default` slot) and right (`right` slot) side by side.

```md
---
layout: two-cols
---

<template v-slot:default>

# Left

This shows on the left

</template>
<template v-slot:right>

# Right

This shows on the right

</template>
```

<div class="grid grid-cols-2 rounded border border-gray-400 border-opacity-50 px-10 pb-4">
<div>
<h3>Left</h3>
<p>This shows on the left</p>
</div>
<div>
<h3>Right</h3>
<p>This shows on the right</p>
</div>
</div>

We also provide a shorthand syntactical sugar `::name::` for slot name. The following works exactly the same as the previous example.

```md
---
layout: two-cols
---

# Left

This shows on the left

::right::

# Right

This shows on the right
```

You can also explicitly specify the default slot and provide in the custom order.

```md
---
layout: two-cols
---

::right::

# Right

This shows on the right

::default::

# Left

This shows on the left
```

## Configurations

All configurations can be defined in the Markdown file. For example:

```md
---
theme: seriph
layout: cover
background: 'https://source.unsplash.com/1600x900/?nature,water'
---

# Slidev

This is the cover page.
```

Learn more about [frontmatter configurations](/custom/#frontmatter-configures).

## Multiple Entries

> Available since v0.15

You can split your `slides.md` into multiple files and organize them however you'd like.

`slides.md` :

<!-- eslint-skip -->

```md
# Page 1

This is a normal page

---
src: ./subpage2.md
---

<!-- this page will be loaded from './subpage2.md' -->
Inline content will be ignored
```

`subpage2.md` :

```md
# Page 2

This page is from another file
```

### Frontmatter Merging

You can provide frontmatter instructions from both your main entry and external markdown pages. If there are duplicate keys in them, the ones from the **main entry have the higher priority**. For example:

`slides.md` :

```md
---
src: ./cover.md
background: https://sli.dev/bar.png
class: text-center
---
```

`cover.md` :

```md
---
layout: cover
background: https://sli.dev/foo.png
---

# Cover

Cover Page
```

They will end up being equivalent to the following page:

```md
---
layout: cover
background: https://sli.dev/bar.png
class: text-center
---

# Cover

Cover Page
```

### Page Reuse

With the multi-entries support, reusing pages could be straightforward. For example:

```yaml
---
src: ./cover.md
---

---
src: ./intro.md
---

---
src: ./content.md
---

---
# reuse
src: ./content.md
---
```

## MDC Syntax

> Available since v0.43.0

Slidev supports optional [MDC (Markdown Components) Syntax](https://content.nuxtjs.org/guide/writing/mdc) powered by [`markdown-it-mdc`](https://github.com/antfu/markdown-it-mdc).

You can enable it by adding `mdc: true` to the frontmatter of your markdown file.

```mdc
---
mdc: true
---

This is a [red text]{style="color:red"} :inline-component{prop="value"}

![](/image.png){width=500px lazy}

::block-component{prop="value"}
The **default** slot
::
```

Learn more about [MDC Syntax](https://content.nuxt.com/guide/writing/mdc).

---

# Prettier Support
# Line Highlighting
# Line Numbers
# TwoSlash Integration
# Shiki Magic Move
# Monaco Editor
# Monaco Diff Editor
# Monaco Runner
# Writable Monaco Editor
# Click Markers
# Icons
# Styling Icons
# Import Code Snippets
# LaTeX
<!-- # Inline -->
<!-- # Block -->
<!-- # Chemical equations -->
# LaTex line highlighting
# Diagrams
