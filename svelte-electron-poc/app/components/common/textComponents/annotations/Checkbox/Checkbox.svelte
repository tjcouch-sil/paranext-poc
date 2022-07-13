<script lang="ts">
	import { getContentById, updateContentById } from "@app/util/Util";
	import { onMount } from "svelte";

	export let ownerId: string | undefined = undefined;
	export let ownerField: string | undefined = undefined;

	let checked = false;

	// TODO: find a reactive way to do this later
	// Maybe we will use stores for annotations and will be able to bind:checked appropriately https://svelte.dev/tutorial/checkbox-inputs
	onMount(() => {
		if (ownerField) {
			const owner = getContentById(ownerId);
			if (owner) {
				checked = owner[ownerField] as boolean;
			}
		}
	});

	const onInput = (e: Event) => {
		if (!ownerId || !ownerField) {
			return;
		}

		const checkbox = e.target as HTMLInputElement;
		updateContentById(ownerId, (owner) => {
			// For some reason, typescript isn't seeing that ownerField can't be undefined here, so we are casting the type
			if (owner[ownerField as string] !== checkbox.checked) {
				owner[ownerField as string] = checkbox.checked;
				return true;
			}
			return false;
		});
	};
</script>

<span class="checkbox-annotation {checked ? 'checked' : ''}">
	<input type="checkbox" bind:checked on:input={onInput} />
	<slot />
</span>

<style lang="scss">
	.checked {
		border: 1px solid black;
	}
</style>
