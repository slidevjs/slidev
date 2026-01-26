# Skills Generation Information

This document contains information about how these skills were generated and how to keep them synchronized with the documentation.

## Generation Details

**Generated from documentation at:**
- **Commit SHA**: `9d30081469cd7ed08586bb8973649a88567cfa25`
- **Short SHA**: `9d300814`
- **Date**: 2026-01-13 15:41:28 +0900
- **Version**: v52.11.3
- **Commit**: chore: release v52.11.3

**Source documentation:**
- Main docs: `/docs` folder

**Generation date**: 2026-01-26

## Structure

```
skills/
├── GENERATION.md               # This file
└── slidev/
    ├── SKILL.md                # Table-based reference to all features
    └── references/             # Agent-optimized reference files
```

## File Naming Convention

Files are prefixed by category:
- `core-*` - Core documentation (syntax, config, CLI, etc.)
- `code-*` - Code block features
- `editor-*` - Editor integrations
- `diagram-*` - Diagram and math support
- `layout-*` - Layout and positioning
- `style-*` - Styling features
- `animation-*` - Animation features
- `syntax-*` - Markdown syntax extensions
- `presenter-*` - Presenter mode features
- `build-*` - Build and export features
- `tool-*` - CLI tools
- `api-*` - API and hooks

## How Skills Were Generated

The Slidev skills were created by:

1. **Reading all documentation** from `/docs` folder:
   - `/docs/guide/*.md` - Core guides (syntax, animations, layouts, etc.)
   - `/docs/builtin/*.md` - Built-in features (CLI, components, layouts)
   - `/docs/features/*.md` - Individual features (43 files)
   - `/docs/custom/*.md` - Customization options

2. **Creating table-based SKILL.md**: Main skill file with:
   - Quick start and basic syntax
   - Core references table (syntax, animations, config, CLI, etc.)
   - Feature reference tables by category
   - Links to detailed reference files

3. **Creating core documentation references** (10 files):
   - `core-syntax.md` - Markdown syntax from guide/syntax.md
   - `core-animations.md` - Animation system from guide/animations.md
   - `core-headmatter.md` - Deck config from custom/index.md
   - `core-frontmatter.md` - Per-slide config from custom/index.md
   - `core-cli.md` - CLI commands from builtin/cli.md
   - `core-components.md` - Built-in components from builtin/components.md
   - `core-layouts.md` - Built-in layouts from builtin/layouts.md
   - `core-exporting.md` - Export options from guide/exporting.md
   - `core-hosting.md` - Deployment from guide/hosting.md
   - `core-global-context.md` - Navigation API from guide/global-context.md

4. **Creating feature references** (41 files):
   - Each feature from `/docs/features/` rewritten for agent consumption
   - Concise, actionable format
   - Clear code examples
   - No unnecessary prose
   - Prefixed by category

## Updating Skills (For Future Agents)

When Slidev documentation changes, follow these steps to update the skills:

### 1. Check for Documentation Changes

```bash
# Get changes in docs since generation
git diff sha_of_last_generation..HEAD -- docs/

# List changed files
git diff --name-only sha_of_last_generation..HEAD -- docs/

# Get summary of changes
git log --oneline sha_of_last_generation..HEAD -- docs/
```

### 2. Identify What Changed

Focus on these documentation areas:
- `/docs/guide/` - Core concepts and workflows
- `/docs/builtin/` - Built-in features (CLI, components, layouts)
- `/docs/features/` - Individual features
- `/docs/custom/` - Configuration and customization

### 3. Update Skills

**For minor changes** (typos, clarifications, small additions):
- Update the relevant section in `SKILL.md`
- Update corresponding file in `references/` if needed

**For major changes**:
- Read the changed documentation files
- Update `SKILL.md` sections:
  - Add new changes to appropriate sections
  - Update examples if APIs changed
  - Add to "Common Patterns" if applicable
- Update or add files in `references/`

**For new features**:
- Add documentation file to `references/` with appropriate prefix
  - Do not just copy the file from the docs, rewrite it for agent consumption
- Add entry in `SKILL.md` with:
  - Brief description in relevant section
  - Code example
  - Best practices if applicable
  - Reference to detailed docs

### 4. Incremental Sync Process

```bash
# 1. Check what docs changed
git diff sha_of_last_generation..HEAD -- docs/ > docs_changes.patch

# 2. Review the changes
cat docs_changes.patch

# 4. Update references based on changes

# 5. Update SKILL.md based on changes

# 6. Update this file with new SHA
git rev-parse HEAD  # Get new SHA
# Update GENERATION.md with new SHA
```

### 5. Sync Checklist

- [ ] Read diff of docs since last generation
- [ ] Identify new features added
- [ ] Identify changed/deprecated features
- [ ] Update `SKILL.md` with changes:
  - [ ] Add new features to appropriate sections
  - [ ] Update changed examples
  - [ ] Remove deprecated features
  - [ ] Update best practices if needed
- [ ] Update `references/` folder:
  - [ ] Add new feature docs with category prefix
  - [ ] Update changed feature docs
  - [ ] Remove deprecated feature docs
- [ ] Update `index.md` if files added/removed
- [ ] Update this `GENERATION.md` with new SHA

## Maintenance Notes

### Key Sections to Keep Updated

1. **Core Concepts** - Only update for fundamental changes
2. **Best Practices** - Update when new patterns emerge
3. **Common Patterns** - Add new patterns as documentation shows them
4. **Configuration** - Update when new options added
5. **Troubleshooting** - Add new issues/solutions as they appear
6. **References** - Always keep in sync with `/docs/features/`

### When to Regenerate Completely

Consider full regeneration when:
- Major version update (v1.x → v2.x)
- Complete documentation restructure
- Multiple breaking changes
- More than 30% of docs changed

### Style Guidelines

When updating, maintain style:
- Practical, actionable guidance
- ✅ Good vs ❌ Bad examples
- Focus on common use cases
- Concise explanations
- Real-world patterns
- Reference detailed docs for deep dives

## Version History

| Date       | SHA      | Version   | Changes |
|------------|----------|-----------|---------|
| 2026-01-26 | 9d300814 | v52.11.3  | Initial generation from docs |

## Agent Instructions Summary

**For future agents updating these skills:**

1. Run `git diff sha_of_last_generation..HEAD -- docs/` to see all documentation changes
2. Read changed files to understand what's new or modified
3. Update `SKILL.md` by:
   - Adding new features to appropriate sections
   - Updating examples for changed APIs
   - Removing deprecated features
   - Adding new best practices or patterns
4. Sync `references/` folder with `/docs/features/`
5. Update this file with new SHA and version
6. Test that skill content is accurate and follows style

**Remember**: The goal is incremental updates, not complete rewrites. Only change what needs to change based on documentation diffs.

## Questions?

If you're unsure about whether changes warrant updates:
- **Small changes** (typos, clarifications): Optional, can skip
- **New features**: Must add to skills
- **Changed APIs**: Must update examples
- **Deprecated features**: Must remove or mark as deprecated
- **New best practices**: Should add to relevant sections

---

Last updated: 2026-01-26
Current SHA: 9d300814
