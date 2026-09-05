const {createApp, ref} = Vue;

const CHARACTERS = [
	{id: 1, name: 'Sol', code: 'SO'},
	{id: 2, name: 'Ky', code: 'KY'},
	{id: 3, name: 'May', code: 'MA'},
	{id: 4, name: 'Millia', code: 'MI'},
	{id: 5, name: 'Axl', code: 'AX'},
	{id: 6, name: 'Potemkin', code: 'PO'},
	{id: 7, name: 'Chipp', code: 'CH'},
	{id: 8, name: 'Eddie', code: 'ED'},
	{id: 9, name: 'Baiken', code: 'BA'},
	{id: 10, name: 'Faust', code: 'FA'},
	{id: 11, name: 'Testament', code: 'TE'},
	{id: 12, name: 'Jam', code: 'JA'},
	{id: 13, name: 'Anji', code: 'AN'},
	{id: 14, name: 'Johnny', code: 'JO'},
	{id: 15, name: 'Venom', code: 'VE'},
	{id: 16, name: 'Dizzy', code: 'DI'},
	{id: 17, name: 'Slayer', code: 'SL'},
	{id: 18, name: 'I-No', code: 'IN'},
	{id: 19, name: 'Zappa', code: 'ZA'},
	{id: 20, name: 'Bridget', code: 'BR'},
	{id: 21, name: 'Robo-Ky', code: 'RO'},
	{id: 22, name: 'A.B.A', code: 'AB'},
	{id: 23, name: 'Order-Sol', code: 'OR'},
	{id: 24, name: 'Kliff', code: 'KL'},
	{id: 25, name: 'Justice', code: 'JU'}
];

const getCharacterData = () => {
	const charReplayTotals = {};
	CHARACTERS.forEach((char) => (charReplayTotals[char.code] = 0));
	replayData.forEach((replay) => (charReplayTotals[replay.charCode] += 1));
	return CHARACTERS.map((char) => ({
		...char,
		replayTotal: charReplayTotals[char.code]
	})).sort((a, b) => b.replayTotal - a.replayTotal);
};

createApp({
	setup() {
		const resetZoom = () => {
			CHART.resetZoom();
		};
		const characterData = ref(getCharacterData());
		const totalReplays = ref(replayData.length);
		return {
			characterData,
			resetZoom,
			totalReplays
		};
	}
}).mount('#app');

// TODO handle case where replayData doesn't exist
const chartData = [];
let totalReplays = 0;
let wins = 0;
replayData.forEach((replay) => {
	totalReplays += 1;
	wins += replay.didWin ? 1 : 0;
	chartData.push({
		x: replay.date,
		y: ((wins / totalReplays) * 100).toFixed(1)
	});
});

const CHART = new Chart(document.getElementById('chart'), {
	type: 'line',
	data: {
		datasets: [
			{
				label: 'Win Rate (%)',
				data: chartData
			}
		]
	},
	options: {
		scales: {
			x: {
				type: 'time',
				time: {
					tooltipFormat: 'YYYY-MM-DD HH:mm:ss',
					displayFormats: {
						millisecond: 'MMM DD YYYY ha',
						seconds: 'MMM DD YYYY ha',
						minute: 'MMM DD YYYY ha',
						hour: 'MMM DD YYYY ha',
						day: 'MMM DD YYYY',
						week: 'MMM DD YYYY',
						month: 'MMM YYYY',
						quarter: 'MMM YYYY',
						year: 'YYYY'
					}
				},
				title: {
					display: true,
					text: 'Date'
				}
			},
			y: {
				beginAtZero: true,
				title: {
					display: true,
					text: 'Win Rate (%)'
				}
			}
		},
		plugins: {
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
