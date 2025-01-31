/**
 * Computes (base^exp) % mod efficiently using the square-and-multiply method;
 * for situations where direct BigInt expressions would cause a RangeError
 *
 * Note that negative exponents are not supported in this implementation, as this
 * is not important for the SRP calculations. The SRP calculator never uses
 * negative exponents. It only uses:
 *  - "a" which is a random number generated to be positive,
 *  - U or X which are generated from SHA strings
 *  - a math formula involving addition and multiplication of positive numbers
 *
 * For a more general implementation, mod-inverse could be supported; however
 * as this tries to mirror the original JSBN big number library from
 * amazon-cognito-client-js, which seems to handle negative exponents as large
 * positive exponents, we're leaving this unsupported for now.
 *
 * @param {bigint} base - The base number (can be negative)
 * @param {bigint} exp - The exponent (can be negative)
 * @param {bigint} mod - The modulus (must be positive)
 * @returns {bigint} (base^exp) % mod
 */
import {positiveModBase} from './positive-mod-base';
export function modPow(base, exp, mod) {
	if (mod <= 0n) {
		throw new TypeError('Modulus must be positive');
	}
	if (mod === 1n) return 0n;
	if (exp < 0n) {
		throw new TypeError('Negative exponents are not supported');
	}
	let powBase = positiveModBase(base, mod),
		exponent = exp,
		result = 1n;

	while (exponent > 0n) {
		if (exponent % 2n === 1n) {
			result = (result * powBase) % mod;
		}
		powBase = (powBase * powBase) % mod;
		exponent /= 2n;
	}
	return result;
}
