import { BigIntegerAdapter } from '../src/biginteger-adapter';
import { BigInteger } from '../external/jsbn';

describe('BigIntegerAdapter', () => {
	describe('Initialization', () => {
		test('should correctly initialize from a string in base 10', () => {
			const bigInt = new BigIntegerAdapter('12345', 10);
			expect(bigInt.toString(10)).toBe('12345');
		});

		test('should correctly initialize from a string in base 16', () => {
			const bigInt = new BigIntegerAdapter('AABBCC', 16);
			expect(bigInt.toString(16).toUpperCase()).toBe('AABBCC');
		});

		test('should throw an error for unsupported base', () => {
			expect(() => new BigIntegerAdapter('123', 8)).toThrow('Supported bases are 10 and 16');
		});
		test('matches bigdecimal initialization', () => {
			const initN = 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
				'29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
				'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
				'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
				'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
				'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
				'83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
				'670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
				'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
				'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
				'15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64' +
				'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' +
				'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B' +
				'F12FFA06D98A0864D87602733EC86A64521F2B18177B200C' +
				'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31' +
				'43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF';
			expect(new BigIntegerAdapter(initN, 16).toString(16)).toEqual(new BigInteger(initN, 16).toString(16));
		});
	});

	describe('compareTo()', () => {
		test('should correctly compare numbers', () => {
			const num1 = new BigIntegerAdapter('100', 10),
				num2 = new BigIntegerAdapter('200', 10),
				num3 = new BigIntegerAdapter('100', 10);

			expect(num1.compareTo(num2)).toBe(-1);
			expect(num2.compareTo(num1)).toBe(1);
			expect(num1.compareTo(num3)).toBe(0);
		});
	});

	describe('abs()', () => {
		test('should return absolute value correctly', () => {
			const num1 = new BigIntegerAdapter('-12345', 10),
				num2 = new BigIntegerAdapter('12345', 10);

			expect(num1.abs().toString(10)).toBe('12345');
			expect(num2.abs().toString(10)).toBe('12345');
		});
	});

	describe('add()', () => {
		test('should correctly add numbers', () => {
			const num1 = new BigIntegerAdapter('500', 10),
				num2 = new BigIntegerAdapter('250', 10),
				negativeNum = new BigIntegerAdapter('-300', 10);

			expect(num1.add(num2).toString(10)).toBe('750');
			expect(num1.add(negativeNum).toString(10)).toBe('200');
		});
	});

	describe('mod()', () => {
		test('should correctly compute modulus', () => {
			const num1 = new BigIntegerAdapter('10', 10),
				num2 = new BigIntegerAdapter('3', 10),
				num3 = new BigIntegerAdapter('-10', 10);

			expect(num1.mod(num2).toString(10)).toBe('1');
			expect(num3.mod(num2).toString(10)).toBe('-1'); // Negative mod handling
		});
	});

	describe('modPow()', () => {
		test('should compute modular exponentiation correctly', () => {
			const base = new BigIntegerAdapter('4', 10),
				exponent = new BigIntegerAdapter('3', 10),
				modulus = new BigIntegerAdapter('5', 10);

			expect(base.modPow(exponent, modulus).toString(10)).toBe('4'); // 4^3 % 5 = 64 % 5 = 4
		});

		test('should handle large modular exponentiation correctly', () => {
			const largeBase = new BigIntegerAdapter('9876543210123456789', 10),
				largeExponent = new BigIntegerAdapter('98765', 10),
				largeModulus = new BigIntegerAdapter('123456789', 10);

			expect(largeBase.modPow(largeExponent, largeModulus).toString(10)).toBe('71929584');
		});
		test('matches the calculation from BigInteger', () => {
			const largeBase = new BigIntegerAdapter('9876543210123456789', 10),
				largeExponent = new BigIntegerAdapter('98765', 10),
				largeModulus = new BigIntegerAdapter('123456789', 10),
				largeBaseN = new BigInteger(largeBase.toString(16), 16),
				largeExponentN = new BigInteger(largeExponent.toString(16), 16),
				largeModulusN = new BigInteger(largeModulus.toString(16), 16);
			expect(largeBase.modPow(largeExponent, largeModulus).toString(16)).toEqual(largeBaseN.modPow(largeExponentN, largeModulusN, () => {}).toString(16));


		});
		test('calculates modPow consistently with BigInteger for negative numbers', () => {
			const exponent = '766e9235bd6f86d9818454832bd75dca16814d693cf30f5f7e4403b23f834175b72465a0dd85fea29d5d85a13f8aa9ea3bfed6d5daa565eb7276704be560192ef17e659a967ec7c8ff8a61903e00d03856a83937946d798b18e5e278dd9f55d4905aeb1c0232c1ccccbf6a64ff92cfd3bdec70f0222c245a4a37be97d5fa46b',
				expecteResult = 'e0aa3cb04d8e199d6cfa64d860e994ff2c4cdd635f1b786dd2d9276c19431af21c4b3f28d5be7aa0632d48eeb65bde50699d8df69c9b3247f4292f0501baa5d22ef5aca3ef3f10e189e9d5c79476a07af68a45da9c6ca3f88454f353b0201115fb49838a46eebc492b3719c6fb6847037d519cfef91b0e1e5fc3248c7fc62ba85a44cef523d2636c16e75e8ba5fdf427c129aad4dbd4ce58ef2485e64ebaad18a985697cb533d4d93e54bef6db00825454490ece3d8785ad2cbf060a596fb8d78ead4f315eb82a129c2e63d0e06938f3eee3a5c88760511370a8e723215fd7baa7c77827b40a10a2063ddc64125f811cb8a0a233dea45bfd4e725e02dc20d84928f0603cb09636a62cf77e70c84ecce8f0c91271ef86491a76f4b985c4b9d7adef95d8f89e4b9baef1a19b4944479137ddcc06a90bfb7ea9b9f32627e3921d404f916714f1098ce7f5822d11bf5b38c224de19b763129abf671c84cb855d7196aa2d3abd75e82c41e019aee086eea1c97ff11e2c86a9ab51579c4a7e1a6c71db',
				base = '-2718af38ee8f406225503830db0959517d4361db009a39c7909caaafc9ef8134eab5efa6721f6d79e4573be7ccda540b87e17f20b6e6c658a5c1b5629400c8ae0b7fd1930c0fd1c5826f6922712b4592ed80d36f3b7c577bedb90586548cadf693e92cb2e4c2ea45a4d7d639852665801d585602d14fd2441e2fd6e18804b0a1fa06def6d329060684a674a3f16533baec0d732aa7073f317904bf54363dd861c5af671cf4d40355a8e9fc184c9d6507b5e67fd7224ea426ea58c078c59b46f5c431ed680df8432d53318e74e9324487dffdd06a63ecd563886da567d2cb76e3142977c2b285b3929dd059d5af037e4a21c9433c392f99121c153c888e77448be45fa626cc46fe461fa172e9520de18f639081d6b4c1e1e1ad33a2c5a2ce977de9a3306f270bdc5633d37489f72ec6da410395d8c01474b5385577eea414c8b0d54f8b75f8d1ad6119a3dbe51368ab6750f2645cd6faa5c8acb6e6a8114197e1ea9bb60b4fc22eb0bf5745294c1b5b3629a3d0d8cfeb8c5347f2f4b79be0521f39ecb05c49742310c5b4370617625b348629ea2fb0fb274b722677a9b72d2a6c',
				mod = 'ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff';

			expect(new BigInteger(base, 16).modPow(new BigInteger(exponent, 16), new BigInteger(mod, 16), () => {}).toString(16)).toEqual(expecteResult);
			expect(new BigIntegerAdapter(base, 16).modPow(new BigIntegerAdapter(exponent, 16), new BigIntegerAdapter(mod, 16)).toString(16)).toEqual(expecteResult);
		});
		test('should compute large modular exponentiation without exceeding range', () => {
			const base = new BigIntegerAdapter('9876543210123456789', 10),
				  exponent = new BigIntegerAdapter('98765400', 10), // Very large exponent
				  modulus = new BigIntegerAdapter('123456789', 10); // Modulus keeps result small
			expect(() => (base.value ** exponent.value) % modulus.value).toThrow(RangeError);

			expect(base.modPow(exponent, modulus).toString(16)).toEqual('665179e');
		});
		test('matches the calculation from BigInteger for arguments that would exceed range', () => {
			const largeBase = new BigIntegerAdapter('9876543210123456789', 10),
				largeExponent = new BigIntegerAdapter('98765400', 10),
				largeModulus = new BigIntegerAdapter('123456789', 10),
				largeBaseN = new BigInteger(largeBase.toString(16), 16),
				largeExponentN = new BigInteger(largeExponent.toString(16), 16),
				largeModulusN = new BigInteger(largeModulus.toString(16), 16);
			expect(largeBase.modPow(largeExponent, largeModulus).toString(16)).toEqual(largeBaseN.modPow(largeExponentN, largeModulusN, () => {}).toString(16));


		});

	});

	describe('equals()', () => {
		test('should return true for equal numbers', () => {
			const num1 = new BigIntegerAdapter('42', 10),
				num2 = new BigIntegerAdapter('42', 10);

			expect(num1.equals(num2)).toBe(true);
		});

		test('should return false for different numbers', () => {
			const num1 = new BigIntegerAdapter('42', 10),
				num2 = new BigIntegerAdapter('43', 10);

			expect(num1.equals(num2)).toBe(false);
		});
	});

	describe('toString()', () => {
		test('should return correct string representation in base 10', () => {
			const num = new BigIntegerAdapter('98765', 10);
			expect(num.toString(10)).toBe('98765');
		});

		test('should return correct string representation in base 16', () => {
			const num = new BigIntegerAdapter('255', 10);
			expect(num.toString(16)).toBe('ff');
		});
	});

	describe('Handling Large Numbers', () => {
		test('should correctly add large numbers', () => {
			const largeNum1 = new BigIntegerAdapter('9999999999999999999999999999999999', 10),
				largeNum2 = new BigIntegerAdapter('1', 10);

			expect(largeNum1.add(largeNum2).toString(10)).toBe('10000000000000000000000000000000000');
		});

		test('should correctly handle large hexadecimal numbers', () => {
			const largeHex = new BigIntegerAdapter('FFFFFFFFFFFFFFFF', 16);
			expect(largeHex.toString(16).toUpperCase()).toBe('FFFFFFFFFFFFFFFF');
		});
	});

	describe('ZERO and ONE Constants', () => {
		test('should return correct values for ZERO and ONE', () => {
			expect(BigIntegerAdapter.ZERO.toString(10)).toBe('0');
			expect(BigIntegerAdapter.ONE.toString(10)).toBe('1');
		});
	});

	describe('caculateS', () => {
		[
			{
				a: '5910c127245657f7287f18880a11edd343470f856bad929381f945e9164d5b7ee3c6908cfc2206311ea53fbd5122c6c1afc39bdf58189a7978c868dae7c452ed80dc3229383d11393ffea890cc26bf2ff43d3fcf433fc519ac80253f9608159fcfaa3d75abacf19f0998c209c43a25e8d2d0484b6fcf754ce05a26faf7680616',
				g: '2',
				k: '538282c4354742d7cbbde2359fcf67f9f5b3a6b08791e5011b43b8a5b66d9ee6',
				x: 'fb5ac11feac2fb346356d89083d6d5bc3e272dd448eb4d4c63c1cdd1e4cf62d9',
				B: '1b872e9afb9c0b3e3728c2737cb0238df46b2d1ea121d933b638aaa3eabe7b5a460dcb978b66f55f11fac5e526e4fd57aeaebf54b8f1a68e99a53375bd4785b7f3e90957440ad37e53bc027b960d4b6a1c41c10dbed026031e453e9c6ea0a288991b38ad3e3bd68b3b14a6b927db6a3ada80844325c5b7f52d26ddb630703070ef55f3a8fb7d7ac60bb688b738ece1933343615aedb6bc8691c327337f2fb2c81576be484bb12eaba08dffb7eb4b672af76f1075e66bc89053641e2fe3f25648686f30d1cb9a378c31fcf157c39094b20ffadb671498b479339f83ebc470b77fa755445a7607e665b590f1f1c29b85c812cfc434fb2d3de78d940c5ec3303b56f98fe4d1bdda1173bef98c36044917bfd927993d91549d2751c0bd387a99583e3673bd97b7a832aace1da3ee3a87b3b2e3591213e2850d3a2ec954ede511d416a88f07a0edc1357d980502d449cf64aa32989af9ee91c880728d98334ada325ab65aa63c2989f55c99ea003f7415d62e00a836095c6631273c3db2bcda4edde8',
				N: 'ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff',
				U: 'da5f354ab0409aa8ea0e81db1db7454a8954cb3b38ff4c45ea4fd5c47b56e607',
				result: '81ce67d9655c807c1c3bcff20853b9f5a745692f00e00a236f6fd6f8ebb457d2ef2dd97b0eba9d05b0b49bf4bb334b8289219310a72116af1db5a9b80bafecc9b260c4bebd89a3d58f96003f2f1059f691b135af5fe0fa45695575e5215aaaaacb15b99e7cf86f8aa41a1cf03df0c52e8d6911d69f9da4eeaa71ebf3c4bbe977b118b44687be568feb18186d6c73b08f77688b72abcc20fd626590a44b8ba2cf6f1b9ad9f7f41ff6fa88cd6174409cde97efad58ac83cf12a16f03e2f1d882eaa3068b40e09330a4d6c8218511542e3d87030f08f9d42a1fcdbac4ee04c05bb23510d33033d4acc3048fe523cf3f83516a231d868778bcfc80a95332ac3926228bbbf9ed192c8e8f2cda15f8877f7ed2ec7e14344487e78a0ef5e6538ab0796b4efef7399c5fac600a326a346643dcd3e5afbfe237f990203a86b3fa7511c866687fe55b8679bb9111fca5793148213ebeda928b8f32aea860389c10bdc5f75918a0b609a24ce716d5efdb1daeb6f4f1f70d2d63d7fd69a5d1140b04e333d97',
				apUtx: '5910c127245657f7287f18880a11edd343470f856bad929381f945e9164d5b7ee3c6908cfc2206311ea53fbd5122c6c1afc39bdf58189a7978c868dae7c452ee5744f59f30447ba3fa51d087b3eaa1651bff6a0be505581a2f190eedb1a7000800f74419d40653e0c3bfa32707b5644f807b68efac3a49ed4e01189803c8b005',
				outerResult: '4448f966853f21c2082d2281274c33bfa4af1bf5a0d3138e983146f9048df20209deeca4451eb35c43799c09b2dc822f9ef41645533072a56b2abd372e215a1f881422179033002080cf7bb188df874414ef374a10a7ff4348cc6d8ca5f6b2d9e42d8dc0795cbe041532a4b0d91b687ffe82703c161cd98c01919e8df477d696e667d847d45ccde5e1ef7d37e35cf14f65f94cfae7bb7c76111739604c99b0ab3506f816f0f8055b1e14df58f889d7597d193031f475efa8d0dd509d263869aab6a9621fbf24e302cfaad5512e2770ef64ff0a87ab65842a36c98cd86b2c23808bd92462e2131620de3961a5f16d3321c9d35612684f452d14f25cc0df9c46fc7f17f2e4d4e5487cb42bcc5f935b96333ce1b8ecbda46d26162a3e990a44c3856d5f04fefccd78de9f462a8c6348bdb040d7e42c8bcb73c36521789b6edf8597ade459b832b0d57282b1097528133e42d127194ba1b932a086d8e713283203be8a7510f0f36096867f931baf62d9338ef88aa75a07e380c2727b766404333809',
				innerResult: '81ce67d9655c807c1c3bcff20853b9f5a745692f00e00a236f6fd6f8ebb457d2ef2dd97b0eba9d05b0b49bf4bb334b8289219310a72116af1db5a9b80bafecc9b260c4bebd89a3d58f96003f2f1059f691b135af5fe0fa45695575e5215aaaaacb15b99e7cf86f8aa41a1cf03df0c52e8d6911d69f9da4eeaa71ebf3c4bbe977b118b44687be568feb18186d6c73b08f77688b72abcc20fd626590a44b8ba2cf6f1b9ad9f7f41ff6fa88cd6174409cde97efad58ac83cf12a16f03e2f1d882eaa3068b40e09330a4d6c8218511542e3d87030f08f9d42a1fcdbac4ee04c05bb23510d33033d4acc3048fe523cf3f83516a231d868778bcfc80a95332ac3926228bbbf9ed192c8e8f2cda15f8877f7ed2ec7e14344487e78a0ef5e6538ab0796b4efef7399c5fac600a326a346643dcd3e5afbfe237f990203a86b3fa7511c866687fe55b8679bb9111fca5793148213ebeda928b8f32aea860389c10bdc5f75918a0b609a24ce716d5efdb1daeb6f4f1f70d2d63d7fd69a5d1140b04e333d97',
				bmkxo: '-164678cc47fe41dce59c97bf70e4dfea7c36f160ab431cf517ebdea066dfec44d3e7301e36930908f0afc2b38486576d19ec3133f1ba2bf2e1b2fba933c33fe5f70c0743f0e7cb70f9c5383a3552fbbc18875f3ef15e7d1c26ad8e8027170907aa5b516716719358d858ad20ef2bed95c129870af6f5a0f41f23cac5cbc3a82d343d1917f40842a4449a664181f872dc9b3c8958544cb3e346626180ddcc3dd682d81ea46bed775465c44d3e2a75607e59fd5a9147c1424000cbee31a2f87883b108d6fabe76dc423f412dbec0e20beae5ec44938ed8303f7c12e65f02d40ea8737d09324e180a4c6ea056d739566e8b6b35c1f55de3fc94e2af271a387e6afb59c75074cf539a23c47831b7acd000fbef0df34ed055da43d190c76ec696f06eb80f0ee3cecdce9456dc37695b9748bbf5e14e920d99ffad2b87bf5b00ffed89c33bcc37bad7d8e8407d557c7f9f49a200163a70d37d7a3a8b7eb1925e8d79b33637c51c671f38fab2c546b15de13d219eedb2481d443fc720d3ba65c8f64741de74341666222aaa7cb6e0f7045079b58661386e945bfbc577f72f28ca20082e'
			},
			{
				a: '766e9235bd6f86d9818454832bd75dca16814d693cf30f5f7e4403b23f834175b72465a0dd85fea29d5d85a13f8aa9ea3bfed6d5daa565eb7276704be560192e8c4bfe2eb45110ea4dabc83f020469794cddcf040c7cd115fa845c858a667a6ab7aee65038f96b072b1a39f2103ff3f93e1aa9d6cb6ec1a15507405f5f3e1fa',
				g: '2',
				k: '538282c4354742d7cbbde2359fcf67f9f5b3a6b08791e5011b43b8a5b66d9ee6',
				x: '383196c25449e24177394040d330ed41afc069a96cb07cd02dd1f3ee819b6d01',
				B: 'd6d3a8a239d6a09865ccc1e9d89da697159776f1779f9e82280b89e1324e51f748b97221d8221ef68d5f73391a2e0dec6bede201c27aab6f2034edbce87b80b6b68e8feb0644a19581413f4f11f8fcac7710d47b473bbbfa3e2c9ef3e8e8d20d7baa9d40ae2d82aa07707128790c717a3071d98d889739f224e8d9d425fcbeaf839dadeeb7a9b88389504ce372729dbf2a9f133d8e46f48735dff8bc4a1a1f33579095db4550295d02dbd4c1af514a5d1ccf444be0cb83926e56c83f514017af902c8e3e29d9a08c6c3be07b454030ddaf98561ffa9b223b385eb27c8a712c79d1950baf409b0f6dbc6f0a5709b0277fb74d4066ea5b6322f6651228eb794a71f3665aba7bc874a7855de4cad5ad18b4a239abfd6ab70a5a03853cdc8575c9edb23390ff386f2daf32babd09d076a8b497c005b57c953a3d5a1315e1bc076a142fad4897b7ba976bbf22f9daf3ed0732dbed7fa2c8a05ea0a9d05262eb553fb7b9ad9e156976fceceb33d11eafdb6b20052031b94c3cb3f201a481c8387f1862',
				N: 'ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff',
				U: '1cd0508f8086a5f0263656d6f305898ec6edc8663a42e823fd42c194418fa571',
				result: 'e0aa3cb04d8e199d6cfa64d860e994ff2c4cdd635f1b786dd2d9276c19431af21c4b3f28d5be7aa0632d48eeb65bde50699d8df69c9b3247f4292f0501baa5d22ef5aca3ef3f10e189e9d5c79476a07af68a45da9c6ca3f88454f353b0201115fb49838a46eebc492b3719c6fb6847037d519cfef91b0e1e5fc3248c7fc62ba85a44cef523d2636c16e75e8ba5fdf427c129aad4dbd4ce58ef2485e64ebaad18a985697cb533d4d93e54bef6db00825454490ece3d8785ad2cbf060a596fb8d78ead4f315eb82a129c2e63d0e06938f3eee3a5c88760511370a8e723215fd7baa7c77827b40a10a2063ddc64125f811cb8a0a233dea45bfd4e725e02dc20d84928f0603cb09636a62cf77e70c84ecce8f0c91271ef86491a76f4b985c4b9d7adef95d8f89e4b9baef1a19b4944479137ddcc06a90bfb7ea9b9f32627e3921d404f916714f1098ce7f5822d11bf5b38c224de19b763129abf671c84cb855d7196aa2d3abd75e82c41e019aee086eea1c97ff11e2c86a9ab51579c4a7e1a6c71db',
				outerResult: '77d9b446dc3d9730439f18366c9803484a9c4b0b8b815f49c8ff37ffaea5f793e4aafc4142a15743e41acff02cc19e13c9b0392f689afa44f1564c5c22b659b5d9a5debea408aa2640e070cd0b69164cbb0a72877b61b11ea85b3fc5860e61dfbc533190dd5825ee667e39e90981df2bbedb5efc0d9f10c397864aad52815f265a6772b17f031cd9b951e1321a07b17bd50095354649adf7a9ee92a5dc388d2c2da5f3d2329c0f485a97ba26536f1eb51e6d847b327f3f26f285ade3335968a7209e9c3e94756c211e5a87f7a8d861ade53f828c7d65a5ce50848f731ec6cfc2fc6d12f08656a07e1c01f820e9850fc0961f0774f2533a007126fa407678f429c30602aa91ed1f340fb698cd68bd51f8ee29db84d029845cf543f07bfcf021bdcfb1252fd9ac810317bd99e91e17d5694e081ac780a270a72ff6ac32345d03e91cc79b82fd2bf7bbbffe6121975d3f2616669b909cccb97426f8b071c648dc41824b2a0e522eacdddead378aa87659be100f10e78ce66f4ed5d6e920c6dbc13d',
				apUtx: '766e9235bd6f86d9818454832bd75dca16814d693cf30f5f7e4403b23f834175b72465a0dd85fea29d5d85a13f8aa9ea3bfed6d5daa565eb7276704be560192ef17e659a967ec7c8ff8a61903e00d03856a83937946d798b18e5e278dd9f55d4905aeb1c0232c1ccccbf6a64ff92cfd3bdec70f0222c245a4a37be97d5fa46b',
				innerResult: 'e0aa3cb04d8e199d6cfa64d860e994ff2c4cdd635f1b786dd2d9276c19431af21c4b3f28d5be7aa0632d48eeb65bde50699d8df69c9b3247f4292f0501baa5d22ef5aca3ef3f10e189e9d5c79476a07af68a45da9c6ca3f88454f353b0201115fb49838a46eebc492b3719c6fb6847037d519cfef91b0e1e5fc3248c7fc62ba85a44cef523d2636c16e75e8ba5fdf427c129aad4dbd4ce58ef2485e64ebaad18a985697cb533d4d93e54bef6db00825454490ece3d8785ad2cbf060a596fb8d78ead4f315eb82a129c2e63d0e06938f3eee3a5c88760511370a8e723215fd7baa7c77827b40a10a2063ddc64125f811cb8a0a233dea45bfd4e725e02dc20d84928f0603cb09636a62cf77e70c84ecce8f0c91271ef86491a76f4b985c4b9d7adef95d8f89e4b9baef1a19b4944479137ddcc06a90bfb7ea9b9f32627e3921d404f916714f1098ce7f5822d11bf5b38c224de19b763129abf671c84cb855d7196aa2d3abd75e82c41e019aee086eea1c97ff11e2c86a9ab51579c4a7e1a6c71db',
				bmkxo: '-2718af38ee8f406225503830db0959517d4361db009a39c7909caaafc9ef8134eab5efa6721f6d79e4573be7ccda540b87e17f20b6e6c658a5c1b5629400c8ae0b7fd1930c0fd1c5826f6922712b4592ed80d36f3b7c577bedb90586548cadf693e92cb2e4c2ea45a4d7d639852665801d585602d14fd2441e2fd6e18804b0a1fa06def6d329060684a674a3f16533baec0d732aa7073f317904bf54363dd861c5af671cf4d40355a8e9fc184c9d6507b5e67fd7224ea426ea58c078c59b46f5c431ed680df8432d53318e74e9324487dffdd06a63ecd563886da567d2cb76e3142977c2b285b3929dd059d5af037e4a21c9433c392f99121c153c888e77448be45fa626cc46fe461fa172e9520de18f639081d6b4c1e1e1ad33a2c5a2ce977de9a3306f270bdc5633d37489f72ec6da410395d8c01474b5385577eea414c8b0d54f8b75f8d1ad6119a3dbe51368ab6750f2645cd6faa5c8acb6e6a8114197e1ea9bb60b4fc22eb0bf5745294c1b5b3629a3d0d8cfeb8c5347f2f4b79be0521f39ecb05c49742310c5b4370617625b348629ea2fb0fb274b722677a9b72d2a6c'
			}
		].forEach(({a, g, k, x, B, N, U, result, innerResult, outerResult, apUtx, bmkxo}, i) => {
			const toBigIntegerAdapter = (context) => {
					const parsedContext = {};
					Object.keys(context).forEach(key => parsedContext[key] = new BigIntegerAdapter(context[key], 16));
					return parsedContext;
				},
				toBigInteger = (context) => {
					const parsedContext = {};
					Object.keys(context).forEach(key => parsedContext[key] = new BigInteger(context[key], 16));
					return parsedContext;
				};

			test(`should be consistent with bigInteger when g ** x % n (${i})`, () => {
				const bigIntegerAdapters = toBigIntegerAdapter({a, g, k, x, B, N, U}),
					bigIntegers = toBigInteger({a, g, k, x, B, N, U});
				expect(bigIntegerAdapters.g.modPow(bigIntegerAdapters.x, bigIntegerAdapters.N).toString(16)).toEqual(outerResult);
				expect(bigIntegers.g.modPow(bigIntegers.x, bigIntegers.N, () => {}).toString(16)).toEqual(outerResult);
			});
			test('should be consistent with bigInteger when calculating bmkxo (${i})', () => {
				const bigIntegerAdapters = toBigIntegerAdapter({a, g, k, x, B, N, U, outerResult, bmkxo}),
					bigIntegers = toBigInteger({a, g, k, x, B, N, U, outerResult, bmkxo}),
					bmkxoAdapted = bigIntegerAdapters.B.subtract(bigIntegerAdapters.k.multiply(bigIntegerAdapters.outerResult)), /*.modPow(bigIntegerAdapters.a.add(bigIntegerAdapters.U.multiply(bigIntegerAdapters.x)), bigIntegerAdapters.N, () => {}),*/
					bmkxoJSBN = bigIntegers.B.subtract(bigIntegers.k.multiply(bigIntegers.outerResult)); /*.modPow(bigIntegers.a.add(bigIntegers.U.multiply(bigIntegers.x)), bigIntegers.N, () => {});*/
				expect(bmkxoAdapted.toString(16)).toEqual(bmkxo.toString(16));
				expect(bmkxoJSBN.toString(16)).toEqual(bmkxo.toString(16));
			});
			test('should be consistent with bigInteger when calculating apUtx(${i})', () => {
				const bigIntegerAdapters = toBigIntegerAdapter({a, g, k, x, B, N, U, outerResult, apUtx}),
					bigIntegers = toBigInteger({a, g, k, x, B, N, U, outerResult, apUtx}),
					apUtxAdapted = bigIntegerAdapters.a.add(bigIntegerAdapters.U.multiply(bigIntegerAdapters.x)),
					apUtxJSBN = bigIntegers.a.add(bigIntegers.U.multiply(bigIntegers.x));
				expect(apUtxAdapted.toString(16)).toEqual(apUtx);
				expect(apUtxJSBN.toString(16)).toEqual(apUtx);
			});


			test('should be consistent with bigInteger when calculating innerResult (${i})', () => {
				const bigIntegerAdapters = toBigIntegerAdapter({a, g, k, x, B, N, U, outerResult}),
					bigIntegers = toBigInteger({a, g, k, x, B, N, U, outerResult}),
					innerResultAdapted = bigIntegerAdapters.B.subtract(bigIntegerAdapters.k.multiply(bigIntegerAdapters.outerResult)).modPow(bigIntegerAdapters.a.add(bigIntegerAdapters.U.multiply(bigIntegerAdapters.x)), bigIntegerAdapters.N, () => {}),
					innerResultJSBN = bigIntegers.B.subtract(bigIntegers.k.multiply(bigIntegers.outerResult)).modPow(bigIntegers.a.add(bigIntegers.U.multiply(bigIntegers.x)), bigIntegers.N, () => {});
				expect(innerResultJSBN.toString(16)).toEqual(innerResult);
				expect(innerResultAdapted.toString(16)).toEqual(innerResult);
			});
			test(`should be consistent with bigInteger when calculating finalResult (${i})`, () => {
				const bigIntegerAdapters = toBigIntegerAdapter({innerResult, N}),
					bigIntegers = toBigInteger({innerResult, N});

				expect(bigIntegerAdapters.innerResult.mod(bigIntegerAdapters.N).toString(16)).toEqual(result);
				expect(bigIntegers.innerResult.mod(bigIntegers.N).toString(16)).toEqual(result);
			});

		});
	});
});

