---
name: remote-access
description: Share presentation across network or internet
---

# Remote Access

Share presentation across network or internet.

## Enable Remote Access

```bash
slidev --remote
```

## Password Protection

```bash
slidev --remote=your_password
```

Password required for presenter mode access.

## Remote Tunnel

Expose to internet via Cloudflare Quick Tunnels:

```bash
slidev --remote --tunnel
```

Creates public URL for sharing without server setup.

## Use Cases

- Control presentation from phone/tablet
- Multiple presenters
- Remote presentations
- Live streaming
- Audience viewing on their devices
