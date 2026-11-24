/**
 * Entity Money Values
 *
 * Kept out of Configuration.js so the mob payout table can be edited
 * (or replaced by other addons) without touching the rest of the config.
 *
 * WHITELIST-ONLY MODE (safety precaution): `default` is null, so ONLY mobs
 * explicitly hard-coded in `mobs` below can ever pay money. Unknown or
 * unlisted entities — new packs, technical entities, anything forgotten —
 * pay nothing by design. To reward a mob, add it to `mobs`.
 *
 * Value formats, per entity:
 *   5                  -> fixed amount, always pays 5
 *   [1, 5]             -> random between 1 and 5 (inclusive)
 *   { min: 1, max: 5 } -> same as the array form
 */

const MoneyEntities = {
  // Safety: null = ONLY mobs explicitly listed in `mobs` below pay money.
  // Anything unlisted pays nothing — new content can never silently farm
  // money. Only set a value here (e.g. [1, 3]) if you deliberately want a
  // catch-all payout for unlisted entities (not recommended).
  default: null,

  /**
   * Never pay money — technical/non-mob entities.
   * None of these are in `mobs` (so they already pay nothing in whitelist
   * mode), but they stay hard-blocked even if a catch-all default payout
   * is ever re-enabled, and this documents why each is not a real mob.
   */
  exclude: [
    // Players must never pay out (PvP farming)
    "minecraft:player", "minecraft:armor_stand", "minecraft:npc",

    // Killable vanilla non-mobs — craftable/spawnable, would farm any
    // catch-all payout (vehicles, decorations, projectiles)
    "minecraft:boat", "minecraft:chest_boat",
    "minecraft:minecart", "minecraft:chest_minecart", "minecraft:hopper_minecart",
    "minecraft:tnt_minecart", "minecraft:command_block_minecart",
    "minecraft:item_frame", "minecraft:glow_item_frame", "minecraft:painting",
    "minecraft:leash_knot", "minecraft:end_crystal", "minecraft:falling_block",
    "minecraft:tnt", "minecraft:item", "minecraft:xp_orb", "minecraft:arrow",
    "minecraft:snowball", "minecraft:egg", "minecraft:fishing_hook",
    "minecraft:lightning_bolt", "minecraft:evoker_fangs",

    // This addon's own technical entities (UI, data storage, projectors)
    "cyx_ess:database", "cyx_ess:floating_text", "cyx_ess:invsee_projector", "cyx_ess:new_database"
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
    "minecraft:ender_dragon": [70, 100],

    // Vanilla mobs missing from the sections above (IDs as of 1.26.x)
    "minecraft:bat": [1, 3],            // HP 6 ambient
    "minecraft:turtle": [3, 10],        // HP 30 passive
    "minecraft:villager_v2": [3, 10],   // the real spawnable villager ID on Bedrock
    "minecraft:skeleton_horse": [5, 15],
    "minecraft:zombie_horse": [5, 15],
    "minecraft:parched": [20, 50],      // husk-family hostile
    "minecraft:sulfur_cube": [15, 35]   // slime-family (large state HP 16 / ATK 6)
  }
}

export default MoneyEntities
