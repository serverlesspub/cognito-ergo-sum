/**
 * Compute the modular inverse of a number using the Extended Euclidean Algorithm.
 * Returns x such that (a * x) % mod = 1, or null if no modular inverse exists.
 *
 * @param {bigint} number - The number to find the inverse of
 * @param {bigint} modulus - The modulus (must be positive)
 * @returns {bigint | null} - The modular inverse, or null if no inverse exists
 */
import {positiveModBase} from './positive-mod-base';
export function modInverse(base, modulus) {
	let remainder, quotient, a = positiveModBase(base, modulus), m = modulus, previousX = 1n, x = 0n;

	if (m <= 0n) { 
		throw new TypeError('Modulus must be positive');
	}
	while (a > 1n) {
		if (m === 0n) return null; 
		quotient = a / m;
		remainder = a % m;
		a = m;
		m = remainder;
		[previousX, x] = [x, previousX - quotient * x];
	}
	if (a !== 1n) return null;
	if (previousX < 0n) previousX += modulus;
	return previousX;
}
