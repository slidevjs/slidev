export const defaultContent = `---
theme: default
title: Welcome to Slidev Playground
---

# Welcome to Slidev

Presentation slides for developers

---

## What is Slidev?

Slidev is a slides maker and presenter designed for developers.

- Write slides in **Markdown**
- Style with themes and CSS
- Interactive code snippets
- Export to PDF, PNG, or host as SPA

---

## Code Blocks

\`\`\`typescript
interface User {
  name: string
  role: 'admin' | 'user'
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}
\`\`\`

---

## Lists & Formatting

### Ordered Steps

1. Write your slides in Markdown
2. Run \`slidev\` to start the dev server
3. Present or export

### Key Features

- **Bold** and *italic* text
- \`inline code\` snippets
- [Links](https://sli.dev) work too
- Math: $E = mc^2$

---

## Two Columns

You can organize content however you like.

| Feature | Status |
|---------|--------|
| Markdown | Supported |
| Code Highlighting | Supported |
| Themes | Supported |
| Animations | Coming Soon |

---

## Images & Media

> Slidev makes it easy to create beautiful presentations
> using just Markdown. No more fighting with PowerPoint!

### Try it yourself

Edit the markdown on the left and see your slides update in real-time.

---

# Thank You!

Start editing to create your own slides.

[Learn more at sli.dev](https://sli.dev)
`
