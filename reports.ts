import {CHARACTERS} from './constants';
import {type ggrReplayType} from './replayUtils';
import {json2csv} from 'json-2-csv';
import {writeFile} from 'fs/promises';

const STEAM_ID = process.env.STEAM_ID;

type charDistributionDataType = {
	total: number;
	unique: Set<string>;
	wins: number;
	yours: number;
};
type charDistributionFieldType = {
	Character: string;
	['Unique Opponents']: number;
	['Total Matches']: number;
	Wins: number;
	['Win Rate (%)']: string;
	['Matches Played As']: number;
};

export const generateCharacterDistribution = async (
	replays: ggrReplayType[]
) => {
	const charData: {[key: string]: charDistributionDataType} = {};
	CHARACTERS.forEach((char) => {
		charData[char.code] = {total: 0, unique: new Set(), wins: 0, yours: 0};
	});

	let totalProcessedReplays = 0;

	replays.forEach((replay) => {
		// skip replays that aren't normal 1v1 matches
		if (
			replay.modifiedOptions ||
			replay.mode !== 'single' ||
			replay.errors.length
		) {
			return;
		}
		const isPlayer1 = STEAM_ID === replay.p1SteamId;
		// skip replays where you are not playing
		if (!isPlayer1 && STEAM_ID !== replay.p2SteamId) {
			return;
		}

		const charCode = isPlayer1 ? replay.p1Char.code : replay.p2Char.code;
		const oppCharCode = isPlayer1 ? replay.p2Char.code : replay.p1Char.code;
		const oppId = isPlayer1 ? replay.p2SteamId : replay.p1SteamId;
		const didWin =
			(isPlayer1 && replay.winner === 'P1') ||
			(!isPlayer1 && replay.winner === 'P2');

		charData[oppCharCode].total += 1;
		charData[oppCharCode].unique.add(oppId);
		charData[oppCharCode].wins += didWin ? 1 : 0;
		charData[charCode].yours += 1;

		totalProcessedReplays += 1;
	});

	const csvData: charDistributionFieldType[] = [];
	CHARACTERS.forEach((char) => {
		const stats = charData[char.code];
		csvData.push({
			Character: char.name,
			['Unique Opponents']: stats.unique.size,
			['Total Matches']: stats.total,
			Wins: stats.wins,
			// prefer not appending % to the end so numbers are naturally right-aligned, for easier reading
			['Win Rate (%)']: ((stats.wins / stats.total) * 100).toFixed(1),
			['Matches Played As']: stats.yours
		});
	});
	const results = csvData.sort(
		(a, b) => b['Unique Opponents'] - a['Unique Opponents']
	);

	console.log(
		`${replays.length} replays found (${totalProcessedReplays} processed, ${replays.length - totalProcessedReplays} skipped)`
	);

	const csv = await json2csv(results, {});
	const outputFilepath = './reports/character-distribution.csv';
	await writeFile(outputFilepath, csv);
	console.log(`Wrote ${outputFilepath}`);
};
