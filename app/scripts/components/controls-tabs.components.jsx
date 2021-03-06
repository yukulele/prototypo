import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import classNames from 'classnames';
import ScrollArea from 'react-scrollbar';

import LocalClient from '../stores/local-client.stores.jsx';
import Log from '../services/log.services.js';

export class ControlsTabs extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	componentWillMount() {
		this.client = LocalClient.instance();
	}

	changeTab(name) {
		this.client.dispatchAction('/change-tab-font', {name});
		Log.ui('ControlsTabs.changeTab', name);
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] controls tabs');
		}

		const headers = _.map(this.props.children, ({props: {iconId, name}}) => {
			const classes = classNames({
				'controls-tabs-icon': true,
				'is-active': this.props.tab === name,
			});

			return (
				<li className={classes} id={iconId}
					onClick={() => {
						this.changeTab(name);
					}} key={`${name}ControlsHeader`}>
					<div className="controls-tabs-icon-legend is-legend-active">{name}</div>
				</li>
			);
		});

		const tab = _.map(this.props.children, (child) => {
			if (child.props.name === this.props.tab) {
				return child;
			}
		});

		return (
			<div className="controls-tabs">
				<ul className="controls-tabs-headers">
					{headers}
				</ul>
				<div className="controls-tabs-sliders">
					<ScrollArea horizontal={false}>
						<div className="controls-tabs-container" id="parameters">
							{tab}
						</div>
					</ScrollArea>
				</div>
			</div>
		);
	}
}

export class ControlsTab extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] controls tab');
		}

		return (
			<div className="controls-tab" key={`${this.props.name}ControlsTab`}>
				{this.props.children}
			</div>
		);
	}

}
