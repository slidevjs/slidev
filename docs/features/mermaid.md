---
layout: feature
relates:
  - Mermaid: https://mermaid-js.github.io/mermaid/
  - Mermaid Live Editor: https://mermaid-js.github.io/mermaid-live-editor/
description: |
  Create diagrams/graphs from textual descriptions, powered by Mermaid.
---

# Mermaid.js Diagrams

You can also create diagrams/graphs from textual descriptions in your Markdown, powered by [Mermaid](https://mermaid-js.github.io/mermaid).

Code blocks marked as `mermaid` will be converted to diagrams, for example:

````md
```mermaid
sequenceDiagram
  Alice->John: Hello John, how are you?
  Note over Alice,John: A typical interaction
```
````

You can further pass an options object to it to specify the scaling and theming. The syntax of the object is a JavaScript object literal, you will need to add quotes (`'`) for strings and use comma (`,`) between keys.

````md
```mermaid {theme: 'neutral', scale: 0.8}
graph TD
B[Text] --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
```
````

Learn more: [Demo](https://sli.dev/demo/starter/12) | [Mermaid](https://mermaid-js.github.io/mermaid)
