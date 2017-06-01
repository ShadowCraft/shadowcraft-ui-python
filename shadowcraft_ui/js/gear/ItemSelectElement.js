import React from 'react';
import { connect } from 'react-redux';
import store from '../store';
import { updateCharacterState } from '../store';


class ItemSelectElement extends React.Component {

    changeItem(slot, item) {
        store.dispatch(
            updateCharacterState(
                'CHANGE_ITEM',
                {
                    slot: slot,
                    item: item
                }
            ));
        this.props.onClick();
    }

    render() {
        let activeGear = this.props.gear[this.props.slot];
        let active = (activeGear.id == this.props.item.remote_id) && (this.props.item.contexts.indexOf(activeGear.context) != -1);
        
        return (
            <div className={`slot ${active ? 'active' : ''}`} onClick={() => this.changeItem(this.props.slot, this.props.item)}>
                <div className="image">
                    <img src={`http://us.media.blizzard.com/wow/icons/56/${this.props.item.properties.icon}.jpg`} />
                    <span className="ilvl">{this.props.item.item_level}</span>
                </div>
                <div className={`name quality-${this.props.item.properties.quality} ${active ? 'active' : ''}`}>
                    {this.props.item.properties.name}
                    <a className="wowhead" href={`http://legion.wowhead.com/item=${this.props.item.remote_id}`} target="_blank">Wowhead</a>
                </div>
                <span className="desc">{this.props.value.toFixed(0)} EP</span>
                <span className="pct">
                    <div className="label">{this.props.value.toFixed(0)}</div>
                    <div className="pct-inner" style={{ width: `${(this.props.value / this.props.max) * 100}%` }} />
                </span>
            </div>
        );
    }
}

const mapStateToProps = function (store) {
    return {
        gear: store.character.gear
    };
};

export default connect(mapStateToProps)(ItemSelectElement);
