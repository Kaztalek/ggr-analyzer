import {CHARACTERS} from './constants';
import {type ggrReplayType} from './replayUtils';
import {json2csv} from 'json-2-csv';
import {writeFile} from 'fs/promises';

const STEAM_ID = process.env.STEAM_ID;
const OPP_STEAM_ID = process.env.OPP_STEAM_ID;
// which reports to generate?
const HTML_REPORT_ENABLED = true;
const CHAR_DIST_REPORT_ENABLED = true;
const OPP_DIST_REPORT_ENABLED = true;
const H2H_REPORT_ENABLED = !!OPP_STEAM_ID;

type allReplayDataType = {
	charCode: (typeof CHARACTERS)[number]['code'];
	date: Date;
	didWin: boolean;
	oppCharCode: (typeof CHARACTERS)[number]['code'];
};

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

type h2hDataType = {
	total: number;
	yourRoundLosses: number;
	yourRoundWins: number;
	yourWins: number;
};
type h2hFieldType = {
	['Matchup (You-Them)']: string;
	['Total Matches']: number;
	['Your Wins']: number;
	['Your Win Rate (%)']: string;
	['Your Round Wins']: number;
	['Your Round Losses']: number;
};

type csvDefsType =
	| charDistributionFieldType
	| oppDistributionFieldType
	| h2hFieldType;

// replay is valid if normal 1v1 match, where you are one of the players
const checkIsValidReplay = (replay: ggrReplayType): boolean =>
	!replay.modifiedOptions &&
	replay.mode === 'single' &&
	!replay.errors.length &&
	(replay.p1SteamId === STEAM_ID || replay.p2SteamId === STEAM_ID);

const generateCsv = async (results: csvDefsType[], outputFilepath: string) => {
	const csv = await json2csv(results, {});
	await writeFile(outputFilepath, csv);
	console.log(`Wrote ${outputFilepath}`);
};

export const generateReports = async (replays: ggrReplayType[]) => {
	// init data export for HTML report
	const allData: allReplayDataType[] = [];

	// init character distribution report data
	const charData: {[key: string]: charDistributionDataType} = {};
	if (CHAR_DIST_REPORT_ENABLED) {
		CHARACTERS.forEach((char) => {
			charData[char.code] = {total: 0, unique: new Set(), wins: 0, yours: 0};
		});
	}

	// init opponent distribution report data
	const oppData: {[key: string]: oppDistributionDataType} = {};

	// init head-to-head report data
	const h2hData: {[key: string]: h2hDataType} = {};
	let h2hOppName = '';

	let totalProcessedReplays = 0;

	replays.forEach((replay) => {
		if (!checkIsValidReplay(replay)) {
			return;
		}
		// common data between reports
		const isPlayer1 = STEAM_ID === replay.p1SteamId;
		const oppId = isPlayer1 ? replay.p2SteamId : replay.p1SteamId;
		const charCode = isPlayer1 ? replay.p1Char.code : replay.p2Char.code;
		const oppCharCode = isPlayer1 ? replay.p2Char.code : replay.p1Char.code;
		const didWin =
			(isPlayer1 && replay.winner === 'P1') ||
			(!isPlayer1 && replay.winner === 'P2');

		if (HTML_REPORT_ENABLED) {
			allData.push({
				charCode,
				date: replay.date,
				didWin,
				oppCharCode
			});
		}

		if (CHAR_DIST_REPORT_ENABLED) {
			charData[oppCharCode].total += 1;
			charData[oppCharCode].unique.add(oppId);
			charData[oppCharCode].wins += didWin ? 1 : 0;
			charData[charCode].yours += 1;
		}

		if (OPP_DIST_REPORT_ENABLED) {
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

			oppData[oppId].names.add(oppName);
			oppData[oppId].total += 1;
			oppData[oppId].yourRoundLosses += isPlayer1
				? replay.p2RoundsWon
				: replay.p1RoundsWon;
			oppData[oppId].yourRoundWins += isPlayer1
				? replay.p1RoundsWon
				: replay.p2RoundsWon;
			oppData[oppId].yourWins += didWin ? 1 : 0;
		}

		if (H2H_REPORT_ENABLED && oppId === OPP_STEAM_ID) {
			if (!h2hOppName) {
				h2hOppName = isPlayer1 ? replay.p2Name : replay.p1Name;
			}
			const matchKey = `${charCode}-${oppCharCode}`;
			if (!(matchKey in h2hData)) {
				h2hData[matchKey] = {
					total: 0,
					yourRoundLosses: 0,
					yourRoundWins: 0,
					yourWins: 0
				};
			}

			h2hData[matchKey].total += 1;
			h2hData[matchKey].yourRoundLosses += isPlayer1
				? replay.p2RoundsWon
				: replay.p1RoundsWon;
			h2hData[matchKey].yourRoundWins += isPlayer1
				? replay.p1RoundsWon
				: replay.p2RoundsWon;
			h2hData[matchKey].yourWins += didWin ? 1 : 0;
		}

		totalProcessedReplays += 1;
	});

	console.log(
		`${replays.length} replays found (${totalProcessedReplays} processed, ${replays.length - totalProcessedReplays} skipped)`
	);

	// export data for HTML report
	if (HTML_REPORT_ENABLED) {
		await writeFile(
			'./replayData.js',
			`window.replayData = ${JSON.stringify(allData.sort((a, b) => a.date.getTime() - b.date.getTime()))};`
		);
	}

	// generate character distribution report csv
	if (CHAR_DIST_REPORT_ENABLED) {
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

		generateCsv(results, './reports/character-distribution.csv');
	}

	// generate character distribution report csv
	if (OPP_DIST_REPORT_ENABLED) {
		const csvData: oppDistributionFieldType[] = [];
		Object.keys(oppData).forEach((opp) => {
			const stats = oppData[opp];
			const names = [...stats.names];
			csvData.push({
				ID: `"${opp}"`,
				Name: names[0] ?? '',
				['Total Matches']: stats.total,
				['Your Wins']: stats.yourWins,
				['Your Win Rate (%)']: ((stats.yourWins / stats.total) * 100).toFixed(
					1
				),
				['Your Round Wins']: stats.yourRoundWins,
				['Your Round Losses']: stats.yourRoundLosses,
				['Also Played As']: names.slice(1).join(',')
			});
		});
		const results = csvData.sort(
			(a, b) => b['Total Matches'] - a['Total Matches']
		);

		generateCsv(results, './reports/opponent-distribution.csv');
	}

	// generate head-to-head report csv
	if (H2H_REPORT_ENABLED) {
		const csvData: h2hFieldType[] = [];
		Object.keys(h2hData).forEach((matchKey) => {
			const stats = h2hData[matchKey];
			csvData.push({
				['Matchup (You-Them)']: matchKey,
				['Total Matches']: stats.total,
				['Your Wins']: stats.yourWins,
				['Your Win Rate (%)']: ((stats.yourWins / stats.total) * 100).toFixed(
					1
				),
				['Your Round Wins']: stats.yourRoundWins,
				['Your Round Losses']: stats.yourRoundLosses
			});
		});
		const results = csvData.sort(
			(a, b) => b['Total Matches'] - a['Total Matches']
		);

		generateCsv(results, `./reports/head-to-head_${h2hOppName}.csv`);
	}
};
