---
depends:
  - guide/syntax#code-block
relates:
  - Monaco Editor: https://microsoft.github.io/monaco-editor/
  - Configure Monaco Editor: /custom/config-monaco
tags: [codeblock, editor]
description: |
  Turn code blocks into fully-featured editors, or generate a diff between two code blocks.
---

# Monaco Editor

<video src="https://github.com/slidevjs/slidev/assets/11247099/0c6ce681-80d3-4555-93bf-9288ee533462" controls rounded shadow w-full></video>

Whenever you want to do some modification in the presentation, simply add `{monaco}` after the language id — it turns the block into a fully-featured Monaco editor!

````md
```ts {monaco}
console.log('HelloWorld')
```
````

Learn more about [Configuring Monaco](/custom/config-monaco).

## Diff Editor

Monaco can also generate a diff between two code blocks. Use `{monaco-diff}` to turn the block into a [Monaco diff editor](https://microsoft.github.io/monaco-editor/playground.html?source=v0.36.1#example-creating-the-diffeditor-multi-line-example) and use `~~~` to separate the original and modified code!

````md
```ts {monaco-diff}
console.log('Original text')
~~~
console.log('Modified text')
```
````
