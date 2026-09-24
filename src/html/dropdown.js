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
		}
	},
	emits: ['update:modelValue'],
	setup(props, {emit}) {
		const dropdown = ref(null);
		const isOpen = ref(false);
		const highlightedIndex = ref(0);

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
			if (newValue >= 0 && newValue < props.options.length) {
				highlightedIndex.value = newValue;
			}
		};

		const handleClickOutside = (e) => {
			if (!dropdown.value?.contains(e.target)) {
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
					const option = props.options[highlightedIndex.value];
					if (option && isOpen.value) {
						e.preventDefault();
						selectOption(option);
					}
					break;
				case 'Escape':
					isOpen.value = false;
					break;
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
			handleKeydown,
			highlightedIndex,
			isOpen,
			selectedOption,
			selectOption
		};
	},
	template: `
  <div>
    <span v-if="label" class="dropdown-label">{{label}}</span>
    <div ref="dropdown" class="dropdown">
      <button
        role="combobox"
        class="dropdown-selector"
        :class="{'has-image': !!selectedOption.image}"
        @click="isOpen = !isOpen"
        @keydown="handleKeydown">
        <img
          v-if="selectedOption.image"
          :src="selectedOption.image"
        />
        <span>{{selectedOption?.text || placeholder}}</span>
        <span class="dropdown-caret">▼</span>
      </button>
      <div v-if="isOpen" role="listbox" class="dropdown-list">
        <div
          v-for="(option, i) in options"
          :key="option.value"
          role="option"
          class="dropdown-option"
          :class="{selected: option.value === modelValue, highlighted: i === highlightedIndex, 'has-image': !!option.image}"
          @click="selectOption(option, i)">
          <img
            v-if="option.image"
            :src="option.image"
            :alt="option.text"
          />
          {{option.text}}
        </div>
      </div>
    </div>
  </div>
  `
};
