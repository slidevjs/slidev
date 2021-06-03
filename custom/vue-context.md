# Vue Global Context

Slidev injected a [global Vue context](https://v3.vuejs.org/api/application-config.html#globalproperties) `$slidev` for advanced conditions or navigation controls.

## Usage

You can access it anywhere in your markdown and Vue template, with the ["Mustache" syntax](https://v3.vuejs.org/guide/template-syntax.html#interpolations).

```md
<!-- slides.md -->

# Page 1

Current page is: {{ $slidev.nav.currentPage }}
```

```html
<!-- Foo.vue -->

<template>
  <div>Title: {{ $slidev.configs.title }}</div>
  <button @click="$slidev.nav.next">Next Page</button>
</template>
```

## Properties

### `$slidev.nav`

A reactive object holding the properties and controls of the slides navigation. For examples:

```js
$slidev.nav.next() // go next step

$slidev.nav.nextSlide() // go next slide (skip v-clicks)

$slidev.nav.go(10) // go slide #10
```

```js
$slidev.nav.currentPage // current slide number

$slidev.nav.currentLayout // current layout id

$slidev.nav.clicks // current clicks count
```

For more properties available, refer to the [nav.ts](https://github.com/slidevjs/slidev/blob/main/packages/client/logic/nav.ts) exports.

### `$slidev.configs`

A reactive object holding the parsed [configurations in the first frontmatter](/custom/#frontmatter-configures) of your `slides.md`. For example

```yaml
---
title: My First Slidev!
---
```

```
{{ $slidev.configs.title }} // 'My First Slidev!'
```

### `$slidev.themeConfigs`

A reactive object holding the parsed theme configurations.

```yaml
---
title: My First Slidev!
themeConfig:
  primary: #213435
---
```

```
{{ $slidev.themeConfigs.primary }} // '#213435'
```
