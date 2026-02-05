---
name: cli
description: Slidev command-line interface reference
---

# CLI Commands

Slidev command-line interface reference.

## Dev Server

```bash
slidev [entry]
slidev slides.md
```

Options:
| Option | Default | Description |
|--------|---------|-------------|
| `--port` | 3030 | Server port |
| `--open` | false | Open browser |
| `--remote [password]` | - | Enable remote access |
| `--bind` | 0.0.0.0 | Bind address |
| `--base` | / | Base URL path |
| `--log` | warn | Log level |
| `--force` | false | Force optimizer re-bundle |
| `--theme` | - | Override theme |

Examples:
```bash
slidev --port 8080 --open
slidev --remote mypassword
slidev --base /talks/my-talk/
```

## Build

```bash
slidev build [entry]
```

Options:
| Option | Default | Description |
|--------|---------|-------------|
| `--out` | dist | Output directory |
| `--base` | / | Base URL for deployment |
| `--download` | false | Include PDF download |
| `--theme` | - | Override theme |
| `--without-notes` | false | Exclude presenter notes |

Examples:
```bash
slidev build --base /my-repo/
slidev build --download --out public
slidev build slides1.md slides2.md  # Multiple builds
```

## Export

```bash
slidev export [entry]
```

Options:
| Option | Default | Description |
|--------|---------|-------------|
| `--output` | - | Output filename |
| `--format` | pdf | pdf / png / pptx / md |
| `--timeout` | 30000 | Timeout per slide (ms) |
| `--range` | - | Slide range (e.g., 1,4-7) |
| `--dark` | false | Export dark mode |
| `--with-clicks` | false | Include click steps |
| `--with-toc` | false | PDF table of contents |
| `--wait` | 0 | Wait ms before export |
| `--wait-until` | networkidle | Wait condition |
| `--omit-background` | false | Transparent background |
| `--executable-path` | - | Browser path |

Examples:
```bash
slidev export
slidev export --format pptx
slidev export --format png --range 1-5
slidev export --with-clicks --dark
slidev export --timeout 60000 --wait 2000
```

## Format

```bash
slidev format [entry]
```

Formats the slides markdown file.

## Theme Eject

```bash
slidev theme eject [entry]
```

Options:
| Option | Default | Description |
|--------|---------|-------------|
| `--dir` | theme | Output directory |
| `--theme` | - | Theme to eject |

Extracts theme to local directory for customization.

## npm Script Usage

In package.json:
```json
{
  "scripts": {
    "dev": "slidev",
    "build": "slidev build",
    "export": "slidev export"
  }
}
```

With arguments (note `--`):
```bash
npm run dev -- --port 8080 --open
npm run export -- --format pptx
```

## Boolean Options

```bash
slidev --open           # Same as --open true
slidev --no-open        # Same as --open false
```

## Install CLI Globally

```bash
npm i -g @slidev/cli
```
