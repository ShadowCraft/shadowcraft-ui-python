import React from "react"
import GearPane from './gear/GearPane';
import TalentPane from './TalentPane';
import ArtifactPane from './artifact/ArtifactPane';
import SettingsPane from './SettingsPane';
import AdvancedPane from './AdvancedPane';
import DocsPane from './DocsPane';
import RightPane from './RightPane';

var Tabs = require('react-simpletabs');

export default class CharacterPane extends React.Component {
    // hold on to your butts

    constructor(props) {
        super(props);

        // have bind this because otherwise you get handleArtifactChange's this
        // #javascriptproblems
        this.handleArtifactChange = this.handleArtifactChange.bind(this)
        this.handleTalentChange = this.handleTalentChange.bind(this)

        this.state = this.props.data;
        this.state.current_talents = this.props.data.talents[this.props.data.active]
    }

    handleArtifactChange(traits, relics) {
        var state = this.state

        if (relics != null) {
            state.artifact.relics = relics
        }

        if (traits != null) {
            state.artifact.traits = traits
        }

        this.setState(state)
    }

    handleTalentChange(spec, talents) {
        this.setState({ active: spec, current_talents: talents })
    }

    render() {

        // mocking data
        let advanced = {
            breakdown: [
                {
                    name: 'Serrate',
                    dps: 123124,
                    pct: .15
                },
                {
                    name: 'Stab',
                    dps: 325643,
                    pct: .25
                },{
                    name: 'Slit',
                    dps: 123124,
                    pct: .5
                },
                {
                    name: 'Shiv',
                    dps: 325643,
                    pct: .30
                },
                {
                    name: 'Slice',
                    dps: 123124,
                    pct: .10
                },
                {
                    name: 'Slash',
                    dps: 325643,
                    pct: .20
                }
            ],
            build: {
                ui: 'thisfake',
                engine: 'commitid'
            }
        };
        return (
            <div>
                <div style={{ display: 'flex' }}>
                    <div id="container" style={{ flex: 4 }}>
                        <div id="curtain">
                            <Tabs>
                                <Tabs.Panel title="Gear">
                                    <GearPane data={this.props.data} />
                                </Tabs.Panel>
                                <Tabs.Panel title="Talents">
                                    <TalentPane data={this.state} onChange={this.handleTalentChange} />
                                </Tabs.Panel>
                                <Tabs.Panel title="Artifact">
                                    <ArtifactPane data={this.state} onChange={this.handleArtifactChange} />
                                </Tabs.Panel>
                                <Tabs.Panel title="Settings">
                                    <SettingsPane />
                                </Tabs.Panel>
                                <Tabs.Panel title="Advanced">
                                    <AdvancedPane data={advanced} />
                                </Tabs.Panel>
                                <Tabs.Panel title="Documentation">
                                    <DocsPane />
                                </Tabs.Panel>
                            </Tabs>
                        </div>
                    </div >
                    <RightPane />
                </div>

                <div id="wait" style={{ display: 'none' }}>
                    <div id="waitMsg"></div>
                </div>
                <div id="modal" style={{ display: 'none' }}></div>
            </div >
        )
    }
}
