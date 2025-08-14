---
outline: deep
---

# Animation

Animation is an essential part of slide presentations. Slidev provides a variety of ways to animate your slides, from the simple to the complex. This guide will show you how to use them effectively.

## Click Animation {#click-animation}

A "**click**" can be considered as the unit of animation steps in slides. A slide can have one or more clicks, and each click can trigger one or more animations - for example, revealing or hiding elements.

> [!NOTE]
> Since v0.48.0, we've rewritten the click animations system with much more consistent behaviors. It might change the behaviors of your existing slides in edge cases. While this page is showing the new click system, you can find more details about the refactor in [#1279](https://github.com/slidevjs/slidev/pull/1279).

### `v-click` {#v-click}

To apply show/hide "click animations" for elements, you can use the `<v-click>` component or the `v-click` directive.

<!-- eslint-skip -->

```md
<!-- Component usage:
     this will be invisible until you press "next" -->
<v-click> Hello World! </v-click>

<!-- Directive usage:
     this will be invisible until you press "next" the second time -->
<div v-click class="text-xl"> Hey! </div>
```

### `v-after` {#v-after}

`v-after` will turn the element visible when the previous `v-click` is triggered.

```md
<div v-click> Hello </div>
<div v-after> World </div>  <!-- or <v-after> World </v-after> -->
```

When you press "next", both `Hello` and `World` will show up together.

### Hide after clicking {#hide-after-clicking}

Add a `.hide` modifier to `v-click` or `v-after` directives to make elements invisible after clicking, instead of showing up.

```md
<div v-click> Visible after 1 click </div>
<div v-click.hide> Hidden after 2 clicks </div>
<div v-after.hide> Hidden after 2 clicks </div>
```

For the components, you can use the `hide` prop to achieve the same effect:

```md
<v-click> Visible after 1 click </v-click>
<v-click hide> Hidden after 2 clicks </v-click>
<v-after hide> Also hidden after 2 clicks </v-after>
```

### `v-clicks` {#v-clicks}

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

- Item 1.1
- Item 1.2
- Item 2.1
- Item 2.2

</v-clicks>
```

### Positioning {#positioning}

By default, the clicking animations are triggered one by one. You can customize the animation "position" of elements by using the `at` prop or the `v-click` directive with value.

Like the CSS layout system, click-animated elements can be "relative" or "absolute":

#### Relative Position {#relative-position}

This actual position of relative elements is calculated based on the previous relative elements:

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

::: tip `at` prop value format
Only string values starting with `'+'` or `'-'` like `'+1'` are treated as relative positions:

| Value          | Kind     |
| -------------- | -------- |
| `'-1'`, `'+1'` | Relative |
| `+1` === `1`   | Absolute |
| `'1'`          | Absolute |

So don't forget the single quotes for the relative values.
:::

#### Absolute Position {#absolute-position}

The given value is the exact click count to trigger this animation:

````md
<div v-click="3"> visible after 3 clicks </div>
<v-click at="2"><div> visible after 2 clicks </div></v-click>
<div v-click.hide="1"> hidden after 1 click </div>

```js {none|1|2}{at:3}
1  // highlighted after 3 clicks
2  // highlighted after 4 clicks
```
````

#### Mixed Case {#mixed-case}

You can mix the absolute and relative positions:

```md
<div v-click> visible after 1 click </div>
<div v-click="3"> visible after 3 clicks </div>
<div v-click> visible after 2 click </div>
<div v-click="'-1'"> visible after 1 click </div>
<div v-click="4"> visible after 4 clicks </div>
```

The following example synchronizes the highlighting of the two code blocks:

````md {1,6}
```js {1|2}{at:1}
1 + 1
'a' + 'b'
```

```js {1|2}{at:1}
= 2
= 'ab'
```
````

### Enter & Leave {#enter-leave}

You can also specify the enter and leave index for the `v-click` directive by passing an array. The end index is exclusive.

```md
<div v-click.hide="[2, 4]">
  This will be hidden at click 2 and 3 (and shown otherwise).
</div>
<div v-click />
<div v-click="['+1', '+1']">
  This will be shown only at click 2 (and hidden otherwise).
</div>
```

You can also use `v-switch` to achieve the same effect:

```md
<v-switch>
  <template #1> show at click 1, hide at click 2. </template>
  <template #2> show at click 2, hide at click 5. </template>
  <template #5-7> show at click 5, hide at click 7. </template>
</v-switch>
```

See [`VSwitch` Component](/builtin/components#vswitch) for more details.

### Custom Total Clicks Count {#total}

By default, Slidev automatically calculates how many clicks are required before going to the next slide. You can override this via the `clicks` frontmatter option:

```yaml
---
# 10 clicks in this slide, before going to the next slide
clicks: 10
---
```

### Element Transitions {#element-transitions}

When you apply the `v-click` directive to your elements, it will attach the class name `slidev-vclick-target` to it. When the elements are hidden, the class name `slidev-vclick-hidden` will also be attached. For example:

```html
<div class="slidev-vclick-target slidev-vclick-hidden">Text</div>
```

After a click, it may become:

```html
<div class="slidev-vclick-target">Text</div>
```

By default, a subtle opacity transition is applied to those classes:

```css
/* below shows the default style */

.slidev-vclick-target {
  transition: opacity 100ms ease;
}

.slidev-vclick-hidden {
  opacity: 0;
  pointer-events: none;
}
```

You can override them to customize the transition effects in your custom stylesheets. For example, you can achieve the scaling up transitions by:

```css
/* styles.css */

.slidev-vclick-target {
  transition: all 500ms ease;
}

.slidev-vclick-hidden {
  transform: scale(0);
}
```

To specify animations for only certain slides or layouts:

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

## Motion {#motion}

Slidev has [@vueuse/motion](https://motion.vueuse.org/) built-in. You can use the `v-motion` directive to any elements to apply motion to them. For example

```html
<div
  v-motion
  :initial="{ x: -80 }"
  :enter="{ x: 0 }"
  :leave="{ x: 80 }"
>
  Slidev
</div>
```

The text `Slidev` will move from `-80px` to its original position when entering the slide. When leaving, it will move to `80px`.

> Before v0.48.9, you need to add `preload: false` to the slide's frontmatter to enable motion.

### Motion with Clicks {#motion-with-clicks}

> Available since v0.48.9

You can also trigger the motion by clicks:

```html
<div
  v-motion
  :initial="{ x: -80 }"
  :enter="{ x: 0, y: 0 }"
  :click-1="{ x: 0, y: 30 }"
  :click-2="{ y: 60 }"
  :click-2-4="{ x: 40 }"
  :leave="{ y: 0, x: 80 }"
>
  Slidev
</div>
```

Or combine `v-click` with `v-motion`:

```html
<div v-click="[2, 4]" v-motion
  :initial="{ x: -50 }"
  :enter="{ x: 0 }"
  :leave="{ x: 50 }"
>
  Shown at click 2 and hidden at click 4.
</div>
```

The meanings of variants:

- `initial`: When `currentPage < thisPage`, or `v-click` hides the current element because `$clicks` is too small.
- `enter`: When `currentPage === thisPage`, and `v-click` shows the element. _Priority: lowest_
- `click-x`: `x` is a number representing the **absolute** click num. The variant will take effect if `$clicks >= x`. _Priority: `x`_
- `click-x-y`: The variant will take effect if `x <= $clicks < y`. _Priority: `x`_
- `leave`: `currentPage > thisPage`, or `v-click` hides the current element because `$clicks` is too large.

The variants will be combined according to the priority defined above.

::: warning
Due to a Vue internal [bug](https://github.com/vuejs/core/issues/10295), currently **only** `v-click` applied to the same element as `v-motion` can control the motion animation. As a workaround, you can use something like `v-if="3 < $clicks"` to achieve the same effect.
:::

Learn more: [Demo](https://sli.dev/demo/starter/10) | [@vueuse/motion](https://motion.vueuse.org/) | [v-motion](https://motion.vueuse.org/features/directive-usage) | [Presets](https://motion.vueuse.org/features/presets)

## Slide Transitions {#slide-transitions}

<div id="pages-transitions" />

Slidev supports slide transitions out of the box. You can enable it by setting the `transition` frontmatter option:

```md
---
transition: slide-left
---
```

This will give you a nice sliding effects on slide switching. Setting it in the headmatter will apply this to all slides. You can also set different transitions per slide in frontmatters.

### Builtin Transitions {#builtin-transitions}

- `fade` - Crossfade in/out
- `fade-out` - Fade out and then fade in
- `slide-left` - Slides to the left (slide to right when going backward)
- `slide-right` - Slides to the right (slide to left when going backward)
- `slide-up` - Slides to the top (slide to bottom when going backward)
- `slide-down` - Slides to the bottom (slide to top when going backward)
- `view-transition` - Via the view transitions API

### View Transition API {#view-transitions}

The View Transitions API provides a mechanism for easily creating animated transitions between different DOM states. Learn more about it in [View Transitions API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).

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

### Custom Transitions {#custom-transitions}

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

Learn more about how it works in [Vue Transition](https://vuejs.org/guide/built-ins/transition.html).

### Forward & Backward Transitions {#forward-backward-transitions}

You can specify different transitions for forward and backward navigation using `|` as a separator in the transition name:

```md
---
transition: go-forward | go-backward
---
```

With this, when you go from slide 1 to slide 2, the `go-forward` transition will be applied. When you go from slide 2 to slide 1, the `go-backward` transition will be applied.

### Advanced Usage {#advanced-usage}

The `transition` field accepts an option that will passed to the [`<TransitionGroup>`](https://vuejs.org/api/built-in-components.html#transition) component. For example:

```md
---
transition:
  name: my-transition
  enterFromClass: custom-enter-from
  enterActiveClass: custom-enter-active
---
```
