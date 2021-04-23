# Slides Syntax

Under your project root, you will have a markdown file `slides.md` for all your slides. The format is basically like a few markdown files with frontmatter concated with each other.

```md
---
layout: cover
---

# Vite Slides

Hello World

<!-- Second page --->
---
layout: default
---

# Page 2

`​``ts
console.log('HelloWorld')
`​``

<!-- Third page --->
------

# Page 3

If there is no frontmatter needed, you can omit them and simply use 6 dashes.
```

### Code Snippet

A big reason I am making this is that I need to make code looks right in the slides. So just as you expected, you can use markdown favored code block to highlight your code.

```md
`​``ts
console.log('HelloWorld')
`​``
```

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id, it will turn the block into a full-featured Monaco editor!

```md
`​``ts{monaco}
console.log('HelloWorld')
`​``
```
