import { characterActionTypes, characterReducer } from './characterReducer';

describe('characterReducer', () => {
    it('should return initial state', () => {
        expect(characterReducer(undefined, {})).toEqual({});
    });

    it('should handle RESET_CHARACTER_DATA', () => {

        const init = { test: 'initial' };
        const action = {
            type: characterActionTypes.RESET_CHARACTER_DATA,
            data: { test: 'test' }
        };
        const expected = { test: 'test' };
        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle UPDATE_ARTIFACT_TRAITS', () => {

        const init = { artifact: { traits: {} } };
        const action = {
            type: characterActionTypes.UPDATE_ARTIFACT_TRAITS,
            data: 'test'
        };
        const expected = {
            artifact: {
                traits: 'test'
            }
        };
        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle UPDATE_ARTIFACT_RELIC when id != 0', () => {
        const init = {
            gear: {
                mainHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                },
                offHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                }
            },
            artifact: {
                relics: [
                    { id: 1, ilvl: 850 },
                    { id: 1, ilvl: 850 },
                    { id: 1, ilvl: 850 }
                ],
                traits: { 1: 3, 2: 0 }
            }
        };
        const action = {
            type: characterActionTypes.UPDATE_ARTIFACT_RELIC,
            data: {
                slot: 1,
                trait: 2,
                ilvl: 900,
                stats: { agi: 2 },
                weaponStats: {}
            }
        };
        const expected = {
            gear: {
                mainHand: {
                    item_level: 865,
                    stats: { agi: 2 },
                    weaponStats: {}
                },
                offHand: {
                    item_level: 865,
                    stats: { agi: 2 },
                    weaponStats: {}
                }
            },
            artifact: {
                relics: [
                    { id: 1, ilvl: 850 },
                    { id: 2, ilvl: 900 },
                    { id: 1, ilvl: 850 }
                ],
                traits: { 1: 2, 2: 1 }
            }

        };
        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle UPDATE_ARTIFACT_RELIC when id = 0', () => {
        const init = {
            gear: {
                mainHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                },
                offHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                }
            },
            artifact: {
                relics: [
                    { id: 1, ilvl: 850 },
                    { id: 0, ilvl: 850 },
                    { id: 1, ilvl: 850 }
                ],
                traits: { 1: 3, 2: 0 }
            }
        };
        const action = {
            type: characterActionTypes.UPDATE_ARTIFACT_RELIC,
            data: {
                slot: 1,
                trait: 2,
                ilvl: 900,
                stats: { agi: 2 },
                weaponStats: {}
            }
        };
        const expected = {
            gear: {
                mainHand: {
                    item_level: 865,
                    stats: { agi: 2 },
                    weaponStats: {}
                },
                offHand: {
                    item_level: 865,
                    stats: { agi: 2 },
                    weaponStats: {}
                }
            },
            artifact: {
                relics: [
                    { id: 1, ilvl: 850 },
                    { id: 2, ilvl: 900 },
                    { id: 1, ilvl: 850 }
                ],
                traits: { 1: 3, 2: 1 }
            }

        };
        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle UPDATE_ARTIFACT_RELIC when ilvl are equal', () => {
        const init = {
            gear: {
                mainHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                },
                offHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                }
            },
            artifact: {
                relics: [
                    { id: 1, ilvl: 850 },
                    { id: 1, ilvl: 865 },
                    { id: 1, ilvl: 850 }
                ],
                traits: { 1: 3, 2: 0 }
            }
        };
        const action = {
            type: characterActionTypes.UPDATE_ARTIFACT_RELIC,
            data: {
                slot: 1,
                trait: 2,
                ilvl: 865,
                stats: { agi: 2 },
                weaponStats: {}
            }
        };
        const expected = {
            gear: {
                mainHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                },
                offHand: {
                    item_level: 850,
                    stats: { agi: 1 },
                    weaponStats: {}
                }
            },
            artifact: {
                relics: [
                    { id: 1, ilvl: 850 },
                    { id: 2, ilvl: 865 },
                    { id: 1, ilvl: 850 }
                ],
                traits: { 1: 2, 2: 1 }
            }

        };
        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle UPDATE_SPEC', () => {

        const init = { active: 'anything' };
        const action = { type: characterActionTypes.UPDATE_SPEC, data: 'example' };
        const expected = { active: 'example' };

        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle UPDATE_TALENTS', () => {

        const init = { talents: { current: 'initial' } };
        const action = { type: characterActionTypes.UPDATE_TALENTS, data: 'result' };
        const expected = { talents: { current: 'result' } };

        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle CHANGE_ITEM', () => {
        const init = {
            gear: {
                slot: {
                    bonuses: ['nobonuses'],
                    gems: [0],
                    icon: "noicon",
                    id: "noremote_id",
                    item_level: "noitem_level",
                    name: "noname",
                    quality: "noquality",
                    socket_count: "nosocket_count",
                    stats: "nostats"
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_ITEM,
            data: {
                slot: 'slot',
                ilvl: 10,
                item: {
                    id: 'remote_id',
                    icon: 'icon',
                    name: 'name',
                    socket_count: 'socket_count',
                    quality: 3,
                    item_level: 10,
                    bonuses: [10],
                    gems: [0],
                    stats: {agi: 10}
                }
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: [10],
                    gems: [0],
                    icon: "icon",
                    id: "remote_id",
                    item_level: 10,
                    name: "name",
                    quality: 3,
                    socket_count: "socket_count",
                    stats: {agi: 10}
                }
            }
        };
        expect(characterReducer(init, action)).toEqual(expected);
    });

    it('should handle CHANGE_BONUSES when !canHaveBonusSocket', () => {

        const init = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 0,
                    stats: {},
                    itemLevel: 0,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_BONUSES, data: {
                slot: 'slot',
                bonuses: ['test'],
                ilvl: 1,
                newStats: { test: 'test' },
                hasBonusSocket: true,
                canHaveBonusSocket: false
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: ['test'],
                    gems: [],
                    socket_count: 0,
                    stats: { test: 'test' },
                    itemLevel: 1,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };

        expect(characterReducer(init, action)).toEqual(expected);

    });

    it('should handle CHANGE_BONUSES when !hasBonusSocket', () => {

        const init = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 0,
                    stats: {},
                    itemLevel: 0,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_BONUSES,
            data: {
                slot: 'slot',
                bonuses: [],
                ilvl: 1,
                newStats: { test: 'test' },
                hasBonusSocket: false,
                canHaveBonusSocket: true
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [0],
                    socket_count: 0,
                    stats: { test: 'test' },
                    itemLevel: 1,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };

        expect(characterReducer(init, action)).toEqual(expected);

    });

    it('should handle CHANGE_BONUSES when socket_count is 0', () => {

        const init = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 0,
                    stats: {},
                    itemLevel: 0,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_BONUSES,
            data: {
                slot: 'slot',
                bonuses: [],
                ilvl: 1,
                newStats: { test: 'test' },
                hasBonusSocket: true,
                canHaveBonusSocket: true
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [0],
                    socket_count: 1,
                    stats: { test: 'test' },
                    itemLevel: 1,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };

        expect(characterReducer(init, action)).toEqual(expected);

    });

    it('should handle CHANGE_BONUSES when socket_count is !0', () => {

        const init = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 1,
                    stats: {},
                    itemLevel: 0,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_BONUSES,
            data: {
                slot: 'slot',
                bonuses: [],
                ilvl: 1,
                newStats: { test: 'test' },
                hasBonusSocket: true,
                canHaveBonusSocket: true
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 1,
                    stats: { test: 'test' },
                    itemLevel: 1,
                    hasBonusSocket: true,
                    canHaveBonusSocket: false
                }
            }
        };

        expect(characterReducer(init, action)).toEqual(expected);

    });

    it('should handle CHANGE_ENCHANT', () => {

        const init = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 1,
                    stats: {},
                    itemLevel: 0,
                    enchant: 0
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_ENCHANT,
            data: {
                slot: "slot",
                enchant: 12345
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [],
                    socket_count: 1,
                    stats: {},
                    itemLevel: 0,
                    enchant: 12345
                }
            }
        };

        expect(characterReducer(init, action)).toEqual(expected);

    });

    it('should handle CHANGE_GEM', () => {

        const init = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [
                        {
                            name: "gem1",
                            id: 1,
                            icon: "icon1",
                            quality: 3,
                            bonus: "+150 Mastery",
                            gemslot: 1
                        }],
                    socket_count: 1,
                    stats: {},
                    itemLevel: 0,
                    enchant: 0
                }
            }
        };
        const action = {
            type: characterActionTypes.CHANGE_GEM,
            data: {
                slot: "slot",
                gemSlot: 0,
                gem: {
                    id: 130222,
                    is_gem: true,
                    name: "Masterful Shadowruby",
                    icon: "inv_jewelcrafting_70_cutgem03_purple",
                    gem_slot: "Prismatic",
                    quality: 3,
                    stats: {
                        haste: 200
                    }
                }
            }
        };
        const expected = {
            gear: {
                slot: {
                    bonuses: [],
                    gems: [
                        {
                            name: "Masterful Shadowruby",
                            id: 130222,
                            icon: "inv_jewelcrafting_70_cutgem03_purple",
                            quality: 3,
                            bonus: "+200 Haste",
                            gemslot: 130222
                        }],
                    socket_count: 1,
                    stats: {},
                    itemLevel: 0,
                    enchant: 0
                }
            }
        };

        expect(characterReducer(init, action)).toEqual(expected);

    });
}
);
