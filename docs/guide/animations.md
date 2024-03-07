---
outline: deep
---

# Animations

## Click Animations

> [!NOTE]
> Since v0.48.0, we are rewritten the click animations system with much more consistent behaviors. It might change the behaviors of your existing slides in edge cases. While this page is showing the new click system, you can find more details about the refactor in [#1279](https://github.com/slidevjs/slidev/pull/1279).

### `v-click`

To apply "click animations" for elements, you can use the `v-click` directive or `<v-click>` components

```md
<!-- Component usage:
     this will be invisible until you press "next" -->

<v-click> Hello **World** </v-click>

<!-- Directive usage:
     this will be invisible until you press "next" the second time -->
<div v-click class="text-xl"> Hey! </div>
```

### `v-after`

`v-after` is only provided as a directive. It will turn the element visible when the previous `v-click` is triggered.

```md
<div v-click> Hello </div>
<div v-after> World </div>
```

When you press "next", both `Hello` and `World` will show up together.

### Hide after clicking

Add a `.hide` modifier to `v-click` or `v-after` to make the element invisible after clicking, instead of showing up.

```md
<div v-click> Visible after 1 click </div>
<div v-click.hide> Hidden after 2 click </div>
<div v-after.hide> Hidden after 2 click </div>
```

For `v-click` component, you can use the `hide` prop to achieve the same effect:

```md
<v-click> Visible after 1 click </v-click>
<v-click hide> Hidden after 2 click </v-click>
```

### `v-clicks`

`v-clicks` is only provided as a component. It's a shorthand to apply the `v-click` directive to all its child elements. It is especially useful when working with lists and tables.

```md
<v-clicks>

- Item 1
- Item 2
- Item 3

</v-clicks>
```

An item will become visible each time you click "next".
It accepts a `depth` prop for nested list:

```md
<v-clicks depth="2">

- Item 1
  - Item 1.1
  - Item 1.2
- Item 2
  - Item 2.1
  - Item 2.2

</v-clicks>
```

Also, you can use the `every` prop to specify the number of items to show after each click:

```md
<v-clicks every="2">

- Item 1 (part 1)
- Item 1 (part 2)
- Item 2 (part 1)
- Item 2 (part 2)

</v-clicks>
```

### Positioning

By default, the clicking animations take place one by one. You can customize the animation position of elements by using the `at` prop or the `v-click` directive with value.

Like the CSS layout system, click-animated elements can be "relative" or "absolute":

#### Relative Position

This actual position of relative elements are calculated based on the previous relative elements:

````md
<div v-click> visible after 1 click </div>
<v-click at="+2"><div> visible after 3 clicks </div></v-click>
<div v-click.hide="'-1'"> hidden after 2 clicks </div>

```js {none|1|2}{at:'+5'}
1  // highlighted after 7 clicks
2  // highlighted after 8 clicks
```
````

> [!NOTE]
> The default value of `v-click` is `'+1'` when you don't specify it.

In fact, `v-after` are just shortcuts for `v-click` with `at` prop:

```md
<!-- The following 2 usages are equivalent -->
<img v-after />
<img v-click="'+0'" />

<!-- The following 3 usages are equivalent -->
<img v-click />
<img v-click="'+1'" />
<v-click-gap size="1" /><img v-after />
```

:::info
Only string values start with `'+'` or `'-'` like `'+1'` are treated as relative positions:

| Value          | Kind     |
| -------------- | -------- |
| `'-1'`, `'+1'` | Relative |
| `+1` === `1`   | Absolute |
| `'1'`          | Absolute |

So don't forget the single quotes for the relative values.
:::

#### Absolute Position

The given value is the exact click count to show the element:

````md
<div v-click="3"> visible after 3 clicks </div>
<v-click at="2"><div> visible after 2 clicks </div></v-click>
<div v-click.hide="1"> hidden after 1 click </div>

```js {none|1|2}{at:3}
1  // highlighted after 3 clicks
2  // highlighted after 4 clicks
```
````

#### Mixed Case

You can mix the absolute and relative positions:

```md
<div v-click> visible after 1 click </div>
<div v-click="3"> visible after 3 clicks </div>
<div v-click> visible after 2 click </div>
<div v-click="'-1'"> visible after 1 click </div>
<div v-click="4"> visible after 4 clicks </div>
```

The following example synchronizes the highlighting of the two code blocks:

````md
```js {1|2}{at:1}
1 + 1
'a' + 'b'
```

```js {1|2}{at:1}
2
'ab'
```
````

### Enter & Leave

> Available since v0.43.0

You can also specify the enter and leave index for the `v-click` directive by passing an array. The end index is exclusive.

```md
<div v-click="[2, 4]">This will be shown on the 2nd and 3rd clicks, and hide again after the 4th.</div>
```

### Custom Total Clicks Count

By default, Slidev counts how many steps are needed before going to the next slide. You can override this setting by passing the `clicks` frontmatter option:

```yaml
---
# 10 clicks in this slide, before going to the next
clicks: 10
---
```

### Element Transitions

When you apply the `v-click` directive to your elements, it will attach the class name `slidev-vclick-target` to it. When the elements are hidden, the class name `slidev-vclick-hidden` will also be attached. For example:

```html
<div class="slidev-vclick-target slidev-vclick-hidden">Text</div>
```

After a click, it will become

```html
<div class="slidev-vclick-target">Text</div>
```

By default, a subtle opacity transition is applied to those classes:

```css
// the default

.slidev-vclick-target {
  transition: opacity 100ms ease;
}

.slidev-vclick-hidden {
  opacity: 0;
  pointer-events: none;
}
```

You can override them to customize the transition effects in your custom stylesheets.

For example, you can achieve the scaling up transitions by:

```css
/* styles.css */

.slidev-vclick-target {
  transition: all 500ms ease;
}

.slidev-vclick-hidden {
  transform: scale(0);
}
```

To specify animations for only certain slide or layout

```scss
.slidev-page-7,
.slidev-layout.my-custom-layout {
  .slidev-vclick-target {
    transition: all 500ms ease;
  }

  .slidev-vclick-hidden {
    transform: scale(0);
  }
}
```

Learn more about [customizing styles](/custom/directory-structure#style).

## Rough Markers

> Available since v0.48.0

Slidev integrates [Rough Notation](https://github.com/linkstrifer/react-rough-notation) to allow marking or highlighting elements in your slides.

### `v-mark`

Rough Notation integrates comes with the `v-mark` directive.

#### Type

`v-mark.underline` for Underline mark, `v-mark.circle` for Circle mark, etc. Default to `underline`

#### Color

`v-mark.red` make the notation `red`. Supported builtin color themes from UnoCSS. For custom colors, use object syntax `v-mark="{ color: '#234' }"`

#### Clicks

`v-mark` works like `v-click` and will trigger after a click. Same as `v-click`, it allows you to pass a custom click value, like `v-mark="5"` or `v-mark="'+1'"`.

#### Options

Optionally you can pass an object to `v-mark` to specify the options, for example:

```vue
<span v-mark="{ at: 5, color: '#234', type: 'circle' }">
Important text
</span>
```

#### Preview

<video src="https://github.com/slidevjs/slidev/assets/11247099/c840340c-0aa1-4cde-b228-e6c67e5f6879" rounded-lg shadow controls></video>

## Motion

Slidev has [@vueuse/motion](https://motion.vueuse.org/) built-in. You can use the `v-motion` directive to any elements to make apply motion on them. For example

```html
<div
  v-motion
  :initial="{ x: -80 }"
  :enter="{ x: 0 }">
  Slidev
</div>
```

The text `Slidev` will move from `-80px` to its original position on initialization.

> Note: Slidev preloads the next slide for performance, which means the animations might start before you navigate to the page. To get it works properly, you can disable the preloading for the particular slide
>
> ```md
> ---
> preload: false
> ---
> ```
>
> Or control the element life-cycle with `v-if` to have fine-grained controls
>
> ```html
> <div
>   v-if="$slidev.nav.currentPage === 7"
>   v-motion
>   :initial="{ x: -80 }"
>   :enter="{ x: 0 }">
>   Slidev
> </div>
> ```

Learn mode: [Demo](https://sli.dev/demo/starter/7) | [@vueuse/motion](https://motion.vueuse.org/) | [v-motion](https://motion.vueuse.org/features/directive-usage) | [Presets](https://motion.vueuse.org/features/presets)

## Slide Transitions

<div id="pages-transitions" />

> Available since v0.39.0

Slidev supports slide transitions out of the box. You can enable it by setting the `transition` frontmatter option:

```md
---
transition: slide-left
---
```

This will give you a nice sliding effects on slide switching. Setting it in the frontmatter will apply to all slides. You can also set different transition per slide.

### Builtin Transitions

- `fade` - Crossfade in/out
- `fade-out` - Fade out and then fade in
- `slide-left` - Slides to the left (slide to right when going backward)
- `slide-right` - Slides to the right (slide to left when going backward)
- `slide-up` - Slides to the top (slide to bottom when going backward)
- `slide-down` - Slides to the bottom (slide to top when going backward)
- `view-transition` - Slides with the view transitions API

### View Transitions

> Available since v0.43.0

The **View Transitions API** provides a mechanism for easily creating animated transitions between different DOM states. Learn more how it works in [View Transitions API - MDN Web Docs - Mozilla](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).

:::warning
Experimental: This is not supported by all browsers. Check the [Browser compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API#browser_compatibility) carefully before using this.
:::

You can use the `view-transition-name` CSS property to name view transitions, which creates connections between different page elements and smooth transitions when switching slides.

You can enable [MDC (Markdown Component) Syntax](/guide/syntax#mdc-syntax) support to conveniently name view-transitions:

```md
---
transition: view-transition
mdc: true
---

# View Transition {.inline-block.view-transition-title}

---

# View Transition {.inline-block.view-transition-title}
```

### Custom Transitions

Slidev's slide transitions are powered by [Vue Transition](https://vuejs.org/guide/built-ins/transition.html). You can provide your custom transitions by:

```md
---
transition: my-transition
---
```

and then in your custom stylesheets:

```css
.my-transition-enter-active,
.my-transition-leave-active {
  transition: opacity 0.5s ease;
}

.my-transition-enter-from,
.my-transition-leave-to {
  opacity: 0;
}
```

Learn more how it works in [Vue Transition](https://vuejs.org/guide/built-ins/transition.html).

### Forward & Backward Transitions

You can specify different transitions for forward and backward navigation using `|` as a separator in the transition name:

```md
---
transition: go-forward | go-backward
---
```

With this, when you go from slide 1 to slide 2, the `go-forward` transition will be applied. When you go from slide 2 to slide 1, the `go-backward` transition will be applied.

### Advanced Usage

The `transition` field accepts an option that will passed to the [`<TransitionGroup>`](https://vuejs.org/api/built-in-components.html#transition) component. For example:

```md
---
transition:
  name: my-transition
  enterFromClass: custom-enter-from
  enterActiveClass: custom-enter-active
---
```
