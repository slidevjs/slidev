# Components

## Built-in Components

> The documentations of this section is still working in progress. Before that, you can take a look at the [source code](https://github.com/slidevjs/slidev/blob/main/packages/client/builtin) directly.

### `TOC`

Insert a Table Of Content.

Titles and title levels get automatically retrieved from the first title element of each slides.

You can override this automatic behaviour for a slide by using the front matter syntax:
```yml
---
title: Amazing slide title
level: 2
---
```

Or if you prefer the slide to not appear in the TOC at all, you can use:
```yml
---
hideInToc: true
---
```

#### Usage
~~~md
<Toc />
~~~

Parameters:

* `columns` (`string | number`, default: `1`): The number of columns of the display
* `maxDepth` (`string | number`, default: `Infinity`): The maximum depth level of title to display
* `minDepth` (`string | number`, default: `1`): The minimum depth level of title to display
* `mode` (`'all' | 'onlyCurrentTree'| 'onlySiblings'`, default: `'all'`):
  * `'all'`: Display all items
  * `'onlyCurrentTree'`: Display only items that are in current tree (active item, parents and children of active item)
  * `'onlySiblings'`: Display only items that are in current tree and their direct siblings

## Custom Components

Create a directory `components/` under your project root, and simply put your custom Vue components under it, then you can use it with the same name in your markdown file!

Read more in the [Customization](/custom/directory-structure#components) section.

## Theme-provided Components

Themes can provide components as well. Please read their documentations for what they have provided.

Check more in the [directory structure](/custom/directory-structure) section.
