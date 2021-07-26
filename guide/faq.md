# FAQ

## Grids

Since Slidev is based on the Web, you can apply any grid layouts as you want. [CSS Grids](https://css-tricks.com/snippets/css/complete-guide-grid/), [flexboxes](https://css-tricks.com/snippets/css/a-guide-to-flexbox/), or even [Masonry](https://css-tricks.com/native-css-masonry-layout-in-css-grid/), you get the full controls.

Since we have [Windi CSS](https://windicss.org/) built-in, here is one simple way for you to reference:

```html
<div class="grid grid-cols-2 gap-4">
<div>

The first column

</div>
<div>

The second column

</div>
</div>
```

Go further, you can customize the size of each column like:

```html
<div class="grid grid-cols-[200px,1fr,10%] gap-4">
<div>

The first column (200px)

</div>
<div>

The second column (auto fit)

</div>
<div>

The third column (10% width to parent container)

</div>
</div>
```

Learn more about [Windi CSS Grids](https://windicss.org/utilities/grid.html).

## Positioning

Slides are defined in fixed sizes (default `980x552px`) and scale to fit with the user screen. You can safely use absolute position in your slides as they will scale along with the screen.

For example:

```html
<div class="absolute left-30px bottom-30px">
This is a left-bottom aligned footer
</div>
```

To change the canvas' actual size, you can pass the `canvasWidth` options in your first frontmatter:

```yaml
---
canvasWidth: 800
---
```

## Font Size

If you feel the font size in your slides are too small, you can adjust it in a few ways:

### Override Local Style

You can override styles for each slide with the inlined `<style>` tag.

```md
# Page 1

<style>
h1 {
  font-size: 10em;
}
</style>

---

# Page 2

This will not be affected.
```

Learn more: [Embedded Styles](/guide/syntax.html#embedded-styles)

### Override Global Style

You can provide custom global styles by creating `./style.css`, for example

```css
/* style.css */ 

h1 {
  font-size: 10em !important;
}
```

Learn more: [Global Style](/custom/directory-structure.html#style)

### Scale the Canvas

Changing the canvas' actual size will scale all your contents(text, images, components, etc.) and slides

```yaml
---
# default: 980
# since the canvas gets smaller, the visual size will become larger
canvasWidth: 800
---
```

### Use Transform

We provide a built-in component `<Transform />`, which is a thin wrapper of CSS transform property.

```md
<Transform :scale="1.4">

- Item 1
- Item 2

</Transform>
```
