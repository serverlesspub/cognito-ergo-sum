// initialises the number from a string, for example new BigIntegerAdapter('AABBCC', 16) initialises it from a hex value 0xAABBCC. 
// Supported bases are 10 and 16
const parse = (contents, base) => {
		if (typeof contents === 'bigint') {
			return contents;
		}
		if (typeof contents === 'string') {
			if (![10, 16].includes(base)) {
				throw new Error('Supported bases are 10 and 16');
			}
			if (contents.startsWith('-')) {
				return -1n * parse(contents.slice(1), base);
			} else {
				const parseableString = base === 16 ? '0x' + contents : contents;
				return BigInt(parseableString);
			}
		}
		throw 'argument must be a bigint or a string';
	}, 
	BigIntegerAdapter = function (arg, base) {
		//returns -1 if less than argument, 0 if equal, 1 if greater than argument
		const value = parse(arg, base),
			self = this,
			compareTo  = (bigInt) => {
				if (this.value < bigInt.value) return -1;
				if (this.value > bigInt.value) return 1;
				return 0;
			},
			// returns absolute value as bigint, without modifying the current number
			abs = () => { 
				if (value < 0) {
					return new BigIntegerAdapter(-1n * value);
				} else {
					return self;
				}
			},
			toStringInBase = (stringBase) => {
				return value.toString(stringBase);
			},
			// returns a sum of this bigint and the argument, as a bigint, without modifying this or the argument
			add = (bigInt) => {
				return new BigIntegerAdapter(value + bigInt.value);
			},
			multiply = (bigInt) => {
				return new BigIntegerAdapter(value * bigInt.value);
			},
			//this^e % m (HAC 14.85) 
			modPow = (e, m) => {
				if (m.value === 1n) return new BigIntegerAdapter(0n); // Any number mod 1 is 0

				let powBase = ((value % m.value) + m.value) % m.value, // Reduce base mod m
					exponent = e.value,
					result = 1n;

				while (exponent > 0n) {
					if (exponent % 2n === 1n) {
						result = (result * powBase) % m.value; // Multiply base when exponent is odd
					}
					powBase = (powBase * powBase) % m.value; // Square the base
					exponent /= 2n;
				}
				return new BigIntegerAdapter(result);
			},
			subtract = (bigInt) => {
				return new BigIntegerAdapter(value - bigInt.value);
			},
			//this % m
			mod = (m) => {
				return new BigIntegerAdapter(value % m.value);
			},
			// returns true if bigInt is equal numerically to this number, false otherwise
			equals = (bigInt) => value === bigInt.value;
		Object.freeze(Object.assign(this, {compareTo, abs, toString: toStringInBase, modPow, value, add, mod, equals, multiply, subtract}));
	};
BigIntegerAdapter.ZERO = new BigIntegerAdapter(0n);
BigIntegerAdapter.ONE = new BigIntegerAdapter(1n);
export {BigIntegerAdapter};

