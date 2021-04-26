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
