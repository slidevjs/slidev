# Animations

## Click Animations

### `v-click`

To apply "click animations" for elements, you can use the `v-click` directive or `<v-click>` components

```md
# Hello

<!-- Component usage: this will be invisible until you press "next" -->
<v-click>

Hello World

</v-click>

<!-- Directive usage: this will be invisible until you press "next" the second time -->
<div v-click class="text-xl p-2">

Hey!

</div>
```

### `v-after`

The usage of `v-after` is similar to `v-click` but it will turn the element visible when the previous `v-click` is triggered.

```md
<div v-click>Hello</div>
<div v-after>World</div>
```

When you click the "next" button, both `Hello` and `World` will show up together.

### `v-clicks`

`v-clicks` is only provided as a component. It's a shorthand to apply the `v-click` directive to all its child elements. It is especially useful when working with lists.

```md
<v-clicks>

- Item 1
- Item 2
- Item 3
- Item 4

</v-clicks>
```

An item will become visible each time you click "next".

### Custom Clicks Count

By default, Slidev counts how many steps are needed before going to the next slide. You can override this setting by passing the `clicks` frontmatter option:

```yaml
---
# 10 clicks in this slide, before going to the next
clicks: 10
---
```

### Ordering

Passing the click index to your directives, you can customize the order of the revealing

```md
<div v-click>1</div>
<div v-click>2</div>
<div v-click>3</div>
```

```md
<!-- the order is reversed -->
<div v-click="3">1</div>
<div v-click="2">2</div>
<div v-click="1">3</div>
```

```md
---
clicks: 3
---

<!-- visible after 3 clicks -->
<v-clicks at="3">
  <div>Hi</div>
</v-clicks>
```

## Transitions

The built-in support for slides and elements transitions is NOT YET provided in the current version. We are planning to add support for them in the next major version. Before that, you can still use your custom styles and libraries to do that.
