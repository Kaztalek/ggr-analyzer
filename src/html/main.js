const {computed, createApp, onBeforeUnmount, onMounted, ref, watch} = Vue;

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

const ALL_CHAR_KEY = 'All characters';
const replayData = window.replayData || [];

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

const datasets = [
	{
		data: replayData,
		label: ALL_CHAR_KEY,
		borderColor: '#7bedd4',
		backgroundColor: '#7bedd4cc'
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

// Chart.js object
let chart;

// keep chart updates in sync with our Vue data
const syncChart = (characterVisibility) => {
	datasets.forEach((dataset, i) => {
		if (characterVisibility[dataset.label] !== chart.isDatasetVisible(i)) {
			// click legend directly to keep animations
			// otherwise, use chart.setDataVisibility and chart.update
			chart.options.plugins.legend.onClick.call(
				chart,
				null,
				{datasetIndex: i},
				chart.legend
			);
		}
	});
};

const app = createApp({
	setup() {
		const resetZoom = () => {
			chart.resetZoom();
		};
		const characterData = ref(getCharacterData());
		const characterVisibility = ref({
			[ALL_CHAR_KEY]: true,
			...Object.fromEntries(Object.keys(CHARACTERS).map((key) => [key, false]))
		});
		const totalReplays = ref(replayData.length);
		const gameDisplayOptions = ref([
			{text: 100, value: 100},
			{text: 500, value: 500},
			{text: 1000, value: 1000},
			{text: `All (${replayData.length})`, value: replayData.length}
		]);
		const gameDisplayCount = ref(gameDisplayOptions.value[0].value);

		onMounted(() => {
			chart = new Chart(document.getElementById('win-rate-chart'), {
				type: 'line',
				options: {
					maintainAspectRatio: false,
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
						legend: {
							display: false
						},
						tooltip: {
							enabled: false,
							external: (context) => {
								// custom tooltip based on example from Chart.js documentation https://www.chartjs.org/docs/latest/configuration/tooltip.html#external-custom-tooltips
								let tooltipEl = document.getElementById(
									'win-rate-chart-tooltip'
								);

								if (!tooltipEl) {
									tooltipEl = document.createElement('div');
									tooltipEl.id = 'win-rate-chart-tooltip';
									document.body.appendChild(tooltipEl);
								}

								const tooltipModel = context.tooltip;
								// hide if no tooltip
								if (tooltipModel.opacity === 0) {
									tooltipEl.style.opacity = 0;
									return;
								}

								if (tooltipModel.body) {
									const {x: xVal, y: yVal} =
										context.tooltip.dataPoints[0].parsed;
									let innerHtml = `
									<div style="display: flex; flex-direction: column; gap: 8px">
										<div>
											<div>Game ${xVal}</div>
											<div>Win Rate: <b>${yVal}%</b></div>
										</div>
									`;

									context.tooltip.dataPoints.forEach((dataPoint, i) => {
										const renderResultsRow = (
											name,
											char,
											roundsWon,
											didWin,
											isP1 = false
										) => `
										<div style="display: flex; align-items: center; gap: 4px; width: 200px; background-color: #fff; border: 2px solid ${dataPoint.dataset.borderColor}; ${isP1 ? 'border-bottom: 0;' : ''}">
											<span style="flex-grow: 1; padding: 4px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden">${name}</span>
											<img src="../assets/icons/${char.code}.png" style="height: 24px; opacity: ${didWin ? 1 : 0.5}" />
											<span style="font-weight: bold; background-color: ${didWin ? '#23bc3d' : '#666'}; color: #fff; padding: 4px">${roundsWon}</span>
										</div>
										`;

										const {
											date,
											p1Char,
											p1Name,
											p1RoundsWon,
											p2Char,
											p2Name,
											p2RoundsWon,
											winner
										} = dataPoint.raw;

										innerHtml = `${innerHtml}
										<div style="display: flex; flex-direction: column">
											${renderResultsRow(p1Name, p1Char, p1RoundsWon, winner === 'P1', true)}
											${renderResultsRow(p2Name, p2Char, p2RoundsWon, winner === 'P2')}
											<div style="align-self: flex-end; font-size: 12px; font-weight: bold">${moment(date).format('YYYY-MM-DD HH:mm:ss')}</div>
										</div>`;
									});

									tooltipEl.innerHTML = `${innerHtml}</div>`;
								}

								const canvasRect = context.chart.canvas.getBoundingClientRect();
								let tooltipWidth = tooltipEl.offsetWidth;
								// on initial load, the tooltip width seems to be overly large before it's rendered
								// lazy fix is to just ignore tooltip width in this case, since it'll fix itself once rendered
								if (tooltipWidth > 1000) {
									tooltipWidth = 0;
								}
								let leftPos =
									canvasRect.left + window.pageXOffset + tooltipModel.caretX;
								// position tooltip to the left if it would overflow canvas to the right
								if (leftPos + tooltipWidth > canvasRect.right) {
									leftPos -= tooltipWidth;
								}
								let topPos =
									canvasRect.top + window.pageYOffset + tooltipModel.caretY;
								// position tooltip to the top if it's below the midpoint of the chart
								if (canvasRect.height / 2 < tooltipModel.caretY) {
									topPos -= tooltipEl.offsetHeight;
								}
								Object.assign(tooltipEl.style, {
									opacity: 1,
									position: 'absolute',
									fontSize: '14px',
									left: `${leftPos}px`,
									top: `${topPos}px`,
									padding: '4px',
									pointerEvents: 'none',
									backgroundColor: '#fcfcfc',
									color: '#000',
									border: '1px solid #999'
								});
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
					chart.options.scales.x.title.text =
						newValue === totalReplays.value
							? 'All games'
							: `Last ${newValue} games`;
					chart.update();
					syncChart(characterVisibility.value);
				},
				{immediate: true}
			);

			// toggle visibility of character
			watch(
				characterVisibility,
				(newValue) => {
					syncChart(newValue);
				},
				{deep: true}
			);
		});

		return {
			ALL_CHAR_KEY: ref(ALL_CHAR_KEY),
			characterData,
			characterVisibility,
			gameDisplayCount,
			gameDisplayOptions,
			resetZoom,
			totalReplays
		};
	}
});

app.component('Dropdown', {
	props: {
		modelValue: {
			type: [Number, String],
			default: ''
		},
		options: {
			type: Array,
			required: true
		},
		placeholder: {
			type: String,
			default: ''
		}
	},
	emits: ['update:modelValue'],
	setup(props, {emit}) {
		const dropdown = ref(null);
		const isOpen = ref(false);

		const selectedOption = computed(() =>
			props.options.find((option) => option.value === props.modelValue)
		);

		const selectOption = (option) => {
			emit('update:modelValue', option.value);
			isOpen.value = false;
		};

		const handleClickOutside = (e) => {
			if (!dropdown.value?.contains(e.target)) {
				isOpen.value = false;
			}
		};

		onMounted(() => {
			document.addEventListener('click', handleClickOutside);
		});

		onBeforeUnmount(() => {
			document.removeEventListener('click', handleClickOutside);
		});

		return {
			dropdown,
			isOpen,
			selectedOption,
			selectOption
		};
	},
	template: `
	<div ref="dropdown" class="dropdown">
		<div class="dropdown-selector" @click="isOpen = !isOpen">
			<span>{{selectedOption?.text || placeholder}}</span>
			<span class="dropdown-caret">▼</span>
		</div>
		<div v-if="isOpen" class="dropdown-list">
			<div
				v-for="option in options"
				:key="option.value"
				class="dropdown-option"
				:class="{selected: option.value === modelValue}"
				@click="selectOption(option)">
				<img
					v-if="option.image"
					:src="option.image"
					:alt="option.text"
					class="dropdown-option-image"
				/>
				{{option.text}}
			</div>
		</div>
	</div>
	`
});

app.mount('#app');
