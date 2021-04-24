# Markdown Syntax

## Basic

All your slides can be written within a single markdown file (`./slides.md`). 

You can use [the Markdown features](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) as you normally would, with the additional inlined HTML and Vue Components support. Use `----` (four dashes or more) to separate your slides. 

~~~md
# Slidev

Hello World

----

# Page 2

Directly use code blocks for highlighting

```ts
console.log('Helle World')
`​``

----

# Page 3

You can directly use Windi CSS and Vue components to style and enrich your slides.

<div class="p-3">
  <Tweet :id="20" />
<div>
~~~

### Front Matter & Layouts

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

----

# Page 3

This is a default page without any additional metadata.
~~~

Refer to [supported frontmatter fields](/guide/frontmatter-fields) for more details.

### Code Snippet

A big reason I am making this is that I need to make code looks right in the slides. So just as you expected, you can use markdown favored code block to highlight your code.

~~~md
```ts
console.log('HelloWorld')
`​``
~~~

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id, it will turn the block into a full-featured Monaco editor!

~~~md
```ts{monaco}
console.log('HelloWorld')
`​``
~~~
