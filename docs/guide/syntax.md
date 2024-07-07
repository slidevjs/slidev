---
outline: deep
---

# Basic Syntax

Slides are written within **a single Markdown file**, which is called a **Slidev Markdown**. A presentation has a Slidev Markdown as its entry, which is `./slides.md` by default, but you can change it by passing the file path as an argument to [the CLI commands](../builtin/cli).

In a Slidev Markdown, not only [the basic Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) can be used as usual, Slidev also provides additional features to enhance your slides. This section covers the most basic ones to get you started, while the rest are covered as [features](../features/).

## Slide Separators

Use `---` padded with a new line to separate your slides.

````md {5,15}
# Title

Hello, **Slidev**!

---

# Slide 2

Use code blocks for highlighting:

```ts
console.log('Hello, World!')
```

---

# Slide 3

Use UnoCSS classes and Vue components to style and enrich your slides:

<div class="p-3">
  <Tweet id="..." />
</div>
````

## Frontmatter & Headmatter

At the beginning of each slide, you can add a optional [frontmatter](https://jekyllrb.com/docs/front-matter/) to configure the slide. The first frontmatter block is called **headmatter** and can configure the whole slide deck. The rest are **frontmatters** for individual slides. Texts in the headmatter or the frontmatter should be a object in [YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/) format. For example:

<!-- eslint-skip -->

```md {1-4,10-14,26-28}
---
theme: seriph
title: Welcome to Slidev
---

# Slide 1

The frontmatter of this slide is also the headmatter

---
layout: center
background: /background-1.png
class: text-white
---

# Slide 2

A page with the layout `center` and a background image

---

# Slide 3

A page without frontmatter

---
src: ./pages/4.md  # This slide only contains a frontmatter
---

---

# Slide 5
```

Configurations you can set are described in the [Slides deck configurations](/custom/#headmatter) and [Per slide configurations](/custom/#frontmatter-configures) sections.

To make the headmatters more readable, you can installed the VSCode extension:

<LinkCard link="feature/vscode-extension" />

Also, there is another possible frontmatter format:

<LinkCard link="feature/block-frontmatter" />

## Notes

You can also create presenter notes for each slide. They will show up in [Presenter Mode](../guide/ui#presenter-mode) for you to reference during presentations.

The comment blocks at the end of each slide are treated as the note of the slide:

```md {9,19-21}
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
This is _another_ note
-->
```

Basic Markdown and HTML are also supported in notes and will be rendered.

## Multiple Entries

You can split your `slides.md` into multiple files for better reusability and organization. To do this, you can use the `src` frontmatter option to specify the path to the external markdown file. For example:

::: code-group

<!-- eslint-skip -->

```md [./slides.md]
# Title

This is a normal page

---
src: ./pages/toc.md // [!code highlight]
---

<!-- this page will be loaded from './pages/toc.md' -->

Contents here are ignored

---

# Page 4

Another normal page

---
src: ./pages/toc.md   # Reuse the same file // [!code highlight]
---
```

```md [./pages/toc.md]
# Table of Contents

Part 1

---

# Table of Contents

Part 2
```

:::

<SeeAlso :links="[
  'feature/frontmatter-merging',
  'feature/import-with-range',
]" />

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
