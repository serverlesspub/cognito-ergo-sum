import {parseBigInt} from '../src/parse-bigint';
describe('parseBigInt', () => {
	test('should initialize from a string in base 10', () => {
		const bigInt = parseBigInt('12345', 10);
		expect(bigInt).toEqual(12345n);
		expect(typeof bigInt).toEqual('bigint');
		expect(bigInt.toString(10)).toBe('12345');
	});

	test('should initialize from a string in base 16', () => {
		const bigInt = parseBigInt('AABBCC', 16);
		expect(bigInt).toEqual(11189196n);
		expect(typeof bigInt).toEqual('bigint');
		expect(bigInt.toString(16).toUpperCase()).toBe('AABBCC');
	});
	test('should handle negative numbers', () => {
		const bigInt = parseBigInt('-AABBCC', 16);
		expect(bigInt).toEqual(-11189196n);
		expect(typeof bigInt).toEqual('bigint');
		expect(bigInt.toString(16).toUpperCase()).toBe('-AABBCC');
	});
	test('should throw an error for unsupported base', () => {
		expect(() => parseBigInt('123', 8)).toThrow('Supported bases are 10 and 16');
	});
});

