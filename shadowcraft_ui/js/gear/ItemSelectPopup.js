import React from 'react';
import store from '../store';
import ItemSelectElement from './ItemSelectElement';
import ModalWrapper from '../modals/ModalWrapper';
import { connect } from 'react-redux';

class ItemSelectPopup extends React.Component {

    constructor(props) {
        super(props);
        this.onFilterInput = this.onFilterInput.bind(this);

        this.state = { filter: '' };
    }

    getItemValue(stats, weights) {
        let value = 0;
        //explicit to mind possible mismatched/missing property names
        value += (stats.agility || 0) * weights.agi;
        value += (stats.crit || 0) * weights.crit;
        value += (stats.haste || 0) * weights.haste;
        value += (stats.mastery || 0) * weights.mastery;
        value += (stats.versatility || 0) * weights.versatility;

        return value;
    }

    componentDidMount() {
        // This is a bit of a hack and is probably a bit fragile depending on if wowdb ever
        // changes any of this, but it rescans the DOM for elements that should display a
        // tooltip.
        console.log("popup mounted");
        CurseTips['wowdb-tooltip'].watchElligibleElements();
    }

    sortItems(items, weights) {
        return items.sort((a, b) => {
            // TODO: temporarily only include the first version for every item. This needs to be expanded
            // so that it includes every base-item-level version for each of them.
            let a_ilvl = Object.keys(a.item_stats)[0];
            let b_ilvl = Object.keys(b.item_stats)[0];
            return this.getItemValue(b.item_stats[b_ilvl], weights) - this.getItemValue(a.item_stats[a_ilvl], weights);
        });
    }

    getItemSelectElements(items, weights) {
        // short-circuit if there's no filter yet
        let filteredItems;
        if (this.state.filter.length == 0) {
            filteredItems = items;
        }
        else {
            filteredItems = items.filter(function(item) {
                return item.name.toLowerCase().includes(this.state.filter);
            }.bind(this));
        }

        //presort needed to use first element later for max value prop, don't want to sort twice per render.
        let sortedItems = this.sortItems(filteredItems, weights);

        return sortedItems.map((item, index) => (
            <ItemSelectElement
                key={index}
                slot={this.props.slot}
                item={item}
                value={this.getItemValue(item.item_stats[Object.keys(item.item_stats)[0]], weights)}
                max={this.getItemValue(sortedItems[0].item_stats[Object.keys(sortedItems[0].item_stats)[0]], weights)}
                onClick={this.props.onClick}
            />
        ));
    }

    onFilterInput(e) {
        this.setState({filter: e.target.value.toLowerCase()});
    }

    render() {
        // console.log(this.props.items);
        //TODO: fix the popup dialog placement
        return (
            <ModalWrapper style={{ top: '100px', left: '100px' }} modalId="alternatives">
                <div id="filter">
                    <input className="search" placeholder="Filter..." type="search" onInput={this.onFilterInput}/>
                </div>
                <div className="body" >
                    {this.props.items ? this.getItemSelectElements(this.props.items, this.props.weights) : <div />}
                </div>
                <a className="close-popup ui-dialog-titlebar-close ui-corner-all" role="button" onClick={() => {store.dispatch({type: "CLOSE_MODAL"})}}>
                    <span className="ui-icon ui-icon-closethick" />
                </a>
            </ModalWrapper>
        );
    }
}

const mapStateToProps = function (store) {
    return {
        weights: store.engine.ep
    };
};

export default connect(mapStateToProps)(ItemSelectPopup);
