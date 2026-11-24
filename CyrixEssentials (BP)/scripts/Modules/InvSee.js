import { EntityComponentTypes, EquipmentSlot, system, world } from "@minecraft/server";

// Live inventory viewer, adapted from r4isen1920's InvSee v2.0.0 (MIT).
// Instead of a chest form, we spawn an invisible "projector" entity with a real
// 54-slot container and seat the viewer on it, so the client renders the target's
// actual ItemStacks in a real container screen — every icon (vanilla or custom
// addon) renders natively with no texture mapping involved.

const PROJECTOR_ID = "cyx_ess:invsee_projector";
const PROJECTOR_TAG = "invsee";
const NAME_HEADER = "_cyrix:invsee:"; // 14 chars; + 5 equipment flags + ":" = 20
const TARGET_SLOT_COUNT = 41; // 36 inventory + 5 equipment
const PROJECTOR_EQUIPMENT_BASE = 45; // projector slots 45-49 mirror equipment
const EQUIPMENT_ORDER = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Offhand
];

// Resolve via the enum when available; getComponent throws on unknown ids
const CURSOR_INVENTORY_COMPONENT = EntityComponentTypes.CursorInventory ?? "minecraft:cursor_inventory";
const RIDING_COMPONENT = EntityComponentTypes.Riding ?? "minecraft:riding";

// Target slot -> projector slot (target hotbar 0-8 shown as the bottom row 27-35)
const toProjector = (slot) => {
  if (slot < 9) return 27 + slot;
  if (slot < 36) return slot - 9;
  return PROJECTOR_EQUIPMENT_BASE + (slot - 36);
};

// Projector slot -> target slot; undefined for the 9 filler slots (36-44)
const toMirror = (projectorSlot) => {
  if (projectorSlot < 27) return projectorSlot + 9;
  if (projectorSlot < 36) return projectorSlot - 27;
  if (projectorSlot >= PROJECTOR_EQUIPMENT_BASE && projectorSlot < PROJECTOR_EQUIPMENT_BASE + 5)
    return 36 + (projectorSlot - PROJECTOR_EQUIPMENT_BASE);
  return undefined;
};

const UNMAPPED_PROJECTOR_SLOTS = [...Array(54).keys()].filter((slot) => toMirror(slot) === undefined);

// Identity of a stack used to detect slot changes across ticks
const fingerprint = (item) => {
  if (!item) return "";
  const damage = item.getComponent("minecraft:durability")?.damage ?? 0;
  const enchantable = item.getComponent("minecraft:enchantable");
  const enchants = enchantable
    ? enchantable
        .getEnchantments()
        .map((e) => `${e.type.id}${e.level}`)
        .sort()
        .join("+")
    : "";
  return [item.typeId, item.amount, damage, item.nameTag ?? "", item.getLore().join("\n"), enchants].join("|");
};

/**
 * Item held on the player's mouse cursor inside a container screen
 */
const CursorGuard = {
  peek(player) {
    try {
      return player.getComponent(CURSOR_INVENTORY_COMPONENT)?.item;
    } catch {
      return undefined;
    }
  },
  isHolding(player) {
    return this.peek(player) !== undefined;
  },
  reclaim(player, container, dimension, location) {
    const cursor = this.peek(player);
    const component = player.getComponent(CURSOR_INVENTORY_COMPONENT);
    if (!component || !cursor) return false;
    try {
      const leftover = container.addItem(cursor);
      if (leftover) dimension.spawnItem(leftover, location);
      component.clear();
      return true;
    } catch {
      return false;
    }
  }
};

class ProjectorSession {
  constructor(viewer, targetId, entity) {
    this.viewer = viewer;
    this.targetId = targetId;
    this.entity = entity;
    this.nameTagFlags = "";
  }

  static create(viewer, target) {
    SessionManager.closeForViewer(viewer.id);
    try {
      const entity = viewer.dimension.spawnEntity(PROJECTOR_ID, viewer.location);
      entity.addTag(PROJECTOR_TAG);
      entity.setDynamicProperty("cyx_ess:invsee:target", target.id);
      entity.setDynamicProperty("cyx_ess:invsee:viewer", viewer.id);
      if (!entity.getComponent("minecraft:rideable")?.addRider(viewer)) {
        console.warn(`[InvSee] Could not seat viewer: ${viewer.name} on projector, aborting session`);
        entity.remove();
        return null;
      }
      // Hide the riding pose and alert the viewer: scripts cannot force a
      // container screen open, so they must press the inventory key/button
      // themselves (the ride-exit hint is localized in the RP lang files)
      system.runTimeout(() => {
        try {
          viewer.playAnimation("animation.cyx_ess.player.riding.cancel", {
            stopExpression: "q.is_sneaking || !q.is_riding"
          });
        } catch {}
        try {
          const platform = String(viewer.platform ?? "").toLowerCase();
          const how = platform.includes("android") || platform.includes("ios")
            ? "Tap the Inventory button"
            : "Press your Inventory key";
          viewer.onScreenDisplay.setTitle("§l§6Inventory Viewer", {
            fadeInDuration: 2,
            stayDuration: 60,
            fadeOutDuration: 2,
            subtitle: `§e${how}§7 to view §f${target.name}§7's inventory`
          });
          viewer.sendMessage(`§7[InvSee] ${how} to view §e${target.name}§7's inventory. §8Sneak to exit.`);
        } catch {}
      }, 2);
      return new ProjectorSession(viewer, target.id, entity);
    } catch (err) {
      console.warn(`[InvSee] Failed to spawn projector for viewer: ${viewer.name}, error: ${err}`);
      return null;
    }
  }

  get isValid() {
    return this.entity.isValid && this.viewer.isValid;
  }

  get container() {
    if (this.entity.isValid) return this.entity.getComponent("minecraft:inventory")?.container;
  }

  get isAbandoned() {
    if (!this.isValid) return true;
    try {
      return this.viewer.getComponent(RIDING_COMPONENT)?.entityRidingOn.id !== this.entity.id;
    } catch {
      return true;
    }
  }

  readSlot(targetSlot) {
    return this.container?.getItem(toProjector(targetSlot));
  }

  writeSlot(targetSlot, item) {
    this.container?.setItem(toProjector(targetSlot), item);
  }

  refreshNameTag(flags, targetName) {
    if (flags === this.nameTagFlags) return;
    this.nameTagFlags = flags;
    this.entity.nameTag = `${NAME_HEADER}${flags}:${targetName}`;
  }

  reclaimUnmappedSlots() {
    const container = this.container;
    const viewerInventory = this.viewer.getComponent("minecraft:inventory")?.container;
    if (!container || !viewerInventory) return;
    for (const slot of UNMAPPED_PROJECTOR_SLOTS) {
      const item = container.getItem(slot);
      if (!item) continue;
      const leftover = viewerInventory.addItem(item);
      if (leftover) this.viewer.dimension.spawnItem(leftover, this.viewer.location);
      container.setItem(slot, undefined);
    }
  }

  reclaimCursor() {
    const viewerInventory = this.viewer.getComponent("minecraft:inventory")?.container;
    if (!viewerInventory) return false;
    return CursorGuard.reclaim(this.viewer, viewerInventory, this.viewer.dimension, this.viewer.location);
  }

  dropAtViewer(item) {
    try {
      this.viewer.dimension.spawnItem(item, this.viewer.location);
    } catch (err) {
      console.warn(`[InvSee] Failed to drop refused item for viewer: ${this.viewer.name}, error: ${err}`);
    }
  }

  dispose() {
    try {
      if (this.entity.isValid) {
        this.entity.getComponent("minecraft:rideable")?.ejectRiders();
        this.entity.remove();
      }
    } catch (err) {
      console.warn(`[InvSee] Failed to dispose projector for viewer: ${this.viewer.name}, error: ${err}`);
    }
  }
}

class TargetWatch {
  constructor(target) {
    this.target = target;
    this.sessions = [];
    this.mirror = new Array(TARGET_SLOT_COUNT).fill("");
    this.dirty = true;
  }

  get targetId() {
    return this.target.id;
  }

  get isEmpty() {
    return this.sessions.length === 0;
  }

  getSessions() {
    return this.sessions;
  }

  addSession(session) {
    this.sessions.push(session);
    this.prime(session);
  }

  removeSession(session) {
    const index = this.sessions.indexOf(session);
    if (index >= 0) this.sessions.splice(index, 1);
  }

  markDirty() {
    this.dirty = true;
  }

  isTransactionPending() {
    return CursorGuard.isHolding(this.target) || this.sessions.some((session) => CursorGuard.isHolding(session.viewer));
  }

  tick() {
    if (!this.target.isValid || this.isTransactionPending()) return;
    if (this.dirty) {
      this.dirty = false;
      this.pull();
    }
    for (const session of this.sessions) {
      if (!session.isValid) continue;
      this.push(session);
      session.reclaimUnmappedSlots();
    }
  }

  pull() {
    let equipmentChanged = false;
    for (let slot = 0; slot < TARGET_SLOT_COUNT; slot++) {
      const item = this.readTarget(slot);
      const mark = fingerprint(item);
      if (mark === this.mirror[slot]) continue;
      this.mirror[slot] = mark;
      if (!equipmentChanged && slot >= 36) equipmentChanged = true;
      for (const session of this.sessions) session.writeSlot(slot, item);
    }
    if (equipmentChanged) this.refreshNameTags();
  }

  push(session) {
    let equipmentChanged = false;
    for (let slot = 0; slot < TARGET_SLOT_COUNT; slot++) {
      const item = session.readSlot(slot);
      const mark = fingerprint(item);
      if (mark === this.mirror[slot]) continue;
      if (!this.writeTarget(slot, item)) {
        this.reject(session, slot, item);
        equipmentChanged = true;
        continue;
      }
      this.mirror[slot] = mark;
      if (!equipmentChanged && slot >= 36) equipmentChanged = true;
      for (const other of this.sessions) {
        if (other !== session) other.writeSlot(slot, item);
      }
    }
    if (equipmentChanged) this.refreshNameTags();
  }

  reject(session, slot, refused) {
    const current = this.readTarget(slot);
    this.mirror[slot] = fingerprint(current);
    for (const other of this.sessions) other.writeSlot(slot, current);
    if (refused) session.dropAtViewer(refused);
  }

  claimsFromTarget(session, item) {
    const mark = fingerprint(item);
    for (let slot = 0; slot < TARGET_SLOT_COUNT; slot++) {
      if (this.mirror[slot] === mark && session.readSlot(slot) === undefined) return true;
    }
    return false;
  }

  get targetContainer() {
    if (this.target.isValid) return this.target.getComponent("minecraft:inventory")?.container;
  }

  prime(session) {
    for (let slot = 0; slot < TARGET_SLOT_COUNT; slot++) {
      const item = this.readTarget(slot);
      this.mirror[slot] = fingerprint(item);
      session.writeSlot(slot, item);
    }
    this.refreshNameTags();
  }

  readTarget(slot) {
    if (!this.target.isValid) return;
    if (slot < 36) return this.targetContainer?.getItem(slot);
    const equipmentSlot = EQUIPMENT_ORDER[slot - 36];
    if (equipmentSlot) return this.target.getComponent("minecraft:equippable")?.getEquipment(equipmentSlot);
  }

  writeTarget(slot, item) {
    if (!this.target.isValid) return false;
    if (slot < 36) {
      const container = this.targetContainer;
      if (!container) return false;
      container.setItem(slot, item);
      return true;
    }
    const equipmentSlot = EQUIPMENT_ORDER[slot - 36];
    if (!equipmentSlot) return false;
    try {
      return this.target.getComponent("minecraft:equippable")?.setEquipment(equipmentSlot, item) ?? false;
    } catch (err) {
      console.warn(`[InvSee] Failed to equip target: ${this.target.name}, slot: ${equipmentSlot}, error: ${err}`);
      return false;
    }
  }

  refreshNameTags() {
    const flags = EQUIPMENT_ORDER.map((_, i) => (this.mirror[36 + i] !== "" ? "a" : "b")).join("");
    for (const session of this.sessions) session.refreshNameTag(flags, this.target.name);
  }
}

const SessionManager = {
  watches: new Map(),
  byViewer: new Map(),
  byProjector: new Map(),

  open(viewer, target) {
    const session = ProjectorSession.create(viewer, target);
    if (!session) return false;
    let watch = this.watches.get(target.id);
    if (!watch) {
      watch = new TargetWatch(target);
      this.watches.set(target.id, watch);
    }
    watch.addSession(session);
    this.byViewer.set(viewer.id, session);
    this.byProjector.set(session.entity.id, session);
    return true;
  },

  getWatches() {
    return Array.from(this.watches.values());
  },

  getByProjector(entityId) {
    return this.byProjector.get(entityId);
  },

  markDirty(targetId) {
    this.watches.get(targetId)?.markDirty();
  },

  onContainerClosed(session) {
    system.run(() => this.closeByProjector(session.entity.id));
  },

  closeForViewer(viewerId) {
    const session = this.byViewer.get(viewerId);
    if (session) this.close(session);
  },

  closeForTarget(targetId) {
    const watch = this.watches.get(targetId);
    if (!watch) return;
    for (const session of [...watch.getSessions()]) this.close(session);
  },

  closeByProjector(entityId) {
    const session = this.byProjector.get(entityId);
    if (session) this.close(session);
  },

  close(session) {
    this.byViewer.delete(session.viewer.id);
    this.byProjector.delete(session.entity.id);
    this.settle(session);
    const watch = this.watches.get(session.targetId);
    watch?.removeSession(session);
    if (watch?.isEmpty) this.watches.delete(session.targetId);
    session.dispose();
  },

  // Return whatever the viewer was holding when the screen closed
  settle(session) {
    if (!session.isValid) return;
    const watch = this.watches.get(session.targetId);
    if (!watch) return;
    const cursorItem = CursorGuard.peek(session.viewer);
    const claimedFromTarget = cursorItem ? watch.claimsFromTarget(session, cursorItem) : false;
    watch.push(session);
    session.reclaimUnmappedSlots();
    if (!cursorItem) return;
    const targetContainer = watch.targetContainer;
    if (claimedFromTarget && targetContainer && watch.target.isValid) {
      CursorGuard.reclaim(session.viewer, targetContainer, watch.target.dimension, watch.target.location);
      watch.markDirty();
      return;
    }
    session.reclaimCursor();
  },

  sweepOrphans() {
    let removed = 0;
    for (const dimensionId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
      let entities;
      try {
        entities = world.getDimension(dimensionId).getEntities({ type: PROJECTOR_ID, tags: [PROJECTOR_TAG] });
      } catch {
        continue;
      }
      for (const entity of entities) {
        const session = this.byProjector.get(entity.id);
        if (!session) {
          entity.remove();
          removed++;
        } else if (session.isAbandoned) {
          this.closeByProjector(entity.id);
        }
      }
    }
    if (removed > 0) console.warn(`[InvSee] Swept ${removed} orphaned projector(s)`);
  }
};

let installed = false;
const install = () => {
  if (installed) return;
  installed = true;

  // Keep the mirror fresh: item changes mark the watch dirty, equipment has no
  // event so every watch is re-pulled on a short period.
  system.runInterval(() => {
    for (const watch of SessionManager.getWatches()) watch.tick();
  }, 1);
  system.runInterval(() => {
    for (const watch of SessionManager.getWatches()) watch.markDirty();
  }, 4);
  system.runInterval(() => SessionManager.sweepOrphans(), 20);

  const subscribe = (event, handler) => {
    try {
      event?.subscribe(handler);
    } catch (err) {
      console.warn(`[InvSee] Failed to subscribe to event: ${err}`);
    }
  };
  subscribe(world.afterEvents.playerInventoryItemChange, (data) => SessionManager.markDirty(data.player.id));
  subscribe(world.afterEvents.entityContainerClosed, (data) => {
    const session = SessionManager.getByProjector(data.entity.id);
    if (session) SessionManager.onContainerClosed(session);
  });
  subscribe(world.afterEvents.entityRemove, (data) => SessionManager.closeByProjector(data.removedEntityId));
  subscribe(world.afterEvents.playerLeave, (data) => {
    SessionManager.closeForViewer(data.playerId);
    SessionManager.closeForTarget(data.playerId);
  });
  subscribe(world.afterEvents.playerDimensionChange, (data) => SessionManager.closeForViewer(data.player.id));
};

install();

const InvSee = {
  /**
   * Open a live inventory viewer for the target player
   * @param {import("@minecraft/server").Player} viewer
   * @param {import("@minecraft/server").Player} target
   * @returns {boolean}
   */
  open(viewer, target) {
    return SessionManager.open(viewer, target);
  }
};

export default InvSee;
