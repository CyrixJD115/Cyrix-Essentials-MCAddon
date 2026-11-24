import { ActionFormData } from '@minecraft/server-ui';
import { typeIdToID, typeIdToDataId } from "./typeIds.js";
import { BlockTypes, ItemStack, ItemTypes, world } from '@minecraft/server';
import Config from '../Configuration.js';
import { TextureList } from '../textureList.js';
import Setting from './Setting.js';

/**
 * Credit:
 * Maintained by Herobrine64 & LeGend077.
*/
// The client item registry orders ids as: legacy vanilla (0-255), then every
// data-driven (addon) item type (256+, in registration order), then the newer
// vanilla items (which is why their map ids get the custom-item offset below).
// Enumerate ALL addon item types — spawn eggs and block items included, they
// occupy registry slots too, so the vanilla offset stays correct — and map the
// non-block ones to their registry id so addon items render the right icon.
const addonItems = ItemTypes.getAll().filter(item => !item.id.startsWith("minecraft:"))
const customTypeIdToID = new Map()
addonItems.forEach((item, index) => {
	if (!BlockTypes.get(item.id)) customTypeIdToID.set(item.id, 256 + index)
})
const runtimeCustomItemCount = addonItems.length
console.log(`[System] Custom item amount: ${runtimeCustomItemCount} item(s).`)

// Custom items that could not be resolved to an id, logged once so they can be
// added to TextureList with an explicit texture path.
const unmappedTextures = new Set()
const sizes = new Map([
	['small', [`§c§h§e§s§t§s§m§a§l§l§r`, 27]],
	['shop', [`§s§h§o§p§c§h§e§s§t§r`, 54]]
]);

export default class ChestFormData {
	#titleText; #buttonArray;
	constructor(size = 'small') {
		const sizing = sizes.get(size) ?? ['§c§h§e§s§t§2§7§r', 27];
		/** @internal */
		this.#titleText = sizing[0];
		/** @internal */
		this.#buttonArray = [];
		for (let i = 0; i < sizing[1]; i++)
			this.#buttonArray.push(['', undefined]);
		this.slotCount = sizing[1];
	}
	title(text) {
		this.#titleText += `§m§c§e§r${text}`;
		return this;
	}
	button(slot, itemName, itemDesc, texture, stackSize = 1, enchanted = false, durability = 0) {
		const numberCustomItems = Setting.get("NumberOf_1_16_100_Items") ?? runtimeCustomItemCount
		const vanillaID = typeIdToDataId.get(texture) ?? typeIdToID.get(texture);
		let icon = TextureList[texture]
		if (icon == undefined) {
			if (vanillaID != undefined) {
				icon = ((vanillaID + (vanillaID < 256 ? 0 : numberCustomItems)) * 65536) + (!!enchanted * 32768)
			} else if (customTypeIdToID.has(texture)) {
				icon = (customTypeIdToID.get(texture) * 65536) + (!!enchanted * 32768)
			} else {
				if (texture && !unmappedTextures.has(texture)) {
					unmappedTextures.add(texture)
					console.warn(`[ChestForms] No icon mapping for "${texture}". Add it to textureList.js with a texture path.`)
				}
				icon = texture ?? ""
			}
		}
		this.#buttonArray.splice(slot, 1, [`stack#${Math.min(Math.max(stackSize, 1) || 1, 99).toString().padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r${itemName ?? ''}§r${itemDesc?.length ? `\n§r${itemDesc.join('\n§r')}` : ''}`,
		icon
		]);
		return this;
	}
	pattern(from, pattern, key) {
		for (let i = 0; i < pattern.length; i++) {
			const row = pattern[i];
			for (let j = 0; j < row.length; j++) {
				const letter = row.charAt(j);
				if (key[letter]) {
					const slot = from[1] + j + (from[0] + i) * 9; // Calculate slot index
					const data = key[letter].data;
					const itemName = data.itemName ?? ""
					const itemDesc = data.itemDesc ?? []
					const texture = key[letter].iconPath ?? ""
					const stackSize = data.stackAmount ?? 1
					const enchanted = data.enchanted ?? false
					// console.warn(itemName, itemDesc, texture, stackSize, enchanted)
					this.button(slot, itemName, itemDesc, texture, stackSize, enchanted)
				}
			}
		}
		return this;
	}
	show(player) {
		const form = new ActionFormData()
			.title(this.#titleText);
		this.#buttonArray.forEach(button => {
			form.button(button[0], button[1]?.toString());
		})
		return form.show(player)
	}
}