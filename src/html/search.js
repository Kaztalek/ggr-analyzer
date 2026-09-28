const Search = {
	props: {
		items: {
			type: Array,
			required: true
		},
		searchField: {
			type: String,
			default: ''
		}
	},
	setup(props, {emit}) {
		const query = ref('');

		const filterItems = () => {
			const filteredItems = props.items.filter((item) => {
				return (props.searchField ? item[props.searchField] : item)
					?.toLowerCase()
					?.includes(query.value.toLowerCase());
			});

			emit('search', filteredItems);
		};

		watch(query, filterItems);

		return {
			query
		};
	},
	template: `
		<input type="search" v-model="query" />
	`
};
