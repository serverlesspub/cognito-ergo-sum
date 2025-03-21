import {Sha256} from '@aws-crypto/sha256-js';
import {shortToHex, hexToShort} from './precalculate-hex-tables';
import {getPaddedHex} from './get-padded-hex';
import precalculatedN from './precalculated-n';
import {modPow} from './modpow';
import {parseBigInt} from './parse-bigint';
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
			const A = modPow(g, a, N);
			if (A % N === 0n) {
				throw new TypeError('Illegal parameter. A mod N cannot be 0.');
			}
			return A;
		},
		calculateS = ({a, g, k, x, B, N, U}) => {
			const outerResult = modPow(g, x, N),
				base = B - (k * outerResult),
				exponent = a + (U * x),
				innerResult = modPow(base, exponent, N);
			return innerResult % N;
		},
		calculateU = ({A, B}) => {
			const U = parseBigInt(
				getHashFromHex(getPaddedHex(A) + getPaddedHex(B)),
				16,
			);
			if (U === 0n) {
				throw new Error('U cannot be zero.');
			}
			return U;
		},
		generateRandomBigInteger = () => {
			// This will be interpreted as a postive 128-bit integer
			const hexRandom = getHexFromBytes(runtime.randomArray(128));
			// There is no need to do randomBigInt.mod(this.N - 1) as N (3072-bit) is > 128 bytes (1024-bit)
			return parseBigInt(hexRandom, 16);
		},
		initContext = () => {
			const N = parseBigInt(precalculatedN, 16),
				g = 2n,
				a = generateRandomBigInteger(),
				A = calculateA({a, g, N}),
				k = parseBigInt(
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
		calculateX = ({username, password, salt, userPoolName}) => {
			const usernamePassword = `${userPoolName}${username}:${password}`,
				usernamePasswordHash = getHashFromData(usernamePassword);
			return parseBigInt(
				getHashFromHex(getPaddedHex(salt) + usernamePasswordHash),
				16,
			);
		},
		getPasswordAuthenticationKey = ({username, password, serverBValue, salt, userPoolName}, context) => {
			if ((serverBValue % context.N) === 0) {
				throw new Error('B mod N cannot be zero.');
			}
			const serverContext = Object.assign({B: serverBValue}, context),
				expandedContext = Object.assign(serverContext, {U: calculateU(serverContext), x: calculateX({username, password, salt, userPoolName})});

			return getHkdfKey(
				getBytesFromHex(getPaddedHex(calculateS(expandedContext))),
				getBytesFromHex(getPaddedHex(expandedContext.U)),
				createHkdfInfo(),
			);
		};

	Object.freeze(Object.assign(this, {initContext, getSignature, getPasswordAuthenticationKey}));
};

