# Markdown Syntax

Slides are written within **a single markdown file** (by default `./slides.md`). 

You can use [the Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) as you normally would, with the additional support of inlined HTML and Vue Components. Styling using [UnoCSS](/custom/config-unocss) is also supported. Use `---` padded with a new line to separate your slides. 

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
  <Tweet id="20" />
</div>
~~~

## Front Matter & Layouts

Specify layouts and other metadata for each slide by converting the separators into [front matter blocks](https://jekyllrb.com/docs/front-matter/). Each frontmatter starts with a triple-dash and ends with another. Texts between them are data objects in [YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/) format. For example:

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

> The custom syntax might not be compactible with some formatters like Prettier. To improve that, we also support using a direct `yaml` code block to define the frontmatter:
>
> ~~~markdown
> ---
> layout: cover
> ---
> 
> # Slidev
> 
> This is the cover page.
> 
> ---
> 
> ```yaml
> # The first yaml block will be treated as the frontmatter of that slide
> layout: center
> background: './images/background-1.png'
> class: 'text-white'
> ```
> 
> # Page 2
> 
> This is a page with the layout `center` and a background image.
> ~~~
>
> (Available since v0.44.0)

## Code Blocks

One big reason I am building Slidev is needing to make my code look just right in the slides. So just as you expected, you can use Markdown flavored code block to highlight your code.

~~~ts
//```ts
console.log('Hello, World!')
//```
~~~

We support [Prism](https://prismjs.com), [Shiki](https://github.com/shikijs/shiki) and [Shikiji](https://github.com/antfu/shikiji) as syntax highlighters. Refer to [the highlighters section](/custom/highlighters) for more details.

### Line Highlighting

To highlight specific lines, simply add line numbers within bracket `{}`. Line numbers start counting from 1 by default.

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

You can enable line number to all slides by setting `lineNumbers: true` on the config or enable each code block individually by setting `lines:true`. In case you want to disable the numbering for an specific block when `lineNumbers: true` you can set `lines:false` for that block:

~~~ts
//```ts {2,3}{lines:true}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
//```
~~~

You can also set the starting line for each code block and highlight the lines accordingly, defaults to 1:

~~~ts
//```ts {6,7}{lines:true, startLine:5}
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

You can start the highlight at a specific click:

~~~ts
//```ts {2-3|5|all}{at:0}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
//```
~~~

This is especially useful when you need to sync different animations (when using `two-cols` layout and list animation for instance).
You may need to set the [custom clicks count](/guide/animations#custom-clicks-count) for the slide progression to function correctly.

To skip highlighting any lines, you can set the line number to `0`. For example

~~~ts {0}
//```ts {0}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
//```
~~~

If the code doesn't fit into one slide, you can pass an extra maxHeight option which will set fixed height
and enable scrolling

~~~ts {2|3|7|12}
//```ts {2|3|7|12}{maxHeight:'100px'}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
/// ...as many lines as you want
const c = add(1, 2)
//```
~~~

### Monaco Editor

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id — it turns the block into a fully-featured Monaco editor!

~~~ts
//```ts {monaco}
console.log('HelloWorld')
//```
~~~

Learn more about [configuring Monaco](/custom/config-monaco).

### Monaco diff

Monaco can also generate a diff between two code blocks. Use `{monaco-diff}` to turn the block into a [diff Monaco editor](https://microsoft.github.io/monaco-editor/playground.html?source=v0.36.1#example-creating-the-diffeditor-multi-line-example) and use `~~~` to separate both original and modified version of the code!

```md
//```ts {monaco-diff}
This line is removed on the right.
just some text
abcd
efgh
Some more text
~~~
just some text
abcz
zzzzefgh
Some more text.
This line is removed on the left.
//```
```

## Embedded Styles

You can use `<style>` tag in your Markdown directly to override styles for the **current slide**.

```md
# This is Red

<style>
h1 {
  color: red
}
</style>

---

# Next slide is not affected
```

`<style>` tag in Markdown is always [scoped](https://vuejs.org/api/sfc-css-features.html#scoped-css). As an outstanding result, a selector with the child combinator (`.a > .b`) is unusable as such; see the previous link. To have global style overrides, check out the [customization section](/custom/directory-structure#style).

Powered by [UnoCSS](/custom/config-unocss), you can directly use nested css and [directives](https://windicss.org/features/directives.html) (e.g. `@apply`)

```md
# Slidev

> Hello `world`

<style>
blockquote {
  code {
    @apply text-teal-500 dark:text-teal-400;
  }
}
</style>
```

## Static Assets

Just like you would do in markdown, you can use images pointing to a remote or local url.

For remote assets, the built-in [`vite-plugin-remote-assets`](https://github.com/antfu/vite-plugin-remote-assets) will cache them into the disk at the first run so you can have instant loading even for large images later on.

```md
![Remote Image](https://sli.dev/favicon.png)
```

For local assets, put them into the [`public` folder](/custom/directory-structure.html#public) and reference them with **leading slash**.

```md
![Local Image](/pic.png)
```

For you want to apply custom sizes or styles, you can convert them to the `<img>` tag 

```html
<img src="/pic.png" class="m-40 h-40 rounded shadow" />
```

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

## Icons

Slidev allows you to have the accessing to almost all the popular open-source iconsets **directly** in your markdown. Powered by [`unplugin-icons`](https://github.com/antfu/unplugin-icons) and [Iconify](https://iconify.design/).

The naming follows [Iconify](https://iconify.design/)'s conversion `{collection-name}-{icon-name}`. For example:

- `<mdi-account-circle />` - <mdi-account-circle /> from [Material Design Icons](https://github.com/Templarian/MaterialDesign)
- `<carbon-badge />` - <carbon-badge /> from [Carbon](https://github.com/carbon-design-system/carbon/tree/main/packages/icons)
- `<uim-rocket />` - <uim-rocket /> from [Unicons Monochrome](https://github.com/Iconscout/unicons)
- `<twemoji-cat-with-tears-of-joy />` - <twemoji-cat-with-tears-of-joy /> from [Twemoji](https://github.com/twitter/twemoji)
- `<logos-vue />` - <logos-vue /> from [SVG Logos](https://github.com/gilbarbara/logos)
- And much more...

Browse and search for all the icons available with [Icônes](https://icones.js.org/).

### Styling Icons

You can style the icons just like other HTML elements. For example:

```html
<uim-rocket />
<uim-rocket class="text-3xl text-red-400 mx-2" />
<uim-rocket class="text-3xl text-orange-400 animate-ping" />
```

<uim-rocket />
<uim-rocket class="text-3xl text-red-400 mx-2" />
<uim-rocket class="text-3xl text-orange-400 animate-ping ml-2" />

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

We also provide a shorthand syntax sugar `::name::` for slot name. The following example works exactly the same as the previous one.

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

You can also explicitly specify the default slot and provide in the custom order

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

Learn more about [frontmatter configurations](/custom/#frontmatter-configures).

## LaTeX

Slidev comes with LaTeX support out-of-box, powered by [KaTeX](https://katex.org/).

<Tweet id="1392246507793915904" />

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

Learn more: [Demo](https://sli.dev/demo/starter/8) | [KaTeX](https://katex.org/) | [`markdown-it-katex`](https://github.com/waylonflinn/markdown-it-katex)

### LaTex line highlighting

> Available since v0.43.1

To highlight specific lines, simply add line numbers within bracket `{}`. Line numbers start counting from 1 by default.

```md
$$ {1|3|all}
\begin{array}{c}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} & = 0
\end{array}
$$
```

## Diagrams

You can also create diagrams / graphs from textual descriptions in your Markdown, powered by [Mermaid](https://mermaid-js.github.io/mermaid).

Code blocks marked as `mermaid` will be converted to diagrams, for example:

~~~md
//```mermaid
sequenceDiagram
  Alice->John: Hello John, how are you?
  Note over Alice,John: A typical interaction
//```
~~~

You can further pass an options object to it to specify the scaling and theming. The syntax of the object is a JavaScript object literal, you will need to add quotes (`'`) for strings and use comma (`,`) between keys.

~~~md
//```mermaid {theme: 'neutral', scale: 0.8}
graph TD
B[Text] --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
//```
~~~

Learn more: [Demo](https://sli.dev/demo/starter/9) | [Mermaid](https://mermaid-js.github.io/mermaid)

## Multiple Entries

> Available since v0.15

You can split your `slides.md` into multiple files and organize them as you want.

`slides.md` :

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

You can provide frontmatters from both your main entry and external markdown pages. If there are the same keys in them, the ones from the **main entry have the higher priority**. For example

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

They will end up being equivalent of the following page:

```md
---
layout: cover
background: https://sli.dev/bar.png
class: text-center
---

# Cover

Cover Page
```

### Page Reusing

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

Slidev has and experimental support for [MDC (Markdown Components) Syntax](https://content.nuxtjs.org/guide/writing/mdc) powered by [`markdown-it-mdc`](https://github.com/antfu/markdown-it-mdc).

You can enable it by add `mdc: true` to the frontmatter of your markdown file.

```md
---
mdc: true
---

This is a [red text]{style="color:red"} :inline-component{prop="value"}

![](/image.png){width=500px lazy}

::block-component{prop="value"}
The **default** slot
::
```

Learn more about [the syntax](https://content.nuxtjs.org/guide/writing/mdc).
