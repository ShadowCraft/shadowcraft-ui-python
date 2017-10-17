import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import store from '../store';
import { updateCharacterState } from '../store';
import Artifact from '../viewModels/Artifact';

import RankingSection from '../SidebarRanking';
import * as layouts from './ArtifactLayouts';
import ArtifactFrame from './ArtifactFrame';

class ArtifactPane extends React.Component {

    constructor(props) {
        super(props);
        this.clickResetButton = this.clickResetButton.bind(this);
    }

    clickResetButton(e) {
        e.preventDefault();

        // Reset all traits and relics to zero and push it upwards to the character pane to reset
        // the state there.
        var traits = {};
        var relics = [];

        for (var i = 0; i < 3; i++) {
            relics.push({ id: 0, ilvl: 0 });
        }

        for (var trait in this.props.artifact.traits) {
            traits[trait] = 0;
        }

        store.dispatch(updateCharacterState("UPDATE_ARTIFACT_TRAITS", traits));
    }

    render() {
        let frame = null;
        let ranking_frame = null;

        if (this.props.activeSpec == 'a') {
            frame = <ArtifactFrame layout={layouts.kingslayers_layout} />;
            ranking_frame = (
                <RankingSection
                    id="traitrankings"
                    name="Trait Rankings"
                    layout={layouts.kingslayers_ranking}
                    values={this.props.rankings}
                />);
        }
        else if (this.props.activeSpec == 'Z') {
            frame = <ArtifactFrame layout={layouts.dreadblades_layout} />;
            ranking_frame = (
                <RankingSection
                    id="traitrankings"
                    name="Trait Rankings"
                    layout={layouts.dreadblades_ranking}
                    values={this.props.rankings}
                />);
        }
        else if (this.props.activeSpec == 'b') {
            frame = <ArtifactFrame layout={layouts.fangs_layout} />;
            ranking_frame = (
                <RankingSection
                    id="traitrankings"
                    name="Trait Rankings"
                    layout={layouts.fangs_ranking}
                    values={this.props.rankings}
                />);
        }

        let netherlight_rankings = (
            <RankingSection
                id="netherlightrankings"
                name="Netherlight Crucible"
                layout={layouts.netherlight_ranking}
                values={this.props.rankings}
            />);

        return (
            <div className="with-tools ui-tabs-panel ui-widget-content ui-corner-bottom ui-tabs-hide" id="artifact">
                <div className="panel-tools">
                    <div id="artifact_button_div">
                        <button
                            id="reset_artifact"
                            className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"
                            role="button"
                            aria-disabled="false"
                            onClick={this.clickResetButton}
                        >
                            <span className="ui-button-text">Reset Traits</span>
                        </button>
                    </div>
                    {ranking_frame}
                    {netherlight_rankings}
                </div>

                {frame}
            </div>
        );
    }
}

ArtifactPane.propTypes = {
    artifact: PropTypes.instanceOf(Artifact).isRequired,
    activeSpec: PropTypes.string.isRequired,
    rankings: PropTypes.objectOf(PropTypes.number.isRequired).isRequired
};

const mapStateToProps = function (store) {
    return {
        rankings: store.engine.traitRanking,
        artifact: store.character.get('artifact'),
        activeSpec: store.character.get('active')
    };
};

export default connect(mapStateToProps)(ArtifactPane);
