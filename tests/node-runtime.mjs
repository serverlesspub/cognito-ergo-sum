import {getRandomValues} from 'node:crypto';
import util from 'node:util';
export function NodeRuntime() {
	const decodeBase64 = global.atob,
		randomArray = (numBytes) => {
			return getRandomValues(new Uint8Array(numBytes));
		},
		encodeUTF8StringToBinary = (input) => {
			return new util.TextEncoder().encode(input);
		},
		bufferEncodeBase64 = (buffer) => {
			const bytes = new Uint8Array(buffer);
			return btoa(String.fromCharCode(...bytes));
		};
	Object.freeze(Object.assign(this, {decodeBase64, randomArray, encodeUTF8StringToBinary, bufferEncodeBase64}));
};
