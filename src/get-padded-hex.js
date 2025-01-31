import {parseBigInt} from './parse-bigint';

const HEX_MSB_REGEX = /^[89a-f]/i;

export function getPaddedHex (bigInt) {
	const isNegative = bigInt < 0n,
		absBigInt = isNegative ? -1n * bigInt : bigInt;
	let hexStr = absBigInt.toString(16);
	hexStr = hexStr.length % 2 !== 0 ? `0${hexStr}` : hexStr;
	hexStr = HEX_MSB_REGEX.test(hexStr) ? `00${hexStr}` : hexStr;
	if (isNegative) {
		const invertedNibbles = hexStr.split('').map((x) => {
				const invertedNibble = ~parseInt(x, 16) & 0xf;
				return '0123456789ABCDEF'.charAt(invertedNibble);
			}).join(''),
			flippedBitsBI = parseBigInt(invertedNibbles, 16) + 1n;
		hexStr = flippedBitsBI.toString(16);
		if (hexStr.toUpperCase().startsWith('FF8')) {
			hexStr = hexStr.substring(2);
		}
	}
	return hexStr;
};
