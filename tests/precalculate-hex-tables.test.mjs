import { shortToHex, hexToShort } from '../src/precalculate-hex-tables';

describe('precalculateHexTables', () => {
	it('should correctly map numbers 0-255 to their 2-digit hexadecimal strings', () => {
		for (let i = 0; i < 256; i++) {
			const hex = i.toString(16).padStart(2, '0').toLowerCase();
			expect(shortToHex[i]).toBe(hex);
		}
	});

	it('should correctly map 2-digit hexadecimal strings to their numeric values', () => {
		for (let i = 0; i < 256; i++) {
			const hex = i.toString(16).padStart(2, '0').toLowerCase();
			expect(hexToShort[hex]).toBe(i);
		}
	});

	it('should ensure all hex values are 2 characters long', () => {
		for (let i = 0; i < 256; i++) {
			expect(shortToHex[i]).toHaveLength(2);
		}
	});

	it('should handle edge cases like 0 and 255 correctly', () => {
		expect(shortToHex[0]).toBe('00');
		expect(shortToHex[255]).toBe('ff');
		expect(hexToShort['00']).toBe(0);
		expect(hexToShort['ff']).toBe(255);
	});

	it('should handle invalid hex string lookups gracefully', () => {
		expect(hexToShort['gg']).toBeUndefined();
		expect(hexToShort['1']).toBeUndefined(); // Only 2-character strings are valid
		expect(hexToShort['zzz']).toBeUndefined(); // Invalid length and characters
	});
});
