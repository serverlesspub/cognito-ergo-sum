import {modInverse} from '../src/modinverse';
describe('modInverse', () => {
	test('works for positive numbers', () => {
		expect(modInverse(3n, 7n)).toEqual(5n); //  3 * 5 % 7 = 1
		expect(modInverse(10n, 17n)).toEqual(12n); // 10 * 12 % 17 = 1
		expect(modInverse(2n, 4n)).toBeNull(); // no modular inverse exists
	});
	test('computes modular inverse of small numbers', () => {
		expect(modInverse(3n, 7n)).toEqual(5n); // 3 * 5 % 7 = 1
		expect(modInverse(10n, 17n)).toEqual(12n); // 10 * 12 % 17 = 1
		expect(modInverse(7n, 13n)).toEqual(2n); // 7 * 2 % 13 = 1
	});
	test('returns null when modular inverse does not exist', () => {
		expect(modInverse(2n, 4n)).toBeNull(); // No inverse since gcd(2,4) ≠ 1
		expect(modInverse(6n, 9n)).toBeNull(); // gcd(6,9) = 3, so no inverse
		expect(modInverse(12n, 18n)).toBeNull(); // gcd(12,18) = 6, so no inverse
	});
	test('computes modular inverse with negative base', () => {
		expect(modInverse(-3n, 7n)).toEqual(2n); // 4 × 2 ≡ 1 (mod 7) 
		expect(modInverse(-10n, 17n)).toEqual(5n); // (-10 % 17) is 7 → 7 * 5 % 17 = 1
	});
	test('returns null when modulus is 1', () => {
		expect(modInverse(10n, 1n)).toBeNull();
		expect(modInverse(9999n, 1n)).toBeNull();
	});
});
