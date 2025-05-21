---
outline: deep
---

# Syntax Guide

Slidev's slides are written as Markdown files, which are called **Slidev Markdown**s. A presentation has a Slidev Markdown as its entry, which is `./slides.md` by default, but you can change it by passing the file path as an argument to [the CLI commands](../builtin/cli).

In a Slidev Markdown, not only [the basic Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) can be used as usual, Slidev also provides additional features to enhance your slides. This section covers the syntax introduced by Slidev. Please make sure you know the basic Markdown syntax before reading this guide.

## Slide Separators {#slide-separators}

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

## Frontmatter & Headmatter {#frontmatter}

At the beginning of each slide, you can add an optional [frontmatter](https://jekyllrb.com/docs/front-matter/) to configure the slide. The first frontmatter block is called **headmatter** and can configure the whole slide deck. The rest are **frontmatters** for individual slides. Texts in the headmatter or the frontmatter should be an object in [YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/) format. For example:

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

Configurations you can set are described in the [Slides deck configurations](/custom/#headmatter) and [Per slide configurations](/custom/#frontmatter) sections.

To make the headmatter more readable, you can install the VSCode extension:

<LinkCard link="features/vscode-extension" />

Also, there is another possible frontmatter format:

<LinkCard link="features/block-frontmatter" />

## Notes {#notes}

You can also create presenter notes for each slide. They will show up in <LinkInline link="guide/ui#presenter-mode" /> for you to reference during presentations.

The comment blocks at the end of each slide are treated as the note of the slide:

```md {9,19-21}
---
layout: cover
---

# Slide 1

This is the cover page.

<!-- This is a **note** -->

---

# Slide 2

<!-- This is NOT a note because it is not at the end of the slide -->

The second page

<!--
This is _another_ note
-->
```

Basic Markdown and HTML are also supported in notes and will be rendered.

<SeeAlso :links="[
  'features/click-marker',
]" />

## Code Blocks {#code-block}

One big reason that led to the creation of Slidev was the need to perfectly display code in slides. Consequently, you can use Markdown-flavored code blocks to highlight your code.

````md
```ts
console.log('Hello, World!')
```
````

Slidev has [Shiki](https://github.com/shikijs/shiki) built in as the syntax highlighter. Refer to [Configure Shiki](/custom/config-highlighter) for more details.

More about code blocks:

<LinkCard link="features/code-block-line-numbers" />
<LinkCard link="features/code-block-max-height" />
<LinkCard link="features/line-highlighting" />
<LinkCard link="features/monaco-editor" />
<LinkCard link="features/monaco-run" />
<LinkCard link="features/monaco-write" />
<LinkCard link="features/shiki-magic-move" />
<LinkCard link="features/twoslash" />
<LinkCard link="features/import-snippet" />
<LinkCard link="features/code-groups" />

## LaTeX Blocks {#latex-block}

Slidev supports LaTeX blocks for mathematical and chemical formulas:

<LinkCard link="features/latex" />

## Diagrams {#diagrams}

Slidev supports [Mermaid](https://mermaid.js.org/) and [PlantUML](https://plantuml.com/) for creating diagrams from text:

<LinkCard link="features/mermaid" />
<LinkCard link="features/plantuml" />

## MDC Syntax {#mdc-syntax}

MDC Syntax is the easiest way to apply styles and classes to elements:

<LinkCard link="features/mdc" />

## Scoped CSS {#scoped-css}

You can use scoped CSS to style your slides:

<LinkCard link="features/slide-scope-style" />

## Importing Slides {#importing-slides}

<LinkCard link="features/importing-slides" />
