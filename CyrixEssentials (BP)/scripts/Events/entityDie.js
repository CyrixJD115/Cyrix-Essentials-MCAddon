import Config from "../Configuration"
import MoneyEntities from "../Configs/MoneyEntities"
import Server from "../main"
import Utility from "../Modules/Utility"

/**
 * Resolve one money value entry into a single amount.
 * Accepts a fixed number, a [min, max] array, or a { min, max } object.
 * @param {number | number[] | { min: number, max: number }} value
 * @returns {number}
 */
const resolveMoneyValue = (value) => {
  if (typeof value == "number") return value
  if (Array.isArray(value)) return Utility.random(value[0], value[1])
  if (typeof value == "object" && value != null) return Utility.random(value.min, value.max)
  return 0
}

/**
 * Look up how much an entity pays when killed.
 * Returns undefined when the entity should not pay anything.
 * @param {string} typeId
 * @returns {number | undefined}
 */
const getMobMoney = (typeId) => {
  if (MoneyEntities.exclude.includes(typeId)) return undefined
  const entry = MoneyEntities.mobs[typeId]
  if (entry != undefined) return resolveMoneyValue(entry)
  if (MoneyEntities.default == null) return undefined
  return resolveMoneyValue(MoneyEntities.default)
}

/**
 * @param {import("../main").default} Server
 */
const entityDie = (Server) => {
  Server.world.afterEvents.entityDie.subscribe(async data => {
    if (!Server.Setting.get("moneySystem") || !Server.Setting.get("earnMoneyfromMobs")) return
    if (data.damageSource.cause == "none") return
    if (data.damageSource.damagingEntity == undefined || data.damageSource.damagingEntity.typeId != "minecraft:player") return
    let deadEntity = data.deadEntity
    let player = data.damageSource.damagingEntity

    let moneyEarn = getMobMoney(deadEntity.typeId)
    if (moneyEarn == undefined || moneyEarn <= 0) return
    if (player.getMoney() + moneyEarn > Server.Money.getMaxMoney()) moneyEarn = Server.Money.getMaxMoney() - player.getMoney()
    if (moneyEarn <= 0) return
    await player.setMoney(player.getMoney() + moneyEarn)
    if (Server.Setting.get("notifyEarnMoneyInChat")) {
      Server.System.run(() => player.sendMessage({ translate: "mce.player.killing", with: [Utility.formatMoney(moneyEarn)] }))
    } else {
      Server.System.run(() => player.onScreenDisplay.setActionBar({ translate: "mce.player.killing", with: [Utility.formatMoney(moneyEarn)] }))
    }
  })
}

export default entityDie
