import { Player } from "@minecraft/server";
import InvSee from "../../Modules/InvSee";

const inventorysee = (Server) => {
  Server.Commands.register({
    name: "inventorysee",
    description: "mce.command.inventorysee.description",
    usage: "invsee <player_name>",
    aliases: ["invsee"],
    permission: "invsee",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (targetPlayer.id === player.id) return player.sendMessage("§cYou cannot view your own inventory.")
      if (!InvSee.open(player, targetPlayer)) return player.sendMessage("§cFailed to open the inventory viewer.")
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default inventorysee

/**
 * Open the live inventory viewer (used by the admin panel too)
 * @param {Player} player
 * @param {Player} targetPlayer
 */
export const CheckInventory = (player, targetPlayer) => {
  return InvSee.open(player, targetPlayer)
}
