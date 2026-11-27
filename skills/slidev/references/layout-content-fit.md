---
name: content-fit
description: Keep dense diagrams, tables, code, and text within the visible slide canvas
---

# Content Fit

Keep generated or content-heavy slides readable inside the visible canvas.

Use this reference when a slide contains large diagrams, wide tables, long code blocks, dense bullet lists, screenshots, or imported content.

## Decision Order

1. Split independent ideas into multiple slides before scaling.
2. Pick a layout that matches the structure, such as `two-cols`, `two-cols-header`, `image-left`, or `image-right`.
3. Put only the oversized element inside `<Transform>` when a single diagram, table, image, or component is too large.
4. Use code `maxHeight` when the goal is to keep a long snippet available with scrolling.
5. Rewrite wide tables before scaling: reduce columns, split rows into multiple slides, or convert records into lists.
6. Use slide-level `zoom` only after structure and local constraints are chosen.
7. Verify the rendered slide in the browser or exported artifact, not just Markdown syntax.

## Dense Text

- Prefer one claim per slide.
- Keep headings short.
- Split long bullet lists by topic or progression.
- Use speaker notes for details that do not need to be visible.

## Mermaid And Diagrams

- Shorten labels before reducing scale.
- Split a large graph into smaller subgraphs or sequential slides.
- Change diagram direction when width is the limiting dimension.
- Wrap the rendered diagram in `<Transform>` when only the diagram needs scaling.
- Avoid shrinking the whole slide when surrounding text is already readable.

## Tables

Wide Markdown tables are a common source of overflow.

- Keep only comparison-critical columns visible.
- Move low-priority columns into notes or follow-up slides.
- Split long row sets across slides.
- Convert key-value rows into definition lists or bullet groups when a table would become unreadable.
- If a table must stay intact, put the table in a local `<Transform>` and check the exported result.

## Code

- Use focused snippets instead of complete files.
- Use code highlighting steps to reveal only the important lines.
- Use `{maxHeight:'...'}` for scrollable code when the full snippet must remain available.
- Split setup, core logic, and edge cases into separate slides.

## When To Use `zoom`

Use `zoom` for whole-slide density mismatch, not as the first fix for one oversized object.

Good uses:

- A slide has many balanced regions that all need slightly more room.
- A generated deck needs a conservative per-slide scale after structural cleanup.

Avoid:

- Making normal text unreadable to fit a single diagram.
- Hiding a bad table shape by shrinking the whole slide.
- Applying one fixed zoom value to every dense slide without checking the rendered output.

## Verification Checklist

- No visible content is clipped by the slide edge.
- Important text remains readable.
- Code, Mermaid, and tables fit in the exported PDF/PNG or hosted build.
- Local transforms do not overlap neighboring slots.
- Speaker notes contain details removed from the visible slide.
