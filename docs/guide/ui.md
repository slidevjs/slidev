---
outline: deep
---

# User Interface

## Navigation Bar {#navigation-bar}

In Play mode, move your mouse to the bottom left corner of the page, you can see the navigation bar.
![](/screenshots/navbar.png)

## Navigation Actions {#navigation-actions}

| Keyboard Shortcut                   | Button in Navigation Bar                                                              | Description                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| <kbd>f</kbd>                        | <carbon-maximize class="inline-icon-btn"/> <carbon-minimize class="inline-icon-btn"/> | toggle fullscreen                                                  |
| <kbd>right</kbd> / <kbd>space</kbd> | <carbon-arrow-right class="inline-icon-btn"/>                                         | next animation or slide                                            |
| <kbd>left</kbd>                     | <carbon-arrow-left class="inline-icon-btn"/>                                          | previous animation or slide                                        |
| <kbd>up</kbd>                       | -                                                                                     | previous slide                                                     |
| <kbd>down</kbd>                     | -                                                                                     | next slide                                                         |
| <kbd>o</kbd>                        | <carbon-apps class="inline-icon-btn"/>                                                | toggle [slides overview](#slides-overview)                         |
| <kbd>d</kbd>                        | <carbon-sun class="inline-icon-btn"/> <carbon-moon class="inline-icon-btn"/>          | toggle dark mode                                                   |
| -                                   | <carbon-user-avatar class="inline-icon-btn"/>                                         | toggle [camera view](../features/recording#camera-view)            |
| -                                   | <carbon-video class="inline-icon-btn"/>                                               | [recording](../features/recording)                                 |
| -                                   | <carbon-user-speaker class="inline-icon-btn"/>                                        | enter [presenter mode](../guide/ui#presenter-mode)                 |
| -                                   | <carbon-edit class="inline-icon-btn"/>                                                | toggle [integrated editor](../features/side-editor)                |
| -                                   | <carbon-download class="inline-icon-btn"/>                                            | download slides (only appear in [SPA build](../guide/hosting#spa)) |
| -                                   | <carbon-information class="inline-icon-btn"/>                                         | show information about the slides                                  |
| -                                   | <carbon-settings-adjust class="inline-icon-btn"/>                                     | show settings menu                                                 |
| <kbd>g</kbd>                        | -                                                                                     | show goto...                                                       |

> You can [configure the shortcuts](../custom/config-shortcuts).

## Quick Overview {#quick-overview}

By pressing <kbd>o</kbd> or clicking the <carbon-apps class="inline-icon-btn"/> button in the navigation bar, you can have the overview of your slides so you can jump between them easily.

![](/screenshots/slides-overview.png)

## Presenter Mode {#presenter-mode}

To enter the presenter mode, you can click the <carbon-user-speaker class="inline-icon-btn"/> button in the navigation panel, or visit `http://localhost:<port>/presenter`.

When giving a presentation, it's recommended to open two browser windows - one in the play mode for the audience, and another one in the presenter mode for you. Then you can share the first screen to the audience and keep the second screen for yourself.

Whenever you navigate through the slides in the presenter mode, all other opened pages will automatically follow this navigation to stay in sync with the presenter.

![](/screenshots/presenter-mode.png)

## Slide Overview {#slides-overview}

> Available since v0.48.0

<video src="https://github.com/slidevjs/slidev/assets/11247099/01bbf5b3-f916-4646-9ea4-cf269c0567cb"
controls rounded shadow></video>

You can visit an overview of all of your slides by first opening the [Quick Overview panel](#quick-overview) and then clicking the <carbon-list-boxes class="inline-icon-btn"/> on the top right, or by visiting `http://localhost:<port>/overview` directly.

The overview page gives you a linear list of all your slides, with all of your notes on the side. You can double click on the notes to edit the notes directly, and drag the clicks sliders to preview the steps in your slides.

## Drawing UI {#drawing}

See:

<LinkCard link="feature/drawing" />

## Recording UI {#recording}

See:

<LinkCard link="feature/recording"/>
