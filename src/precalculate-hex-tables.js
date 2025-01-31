const precalculateHexTables = () => {
		const shortToHex = [],
			hexToShort = [];
		for (let i = 0; i < 256; i++) {
			const encodedByte = i.toString(16).padStart(2, '0').toLowerCase();
			shortToHex[i] = encodedByte;
			hexToShort[encodedByte] = i;
		}
		return {shortToHex, hexToShort};
	},
	{shortToHex, hexToShort} = precalculateHexTables();

export {shortToHex, hexToShort};
