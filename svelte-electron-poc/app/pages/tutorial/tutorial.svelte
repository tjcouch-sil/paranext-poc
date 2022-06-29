<script lang="ts">
	import Menu from "@components/common/menu/menu.svelte";

	let name = "World";
</script>

<Menu />

<div>Hello {name.toUpperCase()}!</div>
