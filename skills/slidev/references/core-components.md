---
name: components
description: Ready-to-use components in Slidev
---

# Built-in Components

Ready-to-use components in Slidev.

## Navigation

### Link

Navigate to slide:
```md
<Link to="5">Go to slide 5</Link>
<Link to="intro">Go to intro</Link>  <!-- with routeAlias -->
```

### SlideCurrentNo / SlidesTotal

```md
Slide <SlideCurrentNo /> of <SlidesTotal />
```

### Toc (Table of Contents)

```md
<Toc />
<Toc maxDepth="2" />
<Toc columns="2" />
```

Props:
- `columns` - Number of columns
- `maxDepth` / `minDepth` - Heading depth filter
- `mode` - 'all' | 'onlyCurrentTree' | 'onlySiblings'

### TitleRenderer

Render slide title:
```md
<TitleRenderer no="3" />
```

## Animations

### VClick / VClicks

```md
<VClick>Shows on click</VClick>

<VClicks>

- Item 1
- Item 2

</VClicks>
```

### VAfter

```md
<VClick>First</VClick>
<VAfter>Shows with first</VAfter>
```

### VSwitch

```md
<VSwitch>
  <template #1>State 1</template>
  <template #2>State 2</template>
</VSwitch>
```

## Drawing

### Arrow

```md
<Arrow x1="10" y1="10" x2="100" y2="100" />
<Arrow x1="10" y1="10" x2="100" y2="100" two-way />
```

Props: `x1`, `y1`, `x2`, `y2`, `width`, `color`, `two-way`

### VDragArrow

Draggable arrow:
```md
<VDragArrow />
```

## Layout

### Transform

Scale elements:
```md
<Transform :scale="0.5">
  <LargeContent />
</Transform>
```

Props: `scale`, `origin`

### AutoFitText

Auto-sizing text:
```md
<AutoFitText :max="200" :min="50" modelValue="Hello" />
```

## Media

### SlidevVideo

```md
<SlidevVideo v-click autoplay controls>
  <source src="/video.mp4" type="video/mp4" />
</SlidevVideo>
```

Props: `controls`, `autoplay`, `autoreset`, `poster`, `timestamp`

### Youtube

```md
<Youtube id="dQw4w9WgXcQ" />
<Youtube id="dQw4w9WgXcQ" width="600" height="400" />
```

### Tweet

```md
<Tweet id="1423789844234231808" />
<Tweet id="1423789844234231808" :scale="0.8" />
```

## Conditional

### LightOrDark

```md
<LightOrDark>
  <template #dark>Dark mode content</template>
  <template #light>Light mode content</template>
</LightOrDark>
```

### RenderWhen

```md
<RenderWhen context="presenter">
  Only in presenter mode
</RenderWhen>
```

Context values:
- `main` - Main presentation view
- `visible` - Visible slides
- `print` - Print/export mode
- `slide` - Normal slide view
- `overview` - Overview mode
- `presenter` - Presenter mode
- `previewNext` - Next slide preview

## Branding

### PoweredBySlidev

```md
<PoweredBySlidev />
```

## Draggable

### VDrag

```md
<VDrag pos="myElement">
  Draggable content
</VDrag>
```

See [draggable](draggable.md) for details.

## Component Auto-Import

Components from these sources are auto-imported:
1. Built-in components
2. Theme components
3. Addon components
4. `./components/` directory

No import statements needed.
