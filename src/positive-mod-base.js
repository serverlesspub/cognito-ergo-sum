export function positiveModBase(base, mod) {
	return ((base % mod) + mod) % mod;
}

