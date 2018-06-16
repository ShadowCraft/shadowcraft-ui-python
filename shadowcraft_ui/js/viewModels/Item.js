import { Record, List, Map } from 'immutable';
import Azerite from './Azerite';

const initItem = {
    id: 0,
    slot: '',
    name: 'Default Item',
    icon: 'inv_misc_questionmark',
    item_level: 0,
    gems: List(),
    stats: Map({ crit: 0, mastery: 0, agility: 0, stamina: 0 }), //this could probably be a record?
    bonuses: List([0]),
    quality: 0,
    socket_count: 0,
    enchant: 0,
    weaponStats: Map({ min_dmg: 0, max_dmg: 0, speed: 1.0, dps: 0 }), //this could probably be a record?
    azerite: new Azerite()
};

export default class Item extends Record(initItem) {
    constructor(item) {

        let _item = new Record(initItem)();

        if (item !== undefined) {
            _item = _item.set('id', item.id);
            _item = _item.set('slot', item.slot);
            _item = _item.set('name', item.name);
            _item = _item.set('icon', item.icon);
            _item = _item.set('item_level', item.item_level);
            _item = _item.set('quality', item.quality);
            _item = _item.set('socket_count', item.socket_count);
            _item = _item.set('enchant', item.enchant);
            _item = _item.set('bonuses', List(item.bonuses));
            _item = _item.set('stats', Map(item.stats));

            if (item.gems instanceof List) {
                _item = _item.set('gems', item.gems);
            }
            else {
                let gemList = new List();
                for (let idx in item.gems) {
                    if (item.gems[idx] == 0) {
                        gemList = gemList.push(new Map({
                            icon: '',
                            id: 0,
                            name: 'Empty Gem Socket',
                            quality: 0,
                            bonus: ''
                        }));
                    }
                    else {
                        gemList = gemList.push(new Map(item.gems[idx]));
                    }
                }

                _item = _item.set('gems', gemList);
            }

            if (item.weaponStats !== undefined) {
                _item = _item.set('weaponStats', Map(item.weaponStats));
            }

            if (item.slot == 'shoulder' || item.slot == 'head' || item.slot == 'chest') {
                _item = _item.set('azerite', new Azerite(item.azerite));
            }
        }

        super(_item);
    }
}
