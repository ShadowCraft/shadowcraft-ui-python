import { getTOSItems } from './TombOfSargeras';
import { getNHItems } from './Nighthold';
import { getLegionCraftedItems } from './legionCraftedItems';
import { getDungeonItems } from './dungeonItems';
import { getENItems } from './EmeraldNightmare';
import { getTOVItems } from './TrialOfValor';
import { getAntorusItems } from './Antorus';
import { getPVPItems } from './pvpItems';
import { ITEM_DATA } from '../item_data';

// we can just register the different definitions here (the multiple TOS entrys are just an example, they would all be different)
// we can also impliment any caching or local storage stategies here
export function getItems(slot = 'head', min = 0, max = 10000, currentIlvl) {
    return [
        ...getTOSItems(slot, min, max), // important to spread into this array, not just assign
        ...getNHItems(slot, min, max),
        ...getLegionCraftedItems(slot, currentIlvl),
        ...getDungeonItems(slot, currentIlvl),
        ...getENItems(slot, min, max),
        ...getTOVItems(slot, min, max),
        ...getAntorusItems(slot, min, max),
        ...getPVPItems(slot, min, max),
        ...
        { // this is the empty slot icon
            id: 0,
            name: "None",
            icon: "inv_misc_questionmark",
            quality: 0,
            item_level: 0,
            stats: {},
            socket_count: 0,
            bonuses: [],
        }
    ];
} 

export function findMissingItems() {

    // Get the items for every slot and sort them.
    let ids = [];
    let slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger', 'trinket', 'mainHand', 'offHand'];
    for (let slotIdx in slots) {
        let items = getItems(slots[slotIdx], 0, 10000, 0);
        for (let itemIdx in items) {
            ids.push(items[itemIdx].id);
        }
    }
    let uniqueIds = [...new Set(ids)];

    // Get the items for every item in the ITEM_DATA and sort them.
    let dbIds = [];
    let missingItems = ITEM_DATA.filter(item => uniqueIds.indexOf(item.id) == -1);
    let missingIds = [];
    for (let idx in missingItems) {
        missingIds.push({"id": missingItems[idx].id, "name": missingItems[idx].name});
    }
    console.log(missingIds);
    return missingItems;
}
