import {BigIntegerAdapter} from '../src/biginteger-adapter';
const HEX_MSB_REGEX = /^[89a-f]/i;
export function getPaddedHex (bigInt) {
	if (!(bigInt instanceof BigIntegerAdapter)) {
		throw new Error('Not a BigIntegerAdapter');
	}
	const isNegative = bigInt.compareTo(BigIntegerAdapter.ZERO) < 0;
	let hexStr = bigInt.abs().toString(16);
	hexStr = hexStr.length % 2 !== 0 ? `0${hexStr}` : hexStr;
	hexStr = HEX_MSB_REGEX.test(hexStr) ? `00${hexStr}` : hexStr;
	if (isNegative) {
		const invertedNibbles = hexStr.split('').map((x) => {
				const invertedNibble = ~parseInt(x, 16) & 0xf;
				return '0123456789ABCDEF'.charAt(invertedNibble);
			}).join(''),
			flippedBitsBI = new BigIntegerAdapter(invertedNibbles, 16).add(
				BigIntegerAdapter.ONE,
			);
		hexStr = flippedBitsBI.toString(16);
		if (hexStr.toUpperCase().startsWith('FF8')) {
			hexStr = hexStr.substring(2);
		}
	}
	return hexStr;
};
