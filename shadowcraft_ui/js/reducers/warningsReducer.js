import Immutable from 'immutable';

export const initialWarningsState = {
    warnings: []
};

export const warningsActionTypes = {
    CLEAR_WARNINGS: 'CLEAR_WARNINGS',
    ADD_WARNING: 'ADD_WARNING',
    ADD_MULTIPLE_WARNINGS: 'ADD_MULTIPLE_WARNINGS'
};

export const warningsReducer = function (state = initialWarningsState, action) {

    state = Immutable.fromJS(state);

    switch (action.type) {
        case warningsActionTypes.CLEAR_WARNINGS:
            return state.set('warnings', []).toJS();

        case warningsActionTypes.ADD_WARNING: {
            const warningSeq = state.get('warnings').toSeq();
            const filtered = warningSeq.filter(obj => obj.get('component') != action.component);
            const newWarnings = filtered.concat({ component: action.component, text: action.text });

            return state.set('warnings', newWarnings).toJS();
        }

        case warningsActionTypes.ADD_MULTIPLE_WARNINGS: {

            const warningSeq = state.get('warnings').toSeq();
            const mapped = action.warnings.map(w => ({ component: action.component, text: w }));
            const filtered = mapped.filter(m => !warningSeq.contains(m));
            const newWarnings = warningSeq.concat(filtered);
            return state.set('warnings', newWarnings).toJS();
        }
    }

    return state.toJS();
};
