import React from 'react';

function round1(val) {
    let newVal = Math.round(val * 10.0) / 10.0;
    if (isNaN(newVal)) {
        newVal = 0;
    }
    return newVal;
}

function Ranking(props) {
    return (
        <div className="talent_contribute" id={"talent-weight-"+props.id}>
            <div className="name">{props.name}</div>
            <div className="pct">
                <div className="label">{round1(props.label)}</div>
                <div className="pct-inner" style={{ width: props.pct }}></div>
            </div>
        </div>
    );
}

export default class RankingSection extends React.Component {
    constructor(props)
    {
        super(props);

        // loop through the sections and set the values/percentages and build a state tree,
        // sorting as we go
        this.state = {
            sections: []
        };

        for (let s in this.props.layout) {
            let section_data = this.props.layout[s];
            let section_layout = {
                name: section_data.name,
                items: []
            };

            // loop through the values and find the maximum so we can calculate percentages
            let max = 0;
            for (let i in section_data.items) {
                let section_item = section_data.items[i];
                if (this.props.values && section_item.id in this.props.values) {
                    if (max < this.props.values[section_item.id]) {
                        max = this.props.values[section_item.id];
                    }
                }
            }

            for (let i in section_data.items) {
                let section_item = section_data.items[i];

                let layout_item = {
                    name: section_item.name,
                    id: section_item.id,
                    label: 0,
                    pct: "0%"
                };

                if (this.props.values && section_item.id in this.props.values)
                {
                    let percentage = (this.props.values[section_item.id] / max) * 100.0;
                    layout_item.label = this.props.values[section_item.id];
                    layout_item.pct = ""+percentage+"%";
                }

                section_layout.items.push(layout_item);
            }

            section_layout.items.sort(function(a, b) {
                return b.label - a.label;
            });

            this.state.sections.push(section_layout);
        }
    }

    render() {
        return (
            <section id={this.props.id}>
                <h3>{this.props.name}</h3>
                <div className="inner">
                    {this.state.sections.map(function(section) {
                        return (
                            <div key={section.name} className={section.className}>
                            {section.name && <h3>{section.name}</h3> }
                                {section.items.map(function(item) {
                                    return (
                                        <Ranking key={item.id} id={item.id}name={item.name} label={item.label} pct={item.pct} />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    }
}
