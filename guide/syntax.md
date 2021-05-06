# Markdown Syntax

Slides are written within **a single markdown file** (by default `./slides.md`). 

You can use [the Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) as you normally would, with the additional support of inlined HTML and Vue Components. Styling using [Windi CSS](https://windicss.org) is also supported. Use `---` padded with a new line to separate your slides. 

~~~md
# Slidev

Hello, World!

---

# Page 2

Directly use code blocks for highlighting

//```ts
console.log('Hello, World!')
//```

---

# Page 3

You can directly use Windi CSS and Vue components to style and enrich your slides.

<div class="p-3">
  <Tweet :id="20" />
<div>
~~~

## Front Matter & Layouts

You can specify layouts and other metadata for each slide by converting the separators into [front matter blocks](https://jekyllrb.com/docs/front-matter/). Each front matter starts with a triple-dash and ends with another. Texts between them are data objects in [YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/) format. For example:

~~~md
---
layout: cover
---

# Slidev

This is the cover page.

---
layout: center
background: './images/background-1.png'
class: 'text-white'
---​

# Page 2

This is a page with the layout `center` and a background image.

---

# Page 3

This is a default page without any additional metadata.
~~~

Refer to [customization](/custom/) for more details.

## Code Snippet

A big reason I am building Slidev is needing to make my code look just right in the slides. So just as you expected, you can use Markdown flavored code block to highlight your code.

~~~ts
//```ts
console.log('Hello, World!')
//```
~~~

### Line Highlighting

To highlight specific lines, simply add line numbers within bracket `{}`. Line numbers start counting from 1.

~~~ts
//```ts {2,3}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
//```
~~~

To change the highlight in multiple steps, you can use `|` to separate them. For example

~~~ts
//```ts {2-3|5|all}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
//```
~~~

This will first highlight `a: Ref<number> | number` and `b: Ref<number> | number`, and then `return computed(() => unref(a) + unref(b))` after one click, and lastly, the whole block. Learn more in the [clicks animations guide](/guide/animations).

### Monaco Editor

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id — it turns the block into a fully-featured Monaco editor!

~~~ts
//```ts {monaco}
console.log('HelloWorld')
//```
~~~

Learn more about [configuring Monaco](/custom/config-monaco).

## Notes

You can also take notes for each slide. They will show up in [Presenter Mode](/guide/presenter-mode) for you to reference during presentations.

In Markdown, the last comment block in each slide will be treated as a note.

~~~md
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
~~~

## Configurations

All configurations needed can be defined in the Markdown file. For example:

```md
---
theme: seriph
layout: cover
background: 'https://source.unsplash.com/1600x900/?nature,water'
---

# Slidev

This is the cover page.
```

For more details about using a theme, refer to the [themes usage section](/themes/use).

## LaTeX

Slidev comes with LaTeX support out-of-box, powered by [KaTeX](https://katex.org/).

### Inline

Surround your LaTeX with a single `$` on each side for inline rendering.

```md
$\sqrt{3x-1}+(1+x)^2$
```

### Block

Use two (`$$`) for block rendering. This mode uses bigger symbols and centers
the result.

```md
$$
\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}
$$
```

Learn more: [Demo](https://sli.dev/demo/starter/6) | [KaTeX](https://katex.org/) | [`markdown-it-katex`](https://github.com/waylonflinn/markdown-it-katex).
