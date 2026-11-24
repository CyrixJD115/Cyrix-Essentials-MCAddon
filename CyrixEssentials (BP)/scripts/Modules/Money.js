import Server from "../main"
import { Database } from "./Database"
import Config from "../Configuration"
import { world, system } from "@minecraft/server"
import * as Scoreboard from "./Scoreboard"
import Restful from "./Restful"
import { BlockTypes, ItemStack, ItemTypes } from '@minecraft/server';
import EventEmitter from "./EventEmitter"

const MoneyStructure = {
  playerName: String.prototype,
  playerMoney: Number.prototype
}

class MoneySystem {
  #isLoaded

  // The money is stored twice: the scoreboard objective holds live values for
  // online players, moneyDB mirrors everyone (saved on change + on leave, read
  // back on join). The objective id is the storage key, so renaming it requires
  // migrating scores - see renameObjective().
  #onScoreChanged = (player, score) => {
    if (!player || !player.isValid) return
    this.MoneyDatabase.set(player.name, score)
    EventEmitter.emit("mce-playerMoneyChanged", { playerName: player.name, amount: score })
  }

  constructor() {
    this.#isLoaded = false
    // Safe while the modules are still loading (Database.js does not import
    // main.js), so getMoney()/setMoney() work from the first tick on.
    this.MoneyDatabase = new Database("moneyDB")
    // This file imports main.js and main.js imports it back. While the modules
    // are still being evaluated `Server` has not been assigned yet, so reading
    // it throws "ReferenceError: Server is not initialized". #init() reads it
    // through this.MoneyObjective; starting it from the constructor aborted it
    // silently, leaving no objective, join/leave handlers, score listener or
    // routes. system.run only fires once main.js has finished loading.
    system.run(() => {
      this.#init().catch(err => {
        console.error("[Money] Failed to initialize the money system", err, err?.stack ?? "")
      })
    })
  }

  async #init() {
    if (!Scoreboard.checkObjective(this.MoneyObjective)) await world.scoreboard.addObjective(this.MoneyObjective)
    this.#isLoaded = true

    world.afterEvents.playerSpawn.subscribe(data => {
      let player = data.player
      if (!player || !player.isValid) return
      if (data.initialSpawn) {
        let playerMoney = this.MoneyDatabase.get(player.name)
        // No moneyDB entry means the balance predates moneyDB (or was never
        // mirrored): keep the score the player already has instead of
        // replacing it with the starter money.
        if (playerMoney == undefined) playerMoney = Scoreboard.getScore(player, this.MoneyObjective)
        if (playerMoney == undefined) playerMoney = this.getStarterMoney()
        this.setMoney(player.name, playerMoney)
        this.MoneyDatabase.set(player.name, playerMoney)
      }
    })

    world.beforeEvents.playerLeave.subscribe(({ player }) => {
      console.log(`${player.name} is leaving, saving money...`)
      const playerMoney = world.scoreboard.getObjective(this.MoneyObjective).getScore(player)
      this.MoneyDatabase.set(player.name, playerMoney)
      console.log(`${player.name}'s money is saved!`)
    })

    Scoreboard.onChanged.subscribe(this.MoneyObjective, this.#onScoreChanged)

    Restful.listen("mce-getMoney", (data) => {
      return {
        playerMoney: this.getMoney(data.playerName)
      }
    })

    Restful.listen("mce-setMoney", (data) => {
      this.setMoney(data.playerName, data.amount)
    })

    Restful.listen("mce-getAllMoney", (data) => {
      return {
        AllMoney: this.getAllMoney()
      }
    })
  }

  get MoneyObjective() {
    return Server.Setting.get("moneyObjective") ?? Config.MoneyObjective
  }
  /**
   * Get Starter Money
   * @returns {number}
   */
  getStarterMoney() {
    return Server.Setting.get("starterMoney") ?? Config.starterMoney
  }

  /**
   * Get Max Money
   * @returns {number}
   */
  getMaxMoney() {
    return Server.Setting.get("maxMoney") ?? Config.maxMoney
  }

  /**
   * Get Player's Money
   * @param {string} playerName
   * @returns {number}
   */
  getMoney(playerName) {
    let player = Server.getPlayer(playerName)
    let playerMoney = undefined
    if (player != undefined) {
      playerMoney = world.scoreboard.getObjective(this.MoneyObjective).getScore(player)
    } else {
      playerMoney = this.MoneyDatabase.get(playerName)
    }
    if (playerMoney == undefined) this.setMoney(playerName, this.getStarterMoney())
    return playerMoney ?? this.getStarterMoney()
  }

  /**
   * Set Player's Money
   * @param {string} playerName 
   * @param {number} money 
   */
  setMoney(playerName, money) {
    let player = Server.getPlayer(playerName)
    if (player != undefined) {
      player.setScore(this.MoneyObjective, money)
    }
    this.MoneyDatabase.set(playerName, money)
  }

  /**
   * @returns {MoneyStructure[]}
   */
  getAllMoney() {
    let Data = []
    this.MoneyDatabase.forEach((key, value) => {
      Data.push({
        playerName: key,
        playerMoney: value
      })
    })
    return Data
  }

  async resetData() {
    await this.MoneyDatabase.clear()
    await world.scoreboard.removeObjective(this.MoneyObjective)
    await world.scoreboard.addObjective(this.MoneyObjective)
    for (const player of world.getAllPlayers()) {
      player.setMoney(this.getStarterMoney())
    }
  }

  /**
   * Rename the money scoreboard objective, migrating every score (online
   * players and offline entries alike) into the new objective
   * @param {string} newName
   * @returns {Promise<{renamed: boolean, from?: string, to?: string, error?: any}>}
   */
  async renameObjective(newName) {
    const oldName = this.MoneyObjective
    if (newName == oldName) return { renamed: false, error: "SameName" }
    if (Scoreboard.checkObjective(newName)) return { renamed: false, error: "Exists" }

    if (!Scoreboard.checkObjective(oldName)) await world.scoreboard.addObjective(oldName)
    const oldObjective = world.scoreboard.getObjective(oldName)
    let newObjective
    try {
      newObjective = await world.scoreboard.addObjective(newName)
    } catch (err) {
      return { renamed: false, error: err }
    }

    try {
      for (const { participant, score } of oldObjective.getScores()) {
        newObjective.setScore(participant, score)
      }
    } catch (err) {
      await world.scoreboard.removeObjective(newName)
      return { renamed: false, error: err }
    }

    await world.scoreboard.removeObjective(oldName)
    Server.Setting.set("moneyObjective", newName)
    Scoreboard.onChanged.unsubscribe(oldName)
    Scoreboard.onChanged.subscribe(newName, this.#onScoreChanged)
    return { renamed: true, from: oldName, to: newName }
  }
}

const Money = new MoneySystem()
export default Money