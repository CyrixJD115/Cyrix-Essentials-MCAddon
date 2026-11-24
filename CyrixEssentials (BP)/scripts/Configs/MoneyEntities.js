/**
 * Entity Money Values
 *
 * Kept out of Configuration.js so the mob payout table can be edited
 * (or replaced by other addons) without touching the rest of the config.
 *
 * Value formats, per entity:
 *   5                  -> fixed amount, always pays 5
 *   [1, 5]             -> random between 1 and 5 (inclusive)
 *   { min: 1, max: 5 } -> same as the array form
 *
 * Special keys:
 *   default -> payout for entities NOT listed below.
 *              0 or [0, 0] = unlisted entities pay nothing,
 *              null = only explicitly listed entities pay.
 *   exclude -> entity IDs that never pay money, even through default.
 *              (Players are excluded so PvP kills don't farm money.)
 */

const MoneyEntities = {
  default: [1, 3],

  exclude: [
    "minecraft:player",
    "minecraft:armor_stand",
    "minecraft:npc"
  ],

  mobs: {
    // Passive / farm animals
    "minecraft:pig": [1, 5],
    "minecraft:cow": [1, 5],
    "minecraft:mooshroom": [1, 5],
    "minecraft:sheep": [1, 5],
    "minecraft:chicken": [1, 5],
    "minecraft:rabbit": [1, 5],
    "minecraft:horse": [1, 5],
    "minecraft:donkey": [1, 5],
    "minecraft:mule": [1, 5],
    "minecraft:llama": [1, 5],
    "minecraft:trader_llama": [1, 5],
    "minecraft:camel": [1, 5],
    "minecraft:strider": [1, 5],
    "minecraft:cat": [1, 5],
    "minecraft:ocelot": [1, 5],
    "minecraft:parrot": [1, 5],
    "minecraft:fox": [1, 5],
    "minecraft:frog": [1, 5],
    "minecraft:tadpole": [1, 5],
    "minecraft:axolotl": [1, 5],
    "minecraft:allay": [1, 5],
    "minecraft:sniffer": [1, 5],
    "minecraft:armadillo": [1, 5],
    "minecraft:happy_ghast": [1, 5],
    "minecraft:snow_golem": [1, 5],

    // Water animals
    "minecraft:cod": [1, 5],
    "minecraft:salmon": [1, 5],
    "minecraft:pufferfish": [1, 5],
    "minecraft:tropicalfish": [1, 5],
    "minecraft:squid": [1, 5],
    "minecraft:glow_squid": [1, 5],

    // Neutral (fight back when provoked)
    "minecraft:bee": [3, 10],
    "minecraft:wolf": [3, 10],
    "minecraft:panda": [3, 10],
    "minecraft:polar_bear": [3, 10],
    "minecraft:dolphin": [3, 10],
    "minecraft:goat": [3, 10],
    "minecraft:villager": [3, 10],
    "minecraft:wandering_trader": [3, 10],
    "minecraft:zombified_piglin": [20, 50], // was minecraft:zombie_pigman (renamed by Minecraft)
    "minecraft:enderman": [20, 50],

    // Hostile
    "minecraft:zombie": [20, 50],
    "minecraft:husk": [20, 50],
    "minecraft:zombie_villager": [20, 50],
    "minecraft:zombie_villager_v2": [20, 50],
    "minecraft:skeleton": [20, 50],
    "minecraft:stray": [20, 50],
    "minecraft:bogged": [20, 50],
    "minecraft:silverfish": [5, 10],
    "minecraft:blaze": [20, 50],
    "minecraft:pillager": [20, 50],
    "minecraft:vindicator": [20, 50],
    "minecraft:vex": [20, 50],
    "minecraft:evocation_illager": [20, 50],
    "minecraft:slime": [20, 50],
    "minecraft:magma_cube": [20, 50],
    "minecraft:drowned": [20, 50],
    "minecraft:guardian": [20, 50],
    "minecraft:iron_golem": [20, 50],
    "minecraft:spider": [20, 50],
    "minecraft:cave_spider": [20, 50],
    "minecraft:endermite": [20, 50],
    "minecraft:piglin": [20, 50],
    "minecraft:piglin_brute": [20, 50],
    "minecraft:zoglin": [20, 50],
    "minecraft:hoglin": [20, 50],
    "minecraft:shulker": [20, 50],
    "minecraft:phantom": [20, 50],
    "minecraft:wither_skeleton": [20, 50],
    "minecraft:ghast": [20, 50],
    "minecraft:zombie_pigman": [20, 50], // kept for older worlds / addons that still spawn the legacy ID

    // Elite hostile
    "minecraft:creeper": [25, 55],
    "minecraft:witch": [30, 50],
    "minecraft:breeze": [30, 60],
    "minecraft:creaking": [30, 60],
    "minecraft:elder_guardian": [40, 80],

    // Bosses
    "minecraft:warden": [70, 100],
    "minecraft:ravager": [70, 100],
    "minecraft:wither": [70, 100],
    "minecraft:ender_dragon": [70, 100]
  }
}

export default MoneyEntities
