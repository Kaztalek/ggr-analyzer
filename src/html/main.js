const {createApp, onMounted, ref, watch} = Vue;

// dominant color gotten from parsing icons here: https://lokeshdhakar.com/projects/color-thief/
// used 2nd dominant color for Sol to differentiate SO and OR
const CHARACTERS = {
	SO: {name: 'Sol', code: 'SO', color: '#9a3e2f'},
	KY: {name: 'Ky', code: 'KY', color: '#fbc065'},
	MA: {name: 'May', code: 'MA', color: '#de551e'},
	MI: {name: 'Millia', code: 'MI', color: '#f5ce88'},
	AX: {name: 'Axl', code: 'AX', color: '#962437'},
	PO: {name: 'Potemkin', code: 'PO', color: '#341307'},
	CH: {name: 'Chipp', code: 'CH', color: '#aa9daf'},
	ED: {name: 'Eddie', code: 'ED', color: '#cc9e7c'},
	BA: {name: 'Baiken', code: 'BA', color: '#8c201a'},
	FA: {name: 'Faust', code: 'FA', color: '#b9764c'},
	TE: {name: 'Testament', code: 'TE', color: '#14131c'},
	JA: {name: 'Jam', code: 'JA', color: '#692d15'},
	AN: {name: 'Anji', code: 'AN', color: '#462e1f'},
	JO: {name: 'Johnny', code: 'JO', color: '#442d2c'},
	VE: {name: 'Venom', code: 'VE', color: '#173698'},
	DI: {name: 'Dizzy', code: 'DI', color: '#31526b'},
	SL: {name: 'Slayer', code: 'SL', color: '#501600'},
	IN: {name: 'I-No', code: 'IN', color: '#5b0016'},
	ZA: {name: 'Zappa', code: 'ZA', color: '#52291b'},
	BR: {name: 'Bridget', code: 'BR', color: '#313b65'},
	RO: {name: 'Robo-Ky', code: 'RO', color: '#fac37a'},
	AB: {name: 'A.B.A', code: 'AB', color: '#882f0b'},
	OR: {name: 'Order-Sol', code: 'OR', color: '#3f1e1f'},
	KL: {name: 'Kliff', code: 'KL', color: '#908266'},
	JU: {name: 'Justice', code: 'JU', color: '#b67a5f'}
};
const CHARACTER_DATA = Object.values(CHARACTERS);

const getCharacterData = () => {
	const charReplayTotals = {};
	CHARACTER_DATA.forEach((char) => (charReplayTotals[char.code] = 0));
	replayData.forEach((replay) => (charReplayTotals[replay.charCode] += 1));
	return CHARACTER_DATA.map((char) => ({
		...char,
		replayTotal: charReplayTotals[char.code]
	})).sort((a, b) => b.replayTotal - a.replayTotal);
};

const filterDatasets = (datasets, filterFn) =>
	datasets.map((dataset) => {
		let wins = 0;

		return {
			...dataset,
			data: filterFn(dataset.data).map((replay, i) => {
				if (replay.didWin) {
					wins += 1;
				}
				return {
					...replay,
					x: i + 1,
					y: ((wins / (i + 1)) * 100).toFixed(1)
				};
			})
		};
	});

createApp({
	setup() {
		let chart;
		const resetZoom = () => {
			chart.resetZoom();
		};
		const characterData = ref(getCharacterData());
		const totalReplays = ref(replayData.length);
		const gameDisplayCount = ref(100);
		const gameDisplayOptions = ref([
			{text: 100, value: 100},
			{text: 500, value: 500},
			{text: 1000, value: 1000},
			{text: `All (${replayData.length})`, value: replayData.length}
		]);

		const datasets = [
			{
				data: replayData,
				label: 'All characters',
				borderColor: '#7bedd4',
				backgroundColor: '#7bedd4cc' // TODO redundant code
			},
			...Object.values(
				replayData.reduce((charSets, replay) => {
					const charSet = (charSets[replay.charCode] ??= {
						data: [],
						label: replay.charCode,
						hidden: true,
						borderColor: CHARACTERS[replay.charCode].color,
						backgroundColor: `${CHARACTERS[replay.charCode].color}cc`
					});

					charSet.data.push(replay);

					return charSets;
				}, {})
			).sort((a, b) => b.data.length - a.data.length)
		];

		onMounted(() => {
			chart = new Chart(document.getElementById('chart'), {
				type: 'line',
				options: {
					scales: {
						x: {
							type: 'linear',
							min: 1,
							title: {
								display: true
							}
						},
						// TODO have time-scaled x-axis option in the future
						// x: {
						// 	type: 'time',
						// 	time: {
						// 		tooltipFormat: 'YYYY-MM-DD HH:mm:ss',
						// 		displayFormats: {
						// 			millisecond: 'MMM DD YYYY ha',
						// 			seconds: 'MMM DD YYYY ha',
						// 			minute: 'MMM DD YYYY ha',
						// 			hour: 'MMM DD YYYY ha',
						// 			day: 'MMM DD YYYY',
						// 			week: 'MMM DD YYYY',
						// 			month: 'MMM YYYY',
						// 			quarter: 'MMM YYYY',
						// 			year: 'YYYY'
						// 		}
						// 	},
						// 	title: {
						// 		display: true,
						// 		text: 'Date'
						// 	}
						// },
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: 'Win Rate (%)'
							}
						}
					},
					plugins: {
						tooltip: {
							callbacks: {
								title: (items) =>
									moment(items[0].dataset.data[items[0].dataIndex].date).format(
										'YYYY-MM-DD HH:mm:ss'
									),
								label: (context) =>
									`${CHARACTERS[context.raw.charCode]?.name ?? context.raw.charCode}: ${context.formattedValue}%`
							}
						},
						zoom: {
							pan: {
								enabled: true,
								mode: 'xy'
							},
							limits: {
								x: {
									min: 'original',
									max: 'original'
								},
								y: {
									min: 0,
									max: 100
								}
							},
							zoom: {
								wheel: {
									enabled: true
								},
								pinch: {
									enabled: true
								},
								mode: 'xy'
							}
						}
					}
				}
			});

			// filter chart to last n games
			watch(
				gameDisplayCount,
				(newValue) => {
					chart.data.datasets = filterDatasets(datasets, (data) =>
						data.slice(-newValue)
					);
					chart.options.scales.x.title.text = `Last ${newValue} games`;
					chart.update();
				},
				{immediate: true}
			);
		});

		return {
			characterData,
			gameDisplayCount,
			gameDisplayOptions,
			resetZoom,
			totalReplays
		};
	}
}).mount('#app');

// TODO handle case where replayData doesn't exist
