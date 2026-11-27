---
tags: [notes, presenter]
description: Automatically add `<ruby>` tags to your notes.
---

# Notes Auto Ruby

> Available since v52.4.0

When you write notes in your slides, you might want to add some ruby text to help pronouncing the some words. You can always add `<ruby>` tags to your notes manually, but Slidev also provides a convenient way to do this automatically by a global auto-replacement.

In the headmatter, you can set the `notesAutoRuby` option to a map of words to their ruby text:

```md
---
notesAutoRuby:
  日本語: ni hon go
  勉強: べんきょう
---

# Your slides here

<!--
私は日本語を勉強しています。
-->
```

And the notes will be rendered as:

<p>私は<ruby>日本語<rt>ni hon go</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しています。</p>
