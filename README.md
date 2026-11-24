# Cyrix Essentials — MC Addon

A Minecraft Bedrock essentials plugin built on the Script API (Beta): economy, homes, warps, teleports, land claims, shops, ranks and more — all configurable from plain JavaScript files.

> **Fork notice:** Cyrix Essentials is a modified, extended version of [**Minecraft Essentials**](https://mcpedl.com/user/paoo/) by **Paoeni**. All credit for the original foundation belongs to Paoeni; this fork is maintained by **CyrixJD115** and released under GPL-3.

## Features

- **Economy** — money scoreboard, mob kill rewards, `/pay`, `/topmoney`, `/withdraw`, max-money cap
- **Shops** — `/shop`, `/sell`, `/auctionhouse`, player-run chest shops
- **Homes & teleports** — `/sethome` `/home` `/delhome` `/listhome`, warps + spawn, `/tpa` `/tpahere`, `/back`, `/rtp`
- **Land claims** — claim blocks, land permissions, explosion/piston protection
- **Ranks & chat** — custom ranks, chat formatting, name tags, per-rank permissions
- **Combat logging** — combat tag timers, money loss on death, banned combat items
- **Admin tools** — admin panel, ban/mute/kick, floating text, economy control, `/invsee`

## Requirements

| | |
|---|---|
| Minecraft | Bedrock **1.26.30+** |
| Experimental toggle | **Beta APIs** must be enabled |
| Dependencies | `@minecraft/server` 2.12.0-beta, `@minecraft/server-ui` 2.4.0-beta |

## Installation

1. Download the latest `CyrixEssentials <version>.mcaddon` (from [Releases](https://github.com/CyrixJD115/Cyrix-Essentials-MCAddon/releases) or MCPEDL).
2. Open it with Minecraft — both packs import automatically.
3. In your world settings, enable **Beta APIs**, then activate the **CyrixEssentials (BP)** and **(RP)** packs.

## Configuration

All configuration lives in the behavior pack's `scripts/` folder:

| File | What it controls |
|---|---|
| `scripts/Configuration.js` | Main hub — systems on/off, command toggles, cooldowns, permissions, ranks, land settings, economy basics |
| `scripts/Configs/MoneyEntities.js` | Per-entity money payouts (see below) |

### Mob money payouts (`Configs/MoneyEntities.js`)

Each mob maps to either a **fixed amount** or a **random range**:

```js
"minecraft:cow": [1, 5],   // random 1–5
"minecraft:witch": 40,     // always 40
"minecraft:creeper": { min: 25, max: 55 }  // same as the array form
```

Special keys:

```js
default: [1, 3],   // payout for mobs NOT listed (0 = pay nothing, null = only listed mobs pay)
exclude: [         // never pay, even via default
  "minecraft:player",
  "minecraft:armor_stand"
]
```

Other money behavior switches (`earnMoneyfromMobs`, `notifyEarnMoneyInChat`, `maxMoney`, `starterMoney`, `currencyPrefix`) stay in `Configuration.js`.

## Building from source

```bash
./build_addon.sh
```

The version in `CyrixEssentials (BP)/manifest.json` is the single source of truth — it names the output `.mcaddon` and is stamped into the in-game pack names on every build. Requires `python3`.

## License

This project is licensed under the [GNU GPL-3.0](LICENSE).

Credits:

- **Paoeni** — original Minecraft Essentials
- **CyrixJD115** — Cyrix Essentials fork & extensions
