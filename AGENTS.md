# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

## What this is

**Cyrix Essentials** — a Minecraft Bedrock addon (Behavior Pack + Resource Pack) built on the `@minecraft/server` **Beta** Script API. It is a maintained fork of *Minecraft Essentials* by Paoeni (`mce.*` translation keys come from that project). Keep attribution intact in `scripts/Commands/general/credit.js`, the manifests, and the README.

## Repository layout

```
CyrixEssentials (BP)/     Behavior pack — the bulk of the code
  manifest.json           version = source of truth for releases
  scripts/
    load.js               module entry point (registered in manifest)
    main.js               Server bootstrap: world/commands/event wiring
    Configuration.js      main config hub (user-editable)
    Configs/              data-only config tables (e.g. MoneyEntities.js)
    Events/               world event subscriptions (entityDie, chatSend, ...)
    Commands/             one file per slash command, grouped by category
    Modules/              shared libraries (Utility, Database, Forms, ...)
  entities/ items/ texts/
CyrixEssentials (RP)/     Resource pack — UI, textures, render controllers
build_addon.sh            packages BP+RP into .mcaddon
```

## Build & versioning

- Build with `./build_addon.sh` (requires `python3`). Never hand-zip.
- The **BP `manifest.json` `header.version`** is the single source of truth; the script derives the output filename and stamps `pack.name` in both `texts/en_US.lang` files. Bump the version there (all three segments) when releasing.
- Outputs (`*.mcaddon`, `*.mcpack`) and `backups/` are gitignored — never commit builds.

## Code style

- Plain JavaScript for the QuickJS script engine — **no TypeScript, no bundler, no npm**.
- **No semicolons** in the BP scripts (dominant style); double-quoted strings; 2-space indent.
- ES modules with **default exports** and **extensionless relative imports** (`import Config from "../Configuration"`).
- Command files export a function that receives the `Server` instance and register via `Server.Commands.register({...})`.
- Config values are plain data (objects/arrays/primitives) with inline comments — server owners edit these files directly, so keep comments explanatory.
- Keep user-facing strings as translation keys (`mce.*`) from `texts/en_US.lang` where possible.

## Configuration architecture

- `scripts/Configuration.js` is the hub for switches/limits/permissions.
- Data tables that are large or independently replaceable belong in `scripts/Configs/*.js` and are imported where used (see `Configs/MoneyEntities.js`, consumed by `Events/entityDie.js`).
- In-game toggles are registered in `scripts/Modules/Setting.js` and read with `Server.Setting.get(...)`.

## Do not commit

- `.ref/` — third-party addons kept locally for reference; copyrighted material of others.
- `backups/`, `*.mcaddon`, `*.mcpack` — build artifacts.
- `omnibedrock_all_entities.md`, `furralis-craft-mobs-entities-*.md` — local server-scan notes.
- Never modify or delete `.ref/` contents as part of a task.

## License

GPL-3.0 (see LICENSE). Derivative work of Minecraft Essentials by Paoeni — preserve credit notices.
