import { getArtifactIlvlChange } from '../common';
import dotProp from 'dot-prop-immutable';

export const characterActionTypes = {
    RESET_CHARACTER_DATA: 'RESET_CHARACTER_DATA',
    UPDATE_ARTIFACT_TRAITS: 'UPDATE_ARTIFACT_TRAITS',
    UPDATE_ARTIFACT_RELIC: 'UPDATE_ARTIFACT_RELIC',
    UPDATE_SPEC: 'UPDATE_SPEC',
    UPDATE_TALENTS: 'UPDATE_TALENTS',
    CHANGE_ITEM: 'CHANGE_ITEM',
    CHANGE_BONUSES: 'CHANGE_BONUSES',
    CHANGE_GEM: 'CHANGE_GEM',
    CHANGE_ENCHANT: 'CHANGE_ENCHANT',
    OPTIMIZE_GEMS: 'OPTIMIZE_GEMS',
    OPTIMIZE_ENCHANTS: 'OPTIMIZE_ENCHANTS',
};

export const characterReducer = function (state = {}, action) {

    switch (action.type) {

        case characterActionTypes.RESET_CHARACTER_DATA: {
            return Object.assign({}, state, action.data);
        }

        case characterActionTypes.UPDATE_ARTIFACT_TRAITS: {
            return dotProp.set(state, 'artifact.traits', action.data);
        }

        case characterActionTypes.UPDATE_ARTIFACT_RELIC: {

            // TODO: dotProp-ify
            let newState = Object.assign({}, state);
            if (newState.artifact.relics[action.data.slot].id != 0) {
                newState.artifact.traits[newState.artifact.relics[action.data.slot].id] -= 1;
            }

            // Determine what the artifact's ilvl should be based on any relic changes
            if (newState.artifact.relics[action.data.slot].ilvl != action.data.ilvl) {

                let change = getArtifactIlvlChange(newState.artifact.relics[action.data.slot].ilvl, action.data.ilvl);

                newState.artifact.relics[action.data.slot].ilvl = action.data.ilvl;

                newState.gear['mainHand'].item_level += change;
                newState.gear['mainHand'].stats = action.data.stats;
                newState.gear['mainHand'].weaponStats = action.data.weaponStats;

                newState.gear['offHand'].item_level += change;
                newState.gear['offHand'].stats = action.data.stats;
                newState.gear['offHand'].weaponStats = action.data.weaponStats;
            }

            newState.artifact.relics[action.data.slot].id = action.data.trait;

            // Update the new trait
            newState.artifact.traits[action.data.trait] += 1;

            return Object.assign({}, state, newState);
        }

        case characterActionTypes.UPDATE_SPEC: {
            return dotProp.set(state, "active", action.data);
        }

        case characterActionTypes.UPDATE_TALENTS: {
            return dotProp.set(state, "talents.current", action.data);
        }

        case characterActionTypes.CHANGE_ITEM: {

            let item = dotProp.get(state, `gear.${action.data.slot}`);
            
            item.icon = action.data.item.icon;
            item.id = action.data.item.id;
            item.name = action.data.item.name;
            item.socket_count = action.data.item.socket_count;
            item.item_level = action.data.item.item_level;
            item.stats = action.data.item.stats;
            item.quality = action.data.item.quality;
            item.bonuses = action.data.item.bonuses;

            // Generate a number of gem entries based on the number of sockets on the item
            item.gems = new Array(item.socket_count);
            item.gems.fill(0);

            let newData = dotProp.merge(state, `gear.${action.data.slot}`, item);
            console.log(state);
            console.log(newData);
            return newData;
        }

        case characterActionTypes.CHANGE_BONUSES: {

            let newData = {bonuses: action.data.bonuses,
                           itemLevel: action.data.ilvl,
                           stats: action.data.newStats};
            
            // If this item can have a bonus socket but doesn't have one assigned, nuke
            // the equipped gems out of it so they don't show back up when if a socket
            // gets added back in.
            if (action.data.canHaveBonusSocket) {
                if (!action.data.hasBonusSocket) {
                    newData.gems = [0];
                    newData.socket_count = 0;
                }
                else if (state.gear[action.data.slot].socket_count == 0) {
                    newData.gems = [0];
                    newData.socket_count = 1;
                }
            }

            return dotProp.merge(state, `gear.${action.data.slot}`, newData);
        }

        case characterActionTypes.CHANGE_GEM: {

            // TODO: why is gemslot and id the same thing?
            let newGem = {
                gemslot: action.data.gem.id,
                icon: action.data.gem.icon,
                id: action.data.gem.id,
                name: action.data.gem.name,
                quality: action.data.gem.quality,
                bonus: ""
            }

            for (let stat in action.data.gem.stats) {
                let capStat = stat.charAt(0).toUpperCase() + stat.slice(1);
                newGem.bonus = newGem.bonus.concat(`+${action.data.gem.stats[stat]} ${capStat} / `);
            }

            newGem.bonus = newGem.bonus.slice(0, -3);
            return dotProp.set(state, `gear.${action.data.slot}.gems.${action.data.gemSlot}`, newGem);
        }

        case characterActionTypes.CHANGE_ENCHANT: {
            return dotProp.set(state, `gear.${action.data.slot}.enchant`, action.data.enchant);
        }

        case characterActionTypes.OPTIMIZE_GEMS: {
            
            let newRareGem = {
                gemslot: action.data.rare.id,
                icon: action.data.rare.icon,
                id: action.data.rare.id,
                name: action.data.rare.name,
                quality: action.data.rare.quality,
                bonus: ""
            }

            let newState = state;

            // Set all of the gems to the new rare gem, keeping track of whether or not
            // we found an epic agi gem somewhere in there.
            let foundAgiGem = false;
            let firstGemSlot = null;
            for (let slot in state.gear) {
                for (let idx = 0; idx < state.gear[slot].socket_count; idx++) {
                    if (firstGemSlot == null) {
                        firstGemSlot = slot;
                    }

                    if (state.gear[slot].gems[idx].id == action.data.epic.id) {
                        foundAgiGem = true;
                    } else if (state.gear[slot].gems[idx].id != action.data.epic.id && state.gear[slot].gems[idx].id != action.data.rare.id) {
                        newState = dotProp.set(state, `gear.${slot}.gems.${idx}`, newRareGem);
                    }
                }
            }

            // If we didn't find an epic gem, set the first available gem slot to that.
            if (!foundAgiGem && firstGemSlot != null) {
                let newEpicGem = {
                    gemslot: action.data.epic.id,
                    icon: action.data.epic.icon,
                    id: action.data.epic.id,
                    name: action.data.epic.name,
                    quality: action.data.epic.quality,
                    bonus: ""
                }

                newState = dotProp.set(newState, `gear.${firstGemSlot}.gems.0`,newEpicGem);
            }

            if (newState != null) {
                return newState;
            }
            else {
                return state;
            }
        }

        case characterActionTypes.OPTIMIZE_ENCHANTS: {

            let newState = dotProp.set(state, 'gear.neck.enchant', action.data.neck);
            newState = dotProp.set(newState, 'gear.back.enchant', action.data.back);
            newState = dotProp.set(newState, 'gear.finger1.enchant', action.data.finger);
            newState = dotProp.set(newState, 'gear.finger2.enchant', action.data.finger);

            return newState;
        }
    }

    return state;
};
