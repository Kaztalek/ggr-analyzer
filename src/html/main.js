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

const ctx = document.getElementById('chart');

new Chart(ctx, {
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
