import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import store from '../store';
import ItemSelectPopup from '../gear/ItemSelectPopup';
import BonusIDPopup from '../gear/BonusIDPopup';
import DebugURLPopup from './DebugURLPopup';
import ReloadSwirlPopup from './ReloadSwirlPopup';
import AzeritePopup from '../gear/AzeritePopup';

import { modalTypes } from '../reducers/modalReducer';

class ModalConductor extends React.Component {
    constructor(props) {
        super(props);
        this.hideModal = this.hideModal.bind(this);
    }

    hideModal() {
        store.dispatch({type: "CLOSE_MODAL"});
    }

    render() {
        switch (this.props.current) {

            case modalTypes.ITEM_SELECT:
                return <ItemSelectPopup hideModal={this.hideModal} {...this.props.modalProps}/>;

            case modalTypes.ITEM_BONUSES:
                return <BonusIDPopup hideModal={this.hideModal} {...this.props.modalProps}/>;

            case modalTypes.DEBUG_URL:
                return <DebugURLPopup hideModal={this.hideModal} {...this.props.modalProps}/>;

            case modalTypes.RELOAD_SWIRL:
                return <ReloadSwirlPopup hideModal={this.hideModal} {...this.props.modalProps}/>;

            case modalTypes.AZERITE:
                return <AzeritePopup hideModal={this.hideModal} {...this.props.modalProps}/>;

            default:
                return null;
        }
    }
}

ModalConductor.propTypes = {
    current: PropTypes.string,
    modalProps: PropTypes.object
};

const mapStateToProps = function (store) {
    return {
        current: store.modal.current,
        modalProps: store.modal.props
    };
};

export default connect(mapStateToProps)(ModalConductor);
