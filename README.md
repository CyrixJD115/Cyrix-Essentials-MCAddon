# Cyrix Essentials — MC Addon

A full-featured Minecraft Bedrock essentials suite built on the Script API (Beta): economy, shops, homes, warps, teleports, land claims, ranks, combat protection, floating text, admin tools and more — all configurable from plain JavaScript files and a live in-game settings menu.

> **Fork notice:** Cyrix Essentials is a modified, extended version of [**Minecraft Essentials**](https://mcpedl.com/user/paoo/) by **Paoeni**. All credit for the original foundation belongs to Paoeni; this fork is maintained by **CyrixJD115** and released under GPL-3.

---

## Feature Overview

### 💰 Economy & Money
- Money stored on a scoreboard objective (renamable with `/moneyobjective`)
- **Mob kill rewards** — every mob can pay a fixed or random range of money (`Configs/MoneyEntities.js`), with a default payout for unlisted mobs and an exclude list
- `/pay`, `/topmoney` leaderboard, `/withdraw` (turn money into a redeemable item)
- Starter money, max money cap, custom currency prefix

### 🛒 Shops & Trading
- **`/shop`** — server item shop with categories (admin-configurable via `/shopsetting`)
- **`/sell`** — sell items from hand or whole inventory (configurable via `/sellsetting`)
- **`/auctionhouse`** — player auction house (`add` your own items, `view`/buy others')
- **Chest shops** — player-run shops on chests, both selling and buying, gated by per-rank permissions

### 🏠 Homes, Warps & Teleporting
- **Homes** — `/sethome`, `/home`, `/delhome`, `/listhome` with a configurable per-player home limit
- **Warps & spawn** — server-wide `/warp`, `/listwarp`, `/spawn` (admin: `/setwarp`, `/delwarp`)
- **Teleport asks** — `/tpa`, `/tpahere`, `/tpaccept`, `/tpacancel`, with optional accept/decline UI and a per-player opt-out (`/tpasetting`)
- **`/back`** — return to your previous location after death or teleport
- **`/rtp`** — random teleport within a configurable radius
- Every teleport supports cooldown, countdown, and money cost (configurable per command)

### 🗺️ Land Claims
- Claim land with the custom **claim wand** item (mark two corners)
- **Claim blocks** economy: claim block items (×1/×10/×100), starter claim blocks, or money-per-block pricing
- Per-land settings: custom name, join/leave messages, entry/exit notifications (ActionBar/Chat/Title)
- **Protection**: explosions, pistons, and non-member interactions; invite/kick/transfer ownership; overlap detection
- Admin land settings via `/landsetting`

### 👑 Ranks, Chat & Permissions
- Custom ranks with colors, chat format, and name-tag format (with separators)
- **Per-rank permission system**: general commands, admin commands, land permissions, and chest-shop permissions
- Default rank & default permissions for players without a rank
- Chat anti-spam cooldown + command cooldown
- Private messaging: `/message` and `/reply`
- `mute` / `unmute`

### ⚔️ Combat System (optional)
- Combat tagging: attacking or being attacked starts a combat timer
- While tagged: teleport commands blocked, banned items (e.g. ender pearls) unusable, golden apple cooldown
- Money loss on death with a configurable math expression (`deadPlayerMoney` / `killerMoney`)
- Combat logging (leaving while tagged) can drop the player's inventory

### 📊 Floating Text & HUD
- `/floatingtext-add` — plain text or **live scoreboard displays** in the world (great for top-money boards)
- `/floatingtext-edit`, `-remove`, `-clear`, `-duplicate` for management
- **`/tps`** — live server ticks-per-second readout

### 🧭 Compass Quick-Menu
- Using a compass opens a customizable quick-menu UI (buttons with icons, script-event actions)

### 🛠️ Admin Tools
- **`/adminpanel`** — admin panel UI (also available as a custom item)
- **`/invsee`** — view and edit another player's inventory remotely
- Punishments: `/kick`, `/ban`, `/unban`, `/tempban`, `/broadcast`
- **`/setting`** — live in-game settings menu: toggle any system, change economy numbers, cooldowns, costs, prefixes, join message, server info… no file edits or restarts needed
- `/resetdata` — wipe world/player data
- Gamemode shortcuts: `gmc`, `gms`, `gmsp`, `gma`
- `/teleport` to jump to any player
- `/economy <give/take/set/reset>` for balance management

### 📜 General
- `/help [command]`, `/playerlist`, `/info` (server info text), `/report`, `/calculate <expression>`, `/credit`
- Custom join message

### 🧩 For Addon Developers
Other addons can integrate through the built-in **Restful** API (HTTP-style `scriptevent` listeners):
- `registerMenuToMCE` — inject your own buttons into the compass quick-menu
- `registerCreditToMCE` — add your addon to the `/credit` list
- Script-API slash commands `mce:shop` and `mce:pay` callable from other behavior packs
- Reusable modules ship in the pack: `CommandBuilder`, `Database`, `Money`, `Ranks`, `Forms`, `Placeholder`, `FloatingText`, `ChestForms`, `Cooldown`, `EventEmitter`, and more

### 🎁 Custom Items
| Item | Purpose |
|---|---|
| `cyx_ess:adminpanel` | Opens the admin panel |
| `cyx_ess:landclaims` | Claim wand — mark land corners |
| `cyx_ess:claimblock1/10/100` | Claim block currency items |

---

## Commands

All commands use the configurable prefix (default `!`).

### General
| Command | Usage | Description |
|---|---|---|
| `help` | `help <command?>` | List commands or show one command's help |
| `playerlist` | `playerlist` | List online players |
| `tps` | `tps` | Show server TPS |
| `message` | `message <player> <message>` | Private message a player |
| `reply` | `reply <message>` | Reply to your last private message |
| `rtp` | `rtp` | Random teleport within the configured radius |
| `info` | `info` | Show the server info text |
| `calculate` | `calculate <expression>` | Evaluate a math expression |
| `report` | `report` | Report a player or issue |
| `credit` | `credit` | Show addon credits |
| `back` | `back` | Return to your previous location |

### Money
| Command | Usage | Description |
|---|---|---|
| `money` | `money <player?>` | Check a balance |
| `pay` | `pay <player> <amount>` | Send money to a player |
| `topmoney` | `topmoney` | Money leaderboard |
| `withdraw` | `withdraw <amount>` | Withdraw money into an item |
| `shop` | `shop <category?>` | Open the server shop |
| `sell` | `sell <hand/all?>` | Sell items |
| `auctionhouse` | `auctionhouse <add/view?>` | Auction house |

### Homes / Warps / TPA
| Command | Usage | Description |
|---|---|---|
| `sethome` | `sethome <name>` | Create a home |
| `home` | `home <name>` | Teleport to a home |
| `delhome` | `delhome <name>` | Delete a home |
| `listhome` | `listhome` | List your homes |
| `spawn` | `spawn` | Go to world spawn |
| `warp` | `warp <name>` | Teleport to a warp |
| `listwarp` | `listwarp` | List warps |
| `tpa` | `tpa <player>` | Ask to teleport to a player |
| `tpahere` | `tpahere <player>` | Ask a player to teleport to you |
| `tpaccept` | `tpaccept <player>` | Accept a teleport request |
| `tpacancel` | `tpacancel` | Cancel your pending request |
| `tpasetting` | `tpasetting <on/off>` | Toggle receiving requests |

### Land
| Command | Usage | Description |
|---|---|---|
| `land` | `land` | Land claim management menu |
| `landsetting` | `landsetting` | Admin land settings |

### Ranks
| Command | Usage | Description |
|---|---|---|
| `createranks` | — | Create a rank |
| `addranks` | — | Assign a rank to a player |
| `editranks` | — | Edit a rank |
| `deleteranks` | — | Delete a rank |
| `removeranks` | — | Remove a rank from a player |

### Floating Text
| Command | Usage | Description |
|---|---|---|
| `floatingtext-add` | `floatingtext-add <type: text/scoreboard>` | Create floating text |
| `floatingtext-edit` | `floatingtext-edit` | Edit existing floating text |
| `floatingtext-remove` | `floatingtext-remove` | Remove one |
| `floatingtext-clear` | `floatingtext-clear` | Remove all |
| `floatingtext-duplicate` | `floatingtext-duplicate` | Duplicate one |

### Admin
| Command | Usage | Description |
|---|---|---|
| `adminpanel` | `adminpanel` | Open the admin panel UI |
| `setting` | `setting <list \| name> <value?>` | In-game settings menu |
| `economy` | `economy <give/take/set/reset> <player> <amount>` | Manage balances |
| `moneyobjective` | `moneyobjective <name>` | Rename the money scoreboard |
| `setwarp` / `delwarp` | `setwarp <name>` / `delwarp <name>` | Manage warps |
| `broadcast` | `broadcast <message>` | Server-wide message |
| `kick` | `kick <player> <reason?>` | Kick a player |
| `ban` / `unban` | `ban <player> <reason>` / `unban <player>` | Ban management |
| `tempban` | `tempban <player> <time> <reason?>` | Timed ban |
| `mute` / `unmute` | `mute <player>` / `unmute <player>` | Chat mute |
| `inventorysee` | `invsee <player>` | View/edit a player's inventory |
| `teleport` | `teleport <player>` | Teleport to a player |
| `shopsetting` | `shopsetting <item/group> <add/edit/remove>` | Configure shop |
| `sellsetting` | `sellsetting <add/edit/remove>` | Configure sell prices |
| `resetdata` | `resetdata` | Wipe data |
| `log` | `log` | View logs |
| `gmc` / `gms` / `gmsp` / `gma` | `gmc <player?>` … | Gamemode shortcuts |

---

## In-Game Settings

`/setting` exposes **40+ live settings** without editing files: every system toggle (money, home, tpa, warp, back, rtp, shop, sell, auction, withdraw, message, combat, land), starter/max money, home limit, per-command cooldowns/countdowns/costs, chat & command cooldown, RTP range, command & currency prefixes, join message, server info, rank display options, and mob-money notifications.

---

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
