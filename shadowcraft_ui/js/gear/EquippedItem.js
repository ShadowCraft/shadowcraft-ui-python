import React from 'react';
import EquippedGemList from './EquippedGemsList';
import EquippedEnchant from './EquippedEnchant';

export default class EquippedItem extends React.Component {

    IsEnchantable(slot) {
        switch (slot) {
            case 'neck': return true;
            case 'finger1': return true;
            case 'finger2': return true;
            case 'back': return true;
            default: return false;
        }
    }

    render() {
        let item = this.props.item;
        // console.log(item)
        return (
            // do we need all these data targets?
            <div
                className="slot"
                data-bonus={item.bonusids}
                data-context={item.context}
                data-name={item.name}
                data-quality={item.quality}
                data-slot={item.slot}
                data-id={item.id}
            >
                <div className="image">
                    <img src={`http://media.blizzard.com/wow/icons/56/${item.icon}.jpg`} />
                    <span className="ilvl">{item.item_level}</span>
                </div>
                <div className="lock lock_off">
                    <img src="/static/images/lock_off.png" />
                </div>
                <div
                    className="name quality-4 tt"
                    data-tooltip-bonus={item.bonuses}
                    data-tooltip-gems={item.gems}
                    data-tooltip-id={item.id}
                >
                    {item.name}
                    <em className="heroic">TODO: bonus text</em>
                    <a className="wowhead" href={`http://legion.wowhead.com/item=${item.id}`} target="_blank">Wowhead</a>
                </div>
                <div className="bonuses">
                    {/*this probably doesn't need a huge full length div, maybe a gear under the item icon instead?'*/}
                    <img alt="Reforge" src="/static/images/reforge.png" />Modify Bonuses</div>
                {/*need to pass whole item because we need to check item quality to filter out relics*/}
                <EquippedGemList gems={item.gems} />
                {/*javascript trickery to only show enchants for neck, ring and back*/}
                { this.IsEnchantable(item.slot) && <EquippedEnchant enchantID={item.enchant} />}
            </div >
        );
    }
}