---
relates:
  - guide/ui
  - CLI: builtin/cli
  - Cloudflare Quick Tunnels: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
tags: [remote, tool]
description: |
  Access your presentation remotely with Slidev's remote access feature.
---

# Remote Access

You can run your presentation with remote access by using the `--remote` flag:

::: code-group

```bash [pnpm]
pnpm dev --remote
# i.e. slidev --remote
```

```bash [npm]
npm run dev -- --remote
# i.e. slidev --remote
```

```bash [yarn]
yarn dev --remote
# i.e. slidev --remote
```

```bash [bun]
bun dev --remote
# i.e. slidev --remote
```

```bash [deno]
deno run dev --remote
# i.e. slidev --remote
```

:::

## Password Protection

If you want to share your slides but don't want other people to access the presenter mode, you can pass a password to the option, i.e. `--remote=your_password`. Then the password is required when accessing the presenter mode.

## Multiple Presenters

When multiple presenter views are connected to the same remote session, Slidev keeps one active presenter driver. Only the active driver publishes navigation changes to the synced deck, so accidental key presses from other presenter laptops won't move the audience view.

Use the presenter toolbar's driver button to see whether you are controlling the synced deck, or click it to take over. You can add a label to presenter URLs with `?presenter=alice` or `?driver=alice`; the label is shown to other presenter views when you are the active driver.

## Remote Tunnel

You can open a [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) to expose your local server to the internet. This way, you can share your slides with others without setting up a server.

::: code-group

```bash [pnpm]
pnpm dev --remote --tunnel
# i.e. slidev --remote --tunnel
```

```bash [npm]
npm run dev -- --remote --tunnel
# i.e. slidev --remote --tunnel
```

```bash [yarn]
yarn dev --remote --tunnel
# i.e. slidev --remote --tunnel
```

```bash [bun]
bun dev --remote --tunnel
# i.e. slidev --remote --tunnel
```

```bash [deno]
deno run dev --remote --tunnel
# i.e. slidev --remote --tunnel
```

:::
