export function TokenParser({runtime}) {
	if (!runtime) {
		throw new Error('invalid-args');
	}
	const parseJWT = (token) => {
			try {
				const base64Url = token.split('.')[1],
					base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
				return JSON.parse(runtime.decodeBase64(base64));
			} catch (_) { //eslint-disable-line no-unused-vars
				return false;
			}
		},
		isNotExpired = (token) => {
			const parsedToken = token && parseJWT(token),
				expUnixTS = parsedToken && parsedToken.exp;
			return Number.isFinite(expUnixTS) && (expUnixTS * 1000 > runtime.getServerTime());
		};
	Object.freeze(Object.assign(this, {parseJWT, isNotExpired}));
};
