const Search = {
	props: {
		items: {
			type: Array,
			required: true
		},
		limit: {
			type: Number,
			default: 100
		},
		searchField: {
			type: String,
			default: ''
		}
	},
	setup(props, {emit}) {
		const search = ref(null);
		const query = ref('');

		const clear = () => {
			query.value = '';
			search.value?.focus();
		};

		const filterItems = () => {
			const filteredItems = query.value
				? props.items.filter((item) =>
						(props.searchField ? item[props.searchField] : item)
							?.toLowerCase()
							?.includes(query.value.toLowerCase())
					)
				: props.items;

			emit('search', filteredItems.slice(0, props.limit));
		};

		watch(query, filterItems, {immediate: true});

		return {
			clear,
			query,
			search
		};
	},
	template: `
	<div class="search-wrapper">
		<input ref="search" type="text" v-model="query" class="search" />
		<button v-if="query" class="clear-button" @click.stop="clear">✕</button>
	</div>
	`
};
