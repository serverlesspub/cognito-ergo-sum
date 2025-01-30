import {formatTimestampForCognitoChallenge} from '../src/format-timestamp-for-cognito-challenge';

describe('formatTimestampForCognitoChallenge', () => {
	it('should format a basic timestamp correctly', () => {
		const timestamp = Date.UTC(2023, 0, 1, 0, 0, 0), // Jan 1, 2023, 00:00:00 UTC
			result = formatTimestampForCognitoChallenge(timestamp);
		expect(result).toBe('Sun Jan 1 00:00:00 UTC 2023');
	});

	it('should handle single-digit hours, minutes, and seconds', () => {
		const timestamp = Date.UTC(2023, 0, 1, 2, 3, 4), // Jan 1, 2023, 02:03:04 UTC
			result = formatTimestampForCognitoChallenge(timestamp);
		expect(result).toBe('Sun Jan 1 02:03:04 UTC 2023');
	});

	it('should format correctly for different months', () => {
		const timestamp = Date.UTC(2023, 11, 25, 13, 45, 30), // Dec 25, 2023, 13:45:30 UTC
			result = formatTimestampForCognitoChallenge(timestamp);
		expect(result).toBe('Mon Dec 25 13:45:30 UTC 2023');
	});

	it('should format correctly for a leap year date', () => {
		const timestamp = Date.UTC(2024, 1, 29, 15, 30, 0), // Feb 29, 2024, 15:30:00 UTC
			result = formatTimestampForCognitoChallenge(timestamp);
		expect(result).toBe('Thu Feb 29 15:30:00 UTC 2024');
	});

	it('should format correctly for the last second of the year', () => {
		const timestamp = Date.UTC(2023, 11, 31, 23, 59, 59), // Dec 31, 2023, 23:59:59 UTC
			result = formatTimestampForCognitoChallenge(timestamp);
		expect(result).toBe('Sun Dec 31 23:59:59 UTC 2023');
	});

	it('should handle timestamps for the first second of the year', () => {
		const timestamp = Date.UTC(2024, 0, 1, 0, 0, 1), // Jan 1, 2024, 00:00:01 UTC
			result = formatTimestampForCognitoChallenge(timestamp);
		expect(result).toBe('Mon Jan 1 00:00:01 UTC 2024');
	});
});
