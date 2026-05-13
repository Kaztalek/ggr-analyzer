import {readReplayData} from './replayUtils';

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
	const paths = process.env.REPLAY_PATHS?.split(',');
	if (!Array.isArray(paths)) {
		throw new Error('REPLAY_PATHS not specified. update .env');
	}
	console.log(paths);
};

main();
