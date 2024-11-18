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

```bash [npm]
npm run dev -- --remote
# i.e. slidev --remote
```

```bash [pnpm]
pnpm dev -- --remote
# i.e. slidev --remote
```

```bash [yarn]
yarn dev --remote
# i.e. slidev --remote
```

:::

## Password Protection

If you want to share your slides but don't want other people to access the presenter mode, you can pass a password to the option, i.e. `--remote=your_password`. Then the password is required when accessing the presenter mode.

## Remote Tunnel

You can open a [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) to expose your local server to the internet. This way, you can share your slides with others without setting up a server.

::: code-group

```bash [npm]
npm run dev -- --remote --tunnel
# i.e. slidev --remote --tunnel
```

```bash [pnpm]
pnpm dev -- --remote --tunnel
# i.e. slidev --remote --tunnel
```

```bash [yarn]
yarn dev --remote --tunnel
# i.e. slidev --remote --tunnel
```

:::
