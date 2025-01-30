import {Sha256} from '@aws-crypto/sha256-js';
import {BigInteger} from '../external/jsbn';
import {shortToHex, hexToShort} from './precalculate-hex-tables';
const INIT_N = 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
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
	'43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF',
	HEX_MSB_REGEX = /^[89a-f]/i;
export function SRPCalculator({runtime}) {
	const getSha256Digest = (secret, data) => {
			const awsCryptoHash = new Sha256(secret);
			awsCryptoHash.update(data);
			return awsCryptoHash.digestSync();
		},
		getHkdfKey = (ikm, salt, info) => {
			const resultFromAWSCryptoPrk = getSha256Digest(salt, ikm),
				resultFromAWSCryptoHmac = getSha256Digest(resultFromAWSCryptoPrk, info);
			return resultFromAWSCryptoHmac.slice(0, 16);
		},
		getPaddedHex = (bigInt) => {
			if (!(bigInt instanceof BigInteger)) {
				throw new Error('Not a BigInteger');
			}

			const isNegative = bigInt.compareTo(BigInteger.ZERO) < 0;
			let hexStr = bigInt.abs().toString(16);
			hexStr = hexStr.length % 2 !== 0 ? `0${hexStr}` : hexStr;
			hexStr = HEX_MSB_REGEX.test(hexStr) ? `00${hexStr}` : hexStr;
			if (isNegative) {
				const invertedNibbles = hexStr.split('')
						.map((x) => {
							const invertedNibble = ~parseInt(x, 16) & 0xf;
							return '0123456789ABCDEF'.charAt(invertedNibble);
						})
						.join(''),
					flippedBitsBI = new BigInteger(invertedNibbles, 16).add(
						BigInteger.ONE,
					);
				hexStr = flippedBitsBI.toString(16);
				if (hexStr.toUpperCase().startsWith('FF8')) {
					hexStr = hexStr.substring(2);
				}
			}

			return hexStr;
		},
		getBytesFromHex = (encoded) => {
			if (encoded.length % 2 !== 0) {
				throw new Error('Hex encoded strings must have an even number length');
			}
			const out = new Uint8Array(encoded.length / 2);
			for (let i = 0; i < encoded.length; i += 2) {
				const encodedByte = encoded.slice(i, i + 2).toLowerCase();
				if (encodedByte in hexToShort) {
					out[i / 2] = hexToShort[encodedByte];
				} else {
					throw new Error(
						`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`,
					);
				}
			}
			return out;
		},
		getHexFromBytes = (bytes) => {
			return Array.from(bytes).map(i => shortToHex[i]).join('');
		},
		getHashFromData = (data) => {
			const sha256 = new Sha256();
			sha256.update(data);

			// eslint-disable-next-line one-var
			const hashedData = sha256.digestSync(),
				hashHexFromUint8 = getHexFromBytes(hashedData);

			return new Array(64 - hashHexFromUint8.length).join('0') + hashHexFromUint8;
		},
		getHashFromHex = (hexStr) => getHashFromData(getBytesFromHex(hexStr)),
		calculateA = ({a, g, N}) => {
			const A = g.modPow(a, N, () => {});
			if (A.mod(N).equals(BigInteger.ZERO)) {
				throw new Error('Illegal parameter. A mod N cannot be 0.');
			}
			return A;
		},
		calculateS = ({a, g, k, x, B, N, U}) => {
			const outerResult = g.modPow(x, N, () => {}),
				innerResult = B.subtract(k.multiply(outerResult)).modPow(a.add(U.multiply(x)), N, () => {});
			return innerResult.mod(N);
		},
		calculateU = ({A, B}) => {
			const U = new BigInteger(
				getHashFromHex(getPaddedHex(A) + getPaddedHex(B)),
				16,
			);
			if (U.equals(BigInteger.ZERO)) {
				throw new Error('U cannot be zero.');
			}
			return U;
		},
		generateRandomBigInteger = () => {
			// This will be interpreted as a postive 128-bit integer
			const hexRandom = getHexFromBytes(runtime.randomArray(128));
			// There is no need to do randomBigInt.mod(this.N - 1) as N (3072-bit) is > 128 bytes (1024-bit)
			return new BigInteger(hexRandom, 16);
		},
		initContext = () => {
			const N = new BigInteger(INIT_N, 16),
				g = new BigInteger('2', 16),
				a = generateRandomBigInteger(),
				A = calculateA({a, g, N}),
				k = new BigInteger(
					getHashFromHex(`${getPaddedHex(N)}${getPaddedHex(g)}`),
					16,
				);

			return {N, g, a, A, k};
		},
		urlB64ToUint8Array = (base64String)  => {
			const padding = '='.repeat((4 - (base64String.length % 4)) % 4),
				base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/'),
				rawData = runtime.decodeBase64(base64),
				outputArray = new Uint8Array(rawData.length);

			for (let i = 0; i < rawData.length; ++i) {
				outputArray[i] = rawData.charCodeAt(i);
			}

			return outputArray;
		},
		createHkdfInfo = () => {
			const context = runtime.encodeUTF8StringToBinary('Caldera Derived Key'),
				spacer = runtime.encodeUTF8StringToBinary(String.fromCharCode(1)),
				info = new Uint8Array(context.byteLength + spacer.byteLength);
			info.set(context, 0);
			info.set(spacer, context.byteLength);
			return info;
		},
		buildSignatureBuffer = (bufUPIDaToB, bufUNaToB, bufSBaToB, bufDNaToB) => {
			const bufConcat = new Uint8Array(
				bufUPIDaToB.byteLength +
				bufUNaToB.byteLength +
				bufSBaToB.byteLength +
				bufDNaToB.byteLength,
			);
			bufConcat.set(bufUPIDaToB, 0);
			bufConcat.set(bufUNaToB, bufUPIDaToB.byteLength);
			bufConcat.set(bufSBaToB, bufUPIDaToB.byteLength + bufUNaToB.byteLength);
			bufConcat.set(
				bufDNaToB,
				bufUPIDaToB.byteLength + bufUNaToB.byteLength + bufSBaToB.byteLength,
			);
			return bufConcat;
		},
		getSignature = ({ userPoolName, username, challengeParameters, dateNow, hkdf}) => {
			const awsCryptoHash = new Sha256(hkdf),
				bufUPIDaToB = runtime.encodeUTF8StringToBinary(userPoolName),
				bufUNaToB = runtime.encodeUTF8StringToBinary(username),
				bufSBaToB = urlB64ToUint8Array(challengeParameters.SECRET_BLOCK),
				bufDNaToB = runtime.encodeUTF8StringToBinary(dateNow),
				bufConcat = buildSignatureBuffer(bufUPIDaToB, bufUNaToB, bufSBaToB, bufDNaToB);
			awsCryptoHash.update(bufConcat);

			// eslint-disable-next-line one-var
			const resultFromAWSCrypto = awsCryptoHash.digestSync(),
				signatureString = runtime.bufferEncodeBase64(resultFromAWSCrypto);

			return signatureString;
		},
		getPasswordAuthenticationKey = ({username, password, serverBValue, salt, userPoolName}, context) => {
			if (serverBValue.mod(context.N).equals(BigInteger.ZERO)) {
				throw new Error('B cannot be zero.');
			}
			const calculateX = () => {
					const usernamePassword = `${userPoolName}${username}:${password}`,
						usernamePasswordHash = getHashFromData(usernamePassword);
					return new BigInteger(
						getHashFromHex(getPaddedHex(salt) + usernamePasswordHash),
						16,
					);
				},
				serverContext = Object.assign({B: serverBValue}, context),
				expandedContext = Object.assign(serverContext, {U: calculateU(serverContext), x: calculateX()});

			return getHkdfKey(
				getBytesFromHex(getPaddedHex(calculateS(expandedContext))),
				getBytesFromHex(getPaddedHex(expandedContext.U)),
				createHkdfInfo(),
			);
		};

	Object.freeze(Object.assign(this, {initContext, getSignature, getPasswordAuthenticationKey}));
};

