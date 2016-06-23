import React from 'react';
import Lifespan from 'lifespan';
import ClassNames from 'classnames';

import LocalClient from '../../stores/local-client.stores.jsx';

import InputWithLabel from '../shared/input-with-label.components.jsx';
import Button from '../shared/button.components.jsx';
import CloseButton from '../close-button.components.jsx';
import GlyphGrid from '../glyph-grid.components.jsx';

export default class CreateParamGroup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected: [],
			groups: [],
		};

		this.close = this.close.bind(this);
		this.createGroup = this.createGroup.bind(this);
	}

	componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		this.client.getStore('/prototypoStore', this.lifespan)
			.onUpdate(({head}) => {
				this.setState({
					tags: head.toJS().tags,
					selected: head.toJS().indivSelected,
					tagSelected: head.toJS().indivTagSelected,
					errorMessage: head.toJS().indivErrorMessage,
					errorGlyphs: head.toJS().indivErrorGlyphs,
					groups: head.toJS().indivGroups,
				});
			})
			.onDelete(() => {
				this.setState(undefined);
			});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	createGroup(e) {
		e.preventDefault();

		this.client.dispatchAction('/create-param-group', {
			name: this.refs.groupname.inputValue,
			selected: this.state.selected,
		});
	}

	toggleGlyphs(e) {
		e.preventDefault();
		this.client.dispatchAction('/toggle-glyph-param-grid');
	}

	close(e) {
		e.preventDefault();
		this.client.dispatchAction('/store-value', {
			indivCreate: false,
			indivEdit: false,
			indivCurrentGroup: undefined,
			indivSelected: [],
			indivErrorMessage: [],
			indivErrorGlyphs: [],
		});
	}

	render() {

		const errorGlyphs = _.map(this.state.errorGlyphs, (glyph) => {

			return <div key={glyph} className={glyphClass}>{String.fromCharCode(glyph)}</div>;
		});

		const error = this.state.errorMessage ? (
			<div className="create-param-group-panel-error">
				<span className="create-param-group-panel-error-message">{this.state.errorMessage}</span>
				<div className="create-param-group-panel-error-glyphs">
					{errorGlyphs}
				</div>
			</div>
		) : false;

		const edit = this.state.groups.length > 0 ? (
			<span className="edit-param-group-button" onClick={() => {this.client.dispatchAction('/edit-mode-param-group');}}>EDIT GROUP</span>
		) : false;

		const glyphs = _.map(this.state.selected, (glyph) => {
			return <div key={glyph} onClick={() => { this.removeGlyph(glyph);}} className="delete-param-group-glyph">{String.fromCharCode(glyph)}</div>;
		});

		return (
			<div className="create-param-group">
				<form className="create-param-group-form" onSubmit={this.createGroup}>
					<div className="create-param-group-form-close">
						<CloseButton click={this.close}/>
					</div>
					<InputWithLabel ref="groupname" label="Group name" inputValue={this.props.group ? this.props.group.name : ''}/>
					<GlyphGrid
						select={(unicode, isSelected) => {this.selectGlyph(unicode, isSelected);}}
						tagSelected={this.state.tagSelected}
						selected={this.props.group ? this.props.group.glyphs : this.state.selected}
						tags={this.state.tags}/>
					<Button label="Save change" neutral={true} click={this.createGroup}/>
				</form>
			</div>
		);
	}
}

