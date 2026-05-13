import {readAllReplays, readReplayData} from './replayUtils';

const main = async () => {
	const filename = process.argv[2];
	if (filename) {
		// single file specified, simply print parsed metadata
		if (!filename?.endsWith('.ggr')) {
			throw new Error('expected .ggr file');
		}
		const replayData = await readReplayData(filename);
		console.log(replayData);
		return;
	}
	// read replay data from directories specified in .env
	const replayPaths = process.env.REPLAY_PATHS?.split(',');
	if (!Array.isArray(replayPaths)) {
		throw new Error('REPLAY_PATHS not specified. update .env');
	}
	const replays = await readAllReplays(replayPaths);
	console.log(`${replays.length} replays found`);
};

main();
