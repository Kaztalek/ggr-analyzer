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

type oppDistributionDataType = {
	names: Set<string>;
	total: number;
	yourRoundLosses: number;
	yourRoundWins: number;
	yourWins: number;
};
type oppDistributionFieldType = {
	ID: string;
	Name: string;
	['Total Matches']: number;
	['Your Wins']: number;
	['Your Win Rate (%)']: string;
	['Your Round Wins']: number;
	['Your Round Losses']: number;
	['Also Played As']: string;
};

// replay is valid if normal 1v1 match, where you are one of the players
const checkIsValidReplay = (replay: ggrReplayType): boolean =>
	!replay.modifiedOptions &&
	replay.mode === 'single' &&
	!replay.errors.length &&
	(replay.p1SteamId === STEAM_ID || replay.p2SteamId === STEAM_ID);

export const generateCharacterDistribution = async (
	replays: ggrReplayType[]
) => {
	const charData: {[key: string]: charDistributionDataType} = {};
	CHARACTERS.forEach((char) => {
		charData[char.code] = {total: 0, unique: new Set(), wins: 0, yours: 0};
	});

	let totalProcessedReplays = 0;

	replays.forEach((replay) => {
		if (!checkIsValidReplay(replay)) {
			return;
		}
		const isPlayer1 = STEAM_ID === replay.p1SteamId;

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

export const generateOpponentDistribution = async (
	replays: ggrReplayType[]
) => {
	const oppData: {[key: string]: oppDistributionDataType} = {};

	let totalProcessedReplays = 0;

	replays.forEach((replay) => {
		if (!checkIsValidReplay(replay)) {
			return;
		}
		const isPlayer1 = STEAM_ID === replay.p1SteamId;

		const oppId = isPlayer1 ? replay.p2SteamId : replay.p1SteamId;
		if (!(oppId in oppData)) {
			oppData[oppId] = {
				names: new Set(),
				total: 0,
				yourRoundLosses: 0,
				yourRoundWins: 0,
				yourWins: 0
			};
		}

		const oppName = isPlayer1 ? replay.p2Name : replay.p1Name;
		const didWin =
			(isPlayer1 && replay.winner === 'P1') ||
			(!isPlayer1 && replay.winner === 'P2');

		oppData[oppId].names.add(oppName);
		oppData[oppId].total += 1;
		oppData[oppId].yourRoundLosses += isPlayer1
			? replay.p2RoundsWon
			: replay.p1RoundsWon;
		oppData[oppId].yourRoundWins += isPlayer1
			? replay.p1RoundsWon
			: replay.p2RoundsWon;
		oppData[oppId].yourWins += didWin ? 1 : 0;

		totalProcessedReplays += 1;
	});

	const csvData: oppDistributionFieldType[] = [];
	Object.keys(oppData).forEach((opp) => {
		const stats = oppData[opp];
		const names = [...stats.names];
		csvData.push({
			ID: `"${opp}"`,
			Name: names[0] ?? '',
			['Total Matches']: stats.total,
			['Your Wins']: stats.yourWins,
			['Your Win Rate (%)']: ((stats.yourWins / stats.total) * 100).toFixed(1),
			['Your Round Wins']: stats.yourRoundWins,
			['Your Round Losses']: stats.yourRoundLosses,
			['Also Played As']: names.slice(1).join(',')
		});
	});
	const results = csvData.sort(
		(a, b) => b['Total Matches'] - a['Total Matches']
	);

	console.log(
		`${replays.length} replays found (${totalProcessedReplays} processed, ${replays.length - totalProcessedReplays} skipped)`
	);

	const csv = await json2csv(results, {});
	const outputFilepath = './reports/opponent-distribution.csv';
	await writeFile(outputFilepath, csv);
	console.log(`Wrote ${outputFilepath}`);
};
