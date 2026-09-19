// convert comma-separated env entry into an array
// empty strings removed, whitespace trimmed
export const envToArray = (str: string | undefined) =>
	str
		?.split(',')
		?.filter(Boolean)
		?.map((str) => str.trim());
