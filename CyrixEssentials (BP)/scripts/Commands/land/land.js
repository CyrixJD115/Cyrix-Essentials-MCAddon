import { system, world, Player } from "@minecraft/server";
import Land from "../../Modules/Land";
import * as ui from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms";
import Utility from "../../Modules/Utility";
import Ranks from "../../Modules/Ranks";

const isMoving = (entity) => {
  const MathRound = (x) => {
    return Math.round(x * 1000) / 1000;
  };

  /**
   * @type {{x: number, y: number, z: number}}
   */
  const vector = {
    x: MathRound(entity.getVelocity().x),
    y: MathRound(entity.getVelocity().y),
    z: MathRound(entity.getVelocity().z)
  };

  if (vector.x === 0 && vector.y === 0 && vector.z === 0) return false;
  else return true;
};

/**
 * 
 * @param {import("../../main").default} Server 
 */
const land = (Server) => {
  const Position = {}

  Server.Commands.register({
    name: "land",
    description: "Land Claim",
    category: "Land",
    usage: "land help"
  }, async (data, player, args) => {
    console.log(Ranks.getLandPermission(player, "land.claim_limit"))
    const commands = {
      "startpos": {
        description: ["Set start position land"],
        permission: "land.claim",
        callback: () => {
          const block = player.dimension.getBlock(player.location).below()
          return StartPos(player, block.location)
        }
      },
      "endpos": {
        description: ["Set end position land"],
        permission: "land.claim",
        callback: () => {
          const block = player.dimension.getBlock(player.location).below()
          return EndPos(player, block.location)
        }
      },
      "claim": {
        description: ["Claim a land"],
        permission: "land.claim",
        callback: () => ClaimFunction(player, args)
      },
      "list": {
        description: ["Provides list of your land"],
        callback: () => ListFunction(player)
      },
      "unclaim": {
        description: ["Unclaim a land"],
        permission: "land.unclaim",
        callback: () => UnClaimFunction(player)
      },
      "invite": {
        description: ["Invite player to your land", ["player_name"]],
        permission: "land.invite",
        callback: () => InviteFunction(player, args.slice(1))
      },
      "kick": {
        description: ["Kick player from your land", ["player_name"]],
        permission: "land.kick",
        callback: () => KickFunction(player, args.slice(1))
      },
      "transferownership": {
        description: ["Transfer land ownership", ["player_name"]],
        permission: "land.transferOwnership",
        callback: () => TransferOwnershipFunction(player, args.slice(1))
      },
      "info": {
        description: ["Provides land information"],
        callback: () => InfoFunction(player)
      },
      "setting": {
        description: ["Setting your land permissions for everyone"],
        permission: "land.setting",
        callback: () => SettingsFunction(player)
      },
      "name": {
        description: ["Set a custom name for your land", ["land_name?"]],
        permission: "land.name",
        callback: () => NameFunction(player, args.slice(1))
      },
      "welcomemsg": {
        description: ["Set your land welcome message", ["message?"]],
        permission: "land.message",
        callback: () => MessageFunction(player, args.slice(1), "welcome")
      },
      "leavemsg": {
        description: ["Set your land leave message", ["message?"]],
        permission: "land.message",
        callback: () => MessageFunction(player, args.slice(1), "leave")
      },
      "checkblocks": {
        description: ["States the current claim blocks of a player"],
        callback: () => player.sendMessage(`§eYour claim blocks: §r${player.getClaimBlock()} blocks`)
      },
      "players": {
        description: ["Provides list of player lands", ["player_name?"]],
        admin: true,
        callback: () => {
          player.sendMessage("§eClose Chat to Show UI!")
          return PlayerLandFunction(player, args.slice(1))
        }
      }
    }

    const HelpFunction = () => {
      const prefix = Server.Setting.get("commandPrefix")

      let message = `§eLand command list:`
      Object.keys(commands).forEach(name => {
        const options = commands[name]

        if (options.admin && !player.isAdmin()) return
        if (options.permission && (!Ranks.getLandPermission(player, options.permission) && !player.isAdmin())) return

        const cmd = `${prefix}land ${name}`
        const description = options.description
        message += `\n§e - §a${cmd} §e| ${cmd}${description[1] == undefined ? "" : ` ${description.map(v => v = `<${v}>`).join(" ")}`} (${description[0]})`
      })

      player.sendMessage(message)
    }

    if (args[0]) {
      const subcommand = commands[args[0].toLowerCase()]
      if (subcommand) {
        if (subcommand.admin && !player.isAdmin()) return HelpFunction()
        if (subcommand.permission && (!Ranks.getLandPermission(player, subcommand.permission) && !player.isAdmin())) return HelpFunction()

        return subcommand.callback()
      }
    } else HelpFunction()
  })

  /**
   * @param {Player} player 
   * @param {{x: number, y: number, z: number}} location
   * @returns 
   */
  const StartPos = (player, location) => {
    if (!Position[player.name]) Position[player.name] = {}
    Position[player.name].start = {
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z),
      lastChange: Date.now()
    }
    return player.sendMessage(`§aSuccessfull set start pos on coordinate §ex: ${Math.floor(location.x)} z: ${Math.floor(location.z)}`);
  }

  /**
   * @param {Player} player 
   * @param {{x: number, y: number, z: number}} location
   * @returns 
   */
  const EndPos = (player, location) => {
    if (!Position[player.name]) Position[player.name] = {}
    Position[player.name].end = {
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z),
      lastChange: Date.now()
    }
    return player.sendMessage(`§a§aSuccessfull set end pos on coordinate §ex: ${Math.floor(location.x)} z: ${Math.floor(location.z)}`);
  }

  /**
   * @param {Player} player 
   * @param {number} args 
   */
  const ClaimConfirm = async (player, price) => {
    if (price <= 0) return true
    const ConfirmUI = new ui.MessageFormData()
      .title("§l§ePURCHASE CONFIRMATION")
      .body(`Claim Land for §e${Utility.formatMoney(price)}§r?`)
      .button2("§l§aACCEPT")
      .button1("§l§cCANCEL")

    player.sendMessage("§eClose Chat to Show UI!")
    let res = await ForceOpen(player, ConfirmUI)
    if (!res.canceled) {
      if (res.selection == 1) return true
    }
    return false
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  /**
   * @param {Player} player 
   * @param {string[]} args 
   * @param {{start: any, end: any, initiatorName: string}} [delegated] set when
   * the selection belongs to another player who approved this claim
   */
  const ClaimFunction = async (player, args, delegated) => {
    const selection = delegated ?? Position[player.name]
    if (!selection)
      return player.sendMessage("§cYou haven't set position.")
    if (!selection.start)
      return player.sendMessage("§cYou haven't set start position.")
    if (!selection.end)
      return player.sendMessage("§cYou haven't set end position.")

    const { start, end } = selection;
    const calculatedSize = Land.calculateLandSize(start, end);
    if (Server.Setting.get("costClaimBlock") && calculatedSize > player.getClaimBlock())
      return player.sendMessage("§cInsufficient claim blocks.")
    let moneyCost = Server.Setting.get("moneyCostperBlock") * calculatedSize
    const playerMoney = player.getMoney()
    if (moneyCost > playerMoney)
      return player.sendMessage(`§cInsufficient funds. §ePrice: ${await Utility.formatMoney(moneyCost)}`)

    const checkOverlap = Land.checkOverlap(start, end, player)
    if (checkOverlap.isInside)
      return player.sendMessage(`§cYour land is overlapping with others land`);

    const Confirm = await ClaimConfirm(player, moneyCost)
    if (!Confirm) {
      // Delegated selections stay with the initiator on cancel, they may still claim it themselves
      if (!delegated) delete Position[player.name]
      return player.sendMessage("§cCanceled!")
    }

    const landResult = await Land.createLand(player, { x: start.x, z: start.z }, { x: end.x, z: end.z })
    if (delegated) delete Position[delegated.initiatorName]
    else delete Position[player.name]

    if (!landResult.created)
      return player.sendMessage(`§cYour land is overlapping with others land`);

    await player.setMoney(playerMoney - moneyCost)
    if (Server.Setting.get("costClaimBlock")) player.setClaimBlock(player.getClaimBlock() - calculatedSize)

    const landCenter = Land.getCenter(start, end)
    Server.Log(`[Land] ${player.name} created land on ${player.dimension.id} | x: ${landCenter.x} z: ${landCenter.z}`)
    return player.sendMessage(`§aSuccessfully created new land${moneyCost > 0 ? ` §awith price: §e${Utility.formatMoney(moneyCost)}.` : "."}`);
  }

  /**
   * @param {Player} player 
   */
  const ListFunction = async (player) => {
    const playerLands = Land.getLands(player.name);
    if (playerLands.length === 0)
      return player.sendMessage("§e----- Your lands -----\nNo lands found.");

    const lands = []
    let landCount = 1
    playerLands
      .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
      .forEach(
        (land) => {
          lands.push(`§e#${landCount}. §7Land: §e${land.landName || "Unnamed"}\n §e> §7Dimension: §e${land.landDimension.split(":")[1]
            }\n §e> §7Position: ${land.landCenter.x}, ${land.landCenter.z}\n §e> §7Members: §e${land.invites.join(", ") || "None."
            }\n §e> §7Created at: §b${land.creationDate || 0}`)
          landCount += 1
        })
    return player.sendMessage(`§e----- Your lands -----\n${lands.join("\n\n")}`);
  }

  /**
   * @param {Player} player 
   */
  const UnClaimFunction = async (player) => {
    const land = Land.testLand(player.dimension.getBlock(player.location).below().location, player.dimension)
    if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
    if (land.owner != player.name && !player.isAdmin()) return player.sendMessage("§cYou do not have permission!")
    const { start, end } = land.data.land
    const calculatedSize = Land.calculateLandSize(start, end);
    let deleteResult = await Land.deleteLand(land.id, land.owner)
    if (deleteResult.error) return player.sendMessage(deleteResult.error)
    if (player.name == land.owner) player.setClaimBlock(player.getClaimBlock() + calculatedSize)
    return player.sendMessage("§aSuccessfully unclaim this land!")
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const InviteFunction = async (player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (player == targetPlayer) return player.sendMessage("§cYou may not invite yourself.")
      const land = Land.testLand(player.location, player.dimension)
      if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
      if (land.owner != player.name) return player.sendMessage("§cYou do not have permission!")
      if (land.invites.includes(targetPlayer.name)) return player.sendMessage(`§c${targetPlayer.name} is already member of land!`)
      await Land.invitePlayer(land.id, player.name, targetPlayer.name)
      targetPlayer.sendMessage(`§a${player.name} give you access to their land.`)
      player.sendMessage("§aInvited successfully!")
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const KickFunction = async (player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (player == targetPlayer) return player.sendMessage("§cYou may not kick yourself.")
      const land = Land.testLand(player.location, player.dimension)
      if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
      if (land.owner != player.name) return player.sendMessage("§cYou do not have permission!")
      if (!land.invites.includes(targetPlayer.name)) return player.sendMessage(`§c${targetPlayer.name} is not member of land!`)
      await Land.removeInvite(land.id, player.name, targetPlayer.name)
      targetPlayer.sendMessage(`§a${player.name} remove your access to their land.`)
      player.sendMessage("§aKicked successfully!")
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const TransferOwnershipFunction = async (player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      const land = Land.testLand(player.location, player.dimension)
      if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
      if (land.owner != player.name && !player.isAdmin()) return player.sendMessage("§cYou do not have permission!")
      if (land.owner == targetPlayer) return player.sendMessage("§cYou are the owner this land.")
      await Land.transferOwnership(land.id, land.owner, targetPlayer.name)
      targetPlayer.sendMessage(`§a${land.owner} gives ownership to you.`)
      player.sendMessage(`§aSuccessfully transfer ownership to ${targetPlayer.name}.`)
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  }

  /**
   * @param {Player} player 
   */
  const PlayerLandFunction = async (player, args) => {
    if (args[0]) {
      let targetPlayer = Server.getPlayer(args[0])
      if (targetPlayer) return PlayerLand(player, targetPlayer.name)
    }
    let players = world.getAllPlayers().map(p => p.name)
    Object.keys(Land.getAllLands()).forEach(p => {
      if (!players.includes(p)) players.push(p)
    })
    players = players.sort((a, b) => a.localeCompare(b))
    if (players.length <= 0) return player.sendMessage("§cNo players detected")
    let playerPanel = new ui.ActionFormData()
      .title("§l§ePlayers List")
      .body(`§aPlayers Online : §e${world.getAllPlayers().length}`)
    players.forEach(p => {
      playerPanel.button(`§l§e${p} ${world.getAllPlayers().find(pl => pl.name == p) == undefined ? "" : "§8(§aOnline§8)"}`)
    })

    ForceOpen(player, playerPanel).then(res => {
      if (!res.canceled) {
        const targetName = players[res.selection]
        return PlayerLand(player, targetName)
      }
    })
  }

  /**
   * @param {Player} player 
   * @param {Player} targetPlayer 
   */
  const PlayerLand = (player, targetName) => {
    const PlayerLands = Land.getLands(targetName)
    let count = 1
    let landPanel = new ui.ActionFormData()
      .title(`§l§e${targetName}'s Lands`)
      .body(`§aLands : §e${PlayerLands.length}`)
    PlayerLands.forEach(p => {
      landPanel.button(`§e#${count}\n§0X: ${p.landCenter.x} | Z: ${p.landCenter.z}`)
      count += 1
    })
    landPanel.button("§l§c<== BACK")

    ForceOpen(player, landPanel).then(res => {
      if (!res.canceled) {
        let land = PlayerLands[res.selection]
        if (!land) return PlayerLandFunction(player, [])
        let landPanel = new ui.ActionFormData()
          .title(`§l§e${targetName}'s Lands`)
          .body(`§e#${res.selection + 1}. §7Land: §e${land.landName || "Unnamed"}\n §e> §7Dimension: §e${land.landDimension.split(":")[1]
            }\n §e> §7Position: ${land.landCenter.x}, ${land.landCenter.z}\n §e> §7Members: §e${land.invites.join(", ") || "None."
            }\n §e> §7Created at: §b${land.creationDate || 0}`)

          .button("§l§2Teleport")
          .button("§l§4Delete")
          .button("§l§c<== BACK")

        ForceOpen(player, landPanel).then(res => {
          if (!res.canceled) {
            switch (res.selection) {
              case 0:
                land.landCenter.y = player.location.y
                return player.teleport(land.landCenter)
              case 1:
                const deleteLand = Land.deleteLand(land.landId, targetName)
                if (deleteLand.error) {
                  if (deleteLand.error == "NotFound") return player.sendMessage("§cLand not found!")
                } else return player.sendMessage("§aSuccessfully delete land!")
              default:
                return PlayerLand(player, targetName)
            }
          }
        })
      }
    })
  }

  /**
   * 
   * @param {Player} player 
   * @returns 
   */
  const InfoFunction = (player) => {
    const land = Land.testLand(player.dimension.getBlock(player.location).location, player.dimension)
    if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")


    const width = Math.abs(land.data.land.end.x - land.data.land.start.x) + 1;
    const depth = Math.abs(land.data.land.end.z - land.data.land.start.z) + 1;
    player.sendMessage(`§eLand Information:\n` +
      `§f- §7Name: §e${land.data.landName || "Unnamed"}\n` +
      `§f- §7Owner: §e${land.owner}\n` +
      `§f- §7Members: §e${land.invites.join(", ") || "None."}\n` +
      `§f- §7Size: §e${width}x${depth} (${Land.calculateLandSize(land.data.land.start, land.data.land.end)} blocks)`);
    if (!CooldownMark.includes(player.name)) {
      const { start, end } = land.data.land
      CooldownMark.push(player.name)
      const particle = system.runInterval(() => ParticleLand(start, end, player, player.location.y), 5)
      system.runTimeout(() => {
        system.clearRun(particle)
        CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
      }, 20 * 5)
    }
  }
  /**
   * 
   * @param {Player} player 
   */
  const SettingsFunction = async (player) => {
    const SettingList = {
      "Allow Building (Not Working)": "building",
      "Allow Breaking": "breaking",
      "Allow Open Container": "openContainer",
      "Allow Open Ender Chest": "openEnderChest",
      "Allow Open Door": "openDoor",
      "Allow Open Fence Gate": "openFenceGate",
      "Allow Push Button": "pushButton",
      "Allow Use Lever": "useLever",
      "Allow Use Crafting Table": "useCraftingTable",
      "Allow Interact with Mobs": "interactWithMobs"
    }

    const land = Land.testLand(player.location, player.dimension)
    if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
    if (land.owner != player.name && !player.isAdmin()) return player.sendMessage("§cYou do not have permission!")

    const SettingUI = new ui.ModalFormData()
      .title("Land Settings")
    Object.keys(SettingList).forEach(settingName => {
      SettingUI.toggle(settingName, { defaultValue: land.setting[SettingList[settingName]] })
    })

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, SettingUI).then(async res => {
      if (!res.canceled) {
        const newSetting = {}
        for (let i = 0; i < res.formValues.length; i++) {
          const settingName = Object.keys(SettingList)[i]
          const setting = SettingList[settingName]
          const value = res.formValues[i]

          newSetting[setting] = value
          // console.warn(setting, value)
        }

        await Land.setSetting(land.id, land.owner, newSetting)
        return player.sendMessage("§aSuccessfully saved settings!")
      }
    })
  }

  /**
   * Get the land the player stands in, if the player owns it
   * @param {Player} player
   * @returns {ReturnType<typeof Land.testLand> | null}
   */
  const getOwnedLand = (player) => {
    const land = Land.testLand(player.location, player.dimension)
    if (!land.isInside) {
      player.sendMessage("§cYou have to stand in land!")
      return null
    }
    if (land.owner != player.name && !player.isAdmin()) {
      player.sendMessage("§cYou do not have permission!")
      return null
    }
    return land
  }

  /**
   * @param {Player} player
   * @param {string[]} args
   */
  const NameFunction = async (player, args) => {
    const land = getOwnedLand(player)
    if (!land) return

    const name = args.join(" ").trim()
    if (!name) {
      await Land.setLandName(land.id, land.owner, undefined)
      return player.sendMessage("§aCustom land name removed.")
    }
    if (name.length > 32)
      return player.sendMessage(`§cLand name is too long. §eMax: 32 characters.`)

    const result = await Land.setLandName(land.id, land.owner, name)
    if (!result.status) return player.sendMessage("§cFailed to set land name.")
    return player.sendMessage(`§aSuccessfully set land name to §e${name}§a!`)
  }

  /**
   * @param {Player} player
   * @param {string[]} args
   * @param {"welcome" | "leave"} type
   */
  const MessageFunction = async (player, args, type) => {
    const land = getOwnedLand(player)
    if (!land) return

    const message = args.join(" ").trim()
    if (!message) {
      await Land.setLandMessages(land.id, land.owner, type == "welcome" ? { welcome: undefined } : { leave: undefined })
      return player.sendMessage(`§aCustom ${type} message removed.`)
    }
    if (message.length > 60)
      return player.sendMessage(`§cMessage is too long. §eMax: 60 characters.`)

    const result = await Land.setLandMessages(land.id, land.owner, type == "welcome" ? { welcome: message } : { leave: message })
    if (!result.status) return player.sendMessage(`§cFailed to set ${type} message.`)
    return player.sendMessage(`§aSuccessfully set ${type} message to §e${message}§a!`)
  }

  // Land Claims Tool UI
  /**
   * The Land Claims tool menu: land management when standing inside a land,
   * otherwise the claim creation menu
   * @param {Player} player
   */
  const LandClaimsUI = async (player) => {
    player.sendMessage({ translate: "mce.ui.closechat" })
    const land = Land.testLand(player.location, player.dimension)
    if (land.isInside) return LandManageUI(player, land)
    return LandCreateUI(player)
  }

  /**
   * Claim creation menu: Start Position, End Position and Claim Land
   * @param {Player} player
   */
  const LandCreateUI = async (player) => {
    if (!Ranks.getLandPermission(player, "land.claim") && !player.isAdmin()) {
      return ForceOpen(player, new ui.ActionFormData()
        .title("§l§eLAND CLAIMS")
        .body(`§cYou don't have permission to claim land.\n\n§7If an admin marked an area for you, stand inside it and §fuse the claim tool on air twice§7 to request it.`)
        .button("§l§cOK"))
    }

    const sel = Position[player.name]
    let body = "§7Mark your claim area with the tool,\n§7then claim it here.\n\n"
    body += `§7Start pos: ${sel?.start ? `§aX: ${sel.start.x} Z: ${sel.start.z}` : "§cnot set"}\n`
    body += `§7End pos: ${sel?.end ? `§aX: ${sel.end.x} Z: ${sel.end.z}` : "§cnot set"}`
    if (sel?.start && sel?.end) {
      const size = Land.calculateLandSize(sel.start, sel.end)
      const cost = Server.Setting.get("moneyCostperBlock") * size
      body += `\n§7Size: §e${Math.abs(sel.end.x - sel.start.x) + 1}x${Math.abs(sel.end.z - sel.start.z) + 1} §7(§e${size}§7 blocks)`
      if (cost > 0) body += `\n§7Price: §e${await Utility.formatMoney(cost)}`
    }

    const CreateUI = new ui.ActionFormData()
      .title("§l§eLAND CLAIMS")
      .body(body)
      .button("§l§aStart Position\n§7mark at your feet")
      .button("§l§bEnd Position\n§7mark at your feet")
      .button("§l§6Claim Land")

    const res = await ForceOpen(player, CreateUI)
    if (!res || res.canceled) return
    if (res.selection == 0 || res.selection == 1) {
      const block = player.dimension.getBlock(player.location).below()
      return (res.selection == 0 ? StartPos : EndPos)(player, block.location)
    }
    if (res.selection == 2) return ClaimFunction(player, [])
  }

  /**
   * In-land menu: land info, plus management for the owner or admins
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   */
  const LandManageUI = async (player, land) => {
    const isOwner = land.owner == player.name || player.isAdmin()
    const { start, end } = land.data.land
    const width = Math.abs(end.x - start.x) + 1
    const depth = Math.abs(end.z - start.z) + 1
    const landName = land.data.landName || "Unnamed"

    let body = `§7Name: §e${landName}\n`
    body += `§7Owner: §e${land.owner}\n`
    body += `§7Size: §e${width}x${depth} §7(§e${Land.calculateLandSize(start, end)}§7 blocks)\n`
    body += `§7Members: §e${land.invites.join(", ") || "None."}\n`
    body += `§7Welcome msg: §e${land.data.welcomeMessage || "§7Default"}\n`
    body += `§7Leave msg: §e${land.data.leaveMessage || "§7Default"}`

    if (!isOwner) {
      return ForceOpen(player, new ui.ActionFormData()
        .title(`§l§e${landName}`)
        .body(body)
        .button("§l§cOK"))
    }

    const ManageUI = new ui.ActionFormData()
      .title("§l§eLAND CLAIMS")
      .body(body)

    const actions = []
    if (Ranks.getLandPermission(player, "land.name") || player.isAdmin()) {
      ManageUI.button("§l§6Land Name")
      actions.push(() => ManageNameUI(player, land))
    }
    if (Ranks.getLandPermission(player, "land.message") || player.isAdmin()) {
      ManageUI.button("§l§bWelcome Message")
      actions.push(() => ManageMessageUI(player, land, "welcome"))
      ManageUI.button("§l§dLeave Message")
      actions.push(() => ManageMessageUI(player, land, "leave"))
    }
    if (Ranks.getLandPermission(player, "land.setting") || player.isAdmin()) {
      ManageUI.button("§l§eLand Settings")
      actions.push(() => SettingsFunction(player))
    }
    if (Ranks.getLandPermission(player, "land.invite") || player.isAdmin()) {
      ManageUI.button("§l§aInvite Member")
      actions.push(() => ManageInviteUI(player, land))
    }
    if (Ranks.getLandPermission(player, "land.kick") || player.isAdmin()) {
      ManageUI.button("§l§cRemove Member")
      actions.push(() => ManageKickUI(player, land))
    }
    if (Ranks.getLandPermission(player, "land.transferOwnership") || player.isAdmin()) {
      ManageUI.button("§l§gTransfer Ownership")
      actions.push(() => ManageTransferUI(player, land))
    }
    if (Ranks.getLandPermission(player, "land.unclaim") || player.isAdmin()) {
      ManageUI.button("§l§4Unclaim Land")
      actions.push(() => ManageUnclaimUI(player, land))
    }

    const res = await ForceOpen(player, ManageUI)
    if (!res || res.canceled) return
    const action = actions[res.selection]
    if (action) return action()
  }

  /**
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   */
  const ManageNameUI = async (player, land) => {
    const NameUI = new ui.ModalFormData()
      .title("§l§eLand Name")
      .textField("Land name §7(max 32, empty to remove)§r:", "Land name", { defaultValue: land.data.landName ?? "" })

    player.sendMessage("§eClose Chat to Show UI!")
    const res = await ForceOpen(player, NameUI)
    if (!res || res.canceled) return
    const name = String(res.formValues[0]).trim()
    if (name.length > 32) return player.sendMessage("§cLand name is too long. §eMax: 32 characters.")

    const result = await Land.setLandName(land.id, land.owner, name || undefined)
    if (!result.status) return player.sendMessage("§cFailed to set land name.")
    return player.sendMessage(name ? `§aSuccessfully set land name to §e${name}§a!` : "§aCustom land name removed.")
  }

  /**
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   * @param {"welcome" | "leave"} type
   */
  const ManageMessageUI = async (player, land, type) => {
    const current = type == "welcome" ? land.data.welcomeMessage : land.data.leaveMessage
    const MessageUI = new ui.ModalFormData()
      .title(type == "welcome" ? "§l§bWelcome Message" : "§l§dLeave Message")
      .textField(`${type == "welcome" ? "Welcome" : "Leave"} message §7(max 60, empty to remove)\n§7Placeholders: §f{player}§7, §f{owner}§r:`, "Message", { defaultValue: current ?? "" })

    player.sendMessage("§eClose Chat to Show UI!")
    const res = await ForceOpen(player, MessageUI)
    if (!res || res.canceled) return
    const message = String(res.formValues[0]).trim()
    if (message.length > 60) return player.sendMessage("§cMessage is too long. §eMax: 60 characters.")

    const result = await Land.setLandMessages(land.id, land.owner, type == "welcome" ? { welcome: message || undefined } : { leave: message || undefined })
    if (!result.status) return player.sendMessage(`§cFailed to set ${type} message.`)
    return player.sendMessage(message ? `§aSuccessfully set ${type} message to §e${message}§a!` : `§aCustom ${type} message removed.`)
  }

  /**
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   */
  const ManageInviteUI = async (player, land) => {
    const InviteUI = new ui.ModalFormData()
      .title("§l§aInvite Member")
      .textField("Player name:", "player_name")

    player.sendMessage("§eClose Chat to Show UI!")
    const res = await ForceOpen(player, InviteUI)
    if (!res || res.canceled) return
    const name = String(res.formValues[0]).trim()
    if (!name) return
    return InviteFunction(player, [name])
  }

  /**
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   */
  const ManageKickUI = async (player, land) => {
    if (land.invites.length <= 0) {
      return ForceOpen(player, new ui.ActionFormData()
        .title("§l§cRemove Member")
        .body("§7This land has no members.")
        .button("§l§cOK"))
    }

    const KickUI = new ui.ActionFormData()
      .title("§l§cRemove Member")
      .body("§7Select the member to remove:")
    land.invites.forEach(name => KickUI.button(`§c✖ ${name}`))

    const res = await ForceOpen(player, KickUI)
    if (!res || res.canceled) return
    return KickFunction(player, [land.invites[res.selection]])
  }

  /**
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   */
  const ManageTransferUI = async (player, land) => {
    const TransferUI = new ui.ModalFormData()
      .title("§l§gTransfer Ownership")
      .textField("New owner player name:", "player_name")

    player.sendMessage("§eClose Chat to Show UI!")
    const res = await ForceOpen(player, TransferUI)
    if (!res || res.canceled) return
    const name = String(res.formValues[0]).trim()
    if (!name) return
    return TransferOwnershipFunction(player, [name])
  }

  /**
   * @param {Player} player
   * @param {ReturnType<typeof Land.testLand>} land
   */
  const ManageUnclaimUI = async (player, land) => {
    const ConfirmUI = new ui.MessageFormData()
      .title("§l§cUNCLAIM LAND")
      .body(`Unclaim §e${land.data.landName || "this land"}§f?${land.owner == player.name ? "\n§7Your claim blocks will be refunded." : ""}`)
      .button2("§l§aCONFIRM")
      .button1("§l§cCANCEL")

    player.sendMessage("§eClose Chat to Show UI!")
    const res = await ForceOpen(player, ConfirmUI)
    if (!res || res.canceled || res.selection != 1) return
    return UnClaimFunction(player)
  }

  // Land System
  const CooldownNotify = {}
  const CooldownMark = []
  const NotifyText = (player, message) => {
    const Cooldown = CooldownNotify[player.name] ?? (Date.now() - 500)
    if (Date.now() - Cooldown >= 500) player.sendMessage(message)
    CooldownNotify[player.name] = Date.now()
  }
  const checkPermission = (player, location, data) => {
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(location, player.dimension)
    if (land.isInside) {
      if (land.owner != player.name && !land.invites.includes(player.name)) {
        data.cancel = true
        const Cooldown = CooldownNotify[player.name] ?? (Date.now() - 500)
        if (Date.now() - Cooldown >= 500) player.sendMessage(`§cYou can not do that here! Land owner: §e${land.owner}.`)
        CooldownNotify[player.name] = Date.now()
        if (!CooldownMark.includes(player.name)) {
          const { start, end } = land.data.land
          CooldownMark.push(player.name)
          const particle = system.runInterval(() => ParticleLand(start, end, player, location.y), 5)
          system.runTimeout(() => {
            system.clearRun(particle)
            CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
          }, 20 * 3)
        }
      }
    }
  }

  world.beforeEvents.playerBreakBlock.subscribe(data => {
    const { player, block } = data
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(block.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      if (land.setting.breaking) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, block.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.playerPlaceBlock.subscribe(data => {
    const { player, block } = data
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(block.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      // if (land.setting.building) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, block.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    const { player, block, itemStack } = data
    const poke = ["pokeb:trade_machine", "pokeb:pc"]
    if (poke.includes(block.typeId)) return
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(block.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      if (itemStack && itemStack.typeId.includes("bucket")) return data.cancel = true
      if (block.getComponent("minecraft:inventory") != undefined && land.setting.openContainer) return
      if (block.typeId == "minecraft:ender_chest" && land.setting.openEnderChest) return
      if (block.typeId.includes("door") && land.setting.openDoor) return
      if (block.typeId.includes("fence_gate") && land.setting.openFenceGate) return
      if (block.typeId.includes("button") && land.setting.pushButton) return
      if (block.typeId == "minecraft:lever" && land.setting.useLever) return
      if (block.typeId == "minecraft:crafting_table" && land.setting.useCraftingTable) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, block.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.playerInteractWithEntity.subscribe(data => {
    const { player, target } = data
    console.log("2")
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(target.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      if (land.setting.interactWithMobs) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, target.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.explosion.subscribe(data => {
    if (!Server.Setting.get("protectLandfromExplosion")) return
    const impact = data.getImpactedBlocks().filter(block => {
      const land = Land.testLand(block.location, block.dimension)
      return !land.isInside
    })
    data.setImpactedBlocks(impact)
  })
  // world.beforeEvents.pistonActivate.subscribe(data => {
  //   if (Setting.get("allowPistonInLand")) return
  //   data.piston.getAttachedBlocks().forEach(location => {
  //     const land = Land.testLand(location, data.dimension)
  //     if (land.isInside) data.cancel = true
  //   })
  // })

  // Land Claim by Item: attacking a block marks the start pos
  const CooldownSet = {}
  world.beforeEvents.playerBreakBlock.subscribe(data => {
    if (data.cancel) return
    const { player, block, itemStack } = data
    if (itemStack?.typeId == Server.Setting.get("itemClaimLand")) {
      const Cooldown = CooldownSet[player.name] ?? Date.now()
      data.cancel = true
      if (Cooldown > Date.now()) return
      StartPos(player, block.location)
      CooldownSet[player.name] = Date.now() + 500
    }
  })

  // Land Claim by Item: using on a block marks the end pos,
  // sneaking + using opens the Land Claims menu
  world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    if (data.cancel) return
    const { player, itemStack } = data
    if (itemStack?.typeId == Server.Setting.get("itemClaimLand")) {
      const Cooldown = CooldownSet[player.name] ?? Date.now()
      data.cancel = true
      if (Cooldown > Date.now()) return
      if (player.isSneaking) {
        LandClaimsUI(player)
      } else {
        EndPos(player, data.block.location)
      }
      CooldownSet[player.name] = Date.now() + 500
    }
  })

  // Delegated Claim by Item: two quick air-interacts with the claim item while
  // standing inside another player's selection opens the claim window for that
  // player, once the selection's initiator approves it. Without a live
  // selection or outside of its parameters nothing happens at all.
  const airInteractWindow = 1500
  const lastAirInteract = {}
  const RequestCooldown = {}
  const PendingRequests = {}

  const FindSelectionAt = (player) => {
    let match
    for (const initiatorName in Position) {
      if (initiatorName == player.name) continue
      const pos = Position[initiatorName]
      if (!pos?.start || !pos?.end) continue
      const minX = Math.min(pos.start.x, pos.end.x), maxX = Math.max(pos.start.x, pos.end.x)
      const minZ = Math.min(pos.start.z, pos.end.z), maxZ = Math.max(pos.start.z, pos.end.z)
      if (player.location.x < minX || player.location.x > maxX || player.location.z < minZ || player.location.z > maxZ) continue
      const lastChange = Math.max(pos.start.lastChange ?? 0, pos.end.lastChange ?? 0)
      if (!match || lastChange > match.lastChange) match = { initiatorName, pos, lastChange }
    }
    return match
  }

  const RequestDelegatedClaim = async (player, selection) => {
    const initiator = world.getAllPlayers().find(p => p.name == selection.initiatorName)
    if (!initiator || initiator.dimension.id != player.dimension.id) return
    if (PendingRequests[selection.initiatorName]) return
    if ((RequestCooldown[player.name] ?? 0) > Date.now()) return
    RequestCooldown[player.name] = Date.now() + 5000
    PendingRequests[selection.initiatorName] = player.name
    try {
      player.sendMessage(`§7Claim request sent to §e${initiator.name}§7...`)

      const RequestUI = new ui.ActionFormData()
        .title("§l§eCLAIM REQUEST")
        .body(`§e${player.name}§f wants to claim your selected area\n§7Size: §e${Land.calculateLandSize(selection.pos.start, selection.pos.end)}§7 block(s)\n\n§7Allow them to claim it?`)
        .button("§l§aALLOW")
        .button("§l§cDENY")

      const res = await ForceOpen(initiator, RequestUI, Infinity)
      delete PendingRequests[selection.initiatorName]
      if (!res || res.canceled || res.selection != 0) return player.sendMessage(`§c${initiator.name} denied your claim request.`)

      Server.Log(`[Land] ${initiator.name} approved a delegated claim for ${player.name}`)
      player.sendMessage("§aRequest approved! Opening the claim window...")
      return ClaimFunction(player, [], { start: selection.pos.start, end: selection.pos.end, initiatorName: selection.initiatorName })
    } catch {
      delete PendingRequests[selection.initiatorName]
    }
  }

  world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
    if (itemStack?.typeId != Server.Setting.get("itemClaimLand")) return

    // Only counts when used on nothing: no interactable block or entity in reach
    try {
      if (player.getBlockFromViewDirection({ maxDistance: 6 })) return
      if (player.getEntitiesFromViewDirection({ maxDistance: 6 }).length > 0) return
    } catch { return }

    // Sneaking + using on air opens the Land Claims menu
    if (player.isSneaking) return LandClaimsUI(player)

    const now = Date.now()
    if (now - (lastAirInteract[player.name] ?? 0) > airInteractWindow) {
      lastAirInteract[player.name] = now
      return
    }
    lastAirInteract[player.name] = 0

    // The initiator double-interacting claims their own selection directly
    const own = Position[player.name]
    if (own?.start && own?.end) return ClaimFunction(player, [])

    const selection = FindSelectionAt(player)
    if (!selection) return
    return RequestDelegatedClaim(player, selection)
  })

  // Particle
  const calculateCorner = (coordinate1, coordinate2) => {
    const { x: x1, z: z1 } = coordinate1;
    const { x: x2, z: z2 } = coordinate2;

    const corner1 = { x: x1, z: z1 };
    const corner2 = { x: x1, z: z2 };
    const corner3 = { x: x2, z: z2 };
    const corner4 = { x: x2, z: z1 };

    const corners = [corner1, corner2, corner3, corner4];

    return corners;
  }

  const ParticleLand = (start, end, player, y) => {
    calculateCorner(start, end).forEach(c => {
      try { player?.spawnParticle(Server.Setting.get("particleClaim"), { x: c.x + 0.5, y: y + 1.30, z: c.z + 0.5 }) } catch (err) { }
    })
    const center = Land.getCenter(start, end)
    try { player?.spawnParticle(Server.Setting.get("particleClaim"), { x: center.x + 0.5, y: y + 1.30, z: center.z + 0.5 }) } catch (err) { }
  }

  system.runInterval(() => {
    for (const playerName in Position) {
      const location = Position[playerName]
      const startLocation = location.start
      const endLocation = location.end
      if (startLocation && (Date.now() - startLocation.lastChange) >= 300000) delete Position[playerName].start
      if (endLocation && (Date.now() - endLocation.lastChange) >= 300000) delete Position[playerName].end
    }
  }, 5)

  system.runInterval(() => {
    for (const playerName in Position) {
      const location = Position[playerName]
      const startLocation = location.start
      const endLocation = location.end
      const player = world.getAllPlayers().find(p => p.name == playerName)
      if (startLocation && endLocation) {
        ParticleLand(startLocation, endLocation, player, Math.max(startLocation.y, endLocation.y))
      } else {
        if (startLocation) player?.spawnParticle(Server.Setting.get("particleClaim"), { x: startLocation.x + 0.5, y: startLocation.y + 1.30, z: startLocation.z + 0.5 })
        if (endLocation) player?.spawnParticle(Server.Setting.get("particleClaim"), { x: endLocation.x + 0.5, y: endLocation.y + 1.30, z: endLocation.z + 0.5 })
      }
    }
  }, 10)

  const Notify = (player, text) => {
    switch (Server.Setting.get("notifyLand").toLowerCase()) {
      case "chat":
        return player.sendMessage(text)

      case "actionbar":
        return player.onScreenDisplay.setActionBar(text)

      case "title":
        return player.onScreenDisplay.setTitle(text)

      default:
        return
    }
  }

  const replaceLandPlaceholders = (text, land, player) =>
    text.replace(/\{player\}/g, player.name).replace(/\{owner\}/g, land.owner)

  const LandLog = {}
  system.runInterval(() => {
    world.getAllPlayers().forEach(player => {
      if (!player || !player.isValid) return
      try {
        if (!isMoving(player)) return
        if (player.location.y <= -63) return
        let land = Land.testLand(player.dimension.getBlock(player.location).location, player.dimension)
        if (!land.isInside && LandLog[player.name]) {
          land = LandLog[player.name]
          delete LandLog[player.name]
          const landName = land.data.landName
          const message = land.data.leaveMessage
          let text = landName ? `§eLeft §6§l${landName}` : `§eYou have left ${land.owner}'s land.`
          if (message) text += `\n§f${replaceLandPlaceholders(message, land, player)}`
          Notify(player, text)
        } else if (land.isInside) {
          const landOld = LandLog[player.name]
          if (!landOld || (landOld.owner != land.owner && landOld.id != land.id)) {
            LandLog[player.name] = land
            const landName = land.data.landName
            const message = land.data.welcomeMessage
            let text = landName ? `§eEntering §6§l${landName}` : `§eYou are entering ${land.owner}'s land`
            if (message) text += `\n§f${replaceLandPlaceholders(message, land, player)}`
            Notify(player, text)
          }
        }
      } catch (e) {

      }
    })
  }, 5)
}

export default land