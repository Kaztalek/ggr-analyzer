import {CHARACTERS, OUTCOMES, RANKS} from './constants';
import {readFile, readdir} from 'fs/promises';
import path from 'path';

export const readAllReplays = async (replayPaths: string[]) => {
	const replayPromises = replayPaths.map((filepath) => readReplayDir(filepath));
	const replayList = await Promise.all(replayPromises);
	return replayList.flat();
};

export const readReplayDir = async (filepath: string) => {
	try {
		const files = await readdir(filepath);
		const replayPromises = files
			.filter((file) => file.endsWith('.ggr'))
			.map((file) => readReplayData(path.resolve(filepath, file)));
		const replays = await Promise.all(replayPromises);
		return replays;
	} catch (err) {
		console.error(err);
	}
};

export const readReplayData = async (filename: string) => {
	const buffer = await readFile(filename);
	return parseReplay(buffer);
};

// replay metadata documentation: https://steamcommunity.com/app/348550/discussions/0/3203746177244378016/
export const parseReplay = (ggrBuffer: Buffer) => {
	const year = ggrBuffer.readUInt16LE(0x1a);
	const month = ggrBuffer.readUInt8(0x1c);
	const day = ggrBuffer.readUInt8(0x1d);
	const hour = ggrBuffer.readUInt8(0x1e);
	const minute = ggrBuffer.readUInt8(0x1f);
	const second = ggrBuffer.readUInt8(0x20);
	const date = new Date(year, month - 1, day, hour, minute, second);

	const p1SteamId = ggrBuffer.readBigInt64LE(0x22).toString();
	const p2SteamId = ggrBuffer.readBigInt64LE(0x2a).toString();
	const p1Name = ggrBuffer
		.subarray(0x32, 0x52)
		.toString('utf-8')
		.replace(/\x00/g, '');
	const p2Name = ggrBuffer
		.subarray(0x52, 0x72)
		.toString('utf-8')
		.replace(/\x00/g, '');

	const p1CharCode = ggrBuffer.readUInt8(0x72);
	const p2CharCode = ggrBuffer.readUInt8(0x73);
	const p1Char = CHARACTERS[p1CharCode - 1];
	const p2Char = CHARACTERS[p2CharCode - 1];

	const modifiedOptions = !!ggrBuffer.readUInt8(0x74);
	const mode = ggrBuffer.readUInt8(0x75) === 1 ? 'single' : 'team';
	const version = ggrBuffer.readUInt8(0x76) === 0 ? '+R' : 'AC';

	const gmtOffset = `GMT${new Intl.NumberFormat('en-US', {signDisplay: 'exceptZero'}).format(-Math.floor(ggrBuffer.readInt32LE(0x77) / 60 / 60))}`;

	const p1RoundsWon = ggrBuffer.readUInt8(0x7b);
	const p2RoundsWon = ggrBuffer.readUInt8(0x7c);

	const outcome = OUTCOMES[ggrBuffer.readUInt8(0x7d)];

	const ping = ggrBuffer.readUInt8(0x7e);

	const durationInFrames = ggrBuffer.readUInt32LE(0x7f);

	const p1Score = ggrBuffer.readUInt8(0x83);
	const p2Score = ggrBuffer.readUInt8(0x84);

	const p1RankCode = ggrBuffer.readUInt8(0x85);
	const p2RankCode = ggrBuffer.readUInt8(0x86);
	const p1Rank = RANKS[p1RankCode];
	const p2Rank = RANKS[p2RankCode];

	const winnerCode = ggrBuffer.readUInt8(0x87);
	const winner = winnerCode === 1 ? 'P1' : winnerCode === 2 ? 'P2' : 'draw';

	return {
		date,
		p1SteamId,
		p2SteamId,
		p1Name,
		p2Name,
		p1Char,
		p2Char,
		modifiedOptions,
		mode,
		version,
		gmtOffset,
		p1RoundsWon,
		p2RoundsWon,
		outcome,
		ping,
		durationInFrames,
		p1Score,
		p2Score,
		p1Rank,
		p2Rank,
		winner
	};
};
