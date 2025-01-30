/*global window*/
export function BrowserRuntime() {
	const decodeBase64 = window.atob,
		randomArray = (numElements = 32) => {
			const array = new Uint8Array(numElements);
			window.crypto.getRandomValues(array);
			return array;
		},
		encodeUTF8StringToBinary = (input) => {
			return new window.TextEncoder().encode(input);
		},
		bufferEncodeBase64 = (buffer) => {
			const bytes = new Uint8Array(buffer);
			return window.btoa(String.fromCharCode(...bytes));
		};
	Object.freeze(Object.assign(this, {decodeBase64, randomArray, encodeUTF8StringToBinary, bufferEncodeBase64}));
};
