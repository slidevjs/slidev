---
outline: deep
---

# Markdown Syntax

Slides are written within **a single Markdown file** as its entry. By default, it is named `slides.md`, but you can change it by passing the file path as an argument to [the CLI commands](../builtin/cli).

Not only [the basic Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) as you usually use, Slidev also provides additional features to enhance your slides:

- Use Vue Components in Markdown
- Style with UnoCSS
- ...

## Slide Separators

Use `---` padded with a new line to separate your slides.

````md
# Title

Hello, **Slidev**!

---

# Slide 2

Use code blocks for highlighting

```ts
console.log('Hello, World!')
```

---

# Slide 3

Use UnoCSS and Vue components to style and enrich your slides

<div class="p-3">
  <Tweet id="20" />
</div>
````

## Frontmatter & Headmatter

Specify layouts and other metadata for each slide by converting the separators into [frontmatter blocks](https://jekyllrb.com/docs/front-matter/). Each frontmatter starts with a triple-dash and ends with another. Texts between them are data objects in [YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/) format. For example:

<!-- eslint-skip -->

```md
---
theme: seriph
title: Welcome to Slidev
---

# Slidev

This is the cover page.

---
layout: center
background: /background-1.png
class: text-white
---

# Page 2

This is a page with the layout `center` and a background image.

---

# Page 3

This is a default page without any additional metadata.
```

Note that the first frontmatter block is called the **headmatter** and includes the metadata for the whole slide deck. The rest are **frontmatters** for individual slides. Options you can set are described in the [Slides project configurations](/custom/#headmatter) and [Per slide configurations](/custom/#frontmatter-configures) sections.

## Embedded Styles

You can use the `<style>` tag in your Markdown directly to define styles for **only the current slide**.

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

The `<style>` tag in Markdown is always [scoped](https://vuejs.org/api/sfc-css-features.html#scoped-css). As a result, a selector with a child combinator (`.a > .b`) is unusable as such; see the previous link. To have global style, check out the [customization section](/custom/directory-structure#style).

Powered by [UnoCSS](/custom/config-unocss), you can directly use nested css and [directives](https://unocss.dev/transformers/directives):

```md
# Slidev

> Hello `world`

<style>
blockquote {
  code {
    --uno: 'text-teal-500 dark:text-teal-400';
  }
}
</style>
```

## Notes

You can also create presenter notes for each slide. They will show up in [Presenter Mode](/guide/presenter-mode) for you to reference during presentations.

The comment blocks at the end of each slide are treated as the note of the slide:

```md
---
layout: cover
---

# Page 1

This is the cover page.

<!-- This is a **note** -->

---

# Page 2

<!-- This is NOT a note because it is not at the end of the slide -->

The second page

<!--
This is another note
-->
```

Basic Markdown and HTML are also supported in notes and will be rendered.

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

<!--

# Prettier Support
# Static Assets
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
# Slots
# Import Code Snippets
# LaTeX
## Inline
## Block
## Chemical equations
# LaTex line highlighting
# Diagrams
# MDC Syntax

-->
