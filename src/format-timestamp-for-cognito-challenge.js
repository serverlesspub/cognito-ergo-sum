const MONTH_NAMES = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	],
	WEEK_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatTimestampForCognitoChallenge(millis) {
	const now = new Date(millis),
		weekDay = WEEK_NAMES[now.getUTCDay()],
		month = MONTH_NAMES[now.getUTCMonth()],
		day = now.getUTCDate(),
		year = now.getUTCFullYear();
	let hours = now.getUTCHours(),
		minutes = now.getUTCMinutes(),
		seconds = now.getUTCSeconds();
	if (hours < 10) {
		hours = `0${hours}`;
	}
	if (minutes < 10) {
		minutes = `0${minutes}`;
	}
	if (seconds < 10) {
		seconds = `0${seconds}`;
	}
	return `${weekDay} ${month} ${day} ${hours}:${minutes}:${seconds} UTC ${year}`;
};
