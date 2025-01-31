import { positiveModBase } from '../src/positive-mod-base';

describe('positiveModBase', () => {
	test('returns correct positive modulo for positive numbers', () => {
		expect(positiveModBase(10n, 3n)).toEqual(1n); // 10 % 3 = 1
		expect(positiveModBase(15n, 4n)).toEqual(3n); // 15 % 4 = 3
		expect(positiveModBase(100n, 7n)).toEqual(2n); // 100 % 7 = 2
	});

	test('returns positive modulo for negative numbers', () => {
		expect(positiveModBase(-10n, 3n)).toEqual(2n); // -10 % 3 should be 2
		expect(positiveModBase(-15n, 4n)).toEqual(1n); // -15 % 4 should be 1
		expect(positiveModBase(-100n, 7n)).toEqual(5n); // -100 % 7 should be 5
	});

	test('handles zero base correctly', () => {
		expect(positiveModBase(0n, 5n)).toEqual(0n); // 0 % 5 = 0
		expect(positiveModBase(0n, 10n)).toEqual(0n); // 0 % 10 = 0
	});

	test('handles modulus of 1 correctly', () => {
		expect(positiveModBase(10n, 1n)).toEqual(0n); // Any number mod 1 is 0
		expect(positiveModBase(-10n, 1n)).toEqual(0n); // Any number mod 1 is 0
	});

	test('handles modulus larger than base', () => {
		expect(positiveModBase(5n, 10n)).toEqual(5n); // 5 % 10 = 5
		expect(positiveModBase(-5n, 10n)).toEqual(5n); // -5 % 10 should be 5
	});

	test('handles large numbers', () => {
		expect(positiveModBase(987654321987654321n, 1234567890123456789n))
			.toEqual(987654321987654321n % 1234567890123456789n);
		expect(positiveModBase(-987654321987654321n, 1234567890123456789n))
			.toEqual((987654321987654321n % 1234567890123456789n + 1234567890123456789n) % 1234567890123456789n);
	});
});

