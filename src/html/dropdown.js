const Dropdown = {
	props: {
		label: {
			type: String,
			default: ''
		},
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
		},
		// what field to search by
		// if passed, enables search
		searchField: {
			type: String,
			default: ''
		}
	},
	emits: ['update:modelValue'],
	setup(props, {emit}) {
		const dropdown = ref(null);
		const isOpen = ref(false);
		const highlightedIndex = ref(0);
		const filteredOptions = ref([]);

		const selectedOption = computed(() =>
			props.options.find((option) => option.value === props.modelValue)
		);

		const selectOption = (option, index) => {
			emit('update:modelValue', option.value);
			isOpen.value = false;
			if (index != null) {
				highlightedIndex.value = index;
			}
		};

		const moveIndex = (amount) => {
			const newValue = highlightedIndex.value + amount;
			if (newValue >= 0 && newValue < filteredOptions.value.length) {
				highlightedIndex.value = newValue;
			}
		};

		const handleClickOutside = (e) => {
			if (isOpen.value && !dropdown.value?.contains(e.target)) {
				isOpen.value = false;
			}
		};

		const handleKeydown = (e) => {
			switch (e.key) {
				case 'ArrowUp':
					moveIndex(-1);
					break;
				case 'ArrowDown':
					moveIndex(1);
					break;
				case 'Enter':
					const option = filteredOptions.value[highlightedIndex.value];
					if (option && isOpen.value) {
						e.preventDefault();
						selectOption(option);
						dropdown.value.querySelector('.dropdown-selector')?.focus();
					}
					break;
				case 'Escape':
					isOpen.value = false;
					break;
			}
		};

		const handleSearchKeydown = (e) => {
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				e.preventDefault();
			}
		};

		onMounted(() => {
			document.addEventListener('click', handleClickOutside);
		});

		onBeforeUnmount(() => {
			document.removeEventListener('click', handleClickOutside);
		});

		watch(
			() => props.options,
			(newValue) => {
				filteredOptions.value = newValue;
			},
			{immediate: true}
		);

		// update highlighted item as the options list filters
		// if the selected option exists, move to selected item
		// otherwise, reset back to 0 (top of list)
		watch(filteredOptions, () => {
			const optionIndex = filteredOptions.value.findIndex(
				(option) => option.value === props.modelValue
			);
			highlightedIndex.value = optionIndex === -1 ? 0 : optionIndex;
		});

		return {
			dropdown,
			filteredOptions,
			handleKeydown,
			handleSearchKeydown,
			highlightedIndex,
			isOpen,
			selectedOption,
			selectOption
		};
	},
	template: `
	<div @keydown="handleKeydown">
		<span
			v-if="label"
			class="dropdown-label"
			>{{label}}</span
		>
		<div
			ref="dropdown"
			class="dropdown">
			<button
				role="combobox"
				class="primary-button dropdown-selector"
				:class="{'has-image': !!selectedOption.image}"
				@click="isOpen = !isOpen">
				<img
					v-if="selectedOption.image"
					:src="selectedOption.image" />
				<span>{{selectedOption?.text || placeholder}}</span>
				<span class="dropdown-caret">▼</span>
			</button>
			<div
				v-if="isOpen"
				role="listbox"
				class="dropdown-list">
				<div
					v-if="searchField"
					class="search-container">
					<search
						:items="options"
						:searchField="searchField"
						@search="filteredOptions = $event"
						@keydown="handleSearchKeydown"></search>
				</div>
				<div
					v-for="(option, i) in filteredOptions"
					:key="option.value"
					role="option"
					class="dropdown-option"
					:class="{selected: option.value === modelValue, highlighted: i === highlightedIndex, 'has-image': !!option.image}"
					@click="selectOption(option, i)">
					<img
						v-if="option.image"
						:src="option.image"
						:alt="option.text" />
					{{option.text}}
				</div>
				<div
					v-if="!filteredOptions.length"
					class="dropdown-no-results">
					No results
				</div>
			</div>
		</div>
	</div>
	`
};
