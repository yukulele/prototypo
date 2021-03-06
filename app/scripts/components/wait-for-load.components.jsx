import React from 'react';
import classNames from 'classnames';

export default class WaitForLoad extends React.Component {
	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] WaitForLoad');
		}
		let content;

		if (this.props.loaded) {
			content = this.props.children;
		}
		else {
			const rectClass = classNames({
				'sk-spinner': true,
				'sk-spinner-wave': true,
				'sk-secondary-color': this.props.secColor,
			});

			content = (
				<div className="wait-for-load">
					<div className={rectClass}>
						<div className="sk-rect1"></div>
						<div className="sk-rect2"></div>
						<div className="sk-rect3"></div>
						<div className="sk-rect4"></div>
						<div className="sk-rect5"></div>
					</div>
				</div>
			);
		}
		return (
			<div>
				{content}
			</div>
		);
	}
}
