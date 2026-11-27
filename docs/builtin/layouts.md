# Layouts

This page lists all the built-in layouts provided by Slidev. These layouts can be used via the `layout` option in the frontmatters of your slides.

Note that <LinkInline link="guide/theme-addon" /> may provide additional layouts or override the existing ones. To add your own layouts, see <LinkInline link="guide/write-layout" />.

## `center`

Displays the content in the middle of the screen.

## `cover`

Used to display the cover page for the presentation, may contain the presentation title, contextualization, etc.

## `default`

The most basic layout, to display any kind of content.

## `end`

The final page for the presentation.

## `fact`

To show some fact or data with a lot of prominence on the screen.

## `full`

Use all the space of the screen to display the content.

## `image-left`

Shows an image on the left side of the screen, the content will be placed on the right side.

### Usage

```yaml
---
layout: image-left

# the image source
image: /path/to/the/image

# a custom class name to the content
class: my-cool-content-on-the-right
---
```

## `image-right`

Shows an image on the right side of the screen, the content will be placed on the left side.

### Usage

```yaml
---
layout: image-right

# the image source
image: /path/to/the/image

# a custom class name to the content
class: my-cool-content-on-the-left
---
```

## `image`

Shows an image as the main content of the page.

### Usage

```yaml
---
layout: image

# the image source
image: /path/to/the/image
---
```

You can change the default background size (`cover`) by adding the `backgroundSize` attribute:

```yaml
---
layout: image
image: /path/to/the/image
backgroundSize: contain
---
```

```yaml
---
layout: image-left
image: /path/to/the/image
backgroundSize: 20em 70%
---
```

## `iframe-left`

Shows a web page on the left side of the screen, the content will be placed on the right side.

### Usage

```yaml
---
layout: iframe-left

# the web page source
url: https://github.com/slidevjs/slidev

# a custom class name to the content
class: my-cool-content-on-the-right
---
```

## `iframe-right`

Shows a web page on the right side of the screen, the content will be placed on the left side.

### Usage

```yaml
---
layout: iframe-right

# the web page source
url: https://github.com/slidevjs/slidev

# a custom class name to the content
class: my-cool-content-on-the-left
---
```

## `iframe`

Shows a web page as the main content of the page.

### Usage

```yaml
---
layout: iframe

# the web page source
url: https://github.com/slidevjs/slidev
---
```

## `intro`

To introduce the presentation, usually with the presentation title, a short description, the author, etc.

## `none`

A layout without any existing styling.

## `quote`

To display a quotation with prominence.

## `section`

Used to mark the beginning of a new presentation section.

## `statement`

Make an affirmation/statement as the main page content.

## `two-cols`

Separates the page content in two columns.

### Usage

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

## `two-cols-header`

Separates the upper and lower lines of the page content, and the second line separates the left and right columns.

### Usage

```md
---
layout: two-cols-header
---

This spans both

::left::

# Left

This shows on the left

::right::

# Right

This shows on the right

<style>
.two-cols-header {
  column-gap: 20px; /* Adjust the gap size as needed */
}
</style>
```
