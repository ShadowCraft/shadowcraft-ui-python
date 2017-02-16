import React from "react"

export default class ArtifactTrait extends React.Component {
    constructor(props)
    {
        super(props)
        this.handleClick = this.handleClick.bind(this)
        this.handleRightClick = this.handleRightClick.bind(this)
    }

    handleClick(e)
    {
        e.preventDefault()
        console.log('click!')
    }

    handleRightClick(e)
    {
        e.preventDefault()
        console.log('right click!')
    }
    
    render() {
        return (
            <div className="trait tt" id={this.props.id} data-tooltip-id={this.props.tooltip_id} data-tooltip-type="spell" data-max-rank={this.props.max_rank} style={{left: this.props.left, top: this.props.top}} onClick={this.handleClick} onContextMenu={this.handleRightClick}>
                <img className="relic inactive" src="static/images/artifacts/relic-blood.png" />
                <img className={"icon" + (this.props.enabled ? "" : " inactive") } src={"http://wow.zamimg.com/images/wow/icons/large/"+this.props.icon+".jpg"} />
                <img className="ring" src={"static/images/artifacts/ring-"+this.props.ring+".png"} />
                <span className={"level" + (this.props.enabled ? "" : " inactive") }>{this.props.cur_rank}/{this.props.max_rank}</span>
            </div>
        )
    }
}
