export function parseBigInt (contents, base) {
	if (typeof contents !== 'string') {
		throw new TypeError('first argument must be a string');
	};
	if (![10, 16].includes(base)) {
		throw new Error('Supported bases are 10 and 16');
	}
	if (contents.startsWith('-')) {
		return -1n * parseBigInt(contents.slice(1), base);
	} else {
		const parseableString = base === 16 ? '0x' + contents : contents;
		return BigInt(parseableString);
	}
};
