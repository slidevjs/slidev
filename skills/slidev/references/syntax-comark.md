---
name: comark
description: Comark Syntax support
---

# Comark Syntax

Enhanced Markdown with component and style syntax.

## Enable

```md
---
comark: true
---
```

## Inline Styles

```md
This is a [red text]{style="color:red"}
```

## Inline Components

```md
:inline-component{prop="value"}
```

## Image Attributes

```md
![](/image.png){width=500px lazy}
```

## Block Components

```md
::block-component{prop="value"}
The **default** slot content
::
```

## Use Cases

- Add inline styles without HTML
- Use Vue components inline
- Add attributes to images
- Create complex component layouts

Based on Comark Syntax.
