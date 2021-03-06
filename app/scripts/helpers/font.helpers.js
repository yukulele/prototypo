import PrototypoCanvas from 'prototypo-canvas';

import {Typefaces} from '../services/typefaces.services.js';

import {rawToEscapedContent} from '../helpers/input-transform.helpers.js';

export function mapGlyphForApp(glyph) {
	return _.map(
		glyph,
		(alt) => {
			return {
				src: {
					tags: alt.src && alt.src.tags || [],
					characterName: alt.src && alt.src.characterName || '',
					unicode: alt.src && alt.src.unicode	|| '',
					glyphName: alt.src && alt.src.glyphName || '',
				},
				name: alt.name,
				altImg: alt.altImg,
			};
		}
	);
}

export async function setupFontInstance(appValues) {
		const template = appValues.values.familySelected ? appValues.values.familySelected.template : undefined;
		const typedataJSON = await Typefaces.getFont(template || 'venus.ptf');
		const typedata = JSON.parse(typedataJSON);

		// const prototypoSource = await Typefaces.getPrototypo();
		const workerDeps = document.querySelector('script[src*=prototypo\\.]').src;
		let workerUrl;

		// The worker will be built from URL during development, and from
		// source in production.
		//if (process.env.NODE_ENV !== 'production') {
			workerUrl = '/prototypo-canvas/src/worker.js';
			//}

		if (!window.fontInstance) {
			const fontPromise = PrototypoCanvas.init({
				canvas: window.canvasElement,
				workerUrl,
				workerDeps,
				jQueryListeners: false,
			});

			window.fontInstance = await fontPromise;
		}
		const font = window.fontInstance;


		await font.loadFont(typedata.fontinfo.familyName, typedataJSON, appValues.values.variantSelected.db);

		const glyphs = _.mapValues(
			font.font.altMap,
			mapGlyphForApp
		);
		const subset = appValues.values.text + rawToEscapedContent(appValues.values.word, glyphs);

		font.subset = typeof subset === 'string' ? subset : '';
		font.displayChar(appValues.values.selected);
		return {font, subset, typedata};
}
