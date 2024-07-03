---
outline: deep
---

# User Interface

## Navigation Bar

In Play mode, move your mouse to the bottom left corner of the page, you can see the navigation bar.
![](/screenshots/navbar.png)

## Navigation Actions

| Keyboard Shortcut                   | Button in Navigation Bar                                                              | Description                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| <kbd>f</kbd>                        | <carbon-maximize class="inline-icon-btn"/> <carbon-minimize class="inline-icon-btn"/> | toggle fullscreen                                                                          |
| <kbd>right</kbd> / <kbd>space</kbd> | <carbon-arrow-right class="inline-icon-btn"/>                                         | next animation or slide                                                                    |
| <kbd>left</kbd>                     | <carbon-arrow-left class="inline-icon-btn"/>                                          | previous animation or slide                                                                |
| <kbd>up</kbd>                       | -                                                                                     | previous slide                                                                             |
| <kbd>down</kbd>                     | -                                                                                     | next slide                                                                                 |
| <kbd>o</kbd>                        | <carbon-apps class="inline-icon-btn"/>                                                | toggle [slides overview](#slides-overview)                                                 |
| <kbd>d</kbd>                        | <carbon-sun class="inline-icon-btn"/> <carbon-moon class="inline-icon-btn"/>          | toggle dark mode                                                                           |
| -                                   | <carbon-user-avatar class="inline-icon-btn"/>                                         | toggle [camera view](/guide/recording#camera-view)                                         |
| -                                   | <carbon-video class="inline-icon-btn"/>                                               | [recording](/guide/recording#camera-view)                                                  |
| -                                   | <carbon-user-speaker class="inline-icon-btn"/>                                        | enter [presenter mode](/guide/presenter-mode)                                              |
| -                                   | <carbon-edit class="inline-icon-btn"/>                                                | toggle [integrated editor](/guide/editors#integrated-editor)                               |
| -                                   | <carbon-download class="inline-icon-btn"/>                                            | download slides (only appear in [SPA build](/guide/exporting#single-page-application-spa)) |
| -                                   | <carbon-information class="inline-icon-btn"/>                                         | show information about the slides                                                          |
| -                                   | <carbon-settings-adjust class="inline-icon-btn"/>                                     | show settings menu                                                                         |
| <kbd>g</kbd>                        | -                                                                                     | show goto...                                                                               |

<br>

## Quick Overview

By pressing <kbd>o</kbd> or clicking the <carbon-apps class="inline-icon-btn"/> button in the navigation bar, you can have the overview of your slides so you can jump between them easily.

![](/screenshots/slides-overview.png)

## Presenter Mode

You can click the <carbon-user-speaker class="inline-icon-btn"/> button in the navigation panel, or visit `http://localhost:<port>/presenter` manually to enter the presenter mode. To present, you may want to open two browser windows, one for the presenter and one for the audience. Generally maximizing the slideshow window on your projector screen, then controlling it from your laptop's screen is how people present with Slidev.

Whenever you navigate in the presenter mode, all other opened pages will automatically follow this navigation to stay in sync with the presenter.

![](/screenshots/presenter-mode.png)
