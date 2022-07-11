<script lang="ts">
	import { getContentById } from "@app/util/Util";
	import { onMount } from "svelte";

	export let ownerId: string | undefined = undefined;
	export let ownerField: string | undefined = undefined;

	let highlight = false;

	// TODO: find a reactive way to do this later
	onMount(() => {
		if (ownerField) {
			const owner = getContentById(ownerId);
			if (owner) {
				highlight = (owner.contents as string).includes(ownerField);
			}
		}
	});
</script>

<span class="highlight-annotation {highlight ? 'highlight' : ''}">
	<slot />
</span>

<style lang="scss">
	.highlight {
		background-color: yellow;
	}
</style>
