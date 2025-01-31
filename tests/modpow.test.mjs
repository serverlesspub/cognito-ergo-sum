import {modPow} from '../src/modpow';
import {parseBigInt} from '../src/parse-bigint';
import {BigInteger} from '../external/jsbn';
import precalculatedN from '../src/precalculated-n'; 

describe('modPow', () => {
	test('should compute modular exponentiation correctly', () => {
		expect(modPow(4n, 3n, 5n)).toEqual(4n); // 4^3 % 5 = 64 % 5 = 4
	});
	test('should handle large modular exponentiation', () => {
		expect(modPow(BigInt('9876543210123456789'), BigInt('98765'), BigInt('123456789'))).toEqual(BigInt('71929584'));
	});
	test('calculates modPow for large negative numbers', () => {
		const exponent = BigInt('0x766e9235bd6f86d9818454832bd75dca16814d693cf30f5f7e4403b23f834175b72465a0dd85fea29d5d85a13f8aa9ea3bfed6d5daa565eb7276704be560192ef17e659a967ec7c8ff8a61903e00d03856a83937946d798b18e5e278dd9f55d4905aeb1c0232c1ccccbf6a64ff92cfd3bdec70f0222c245a4a37be97d5fa46b'),
			expectedResult = BigInt('0xe0aa3cb04d8e199d6cfa64d860e994ff2c4cdd635f1b786dd2d9276c19431af21c4b3f28d5be7aa0632d48eeb65bde50699d8df69c9b3247f4292f0501baa5d22ef5aca3ef3f10e189e9d5c79476a07af68a45da9c6ca3f88454f353b0201115fb49838a46eebc492b3719c6fb6847037d519cfef91b0e1e5fc3248c7fc62ba85a44cef523d2636c16e75e8ba5fdf427c129aad4dbd4ce58ef2485e64ebaad18a985697cb533d4d93e54bef6db00825454490ece3d8785ad2cbf060a596fb8d78ead4f315eb82a129c2e63d0e06938f3eee3a5c88760511370a8e723215fd7baa7c77827b40a10a2063ddc64125f811cb8a0a233dea45bfd4e725e02dc20d84928f0603cb09636a62cf77e70c84ecce8f0c91271ef86491a76f4b985c4b9d7adef95d8f89e4b9baef1a19b4944479137ddcc06a90bfb7ea9b9f32627e3921d404f916714f1098ce7f5822d11bf5b38c224de19b763129abf671c84cb855d7196aa2d3abd75e82c41e019aee086eea1c97ff11e2c86a9ab51579c4a7e1a6c71db'),
			base = -1n * BigInt('0x2718af38ee8f406225503830db0959517d4361db009a39c7909caaafc9ef8134eab5efa6721f6d79e4573be7ccda540b87e17f20b6e6c658a5c1b5629400c8ae0b7fd1930c0fd1c5826f6922712b4592ed80d36f3b7c577bedb90586548cadf693e92cb2e4c2ea45a4d7d639852665801d585602d14fd2441e2fd6e18804b0a1fa06def6d329060684a674a3f16533baec0d732aa7073f317904bf54363dd861c5af671cf4d40355a8e9fc184c9d6507b5e67fd7224ea426ea58c078c59b46f5c431ed680df8432d53318e74e9324487dffdd06a63ecd563886da567d2cb76e3142977c2b285b3929dd059d5af037e4a21c9433c392f99121c153c888e77448be45fa626cc46fe461fa172e9520de18f639081d6b4c1e1e1ad33a2c5a2ce977de9a3306f270bdc5633d37489f72ec6da410395d8c01474b5385577eea414c8b0d54f8b75f8d1ad6119a3dbe51368ab6750f2645cd6faa5c8acb6e6a8114197e1ea9bb60b4fc22eb0bf5745294c1b5b3629a3d0d8cfeb8c5347f2f4b79be0521f39ecb05c49742310c5b4370617625b348629ea2fb0fb274b722677a9b72d2a6c'),
			mod = BigInt('0xffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff');
		expect(modPow(base, exponent, mod)).toEqual(expectedResult);
	});
	test('should compute large modular exponentiation without exceeding range', () => {
		const base = BigInt('9876543210123456789'),
			exponent = BigInt('98765400'), // Very large exponent
			modulus = BigInt('123456789'); // Modulus keeps result small
		expect(() => (base ** exponent) % modulus).toThrow(RangeError);
		expect(modPow(base, exponent, modulus).toString(16)).toEqual('665179e');
	});
	describe('BigInteger JSBN compatibility', () => {
		test('works consistently to JSBN BigInteger for negative bases', () => {
			expect(modPow(-2n, 3n, 5n).toString(16)).toEqual(new BigInteger('-2', 16).modPow(new BigInteger('3', 16), new BigInteger('5', 16), () => {}).toString(16));
		});
		test('works consistently to JBSN BigInteger for positive numbers', () => {
			expect(modPow(4n, 3n, 5n).toString(16)).toEqual(new BigInteger('4', 16).modPow(new BigInteger('3', 16), new BigInteger('5', 16), () => {}).toString(16));
		});
		test('works consistently to JSBN for large numbers', () => {
			const exponent = '766e9235bd6f86d9818454832bd75dca16814d693cf30f5f7e4403b23f834175b72465a0dd85fea29d5d85a13f8aa9ea3bfed6d5daa565eb7276704be560192ef17e659a967ec7c8ff8a61903e00d03856a83937946d798b18e5e278dd9f55d4905aeb1c0232c1ccccbf6a64ff92cfd3bdec70f0222c245a4a37be97d5fa46b',
				base = '2718af38ee8f406225503830db0959517d4361db009a39c7909caaafc9ef8134eab5efa6721f6d79e4573be7ccda540b87e17f20b6e6c658a5c1b5629400c8ae0b7fd1930c0fd1c5826f6922712b4592ed80d36f3b7c577bedb90586548cadf693e92cb2e4c2ea45a4d7d639852665801d585602d14fd2441e2fd6e18804b0a1fa06def6d329060684a674a3f16533baec0d732aa7073f317904bf54363dd861c5af671cf4d40355a8e9fc184c9d6507b5e67fd7224ea426ea58c078c59b46f5c431ed680df8432d53318e74e9324487dffdd06a63ecd563886da567d2cb76e3142977c2b285b3929dd059d5af037e4a21c9433c392f99121c153c888e77448be45fa626cc46fe461fa172e9520de18f639081d6b4c1e1e1ad33a2c5a2ce977de9a3306f270bdc5633d37489f72ec6da410395d8c01474b5385577eea414c8b0d54f8b75f8d1ad6119a3dbe51368ab6750f2645cd6faa5c8acb6e6a8114197e1ea9bb60b4fc22eb0bf5745294c1b5b3629a3d0d8cfeb8c5347f2f4b79be0521f39ecb05c49742310c5b4370617625b348629ea2fb0fb274b722677a9b72d2a6c',
				mod = 'ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff';
			expect(modPow(parseBigInt(base, 16), parseBigInt(exponent, 16), parseBigInt(mod, 16)).toString(16)).toEqual(new BigInteger(base, 16).modPow(new BigInteger(exponent, 16), new BigInteger(mod, 16), () => {}).toString(16));
			expect(modPow(parseBigInt('-' + base, 16), parseBigInt(exponent, 16), parseBigInt(mod, 16)).toString(16)).toEqual(new BigInteger('-' + base, 16).modPow(new BigInteger(exponent, 16), new BigInteger(mod, 16), () => {}).toString(16));
		});		

		test('works differently for odd modulus numbers - but this is not important as SRP always calculates modululus for precalculated N which is a prime', () => {
			const base = '87c0c', exponent = '1bb', mod = '27bdc';
			expect(modPow(parseBigInt(base, 16), parseBigInt(exponent, 16), parseBigInt(mod, 16))).toEqual((BigInt('0x'+ base) ** BigInt('0x' + exponent)) % BigInt('0x' + mod));
			expect(modPow(parseBigInt(base, 16), parseBigInt(exponent, 16), parseBigInt(mod, 16)).toString(16)).not.toEqual(new BigInteger(base, 16).modPow(new BigInteger(exponent, 16), new BigInteger(mod, 16), () => {}).toString(16));

		});
		
	});

	describe('Performance and accuracy smoke test', () => {
		const NUM_TESTS = 10000, testCases = [],
			measureTime = (predicate) => {
				const startTime = process.hrtime.bigint();
				predicate();
				return process.hrtime.bigint() - startTime;
			};
		beforeAll(() => {
			for (let i = 0; i < NUM_TESTS; i++) {
				const base = BigInt(Math.floor(Math.random() * 1000000)) + 1n,
					exponent = BigInt(Math.floor(Math.random() * 1000)) + 1n,
					modulus = BigInt(Math.floor(Math.random() * 1000000)) + 1n;
				testCases.push({ base, exponent, modulus });
			}
		});
		test('modPow correctness against direct BigInt calculations', () => {
			for (const { base, exponent, modulus } of testCases) {
				const expected = base ** exponent % modulus,
					result = modPow(base, exponent, modulus);
				expect(result).toEqual(expected);
			}
		});
		test('modPow correctness against JSBN calculations for precalculated SRP modulus - the library seems to work differently for odd moduluses, but this is not relevant for SRP as it always mods with a prime number', () => {
			for (const { base, exponent } of testCases) {
				const modulus = parseBigInt(precalculatedN, 16),
					jsbnBase = new BigInteger(base.toString(16), 16), 
					jsbnExponent = new BigInteger(exponent.toString(16), 16), 
					jsbnModulus = new BigInteger(precalculatedN, 16),
					expected = jsbnBase.modPow(jsbnExponent, jsbnModulus, () => {}),
					result = modPow(base, exponent, modulus);
				if (result.toString(16) !== expected.toString(16)) {
					console.debug(`Failed for base=${base.toString(16)}, exponent=${exponent.toString(16)}, modulus=${modulus.toString(16)}. Expected: ${expected.toString(16)}, but got: ${result.toString(16)}`);
				}
				expect(result.toString(16)).toEqual(expected.toString(16));
			}
		});

		test('modPow performance', () => {
			let mpResults, bigIntResults, jsbnResults;
			const modPowTime = measureTime(() => {
					mpResults = testCases.map(({ base, exponent, modulus }) => modPow(base, exponent, modulus));
				}),
				bigIntTime = measureTime(() => {
					bigIntResults = testCases.map(({ base, exponent, modulus }) => base ** exponent % modulus);
				}),
				jsbnCases = testCases.map(({base, exponent, modulus}) => ({
					base: new BigInteger(base.toString(16), 16), 
					exponent: new BigInteger(exponent.toString(16), 16), 
					modulus: new BigInteger(modulus.toString(16), 16)
				})),
				jsbnTime = measureTime(() => {
					jsbnResults = jsbnCases.map( ({ base, exponent, modulus }) => base.modPow(exponent, modulus, () => {}));
				});
			console.debug({modPowTime, jsbnTime, bigIntTime, NUM_TESTS, compareToJSBN: modPowTime * 100n / jsbnTime, compareToBigInt: modPowTime * 100n / bigIntTime });
			expect(modPowTime).toBeLessThan(bigIntTime);
			expect(modPowTime).toBeLessThan(jsbnTime);
			expect(mpResults.length).toEqual(bigIntResults.length);
			expect(mpResults.length).toEqual(jsbnResults.length);
		});
	});

});


