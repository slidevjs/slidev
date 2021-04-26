# Components

## Built-in Components

> TODO:

<Tweet :id="20" />

## Custom Components

Create a directory `components/` under your project root, and simply put your custom Vue components under it, then you can use it with the same name in your markdown file!

```
components/
  MyComponent.vue
  FooBar.vue
```

```md
<!-- slides.md -->

Use your component: 

<MyComponent :prop="1"/>

This also works:

<foo-bar />
```

## Theme-provided Components

> TODO:

Check more in the [directory structure](/custom/dir-structure) section.
