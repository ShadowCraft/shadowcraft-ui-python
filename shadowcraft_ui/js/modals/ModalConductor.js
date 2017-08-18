import React from 'react';
import {connect} from 'react-redux';

import store from '../store';
import ItemSelectPopup from '../gear/ItemSelectPopup';
import BonusIDPopup from '../gear/BonusIDPopup';
import DebugURLPopup from './DebugURLPopup';
import ReloadSwirlPopup from './ReloadSwirlPopup';

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

            default:
                return null;
        }
    }
}

const mapStateToProps = function (store) {
    return {
        current: store.modal.current,
        modalProps: store.modal.props
    };
};

export default connect(mapStateToProps)(ModalConductor);
