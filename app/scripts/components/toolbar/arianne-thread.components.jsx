import React from 'react';
import Lifespan from 'lifespan';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import ClassNames from 'classnames';

import LocalClient from '~/stores/local-client.stores.jsx';

export default class ArianneThread extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			families: [],
			family: {},
			variant: {},
			indivCurrentGroup: {},
			groups: [],
		};
		this.toggleIndividualize = this.toggleIndividualize.bind(this);
		this.selectVariant = this.selectVariant.bind(this);
		this.selectFamily = this.selectFamily.bind(this);
		this.addFamily = this.addFamily.bind(this);
		this.addVariant = this.addVariant.bind(this);
		this.showCollection = this.showCollection.bind(this);
		this.selectGroup = this.selectGroup.bind(this);
		this.addIndividualizeGroup = this.addIndividualizeGroup.bind(this);
		this.editIndivualizeGroup = this.editIndivualizeGroup.bind(this);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	async componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();
		const store = await this.client.fetch('/prototypoStore');
		const memoizedListSelector = (list=[], selectedValue, oldValue) => {
			if (selectedValue.name !== oldValue.name || selectedValue.name === undefined) {
				return list.filter((element) => { return selectedValue.name !== element.name; });
			}
			return oldValue;
		};
		const familySelector = (families, family) => { return families.find((f) => { return f.name === family.name; }); };

		this.client.getStore('/prototypoStore', this.lifespan)
			.onUpdate(({head}) => {
				var family = familySelector(head.toJS().fonts, head.toJS().family) || (
					this.state.families.length > 0
						? this.state.families[0]
						: {}
				);

				//This should never happen. However for user comfort if it happens
				//we should create a new family to avoid crashes.
				if (!family.name) {
					localClient.dispatchAction('/create-family', {
						name: 'My font',
						template: 'elzevir.ptf',
						loadCurrent: true,
					});
				}

				this.setState({
					families: memoizedListSelector(head.toJS().fonts, head.toJS().family, this.state.families),
					family,
					variant: head.toJS().variant,
					groups: memoizedListSelector(head.toJS().indivGroups, head.toJS().indivCurrentGroup || {}, this.state.groups),
					indivCreate: head.toJS().indivCreate,
					indivMode: head.toJS().indivMode,
					indivCurrentGroup: head.toJS().indivCurrentGroup || {},
				});
			})
			.onDelete(() => {
				this.setState(undefined);
			});

		this.setState({
			families: memoizedListSelector(store.head.toJS().fonts, store.head.toJS().family, this.state.families),
			family: familySelector(store.head.toJS().fonts, store.head.toJS().family),
			variant: store.head.toJS().variant,
			groups: memoizedListSelector(store.head.toJS().indivGroups, {}, this.state.groups),
		});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	selectVariant(variant, family) {
		this.client.dispatchAction('/select-variant', {variant, family});
	}

	selectFamily(family) {
		this.client.dispatchAction('/select-variant', {variant: undefined, family});
	}

	addFamily() {
		this.client.dispatchAction('/store-value', {openFamilyModal: true});
	}

	addVariant() {
		this.client.dispatchAction('/store-value', {
			openVariantModal: true,
			familySelectedVariantCreation: this.state.family,
		});
	}

	showCollection() {
		this.client.dispatchAction('/store-value', {
			uiShowCollection: true,
			collectionSelectedFamily: this.state.family,
			collectionSelectedVariant: this.state.variant,
		});
	}

	toggleIndividualize() {
		this.client.dispatchAction('/toggle-individualize');
	}

	selectGroup(group) {
		this.client.dispatchAction('/store-value', {indivMode: true, indivCurrentGroup: group, indivEditingParams: true});
	}

	addIndividualizeGroup() {
		this.client.dispatchAction('/toggle-individualize', {targetIndivValue: true});
		this.client.dispatchAction('/store-value', {
			indivCreate: true,
		});
	}

	editIndivualizeGroup() {
		this.client.dispatchAction('/toggle-individualize', {targetIndivValue: true});
		this.client.dispatchAction('/store-value', {indivCurrentGroup: this.state.indivCurrentGroup});
		this.client.dispatchAction('/store-value', {indivEdit: !!this.state.indivCurrentGroup.name});
	}

	groupToElement(group) {
		const glyphs = _.map(group.glyphs, (glyph) => {
			return String.fromCharCode(glyph);
		}).join('');

		return (
			<div>
				<span>{group.name}</span> - <span className="indiv-group-infos-glyphs-list">{glyphs}</span>
			</div>
		);
	}

	render() {
		const addFamily = <ArianneDropMenuItem item={{name: 'Add new family...'}} click={this.addFamily}/>;
		const familyItem = (
				<DropArianneItem
					label={this.state.family.name}
					list={this.state.families}
					add={addFamily}
					click={this.selectFamily}
					toggleId="arianne-item-family"/>
		);

		const addVariant = <ArianneDropMenuItem item={{name: 'Add new variant...'}} click={this.addVariant}/>;
		const variantItem = (
				<DropArianneItem
					label={this.state.variant.name}
					family={this.state.family}
					variant={this.state.variant}
					list={this.state.family.variants ? this.state.family.variants.filter(({name}) => { return name !== this.state.variant.name; }) : []}
					add={addVariant}
					click={this.selectVariant}
					toggleId="arianne-item-variant"/>
		);

		const addGroup = [
			<ArianneDropMenuItem key="edit" item={{name: 'Edit groups...'}} click={this.editIndivualizeGroup}/>,
			<ArianneDropMenuItem key="add" item={{name: 'Add new group...'}} click={this.addIndividualizeGroup}/>,
		];
		const groupClasses = ClassNames({
			'arianne-item': true,
			'is-active': this.state.indivMode,
			'is-creating': this.state.indivCreate,
		});
		const groupLabel = this.state.indivCreate
			? 'Creating new group...'
			: 'All glyphs';
		const groupName = this.state.indivCurrentGroup.name || groupLabel;
		const group = this.state.groups && (this.state.groups.length > 0 || this.state.indivCurrentGroup.name)
			? <DropArianneItem
				label={groupName}
				list={this.state.groups}
				itemToEl={this.groupToElement}
				add={addGroup}
				click={this.selectGroup}
				toggleId="arianne-item-group"
			/>
			: <ActionArianneItem
				className={groupClasses}
				label={groupLabel}
				img="assets/images/arianne-plus.svg"
				click={this.toggleIndividualize}
				toggleId="arianne-item-group"/>;

		return (
			<div className="arianne-thread">
				<RootArianneItem click={this.showCollection}/>
				{familyItem}
				{variantItem}
				{group}
			</div>
		);
	}
}

class RootArianneItem extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	render() {
		return (
			<div className="arianne-item is-small" onClick={this.props.click}>
				<div className="arianne-item-action is-small">
					<span className="arianne-item-action-collection"></span>
				</div>
				<div className="arianne-item-arrow"></div>
			</div>
		);
	}
}

class DropArianneItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			arianneItemDisplayed: undefined,
		};
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

		// function binding
		this.toggleDisplay = this.toggleDisplay.bind(this);
	}

	async componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		const {head} = await this.client.fetch('/prototypoStore');

		this.setState({
			arianneItemDisplayed: head.toJS().arianneItemDisplayed,
		});

		this.client.getStore('/prototypoStore', this.lifespan)
			.onUpdate(({head}) => {
				this.setState({
					arianneItemDisplayed: head.toJS().arianneItemDisplayed,
				});
			})
			.onDelete(() => {
				this.setState({
					arianneItemDisplayed: undefined,
				});
			});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	toggleDisplay() {

		if (this.state.arianneItemDisplayed === this.props.toggleId) {
			this.client.dispatchAction('/store-value', {
				arianneItemDisplayed: undefined,
			});
		}
		else {
			this.client.dispatchAction('/store-value', {
				arianneItemDisplayed: this.props.toggleId,
			});

			const selector = '#topbar, #workboard';
			const outsideClick = () => {
				this.client.dispatchAction('/store-value', {
					arianneItemDisplayed: undefined,
				});
				_.each(document.querySelectorAll(selector), (item) => {
					item.removeEventListener('click', outsideClick);
				});
			};

			_.each(document.querySelectorAll(selector), (item) => {
				item.addEventListener('click', outsideClick);
			});
		}
	}

	render() {
		const classes = ClassNames({
			'arianne-item': true,
			'arianne-item-displayed': this.state.arianneItemDisplayed === this.props.toggleId,
		});

		return (
			<div className={classes} onClick={this.toggleDisplay}>
				<div className="arianne-item-action" >
					<span className="arianne-item-action-label">{this.props.label}</span>
					<span className="arianne-item-action-drop arianne-item-action-img"></span>
				</div>
				<div className="arianne-item-arrow"></div>
				<ArianneDropMenu
					list={this.props.list}
					click={this.props.click}
					family={this.props.family}
					add={this.props.add}
					itemToEl={this.props.itemToEl}
				/>
			</div>
		);
	}
}

class ArianneDropMenu extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	render() {
		const items = this.props.list.map((item) => {
			return <ArianneDropMenuItem
				item={item}
				key={item.name}
				click={this.props.click}
				family={this.props.family}
				itemToEl={this.props.itemToEl}/>;
		});

		return (
			<ul className="arianne-drop-menu">
				{items}
				{this.props.add}
			</ul>
		);
	}
}

class ArianneDropMenuItem extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	render() {
		const item = this.props.itemToEl
			? this.props.itemToEl(this.props.item)
			: this.props.item.name;

		return (
			<li className="arianne-drop-menu-item" onClick={() => {
				this.props.click(this.props.item, this.props.family);
			}}>
				{item}
			</li>
		);
	}
}

class ActionArianneItem extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	render() {
		const classes = this.props.className || 'arianne-item';
		return (
			<div className={classes} onClick={this.props.click}>
				<div className="arianne-item-action">
					{this.props.label}
					<img className="arianne-item-action-plus arianne-item-action-img" src={this.props.img}/>
				</div>
				<div className="arianne-item-arrow"></div>
			</div>
		);
	}
}
