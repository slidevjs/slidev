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
<div v-click class="p-2 text-xl">

Hey!

</div>
```

### `v-after`

The usage of `v-after` is similar to `v-click` but it will turn the element visible right after the previous `v-click` gets triggered

```md
<div v-click>Hello</div>
<div v-after>World</div>
```

When you click the "next" button, both `Hello` and `World` will show up together.

### `v-clicks`

`v-clicks` is only provided as a component. It's a shorthand to apply the `v-click` directive to all its child elements. This is useful when working with lists.

```md
<v-clicks>

- Item 1
- Item 2
- Item 3
- Item 4

</v-clicks>
```

An item will become visible accordingly whenever you click "next".

### Custom Clicks Count

By default, Slidev can smartly count how many steps are needed before going next slide. And you can override it by passing the `clicks` frontmatter option:

```yaml
---
# 10 clicks in this slide, before going to the next
clicks: 10
---
```

### Ordering

By passing the click index to your directives, you can customize the order of the revealing

```md
<!-- "1" go first -->
<div v-click>1</div>
<div v-click>2</div>
<div v-click>3</div>
```

```md
<!-- "3" go first, then "2" -->
<div v-click="3">1</div>
<div v-click="2">2</div>
<div v-click="1">3</div>
```

## Transitions

The built-in support for slides and elements transitions is NOT provided in the current version. We are planned add it in the next major version. Before that, you can still use your custom styles and libraries to do that.
