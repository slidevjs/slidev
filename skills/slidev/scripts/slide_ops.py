#!/usr/bin/env python3
"""Reorder or remove slides in slides.md by 1-based slide number.

Usage:
  python3 .claude/skills/slidev/swap_slides.py swap N M          # swap slides N and M
  python3 .claude/skills/slidev/swap_slides.py move N after M    # move slide N to after slide M
  python3 .claude/skills/slidev/swap_slides.py move N before M   # move slide N to before slide M
  python3 .claude/skills/slidev/swap_slides.py remove N          # delete slide N
"""
import re
import sys
from pathlib import Path

SLIDES_FILE = Path(__file__).parent.parent.parent.parent.parent / "slides.md"


def is_yaml_line(line):
    return bool(re.match(r"^\s*[a-zA-Z_]\w*\s*:", line)) or line.strip() == ""


def parse_chunks(text):
    """
    Split Slidev markdown into chunks.

    chunks[0]      = global frontmatter (first ---...--- block, not a slide)
    chunks[1..N]   = each slide: its separator block + content up to the next separator

    Handles both simple separators (---) and compound ones (---\\nyaml\\n---).
    """
    lines = text.splitlines(True)
    n = len(lines)
    i = 0

    def read_separator(pos):
        """Read a separator starting at pos. Returns (sep_text, next_pos)."""
        assert lines[pos].rstrip("\n") == "---"
        j = pos + 1
        while j < n and lines[j].rstrip("\n") != "---":
            j += 1
        yaml_candidate = lines[pos + 1 : j]
        if j < n and yaml_candidate and all(is_yaml_line(l) for l in yaml_candidate):
            sep = "".join(lines[pos : j + 1])
            return sep, j + 1
        else:
            return lines[pos], pos + 1

    chunks = []

    sep, i = read_separator(0)
    chunks.append(sep)  # chunks[0] = frontmatter

    while i < n:
        if lines[i].rstrip("\n") == "---":
            sep, i = read_separator(i)
            content_start = i
            while i < n and lines[i].rstrip("\n") != "---":
                i += 1
            chunks.append(sep + "".join(lines[content_start:i]))
        else:
            content_start = i
            while i < n and lines[i].rstrip("\n") != "---":
                i += 1
            chunks.append("".join(lines[content_start:i]))

    return chunks


def cmd_swap(chunks, a, b):
    total = len(chunks) - 1
    if not (1 <= a <= total and 1 <= b <= total):
        print(f"Error: slide numbers must be between 1 and {total} (got {a}, {b})")
        sys.exit(1)
    if a == b:
        print("Nothing to do (same slide number).")
        sys.exit(0)
    chunks[a], chunks[b] = chunks[b], chunks[a]
    print(f"Swapped slides {a} and {b}.")


def cmd_move(chunks, n, direction, m):
    total = len(chunks) - 1
    if not (1 <= n <= total and 1 <= m <= total):
        print(f"Error: slide numbers must be between 1 and {total} (got {n}, {m})")
        sys.exit(1)

    slides = chunks[1:]
    slide = slides.pop(n - 1)

    if direction == "after":
        target_idx = (m - 1) if m > n else m
    else:  # before
        target_idx = (m - 2) if m > n else m - 1

    target_idx = max(0, min(target_idx, len(slides)))
    slides.insert(target_idx, slide)
    chunks[1:] = slides

    new_pos = target_idx + 1
    print(f"Moved slide {n} to position {new_pos} ({direction} slide {m}).")


def cmd_remove(chunks, n):
    total = len(chunks) - 1
    if not (1 <= n <= total):
        print(f"Error: slide number must be between 1 and {total} (got {n})")
        sys.exit(1)
    chunks.pop(n)
    print(f"Removed slide {n} (was 1 of {total}, now {total - 1} slides total).")


def main():
    args = sys.argv[1:]

    text = SLIDES_FILE.read_text(encoding="utf-8")
    chunks = parse_chunks(text)

    if len(args) == 2 and args[0] == "remove":
        try:
            n = int(args[1])
        except ValueError:
            print(f"Usage: {sys.argv[0]} remove N")
            sys.exit(1)
        cmd_remove(chunks, n)

    elif len(args) == 3 and args[0] == "swap":
        try:
            a, b = int(args[1]), int(args[2])
        except ValueError:
            print(f"Usage: {sys.argv[0]} swap N M")
            sys.exit(1)
        cmd_swap(chunks, a, b)

    elif len(args) == 4 and args[0] == "move" and args[2] in ("after", "before"):
        try:
            n, m = int(args[1]), int(args[3])
        except ValueError:
            print(f"Usage: {sys.argv[0]} move N after|before M")
            sys.exit(1)
        cmd_move(chunks, n, args[2], m)

    else:
        print(__doc__)
        sys.exit(1)

    SLIDES_FILE.write_text("".join(chunks), encoding="utf-8")


if __name__ == "__main__":
    main()
