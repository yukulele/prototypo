import React from 'react';
import Lifespan from 'lifespan';
import {hashHistory} from 'react-router';

import LocalClient from '../../stores/local-client.stores.jsx';

import AddCard from '../shared/add-card.components.jsx';
import BillingAddress from '../shared/billing-address.components.jsx';
import InputWithLabel from '../shared/input-with-label.components.jsx';
import DisplayWithLabel from '../shared/display-with-label.components.jsx';
import AccountValidationButton from '../shared/account-validation-button.components.jsx';
import FormError from '../shared/form-error.components.jsx';

export default class SubscriptionAddCard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			errors: [],
			inError: {},
			infos: {
				card: [],
			},
		};
	}

	componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		this.client.getStore('/userStore', this.lifespan)
			.onUpdate(({head}) => {
				this.setState({
					errors: [...head.toJS().addcardForm.errors, ...head.toJS().billingForm.errors],
					inError: _.assign(head.toJS().addcardForm.inError, head.toJS().billingForm.inError),
					loading: head.toJS().addcardForm.loading || head.toJS().billingForm.loading,
					infos: head.toJS().infos,
				});

				// move to next step if the card and billing info are already known
				if (
					this.state.infos && this.state.infos.card && this.state.infos.card[0]
					&& this.state.infos && this.state.infos.address
				) {
					hashHistory.push('/account/create/confirmation');
				}
			})
			.onDelete(() => {
				this.setState(undefined);
			});
	}

	componentWillUnmount() {
		this.client.dispatchAction('/clean-form', 'addcardForm');
		this.client.dispatchAction('/clean-form', 'billingForm');
		this.lifespan.release();
	}

	addDetails(e) {
		e.preventDefault();
		e.stopPropagation();

		this.client.dispatchAction('/add-card-and-billing', {
			card: this.refs.card.data(),
			vat: this.refs.vat.inputValue,
			buyerName: this.refs.address.getBuyerName(),
			address: this.refs.address.getAddress(),
		});
	}

	render() {
		const errors = this.state.errors.map((error, index) => {
			return <FormError key={index} errorText={error} />;
		});

		const buyerName = this.state.infos.accountValues
			? this.state.infos.accountValues.firstname + this.state.infos.accountValues.lastname
			: '';

		return (
			<form method="post" onSubmit={(e) => {this.addDetails(e);}} className="account-base subscription-add-card">
				<h2>Billing address</h2>
				<BillingAddress address={{}} buyerName={buyerName} inError={this.state.inError} ref="address"/>
				<h2>Payment card</h2>
				<AddCard inError={this.state.inError} ref="card"/>
				<InputWithLabel ref="vat" label="VAT number" info="(only necessary if you pay with a company card)"/>
				{errors}
				<AccountValidationButton loading={this.state.loading} label="Add my card"/>
			</form>
		);
	}
}
