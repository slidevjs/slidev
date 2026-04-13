---
name: drawing
description: Draw and annotate slides during presentation
---

# Drawing & Annotations

Draw and annotate slides during presentation. Powered by drauu.

## Enable Drawing

Click the pen icon in the navigation bar or press `C`.

## Stylus Support

Stylus pens (iPad + Apple Pencil) work automatically - draw with pen, navigate with fingers.

## Persist Drawings

Save drawings as SVGs and include in exports:

```md
---
drawings:
  persist: true
---
```

Drawings saved to `.slidev/drawings/`.

## Disable Drawing

Entirely:
```md
---
drawings:
  enabled: false
---
```

Only in development:
```md
---
drawings:
  enabled: dev
---
```

Only in presenter mode:
```md
---
drawings:
  presenterOnly: true
---
```

## Sync Settings

Disable sync across instances:

```md
---
drawings:
  syncAll: false
---
```

Only presenter's drawings sync to others.
