import Utility from "../../Modules/Utility"

/**
 * Rename the money scoreboard objective, carrying every balance over
 * @param {import("../../main").default} Server
 */
const moneyobjective = (Server) => {
  Server.Commands.register({
    name: "moneyobjective",
    description: "Rename the money scoreboard objective (migrates all balances)",
    usage: "moneyobjective <new_name>",
    aliases: ["moneyrename"],
    permission: "moneyobjective",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage("§cUsage: moneyobjective <new_name> §7(no spaces)")
    const newName = args[0].trim()
    if (/\s/.test(newName) || newName.includes("§")) return player.sendMessage("§cObjective name can't contain spaces or § codes.")
    if (newName.length > 32) return player.sendMessage("§cName too long. §eMax: 32 characters.")

    const result = await Server.Money.renameObjective(newName)
    if (!result.renamed) {
      if (result.error == "SameName") return player.sendMessage(`§eThe money objective is already named §f${newName}§e.`)
      if (result.error == "Exists") return player.sendMessage(`§cAn objective named §f${newName}§c already exists.`)
      return player.sendMessage(`§cFailed to rename objective: ${result.error}`)
    }
    Server.Log(`[Money] Money objective renamed from ${result.from} to ${result.to} by ${player.name}`)
    return player.sendMessage(`§aMoney objective renamed: §e${result.from}§a -> §e${result.to}§a. All balances were migrated.`)
  })
}

export default moneyobjective
