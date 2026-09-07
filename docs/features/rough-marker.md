---
depends:
  - guide/animations
relates:
  - Rough Notation: https://github.com/slidevjs/rough-notation
since: v0.48.0
tags: [drawing, animation]
description: |
  Integrate Rough Notation to allow marking or highlighting elements in your slides.
---

# Rough Markers

Slidev integrates [Rough Notation](https://github.com/slidevjs/rough-notation) to allow marking or highlighting elements in your slides.

---

### `v-mark` directive

Rough Notation integration comes with the `v-mark` directive.

#### Type

Use `v-mark.underline` for the underline mark, `v-mark.circle` for the circle mark, etc. (defaults to `underline`).

#### Color

`v-mark.red` makes the notation `red`. Supported built-in color themes from UnoCSS. For custom colors, use object syntax `v-mark="{ color: '#234' }"`.

#### Clicks

`v-mark` works like `v-click` and will trigger after a click. Same as `v-click`, it allows you to pass a custom click value, like `v-mark="5"` or `v-mark="'+1'"`.

To show a mark for a range of clicks, pass an array with the first and last click:

```vue
<span v-mark="[2, 4]">Shown from click 2 through click 3</span>
```

The end of the range is exclusive, so the mark is hidden again when click 4 is reached. The same range can be used with the object syntax:

```vue
<span v-mark="{ at: [2, 4], type: 'circle' }">Marked temporarily</span>
```

#### Options

Optionally, you can pass an object to `v-mark` to specify the options, for example:

```vue
<span v-mark="{ at: 5, color: '#234', type: 'circle' }">
Important text
</span>
```

#### Preview

<video src="https://github.com/slidevjs/slidev/assets/11247099/c840340c-0aa1-4cde-b228-e6c67e5f6879" rounded-lg shadow controls></video>
