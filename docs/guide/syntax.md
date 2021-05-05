# Markdown Syntax

Slides can be written within **a single markdown file** (by default `./slides.md`). 

You can use [the Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) as you normally would, with the additional inlined HTML and Vue Components support. Use `---` with a new line after to separate your slides. 

~~~md
# Slidev

Hello World

---

# Page 2

Directly use code blocks for highlighting

\```ts
console.log('Helle World')
\```

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

A big reason I am making this is that I need to make my code looks just right in the slides. So just as you expected, you can use Markdown favored code block to highlight your code.

~~~md
\```ts
console.log('HelloWorld')
\```
~~~

To highlight specific lines, simply add line numbers within bracket `{}`. Line numbers start count from 1.

~~~md
\```ts {2,3}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
\```
~~~

To change the highlight in multiple steps, you can use `|` to separate them. For example

~~~md
\```ts {2-3|5|all}
function add(
  a: Ref<number> | number,
  b: Ref<number> | number
) {
  return computed(() => unref(a) + unref(b))
}
\```
~~~

This will highlight on `a` and `b` first, then goes to the `computed` line after one click, and then, the whole block. Learn more about the [clicks animations here](/guide/animations).

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id, it turns the block into a full-featured Monaco editor!

~~~md
\```ts {monaco}
console.log('HelloWorld')
\```
~~~

## Notes

You can take notes for each slide. They will show up on [Presenter Mode](/guide/presenter-mode) for you to reference in presentations.

In Markdown, the last comment block in each slide will be treated as notes.

~~~md
---
layout: cover
---

# Slidev

This is the cover page.

<!-- This is a note -->

---

# Page 2

<!-- This is NOT a note -->

The second page

<!--
This is another note
-->
~~~

## Configurations

All the configurations needed can also be defined in the Markdown file. For example:

```md
---
theme: seriph
layout: cover
background: 'https://source.unsplash.com/1600x900/?nature,water'
---

# Slidev

This is the cover page.
```

For more details about using a theme, refer to [this section](/themes/use).
