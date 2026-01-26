---
name: rough-marker
description: Hand-drawn style highlighting using Rough Notation
---

# Rough Markers

Hand-drawn style highlighting using Rough Notation.

## v-mark Directive

```html
<span v-mark>Important text</span>
```

## Marker Types

```html
<span v-mark.underline>Underlined</span>
<span v-mark.circle>Circled</span>
<span v-mark.highlight>Highlighted</span>
<span v-mark.strike-through>Struck through</span>
<span v-mark.box>Boxed</span>
```

## Colors

```html
<span v-mark.red>Red marker</span>
<span v-mark.blue>Blue marker</span>
```

Custom color:
```html
<span v-mark="{ color: '#234' }">Custom color</span>
```

## Click Timing

Works like v-click:

```html
<span v-mark="5">Appears on click 5</span>
<span v-mark="'+1'">Next click</span>
```

## Full Options

```html
<span v-mark="{ at: 5, color: '#234', type: 'circle' }">
  Custom marker
</span>
```
