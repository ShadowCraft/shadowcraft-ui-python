import React from 'react';
import { connect } from 'react-redux';
import deepClone from 'deep-clone';
import PropTypes from 'prop-types';
import Item from '../viewModels/Item';

import store from '../store';
import { modalTypes } from '../reducers/modalReducer';
import EquippedGemList from './EquippedGemList';
import EquippedEnchant from './EquippedEnchant';
import { ITEM_DATA } from '../item_data';

class EquippedItem extends React.Component {

    constructor(props) {
        super(props);
        this.onBonusClick = this.onBonusClick.bind(this);
    }

    componentWillMount() {
        this.checkForWarnings(this.props);
    }

    shouldComponentUpdate(nextProps) {
        return !this.props.equippedItem.equals(nextProps.equippedItem);
    }

    componentWillUpdate(nextProps) {
        this.checkForWarnings(nextProps);
    }

    checkForWarnings(props) {
        // Don't do anything here if this is a default or None item
        if (props.equippedItem.get('id') == 0) {
            return;
        }

        let newWarnings = [];

        if (this.IsEnchantable(props.slot)) {
            if (props.equippedItem.get('enchant') == 0) {
                let quality = `quality-${props.equippedItem.get('quality')}`;
                newWarnings.push(<div><span key={`${props.equippedItem.get('name')}enchant`} className={quality}>{props.equippedItem.get('name')}</span> is missing an enchant</div>);
            }
        }

        let missingGem = false;
        if (props.equippedItem.get('socket_count') > 0) {
            props.equippedItem.get('gems').valueSeq().forEach(function (gem) {
                if (gem.get('id') == 0) {
                    missingGem = true;
                }
            });
        }

        if (missingGem) {
            let quality = `quality-${props.equippedItem.get('quality')}`;
            newWarnings.push(<div><span key={`${props.equippedItem.get('name')}gem`} className={quality}>{props.equippedItem.get('name')}</span> is missing one or more gems</div>);
        }

        store.dispatch({
            type: 'ADD_MULTIPLE_WARNINGS',
            component: this, warnings: newWarnings
        });
    }

    IsEnchantable(slot) {
        switch (slot) {
            case 'neck': return true;
            case 'finger1': return true;
            case 'finger2': return true;
            case 'back': return true;
            default: return false;
        }
    }

    generateItemVariants(baseItem) {
        let items = [baseItem];
        return items;
    }

    onClick() {

        let itemData = ITEM_DATA.filter(function (item) {
            return item.equip_location == this.adjustSlotName(this.props.slot);
        }.bind(this));

        // Don't pass over any item outside of the item level filtering.
        let min_ilvl = -1;
        let max_ilvl = -1;
        if (this.props.dynamic_ilvl) {
            min_ilvl = this.props.equippedItem.item_level - 50;
            max_ilvl = this.props.equippedItem.item_level + 50;
        }
        else {
            min_ilvl = this.props.min_ilvl;
            max_ilvl = this.props.max_ilvl;
        }

        // TODO: would a map() be faster here? Can I do this transformation in a
        // map()?
        let allItems = [];
        let numItems = itemData.length;
        for (let idx = 0; idx < numItems; idx++) {
            let item = itemData[idx];
            let variants = this.generateItemVariants(item);

            let foundMatch = false;
            variants.forEach(function(item) {
                if (item.id == this.props.equippedItem.id &&
                    item.ilevel == this.props.equippedItem.item_level) {
                    foundMatch = true;
                }
            }.bind(this));

            allItems = allItems.concat(variants);

            if (!foundMatch && item.id == this.props.equippedItem.id) {
                let copy = deepClone(item);
                let equipped = this.props.equippedItem;
                copy['item_level'] = equipped.item_level;
                copy['bonuses'] = equipped.bonuses.toJS();
                copy['stats'] = Object.assign({}, equipped.stats.toJS());
                copy['quality'] = equipped.quality;
                allItems.push(copy);
            }
        }

        // Add a "None" item to the end of the array that will always have a zero EP.
        allItems.push({
            id: 0,
            name: "None",
            icon: "inv_misc_questionmark",
            quality: 0,
            item_level: 0,
            stats: {},
            socket_count: 0,
            bonuses: [],
        });

        store.dispatch({
            type: "OPEN_MODAL",
            data: {
                popupType: modalTypes.ITEM_SELECT,
                props: {
                    slot: this.props.slot,
                    items: allItems, isGem: false
                }
            }
        });
    }

    onBonusClick(e) {
        e.preventDefault();

        store.dispatch({
            type: "OPEN_MODAL",
            data: {
                popupType: modalTypes.ITEM_BONUSES,
                props: { item: this.props.equippedItem }
            }
        });
    }

    adjustSlotName(slot) {
        switch (slot) {
            case 'trinket1':
            case 'trinket2':
                return 'trinket';
            case 'finger1':
            case 'finger2':
                return 'finger';
            default:
                return slot;
        }
    }

    buildTooltipURL(item) {
        let url = `http://wowdb.com/items/${item.id}`;
        if (item.bonuses.size > 0) {
            url += `?bonusIDs=${item.bonuses.toJS().toString()}`;
        }
        return url;
    }

    render() {
        return (
            <div>
                <div className="slot">
                    <div className="image">
                        <img src={`http://render-us.worldofwarcraft.com/icons/56/${this.props.equippedItem.icon}.jpg`} />
                        <span className="ilvl">{this.props.equippedItem.item_level}</span>
                    </div>
                    <div className={`name quality-${this.props.equippedItem.quality}`} onClick={this.props.equippedItem.slot !== "mainHand" ? this.onClick.bind(this) : null} >
                        <span data-tooltip-href={this.buildTooltipURL(this.props.equippedItem)}>{this.props.equippedItem.name}</span>
                        <a className="wowhead" href={`http://legion.wowhead.com/item=${this.props.equippedItem.id}`} target="_blank">Wowhead</a>
                    </div>
                    {this.props.equippedItem.quality != 6 && <div className="bonuses" onClick={this.onBonusClick} >
                        <img alt="Reforge" src="/static/images/reforge.png" />Modify Bonuses</div>}
                    {/*need to pass whole item because we need to check item quality to filter out relics*/}
                    {this.props.equippedItem.socket_count > 0 && <EquippedGemList item={this.props.equippedItem} />}
                    {this.IsEnchantable(this.props.equippedItem.slot) && <EquippedEnchant item={this.props.equippedItem} />}
                </div >
            </div>
        );
    }
}

EquippedItem.propTypes = {
    equippedItem: PropTypes.instanceOf(Item).isRequired,
    slot: PropTypes.string.isRequired,
    // TODO: modify RESET_SETTINGS in a more appropriate manner and add isRequired back
    dynamic_ilvl: PropTypes.bool,
    min_ilvl: PropTypes.string,
    max_ilvl: PropTypes.string,
};

const mapStateToProps = function (store, ownProps) {
    return {
        equippedItem: store.character.getIn(['gear', ownProps.slot]),
        dynamic_ilvl: store.settings.current.get('dynamic_ilvl'),
        min_ilvl: store.settings.current.get('min_ilvl'),
        max_ilvl: store.settings.current.get('max_ilvl'),
    };
};

export default connect(mapStateToProps)(EquippedItem);
